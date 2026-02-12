import { DerivedSummary, NodeTraffic, PeerStatus, TailscaleStatus } from "./types";

const SOON_DAYS = 30;

function asPeerList(status: TailscaleStatus): PeerStatus[] {
  return Object.values(status.Peer ?? {});
}

function cleanDnsName(raw: string | undefined): string {
  if (!raw) {
    return "";
  }
  return raw.endsWith(".") ? raw.slice(0, -1) : raw;
}

function displayNameForPeer(peer: PeerStatus, magicSuffix: string): string {
  const dns = cleanDnsName(peer.DNSName);
  if (dns) {
    if (magicSuffix && dns.endsWith(`.${magicSuffix}`)) {
      return dns.slice(0, dns.length - magicSuffix.length - 1);
    }
    return dns;
  }

  if (peer.HostName) {
    return peer.HostName;
  }

  const firstIp = peer.TailscaleIPs?.[0];
  if (firstIp) {
    return firstIp;
  }

  return "unknown-node";
}

function pickIp(ips: string[] | undefined, family: 4 | 6): string {
  if (!ips || ips.length === 0) {
    return "-";
  }

  const match = ips.find((ip) => (family === 4 ? !ip.includes(":") : ip.includes(":")));
  return match ?? "-";
}

function countRouteAdvertisers(peers: PeerStatus[]): number {
  return peers.reduce((count, peer) => {
    const allowed = peer.AllowedIPs ?? [];
    const advertisesDefault = allowed.includes("0.0.0.0/0") || allowed.includes("::/0");
    return advertisesDefault ? count + 1 : count;
  }, 0);
}

function countSubnetRoutes(peers: PeerStatus[]): number {
  return peers.reduce((count, peer) => count + (peer.PrimaryRoutes?.length ?? 0), 0);
}

function parseDate(value: string | undefined): Date | null {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
}

function countKeyExpirySoon(peers: PeerStatus[], self: PeerStatus | undefined): number {
  const now = Date.now();
  const maxMs = SOON_DAYS * 24 * 60 * 60 * 1000;
  const nodes = [...peers];
  if (self) {
    nodes.push(self);
  }

  return nodes.reduce((count, node) => {
    const expiry = parseDate(node.KeyExpiry);
    if (!expiry) {
      return count;
    }
    const delta = expiry.getTime() - now;
    if (delta <= maxMs) {
      return count + 1;
    }
    return count;
  }, 0);
}

function computeTraffic(peers: PeerStatus[], magicSuffix: string): NodeTraffic[] {
  return peers
    .map((peer) => {
      const rxBytes = Number(peer.RxBytes ?? 0);
      const txBytes = Number(peer.TxBytes ?? 0);
      return {
        name: displayNameForPeer(peer, magicSuffix),
        rxBytes,
        txBytes,
        totalBytes: rxBytes + txBytes,
        online: Boolean(peer.Online),
      };
    })
    .sort((a, b) => b.totalBytes - a.totalBytes)
    .slice(0, 5);
}

function computeOsBreakdown(peers: PeerStatus[], self: PeerStatus | undefined): Record<string, number> {
  const map = new Map<string, number>();
  const nodes = [...peers];
  if (self) {
    nodes.push(self);
  }

  for (const node of nodes) {
    const os = node.OS || "unknown";
    map.set(os, (map.get(os) ?? 0) + 1);
  }

  return Object.fromEntries(
    [...map.entries()].sort((a, b) => {
      if (b[1] !== a[1]) {
        return b[1] - a[1];
      }
      return a[0].localeCompare(b[0]);
    }),
  );
}

