// Minimal i18n runtime (transpiled from TypeScript)
const LOCALE_KEY = 'lab-locale';
let locale = localStorage.getItem(LOCALE_KEY) || navigator.language.split('-')[0] || 'en';
let messages = {};
const listeners = [];

export async function setLocale(newLocale) {
  locale = newLocale;
  localStorage.setItem(LOCALE_KEY, locale);
  messages = await fetchStrings(locale);
  document.documentElement.setAttribute('lang', locale);
  document.documentElement.setAttribute('dir', isRTL(locale) ? 'rtl' : 'ltr');
  listeners.forEach(fn => fn());
}

export function t(key) {
  return messages[key] || key;
}

export function onLocaleChange(fn) {
  listeners.push(fn);
}

function isRTL(loc) {
  return ['ar', 'he', 'fa', 'ur'].includes(loc);
}

async function fetchStrings(loc) {
  try {
    const res = await fetch(`./src/i18n/strings/${loc}.json`);
    return await res.json();
  } catch (e) {
    console.warn('Failed to load locale strings', e);
    const res = await fetch(`./src/i18n/strings/en.json`);
    return await res.json();
  }
}

// Initial load
setLocale(locale);
