// Applies the popup's theme: 'dark' | 'light' | 'system'. Included in
// popup.html's <head>, before body renders, to avoid a "flash" of the wrong theme.
function resolveTheme(pref) {
  if (pref === 'light' || pref === 'dark') return pref;
  return (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
}

function initTheme() {
  chrome.storage.local.get(['theme'], (result) => {
    applyTheme(resolveTheme(result.theme || 'system'));
  });

  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      chrome.storage.local.get(['theme'], (result) => {
        if ((result.theme || 'system') === 'system') applyTheme(resolveTheme('system'));
      });
    });
  }
}

initTheme();
