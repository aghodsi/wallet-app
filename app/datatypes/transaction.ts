export type TransactionType = {
  id: number;
  portfolioId: number;
  targetPortfolioId?: number; // For transfers between portfolios
  date: string;
  type: "Buy" | "Sell" | "Dividend" | "Deposit" | "Withdraw";
  asset: string;
  quantity: number;
  price: number;
  commision: number;
  tax: number;
  recurrence?: string; // cron expression for recurring transactions
  tags: string;
  notes?: string;
};
