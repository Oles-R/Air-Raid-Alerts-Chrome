# Політика конфіденційності

Розширення **Повітряні Тривоги (Ukraine Air Raid Alerts)** розроблене Oleksandr Reshetnikov.

## Які дані обробляються

- **Геолокація (за бажанням, вимкнено за замовчуванням).** Якщо ви вмикаєте автоматичне визначення регіону в Налаштуваннях, розширення один раз отримує ваші координати через `navigator.geolocation` і одразу надсилає їх до стороннього сервісу зворотного геокодування [api.bigdatacloud.net](https://www.bigdatacloud.net/) лише для того, щоб визначити назву області/регіону. Координати ніде не зберігаються — ні локально, ні на будь-якому сервері розробника — і не використовуються повторно.
- **Локальні налаштування.** Мова, тема оформлення, обраний регіон/список регіонів для відстеження та останній відомий статус тривог зберігаються локально в `chrome.storage` на вашому пристрої. Ці дані не передаються розробнику й нікуди не синхронізуються.
- **Дані про тривоги.** Розширення раз на хвилину запитує статус тривог із власного проксі-сервера `air-raid-alerts-proxy-worker` (Cloudflare Worker), який, у свою чергу, звертається до офіційного API [api.ukrainealarm.com](https://api.ukrainealarm.com). Цей запит не містить жодних персональних даних користувача — це звичайний запит на читання публічних даних про тривоги.

## Чого розширення не робить

- Не збирає персональні дані (ім'я, e-mail, IP, історію перегляду тощо).
- Не передає й не продає жодні дані третім сторонам, окрім одноразового запиту координат до сервісу геокодування (і лише якщо ви самі увімкнули цю функцію).
- Не використовує аналітику, трекери чи рекламні SDK.
- Не виконує віддалений код — увесь код розширення постачається разом із пакетом розширення.

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

## Контакти

Питання щодо цієї політики конфіденційності можна надсилати на [aleksandr.reshetnikov@gmail.com](mailto:aleksandr.reshetnikov@gmail.com).

---

# Privacy Policy (English)

The **Ukraine Air Raid Alerts** extension is developed by Oleksandr Reshetnikov.

## What data is processed

- **Geolocation (optional, off by default).** If you enable automatic region detection in Settings, the extension reads your coordinates once via `navigator.geolocation` and immediately sends them to a third-party reverse-geocoding service, [api.bigdatacloud.net](https://www.bigdatacloud.net/), solely to resolve the name of your oblast/region. Coordinates are never stored — locally or on any server operated by the developer — and are not reused afterwards.
- **Local settings.** Language, theme, the region(s) you track, and the last known alert state are stored locally in `chrome.storage` on your device. This data is never sent to the developer and is never synced anywhere.
- **Alert data.** Once per minute, the extension polls the developer's own proxy server, `air-raid-alerts-proxy-worker` (a Cloudflare Worker), which in turn calls the official [api.ukrainealarm.com](https://api.ukrainealarm.com) API. This request carries no personal user data — it's a plain read request for public alert status.

## What the extension does not do

- Does not collect personal information (name, email, IP address, browsing history, etc.).
- Does not share or sell any data to third parties, other than the one-off coordinate lookup sent to the geocoding service (and only if you enabled that feature yourself).
- Does not use analytics, trackers, or advertising SDKs.
- Does not execute remote code — all extension code ships inside the extension package.

## Extension permissions

| Permission | Why |
|---|---|
| `alarms` | Periodic (once per minute) background polling of the alert API |
| `storage` | Local storage of settings and the last known alert state |
| `notifications` | System notification when a new alert starts |
| `tabs` | Shows the on-page toast alert on open tabs |
| `geolocation` | Optional — used to auto-detect "my region" (off by default) |
| Host permission `air-raid-alerts-proxy-worker...workers.dev` | The extension's only data source — the developer's own proxy server |
| Host permission `<all_urls>` | Needed to show the on-page toast alert on any site |

## Contact

Questions about this privacy policy can be sent to [aleksandr.reshetnikov@gmail.com](mailto:aleksandr.reshetnikov@gmail.com).
