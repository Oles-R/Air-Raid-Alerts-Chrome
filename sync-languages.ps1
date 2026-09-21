$ErrorActionPreference = "Stop"

$root = $PSScriptRoot
$localesDir = Join-Path $root "_locales"

$languages = Get-ChildItem -Path $localesDir -Directory |
    Where-Object { Test-Path (Join-Path $_.FullName "messages.json") } |
    Sort-Object Name |
    ForEach-Object {
        $msgPath = Join-Path $_.FullName "messages.json"
        $messages = Get-Content $msgPath -Raw -Encoding UTF8 | ConvertFrom-Json
        $name = if ($messages.languageSelfName -and $messages.languageSelfName.message) {
            $messages.languageSelfName.message
        } else {
            $_.Name
        }
        [PSCustomObject]@{ code = $_.Name; name = $name }
    }

if (-not $languages -or $languages.Count -eq 0) {
    throw "No _locales/*/messages.json found under $localesDir"
}

$outPath = Join-Path $localesDir "languages.json"
$json = ConvertTo-Json -InputObject @($languages) -Depth 3

# Write without a BOM so fetch()/JSON.parse() in the extension never trips on it.
[System.IO.File]::WriteAllText($outPath, $json, (New-Object System.Text.UTF8Encoding($false)))

$codes = ($languages | ForEach-Object { $_.code }) -join ", "
Write-Host "Wrote $outPath with $($languages.Count) language(s): $codes"
