# Changelog

All notable changes to the extension. Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
A version's section of this file automatically becomes the GitHub Release notes when that version lands on `main`.

## 1.5.4 — 2026-09-23

### Changed
- New versions are tagged and published as GitHub Releases automatically when they land on `main`; no manual tag push needed.
- CI and release workflows run on Node.js 24.

## 1.5.3 — 2026-09-23

### Changed
- English is now the fallback language for browsers set to a language the extension doesn't support yet (previously Ukrainian).

## 1.5.2 — 2026-09-23

### Added
- Time format setting: system, 24-hour or 12-hour (AM/PM).
- Threat type (ballistic missiles, drones, shelling, etc.) in system notifications and on-page toasts.
- Current version in the settings panel, linking to this changelog; a "New" badge after an update.

### Changed
- New versions from the Chrome Web Store are applied right away instead of waiting for a browser restart.

## 1.5.1 — 2026-09-21

### Changed
- Region names and alert reasons are shown exactly as the API returns them, without translation.

## 1.5.0 — 2026-09-21

### Changed
- Codebase migrated to TypeScript, bundled with esbuild.
