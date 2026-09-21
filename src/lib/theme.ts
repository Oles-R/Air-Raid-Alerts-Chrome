// Applies the popup's theme: 'dark' | 'light' | 'system'.
export type ThemePref = 'dark' | 'light' | 'system' | string | undefined;

export function resolveTheme(pref: ThemePref): 'dark' | 'light' {
  if (pref === 'light' || pref === 'dark') return pref;
  return (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
}

export function applyTheme(theme: 'dark' | 'light'): void {
  document.documentElement.setAttribute('data-theme', theme);
}
