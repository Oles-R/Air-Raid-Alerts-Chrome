// Included in popup.html's <head>, before body renders, to avoid a "flash" of
// the wrong theme. Bundled as its own entry (theme.js) so it can load ahead
// of the rest of the popup bundle.
import { applyTheme, resolveTheme } from '../lib/theme';

function initTheme(): void {
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
