// Lightweight i18n helper, shared by popup.js, background.js and content.js.
const DEFAULT_LANGUAGE = 'uk';
const SUPPORTED_LANGUAGES = ['uk', 'en'];

function detectSystemLanguage() {
  let uiLang = '';
  try {
    if (typeof chrome !== 'undefined' && chrome.i18n && chrome.i18n.getUILanguage) {
      uiLang = chrome.i18n.getUILanguage();
    }
  } catch (e) { /* ignore */ }
  if (!uiLang && typeof navigator !== 'undefined' && navigator.language) {
    uiLang = navigator.language;
  }
  return uiLang.toLowerCase().startsWith('uk') ? 'uk' : 'en';
}

function resolveLanguage(pref) {
  const lang = (!pref || pref === 'system') ? detectSystemLanguage() : pref;
  return SUPPORTED_LANGUAGES.includes(lang) ? lang : DEFAULT_LANGUAGE;
}

function getLanguage(callback) {
  chrome.storage.local.get(['language'], (result) => callback(resolveLanguage(result.language)));
}

function t(lang, key, vars) {
  const dict = TRANSLATIONS[lang] || TRANSLATIONS[DEFAULT_LANGUAGE];
  let str = dict[key] || TRANSLATIONS[DEFAULT_LANGUAGE][key] || key;
  if (vars) {
    Object.keys(vars).forEach((k) => { str = str.replace(`{${k}}`, vars[k]); });
  }
  return str;
}

// DOM pages only (popup.html) — applies translations to static markup.
function applyStaticI18n(lang, root) {
  root = root || document;
  root.querySelectorAll('[data-i18n]').forEach((el) => {
    el.textContent = t(lang, el.getAttribute('data-i18n'));
  });
  root.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    el.placeholder = t(lang, el.getAttribute('data-i18n-placeholder'));
  });
  root.querySelectorAll('[data-i18n-title]').forEach((el) => {
    el.title = t(lang, el.getAttribute('data-i18n-title'));
  });
}
