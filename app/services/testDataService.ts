import type { AssetType } from "~/datatypes/asset";
import type { TransactionType } from "~/datatypes/transaction";
import type { PortfolioType } from "~/datatypes/portfolio";
import type { InstitutionType } from "~/datatypes/institution";
import {
  createAsset,
  createInstitution,
  createPortfolio,
  createTransaction,
  fetchCurrencies,
  fetchDefaultCurrency,
} from "~/db/actions";

export interface TestDataConfig {
  portfolioCount: number;
  transactionsPerPortfolio: number;
  includeRecurring: boolean;
  includeDividends: boolean;
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
}

const DEFAULT_CONFIG: TestDataConfig = {
  portfolioCount: 2,
  transactionsPerPortfolio: 10,
  includeRecurring: true,
  includeDividends: true,
  dateRange: {
    startDate: new Date(new Date().getFullYear() - 1, 0, 1), // Start of last year
    endDate: new Date(), // Today
  },
};

// Test asset data
const TEST_ASSETS: Omit<AssetType, "id" | "lastUpdated">[] = [
  {
    symbol: "AAPL",
    currency: "USD",
    exchangeName: "NMS",
    fullExchangeName: "NASDAQ Stock Market",
    instrumentType: "EQUITY",
    timezone: "EST",
    exchangeTimezoneName: "America/New_York",
    longName: "Apple Inc.",
    shortName: "Apple Inc.",
    quotes: generateQuoteHistory("AAPL", 150, 200),
    events: {
      dividends: [
        { amount: 0.24, date: "1699459200000" }, // Nov 8, 2023
        { amount: 0.23, date: "1691616000000" }, // Aug 9, 2023
      ],
      splits: []
    },
    isFromApi: false,
  },
  {
    symbol: "GOOGL",
    currency: "USD",
    exchangeName: "NMS",
    fullExchangeName: "NASDAQ Stock Market",
    instrumentType: "EQUITY",
    timezone: "EST",
    exchangeTimezoneName: "America/New_York",
    longName: "Alphabet Inc. Class A",
    shortName: "Alphabet Inc.",
    quotes: generateQuoteHistory("GOOGL", 120, 180),
    events: {
      dividends: [],
      splits: []
    },
    isFromApi: false,
  },
  {
    symbol: "TSLA",
    currency: "USD",
    exchangeName: "NMS",
    fullExchangeName: "NASDAQ Stock Market",
    instrumentType: "EQUITY",
    timezone: "EST",
    exchangeTimezoneName: "America/New_York",
    longName: "Tesla, Inc.",
    shortName: "Tesla",
    quotes: generateQuoteHistory("TSLA", 180, 300),
    events: {
      dividends: [],
      splits: [
        { 
          date: "1660867200000", // Aug 18, 2022
          numerator: 3,
          denominator: 1,
          splitRatio: "3:1"
        }
      ]
    },
    isFromApi: false,
  },
  {
    symbol: "MSFT",
    currency: "USD",
    exchangeName: "NMS",
    fullExchangeName: "NASDAQ Stock Market",
    instrumentType: "EQUITY",
    timezone: "EST",
    exchangeTimezoneName: "America/New_York",
    longName: "Microsoft Corporation",
    shortName: "Microsoft",
    quotes: generateQuoteHistory("MSFT", 300, 400),
    events: {
      dividends: [
        { amount: 0.68, date: "1700668800000" }, // Nov 22, 2023
        { amount: 0.68, date: "1692230400000" }, // Aug 16, 2023
      ],
      splits: []
    },
    isFromApi: false,
  },
  {
    symbol: "NVDA",
    currency: "USD",
    exchangeName: "NMS",
    fullExchangeName: "NASDAQ Stock Market",
    instrumentType: "EQUITY",
    timezone: "EST",
    exchangeTimezoneName: "America/New_York",
    longName: "NVIDIA Corporation",
    shortName: "NVIDIA",
    quotes: generateQuoteHistory("NVDA", 200, 500),
    events: {
      dividends: [
        { amount: 0.04, date: "1703203200000" }, // Dec 21, 2023
        { amount: 0.04, date: "1694736000000" }, // Sep 14, 2023
      ],
      splits: []
    },
    isFromApi: false,
  }
];

