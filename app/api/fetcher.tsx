import yahooFinance from 'yahoo-finance2';

type StockSearchQuote = {
  exchange?: string;
  shortname?: string;
  quoteType?: string;
  symbol?: string;
  index: string;
  score?: number;
  typeDisp?: string;
  longname?: string;
  isYahooFinance: boolean;
  name?: string;
  permalink?: string;
}

type StockSearchResult = {
  explains: any[];
  count: number;
  quotes: StockSearchQuote[];
  news: any[];
  nav: any[];
  lists: any[];
  researchReports: any[];
  totalTime: number;
  timeTakenForQuotes: number;
  timeTakenForNews: number;
  timeTakenForAlgowatchlist: number;
  timeTakenForPredefinedScreener: number;
  timeTakenForCrunchbase: number;
  timeTakenForNav: number;
  timeTakenForResearchReports: number;
}

export async function searchSumbol(symbol: string) {
  return yahooFinance.search(symbol);
}
    