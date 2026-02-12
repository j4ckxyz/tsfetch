import { CliOptions, DerivedSummary, NodeTraffic } from "./types";
import { renderLogo } from "./logo";
import { Palette, stripAnsi } from "./theme";

function visibleLength(value: string): number {
  return stripAnsi(value).length;
}

function combineColumns(left: string[], right: string[], gap = 3): string {
  const leftWidth = left.reduce((max, line) => Math.max(max, visibleLength(line)), 0);
  const rowCount = Math.max(left.length, right.length);
  const output: string[] = [];

  for (let i = 0; i < rowCount; i += 1) {
    const leftLine = left[i] ?? "";
    const rightLine = right[i] ?? "";
    const padding = " ".repeat(Math.max(0, leftWidth - visibleLength(leftLine)));

    if (!rightLine) {
      output.push(leftLine);
      continue;
    }

    output.push(`${leftLine}${padding}${" ".repeat(gap)}${rightLine}`.trimEnd());
  }

  return output.join("\n");
}

function fmtBytes(value: number): string {
  if (!Number.isFinite(value) || value <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB", "TB", "PB"];
  let amount = value;
  let unitIndex = 0;

  while (amount >= 1024 && unitIndex < units.length - 1) {
    amount /= 1024;
    unitIndex += 1;
  }

  if (amount >= 100 || unitIndex === 0) {
    return `${Math.round(amount)} ${units[unitIndex]}`;
  }

  return `${amount.toFixed(1)} ${units[unitIndex]}`;
}

function fmtAge(raw: string): string {
  if (!raw || raw.startsWith("0001-01-01")) {
    return "-";
  }

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  const deltaSec = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (deltaSec < 60) {
    return `${deltaSec}s ago`;
  }

  const minutes = Math.floor(deltaSec / 60);
  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function compactList(values: string[], limit = 6): string {
  if (values.length === 0) {
    return "-";
  }

  if (values.length <= limit) {
    return values.join(", ");
  }

  const visible = values.slice(0, limit).join(", ");
  return `${visible} +${values.length - limit} more`;
}

function formatOsBreakdown(osBreakdown: Record<string, number>): string {
  const entries = Object.entries(osBreakdown);
  if (entries.length === 0) {
    return "-";
  }

  return entries.map(([os, count]) => `${os}:${count}`).join(" | ");
}

function formatTrafficList(traffic: NodeTraffic[]): string {
  if (traffic.length === 0) {
    return "-";
  }

  return traffic
    .slice(0, 4)
    .map((entry) => `${entry.name} (${fmtBytes(entry.totalBytes)})`)
    .join(" | ");
}

function row(palette: Palette, icon: string, label: string, value: string): string {
  return `${palette.muted(icon.padEnd(6, " "))} ${palette.label(label.padEnd(12, " "))} ${value}`;
}

export function renderSummary(summary: DerivedSummary, opts: CliOptions, palette: Palette): string {
  const logo = renderLogo(palette);

  const state = summary.running ? palette.good("RUNNING") : palette.bad(summary.backendState.toUpperCase());
  const health =
    summary.health.length === 0 ? palette.good("ok") : palette.warn(`${summary.health.length} issue(s)`);
  const warnings =
    summary.warnings.length === 0 ? palette.good("none") : palette.warn(`${summary.warnings.length} warning(s)`);
  const magicDns = summary.tailnet.magicDnsEnabled ? palette.good("enabled") : palette.warn("disabled");
  const exitNodeState = summary.exitNode.selected
    ? summary.exitNode.online
      ? palette.good("active")
      : palette.warn("selected offline")
    : palette.value("none selected");

  const right: string[] = [
    palette.title(`tsfetch  ${summary.self.name}`),
    row(palette, "[ST]", "State", state),
    row(
      palette,
      "[TN]",
      "Tailnet",
      `${palette.value(summary.tailnet.name)} (${summary.tailnet.magicDnsSuffix})`,
    ),
    row(palette, "[MD]", "MagicDNS", magicDns),
    row(palette, "[ME]", "This node", `${summary.self.os}  relay:${summary.self.relay}`),
    row(palette, "[IP]", "Addresses", `${summary.self.ipv4}  |  ${summary.self.ipv6}`),
    row(
      palette,
      "[ND]",
      "Nodes",
      `${summary.counts.totalNodes} total  |  ${palette.good(String(summary.counts.onlineNodes))} online  |  ${palette.warn(
        String(summary.counts.offlineNodes),
      )} offline`,
    ),
    row(
      palette,
      "[OWN]",
      "Ownership",
      `${summary.counts.yourNodes} yours  |  ${summary.counts.sharedToYou} shared-to-you  |  ${summary.counts.foreignNodes} foreign`,
    ),
    row(
      palette,
      "[USR]",
      "Users",
      `${summary.counts.distinctUsers} total  |  ${summary.counts.distinctOtherOwners} other owners`,
    ),
    row(
      palette,
      "[EX]",
      "Exit nodes",
      `${summary.counts.exitNodeOptions} available  |  ${exitNodeState}`,
    ),
    row(
      palette,
      "[RT]",
      "Routes",
      `${summary.counts.routeAdvertisers} default-route nodes  |  ${summary.counts.subnetRoutes} subnet routes`,
    ),
    row(
      palette,
      "[PE]",
      "Peers",
      `${summary.counts.activePeers} active  |  ${summary.counts.connectedPeers} connected  |  ${summary.counts.keyExpirySoon} key-expiry-soon`,
    ),
    row(
      palette,
      "[BW]",
      "Traffic",
      `${fmtBytes(summary.self.rxBytes)} rx  |  ${fmtBytes(summary.self.txBytes)} tx`,
    ),
    row(
      palette,
      "[TS]",
      "Last seen",
      `write ${fmtAge(summary.self.lastWrite)}  |  handshake ${fmtAge(summary.self.lastHandshake)}`,
    ),
    row(palette, "[HL]", "Health", health),
    row(palette, "[WR]", "Warnings", warnings),
    row(
      palette,
      "[VR]",
      "Version",
      summary.versions.localClientWarning
        ? `${summary.versions.daemon} ${palette.warn("(client/server mismatch)")}`
        : summary.versions.daemon,
    ),
  ];

  if (!summary.running) {
    right.push(row(palette, "[!!]", "Action", palette.warn("Run: tailscale up")));
  }

  if (opts.verbose) {
    right.push(row(palette, "[ON]", "Online", compactList(summary.lists.onlineNames, 7)));
    right.push(row(palette, "[OF]", "Offline", compactList(summary.lists.offlineNames, 7)));
    right.push(row(palette, "[OS]", "OS mix", formatOsBreakdown(summary.osBreakdown)));
    right.push(row(palette, "[TP]", "Top traffic", formatTrafficList(summary.topTraffic)));

    if (summary.health.length > 0) {
      for (const issue of summary.health.slice(0, 5)) {
        right.push(row(palette, "[H!]", "Health msg", palette.warn(issue)));
      }
    }

    if (summary.warnings.length > 0) {
      for (const warning of summary.warnings.slice(0, 5)) {
        right.push(row(palette, "[W!]", "Warning msg", palette.warn(warning)));
      }
    }
  }

  return combineColumns(logo, right, 3);
}

export function renderSummaryJson(summary: DerivedSummary): string {
  return JSON.stringify(summary, null, 2);
}
