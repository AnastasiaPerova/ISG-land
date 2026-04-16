param([switch]$Build)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Split-Path -Parent $scriptDir
$localConfigPath = Join-Path $scriptDir "deploy.local.ps1"
$exampleConfigPath = Join-Path $scriptDir "deploy.config.example.ps1"

function Get-DeployConfig {
  foreach ($path in @($localConfigPath, $exampleConfigPath)) {
    if (Test-Path -LiteralPath $path) {
      . $path
      if ($DeployConfig) { return $DeployConfig }
    }
  }

  return @{
    FtpHost = $env:ISG_FTP_HOST
    FtpPort = if ($env:ISG_FTP_PORT) { [int]$env:ISG_FTP_PORT } else { 21 }
    FtpUser = $env:ISG_FTP_USER
    FtpPassword = $env:ISG_FTP_PASSWORD
    RemoteDir = if ($env:ISG_FTP_REMOTE_DIR) { $env:ISG_FTP_REMOTE_DIR } else { "/home/industrialsteelgroup.com/wp-content/themes/isg-asf-theme/" }
  }
}

function Assert-DeployConfig($config) {
  $required = @("FtpHost", "FtpUser", "FtpPassword", "RemoteDir")
  $missing = @($required | Where-Object { -not $config.ContainsKey($_) -or [string]::IsNullOrWhiteSpace([string]$config[$_]) })
  if ($missing.Count -gt 0) {
    throw "Missing deploy config values: $($missing -join ', '). Create scripts/deploy.local.ps1 from scripts/deploy.config.example.ps1 or set ISG_FTP_* environment variables."
  }
}

function Resolve-WinScpPath {
  $paths = @(
    $env:ISG_WINSCP_PATH,
    (Get-Command "WinSCP.com" -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source -ErrorAction SilentlyContinue),
    "C:\Program Files\WinSCP\WinSCP.com",
    "C:\Program Files (x86)\WinSCP\WinSCP.com"
  ) | Where-Object { -not [string]::IsNullOrWhiteSpace($_) } | Select-Object -Unique

  foreach ($path in $paths) {
    if (Test-Path -LiteralPath $path) { return $path }
  }

  return $null
}

function New-FtpRequest($uri, $method, $config) {
  $request = [System.Net.FtpWebRequest]::Create($uri)
  $request.Method = $method
  $request.Credentials = New-Object System.Net.NetworkCredential([string]$config.FtpUser, [string]$config.FtpPassword)
  $request.UseBinary = $true
  $request.UsePassive = $true
  $request.KeepAlive = $false
  return $request
}

function Get-RelativePathCompat($basePath, $targetPath) {
  $normalizedBase = [System.IO.Path]::GetFullPath($basePath)
  $normalizedTarget = [System.IO.Path]::GetFullPath($targetPath)

  if (-not $normalizedBase.EndsWith([System.IO.Path]::DirectorySeparatorChar) -and -not $normalizedBase.EndsWith([System.IO.Path]::AltDirectorySeparatorChar)) {
    $normalizedBase += [System.IO.Path]::DirectorySeparatorChar
  }

  $baseUri = New-Object System.Uri($normalizedBase)
  $targetUri = New-Object System.Uri($normalizedTarget)
  $relativeUri = $baseUri.MakeRelativeUri($targetUri)
  $relativePath = [System.Uri]::UnescapeDataString($relativeUri.ToString())
  return $relativePath -replace "/", "\"
}

function Get-RemoteTimestamp($uri, $config) {
  try {
    $response = [System.Net.FtpWebResponse](New-FtpRequest $uri ([System.Net.WebRequestMethods+Ftp]::GetDateTimestamp) $config).GetResponse()
    try { return $response.LastModified.ToUniversalTime() } finally { $response.Close() }
  } catch { return $null }
}

function Ensure-RemoteDirectory($sessionUrl, $remoteDir, $config, $createdDirs) {
  $current = ""
  foreach ($part in (($remoteDir -replace "\\", "/").Trim("/") -split "/")) {
    if ([string]::IsNullOrWhiteSpace($part)) { continue }
    $current = if ($current) { "$current/$part" } else { $part }
    if ($createdDirs.ContainsKey($current)) { continue }

    try {
      $response = [System.Net.FtpWebResponse](New-FtpRequest "$sessionUrl$current" ([System.Net.WebRequestMethods+Ftp]::MakeDirectory) $config).GetResponse()
      $response.Close()
    } catch [System.Net.WebException] {
      $ftpResponse = $_.Exception.Response
      $statusCode = if ($ftpResponse -is [System.Net.FtpWebResponse]) { [int]$ftpResponse.StatusCode } else { $null }
      if ($ftpResponse -is [System.Net.FtpWebResponse]) { $ftpResponse.Close() }
      if ($statusCode -ne 550) { throw }
    }

    $createdDirs[$current] = $true
  }
}

