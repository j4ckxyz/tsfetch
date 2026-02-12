#!/usr/bin/env sh
set -eu

BIN_NAME="tsfetch"
REPO="${TSFETCH_REPO:-j4ckxyz/tsfetch}"
VERSION="${TSFETCH_VERSION:-latest}"
INSTALL_DIR="${TSFETCH_INSTALL_DIR:-$HOME/.local/bin}"

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

asset="$BIN_NAME-$os-$arch"
download_url="https://github.com/$REPO/releases/download/$tag/$asset"

mkdir -p "$INSTALL_DIR"

tmp_file="$(mktemp)"
trap 'rm -f "$tmp_file"' EXIT INT TERM

printf 'Installing %s from %s\n' "$BIN_NAME" "$download_url"
curl -fL "$download_url" -o "$tmp_file"

chmod +x "$tmp_file"
mv "$tmp_file" "$INSTALL_DIR/$BIN_NAME"

printf '\nInstalled %s to %s\n' "$BIN_NAME" "$INSTALL_DIR/$BIN_NAME"

case ":$PATH:" in
  *":$INSTALL_DIR:"*)
    printf 'Run: %s\n' "$BIN_NAME"
    ;;
  *)
    printf 'Add %s to PATH to run %s globally.\n' "$INSTALL_DIR" "$BIN_NAME"
    ;;
esac
