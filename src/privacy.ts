import { DerivedSummary } from "./types";

function redactEmail(value: string): string {
  return "[redacted]";
}

function redactNodeName(index: number): string {
  return `node-${index + 1}`;
}

function redactList(values: string[]): string[] {
  return values.map((_, index) => redactNodeName(index));
}

export function applyPrivacy(summary: DerivedSummary): DerivedSummary {
  const tailnetName = summary.tailnet.name.includes("@") ? redactEmail(summary.tailnet.name) : "[redacted]";

  const topTraffic = summary.topTraffic.map((item, index) => ({
    ...item,
    name: redactNodeName(index),
  }));

  return {
    ...summary,
    tailnet: {
      ...summary.tailnet,
      name: tailnetName,
    },
    self: {
      ...summary.self,
      name: "[redacted]",
      dnsName: "[redacted]",
      userLogin: summary.self.userLogin.includes("@") ? redactEmail(summary.self.userLogin) : "[redacted]",
      ipv4: "[redacted]",
      ipv6: "[redacted]",
    },
    lists: {
      onlineNames: redactList(summary.lists.onlineNames),
      offlineNames: redactList(summary.lists.offlineNames),
    },
    topTraffic,
  };
}