function Invoke-NativeFtpDeploy($sessionUrl, $repoRoot, $config) {
  $excludeDirNames = @(".git", ".github", "node_modules", "scripts", "acf-json")
  $excludeFileNames = @("preview.html", "package.json", "package-lock.json", "vercel.json", ".vercelignore", ".gitignore", ".gitattributes")
  $createdDirs = @{}

  $files = Get-ChildItem -LiteralPath $repoRoot -Recurse -File | Where-Object {
    $relativePath = Get-RelativePathCompat $repoRoot $_.FullName
    $segments = $relativePath -split "[\\/]"
    foreach ($segment in $segments) {
      if ($excludeDirNames -contains $segment) { return $false }
    }
    return -not ($excludeFileNames -contains $_.Name)
  }

  foreach ($file in $files) {
    $relativePath = (Get-RelativePathCompat $repoRoot $file.FullName) -replace "\\", "/"
    $remotePath = ([string]$config.RemoteDir).TrimEnd("/") + "/" + $relativePath
    $remoteDir = Split-Path -Path $remotePath -Parent
    $remoteUri = "$sessionUrl$($remotePath.TrimStart('/'))"

    Ensure-RemoteDirectory $sessionUrl $remoteDir $config $createdDirs

    $remoteTimestamp = Get-RemoteTimestamp $remoteUri $config
    if ($remoteTimestamp -and $file.LastWriteTimeUtc -le $remoteTimestamp) { continue }

    Write-Host "Uploading $relativePath"
    $request = New-FtpRequest $remoteUri ([System.Net.WebRequestMethods+Ftp]::UploadFile) $config
    $request.ContentLength = $file.Length
    $requestStream = $request.GetRequestStream()
    $fileStream = [System.IO.File]::OpenRead($file.FullName)
    try { $fileStream.CopyTo($requestStream) } finally { $fileStream.Close(); $requestStream.Close() }
    $response = [System.Net.FtpWebResponse]$request.GetResponse()
    $response.Close()
  }
}

if ($Build) {
  Write-Host "Building assets..."
  Push-Location $repoRoot
  try { npm run build } finally { Pop-Location }
}

$config = Get-DeployConfig
Assert-DeployConfig $config

$remoteDir = [string]$config.RemoteDir
if (-not $remoteDir.EndsWith("/")) { $remoteDir += "/" }
if ($remoteDir -notmatch "wp-content/themes/isg-asf-theme/?$") {
  throw "RemoteDir must point to the isg-asf-theme directory inside wp-content/themes. Current value: $remoteDir"
}

$sessionUrl = "ftp://$($config.FtpHost):$($config.FtpPort)/"
$winScpPath = Resolve-WinScpPath
$logPath = Join-Path $scriptDir "deploy.log"

Write-Host "Deploying theme to $remoteDir"

if ($winScpPath) {
  $winscpScript = @"
option batch abort
option confirm off
open "$sessionUrl" -username="$($config.FtpUser)" -password="$($config.FtpPassword)"
lcd "$repoRoot"
cd "$remoteDir"
put -neweronly -transfer=binary -nopermissions -preservetime -filemask="| .git/; .github/; node_modules/; scripts/; acf-json/; preview.html; package.json; package-lock.json; vercel.json; .vercelignore; .gitignore; .gitattributes" * "$remoteDir"
exit
"@
  $tempScript = [System.IO.Path]::GetTempFileName()
  try {
    Set-Content -LiteralPath $tempScript -Value $winscpScript -Encoding UTF8
    & $winScpPath "/ini=nul" "/log=$logPath" "/script=$tempScript"
    if ($LASTEXITCODE -ne 0) { throw "WinSCP exited with code $LASTEXITCODE. See $logPath for details." }
  } finally {
    Remove-Item -LiteralPath $tempScript -Force -ErrorAction SilentlyContinue
  }
} else {
  Write-Warning "WinSCP.com not found. Falling back to native PowerShell FTP deploy."
  Invoke-NativeFtpDeploy $sessionUrl $repoRoot $config
}

Write-Host "Deploy finished successfully."
