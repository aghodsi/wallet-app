import { userPortfolios } from "~/stateManagement/portfolioContext";
import { FactCards } from "~/components/portfolio/factCardsComponents";
import { ChartAreaInteractive } from "~/components/portfolio/chartsInteractiveComponent";
import type { Route } from "./+types/portfolio";
import { fetchAllTransactions } from "~/db/actions";
import { useQueries, useQuery } from "@tanstack/react-query";
import type { AssetType } from "~/datatypes/asset";
import { useMemo, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "~/components/ui/toggle-group";
import type { TransactionType } from "~/datatypes/transaction";

export async function loader({ request, params }: Route.LoaderArgs) {
  const transactions = await fetchAllTransactions();
  return { transactions };
}

export default function Portfolio({ loaderData }: Route.ComponentProps) {
  const [timeRange, setTimeRange] = useState("1Y");
  const portfolios = userPortfolios();
  const selectedPortfolio = portfolios.find((p) => p.selected);
  // TanStack Query for asset search
  const transactionQueries = useQueries({
    queries: loaderData.transactions.map((transaction) => {
      return {
        queryKey: ["assetFetch", transaction.asset],
        queryFn: async () => {
          const res = await fetch("/fetchAssetChart?q=" + transaction.asset);
          if (!res.ok) {
            throw new Error(
              `Error fetching asset data for ${transaction.asset}: ${res.statusText}`
            );
          }
          const resJson = await res.json();
          console.log(`Fetched asset data for ${transaction.asset}:`, resJson);
          // Ensure the response matches the AssetType structure
          return resJson as AssetType;
        },
        staleTime: 15 * 60 * 1000, // 15 minutes
        enabled: !!transaction.asset,
      };
    }),
  });

  transactionQueries.forEach((query, index) => {
    if (query.isLoading) {
      console.log(
        `Loading transaction asset data for transaction ${index + 1}`
      );
    } else if (query.isError) {
      console.error(
        `Error fetching asset data for transaction ${index + 1}:`,
        query.error
      );
    }
    console.log(`Fetched asset data for transaction ${index + 1}:`, query.data);
  });

  console.log("Transactions Loader Data:", loaderData.transactions);

  // Compute filtered transactions directly without useState
  const rawTransactions =
    selectedPortfolio && selectedPortfolio.id >= 0
      ? loaderData.transactions.filter(
          (t) => t.portfolioId === selectedPortfolio.id
        )
      : loaderData.transactions || [];

  // Transform database transactions to match TransactionType interface
  const transactions: TransactionType[] = rawTransactions.map(t => ({
    ...t,
    asset: {
      symbol: t.asset,
      isFetchedFromApi: false, // Default value, could be enhanced based on your logic
    },
    isHousekeeping: Boolean(t.isHouskeeping), // Convert number to boolean
    recurrence: t.recurrence || undefined, // Convert null to undefined
    tags: t.tags || "", // Convert null to empty string
    notes: t.notes || undefined, // Convert null to undefined
  }));

  console.log("Selected Portfolio:", selectedPortfolio);
  console.log("Filtered Transactions:", transactions);

  // Generate 10 years of test data with transaction-based performance tracking
  const chartTestData = useMemo(() => {
    // Use seeded random for consistent results between server and client
    const seededRandom = (seed: number) => {
      const x = Math.sin(seed) * 10000;
      return x - Math.floor(x);
    };
    let seedCounter = 12345; // Fixed seed for consistency
    
    const data = [];
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(endDate.getFullYear() - 10);
    
    // Generate transactions with realistic financial data
    const transactions = [];
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Create transactions every 2-3 weeks
    let currentTransactionDay = Math.floor(seededRandom(seedCounter++) * 21) + 7;
    let portfolioShares = 0;
    let cumulativeInvestment = 0; // Total money invested (including fees)
    
    while (currentTransactionDay < totalDays) {
      const transactionDate = new Date(startDate);
      transactionDate.setDate(startDate.getDate() + currentTransactionDay);
      const dateString = transactionDate.toISOString().split('T')[0];
      
      // Generate transaction details
      const transactionType: "buy" | "sell" = seededRandom(seedCounter++) > 0.3 ? "buy" : "sell"; // 70% buy, 30% sell
      const baseAmount = seededRandom(seedCounter++) * 4000 + 1000; // $1000-$5000 per transaction
      const sharePrice = seededRandom(seedCounter++) * 100 + 50; // $50-$150 per share
      const shares = transactionType === "sell" ? Math.min(portfolioShares * 0.3, baseAmount / sharePrice) : baseAmount / sharePrice;
      
      if (transactionType === "sell" && portfolioShares <= 0) {
        // Skip sell if no shares to sell
        currentTransactionDay += Math.floor(seededRandom(seedCounter++) * 8) + 14;
        continue;
      }
      
      const transactionAmount = shares * sharePrice;
      const commission = seededRandom(seedCounter++) * 15 + 5; // $5-$20 commission
      const taxRate = transactionType === "sell" ? 0.15 : 0; // 15% capital gains tax on sells
      const taxes = transactionType === "sell" ? transactionAmount * taxRate : 0;
      const totalCost = transactionAmount + commission + taxes;
      
      // Update portfolio
      if (transactionType === "buy") {
        portfolioShares += shares;
        cumulativeInvestment += totalCost;
      } else {
        portfolioShares -= shares;
        cumulativeInvestment -= (totalCost - taxes - commission); // Subtract net proceeds
      }
      
      transactions.push({
        date: dateString,
        type: transactionType,
        shares: shares,
        sharePrice: sharePrice,
        amount: transactionAmount,
        commission: commission,
        taxes: taxes,
        totalCost: totalCost,
        portfolioShares: portfolioShares,
        cumulativeInvestment: cumulativeInvestment
      });
      
      currentTransactionDay += Math.floor(seededRandom(seedCounter++) * 8) + 14;
    }
    
    // Generate daily data points
    const currentDate = new Date(startDate);
    let dailySharePrice = 60; // Starting share price
    
    while (currentDate <= endDate) {
      const dateString = currentDate.toISOString().split('T')[0];
      
      // Simulate daily share price movement
      const daysSinceStart = Math.ceil((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const progressRatio = daysSinceStart / totalDays;
      
      // Create realistic market movements
      const cycleFrequency = 6;
      const cyclePhase = (progressRatio * cycleFrequency * 2 * Math.PI);
      const cyclicalTrend = Math.sin(cyclePhase) * 0.1; // ±10% cyclical movement
      const longTermGrowth = progressRatio * 0.8; // 80% growth over 10 years
      const dailyVolatility = (seededRandom(seedCounter++) - 0.5) * 0.04; // ±2% daily volatility
      
      const growthFactor = 1 + longTermGrowth + cyclicalTrend + dailyVolatility;
      dailySharePrice = 60 * growthFactor;
      
      // Find transaction for this date
      const dayTransaction = transactions.find(t => t.date === dateString);
      let currentPortfolioShares = 0;
      let currentCumulativeInvestment = 0;
      
      // Get portfolio state up to this date
      for (const trans of transactions) {
        if (trans.date <= dateString) {
          currentPortfolioShares = trans.portfolioShares;
          currentCumulativeInvestment = trans.cumulativeInvestment;
        } else {
          break;
        }
      }
      
      // Calculate performance and baseline
      const currentPortfolioValue = currentPortfolioShares * dailySharePrice;
      const performance = currentPortfolioValue;
      const baseline = currentCumulativeInvestment; // Total invested with fees/taxes
      
      data.push({
        date: dateString,
        performance: Math.round(performance * 100) / 100,
        baseline: Math.round(baseline * 100) / 100,
        hasTransaction: !!dayTransaction,
        transactionType: dayTransaction?.type,
        sharePrice: Math.round(dailySharePrice * 100) / 100,
        portfolioShares: Math.round(currentPortfolioShares * 100) / 100,
        transactionAmount: dayTransaction?.amount || 0,
        commission: dayTransaction?.commission || 0,
        taxes: dayTransaction?.taxes || 0
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    console.log("Generated transactions:", transactions.length);
    console.log("Total data points with transactions:", data.filter(d => d.hasTransaction).length);
    return data;
  }, []);

  // Calculate fact values based on timeRange and transactions
  const factValues = useMemo(() => {
    // Filter chart data based on time range
    const now = new Date();
    let startDate = new Date();

    switch (timeRange) {
      case "1d":
        startDate.setDate(now.getDate() - 1);
        break;
      case "1w":
        startDate.setDate(now.getDate() - 7);
        break;
      case "1m":
        startDate.setMonth(now.getMonth() - 1);
        break;
      case "YTD":
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      case "1Y":
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case "5Y":
        startDate.setFullYear(now.getFullYear() - 5);
        break;
      case "ALL":
        startDate = new Date(0); // Beginning of time
        break;
      default:
        startDate.setFullYear(now.getFullYear() - 1);
    }

    const filteredData = chartTestData.filter((item) => {
      const itemDate = new Date(item.date);
      return itemDate >= startDate;
    });

    // Calculate values from the filtered chart data
    const latestData = filteredData[filteredData.length - 1];
    const totalInvestment = latestData?.baseline || 0;
    const currentValue = latestData?.performance || 0;
    
    // Calculate commission and taxes from transactions within the time period
    const filteredTransactionData = filteredData.filter(d => d.hasTransaction);
    const totalCommission = filteredTransactionData.reduce((sum, d) => sum + (d.commission || 0), 0);
    const totalTaxes = filteredTransactionData.reduce((sum, d) => sum + (d.taxes || 0), 0);
    
    // Transaction count (excluding housekeeping - we don't have real transactions with housekeeping flag, so count all)
    const transactionCount = filteredTransactionData.length;
    
    // Cash available - for demo purposes, let's assume 10% of current value as available cash
    const totalCash = currentValue * 0.1;

    return {
      totalInvestment,
      totalCash,
      totalCommission,
      totalTaxes,
      performance: currentValue,
      transactionCount,
    };
  }, [chartTestData, timeRange]);

  const timeRangeLabels = {
    "1d": "Last 1 day",
    "1w": "Last 1 week", 
    "1m": "Last 1 month",
    "YTD": "Year to date",
    "1Y": "Last 1 year",
    "5Y": "Last 5 years",
    "ALL": "All time"
  };

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        {/* Time Range Toggle Controls */}
        <div className="px-4 lg:px-6">
          <div className="flex flex-col gap-4">
            <h1 className="text-2xl font-bold">Portfolio Analytics</h1>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-muted-foreground">
                Viewing data for: {timeRangeLabels[timeRange as keyof typeof timeRangeLabels]}
              </p>
              <div className="flex gap-2">
                <ToggleGroup
                  type="single"
                  value={timeRange}
                  onValueChange={setTimeRange}
                  variant="outline"
                  className="hidden *:data-[slot=toggle-group-item]:!px-3 sm:flex"
                >
                  <ToggleGroupItem value="1d">1D</ToggleGroupItem>
                  <ToggleGroupItem value="1w">1W</ToggleGroupItem>
                  <ToggleGroupItem value="1m">1M</ToggleGroupItem>
                  <ToggleGroupItem value="YTD">YTD</ToggleGroupItem>
                  <ToggleGroupItem value="1Y">1Y</ToggleGroupItem>
                  <ToggleGroupItem value="5Y">5Y</ToggleGroupItem>
                  <ToggleGroupItem value="ALL">ALL</ToggleGroupItem>
                </ToggleGroup>
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger
                    className="flex w-40 sm:hidden"
                    size="sm"
                    aria-label="Select time range"
                  >
                    <SelectValue placeholder="Last 1 year" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="1d" className="rounded-lg">
                      1 Day
                    </SelectItem>
                    <SelectItem value="1w" className="rounded-lg">
                      1 Week
                    </SelectItem>
                    <SelectItem value="1m" className="rounded-lg">
                      1 Month
                    </SelectItem>
                    <SelectItem value="YTD" className="rounded-lg">
                      Year to Date
                    </SelectItem>
                    <SelectItem value="1Y" className="rounded-lg">
                      1 Year
                    </SelectItem>
                    <SelectItem value="5Y" className="rounded-lg">
                      5 Years
                    </SelectItem>
                    <SelectItem value="ALL" className="rounded-lg">
                      All Time
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        <FactCards 
          transactions={transactions}
          assets={transactionQueries.map(q => q.data).filter(Boolean) as AssetType[]}
          currency="USD"
          timeRange={timeRangeLabels[timeRange as keyof typeof timeRangeLabels]}
        />
        <div className="px-4 lg:px-6">
          <ChartAreaInteractive 
            data={chartTestData} 
            currency="USD" 
            timeRange={timeRange}
          />
        </div>
        {transactions && transactions.length > 0 ? (
          <div className="px-4 lg:px-6">
            <h2 className="text-lg font-semibold">Transactions</h2>
            <ul className="list-disc pl-5">
              {transactions.map((transaction) => (
                <li key={transaction.id} className="py-1">
                  {transaction.asset.symbol} - {transaction.quantity} @ $
                  {transaction.price} on{" "}
                  {new Date(transaction.date).toLocaleDateString()}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="px-4 lg:px-6">
            <h2 className="text-lg font-semibold">
              No transactions found for this portfolio.
            </h2>
          </div>
        )}
        {/* <DataTable data={data} /> */}
      </div>
    </div>
  );
}
