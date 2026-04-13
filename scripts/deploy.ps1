param(
  [switch]$Build
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Split-Path -Parent $scriptDir
$localConfigPath = Join-Path $scriptDir "deploy.local.ps1"
$exampleConfigPath = Join-Path $scriptDir "deploy.config.example.ps1"

function Get-DeployConfig {
  if (Test-Path -LiteralPath $localConfigPath) {
    . $localConfigPath
    if ($DeployConfig) {
      return $DeployConfig
    }
  }

  return @{
    FtpHost = $env:ISG_FTP_HOST
    FtpPort = if ($env:ISG_FTP_PORT) { [int]$env:ISG_FTP_PORT } else { 21 }
    FtpUser = $env:ISG_FTP_USER
    FtpPassword = $env:ISG_FTP_PASSWORD
    RemoteDir = if ($env:ISG_FTP_REMOTE_DIR) {
      $env:ISG_FTP_REMOTE_DIR
    } else {
      "/home/industrialsteelgroup.com/wp-content/themes/isg-asf-theme/"
    }
  }
}

function Assert-DeployConfig($config) {
  $requiredKeys = @("FtpHost", "FtpUser", "FtpPassword", "RemoteDir")
  $missing = @()

  foreach ($key in $requiredKeys) {
    if (-not $config.ContainsKey($key) -or [string]::IsNullOrWhiteSpace([string]$config[$key])) {
      $missing += $key
    }
  }

  if ($missing.Count -gt 0) {
    $missingText = $missing -join ", "
    throw "Missing deploy config values: $missingText. Create scripts/deploy.local.ps1 from scripts/deploy.config.example.ps1 or set ISG_FTP_* environment variables."
  }
}

if ($Build) {
  Write-Host "Building assets..."
  Push-Location $repoRoot
  try {
    npm run build
  } finally {
    Pop-Location
  }
}

$config = Get-DeployConfig
Assert-DeployConfig $config
$winScpPath = "C:\Program Files (x86)\WinSCP\WinSCP.com"

if (-not (Test-Path -LiteralPath $winScpPath)) {
  throw "WinSCP.com not found at $winScpPath"
}

$sessionUrl = "ftp://$($config.FtpHost):$($config.FtpPort)/"
$ftpUser = [string]$config.FtpUser
$ftpPassword = [string]$config.FtpPassword
$remoteDir = [string]$config.RemoteDir

if (-not $remoteDir.EndsWith("/")) {
  $remoteDir += "/"
}

if ($remoteDir -notmatch "wp-content/themes/isg-asf-theme/?$") {
  throw "RemoteDir must point to the isg-asf-theme directory inside wp-content/themes. Current value: $remoteDir"
}

$tempScript = [System.IO.Path]::GetTempFileName()
$logPath = Join-Path $scriptDir "deploy.log"

$winscpScript = @"
option batch abort
option confirm off
open "$sessionUrl" -username="$ftpUser" -password="$ftpPassword"
lcd "$repoRoot"
cd "$remoteDir"
put -neweronly -transfer=binary -nopermissions -preservetime -filemask="| .git/; .github/; node_modules/; scripts/; acf-json/; preview.html; package.json; package-lock.json; vercel.json; .vercelignore; .gitignore; .gitattributes" * "$remoteDir"
exit
"@

Set-Content -LiteralPath $tempScript -Value $winscpScript -Encoding UTF8

Write-Host "Deploying theme to $remoteDir"

try {
  & $winScpPath "/ini=nul" "/log=$logPath" "/script=$tempScript"
  if ($LASTEXITCODE -ne 0) {
    throw "WinSCP exited with code $LASTEXITCODE. See $logPath for details."
  }
  Write-Host "Deploy finished successfully."
} finally {
  Remove-Item -LiteralPath $tempScript -Force -ErrorAction SilentlyContinue
}