// Test institution data
const TEST_INSTITUTIONS: Omit<InstitutionType, "id" | "lastUpdated" | "isNew">[] = [
  {
    name: "Interactive Brokers",
    isDefault: false,
    website: "https://www.interactivebrokers.com",
    apiKey: "",
    apiSecret: "",
    apiUrl: "",
  },
  {
    name: "Charles Schwab",
    isDefault: false,
    website: "https://www.schwab.com",
    apiKey: "",
    apiSecret: "",
    apiUrl: "",
  },
  {
    name: "Fidelity",
    isDefault: true,
    website: "https://www.fidelity.com",
    apiKey: "",
    apiSecret: "",
    apiUrl: "",
  },
];

function generateQuoteHistory(symbol: string, minPrice: number, maxPrice: number) {
  const quotes = [];
  const today = new Date();
  const startDate = new Date(today.getFullYear() - 1, 0, 1);
  
  let currentPrice = minPrice + Math.random() * (maxPrice - minPrice);
  
  for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
    // Add some volatility
    const volatility = 0.03; // 3% daily volatility
    const change = (Math.random() - 0.5) * 2 * volatility;
    currentPrice = Math.max(minPrice * 0.5, Math.min(maxPrice * 1.5, currentPrice * (1 + change)));
    
    const open = currentPrice * (0.98 + Math.random() * 0.04);
    const close = currentPrice * (0.98 + Math.random() * 0.04);
    const high = Math.max(open, close) * (1 + Math.random() * 0.02);
    const low = Math.min(open, close) * (1 - Math.random() * 0.02);
    const volume = Math.floor(1000000 + Math.random() * 5000000);
    
    quotes.push({
      date: d.toISOString(),
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
      adjclose: Math.round(close * 100) / 100,
      volume,
    });
  }
  
  return quotes;
}

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function generateRandomTransaction(
  portfolioId: number,
  assets: string[],
  config: TestDataConfig,
  index: number
): Omit<TransactionType, "id"> {
  const types: TransactionType["type"][] = ["Buy", "Sell", "Dividend", "Deposit", "Withdraw"];
  const type = getRandomElement(types);
  
  // Adjust probabilities for different transaction types
  let finalType = type;
  if (Math.random() < 0.6) finalType = "Buy"; // 60% buy
  else if (Math.random() < 0.8) finalType = "Sell"; // 20% sell
  else if (Math.random() < 0.9 && config.includeDividends) finalType = "Dividend"; // 10% dividend
  else finalType = getRandomElement(["Deposit", "Withdraw"]); // 10% deposit/withdraw
  
  const asset = finalType === "Deposit" || finalType === "Withdraw" 
    ? { symbol: "Cash", isFetchedFromApi: false }
    : { symbol: getRandomElement(assets), isFetchedFromApi: false };
  
  const baseQuantity = finalType === "Deposit" || finalType === "Withdraw" ? 1 : Math.floor(Math.random() * 100) + 1;
  const basePrice = finalType === "Deposit" || finalType === "Withdraw" 
    ? Math.floor(Math.random() * 5000) + 500 // $500-$5500 for cash transactions
    : Math.round((Math.random() * 300 + 50) * 100) / 100; // $50-$350 for stock prices
  
  const quantity = finalType === "Dividend" ? Math.floor(Math.random() * 500) + 50 : baseQuantity;
  const price = finalType === "Dividend" ? Math.round((Math.random() * 5 + 0.1) * 100) / 100 : basePrice;
  
  const commission = Math.round((Math.random() * 10) * 100) / 100; // $0-$10
  const tax = finalType === "Dividend" ? Math.round((price * quantity * 0.15) * 100) / 100 : 0; // 15% tax on dividends
  
  // Add recurrence to some transactions if enabled
  let recurrence: string | undefined;
  if (config.includeRecurring && Math.random() < 0.1 && index < 3) { // 10% chance, only for first few transactions
    const recurrencePatterns = [
      "0 0 1 * *", // Monthly on 1st
      "0 0 15 * *", // Monthly on 15th  
      "0 0 1 */3 *", // Quarterly
    ];
    recurrence = getRandomElement(recurrencePatterns);
  }
  
  return {
    portfolioId,
    date: getRandomDate(config.dateRange.startDate, config.dateRange.endDate).getTime().toString(),
    type: finalType,
    asset,
    quantity,
    price,
    commision: commission,
    tax,
    tags: getRandomElement(["growth", "income", "speculation", "dividend", "core-holding", ""]),
    notes: `Test transaction #${index + 1} - ${finalType} ${asset.symbol}`,
    recurrence,
    isHousekeeping: false,
    isCreatedByUser: true,
  };
}

