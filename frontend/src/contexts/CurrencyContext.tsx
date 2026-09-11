import React, { createContext, useContext, useState } from 'react';
import { useLanguage } from './LanguageContext';

type Currency = 'UYU' | 'USD';

interface CurrencyContextType {
  currency: Currency;
  toggleCurrency: () => void;
  fmt: (n: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { locale } = useLanguage();
  const [currency, setCurrency] = useState<Currency>(
    () => (localStorage.getItem('currency') as Currency) || 'UYU'
  );

  const toggleCurrency = () => {
    const next: Currency = currency === 'UYU' ? 'USD' : 'UYU';
    setCurrency(next);
    localStorage.setItem('currency', next);
  };

  // El formato (separadores, símbolo) sigue al idioma de la interfaz. En inglés
  // Intl mostraría "UYU 1,234.00": se usa el signo del peso uruguayo ($U), que
  // no se confunde con el dólar.
  const fmt = (n: number) => {
    if (currency === 'UYU' && locale.startsWith('en')) {
      return `$U ${new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)}`;
    }
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(n);
  };

  return (
    <CurrencyContext.Provider value={{ currency, toggleCurrency, fmt }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = (): CurrencyContextType => {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used within CurrencyProvider');
  return ctx;
};
