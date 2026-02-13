import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { Palette } from "./theme";

const PERCENT_LOGO = [
  "%%%%%        %%%%%        %%%%%  ",
  "%%%%%%%%%    %%%%%%%%%    %%%%%%%%%",
  "%%%%%%%%%    %%%%%%%%%    %%%%%%%%%",
  " %%%%%%%      %%%%%%%%     %%%%%%%%",
  "  %%%%%        %%%%%        %%%%%  ",
  "                                   ",
  "                                   ",
  " %%%%%%%       %%%%%%      %%%%%%% ",
  "%%%%%%%%%    %%%%%%%%%    %%%%%%%%%",
  "%%%%%%%%%    %%%%%%%%%    %%%%%%%%%",
  "%%%%%%%%%    %%%%%%%%%    %%%%%%%%%",
  "  %%%%%        %%%%%        %%%%%  ",
  "                                   ",
  "                                   ",
  "  %%%%%        %%%%%        %%%%%  ",
  " %%%%%%%     %%%%%%%%%     %%%%%%%%",
  "%%%%%%%%%    %%%%%%%%%    %%%%%%%%%",
  "%%%%%%%%%    %%%%%%%%%    %%%%%%%%%",
  "  %%%%%       %%%%%%%       %%%%%  ",
];

const LIGHT_THEME_SVG = `<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" id="Layer_1" x="0" y="0" version="1.1" viewBox="0 0 512 512"><style>.st0{opacity:.2;enable-background:new}</style><path fill="#f0f0f0" d="M65.6 127.7c35.3 0 63.9-28.6 63.9-63.9S100.9 0 65.6 0 1.8 28.6 1.8 63.9s28.6 63.8 63.8 63.8" class="st0"/><path fill="#f0f0f0" d="M65.6 318.1c35.3 0 63.9-28.6 63.9-63.9s-28.6-63.9-63.9-63.9S1.8 219 1.8 254.2s28.6 63.9 63.8 63.9"/><path fill="#f0f0f0" d="M65.6 512c35.3 0 63.9-28.6 63.9-63.9s-28.6-63.9-63.9-63.9-63.8 28.7-63.8 63.9S30.4 512 65.6 512" class="st0"/><path fill="#f0f0f0" d="M257.2 318.1c35.3 0 63.9-28.6 63.9-63.9s-28.6-63.9-63.9-63.9-63.9 28.6-63.9 63.9 28.6 63.9 63.9 63.9m0 193.9c35.3 0 63.9-28.6 63.9-63.9s-28.6-63.9-63.9-63.9-63.9 28.6-63.9 63.9 28.6 63.9 63.9 63.9"/><path fill="#f0f0f0" d="M257.2 127.7c35.3 0 63.9-28.6 63.9-63.9S292.5 0 257.2 0s-63.9 28.6-63.9 63.9 28.6 63.8 63.9 63.8m189.2 0c35.3 0 63.9-28.6 63.9-63.9S481.6 0 446.4 0c-35.3 0-63.9 28.6-63.9 63.9s28.6 63.8 63.9 63.8" class="st0"/><path fill="#f0f0f0" d="M446.4 318.1c35.3 0 63.9-28.6 63.9-63.9s-28.6-63.9-63.9-63.9-63.9 28.6-63.9 63.9 28.6 63.9 63.9 63.9"/><path fill="#f0f0f0" d="M446.4 512c35.3 0 63.9-28.6 63.9-63.9s-28.6-63.9-63.9-63.9-63.9 28.6-63.9 63.9 28.6 63.9 63.9 63.9" class="st0"/></svg>`;

