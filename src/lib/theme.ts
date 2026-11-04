import type { Theme } from '../types';

const THEME_KEY = 'personal-tracker:theme';

export function readStoredTheme(fallback: Theme = 'light'): Theme {
  try {
    const value = localStorage.getItem(THEME_KEY);
    return value === 'dark' ? 'dark' : value === 'light' ? 'light' : fallback;
  } catch {
    return fallback;
  }
}

export function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', theme === 'dark' ? '#111111' : '#F7F7F5');
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Theme still applies for this session when storage is unavailable.
  }
}
