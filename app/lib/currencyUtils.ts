import type { CurrencyType } from "~/datatypes/currency";

/**
 * Convert an amount from one currency to another using exchange rates
 * @param amount - The amount to convert
 * @param fromCurrency - The source currency
 * @param toCurrency - The target currency
 * @returns The converted amount
 */
export function convertCurrency(
  amount: number,
  fromCurrency: CurrencyType,
  toCurrency: CurrencyType
): number {
  if (fromCurrency.id === toCurrency.id) {
    return amount;
  }

  // Convert to USD first (base currency), then to target currency
  // If fromCurrency is USD, no need for first conversion
  let usdAmount = amount;
  if (fromCurrency.code !== "USD") {
    usdAmount = amount / fromCurrency.exchangeRate;
  }

  // Convert from USD to target currency
  if (toCurrency.code === "USD") {
    return usdAmount;
  }

  return usdAmount * toCurrency.exchangeRate;
}

/**
 * Format a currency amount with the appropriate symbol and decimal places
 * @param amount - The amount to format
 * @param currency - The currency to format in
 * @param locale - The locale for formatting (defaults to 'en-US')
 * @returns The formatted currency string
 */
export function formatCurrency(
  amount: number,
  currency: CurrencyType,
  locale: string = "en-US"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency.code,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Get the default currency (exchange rate = 1 or isDefault = true)
 * @param currencies - Array of available currencies
 * @returns The default currency or USD fallback
 */
export function getDefaultCurrency(currencies: CurrencyType[]): CurrencyType {
  const defaultCurrency = currencies.find(c => c.isDefault) || 
    currencies.find(c => c.code === "USD") ||
    currencies.find(c => c.exchangeRate === 1);
  
  if (defaultCurrency) {
    return defaultCurrency;
  }

  // Fallback to USD if nothing found
  return {
    id: -1,
    code: "USD",
    name: "US Dollar",
    symbol: "$",
    exchangeRate: 1,
    isDefault: true,
    lastUpdated: new Date().toISOString(),
  };
}
