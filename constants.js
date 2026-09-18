// Shared, language-independent constants — used by background.js, popup.js and content.js.
// All api.ukrainealarm.com traffic goes through our own proxy (see
// ../air-raid-alerts-proxy-worker), which polls upstream once a minute with a
// single key and pre-aggregates the result. The extension never talks to
// api.ukrainealarm.com directly and needs no API key of its own.
const PROXY_URL = 'https://air-raid-alerts-proxy-worker.air-alerts-proxy.workers.dev/snapshot';
const GEOCODE_URL = 'https://api.bigdatacloud.net/data/reverse-geocode-client';

const RETRY_DELAY_MIN = 1.5;

// Fixed ID — a new notification always replaces the previous one instead of stacking up.
const NOTIFICATION_ID = 'ua-air-raid-alert';

// API alert type -> icon key in icons.js.
// AIR/ARTILLERY/URBAN_FIGHTS are exact glyphs from map.ukrainealarm.com.
// There is no official glyph for CHEMICAL/NUCLEAR — fallback to 'warning'.
const ALERT_TYPE_ICONS = {
  AIR: 'air',
  ARTILLERY: 'artillery',
  URBAN_FIGHTS: 'urbanFights'
};
const DEFAULT_ALERT_ICON_KEY = 'warning';

// Official map.ukrainealarm.com palette (the map's "Threats" legend).
const ALERT_LEVEL_COLORS = {
  Red: '#D55B50',
  Yellow: '#FFC200',
  default: '#60a5fa'
};

const ALERT_TYPE_COLORS = {
  ARTILLERY: '#FF9900',
  URBAN_FIGHTS: '#00B280'
};

const NO_ALERT_COLOR = '#3B4351';

// Extension icon — the official map.ukrainealarm.com logo (map of Ukraine on a
// flag-colored background), where the map itself is recolored based on status.
const STATUS_ICON_PATHS = {
  none: { 16: 'icons/status-none-16.png', 32: 'icons/status-none-32.png', 48: 'icons/status-none-48.png', 128: 'icons/status-none-128.png' },
  yellow: { 16: 'icons/status-yellow-16.png', 32: 'icons/status-yellow-32.png', 48: 'icons/status-yellow-48.png', 128: 'icons/status-yellow-128.png' },
  red: { 16: 'icons/status-red-16.png', 32: 'icons/status-red-32.png', 48: 'icons/status-red-48.png', 128: 'icons/status-red-128.png' }
};

// Locale tag for toLocaleTimeString/localeCompare
const LOCALE_TAGS = {
  uk: 'uk-UA',
  en: 'en-US'
};
