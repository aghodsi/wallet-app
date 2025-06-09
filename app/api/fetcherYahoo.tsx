import yahooFinance from 'yahoo-finance2';

export async function searchSymbol(symbol: string) {
  return yahooFinance.search(symbol);
}

export async function getQuote(symbol: string) {
  return yahooFinance.quote(symbol);
}

export type ValidInterval = "1d" | "1m" | "2m" | "5m" | "15m" | "30m" | "60m" | "90m" | "1h" | "5d" | "1wk" | "1mo" | "3mo";


export async function getHistoricalData(
  symbol: string,
  period1: string,
  period2?: string,
  interval: ValidInterval = "1d"
) {
  return yahooFinance.chart(symbol, {
    period1: period1,
    period2: period2 || new Date().toISOString(),
    interval: interval,
  });
}


    