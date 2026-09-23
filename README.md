# Повітряні Тривоги (Ukraine Air Raid Alerts)

Розширення для Google Chrome, яке показує статус повітряних тривог по всій Україні в реальному часі. Дані надходять з офіційного API [api.ukrainealarm.com](https://api.ukrainealarm.com) через власний проксі-сервер (`air-raid-alerts-proxy-worker`, окремий проєкт — Cloudflare Worker) — розширення не звертається до api.ukrainealarm.com напряму і не потребує власного API-ключа.

Це незалежний проєкт. Розширення **не є** офіційним застосунком чи сайтом map.ukrainealarm.com — лише використовує їхній публічний API.

## Можливості

- Список областей України зі статусом тривоги, оновлюється щохвилини
- Кольорова іконка на панелі інструментів і бейдж — миттєво видно, чи є тривога і наскільки вона серйозна (ракети, дрони, артобстріл, вуличні бої)
- Агрегація тривог: якщо тривожить хоч один район чи громада, це відображається на рівні всієї області (як на офіційній мапі)
- Спливаючі сповіщення на робочому столі та поверх відкритих вкладок при новій тривозі (не закриваються автоматично)
- Автоматичне визначення вашого регіону через геолокацію або ручне додавання будь-якого регіону (область, район, громада) для точкового відстеження
- Фільтр «лише мій регіон/громади», можливість приховати інші області зі списку
- Теми оформлення: темна, світла, системна
- Інтерфейс українською та англійською

## Встановлення

1. Клонуйте репозиторій
2. `npm install`
3. `npm run build` — збирає розширення в `dist/`
4. Відкрийте `chrome://extensions` у Chrome
5. Увімкніть **Режим розробника** (перемикач угорі праворуч)
6. Натисніть **Завантажити розпаковане** і виберіть теку `dist/` (не корінь репозиторію — там лежать лише TypeScript-джерела, а не готове розширення)

## Розробка

Розширення написане на TypeScript і збирається [esbuild](https://esbuild.github.io/) у звичайні JS-бандли (MV3 не підтримує TS напряму).

| Команда | Що робить |
|---|---|
| `npm run build` | Повний цикл: sync-languages → typecheck → compile → package (`release/*.zip`) |
| `npm run watch` | esbuild у watch-режимі — перекомпільовує `dist/` на кожну зміну `.ts`. Після зміни треба вручну натиснути "Reload" на сторінці `chrome://extensions` (live-reload у браузері не налаштований) |
| `npm run typecheck` | Перевірка типів без збірки (`tsc --noEmit`) |
| `npm run compile` | Тільки esbuild-компіляція `src/` → `dist/` + копіювання `public/` |
| `npm run sync-languages` | Перегенерувати `public/_locales/languages.json` зі сканованих `messages.json` |
| `npm run package` | Заархівувати вже зібраний `dist/` у `release/*.zip` (без перекомпіляції) |

`dist/` — це повністю готове, завантажуване розширення (те, що використовує "Завантажити розпаковане"). `release/*.zip` — той самий вміст, запакований для завантаження в Chrome Web Store.

### Реліз

1. Підняти `version` у `public/manifest.json` і `package.json`.
2. Додати в `CHANGELOG.md` розділ `## X.Y.Z — дата` (англійською).
3. Закомітити, поставити тег і запушити: `git tag vX.Y.Z && git push origin main vX.Y.Z`.
4. GitHub Action (`.github/workflows/release.yml`) збере розширення і створить GitHub Release з zip-архівом і розділом з changelog як описом.
5. Завантажити цей zip у Chrome Web Store Developer Dashboard (вручну).

## Налаштування

Ніяких додаткових налаштувань для запуску не потрібно — розширення одразу після встановлення починає показувати дані. API-ключ не потрібен: усі запити до api.ukrainealarm.com виконує проксі-сервер `air-raid-alerts-proxy-worker` (окремий Cloudflare Worker), а розширення лише читає вже готовий, агрегований результат з нього.

За бажанням у Налаштуваннях можна: увімкнути автовизначення свого регіону, додати конкретні регіони для спостереження, обрати мову й тему оформлення.

## Структура проєкту

```
src/
  entries/            — точки входу, кожна збирається в окремий бандл
    background.ts       — service worker: опитування API, сповіщення, бейдж/іконка
    content.ts           — спливаючі toast-сповіщення на сторінках
    popup.ts             — інтерфейс попапа
    theme.ts             — раннє застосування теми в <head> (проти "спалаху" не тієї теми)
  lib/                — спільна логіка, імпортується entry-файлами
    constants.ts, icons.ts, i18n.ts, regionNames.ts, alertReasons.ts,
    regionUtils.ts, theme.ts, types.ts
public/               — статичні файли, копіюються в dist/ без змін
  manifest.json          — маніфест розширення (MV3)
  popup.html/css
  icons/                 — іконки розширення (PNG/SVG) для різних статусів
  _locales/              — переклади: назва/опис розширення (маніфест) І весь текст інтерфейсу
scripts/build.mjs     — esbuild-конфіг + копіювання public/ у dist/
dist/                 — зібране розширення (гітигнорено, генерується білдом)
release/              — запаковані .zip для Chrome Web Store (гітигнорено)
```

## Додавання нового перекладу

Весь текст інтерфейсу (попап, сповіщення, toast) і поля маніфесту (назва, опис) беруться з `public/_locales/<код мови>/messages.json` — це єдине джерело перекладів.

Щоб додати нову мову:

1. Скопіюй `public/_locales/en/messages.json` у `public/_locales/<код>/messages.json` (напр. `public/_locales/pl/messages.json`) і перекладіть значення `"message"` для кожного ключа. Онови також `languageSelfName` — це власна назва мови (напр. `"Polski"`), вона показується у випадаючому списку.
2. Виконай `npm run sync-languages` — скрипт просканує `public/_locales/` і перегенерує `public/_locales/languages.json`.
3. Все — мова автоматично з'явиться у випадаючому списку налаштувань, а `t()` підхопить нові рядки без правок коду. `npm run build` викликає `sync-languages` автоматично.

`public/_locales/languages.json` — згенерований файл, не редагуй його вручну.

## Дозволи розширення

| Дозвіл | Навіщо |
|---|---|
| `alarms` | Періодичне (раз/хв) опитування API у фоновому режимі |
| `storage` | Локальне зберігання налаштувань та останнього стану тривог |
| `notifications` | Системні сповіщення при новій тривозі |
| `tabs` | Показ спливаючого toast-сповіщення на відкритих вкладках |
| `geolocation` | За бажанням — визначення "мого регіону" (вимкнено за замовчуванням) |
| Host permission `air-raid-alerts-proxy-worker...workers.dev` | Єдине джерело даних розширення — власний проксі-сервер |
| Host permission `<all_urls>` | Потрібен для показу toast-сповіщень на будь-якій сторінці |

Розширення не збирає й не передає жодних даних третім сторонам. Координати геолокації (якщо увімкнено) надсилаються лише до сервісу зворотного геокодування для визначення назви області й ніде не зберігаються.

## Ліцензія

MIT — див. текст ліцензії в [package.json](package.json). Дані про повітряні тривоги надаються стороннім сервісом [api.ukrainealarm.com](https://api.ukrainealarm.com) (через власний проксі) на його власних умовах використання.

## Автор

Oleksandr Reshetnikov — [aleksandr.reshetnikov@gmail.com](mailto:aleksandr.reshetnikov@gmail.com)

---

# Ukraine Air Raid Alerts (English)

A Chrome extension that shows the real-time status of air raid alerts across Ukraine. Data comes from the official [api.ukrainealarm.com](https://api.ukrainealarm.com) API via a dedicated proxy (`air-raid-alerts-proxy-worker`, a separate Cloudflare Worker project) — the extension never talks to api.ukrainealarm.com directly and needs no API key of its own.

This is an independent project and is **not** an official app or website of map.ukrainealarm.com — it only consumes their public API.

## Features

- List of Ukrainian oblasts with alert status, refreshed every minute
- Color-coded toolbar icon and badge — instantly see whether there's an alert and its severity (missiles, drones, shelling, urban combat)
- Alert aggregation: if any district or community within an oblast is alerting, the whole oblast reflects it (matching the official map's behavior)
- Desktop notifications and on-page toast popups for new alerts (no auto-dismiss — you close them yourself)
- Automatic region detection via geolocation, or manually add any region (oblast, district, community) to watch
- "My region only" filter, option to hide other oblasts from the list
- Dark / light / system theme
- Ukrainian and English UI

## Setup

1. Clone the repo
2. `npm install`
3. `npm run build` — builds the extension into `dist/`
4. Open `chrome://extensions` in Chrome
5. Enable **Developer mode** (top-right toggle)
6. Click **Load unpacked** and pick the `dist/` folder (not the repo root — that only holds TypeScript source, not a runnable extension)

## Development

The extension is written in TypeScript and bundled into plain JS with [esbuild](https://esbuild.github.io/) (MV3 doesn't run TypeScript directly).

| Command | What it does |
|---|---|
| `npm run build` | Full pipeline: sync-languages → typecheck → compile → package (`release/*.zip`) |
| `npm run watch` | esbuild in watch mode — recompiles `dist/` on every `.ts` change. You still need to click "Reload" on `chrome://extensions` afterward (no in-browser live-reload is wired up) |
| `npm run typecheck` | Type-check only, no build (`tsc --noEmit`) |
| `npm run compile` | esbuild-compile `src/` → `dist/` and copy `public/`, nothing else |
| `npm run sync-languages` | Regenerate `public/_locales/languages.json` from the `messages.json` files found |
| `npm run package` | Zip the already-built `dist/` into `release/*.zip`, no recompile |

`dist/` is a fully loadable extension (what "Load unpacked" points at). `release/*.zip` is the same content, packaged for the Chrome Web Store.

### Releasing

1. Bump `version` in `public/manifest.json` and `package.json`.
2. Add a `## X.Y.Z — date` section to `CHANGELOG.md`.
3. Commit, tag and push: `git tag vX.Y.Z && git push origin main vX.Y.Z`.
4. The GitHub Action (`.github/workflows/release.yml`) builds the extension and creates a GitHub Release with the zip attached and that changelog section as notes.
5. Upload the zip to the Chrome Web Store Developer Dashboard (manually).

No setup is required to get started beyond the build — the extension shows data right after installation. No API key needed: all api.ukrainealarm.com requests are made by the `air-raid-alerts-proxy-worker` proxy, and the extension just reads the already-aggregated result from it.

Optionally, in Settings you can enable automatic region detection, add specific regions to watch, and pick a language/theme.

## Project structure

```
src/
  entries/            — one file per bundled output
    background.ts       — service worker: polls the API, notifications, badge/icon
    content.ts           — on-page toast alerts
    popup.ts             — popup UI
    theme.ts             — applies the theme early in <head> (avoids a flash of the wrong theme)
  lib/                — shared logic, imported by the entry files
    constants.ts, icons.ts, i18n.ts, regionNames.ts, alertReasons.ts,
    regionUtils.ts, theme.ts, types.ts
public/               — static files, copied into dist/ unchanged
  manifest.json          — extension manifest (MV3)
  popup.html/css
  icons/                 — extension icons (PNG/SVG) for each status
  _locales/              — translations: extension name/description (manifest) AND all UI text
scripts/build.mjs     — esbuild config + copies public/ into dist/
dist/                 — built extension (gitignored, generated by the build)
release/              — packaged .zip files for the Chrome Web Store (gitignored)
```

## Adding a translation

All UI text (popup, notifications, toast) and the manifest fields (name, description) come from `public/_locales/<lang>/messages.json` — that's the single source of truth.

To add a new language:

1. Copy `public/_locales/en/messages.json` to `public/_locales/<code>/messages.json` (e.g. `public/_locales/pl/messages.json`) and translate every `"message"` value. Also set `languageSelfName` — that language's own native name (e.g. `"Polski"`), shown in the language dropdown.
2. Run `npm run sync-languages` — it scans `public/_locales/` and regenerates `public/_locales/languages.json`.
3. Done — the language shows up in Settings automatically, and `t()` picks up the new strings with no code changes. `npm run build` runs `sync-languages` for you.

`public/_locales/languages.json` is generated — don't edit it by hand.

## License

MIT. Air raid alert data is provided by the third-party service [api.ukrainealarm.com](https://api.ukrainealarm.com) (via our own proxy) under its own terms of use.

## Author

Oleksandr Reshetnikov — [aleksandr.reshetnikov@gmail.com](mailto:aleksandr.reshetnikov@gmail.com)
