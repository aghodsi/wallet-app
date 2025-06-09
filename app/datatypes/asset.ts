export type AssetType = {
  id: number;
  symbol: string;
  currency: string;
  exchangeName: string;
  fullExchangeName: string;
  instrumentType: string;
  timezone: string;
  exchangeTimezoneName: string;
  longName: string;
  shortName: string;
  quotes: {
    date: string; // toISOString() format;
    high?: number;
    volume?: number;
    open?: number;
    low?: number;
    close?: number;
    adjclose?: number;
  }[];
  events?: {
    dividends: {
      amount: number;
      date: string; // epoch time in milliseconds
    }[];
    splits: {
      date: string; // epoch time in milliseconds
      numerator: number;
      denominator: number;
      splitRatio: string;
    }[];
  };
  isFromApi: boolean; // true if fetched from API, false if manually created
  lastUpdated: string;
};
