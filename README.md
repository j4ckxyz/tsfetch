# tsfetch

`tsfetch` is a neofetch/fastfetch-style CLI for Tailscale tailnets.

It reads `tailscale status --json`, then prints a clean dashboard with:

- Tailscale ASCII logo
- Tailnet and node identity details
- total/online/offline node counts
- ownership breakdown (yours, shared-to-you, foreign)
- exit-node and route stats
- health + warning status
- optional verbose node lists and traffic summary

## Requirements

- Tailscale installed and authenticated on the machine (`tailscale up`)

## Install

### macOS / Linux

```bash
curl -fsSL https://raw.githubusercontent.com/j4ckxyz/tsfetch/main/install.sh | sh
```

If you fork this project, set your repo slug first:

```bash
export TSFETCH_REPO="your-username/tsfetch"
```

### Windows (PowerShell)

```powershell
irm https://raw.githubusercontent.com/j4ckxyz/tsfetch/main/install.ps1 | iex
```

For forks:

```powershell
$env:TSFETCH_REPO = "your-username/tsfetch"
irm https://raw.githubusercontent.com/your-username/tsfetch/main/install.ps1 | iex
```

## Usage

```bash
tsfetch
```

### Options

- `-v, --verbose` show additional node lists and traffic
- `--json` output machine-readable summary JSON
- `--theme auto|dark|light` color theme mode (default: `auto`)
- `--no-color`, `--plain` disable ANSI color output
- `--private`, `--redact` hide personal/sensitive details (emails, hostnames, IPs)
- `--version` print version
- `-h, --help` print help

## Build from source

```bash
npm install
npm run build
node dist/index.js
```

## Release binaries

```bash
npm run release:build
```

This creates standalone binaries in `release/`:

- `tsfetch-macos-x64`
- `tsfetch-macos-arm64`
- `tsfetch-linux-x64`
- `tsfetch-linux-arm64`
- `tsfetch-win-x64.exe`

## GitHub Releases automation

Tag a version to trigger cross-platform release builds:

```bash
git tag v0.1.0
git push origin v0.1.0
```

The workflow builds binaries and publishes them as release assets.