export class TestDataService {
  private config: TestDataConfig;
  
  constructor(config: Partial<TestDataConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }
  
  async generateCompleteTestData(): Promise<{
    portfolios: any[];
    institutions: any[];
    assets: any[];
    transactions: any[];
  }> {
    console.log("Starting test data generation...");
    
    // Get or create currencies
    const currencies = await fetchCurrencies();
    const defaultCurrencyArray = await fetchDefaultCurrency();
    
    if (!defaultCurrencyArray || defaultCurrencyArray.length === 0) {
      throw new Error("No default currency found. Please set up currencies first.");
    }
    const defaultCurrency = defaultCurrencyArray[0];
    
    // Create institutions
    console.log("Creating test institutions...");
    const createdInstitutions = [];
    for (const institutionData of TEST_INSTITUTIONS) {
      const [institution] = await createInstitution({
        ...institutionData,
        lastUpdated: new Date().getTime().toString(),
        isNew: false,
        id: 0, // Will be auto-generated
      });
      createdInstitutions.push(institution);
    }
    
    // Create assets
    console.log("Creating test assets...");
    const createdAssets = [];
    for (const assetData of TEST_ASSETS) {
      const [asset] = await createAsset({
        ...assetData,
        id: 0, // Will be auto-generated
        lastUpdated: new Date().getTime().toString(),
      });
      createdAssets.push(asset);
    }
    
    // Create portfolios
    console.log("Creating test portfolios...");
    const createdPortfolios = [];
    for (let i = 0; i < this.config.portfolioCount; i++) {
      const portfolioData: PortfolioType = {
        id: 0, // Will be auto-generated
        name: `Test Portfolio ${i + 1}`,
        currency: {
          id: defaultCurrency.id,
          code: defaultCurrency.code,
          name: defaultCurrency.name,
          symbol: defaultCurrency.symbol,
          exchangeRate: defaultCurrency.exchangeRate || 1,
          isDefault: defaultCurrency.isDefault === 1,
          lastUpdated: defaultCurrency.lastUpdated,
        },
        symbol: `TP${i + 1}`,
        type: getRandomElement(["Current", "Saving", "Investment"]),
        institution: {
          id: createdInstitutions[i % createdInstitutions.length].id,
          name: TEST_INSTITUTIONS[i % TEST_INSTITUTIONS.length].name,
          isDefault: TEST_INSTITUTIONS[i % TEST_INSTITUTIONS.length].isDefault,
          website: TEST_INSTITUTIONS[i % TEST_INSTITUTIONS.length].website,
          apiKey: "",
          apiSecret: "",
          apiUrl: "",
          lastUpdated: new Date().getTime().toString(),
          isNew: false,
        },
        cashBalance: Math.round((Math.random() * 10000 + 1000) * 100) / 100, // $1000-$11000
        tags: getRandomElement(["retirement", "emergency", "growth", "income", ""]),
        selected: false,
        createdAt: new Date().getTime().toString(),
      };
      
      const [portfolio] = await createPortfolio(portfolioData);
      createdPortfolios.push(portfolio);
    }
    
    // Create transactions
    console.log("Creating test transactions...");
    const createdTransactions = [];
    const assetSymbols = TEST_ASSETS.map(asset => asset.symbol);
    
    for (const portfolio of createdPortfolios) {
      for (let i = 0; i < this.config.transactionsPerPortfolio; i++) {
        const transactionData = generateRandomTransaction(
          portfolio.id,
          assetSymbols,
          this.config,
          i
        );
        
        try {
          const transaction = await createTransaction(transactionData as TransactionType);
          createdTransactions.push(transaction);
        } catch (error) {
          console.error(`Failed to create transaction ${i + 1} for portfolio ${portfolio.id}:`, error);
        }
      }
    }
    
    console.log("Test data generation completed!");
    console.log(`Created: ${createdPortfolios.length} portfolios, ${createdAssets.length} assets, ${createdTransactions.length} transactions`);
    
    return {
      portfolios: createdPortfolios,
      institutions: createdInstitutions,
      assets: createdAssets,
      transactions: createdTransactions,
    };
  }
  
