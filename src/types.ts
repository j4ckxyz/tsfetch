export type ThemeMode = "auto" | "light" | "dark";

export interface CliOptions {
  verbose: boolean;
  json: boolean;
  noColor: boolean;
  privateMode: boolean;
  theme: ThemeMode;
  help: boolean;
  version: boolean;
}

export interface TailnetStatus {
  Name?: string;
  MagicDNSSuffix?: string;
  MagicDNSEnabled?: boolean;
}

export interface ExitNodeStatus {
  ID?: string;
  Online?: boolean;
  TailscaleIPs?: string[];
}

export interface PeerStatus {
  ID?: string;
  HostName?: string;
  DNSName?: string;
  OS?: string;
  UserID?: number;
  TailscaleIPs?: string[];
  AllowedIPs?: string[];
  PrimaryRoutes?: string[];
  Relay?: string;
  CurAddr?: string;
  Online?: boolean;
  Active?: boolean;
  ShareeNode?: boolean;
  ExitNode?: boolean;
  ExitNodeOption?: boolean;
  LastSeen?: string;
  LastWrite?: string;
  LastHandshake?: string;
  RxBytes?: number;
  TxBytes?: number;
  KeyExpiry?: string;
  InEngine?: boolean;
  InNetworkMap?: boolean;
  Expired?: boolean;
}

export interface UserProfile {
  ID?: number;
  LoginName?: string;
  DisplayName?: string;
  ProfilePicURL?: string;
  Roles?: string[];
}

export interface TailscaleStatus {
  Version?: string;
  BackendState?: string;
  HaveNodeKey?: boolean;
  AuthURL?: string;
  TailscaleIPs?: string[];
  Self?: PeerStatus;
  ExitNodeStatus?: ExitNodeStatus;
  Health?: string[];
  MagicDNSSuffix?: string;
  CurrentTailnet?: TailnetStatus;
  CertDomains?: string[];
  Peer?: Record<string, PeerStatus>;
  User?: Record<string, UserProfile>;
}

export type TailscaleFetchResult =
  | {
      kind: "ok";
      status: TailscaleStatus;
      warnings: string[];
      exitCode: number | null;
    }
  | {
      kind: "not-installed";
      message: string;
    }
  | {
      kind: "command-failed";
      message: string;
      stdout: string;
      stderr: string;
      exitCode: number | null;
    }
  | {
      kind: "invalid-json";
      message: string;
      stdout: string;
      stderr: string;
      exitCode: number | null;
    };

export interface NodeTraffic {
  name: string;
  rxBytes: number;
  txBytes: number;
  totalBytes: number;
  online: boolean;
}

export interface DerivedSummary {
  generatedAt: string;
  backendState: string;
  running: boolean;
  warnings: string[];
  health: string[];
  tailnet: {
    name: string;
    magicDnsSuffix: string;
    magicDnsEnabled: boolean;
  };
  self: {
    name: string;
    dnsName: string;
    os: string;
    online: boolean;
    relay: string;
    ipv4: string;
    ipv6: string;
    userId: number;
    userLogin: string;
    txBytes: number;
    rxBytes: number;
    lastWrite: string;
    lastHandshake: string;
  };
  versions: {
    daemon: string;
    localClientWarning: boolean;
  };
  counts: {
    totalNodes: number;
    peerNodes: number;
    onlineNodes: number;
    offlineNodes: number;
    yourNodes: number;
    sharedToYou: number;
    foreignNodes: number;
    distinctUsers: number;
    distinctOtherOwners: number;
    activePeers: number;
    connectedPeers: number;
    exitNodeOptions: number;
    subnetRoutes: number;
    routeAdvertisers: number;
    keyExpirySoon: number;
  };
  lists: {
    onlineNames: string[];
    offlineNames: string[];
  };
  osBreakdown: Record<string, number>;
  topTraffic: NodeTraffic[];
  exitNode: {
    selected: boolean;
    online: boolean;
    ips: string[];
  };
}
