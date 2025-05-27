import { createContext, useReducer } from 'react';
import type { Portfolio } from '~/datatypes/portfolio';

export const PortfolioContext = createContext([] as Portfolio[]);
export const PortfolioDispatchContext = createContext({});

export function PortfolioProvider({ children }: { children: React.ReactNode }) {
  const [portfolios, dispatch] = useReducer(
    portfolioReducer,
    initialPortfolios
  );

  return (
    <PortfolioContext.Provider value={portfolios}>
      <PortfolioDispatchContext.Provider value={dispatch}>
        {children}
      </PortfolioDispatchContext.Provider>
    </PortfolioContext.Provider>
  );
};

type PortfolioActionType = {
  type: 'added' | 'changed' | 'deleted';
  portfolio: Portfolio;
}

function portfolioReducer(portfolios: Portfolio[], action: PortfolioActionType) {
  switch (action.type) {
    case 'added': {
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
      return portfolios.filter(p => p.id !== action.portfolio!.id);
    }
    default: {
      throw Error('Unknown action: ' + action.type);
    }
  }
}

const initialPortfolios = [
] as Portfolio[];