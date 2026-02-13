import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import https from "node:https";
import { pipeline } from "node:stream/promises";
import { createWriteStream } from "node:fs";

const REPO = "j4ckxyz/tsfetch";

interface ReleaseAsset {
  name: string;
  browser_download_url: string;
}

interface LatestRelease {
  tag_name: string;
  assets: ReleaseAsset[];
}

function isPkgBinary(): boolean {
  return Boolean((process as NodeJS.Process & { pkg?: unknown }).pkg);
}

function requestText(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      {
        headers: {
          "User-Agent": "tsfetch-updater",
          Accept: "application/vnd.github+json",
        },
      },
      (res) => {
        if (!res.statusCode || res.statusCode >= 400) {
          reject(new Error(`HTTP ${res.statusCode ?? "?"} while requesting ${url}`));
          res.resume();
          return;
        }

        const chunks: Buffer[] = [];
        res.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
        res.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
      },
    );

    req.on("error", reject);
  });
}

function platformAssetCandidates(): string[] {
  const arch = os.arch();
  const platform = os.platform();

  if (platform === "darwin") {
    if (arch === "arm64") {
      return ["tsfetch-macos-arm64", "tsfetch-macos-x64"];
    }
    if (arch === "x64") {
      return ["tsfetch-macos-x64"];
    }
  }

  if (platform === "linux") {
    if (arch === "arm64") {
      return ["tsfetch-linux-arm64"];
    }
    if (arch === "x64") {
      return ["tsfetch-linux-x64"];
    }
  }

  if (platform === "win32") {
    if (arch === "arm64") {
      return ["tsfetch-win-arm64.exe", "tsfetch-win-x64.exe"];
    }

    if (arch === "x64") {
      return ["tsfetch-win-x64.exe"];
    }
  }

  throw new Error(`Unsupported platform: ${platform}/${arch}`);
}

async function getLatestRelease(): Promise<LatestRelease> {
  const url = `https://api.github.com/repos/${REPO}/releases/latest`;
  const payload = await requestText(url);
  const parsed = JSON.parse(payload) as LatestRelease;
  if (!parsed.tag_name) {
    throw new Error("Could not read latest release tag");
  }
  if (!Array.isArray(parsed.assets)) {
    throw new Error("Could not read release assets");
  }
  return parsed;
}

function pickReleaseAsset(release: LatestRelease): ReleaseAsset {
  const candidates = platformAssetCandidates();
  for (const candidate of candidates) {
    const asset = release.assets.find((entry) => entry.name === candidate);
    if (asset && asset.browser_download_url) {
      return asset;
    }
  }

  throw new Error(
    `No compatible release asset found. Looked for: ${candidates.join(", ")}`,
  );
}

async function downloadFile(url: string, destination: string): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const req = https.get(
      url,
      {
        headers: {
          "User-Agent": "tsfetch-updater",
          Accept: "application/octet-stream",
        },
      },
      async (res) => {
        if (
          res.statusCode &&
          [301, 302, 303, 307, 308].includes(res.statusCode) &&
          res.headers.location
        ) {
          res.resume();
          try {
            await downloadFile(res.headers.location, destination);
            resolve();
          } catch (error) {
            reject(error);
          }
          return;
        }

        if (!res.statusCode || res.statusCode >= 400) {
          reject(new Error(`HTTP ${res.statusCode ?? "?"} while downloading ${url}`));
          res.resume();
          return;
        }

        try {
          await pipeline(res, createWriteStream(destination));
          resolve();
        } catch (error) {
          reject(error);
        }
      },
    );

    req.on("error", reject);
  });
}

function currentBinaryPath(): string {
  if (isPkgBinary()) {
    return process.execPath;
  }

  const argvPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
  if (!argvPath || !fs.existsSync(argvPath)) {
    throw new Error("Cannot determine installed tsfetch binary path");
  }

  throw new Error(
    "Self-update is only supported for standalone binary installs. Please use install script for npm/dev installs.",
  );
}

export async function runSelfUpdate(): Promise<void> {
  const binaryPath = currentBinaryPath();
  const latest = await getLatestRelease();
  const asset = pickReleaseAsset(latest);
  const tag = latest.tag_name;
  const url = asset.browser_download_url;

  process.stdout.write(`Checking latest release... ${tag}\n`);
  process.stdout.write(`Downloading ${asset.name}...\n`);

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "tsfetch-update-"));
  const downloaded = path.join(tmpDir, asset.name);

  try {
    await downloadFile(url, downloaded);

    if (os.platform() !== "win32") {
      fs.chmodSync(downloaded, 0o755);
      fs.renameSync(downloaded, binaryPath);
      process.stdout.write("Update complete. Restart your terminal if needed.\n");
      return;
    }

    const replacement = `${binaryPath}.new`;
    fs.renameSync(downloaded, replacement);
    process.stdout.write(
      `Downloaded update to ${replacement}.\nClose tsfetch and replace current executable with this file.\n`,
    );
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}
