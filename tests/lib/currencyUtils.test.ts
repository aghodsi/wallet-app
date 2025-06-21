import {
  convertCurrency,
  formatCurrency,
  getDefaultCurrency
} from '../../app/lib/currencyUtils';
import type { CurrencyType } from '../../app/datatypes/currency';

const USD: CurrencyType = {
  id: 1,
  code: 'USD',
  name: 'US Dollar',
  symbol: '$',
  exchangeRate: 1,
  isDefault: true,
  lastUpdated: new Date().toISOString(),
};

const EUR: CurrencyType = {
  id: 2,
  code: 'EUR',
  name: 'Euro',
  symbol: '€',
  exchangeRate: 1.2,
  isDefault: false,
  lastUpdated: new Date().toISOString(),
};

const JPY: CurrencyType = {
  id: 3,
  code: 'JPY',
  name: 'Japanese Yen',
  symbol: '¥',
  exchangeRate: 0.009,
  isDefault: false,
  lastUpdated: new Date().toISOString(),
};

describe('currencyUtils', () => {
  describe('convertCurrency', () => {
    it('should return the same amount if currencies are the same', () => {
      expect(convertCurrency(100, USD, USD)).toBe(100);
      expect(convertCurrency(50, EUR, EUR)).toBe(50);
    });

    it('should convert from non-USD to USD', () => {
      expect(convertCurrency(120, EUR, USD)).toBeCloseTo(100);
      expect(convertCurrency(9000, JPY, USD)).toBeCloseTo(9000 * JPY.exchangeRate);
    });

    it('should convert from USD to non-USD', () => {
      expect(convertCurrency(100, USD, EUR)).toBeCloseTo(100 * EUR.exchangeRate);
      expect(convertCurrency(100, USD, JPY)).toBeCloseTo(100 * JPY.exchangeRate);
    });

    it('should convert between two non-USD currencies', () => {
      // EUR -> USD -> JPY
      const eurAmount = 240;
      const usdAmount = eurAmount / EUR.exchangeRate;
      const expected = usdAmount * JPY.exchangeRate;
      expect(convertCurrency(eurAmount, EUR, JPY)).toBeCloseTo(expected);
    });

    it('should handle zero and negative amounts', () => {
      expect(convertCurrency(0, USD, EUR)).toBe(0);
      expect(convertCurrency(-100, USD, EUR)).toBeCloseTo(-100 * EUR.exchangeRate);
    });
  });

  describe('formatCurrency', () => {
    it('should format USD correctly', () => {
      expect(formatCurrency(1234.56, USD)).toMatch(/\$1,234\.56/);
    });

    it('should format EUR correctly', () => {
      expect(formatCurrency(1234.56, EUR)).toMatch(/€1,234\.56/);
    });

    it('should format JPY correctly', () => {
      expect(formatCurrency(1234.56, JPY)).toMatch(/¥1,234\.56/);
    });

    it('should respect locale parameter', () => {
      expect(formatCurrency(1234.56, EUR, 'de-DE')).toMatch(/1.234,56 €/);
    });

    it('should always show two decimal places', () => {
      expect(formatCurrency(1, USD)).toMatch(/1\.00/);
      expect(formatCurrency(1.5, USD)).toMatch(/1\.50/);
    });
  });

  describe('getDefaultCurrency', () => {
    it('should return the currency with isDefault=true', () => {
      const currencies = [USD, EUR, JPY];
      expect(getDefaultCurrency(currencies)).toBe(USD);
    });

    it('should return USD if no default is set but USD exists', () => {
      const currencies = [{ ...USD, isDefault: false }, EUR, JPY];
      expect(getDefaultCurrency(currencies)).toMatchObject({ code: 'USD' });
    });

    it('should return currency with exchangeRate=1 if no default or USD', () => {
      const GBP = { id: 4, code: 'GBP', name: 'Pound', symbol: '£', exchangeRate: 1, isDefault: false, lastUpdated: new Date().toISOString() };
      const currencies = [EUR, JPY, GBP];
      expect(getDefaultCurrency(currencies)).toBe(GBP);
    });

    it('should return fallback USD if nothing matches', () => {
      const currencies: CurrencyType[] = [];
      const result = getDefaultCurrency(currencies);
      expect(result.code).toBe('USD');
      expect(result.isDefault).toBe(true);
    });
  });
});
