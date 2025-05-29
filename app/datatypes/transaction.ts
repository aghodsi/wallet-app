export type TransactionType = {
  id: number;
  portfolioId: number;
  date: string;
  type: "Buy" | "Sell" | "Divident" | "Deposit" | "Withdrag";
  asset: string;
  quantity: number;
  price: number;
  commision: number;
  tax: number;
  tags: string;
};
