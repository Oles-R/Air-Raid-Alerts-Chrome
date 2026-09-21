// Maps the Ukrainian State-level (oblast) region names exactly as returned by
// the alert API to a translation key suffix (region_<key> in
// _locales/*/messages.json). Verified against a live snapshot of the proxy —
// these 26 names (24 oblasts + Crimea + Kyiv city) are the complete State-level
// set and change essentially never, so hand-maintaining them here is fine.
//
// District/community-level names (~1600 of them) are NOT covered — there's no
// practical way to hand-translate that many, so they fall back to their
// original Ukrainian name in every UI language (see translateRegionName below).
import { t } from './i18n';

const REGION_NAME_KEYS: Record<string, string> = {
  'Автономна Республіка Крим': 'crimea',
  'Вінницька область': 'vinnytska',
  'Волинська область': 'volynska',
  'Дніпропетровська область': 'dnipropetrovska',
  'Донецька область': 'donetska',
  'Житомирська область': 'zhytomyrska',
  'Закарпатська область': 'zakarpatska',
  'Запорізька область': 'zaporizka',
  'Івано-Франківська область': 'ivano_frankivska',
  'Київська область': 'kyivska',
  'м. Київ': 'kyiv_city',
  'Кіровоградська область': 'kirovohradska',
  'Луганська область': 'luhanska',
  'Львівська область': 'lvivska',
  'Миколаївська область': 'mykolaivska',
  'Одеська область': 'odeska',
  'Полтавська область': 'poltavska',
  'Рівненська область': 'rivnenska',
  'Сумська область': 'sumska',
  'Тернопільська область': 'ternopilska',
  'Харківська область': 'kharkivska',
  'Херсонська область': 'khersonska',
  'Хмельницька область': 'khmelnytska',
  'Черкаська область': 'cherkaska',
  'Чернівецька область': 'chernivetska',
  'Чернігівська область': 'chernihivska'
};

// Returns the localized name for a known oblast-level region, otherwise the
// original (Ukrainian) name unchanged — a safe no-op for anything we don't
// have a translation for, including every district/community.
export function translateRegionName(lang: string, name: string): string {
  const key = REGION_NAME_KEYS[name];
  return key ? t(lang, `region_${key}`) : name;
}
