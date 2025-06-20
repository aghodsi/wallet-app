import { TrendingDown, TrendingUp, PiggyBank, Banknote, Calendar, Target } from "lucide-react"
import { LabelList, Pie, PieChart } from "recharts"

import { Badge } from "~/components/ui/badge"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card"
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "~/components/ui/chart"
import type { TransactionType } from "~/datatypes/transaction"
import type { AssetType } from "~/datatypes/asset"
import type { PortfolioType } from "~/datatypes/portfolio"
import type { CurrencyType } from "~/datatypes/currency"
import { useMemo } from "react"
import { convertCurrency, formatCurrency as formatCurrencyUtil, getDefaultCurrency } from "~/lib/currencyUtils"

interface FactCardsProps {
  transactions: TransactionType[];
  assets: AssetType[];
  currency?: string;
  timeRange?: string;
  selectedPortfolio?: PortfolioType;
  currencies?: CurrencyType[];
}

export function FactCards({
  transactions,
  assets,
  currency = "USD",
  timeRange = "All time",
  selectedPortfolio,
  currencies = []
}: FactCardsProps) {
  // Calculate stats from transactions with currency conversion
  const calculatedStats = useMemo(() => {
    // For "All" portfolio or when no portfolio currency is available, use user's default currency as fallback
    const portfolioCurrency = selectedPortfolio?.currency || getDefaultCurrency(currencies);

    if (!transactions || transactions.length === 0) {
      return {
        totalInvestment: 0,
        totalCash: 0,
        totalCommission: 0,
        totalTaxes: 0,
        currentPortfolioValue: 0,
        transactionCount: 0,
      };
    }

    // portfolioCurrency is already defined above
    const nonHousekeepingTransactions = transactions.filter(t => !t.isHousekeeping);
    
    // Helper function to convert transaction amounts to portfolio currency
    const convertToPortfolioCurrency = (amount: number, transactionCurrency?: CurrencyType) => {
      if (!transactionCurrency) {
        return amount; // If no transaction currency, assume it's already in portfolio currency
      }
      return convertCurrency(amount, transactionCurrency, portfolioCurrency);
    };
    
    // Calculate totals with currency conversion
    const totalCommission = nonHousekeepingTransactions.reduce((sum, t) => {
      const convertedCommission = convertToPortfolioCurrency(t.commision || 0, t.currency);
      return sum + convertedCommission;
    }, 0);
    
    const totalTaxes = nonHousekeepingTransactions.reduce((sum, t) => {
      const convertedTax = convertToPortfolioCurrency(t.tax || 0, t.currency);
      return sum + convertedTax;
    }, 0);
    
    const transactionCount = nonHousekeepingTransactions.length;
    
    // Calculate investment with currency conversion
    const buyTransactions = nonHousekeepingTransactions.filter(t => t.type === "Buy");
    const totalInvestment = buyTransactions.reduce((sum, t) => {
      const convertedAmount = convertToPortfolioCurrency(t.quantity * t.price, t.currency);
      const convertedCommission = convertToPortfolioCurrency(t.commision || 0, t.currency);
      const convertedTax = convertToPortfolioCurrency(t.tax || 0, t.currency);
      return sum + convertedAmount + convertedCommission + convertedTax;
    }, 0);

    // Calculate current holdings by tracking net positions
    const holdingsMap = new Map<string, number>();
    
    // Process all asset transactions to get current holdings
    nonHousekeepingTransactions.forEach(transaction => {
      const symbol = transaction.asset.symbol;
      const currentHolding = holdingsMap.get(symbol) || 0;
      
      if (transaction.type === "Buy") {
        holdingsMap.set(symbol, currentHolding + transaction.quantity);
      } else if (transaction.type === "Sell") {
        holdingsMap.set(symbol, currentHolding - transaction.quantity);
      }
    });

    // Calculate current portfolio value based on holdings and last asset prices
    let currentPortfolioValue = 0;
    console.log('📊 Starting portfolio value calculation');
    console.log('Holdings map:', Array.from(holdingsMap.entries()));
    console.log('Available assets:', assets.map(a => ({ symbol: a.symbol, quotesCount: a.quotes.length })));
    
    holdingsMap.forEach((quantity, symbol) => {
      console.log(`Processing holding: ${symbol}, quantity: ${quantity}`);
      if (quantity > 0) { // Only count positive holdings
        const asset = assets.find(a => a.symbol === symbol);
        console.log(`Found asset for ${symbol}:`, asset ? 'YES' : 'NO');
        
        if (asset && asset.quotes.length > 0) {
          // Get the most recent quote
          const latestQuote = asset.quotes[asset.quotes.length - 1];
          const lastPrice = latestQuote.close || latestQuote.adjclose || 0;
          console.log(`${symbol} - Latest quote:`, latestQuote, 'Last price:', lastPrice);
          
          // Convert asset currency to portfolio currency if needed
          const assetValue = quantity * lastPrice;
          console.log(`${symbol} - Asset value before conversion:`, assetValue, `(${quantity} * ${lastPrice})`);
          
          // Create a mock currency object for the asset since asset.currency is a string
          const assetCurrency: CurrencyType = {
            id: -1,
            code: asset.currency,
            name: asset.currency,
            symbol: asset.currency,
            exchangeRate: 1, // Assuming 1:1 if no rate available
            isDefault: false,
            lastUpdated: new Date().toISOString(),
          };
          
          const convertedValue = convertCurrency(assetValue, assetCurrency, portfolioCurrency);
          console.log(`${symbol} - Converted value:`, convertedValue, `(from ${asset.currency} to ${portfolioCurrency.code})`);
          
          currentPortfolioValue += convertedValue;
          console.log(`${symbol} - Running total:`, currentPortfolioValue);
        } else {
          console.log(`${symbol} - No asset found or no quotes available`);
        }
      } else {
        console.log(`${symbol} - Skipping negative/zero quantity`);
      }
    });
    
    console.log('💰 Final current portfolio value:', currentPortfolioValue);

    // Calculate cash based on sell and dividend activities only
    let totalCash = 0;
    
    // Add cash from sell transactions
    const sellTransactions = nonHousekeepingTransactions.filter(t => t.type === "Sell");
    sellTransactions.forEach(transaction => {
      const cashFromSale = convertToPortfolioCurrency(
        transaction.quantity * transaction.price - (transaction.commision || 0) - (transaction.tax || 0),
        transaction.currency
      );
      totalCash += cashFromSale;
    });

    // Add cash from dividend transactions
    const dividendTransactions = nonHousekeepingTransactions.filter(t => t.type === "Dividend");
    dividendTransactions.forEach(transaction => {
      const dividendAmount = convertToPortfolioCurrency(
        transaction.quantity * transaction.price - (transaction.tax || 0),
        transaction.currency
      );
      totalCash += dividendAmount;
    });

    // For Investment portfolios, ensure cash cannot be negative
    if (selectedPortfolio?.type === "Investment" && totalCash < 0) {
      totalCash = 0;
    }
    
    return {
      totalInvestment,
      totalCash,
      totalCommission,
      totalTaxes,
      currentPortfolioValue,
      transactionCount,
    };
  }, [transactions, selectedPortfolio, assets, currencies]);

  // Generate country data from transactions using asset information with currency conversion
  const countryData = useMemo(() => {
    // Use fallback currency for "All" portfolio or when no portfolio currency is available
    const portfolioCurrency = selectedPortfolio?.currency || getDefaultCurrency(currencies);

    // Map exchange names to countries
    const exchangeToCountry: Record<string, string> = {
      'NASDAQ': 'United States',
      'NYSE': 'United States', 
      'NMSE': 'United States',
      'NMS': 'United States',
      'LSE': 'United Kingdom',
      'FRA': 'Germany',
      'XETRA': 'Germany',
      'TSE': 'Japan',
      'TYO': 'Japan',
      'PAR': 'France',
      'AMS': 'Netherlands',
      'SWX': 'Switzerland',
    };
    
    // portfolioCurrency is already defined above
    const countryMap = new Map<string, number>();
    
    // Helper function to convert transaction amounts to portfolio currency
    const convertToPortfolioCurrency = (amount: number, transactionCurrency?: CurrencyType) => {
      if (!transactionCurrency) {
        return amount; // If no transaction currency, assume it's already in portfolio currency
      }
      return convertCurrency(amount, transactionCurrency, portfolioCurrency);
    };
    
    transactions.forEach((transaction) => {
      if (!transaction.isHousekeeping) {
        // Find the asset for this transaction
        const asset = assets.find(a => a.symbol === transaction.asset.symbol);
        
        let country = 'Other'; // Default country
        
        if (asset) {
          // Try to map exchange to country
          const exchange = asset.exchangeName || asset.fullExchangeName || '';
          country = exchangeToCountry[exchange] || 
                   exchangeToCountry[exchange.toUpperCase()] || 
                   'Other';
        }
        
        const amount = convertToPortfolioCurrency(transaction.quantity * transaction.price, transaction.currency);
        countryMap.set(country, (countryMap.get(country) || 0) + amount);
      }
    });
    
    return Array.from(countryMap.entries())
      .map(([country, amount], index) => ({
        country,
        amount,
        fill: `var(--chart-${(index % 5) + 1})`,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5); // Top 5 countries
  }, [transactions, assets, selectedPortfolio, currencies]);

  // Generate asset allocation data from transactions using asset information with currency conversion
  const assetAllocationData = useMemo(() => {
    // Use fallback currency for "All" portfolio or when no portfolio currency is available
    const portfolioCurrency = selectedPortfolio?.currency || getDefaultCurrency(currencies);

    // Map asset symbols to asset classes based on instrument type or symbol patterns
    const getAssetClass = (asset?: AssetType) => {
      if (!asset) return 'Other';
      
      const symbol = asset.symbol.toUpperCase();
      const instrumentType = asset.instrumentType?.toLowerCase() || '';
      
      // Crypto detection
      if (symbol.includes('BTC') || symbol.includes('ETH') || symbol.includes('USDT') || 
          symbol.includes('DOGE') || symbol.includes('ADA') || symbol.includes('SOL')) {
        return 'Cryptocurrency';
      }
      
      // Bond detection
      if (instrumentType.includes('bond') || symbol.includes('TLT') || 
          symbol.includes('AGG') || symbol.includes('BND')) {
        return 'Bonds';
      }
      
      // ETF detection
      if (instrumentType.includes('etf') || symbol.includes('SPY') || 
          symbol.includes('QQQ') || symbol.includes('VTI')) {
        return 'ETFs';
      }
      
      // REIT detection
      if (instrumentType.includes('reit') || symbol.includes('REIT')) {
        return 'REITs';
      }
      
      // Default to stocks for everything else
      return 'Stocks';
    };
    
    // portfolioCurrency is already defined above
    const allocationMap = new Map<string, number>();
    
    // Helper function to convert transaction amounts to portfolio currency
    const convertToPortfolioCurrency = (amount: number, transactionCurrency?: CurrencyType) => {
      if (!transactionCurrency) {
        return amount; // If no transaction currency, assume it's already in portfolio currency
      }
      return convertCurrency(amount, transactionCurrency, portfolioCurrency);
    };
    
    transactions.forEach((transaction) => {
      if (!transaction.isHousekeeping && transaction.type === "Buy") {
        // Find the asset for this transaction
        const asset = assets.find(a => a.symbol === transaction.asset.symbol);
        const assetClass = getAssetClass(asset);
        
        const amount = convertToPortfolioCurrency(transaction.quantity * transaction.price, transaction.currency);
        allocationMap.set(assetClass, (allocationMap.get(assetClass) || 0) + amount);
      }
    });
    
    return Array.from(allocationMap.entries())
      .map(([assetClass, amount], index) => {
        // Use completely different color scheme for asset allocation
        const colorMap: Record<string, string> = {
          'Stocks': '#FF6B6B',        // Coral Red
          'ETFs': '#4ECDC4',          // Teal
          'Bonds': '#45B7D1',         // Sky Blue
          'Cryptocurrency': '#96CEB4', // Mint Green
          'REITs': '#FECA57',         // Golden Yellow
          'Other': '#A8A8A8',         // Light Gray
        };
        
        return {
          assetClass,
          amount,
          percentage: 0, // Will be calculated after we have total
          fill: colorMap[assetClass] || `hsl(var(--chart-${(index % 5) + 1}))`,
        };
      })
      .sort((a, b) => b.amount - a.amount);
  }, [transactions, assets, selectedPortfolio, currencies]);

  // Calculate percentages for asset allocation
  const assetAllocationWithPercentages = useMemo(() => {
    const totalAmount = assetAllocationData.reduce((sum, item) => sum + item.amount, 0);
    return assetAllocationData.map(item => ({
      ...item,
      percentage: totalAmount > 0 ? (item.amount / totalAmount) * 100 : 0,
    }));
  }, [assetAllocationData]);

  const chartConfig = {
    amount: {
      label: "Amount",
    },
    "United States": {
      label: "United States",
      color: "var(--chart-1)",
    },
    "Germany": {
      label: "Germany", 
      color: "var(--chart-2)",
    },
    "Japan": {
      label: "Japan",
      color: "var(--chart-3)",
    },
    "United Kingdom": {
      label: "United Kingdom",
      color: "var(--chart-4)",
    },
    "France": {
      label: "France",
      color: "var(--chart-5)",
    },
  } satisfies ChartConfig;

  const { totalInvestment, totalCash, totalCommission, totalTaxes, currentPortfolioValue, transactionCount } = calculatedStats;
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const performancePercentage = totalInvestment > 0 ? ((currentPortfolioValue - totalInvestment) / totalInvestment * 100) : 0;
  const isPerformancePositive = performancePercentage >= 0;

  // Check if this is a savings portfolio
  const isSavingsPortfolio = selectedPortfolio?.type === "Saving";

  // Calculate savings-specific metrics with currency conversion
  const savingsStats = useMemo(() => {
    if (!isSavingsPortfolio || !selectedPortfolio?.currency) return null;
    
    const portfolioCurrency = selectedPortfolio.currency;
    
    // Helper function to convert transaction amounts to portfolio currency
    const convertToPortfolioCurrency = (amount: number, transactionCurrency?: CurrencyType) => {
      if (!transactionCurrency) {
        return amount; // If no transaction currency, assume it's already in portfolio currency
      }
      return convertCurrency(amount, transactionCurrency, portfolioCurrency);
    };
    
    const deposits = transactions.filter(t => t.type === "Buy" && !t.isHousekeeping);
    const withdrawals = transactions.filter(t => t.type === "Sell" && !t.isHousekeeping);
    
    const totalDeposits = deposits.reduce((sum, t) => {
      const convertedAmount = convertToPortfolioCurrency(t.quantity * t.price, t.currency);
      return sum + convertedAmount;
    }, 0);
    
    const totalWithdrawals = withdrawals.reduce((sum, t) => {
      const convertedAmount = convertToPortfolioCurrency(t.quantity * t.price, t.currency);
      return sum + convertedAmount;
    }, 0);
    
    const netSavings = totalDeposits - totalWithdrawals;
    const currentBalance = selectedPortfolio?.cashBalance || totalCash;
    
    // Calculate average deposit amount
    const avgDeposit = deposits.length > 0 ? totalDeposits / deposits.length : 0;
    
    // Calculate savings frequency (deposits per month)
    const firstTransaction = deposits[0];
    const lastTransaction = deposits[deposits.length - 1];
    let savingsFrequency = 0;
    
    if (firstTransaction && lastTransaction) {
      const firstDate = new Date(parseInt(firstTransaction.date));
      const lastDate = new Date(parseInt(lastTransaction.date));
      const monthsDiff = (lastDate.getFullYear() - firstDate.getFullYear()) * 12 + (lastDate.getMonth() - firstDate.getMonth());
      savingsFrequency = monthsDiff > 0 ? deposits.length / monthsDiff : deposits.length;
    }
    
    return {
      totalDeposits,
      totalWithdrawals,
      netSavings,
      currentBalance,
      avgDeposit,
      savingsFrequency
    };
  }, [transactions, isSavingsPortfolio, selectedPortfolio, totalCash]);

  if (isSavingsPortfolio && savingsStats) {
    // Render savings-specific fact cards
    return (
      <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Current Balance</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {formatCurrency(savingsStats.currentBalance)}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                <PiggyBank className="w-4 h-4" />
                Savings
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              Available funds in your savings account <PiggyBank className="size-4" />
            </div>
            <div className="text-muted-foreground">
              Total balance ready for use or investment
            </div>
          </CardFooter>
        </Card>

        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Total Deposits</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {formatCurrency(savingsStats.totalDeposits)}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                <TrendingUp />
                +{formatCurrency(savingsStats.totalDeposits)}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              Money saved {timeRange.toLowerCase()} <TrendingUp className="size-4" />
            </div>
            <div className="text-muted-foreground">
              Total amount deposited into savings
            </div>
          </CardFooter>
        </Card>

        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Total Withdrawals</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {formatCurrency(savingsStats.totalWithdrawals)}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                <TrendingDown />
                -{formatCurrency(savingsStats.totalWithdrawals)}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              Money withdrawn {timeRange.toLowerCase()} <TrendingDown className="size-4" />
            </div>
            <div className="text-muted-foreground">
              Total amount withdrawn from savings
            </div>
          </CardFooter>
        </Card>

        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Net Savings</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {formatCurrency(savingsStats.netSavings)}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                {savingsStats.netSavings >= 0 ? <TrendingUp /> : <TrendingDown />}
                {savingsStats.netSavings >= 0 ? 'Positive' : 'Negative'}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              Net change in savings {timeRange.toLowerCase()} {savingsStats.netSavings >= 0 ? <TrendingUp className="size-4" /> : <TrendingDown className="size-4" />}
            </div>
            <div className="text-muted-foreground">
              Deposits minus withdrawals
            </div>
          </CardFooter>
        </Card>

        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Average Deposit</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {formatCurrency(savingsStats.avgDeposit)}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                <Banknote className="w-4 h-4" />
                Avg
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              Typical deposit amount <Banknote className="size-4" />
            </div>
            <div className="text-muted-foreground">
              Average amount per deposit transaction
            </div>
          </CardFooter>
        </Card>

        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Savings Frequency</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {savingsStats.savingsFrequency.toFixed(1)}/month
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                <Calendar className="w-4 h-4" />
                Regular
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              Savings discipline <Calendar className="size-4" />
            </div>
            <div className="text-muted-foreground">
              Average deposits per month
            </div>
          </CardFooter>
        </Card>

        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Savings Goal Progress</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {((savingsStats.currentBalance / 10000) * 100).toFixed(0)}%
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                <Target className="w-4 h-4" />
                Goal: {formatCurrency(10000)}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              Progress towards savings goal <Target className="size-4" />
            </div>
            <div className="text-muted-foreground">
              Target: {formatCurrency(10000)} emergency fund
            </div>
          </CardFooter>
        </Card>

        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Transaction Activity</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {formatNumber(transactionCount)}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                <TrendingUp />
                Activity
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              Account activity {timeRange.toLowerCase()} <TrendingUp className="size-4" />
            </div>
            <div className="text-muted-foreground">Number of savings transactions</div>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Render investment-specific fact cards (default)
  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Investment</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatCurrency(totalInvestment)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {isPerformancePositive ? <TrendingUp /> : <TrendingDown />}
              {isPerformancePositive ? '+' : ''}{performancePercentage.toFixed(1)}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {isPerformancePositive ? 'Positive' : 'Negative'} performance {timeRange.toLowerCase()} {isPerformancePositive ? <TrendingUp className="size-4" /> : <TrendingDown className="size-4" />}
          </div>
          <div className="text-muted-foreground">
            Total amount invested in portfolio
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Current Value</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatCurrency(currentPortfolioValue)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {isPerformancePositive ? <TrendingUp /> : <TrendingDown />}
              {formatCurrency(currentPortfolioValue - totalInvestment)}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {isPerformancePositive ? 'Gain' : 'Loss'}: {formatCurrency(Math.abs(currentPortfolioValue - totalInvestment))} {isPerformancePositive ? <TrendingUp className="size-4" /> : <TrendingDown className="size-4" />}
          </div>
          <div className="text-muted-foreground">
            Current portfolio value
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Commission</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatCurrency(totalCommission)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <TrendingDown />
              Cost
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Trading fees paid {timeRange.toLowerCase()} <TrendingDown className="size-4" />
          </div>
          <div className="text-muted-foreground">Commission and transaction fees</div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Taxes</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatCurrency(totalTaxes)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <TrendingDown />
              Cost
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Tax obligations {timeRange.toLowerCase()} <TrendingDown className="size-4" />
          </div>
          <div className="text-muted-foreground">Capital gains and other taxes</div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Cash Available</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatCurrency(totalCash)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <TrendingUp />
              Available
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Liquid funds ready for investment <TrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">Uninvested cash balance</div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Transactions (excluding housekeeping)</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatNumber(transactionCount)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <TrendingUp />
              Activity
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Trading activity {timeRange.toLowerCase()} <TrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">Number of buy/sell transactions</div>
        </CardFooter>
      </Card>
      
      {/* Country Distribution Pie Chart */}
      <Card className="@container/card flex flex-col">
        <CardHeader className="items-center pb-0">
          {/* <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">Portfolio Exchanges</CardTitle> */}
          <CardDescription>Portfolio Exchanges Distribution</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 pb-0">
          <ChartContainer
            config={chartConfig}
            className="[&_.recharts-text]:fill-background mx-auto aspect-square max-h-[200px]"
          >
            <PieChart>
              <ChartTooltip
                content={
                  <ChartTooltipContent 
                    nameKey="amount" 
                    hideLabel 
                    formatter={(value) => formatCurrency(value as number)}
                  />
                }
              />
              <Pie data={countryData} dataKey="amount">
                <LabelList
                  dataKey="country"
                  className="fill-background"
                  stroke="none"
                  fontSize={10}
                  formatter={(value: string) => {
                    // Abbreviate long country names
                    return value.length > 12 ? value.substring(0, 9) + "..." : value;
                  }}
                />
              </Pie>
            </PieChart>
          </ChartContainer>
        </CardContent>
        <CardFooter className="flex-col gap-2 text-sm">
          <div className="flex items-center gap-2 leading-none font-medium">
            Top {countryData.length} markets by volume <TrendingUp className="h-4 w-4" />
          </div>
          <div className="text-muted-foreground leading-none">
            Geographic distribution of transactions
          </div>
        </CardFooter>
      </Card>

      {/* Asset Allocation Pie Chart */}
      <Card className="@container/card flex flex-col">
        <CardHeader className="items-center pb-0">
          {/* <CardTitle className="text-lg"></CardTitle> */}
          <CardDescription>Asset Allocation</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 pb-0">
          <ChartContainer
            config={chartConfig}
            className="[&_.recharts-text]:fill-background mx-auto aspect-square max-h-[200px]"
          >
            <PieChart>
              <ChartTooltip
                content={
                  <ChartTooltipContent 
                    nameKey="amount" 
                    hideLabel 
                    formatter={(value, name) => [
                      `${formatCurrency(value as number)} (${assetAllocationWithPercentages.find(item => item.amount === value)?.percentage.toFixed(1)}%)`,
                      name
                    ]}
                  />
                }
              />
              <Pie data={assetAllocationWithPercentages} dataKey="amount">
                <LabelList
                  dataKey="assetClass"
                  className="fill-background"
                  stroke="none"
                  fontSize={10}
                  formatter={(value: string) => {
                    const item = assetAllocationWithPercentages.find(item => item.assetClass === value);
                    return item ? `${value} (${item.percentage.toFixed(0)}%)` : value;
                  }}
                />
              </Pie>
            </PieChart>
          </ChartContainer>
        </CardContent>
        <CardFooter className="flex-col gap-2 text-sm">
          <div className="flex items-center gap-2 leading-none font-medium">
            Portfolio diversification across asset classes <TrendingUp className="h-4 w-4" />
          </div>
          <div className="text-muted-foreground leading-none">
            Breakdown by stocks, bonds, ETFs, crypto, and REITs
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
