import { createContext, useContext, useReducer, useEffect, useState } from 'react';
import type { PortfolioType } from '~/datatypes/portfolio';

export const PortfoliosContext = createContext([] as PortfolioType[]);
export const PortfolioDispatchContext = createContext({} as React.Dispatch<PortfolioActionType>);

export function PortfolioProvider({ children, initialPortfolios }: { children: React.ReactNode, initialPortfolios: PortfolioType[] }) {
  const [mounted, setMounted] = useState(false);

  // Get stored selected portfolio ID from localStorage (only after mount)
  const getStoredSelectedPortfolioId = (): number | null => {
    if (!mounted || typeof window === 'undefined') return null;
    const stored = localStorage.getItem('selectedPortfolioId');
    return stored ? parseInt(stored, 10) : null;
  };

  // Initialize portfolios with server-safe selection state
  const initializePortfolios = (portfolios: PortfolioType[]): PortfolioType[] => {
    const sortedPortfolios = portfolios.sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
    
    // On server or before mount, use default selection logic
    const hasSelectedPortfolio = sortedPortfolios.some(p => p.selected);
    if (!hasSelectedPortfolio && sortedPortfolios.length > 0) {
      const allPortfolio = sortedPortfolios.find(p => p.id === -1);
      if (allPortfolio) {
        return sortedPortfolios.map(p => ({ ...p, selected: p.id === -1 }));
      } else {
        return sortedPortfolios.map((p, index) => ({ ...p, selected: index === 0 }));
      }
    }
    
    return sortedPortfolios;
  };

  const [portfolios, dispatch] = useReducer(
    portfolioReducer,
    initialPortfolios,
    initializePortfolios
  );

  // Set mounted flag and sync with localStorage after hydration
  useEffect(() => {
    setMounted(true);
    
    // Sync with localStorage after mount
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('selectedPortfolioId');
      if (stored) {
        const storedId = parseInt(stored, 10);
        const hasStoredPortfolio = portfolios.some(p => p.id === storedId);
        if (hasStoredPortfolio) {
          // Update selection to match localStorage
          dispatch({
            type: 'selected',
            portfolio: portfolios.find(p => p.id === storedId)!
          });
        }
      }
    }
  }, []);

  // Store selected portfolio ID whenever it changes (but only after mount)
  useEffect(() => {
    if (mounted) {
      const selectedPortfolio = portfolios.find(p => p.selected);
      if (selectedPortfolio && typeof window !== 'undefined') {
        localStorage.setItem('selectedPortfolioId', selectedPortfolio.id.toString());
      }
    }
  }, [portfolios, mounted]);

  return (
    //This is all the protfolios that the user has 
    <PortfoliosContext.Provider value={portfolios}>
      {/* // This is the dispatch function to update the portfolios */}
      <PortfolioDispatchContext.Provider value={dispatch}>
        {children}
      </PortfolioDispatchContext.Provider>
    </PortfoliosContext.Provider>
  );
};

type PortfolioActionType = {
  type: 'added' | 'changed' | 'deleted' | "selected";
  portfolio: PortfolioType;
}

export function userPortfolios() {
  return useContext(PortfoliosContext);
}

export function usePortfolioDispatch() {
  return useContext(PortfolioDispatchContext);
}

function portfolioReducer(portfolios: PortfolioType[], action: PortfolioActionType) {
  switch (action.type) {
    case 'added': {
      console.log("Added portfolio:", action.portfolio);
      return [...portfolios, action.portfolio];
    }
    case 'changed': {
      return portfolios.map(p => {
        if (p.id === action.portfolio!.id) {
          return action.portfolio;
        } else {
          return p;
        }
      });
    }
    case 'deleted': {
      console.log("Deleted portfolio:", action.portfolio);
      return portfolios.filter(p => p.id !== action.portfolio!.id);
    }
    case 'selected': {
      // This action is not modifying the portfolios, so we just return the current state
      console.log("Selected portfolio:", action.portfolio);
      return portfolios.map(p => {
        if (p.id === action.portfolio!.id){
          return { ...p, selected: true };
        } else {
          return { ...p, selected: false };
        }
      });
    }
    default: {
      throw Error('Unknown action: ' + action.type);
    }
  }
}
