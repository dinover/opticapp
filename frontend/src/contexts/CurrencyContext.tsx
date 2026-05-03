import React, { createContext, useContext, useState } from 'react';

type Currency = 'UYU' | 'USD';

interface CurrencyContextType {
  currency: Currency;
  toggleCurrency: () => void;
  fmt: (n: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrency] = useState<Currency>(
    () => (localStorage.getItem('currency') as Currency) || 'UYU'
  );

  const toggleCurrency = () => {
    const next: Currency = currency === 'UYU' ? 'USD' : 'UYU';
    setCurrency(next);
    localStorage.setItem('currency', next);
  };

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-UY', { style: 'currency', currency }).format(n);

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
