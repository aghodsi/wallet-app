import { createContext, useContext, useReducer } from 'react';
import type { PortfolioType } from '~/datatypes/portfolio';

export const PortfoliosContext = createContext([] as PortfolioType[]);
export const PortfolioDispatchContext = createContext({} as React.Dispatch<PortfolioActionType>);

export function PortfolioProvider({ children, initialPortfolios }: { children: React.ReactNode, initialPortfolios: PortfolioType[] }) {
  const [portfolios, dispatch] = useReducer(
    portfolioReducer,
    initialPortfolios.sort((a, b) => a.name.localeCompare(b.name))
  );

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