export function deriveSummary(status: TailscaleStatus, warnings: string[]): DerivedSummary {
  const peers = asPeerList(status);
  const self = status.Self;
  const selfUserId = self?.UserID ?? 0;

  const magicSuffix =
    status.CurrentTailnet?.MagicDNSSuffix ??
    status.MagicDNSSuffix ??
    (self?.DNSName ? cleanDnsName(self.DNSName).split(".").slice(1).join(".") : "");

  const selfDisplayName = self ? displayNameForPeer(self, magicSuffix) : "unknown";

  const onlinePeers = peers.filter((peer) => Boolean(peer.Online));
  const offlinePeers = peers.filter((peer) => !peer.Online);
  const onlineNodes = onlinePeers.length + (self?.Online ? 1 : 0);
  const totalNodes = peers.length + (self ? 1 : 0);

  const yourNodes = peers.filter((peer) => peer.UserID === selfUserId).length + (self ? 1 : 0);
  const sharedToYou = peers.filter((peer) => Boolean(peer.ShareeNode)).length;
  const foreignNodes = peers.filter((peer) => peer.UserID !== undefined && peer.UserID !== selfUserId).length;

  const otherOwnerIds = new Set<number>();
  for (const peer of peers) {
    if (peer.UserID !== undefined && peer.UserID !== selfUserId) {
      otherOwnerIds.add(peer.UserID);
    }
  }

  const onlineNames = onlinePeers.map((peer) => displayNameForPeer(peer, magicSuffix)).sort((a, b) =>
    a.localeCompare(b),
  );
  const offlineNames = offlinePeers.map((peer) => displayNameForPeer(peer, magicSuffix)).sort((a, b) =>
    a.localeCompare(b),
  );

  const distinctUsersFromStatus = Object.keys(status.User ?? {}).length;
  const distinctUsers =
    distinctUsersFromStatus > 0
      ? distinctUsersFromStatus
      : new Set(peers.map((peer) => peer.UserID).filter((id): id is number => typeof id === "number")).size +
        (self?.UserID ? 1 : 0);

  const userLogin =
    (selfUserId && status.User?.[String(selfUserId)]?.LoginName) ||
    (selfUserId && status.User?.[selfUserId]?.LoginName) ||
    "";

  return {
    generatedAt: new Date().toISOString(),
    backendState: status.BackendState ?? "Unknown",
    running: status.BackendState === "Running",
    warnings,
    health: status.Health ?? [],
    tailnet: {
      name: status.CurrentTailnet?.Name ?? "-",
      magicDnsSuffix: magicSuffix || "-",
      magicDnsEnabled: Boolean(status.CurrentTailnet?.MagicDNSEnabled),
    },
    self: {
      name: selfDisplayName,
      dnsName: cleanDnsName(self?.DNSName),
      os: self?.OS ?? "-",
      online: Boolean(self?.Online),
      relay: self?.Relay ?? "-",
      ipv4: pickIp(self?.TailscaleIPs, 4),
      ipv6: pickIp(self?.TailscaleIPs, 6),
      userId: selfUserId,
      userLogin: userLogin || "-",
      txBytes: Number(self?.TxBytes ?? 0),
      rxBytes: Number(self?.RxBytes ?? 0),
      lastWrite: self?.LastWrite ?? "",
      lastHandshake: self?.LastHandshake ?? "",
    },
    versions: {
      daemon: status.Version ?? "-",
      localClientWarning: warnings.some((warning) => warning.toLowerCase().includes("client version")),
    },
    counts: {
      totalNodes,
      peerNodes: peers.length,
      onlineNodes,
      offlineNodes: Math.max(totalNodes - onlineNodes, 0),
      yourNodes,
      sharedToYou,
      foreignNodes,
      distinctUsers,
      distinctOtherOwners: otherOwnerIds.size,
      activePeers: peers.filter((peer) => Boolean(peer.Active)).length,
      connectedPeers: peers.filter((peer) => Boolean(peer.InEngine)).length,
      exitNodeOptions: peers.filter((peer) => Boolean(peer.ExitNodeOption)).length,
      subnetRoutes: countSubnetRoutes(peers),
      routeAdvertisers: countRouteAdvertisers(peers),
      keyExpirySoon: countKeyExpirySoon(peers, self),
    },
    lists: {
      onlineNames,
      offlineNames,
    },
    osBreakdown: computeOsBreakdown(peers, self),
    topTraffic: computeTraffic(peers, magicSuffix),
    exitNode: {
      selected: Boolean(status.ExitNodeStatus),
      online: Boolean(status.ExitNodeStatus?.Online),
      ips: status.ExitNodeStatus?.TailscaleIPs ?? [],
    },
  };
}
