// Maps the free-text "reason" strings the alert API attaches to individual
// alert levels (e.g. "Дронова загроза (жовтий рівень)") to a translation key
// suffix (alertReason_<key> in _locales/*/messages.json).
//
// Unlike region names, this set isn't guaranteed to be fixed — it's whatever
// text the upstream API happens to send. translateAlertReason() falls back to
// the original string for anything not in this map, so an unrecognized reason
// still displays (untranslated) instead of disappearing. If a new reason shows
// up in the wild, add it here and to both messages.json files.
import { t } from './i18n';

const ALERT_REASON_KEYS: Record<string, string> = {
  'Дронова загроза (жовтий рівень)': 'drone_yellow',
  'Ракетна загроза (червоний рівень)': 'missile_red'
};

export function translateAlertReason(lang: string, reason: string): string {
  const key = ALERT_REASON_KEYS[reason];
  return key ? t(lang, `alertReason_${key}`) : reason;
}
