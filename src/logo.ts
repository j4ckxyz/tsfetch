import { spawnSync } from "node:child_process";
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
  const mode = (process.env.TSFETCH_LOGO ?? "auto").toLowerCase();
  if (mode === "ascii") {
    return false;
  }
  if (mode === "image") {
    return true;
  }
  return Boolean(process.stdout.isTTY && palette.enabled);
}

function renderSvgLogo(palette: Palette): string[] | null {
  if (!shouldAttemptSvg(palette)) {
    return null;
  }

  const svg = selectSvg(palette);
  if (!svg) {
    return null;
  }

  const colorMode = palette.enabled ? "full" : "none";
  const result = spawnSync("chafa", ["-f", "symbols", "--size=35x19", `--colors=${colorMode}`, "-"], {
    encoding: "utf8",
    input: svg,
    maxBuffer: 2 * 1024 * 1024,
  });

  if (result.error || result.status !== 0) {
    return null;
  }

  const lines = trimTrailingEmptyLines((result.stdout ?? "").split(/\r?\n/));
  return lines.length > 0 ? lines : null;
}

export function renderLogo(palette: Palette): string[] {
  return renderSvgLogo(palette) ?? renderAsciiLogo(palette);
}
