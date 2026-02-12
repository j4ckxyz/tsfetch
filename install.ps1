param(
  [string]$Repo = "j4ckxyz/tsfetch",
  [string]$Version = $env:TSFETCH_VERSION,
  [string]$InstallDir = $env:TSFETCH_INSTALL_DIR
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if ($env:TSFETCH_REPO) {
  $Repo = $env:TSFETCH_REPO
}

if ([string]::IsNullOrWhiteSpace($Version)) {
  $Version = "latest"
}

if ([string]::IsNullOrWhiteSpace($InstallDir)) {
  $InstallDir = Join-Path $HOME "bin"
}

$arch = "x64"

$asset = "tsfetch-win-$arch.exe"

if ($Version -eq "latest") {
  $latestUrl = "https://api.github.com/repos/$Repo/releases/latest"
  $latest = Invoke-RestMethod -Uri $latestUrl
  if (-not $latest.tag_name) {
    throw "Could not determine latest release tag from $latestUrl"
  }
  $tag = $latest.tag_name
}
else {
  $tag = $Version
}

$downloadUrl = "https://github.com/$Repo/releases/download/$tag/$asset"

New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null
$destination = Join-Path $InstallDir "tsfetch.exe"

Write-Host "Installing tsfetch from $downloadUrl"
Invoke-WebRequest -Uri $downloadUrl -OutFile $destination

Write-Host ""
Write-Host "Installed tsfetch to $destination"

$pathParts = ($env:Path -split ";") | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne "" }
if ($pathParts -contains $InstallDir) {
  Write-Host "Run: tsfetch"
}
else {
  Write-Host "Add $InstallDir to PATH to run tsfetch globally."
}
