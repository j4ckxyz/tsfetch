#!/usr/bin/env node

import { parseCliArgs, helpText } from "./cli";
import { createPalette } from "./theme";
import { fetchTailscaleStatus } from "./tailscale";
import { deriveSummary } from "./metrics";
import { renderSummary, renderSummaryJson } from "./render";
import { VERSION } from "./version";
import { applyPrivacy } from "./privacy";

function printError(message: string): void {
  process.stderr.write(`${message}\n`);
}

function main(): void {
  let options;
  try {
    options = parseCliArgs(process.argv.slice(2));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid CLI options";
    printError(message);
    printError("");
    printError(helpText("tsfetch"));
    process.exitCode = 1;
    return;
  }

  if (options.help) {
    process.stdout.write(`${helpText("tsfetch")}\n`);
    return;
  }

  if (options.version) {
    process.stdout.write(`${VERSION}\n`);
    return;
  }

  const result = fetchTailscaleStatus();

  if (result.kind !== "ok") {
    if (options.json) {
      process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
      process.exitCode = 1;
      return;
    }

    if (result.kind === "not-installed") {
      printError("tsfetch: tailscale CLI is not installed or not on PATH.");
      printError("Install Tailscale first: https://tailscale.com/download");
      process.exitCode = 1;
      return;
    }

    printError(`tsfetch: ${result.message}`);
    if (result.stderr.trim()) {
      printError(result.stderr.trim());
    }
    if (result.stdout.trim()) {
      printError(result.stdout.trim());
    }
    process.exitCode = 1;
    return;
  }

  const rawSummary = deriveSummary(result.status, result.warnings);
  const summary = options.privateMode ? applyPrivacy(rawSummary) : rawSummary;
  if (options.json) {
    process.stdout.write(`${renderSummaryJson(summary)}\n`);
  } else {
    const palette = createPalette(options);
    process.stdout.write(`${renderSummary(summary, options, palette)}\n`);
  }

  if (!summary.running) {
    process.exitCode = 1;
  }
}

main();
