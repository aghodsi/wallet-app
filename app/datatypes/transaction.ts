export type TransactionType = {
  id: number;
  portfolioId: number;
  targetPortfolioId?: number; // For transfers between portfolios
  date: string;
  type: "Buy" | "Sell" | "Dividend" | "Deposit" | "Withdraw";
  asset: {
    symbol: string; 
    isFetchedFromApi: boolean; // true if fetched from API, false if manually created
  };
  quantity: number;
  price: number;
  commision: number;
  tax: number;
  recurrence?: string; // cron expression for recurring transactions
  tags: string;
  notes?: string;
  isHousekeeping?: boolean; // true for housekeeping transactions, false for regular transactions
  isCreatedByUser?: boolean; // true if created by user, false if imported or automated
};