  async generateAssetsOnly(): Promise<any[]> {
    console.log("Creating test assets only...");
    const createdAssets = [];
    for (const assetData of TEST_ASSETS) {
      const [asset] = await createAsset({
        ...assetData,
        id: 0,
        lastUpdated: new Date().getTime().toString(),
      });
      createdAssets.push(asset);
    }
    return createdAssets;
  }
  
  async generateTransactionsForPortfolio(portfolioId: number, count?: number): Promise<any[]> {
    console.log(`Creating ${count || this.config.transactionsPerPortfolio} test transactions for portfolio ${portfolioId}...`);
    
    const assetSymbols = TEST_ASSETS.map(asset => asset.symbol);
    const createdTransactions = [];
    const transactionCount = count || this.config.transactionsPerPortfolio;
    
    for (let i = 0; i < transactionCount; i++) {
      const transactionData = generateRandomTransaction(
        portfolioId,
        assetSymbols,
        this.config,
        i
      );
      
      try {
        const transaction = await createTransaction(transactionData as TransactionType);
        createdTransactions.push(transaction);
      } catch (error) {
        console.error(`Failed to create transaction ${i + 1} for portfolio ${portfolioId}:`, error);
      }
    }
    
    return createdTransactions;
  }
  
  static getAvailableAssets(): string[] {
    return TEST_ASSETS.map(asset => asset.symbol);
  }
  
  static getTestDataPresets(): { [key: string]: Partial<TestDataConfig> } {
    return {
      minimal: {
        portfolioCount: 1,
        transactionsPerPortfolio: 5,
        includeRecurring: false,
        includeDividends: false,
      },
      standard: {
        portfolioCount: 2,
        transactionsPerPortfolio: 15,
        includeRecurring: true,
        includeDividends: true,
      },
      extensive: {
        portfolioCount: 5,
        transactionsPerPortfolio: 30,
        includeRecurring: true,
        includeDividends: true,
      },
    };
  }
}

// Convenience exports
export const testDataService = new TestDataService();

export async function generateTestData(preset: "minimal" | "standard" | "extensive" = "standard") {
  const presets = TestDataService.getTestDataPresets();
  const service = new TestDataService(presets[preset]);
  return await service.generateCompleteTestData();
}

export async function generateTestAssetsOnly() {
  return await testDataService.generateAssetsOnly();
}

export async function generateTestTransactionsForPortfolio(portfolioId: number, count?: number) {
  return await testDataService.generateTransactionsForPortfolio(portfolioId, count);
}
