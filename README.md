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

1. Клонуйте репозиторій або завантажте як ZIP і розпакуйте
2. Відкрийте `chrome://extensions` у Chrome
3. Увімкніть **Режим розробника** (перемикач угорі праворуч)
4. Натисніть **Завантажити розпаковане** і виберіть теку проєкту

## Налаштування

Ніяких додаткових налаштувань для запуску не потрібно — розширення одразу після встановлення починає показувати дані. API-ключ не потрібен: усі запити до api.ukrainealarm.com виконує проксі-сервер `air-raid-alerts-proxy-worker` (окремий Cloudflare Worker), а розширення лише читає вже готовий, агрегований результат з нього.

За бажанням у Налаштуваннях можна: увімкнути автовизначення свого регіону, додати конкретні регіони для спостереження, обрати мову й тему оформлення.

## Структура проєкту

```
manifest.json         — маніфест розширення (MV3)
background.js         — service worker: опитування API, сповіщення, бейдж/іконка
popup.html/css/js      — інтерфейс попапа
content.js             — спливаючі toast-сповіщення на сторінках
constants.js           — спільні константи (URL, кольори, шляхи іконок)
icons.js               — SVG-іконки типів тривог
translations.js, i18n.js — локалізація (uk/en)
theme.js               — перемикання теми оформлення
regionUtils.js          — логіка визначення "мого регіону"
icons/                  — іконки розширення (PNG) для різних статусів
_locales/               — локалізація маніфесту (назва, опис)
```

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

No setup is required to get started — the extension shows data right after installation. No API key needed: all api.ukrainealarm.com requests are made by the `air-raid-alerts-proxy-worker` proxy, and the extension just reads the already-aggregated result from it.

Optionally, in Settings you can enable automatic region detection, add specific regions to watch, and pick a language/theme.

## License

MIT. Air raid alert data is provided by the third-party service [api.ukrainealarm.com](https://api.ukrainealarm.com) (via our own proxy) under its own terms of use.

## Author

Oleksandr Reshetnikov — [aleksandr.reshetnikov@gmail.com](mailto:aleksandr.reshetnikov@gmail.com)
