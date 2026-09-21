// Maps the free-text "reason" strings the alert API attaches to individual
// alert levels (e.g. "Дронова загроза (жовтий рівень)") to a translation key
// suffix (alertReason_<key> in _locales/*/messages.json).
//
// Unlike region names, this set isn't guaranteed to be fixed — it's whatever
// text the upstream API happens to send. translateAlertReason() falls back to
// the original string for anything not in this map, so an unrecognized reason
// still displays (untranslated) instead of disappearing. If a new reason shows
// up in the wild, add it here and to both messages.json files.
const ALERT_REASON_KEYS = {
  'Дронова загроза (жовтий рівень)': 'drone_yellow',
  'Ракетна загроза (червоний рівень)': 'missile_red'
};

function translateAlertReason(lang, reason) {
  const key = ALERT_REASON_KEYS[reason];
  return key ? t(lang, `alertReason_${key}`) : reason;
}
