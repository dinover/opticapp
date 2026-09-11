/*
 * Idioma de la interfaz (español / inglés). El estado vive en LanguageContext;
 * acá está lo que también se usa fuera de React: la detección inicial, la
 * persistencia y el idioma "actual" que leen el interceptor de axios y el
 * ErrorBoundary.
 */

export type Lang = 'es' | 'en';

const LANG_KEY = 'opticapp.lang';

/** Idioma guardado por el usuario; si no hay, el del navegador (cualquier variante de español → es). */
export function detectLang(): Lang {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved === 'es' || saved === 'en') return saved;
  } catch {
    /* storage bloqueado: seguimos con el navegador */
  }
  return (navigator.language || 'es').toLowerCase().startsWith('es') ? 'es' : 'en';
}

export function saveLang(lang: Lang) {
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch {
    /* sin storage el idioma no se recuerda, nada más */
  }
}

/** Locale para fechas y números. */
export const localeFor = (lang: Lang) => (lang === 'en' ? 'en-US' : 'es-UY');

let currentLang: Lang = detectLang();

export const getCurrentLang = () => currentLang;
export const setCurrentLang = (lang: Lang) => {
  currentLang = lang;
};