const DARK_THEME_SVG = `<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" id="Layer_1" x="0" y="0" version="1.1" viewBox="0 0 512 512"><style>.st0{opacity:.2;enable-background:new}</style><path d="M65.6 127.7c35.3 0 63.9-28.6 63.9-63.9S100.9 0 65.6 0 1.8 28.6 1.8 63.9s28.6 63.8 63.8 63.8" class="st0"/><path d="M65.6 318.1c35.3 0 63.9-28.6 63.9-63.9s-28.6-63.9-63.9-63.9S1.8 219 1.8 254.2s28.6 63.9 63.8 63.9"/><path d="M65.6 512c35.3 0 63.9-28.6 63.9-63.9s-28.6-63.9-63.9-63.9-63.8 28.7-63.8 63.9S30.4 512 65.6 512" class="st0"/><path d="M257.2 318.1c35.3 0 63.9-28.6 63.9-63.9s-28.6-63.9-63.9-63.9-63.9 28.6-63.9 63.9 28.6 63.9 63.9 63.9m0 193.9c35.3 0 63.9-28.6 63.9-63.9s-28.6-63.9-63.9-63.9-63.9 28.6-63.9 63.9 28.6 63.9 63.9 63.9"/><path d="M257.2 127.7c35.3 0 63.9-28.6 63.9-63.9S292.5 0 257.2 0s-63.9 28.6-63.9 63.9 28.6 63.8 63.9 63.8m189.2 0c35.3 0 63.9-28.6 63.9-63.9S481.6 0 446.4 0c-35.3 0-63.9 28.6-63.9 63.9s28.6 63.8 63.9 63.8" class="st0"/><path d="M446.4 318.1c35.3 0 63.9-28.6 63.9-63.9s-28.6-63.9-63.9-63.9-63.9 28.6-63.9 63.9 28.6 63.9 63.9 63.9"/><path d="M446.4 512c35.3 0 63.9-28.6 63.9-63.9s-28.6-63.9-63.9-63.9-63.9 28.6-63.9 63.9 28.6 63.9 63.9 63.9" class="st0"/></svg>`;

function renderAsciiLogo(palette: Palette): string[] {
  return PERCENT_LOGO.map((line) => {
    if (!palette.enabled) {
      return line;
    }

    let rendered = "";
    for (const char of line) {
      if (char === "%") {
        rendered += palette.logo(char);
      } else {
        rendered += char;
      }
    }
    return rendered;
  });
}

function trimTrailingEmptyLines(lines: string[]): string[] {
  const output = [...lines];
  while (output.length > 0 && output[output.length - 1]?.trim() === "") {
    output.pop();
  }
  return output;
}

function logLogoDebug(message: string): void {
  if (process.env.TSFETCH_LOGO_DEBUG === "1") {
    process.stderr.write(`tsfetch: logo ${message}\n`);
  }
}

type LogoMode = "auto" | "ascii" | "image";

function resolveLogoMode(): LogoMode {
  const raw = (process.env.TSFETCH_LOGO ?? "auto").toLowerCase();
  if (raw === "ascii") {
    return "ascii";
  }
  if (raw === "image") {
    return "image";
  }
  return "auto";
}

function clamp(value: number, min: number, max: number): number {
  if (value < min) {
    return min;
  }
  if (value > max) {
    return max;
  }
  return value;
}

function parseSizeOverride(): { width: number; height: number } | null {
  const raw = (process.env.TSFETCH_LOGO_SIZE ?? "").trim();
  if (!raw) {
    return null;
  }

  const match = raw.match(/^(\d+)\s*[xX]\s*(\d+)$/);
  if (!match) {
    logLogoDebug(`invalid TSFETCH_LOGO_SIZE value: ${raw}`);
    return null;
  }

  const width = Number(match[1]);
  const height = Number(match[2]);
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    logLogoDebug(`invalid TSFETCH_LOGO_SIZE value: ${raw}`);
    return null;
  }

  return { width, height };
}

