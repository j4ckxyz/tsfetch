param(
  [string]$Repo = "j4ckxyz/tsfetch",
  [string]$Version = $env:TSFETCH_VERSION,
  [string]$InstallDir = $env:TSFETCH_INSTALL_DIR,
  [ValidateSet("User", "Machine")]
  [string]$Scope = $(if ($env:TSFETCH_SCOPE) { $env:TSFETCH_SCOPE } else { "User" })
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if ($env:TSFETCH_REPO) {
  $Repo = $env:TSFETCH_REPO
}

if ([string]::IsNullOrWhiteSpace($Version)) {
  $Version = "latest"
}

function Test-IsAdmin {
  $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
  $principal = New-Object Security.Principal.WindowsPrincipal($identity)
  return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Add-PathEntry {
  param(
    [Parameter(Mandatory = $true)]
    [ValidateSet("User", "Machine")]
    [string]$Target,
    [Parameter(Mandatory = $true)]
    [string]$PathEntry
  )

  $targetEnum = [System.EnvironmentVariableTarget]::$Target
  $current = [Environment]::GetEnvironmentVariable("Path", $targetEnum)
  $parts = @()
  if (-not [string]::IsNullOrWhiteSpace($current)) {
    $parts = $current -split ";" | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne "" }
  }

  $normalizedNew = $PathEntry.Trim().TrimEnd("\")
  $exists = $false
  foreach ($part in $parts) {
    if ([string]::Equals($part.TrimEnd("\"), $normalizedNew, [System.StringComparison]::OrdinalIgnoreCase)) {
      $exists = $true
      break
    }
  }

  if ($exists) {
    return $false
  }

  $updated = if ([string]::IsNullOrWhiteSpace($current)) { $PathEntry } else { "$current;$PathEntry" }
  [Environment]::SetEnvironmentVariable("Path", $updated, $targetEnum)
  return $true
}

if ($Scope -eq "Machine" -and -not (Test-IsAdmin)) {
  throw "Machine scope install requires an elevated PowerShell session (Run as Administrator)."
}

if ([string]::IsNullOrWhiteSpace($InstallDir)) {
  if ($Scope -eq "Machine") {
    $InstallDir = Join-Path $env:ProgramFiles "tsfetch\bin"
  }
  elseif (-not [string]::IsNullOrWhiteSpace($env:LOCALAPPDATA)) {
    $InstallDir = Join-Path $env:LOCALAPPDATA "Programs\tsfetch\bin"
  }
  else {
    $InstallDir = Join-Path $HOME "bin"
  }
}

$procArch = [System.Runtime.InteropServices.RuntimeInformation]::ProcessArchitecture.ToString().ToLowerInvariant()
$assetCandidates = switch ($procArch) {
  "arm64" { @("tsfetch-win-arm64.exe", "tsfetch-win-x64.exe") }
  "x64" { @("tsfetch-win-x64.exe") }
  default { throw "Unsupported Windows architecture: $procArch" }
}

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

New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null
$destination = Join-Path $InstallDir "tsfetch.exe"

$selectedAsset = $null
$lastDownloadError = $null
foreach ($asset in $assetCandidates) {
  $downloadUrl = "https://github.com/$Repo/releases/download/$tag/$asset"
  Write-Host "Installing tsfetch from $downloadUrl"
  try {
    Invoke-WebRequest -Uri $downloadUrl -OutFile $destination -UseBasicParsing
    $selectedAsset = $asset
    break
  }
  catch {
    $lastDownloadError = $_
  }
}

if (-not $selectedAsset) {
  throw "Could not download a compatible Windows release asset for $Repo. Last error: $($lastDownloadError.Exception.Message)"
}

& $destination --version *> $null
if ($LASTEXITCODE -ne 0) {
  throw "Installed binary failed smoke test. Try running: & '$destination' --version"
}

$pathChanged = Add-PathEntry -Target $Scope -PathEntry $InstallDir

$currentProcessParts = ($env:Path -split ";") | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne "" }
if ($currentProcessParts -notcontains $InstallDir) {
  $env:Path = "$env:Path;$InstallDir"
}

Write-Host ""
Write-Host "Installed tsfetch to $destination ($selectedAsset)"
if ($pathChanged) {
  Write-Host "Added $InstallDir to $Scope PATH."
}
else {
  Write-Host "$InstallDir is already present in $Scope PATH."
}
Write-Host "Open a new terminal window, then run: tsfetch"
