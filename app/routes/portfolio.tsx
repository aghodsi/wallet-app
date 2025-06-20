import { userPortfolios } from "~/stateManagement/portfolioContext";
import { FactCards } from "~/components/portfolio/factCardsComponents";
import { ChartAreaInteractive } from "~/components/portfolio/chartsInteractiveComponent";
import CalendarComponent from "~/components/calendarComponent";
import { PerformanceTables } from "~/components/performanceTables";
import type { Route } from "./+types/portfolio";
import { fetchAllTransactions } from "~/db/actions";
import { useQueries, useQuery } from "@tanstack/react-query";
import type { AssetType } from "~/datatypes/asset";
import type { CurrencyType } from "~/datatypes/currency";
import { useTransactionDialog } from "~/contexts/transactionDialogContext";
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
import { AuthGuard } from "~/components/AuthGuard";
import { ErrorDisplay, EmptyState } from "~/components/ErrorBoundary";

export async function loader({ request, params }: Route.LoaderArgs) {
  try {
    const transactions = await fetchAllTransactions();
    return { transactions };
  } catch (error) {
    console.error("Error loading portfolio data:", error);
    return { transactions: [], error: "Failed to load portfolio data" };
  }
}

export default function Portfolio({ loaderData }: Route.ComponentProps) {
  const { transactions: loaderTransactions, error } = loaderData;
  const [timeRange, setTimeRange] = useState("1Y");
  const portfolios = userPortfolios();
  const selectedPortfolio = portfolios.find((p) => p.selected);
  const { currencies } = useTransactionDialog();

  if (error) {
    return (
      <AuthGuard>
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="px-4 lg:px-6">
              <ErrorDisplay 
                error={error}
                title="Failed to Load Portfolio Data"
                description="There was an issue loading your portfolio information."
                onRetry={() => window.location.reload()}
              />
            </div>
          </div>
        </div>
      </AuthGuard>
    );
  }
  // TanStack Query for asset search
  const transactionQueries = useQueries({
    queries: (loaderTransactions || []).map((transaction) => {
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
        `Loading transaction asset data for transaction ${index + 1} and asset ${query}...`
      );
    } else if (query.isError) {
      console.error(
        `Error fetching asset data for transaction ${index + 1}:`,
        query.error
      );
    }
    console.log(`Fetched asset data for transaction ${index + 1}:`, query.data);
  });


  // Compute filtered transactions directly without useState
  const rawTransactions =
    selectedPortfolio && selectedPortfolio.id >= 0
      ? (loaderTransactions || []).filter(
          (t) => t.portfolioId === selectedPortfolio.id
        )
      : loaderTransactions || [];

  // Transform database transactions to match TransactionType interface
  const transactions: TransactionType[] = rawTransactions.map(t => {
    const transactionPortfolio = portfolios.find(p => p.id === t.portfolioId);
    return {
      ...t,
      asset: {
        symbol: t.asset,
        isFetchedFromApi: false, // Default value, could be enhanced based on your logic
      },
      currency: t.currency ? currencies.find(c => c.id === t.currency) : transactionPortfolio?.currency, // Use transaction currency or fall back to portfolio currency
      isHousekeeping: Boolean(t.isHouskeeping), // Convert number to boolean
      recurrence: t.recurrence || undefined, // Convert null to undefined
      tags: t.tags || "", // Convert null to empty string
      notes: t.notes || undefined, // Convert null to undefined
    };
  });

  console.log("Selected Portfolio:", selectedPortfolio);
  console.log("Filtered Transactions:", transactions);

  // Generate chart data from actual transactions
  const chartData = useMemo(() => {
    if (!transactions.length) return [];

    // Sort transactions by date
    const sortedTransactions = transactions
      .slice()
      .sort((a, b) => new Date(parseInt(a.date)).getTime() - new Date(parseInt(b.date)).getTime());

    // Create a map of transactions by date
    const transactionsByDate = new Map<string, TransactionType[]>();
    sortedTransactions.forEach(transaction => {
      const dateStr = new Date(parseInt(transaction.date)).toISOString().split('T')[0];
      if (!transactionsByDate.has(dateStr)) {
        transactionsByDate.set(dateStr, []);
      }
      transactionsByDate.get(dateStr)!.push(transaction);
    });

    // Get date range
    const startDate = sortedTransactions.length > 0 
      ? new Date(parseInt(sortedTransactions[0].date))
      : new Date();
    const endDate = new Date();

    // Generate daily data points
    const data = [];
    let cumulativeInvestment = 0;
    let portfolioValue = 0;

    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateString = currentDate.toISOString().split('T')[0];
      const dayTransactions = transactionsByDate.get(dateString) || [];

      // Process transactions for this day
      dayTransactions.forEach(transaction => {
        const amount = transaction.quantity * transaction.price;
        const commission = transaction.commision || 0;
        const tax = transaction.tax || 0;
        const totalCost = amount + commission + tax;

        if (transaction.type === "Buy" || transaction.type === "Deposit") {
          cumulativeInvestment += totalCost;
          portfolioValue += amount; // Exclude fees from portfolio value
        } else if (transaction.type === "Sell" || transaction.type === "Withdraw") {
          cumulativeInvestment -= amount; // Reduce by the sale amount
          portfolioValue -= amount;
        }
      });

      // For simplicity, assume portfolio grows at a modest rate when no transactions occur
      // In a real app, you'd fetch current market prices for each asset
      if (dayTransactions.length === 0 && portfolioValue > 0) {
        // Apply a small daily growth rate (approximately 7% annual growth)
        portfolioValue *= 1.0002; // ~7% annual growth rate
      }

      data.push({
        date: dateString,
        performance: Math.round(portfolioValue * 100) / 100,
        baseline: Math.round(cumulativeInvestment * 100) / 100,
        hasTransaction: dayTransactions.length > 0,
        transactionType: dayTransactions.length > 0 ? 
          (dayTransactions[0].type.toLowerCase() === "buy" || dayTransactions[0].type.toLowerCase() === "sell" 
            ? dayTransactions[0].type.toLowerCase() as "buy" | "sell" 
            : dayTransactions[0].type.toLowerCase() === "deposit" ? "buy" as const
            : dayTransactions[0].type.toLowerCase() === "withdraw" ? "sell" as const
            : undefined) 
          : undefined,
        transactionAmount: dayTransactions.reduce((sum, t) => sum + (t.quantity * t.price), 0),
        commission: dayTransactions.reduce((sum, t) => sum + (t.commision || 0), 0),
        taxes: dayTransactions.reduce((sum, t) => sum + (t.tax || 0), 0)
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return data;
  }, [transactions]);

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

    const filteredData = chartData.filter((item: any) => {
      const itemDate = new Date(item.date);
      return itemDate >= startDate;
    });

    // Calculate values from the filtered chart data
    const latestData = filteredData[filteredData.length - 1];
    const totalInvestment = latestData?.baseline || 0;
    const currentValue = latestData?.performance || 0;
    
    // Calculate commission and taxes from transactions within the time period
    const filteredTransactionData = filteredData.filter((d: any) => d.hasTransaction);
    const totalCommission = filteredTransactionData.reduce((sum: number, d: any) => sum + (d.commission || 0), 0);
    const totalTaxes = filteredTransactionData.reduce((sum: number, d: any) => sum + (d.taxes || 0), 0);
    
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
  }, [chartData, timeRange]);

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
    <AuthGuard>
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
          currency={selectedPortfolio?.currency?.code || "USD"}
          timeRange={timeRangeLabels[timeRange as keyof typeof timeRangeLabels]}
          selectedPortfolio={selectedPortfolio}
        />
        <div className="px-4 lg:px-6">
          <ChartAreaInteractive 
            data={chartData} 
            currency={selectedPortfolio?.currency?.code || "USD"} 
            timeRange={timeRange}
          />
        </div>
        <div className="px-4 lg:px-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-1 xl:grid-cols-3">
            {/* Calendar Component */}
            <div className="w-full xl:col-span-1">
              <CalendarComponent 
                transactions={transactions}
                assets={transactionQueries.map(q => q.data).filter(Boolean) as AssetType[]}
                title="Transaction Calendar"
              />
            </div>
            
            {/* Performance Tables */}
            <div className="w-full xl:col-span-2">
              <PerformanceTables
                transactions={transactions}
                assets={transactionQueries.map(q => q.data).filter(Boolean) as AssetType[]}
                timeRange={timeRange}
                currency={selectedPortfolio?.currency?.code || "USD"}
              />
            </div>
          </div>
        </div>
        {/* {transactions && transactions.length > 0 ? (
          <div className="px-4 lg:px-6">
            <h2 className="text-lg font-semibold">Transactions</h2>
            <ul className="list-disc pl-5">
              {transactions.map((transaction) => (
                <li key={transaction.id} className="py-1">
                  {transaction.asset.symbol} - {transaction.quantity} @ $
                  {transaction.price} on{" "}
                  {new Date(parseInt(transaction.date)).toLocaleDateString()}
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
        )} */}
        {/* <DataTable data={data} /> */}
      </div>
      </div>
    </AuthGuard>
  );
}