function resolveLogoSize(mode: LogoMode): { width: number; height: number } {
  const override = parseSizeOverride();
  if (override) {
    return override;
  }

  if (mode !== "image") {
    return { width: 35, height: 19 };
  }

  const cols = process.stdout.columns ?? 120;
  const rows = process.stdout.rows ?? 40;
  const reservedRightCols = 84;
  const maxWidth = Math.max(14, cols - reservedRightCols);
  const width = clamp(Math.floor(cols * 0.42), 14, maxWidth);
  const maxHeight = Math.max(12, rows - 4);
  const height = clamp(Math.round(width / 2), 12, maxHeight);

  return { width, height };
}

function selectSvg(palette: Palette): string | null {
  if (palette.theme === "light") {
    return LIGHT_THEME_SVG;
  }
  if (palette.theme === "dark") {
    return DARK_THEME_SVG;
  }
  return null;
}

function shouldAttemptSvg(palette: Palette): boolean {
  const mode = resolveLogoMode();
  if (mode === "ascii") {
    return false;
  }
  if (mode === "image") {
    return true;
  }
  return Boolean(process.stdout.isTTY && palette.enabled);
}

function renderWithChafa(
  input: string | Buffer,
  palette: Palette,
  size: { width: number; height: number },
): string[] | null {
  const colorMode = palette.enabled ? "full" : "none";
  const result = spawnSync(
    "chafa",
    ["-f", "symbols", `--size=${size.width}x${size.height}`, `--colors=${colorMode}`, "-"],
    {
      encoding: "utf8",
      input,
      maxBuffer: 4 * 1024 * 1024,
    },
  );

  if (result.error) {
    logLogoDebug(`renderer unavailable (${result.error.message})`);
    return null;
  }

  if (result.status !== 0) {
    const stderr = (result.stderr ?? "").trim();
    if (stderr) {
      logLogoDebug(`renderer failed (${stderr})`);
    } else {
      logLogoDebug(`renderer failed (exit ${result.status})`);
    }
    return null;
  }

  const lines = trimTrailingEmptyLines((result.stdout ?? "").split(/\r?\n/));
  return lines.length > 0 ? lines : null;
}

function convertSvgToPng(svg: string): Buffer | null {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "tsfetch-logo-"));
  const svgPath = path.join(tmpDir, "logo.svg");
  const pngPath = path.join(tmpDir, "logo.png");

  try {
    fs.writeFileSync(svgPath, svg, "utf8");

    const convert = spawnSync("rsvg-convert", ["--format=png", "--output", pngPath, svgPath], {
      encoding: "utf8",
      maxBuffer: 2 * 1024 * 1024,
    });

    if (convert.error) {
      logLogoDebug(`SVG converter unavailable (${convert.error.message})`);
      return null;
    }

    if (convert.status !== 0) {
      const stderr = (convert.stderr ?? "").trim();
      if (stderr) {
        logLogoDebug(`SVG converter failed (${stderr})`);
      } else {
        logLogoDebug(`SVG converter failed (exit ${convert.status})`);
      }
      return null;
    }

    if (!fs.existsSync(pngPath)) {
      logLogoDebug("SVG converter did not produce PNG output");
      return null;
    }

    return fs.readFileSync(pngPath);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

function renderSvgLogo(palette: Palette): string[] | null {
  if (!shouldAttemptSvg(palette)) {
    logLogoDebug("not attempting SVG (mode/ascii/no-tty/no-color)");
    return null;
  }

  const mode = resolveLogoMode();
  const size = resolveLogoSize(mode);
  logLogoDebug(`requested size ${size.width}x${size.height} (mode=${mode})`);

  const svg = selectSvg(palette);
  if (!svg) {
    logLogoDebug("no themed SVG selected");
    return null;
  }

  const direct = renderWithChafa(svg, palette, size);
  if (direct) {
    return direct;
  }

  const png = convertSvgToPng(svg);
  if (!png) {
    return null;
  }

  logLogoDebug("retrying logo render via rsvg-convert -> chafa");
  return renderWithChafa(png, palette, size);
}

export function renderLogo(palette: Palette): string[] {
  return renderSvgLogo(palette) ?? renderAsciiLogo(palette);
}
