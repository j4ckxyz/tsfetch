#!/usr/bin/env sh
set -eu

BIN_NAME="tsfetch"
REPO="${TSFETCH_REPO:-j4ckxyz/tsfetch}"
VERSION="${TSFETCH_VERSION:-latest}"
if [ -n "${TSFETCH_INSTALL_DIR:-}" ]; then
  INSTALL_DIR="$TSFETCH_INSTALL_DIR"
elif [ "$(id -u)" -eq 0 ]; then
  INSTALL_DIR="/usr/local/bin"
else
  INSTALL_DIR="$HOME/.local/bin"
fi

os_name="$(uname -s)"
arch_name="$(uname -m)"

case "$os_name" in
  Darwin)
    os="macos"
    ;;
  Linux)
    os="linux"
    ;;
  *)
    printf 'Unsupported OS: %s\n' "$os_name" >&2
    exit 1
    ;;
esac

case "$arch_name" in
  x86_64|amd64)
    arch="x64"
    ;;
  arm64|aarch64)
    arch="arm64"
    ;;
  *)
    printf 'Unsupported architecture: %s\n' "$arch_name" >&2
    exit 1
    ;;
esac

case "$os-$arch" in
  macos-arm64)
    asset_candidates="tsfetch-macos-arm64 tsfetch-macos-x64"
    ;;
  macos-x64)
    asset_candidates="tsfetch-macos-x64"
    ;;
  linux-arm64)
    asset_candidates="tsfetch-linux-arm64"
    ;;
  linux-x64)
    asset_candidates="tsfetch-linux-x64"
    ;;
  *)
    printf 'Unsupported platform combination: %s-%s\n' "$os" "$arch" >&2
    exit 1
    ;;
esac

if [ "$VERSION" = "latest" ]; then
  api_url="https://api.github.com/repos/$REPO/releases/latest"
  tag="$(curl -fsSL "$api_url" | sed -n 's/.*"tag_name"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -n 1)"
  if [ -z "$tag" ]; then
    printf 'Unable to detect latest version from GitHub releases for %s\n' "$REPO" >&2
    exit 1
  fi
else
  tag="$VERSION"
fi

mkdir -p "$INSTALL_DIR"

tmp_file="$(mktemp)"
smoke_log="$(mktemp)"
trap 'rm -f "$tmp_file" "$smoke_log"' EXIT INT TERM

selected_asset=""
for asset in $asset_candidates; do
  download_url="https://github.com/$REPO/releases/download/$tag/$asset"
  printf 'Installing %s from %s\n' "$BIN_NAME" "$download_url"
  if curl -fL "$download_url" -o "$tmp_file"; then
    selected_asset="$asset"
    break
  fi
done

if [ -z "$selected_asset" ]; then
  printf 'Could not download a compatible release asset for %s (%s/%s).\n' "$REPO" "$os" "$arch" >&2
  exit 1
fi

chmod +x "$tmp_file"
mv "$tmp_file" "$INSTALL_DIR/$BIN_NAME"

if ! "$INSTALL_DIR/$BIN_NAME" --version >/dev/null 2>"$smoke_log"; then
  printf '\nInstalled binary failed smoke test. Output:\n' >&2
  cat "$smoke_log" >&2
  exit 1
fi

printf '\nInstalled %s to %s (%s)\n' "$BIN_NAME" "$INSTALL_DIR/$BIN_NAME" "$selected_asset"

case ":$PATH:" in
  *":$INSTALL_DIR:"*)
    printf 'Run: %s\n' "$BIN_NAME"
    ;;
  *)
    printf 'Add %s to PATH to run %s globally.\n' "$INSTALL_DIR" "$BIN_NAME"
    ;;
esac
