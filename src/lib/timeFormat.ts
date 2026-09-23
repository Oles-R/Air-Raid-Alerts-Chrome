// Time display preference: '24' | '12' | 'system' (follow the locale's default).
// Shared by popup.ts and content.ts so every rendered time respects the setting.
import { LOCALE_TAGS } from './constants';

export type TimeFormatPref = '24' | '12' | 'system' | string | undefined;

export function formatTime(
  date: Date,
  lang: string,
  pref: TimeFormatPref,
  options: Intl.DateTimeFormatOptions = {}
): string {
  const opts: Intl.DateTimeFormatOptions = { ...options };
  if (pref === '12' || pref === '24') {
    // hourCycle instead of hour12 — hour12:false yields "24:05" instead of "00:05" in some locales
    opts.hourCycle = pref === '12' ? 'h12' : 'h23';
  }
  return date.toLocaleTimeString(LOCALE_TAGS[lang], opts);
}
