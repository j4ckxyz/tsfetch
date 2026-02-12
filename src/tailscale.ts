import { spawnSync } from "child_process";
import { TailscaleFetchResult, TailscaleStatus } from "./types";

const MAX_BUFFER = 16 * 1024 * 1024;

function extractJsonObject(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }

  try {
    JSON.parse(trimmed);
    return trimmed;
  } catch {
    // Try substring extraction below.
  }

  const firstBrace = input.indexOf("{");
  const lastBrace = input.lastIndexOf("}");
  if (firstBrace < 0 || lastBrace <= firstBrace) {
    return null;
  }

  const candidate = input.slice(firstBrace, lastBrace + 1);
  try {
    JSON.parse(candidate);
    return candidate;
  } catch {
    return null;
  }
}

function parseStatus(raw: string): TailscaleStatus | null {
  const json = extractJsonObject(raw);
  if (!json) {
    return null;
  }

  try {
    const value = JSON.parse(json);
    if (!value || typeof value !== "object") {
      return null;
    }
    return value as TailscaleStatus;
  } catch {
    return null;
  }
}

export function fetchTailscaleStatus(): TailscaleFetchResult {
  const command = spawnSync("tailscale", ["status", "--json"], {
    encoding: "utf8",
    maxBuffer: MAX_BUFFER,
  });

  if (command.error) {
    const error = command.error as NodeJS.ErrnoException;
    if (error.code === "ENOENT") {
      return {
        kind: "not-installed",
        message: "tailscale CLI not found in PATH",
      };
    }
    return {
      kind: "command-failed",
      message: error.message,
      stdout: command.stdout ?? "",
      stderr: command.stderr ?? "",
      exitCode: command.status,
    };
  }

  const stdout = command.stdout ?? "";
  const stderr = command.stderr ?? "";
  const combined = `${stdout}\n${stderr}`;

  const parsed = parseStatus(stdout) ?? parseStatus(stderr) ?? parseStatus(combined);
  if (parsed) {
    const warnings = stderr
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    return {
      kind: "ok",
      status: parsed,
      warnings,
      exitCode: command.status,
    };
  }

  if ((command.status ?? 0) !== 0) {
    return {
      kind: "command-failed",
      message: "tailscale status --json failed",
      stdout,
      stderr,
      exitCode: command.status,
    };
  }

  return {
    kind: "invalid-json",
    message: "tailscale output did not include valid JSON",
    stdout,
    stderr,
    exitCode: command.status,
  };
}
