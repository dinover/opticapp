import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { detectLang, localeFor, saveLang, setCurrentLang, type Lang } from '../utils/lang';

interface LanguageContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  /** Devuelve el texto en el idioma actual: t('Clientes', 'Clients'). */
  t: (es: string, en: string) => string;
  /** Locale para fechas y números (es-UY / en-US). */
  locale: string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

/**
 * Idioma de toda la interfaz: landing, login y la app. Se elige desde la
 * landing, el login/registro, la barra superior o Ajustes, y se recuerda.
 */
export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Lang>(detectLang);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    // Se actualiza antes del re-render para que los requests que salgan ya
    // traduzcan sus mensajes al idioma nuevo.
    setCurrentLang(next);
    saveLang(next);
    setLangState(next);
  }, []);

  const value = useMemo<LanguageContextType>(() => ({
    lang,
    setLang,
    t: (es, en) => (lang === 'en' ? en : es),
    locale: localeFor(lang),
  }), [lang, setLang]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = (): LanguageContextType => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage debe usarse dentro de un LanguageProvider');
  return ctx;
};
