import { VERSION } from "./version";
import { CliOptions, ThemeMode } from "./types";

const THEME_VALUES = new Set<ThemeMode>(["auto", "dark", "light"]);

export function parseCliArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    verbose: false,
    json: false,
    noColor: false,
    privateMode: true,
    theme: "auto",
    help: false,
    version: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg) {
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      options.help = true;
      continue;
    }

    if (arg === "--version") {
      options.version = true;
      continue;
    }

    if (arg === "--verbose" || arg === "-v") {
      options.verbose = true;
      continue;
    }

    if (arg === "--json") {
      options.json = true;
      continue;
    }

    if (arg === "--no-color" || arg === "--plain") {
      options.noColor = true;
      continue;
    }

    if (arg === "--private" || arg === "--redact") {
      options.privateMode = true;
      continue;
    }

    if (arg === "--show-all") {
      options.privateMode = false;
      continue;
    }

    if (arg === "--theme") {
      const next = argv[i + 1];
      if (!next) {
        throw new Error("Missing value for --theme. Use auto, dark, or light.");
      }
      if (!THEME_VALUES.has(next as ThemeMode)) {
        throw new Error(`Invalid theme \"${next}\". Use auto, dark, or light.`);
      }
      options.theme = next as ThemeMode;
      i += 1;
      continue;
    }

    if (arg.startsWith("--theme=")) {
      const value = arg.slice("--theme=".length);
      if (!THEME_VALUES.has(value as ThemeMode)) {
        throw new Error(`Invalid theme \"${value}\". Use auto, dark, or light.`);
      }
      options.theme = value as ThemeMode;
      continue;
    }

    throw new Error(`Unknown option: ${arg}`);
  }

  return options;
}

export function helpText(commandName = "tsfetch"): string {
  return [
    `${commandName} v${VERSION}`,
    "",
    "Neofetch-style CLI dashboard for Tailscale tailnets.",
    "",
    `Usage: ${commandName} [options]`,
    `       ${commandName} update`,
    "",
    "Options:",
    "  -h, --help         Show this help text",
    "      --version      Show version",
    "  -v, --verbose      Show additional node details",
    "      --json         Emit machine-readable JSON summary",
    "      --theme MODE   Theme mode: auto, dark, light",
    "      --no-color     Disable ANSI colors",
    "      --plain        Alias for --no-color",
    "      --private      Hide sensitive node/user details (default)",
    "      --redact       Alias for --private",
    "      --show-all     Disable redaction and show full details",
    "",
    "Commands:",
    "  update            Update tsfetch binary to latest release",
  ].join("\n");
}
