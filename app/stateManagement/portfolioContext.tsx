import { createContext, useContext, useReducer, useEffect, useState } from 'react';
import { useAuth } from '~/contexts/authContext';
import type { PortfolioType } from '~/datatypes/portfolio';
import { apiGet, handleApiResponse } from '~/lib/api-client';

export const PortfoliosContext = createContext([] as PortfolioType[]);
export const PortfolioDispatchContext = createContext({} as React.Dispatch<PortfolioActionType>);

export function PortfolioProvider({ children, initialPortfolios = [] }: { children: React.ReactNode, initialPortfolios?: PortfolioType[] }) {
    const { user, isLoading: authLoading, session } = useAuth();

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

    useEffect(() => {
    if (!authLoading && mounted) {
      if (!user || !session) {
        // User logged out - clear portfolios
        console.log('🔄 User logged out, clearing portfolio data');
        dispatch({ type: 'reset', portfolios: [] });
        if (typeof window !== 'undefined') {
          localStorage.removeItem('selectedPortfolioId');
        }
      } else {
        // User logged in - fetch fresh portfolio data for this user
        console.log('🔄 User logged in, fetching portfolios for:', user.id);
        
        const loadUserPortfolios = async () => {
          try {
            const response = await apiGet('/api/portfolios');
            const data = await handleApiResponse(response);
            const portfoliosWithRelations = data.portfolios;
            
            // Map the fetched data to PortfolioType format
            const mappedPortfolios: PortfolioType[] = portfoliosWithRelations?.map((item: any) => ({
              id: item.portfolio.id,
              name: item.portfolio.name,
              currency: item.currency ? {
                id: item.currency.id,
                code: item.currency.code,
                name: item.currency.name,
                symbol: item.currency.symbol,
                exchangeRate: item.currency.exchangeRate || 1,
                isDefault: Boolean(item.currency.isDefault),
                lastUpdated: item.currency.lastUpdated,
              } : {
                id: 1,
                code: 'USD',
                name: 'US Dollar',
                symbol: '$',
                exchangeRate: 1,
                isDefault: false,
                lastUpdated: '0',
              },
              symbol: item.portfolio.symbol || '',
              type: item.portfolio.type,
              institution: item.institution ? {
                id: item.institution.id,
                name: item.institution.name,
                isDefault: Boolean(item.institution.isDefault),
                website: item.institution.website || '',
                apiKey: item.institution.apiKey || '',
                apiSecret: item.institution.apiSecret || '',
                apiUrl: item.institution.apiUrl || '',
                lastUpdated: item.institution.lastUpdated || '',
                isNew: false,
              } : {
                id: 1,
                name: 'Default Institution',
                isDefault: true,
                website: '',
                apiKey: '',
                apiSecret: '',
                apiUrl: '',
                lastUpdated: '0',
                isNew: false,
              },
              cashBalance: item.portfolio.cashBalance || 0,
              tags: item.portfolio.tags || '',
              selected: false, // Will be set properly later
              createdAt: item.portfolio.createdAt,
            })) || [];

            // Add "All" portfolio if user has multiple portfolios
            if (mappedPortfolios && mappedPortfolios.length > 1) {
              try {
                const defaultCurrency = data.defaultCurrency ? {
                  id: data.defaultCurrency.id,
                  code: data.defaultCurrency.code,
                  name: data.defaultCurrency.name,
                  symbol: data.defaultCurrency.symbol,
                  exchangeRate: data.defaultCurrency.exchangeRate ?? 1,
                  lastUpdated: data.defaultCurrency.lastUpdated,
                  isDefault: data.defaultCurrency.isDefault === 1,
                  isNew: false,
                } : {
                  id: -1,
                  code: "USD",
                  name: "US Dollar",
                  symbol: "$",
                  exchangeRate: 1,
                  lastUpdated: "0",
                  isDefault: true,
                };

                mappedPortfolios.push({
                  id: -1, // Use a negative ID to indicate this is a special "All" portfolio
                  name: "All",
                  currency: defaultCurrency ?? {
                    id: -1,
                    code: "USD",
                    name: "US Dollar",
                    symbol: "$",
                    exchangeRate: 1,
                    lastUpdated: "0",
                    isDefault: true,
                  },
                  symbol: "GalleryVerticalEnd",
                  type: "Investment",
                  institution: {
                    id: -1,
                    name: "All Institutions",
                    isDefault: true,
                    website: "",
                    apiKey: "",
                    apiSecret: "",
                    apiUrl: "",
                    lastUpdated: "0",
                    isNew: false,
                  },
                  cashBalance: 0,
                  tags: "",
                  selected: false, // Default to false, let state management handle selection
                  createdAt: "0",
                });
              } catch (error) {
                console.error('Failed to fetch default currency for All portfolio:', error);
              }
            }
            
            dispatch({ type: 'refresh', portfolios: mappedPortfolios });
          } catch (error) {
            console.error('Failed to fetch portfolios:', error);
            // Still dispatch empty portfolios to clear any stale data
            dispatch({ type: 'refresh', portfolios: [] });
          }
        };

        loadUserPortfolios();
      }
    }
  }, [user, session, authLoading, mounted]);

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
  type: 'added' | 'changed' | 'deleted' | "selected" | "reset" | "refresh";
  portfolio?: PortfolioType;
  portfolios?: PortfolioType[];
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
      return [...portfolios, action.portfolio!];
    }
    case 'changed': {
      return portfolios.map(p => {
        if (p.id === action.portfolio!.id) {
          return action.portfolio!;
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
    case 'reset': {
      console.log("Resetting portfolios:", action.portfolios);
      return action.portfolios || [];
    }
    case 'refresh': {
      console.log("Refreshing portfolios:", action.portfolios);
      return action.portfolios || portfolios;
    }
    default: {
      throw Error('Unknown action: ' + action.type);
    }
  }
}
