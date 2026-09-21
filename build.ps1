$ErrorActionPreference = "Stop"

$root = $PSScriptRoot
$manifest = Get-Content (Join-Path $root "manifest.json") -Raw | ConvertFrom-Json
$version = $manifest.version

$distDir = Join-Path $root "dist"
if (-not (Test-Path $distDir)) {
    New-Item -ItemType Directory -Path $distDir | Out-Null
}

$dest = Join-Path $distDir "ukraine-air-raid-alerts-$version.zip"
if (Test-Path $dest) {
    Remove-Item $dest -Force
}

$items = @(
    "manifest.json", "background.js", "content.js", "constants.js", "icons.js",
    "i18n.js", "theme.js", "regionUtils.js",
    "popup.html", "popup.css", "popup.js", "icons", "_locales"
) | ForEach-Object { Join-Path $root $_ }

Compress-Archive -Path $items -DestinationPath $dest -CompressionLevel Optimal

Write-Host "Built $dest"
