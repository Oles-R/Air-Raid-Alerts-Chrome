// Shared, language-independent constants — used by background.ts, popup.ts and content.ts.
// All api.ukrainealarm.com traffic goes through our own proxy (see
// ../air-raid-alerts-proxy-worker), which polls upstream once a minute with a
// single key and pre-aggregates the result. The extension never talks to
// api.ukrainealarm.com directly and needs no API key of its own.
export const PROXY_URL = 'https://air-raid-alerts-proxy-worker.air-alerts-proxy.workers.dev/snapshot';
export const GEOCODE_URL = 'https://api.bigdatacloud.net/data/reverse-geocode-client';

export const RETRY_DELAY_MIN = 1.5;

// Fixed ID — a new notification always replaces the previous one instead of stacking up.
export const NOTIFICATION_ID = 'ua-air-raid-alert';

// API alert type -> icon key in icons.ts.
// AIR/ARTILLERY/URBAN_FIGHTS are exact glyphs from map.ukrainealarm.com.
// There is no official glyph for CHEMICAL/NUCLEAR — fallback to 'warning'.
export const ALERT_TYPE_ICONS: Record<string, string> = {
  AIR: 'air',
  ARTILLERY: 'artillery',
  URBAN_FIGHTS: 'urbanFights'
};
export const DEFAULT_ALERT_ICON_KEY = 'warning';

// Official map.ukrainealarm.com palette (the map's "Threats" legend).
export const ALERT_LEVEL_COLORS: Record<string, string> = {
  Red: '#D55B50',
  Yellow: '#FFC200',
  default: '#60a5fa'
};

export const ALERT_TYPE_COLORS: Record<string, string> = {
  ARTILLERY: '#FF9900',
  URBAN_FIGHTS: '#00B280'
};

export const NO_ALERT_COLOR = '#3B4351';

interface IconSizeSet {
  [size: number]: string;
  16: string;
  32: string;
  48: string;
  128: string;
}

// Extension icon — the official map.ukrainealarm.com logo (map of Ukraine on a
// flag-colored background), where the map itself is recolored based on status.
export const STATUS_ICON_PATHS: Record<'none' | 'yellow' | 'red', IconSizeSet> = {
  none: { 16: 'icons/status-none-16.png', 32: 'icons/status-none-32.png', 48: 'icons/status-none-48.png', 128: 'icons/status-none-128.png' },
  yellow: { 16: 'icons/status-yellow-16.png', 32: 'icons/status-yellow-32.png', 48: 'icons/status-yellow-48.png', 128: 'icons/status-yellow-128.png' },
  red: { 16: 'icons/status-red-16.png', 32: 'icons/status-red-32.png', 48: 'icons/status-red-48.png', 128: 'icons/status-red-128.png' }
};

// Locale tag for toLocaleTimeString/localeCompare
export const LOCALE_TAGS: Record<string, string> = {
  uk: 'uk-UA',
  en: 'en-US'
};
