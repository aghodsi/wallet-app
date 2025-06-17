# Test Data System

This document describes the modular test data system for generating realistic portfolios, assets, and transactions for development and testing purposes.

## Overview

The test data system is built in a modular way with three main components:

1. **TestDataService** (`app/services/testDataService.ts`) - Core service for generating test data
2. **API Route** (`app/routes/api.testData.tsx`) - REST API endpoints for generating test data
3. **React Hook** (`app/hooks/useTestData.ts`) - React hook for easy frontend integration

## Features

- ✅ **Modular Design** - Not embedded in routes or components
- ✅ **Configurable** - Multiple presets and custom configurations
- ✅ **Realistic Data** - Generated with proper relationships and realistic values
- ✅ **Historical Price Data** - Includes simulated price history for assets
- ✅ **Recurring Transactions** - Support for cron-based recurring transactions
- ✅ **Dividend Transactions** - Includes dividend payments with proper tax calculations
- ✅ **Multiple Transaction Types** - Buy, Sell, Dividend, Deposit, Withdraw
- ✅ **Asset Variety** - AAPL, GOOGL, TSLA, MSFT, NVDA with realistic data
- ✅ **Institution Support** - Creates test financial institutions
- ✅ **Date Ranges** - Configurable date ranges for transaction generation

## Usage

### 1. Using the React Hook (Recommended)

```typescript
import { useTestData } from "~/hooks/useTestData";

function MyComponent() {
  const { generateComplete, isLoading, error } = useTestData();

  const handleGenerateData = async () => {
    const result = await generateComplete("standard");
    if (result.success) {
      console.log("Generated test data:", result.data);
      // Refresh your data or navigate to show the new data
    }
  };

  return (
    <button onClick={handleGenerateData} disabled={isLoading}>
      {isLoading ? "Generating..." : "Generate Test Data"}
    </button>
  );
}
```

### 2. Using Quick Functions

```typescript
import { generateTestDataQuick, generateTestAssetsQuick } from "~/hooks/useTestData";

// Generate complete test data
const result = await generateTestDataQuick("extensive");

// Generate just assets
const assets = await generateTestAssetsQuick();

// Generate transactions for specific portfolio
const transactions = await generateTestTransactionsQuick(portfolioId, 20);
```

### 3. Using the API Directly

```typescript
// Generate complete test data
const response = await fetch("/api/testData", {
  method: "POST",
  body: new FormData([
    ["action", "generateComplete"],
    ["preset", "standard"]
  ])
});

// Generate custom test data
const formData = new FormData();
formData.append("action", "generateCustom");
formData.append("portfolioCount", "3");
formData.append("transactionsPerPortfolio", "25");
formData.append("includeRecurring", "true");
formData.append("includeDividends", "true");

const response = await fetch("/api/testData", {
  method: "POST",
  body: formData
});
```

### 4. Using the Service Directly

```typescript
import { TestDataService, generateTestData } from "~/services/testDataService";

// Using convenience function
const result = await generateTestData("extensive");

// Using service class for custom configuration
const service = new TestDataService({
  portfolioCount: 3,
  transactionsPerPortfolio: 50,
  includeRecurring: true,
  includeDividends: true,
  dateRange: {
    startDate: new Date("2022-01-01"),
    endDate: new Date("2024-12-31")
  }
});

const result = await service.generateCompleteTestData();
```

## Configuration Options

### Presets

- **minimal**: 1 portfolio, 5 transactions, no recurring/dividends
- **standard**: 2 portfolios, 15 transactions each, includes recurring/dividends
- **extensive**: 5 portfolios, 30 transactions each, includes recurring/dividends

### Custom Configuration

```typescript
interface TestDataConfig {
  portfolioCount: number;              // Number of portfolios to create
  transactionsPerPortfolio: number;    // Transactions per portfolio
  includeRecurring: boolean;           // Include recurring transactions
  includeDividends: boolean;           // Include dividend payments
  dateRange: {
    startDate: Date;                   // Start date for transactions
    endDate: Date;                     // End date for transactions
  };
}
```

## Generated Data

### Assets
- **AAPL** (Apple Inc.) - $150-$200 range with dividends
- **GOOGL** (Alphabet Inc.) - $120-$180 range
- **TSLA** (Tesla Inc.) - $180-$300 range with stock splits
- **MSFT** (Microsoft Corp.) - $300-$400 range with dividends  
- **NVDA** (NVIDIA Corp.) - $200-$500 range with dividends

