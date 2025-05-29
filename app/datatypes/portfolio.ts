import type { CurrencyType } from "./currency";
import type { InstitutionType } from "./institution";

export type PortfolioType = {
  id: number;
  name: string;
  currency: CurrencyType;
  symbol: string;
  type: "Current" | "Saving" | "Investment";
  institution: InstitutionType;
  tags?: string;
  selected: boolean;
};
