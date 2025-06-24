/**
 * Minimal i18n runtime for UI string lookup and locale switching.
 */
const LOCALE_KEY = 'lab-locale';
let locale = localStorage.getItem(LOCALE_KEY) || navigator.language.split('-')[0] || 'en';
let messages: Record<string, string> = {};
const listeners: (() => void)[] = [];

export async function setLocale(newLocale: string) {
  locale = newLocale;
  localStorage.setItem(LOCALE_KEY, locale);
  messages = await fetchStrings(locale);
  document.documentElement.setAttribute('lang', locale);
  document.documentElement.setAttribute('dir', isRTL(locale) ? 'rtl' : 'ltr');
  listeners.forEach(fn => fn());
}

export function t(key: string): string {
  return messages[key] || key;
}

export function onLocaleChange(fn: () => void) {
  listeners.push(fn);
}

function isRTL(loc: string) {
  return ['ar', 'he', 'fa', 'ur'].includes(loc);
}

async function fetchStrings(loc: string): Promise<Record<string, string>> {
  try {
    const res = await fetch(`./src/i18n/strings/${loc}.json`);
    return await res.json();
  } catch {
    const res = await fetch(`./src/i18n/strings/en.json`);
    return await res.json();
  }
}

// Initial load
setLocale(locale);
