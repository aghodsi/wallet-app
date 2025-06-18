import { createContext, useContext, useState, useCallback } from "react";
import type { CurrencyType } from "~/datatypes/currency";

interface CurrencyDisplayContextType {
  showOriginalCurrency: boolean;
  toggleCurrencyDisplay: () => void;
  getDisplayCurrency: (transactionCurrency: CurrencyType, portfolioCurrency: CurrencyType) => CurrencyType;
}

const CurrencyDisplayContext = createContext<CurrencyDisplayContextType | undefined>(undefined);

interface CurrencyDisplayProviderProps {
  children: React.ReactNode;
}

export function CurrencyDisplayProvider({ children }: CurrencyDisplayProviderProps) {
  const [showOriginalCurrency, setShowOriginalCurrency] = useState(false);

  const toggleCurrencyDisplay = useCallback(() => {
    setShowOriginalCurrency(prev => !prev);
  }, []);

  const getDisplayCurrency = useCallback((transactionCurrency: CurrencyType, portfolioCurrency: CurrencyType) => {
    return showOriginalCurrency ? transactionCurrency : portfolioCurrency;
  }, [showOriginalCurrency]);

  const value = {
    showOriginalCurrency,
    toggleCurrencyDisplay,
    getDisplayCurrency,
  };

  return (
    <CurrencyDisplayContext.Provider value={value}>
      {children}
    </CurrencyDisplayContext.Provider>
  );
}

export function useCurrencyDisplay() {
  const context = useContext(CurrencyDisplayContext);
  if (!context) {
    throw new Error("useCurrencyDisplay must be used within a CurrencyDisplayProvider");
  }
  return context;
}