Each asset includes:
- Historical price data (OHLCV) for the past year
- Dividend events (where applicable)
- Stock split events (where applicable)
- Realistic volume data

### Portfolios
- Names: "Test Portfolio 1", "Test Portfolio 2", etc.
- Random portfolio types: Current, Saving, Investment
- Cash balances: $1,000 - $11,000
- Associated with test institutions

### Institutions
- **Interactive Brokers** - https://www.interactivebrokers.com
- **Charles Schwab** - https://www.schwab.com  
- **Fidelity** (default) - https://www.fidelity.com

### Transactions
- **Buy/Sell**: 60%/20% probability with realistic quantities and prices
- **Dividends**: 10% probability with 15% tax rate
- **Deposits/Withdrawals**: 10% probability with $500-$5,500 amounts
- **Recurring**: Optional cron patterns (monthly, quarterly)
- **Commissions**: $0-$10 realistic range
- **Tags**: growth, income, speculation, dividend, core-holding

## API Endpoints

### GET /api/testData
Returns information about available presets and actions.

### POST /api/testData
Accepts form data with the following actions:

#### generateComplete
- `action`: "generateComplete"
- `preset`: "minimal" | "standard" | "extensive" (optional, defaults to "standard")

#### generateAssets
- `action`: "generateAssets"

#### generateTransactions
- `action`: "generateTransactions"
- `portfolioId`: number (required)
- `count`: number (optional)

#### generateCustom
- `action`: "generateCustom"
- `portfolioCount`: number (optional)
- `transactionsPerPortfolio`: number (optional)
- `includeRecurring`: "true" | "false" (optional)
- `includeDividends`: "true" | "false" (optional)
- `startDate`: YYYY-MM-DD (optional)
- `endDate`: YYYY-MM-DD (optional)

## Examples

### Simple Test Data Generation
```typescript
import { useTestData } from "~/hooks/useTestData";

function DevTools() {
  const { generateComplete, isLoading } = useTestData();
  
  return (
    <div>
      <button onClick={() => generateComplete("minimal")}>
        Quick Setup (1 portfolio)
      </button>
      <button onClick={() => generateComplete("standard")}>
        Standard Setup (2 portfolios)
      </button>
      <button onClick={() => generateComplete("extensive")}>
        Full Demo (5 portfolios)
      </button>
    </div>
  );
}
```

### Custom Configuration
```typescript
import { useTestData } from "~/hooks/useTestData";

function AdvancedTestSetup() {
  const { generateCustom, isLoading } = useTestData();
  
  const generateYearOfData = () => {
    generateCustom({
      portfolioCount: 3,
      transactionsPerPortfolio: 100,
      includeRecurring: true,
      includeDividends: true,
      startDate: "2023-01-01",
      endDate: "2023-12-31"
    });
  };
  
  return (
    <button onClick={generateYearOfData} disabled={isLoading}>
      Generate Full Year of Data
    </button>
  );
}
```

### Adding Test Transactions to Existing Portfolio
```typescript
import { useTestData } from "~/hooks/useTestData";

function PortfolioTestData({ portfolioId }: { portfolioId: number }) {
  const { generateTransactions, isLoading } = useTestData();
  
  return (
    <button 
      onClick={() => generateTransactions(portfolioId, 20)}
      disabled={isLoading}
    >
      Add 20 Test Transactions
    </button>
  );
}
```

## Best Practices

1. **Use presets first** - Start with "minimal", "standard", or "extensive" presets
2. **Clean database** - Clear existing data before generating large test datasets
3. **Check currency setup** - Ensure you have a default currency configured
4. **Monitor performance** - Large datasets may take time to generate
5. **Use in development only** - Don't run in production environments

## Error Handling

The system includes comprehensive error handling:

- **Database errors** - Proper transaction rollbacks
- **Validation errors** - Clear error messages for invalid inputs
- **Currency errors** - Requires default currency to be set
- **Network errors** - Graceful handling in the React hook

## Integration Notes

- **Database Requirements** - Requires existing currency and default currency setup
- **Dependencies** - Uses existing database actions and schema
- **Cron Integration** - Automatically schedules recurring transactions via cronService
- **Asset System** - Creates assets that work with existing asset management
- **Portfolio Context** - Generated portfolios integrate with existing portfolio system

This test data system provides a comprehensive, modular solution for generating realistic financial data for development and testing purposes.
