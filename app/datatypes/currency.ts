export type CurrencyType = {
  id: number;
  code: string;
  name: string;
  symbol: string;
  exchangeRate: number;
  isDefault: boolean;
  lastUpdated: string;
};
