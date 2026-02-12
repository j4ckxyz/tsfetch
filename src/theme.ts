import { CliOptions, ThemeMode } from "./types";

type ResolvedTheme = "dark" | "light" | "none";

export interface Palette {
  enabled: boolean;
  theme: ResolvedTheme;
  title: (value: string) => string;
  label: (value: string) => string;
  value: (value: string) => string;
  muted: (value: string) => string;
  good: (value: string) => string;
  warn: (value: string) => string;
  bad: (value: string) => string;
  accent: (value: string) => string;
  logo: (value: string) => string;
}

function style(code: string, enabled: boolean): (text: string) => string {
  if (!enabled) {
    return (text: string) => text;
  }
  return (text: string) => `\u001b[${code}m${text}\u001b[0m`;
}

export function stripAnsi(value: string): string {
  return value.replace(/\u001B\[[0-9;]*m/g, "");
}

function shouldUseColor(opts: CliOptions): boolean {
  if (opts.noColor) {
    return false;
  }

  if (process.env.NO_COLOR !== undefined) {
    return false;
  }

  const forceColor = process.env.FORCE_COLOR;
  if (forceColor && forceColor !== "0") {
    return true;
  }

  if (forceColor === "0") {
    return false;
  }

  return Boolean(process.stdout.isTTY);
}

function resolveAutoTheme(): Exclude<ResolvedTheme, "none"> {
  const colorFgbg = process.env.COLORFGBG;
  if (colorFgbg) {
    const parts = colorFgbg
      .split(";")
      .map((part) => Number(part.trim()))
      .filter((part) => Number.isFinite(part));
    const background = parts.length > 0 ? (parts[parts.length - 1] ?? Number.NaN) : Number.NaN;
    if (Number.isFinite(background)) {
      if (background <= 6 || background === 8) {
        return "dark";
      }
      return "light";
    }
  }

  const program = process.env.TERM_PROGRAM?.toLowerCase();
  if (program === "apple_terminal") {
    return "light";
  }

  return "dark";
}

function resolveTheme(mode: ThemeMode, colorEnabled: boolean): ResolvedTheme {
  if (!colorEnabled) {
    return "none";
  }

  if (mode === "auto") {
    return resolveAutoTheme();
  }

  return mode;
}

export function createPalette(opts: CliOptions): Palette {
  const enabled = shouldUseColor(opts);
  const theme = resolveTheme(opts.theme, enabled);

  if (theme === "none") {
    const identity = (value: string): string => value;
    return {
      enabled: false,
      theme,
      title: identity,
      label: identity,
      value: identity,
      muted: identity,
      good: identity,
      warn: identity,
      bad: identity,
      accent: identity,
      logo: identity,
    };
  }

  if (theme === "light") {
    return {
      enabled: true,
      theme,
      title: style("1;34", true),
      label: style("1;30", true),
      value: style("30", true),
      muted: style("90", true),
      good: style("32", true),
      warn: style("33", true),
      bad: style("31", true),
      accent: style("36", true),
      logo: style("34", true),
    };
  }

  return {
    enabled: true,
    theme,
    title: style("1;96", true),
    label: style("1;94", true),
    value: style("97", true),
    muted: style("90", true),
    good: style("92", true),
    warn: style("93", true),
    bad: style("91", true),
    accent: style("96", true),
    logo: style("96", true),
  };
}
