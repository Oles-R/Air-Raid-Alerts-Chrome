$ErrorActionPreference = "Stop"

$root = $PSScriptRoot
$distDir = Join-Path $root "dist"

if (-not (Test-Path $distDir) -or -not (Test-Path (Join-Path $distDir "manifest.json"))) {
    throw "dist/ is missing or incomplete - run 'npm run compile' first."
}

$manifest = Get-Content (Join-Path $distDir "manifest.json") -Raw -Encoding UTF8 | ConvertFrom-Json
$version = $manifest.version

$releaseDir = Join-Path $root "release"
if (-not (Test-Path $releaseDir)) {
    New-Item -ItemType Directory -Path $releaseDir | Out-Null
}

$dest = Join-Path $releaseDir "ukraine-air-raid-alerts-$version.zip"
if (Test-Path $dest) {
    Remove-Item $dest -Force
}

Compress-Archive -Path (Join-Path $distDir "*") -DestinationPath $dest -CompressionLevel Optimal

Write-Host "Packaged $dest"
