import { usePortfolioDispatch, userPortfolios } from "~/stateManagement/portfolioContext";
import type { Route } from "./+types/home";
import { useEffect, useState } from "react";
import type { InstitutionType } from "~/datatypes/institution";
import type { CurrencyType } from "~/datatypes/currency";
import { fetchCurrencies, fetchInstitutions, fetchAllTransactions, getAssetsBySymbols } from "~/db/actions";
import { useFetcher, useSearchParams } from "react-router";
import { toast } from "sonner";
import type { PortfolioType } from "~/datatypes/portfolio";
import type { TransactionType } from "~/datatypes/transaction";
import type { AssetType } from "~/datatypes/asset";
import { Button } from "~/components/ui/button";
import { TransactionCreation } from "~/components/transactionCreation";
import { PortfolioCreation } from "~/components/portfolioCreation";
import { Toaster } from "~/components/ui/sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Separator } from "~/components/ui/separator";
import { Skeleton } from "~/components/ui/skeleton";
import { PlusCircle, TrendingUp, TrendingDown, PiggyBank, Target, Wallet, ArrowRight, BarChart3, DollarSign, Activity, Coins } from "lucide-react";
import { Treemap, ResponsiveContainer, Cell, Tooltip } from "recharts";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "Wallet Manager - Home" },
    { name: "description", content: "Manage your portfolios and track your investments" },
  ];
}

export async function loader({ request, params }: Route.LoaderArgs) {
  const institutions = await fetchInstitutions();
  const currencies = await fetchCurrencies();
  const transactions = await fetchAllTransactions();

  const institudionsWithType = institutions.map((i) => ({
    id: i.id,
    name: i.name,
    isDefault: i.isDefault || false,
    website: i.website || undefined,
    apiKey: i.apiKey || undefined,
    apiSecret: i.apiSecret || undefined,
    isNew: false,
  })) as InstitutionType[];
  
  const currencieswithType = currencies.map((c) => ({
    ...c,
    exchangeRate: c.exchangeRate || 1,
    isDefault: c.isDefault || false,
  })) as CurrencyType[];

  // Transform transactions to proper type
  const transactionsWithType = transactions.map((t) => ({
    ...t,
    asset: {
      symbol: t.asset || "CASH",
      isFetchedFromApi: false,
    },
    isHousekeeping: !!t.isHouskeeping,
    isCreatedByUser: true,
  })) as TransactionType[];

  // Get unique asset symbols for fetching asset data
  const assetSymbols = [...new Set(transactionsWithType
    .filter(t => t.asset.symbol !== "CASH" && t.asset.symbol !== "Cash")
    .map(t => t.asset.symbol))];

  let assets: AssetType[] = [];
  if (assetSymbols.length > 0) {
    try {
      const assetData = await getAssetsBySymbols(assetSymbols);
      assets = assetData.map((a) => ({
        ...a,
        isFromApi: !!a.isFromApi,
        quotes: a.quotes || "{}",
        events: a.events || "{}",
      })) as AssetType[];
    } catch (error) {
      console.error("Error fetching assets:", error);
    }
  }

  return {
    institutions: institudionsWithType,
    currencies: currencieswithType,
    transactions: transactionsWithType,
    assets,
  };
}

interface TreemapData {
  name: string;
  value: number;
  fill: string;
  type: 'cash' | 'stock' | 'crypto' | 'bond' | 'etf';
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const portfolios = userPortfolios();
  const portfolioDispatch = usePortfolioDispatch();
  const [openPortfolio, setOpenPortfolio] = useState(false);
  const [openTransaction, setOpenTransaction] = useState(false);
  const [createdPortfolio, setCreatedPortfolio] = useState({} as PortfolioType);
  const [createdTransaction, setCreatedTransaction] = useState({} as TransactionType);

  const fetcher = useFetcher();

  useEffect(() => {
    const action = searchParams.get("action");
    setOpenPortfolio(action === "createPortfolio");
    setOpenTransaction(action === "createTransaction");
  }, [searchParams]);

  // Handle fetcher responses
  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data) {
      if (fetcher.data.error) {
        const errorMessage = fetcher.data.error.message || "Unknown error occurred";
        toast.error(`Error: ${errorMessage}`);
      } else {
        if (fetcher.data.action == "createTransaction") {
          toast.success("Transaction added successfully!");
          setOpenTransaction(false);
        } else {
          toast.success("Portfolio created successfully!");
          createdPortfolio.id = fetcher.data.id;
          portfolioDispatch({
            type: "added",
            portfolio: createdPortfolio
          });
          setOpenPortfolio(false);
        }
      }
    }
  }, [fetcher.state, fetcher.data]);

  // Calculate overall portfolio statistics
  const portfolioStats = (() => {
    if (portfolios.length === 0) return null;

    const portfolioIds = portfolios.map(p => p.id);
    const relevantTransactions = loaderData.transactions.filter(t => 
      portfolioIds.includes(t.portfolioId) && !t.isHousekeeping
    );

    // Calculate totals
    const totalInvestment = relevantTransactions
      .filter(t => t.type === "Buy" || t.type === "Deposit")
      .reduce((sum, t) => sum + (t.quantity * t.price), 0);

    const totalWithdrawals = relevantTransactions
      .filter(t => t.type === "Sell" || t.type === "Withdraw")
      .reduce((sum, t) => sum + (t.quantity * t.price), 0);

    const totalCommissions = relevantTransactions.reduce((sum, t) => sum + (t.commision || 0), 0);
    const totalTaxes = relevantTransactions.reduce((sum, t) => sum + (t.tax || 0), 0);

    // Mock current value calculation (in real app, would use current prices)
    const currentValue = totalInvestment * 1.12; // Assume 12% overall growth
    const totalGainLoss = currentValue - totalInvestment;
    const totalGainLossPercentage = totalInvestment > 0 ? (totalGainLoss / totalInvestment) * 100 : 0;

    // Calculate liquidity (approximate cash positions)
    const cashValue = currentValue * 0.15; // Assume 15% in cash/liquid assets
    const investedValue = currentValue - cashValue;

    return {
      totalInvestment,
      currentValue,
      totalGainLoss,
      totalGainLossPercentage,
      cashValue,
      investedValue,
      totalCommissions,
      totalTaxes,
      portfolioCount: portfolios.length,
    };
  })();

  // Generate treemap data
  const treemapData: TreemapData[] = (() => {
    if (!portfolioStats) return [];

    const portfolioIds = portfolios.map(p => p.id);
    const relevantTransactions = loaderData.transactions.filter(t => 
      portfolioIds.includes(t.portfolioId) && !t.isHousekeeping
    );

    // Group by assets and calculate current values
    const assetMap = new Map<string, number>();
    
    relevantTransactions.forEach(transaction => {
      const symbol = transaction.asset.symbol;
      const value = transaction.quantity * transaction.price;
      
      if (transaction.type === "Buy" || transaction.type === "Deposit") {
        assetMap.set(symbol, (assetMap.get(symbol) || 0) + value);
      } else if (transaction.type === "Sell" || transaction.type === "Withdraw") {
        assetMap.set(symbol, (assetMap.get(symbol) || 0) - value);
      }
    });

    // Convert to treemap format with ShadCN-inspired colors
    // Using explicit colors that match ShadCN's chart palette
    const colors = [
      '#e11d48', // chart-1 equivalent (red)
      '#06b6d4', // chart-2 equivalent (cyan)
      '#8b5cf6', // chart-3 equivalent (violet) 
      '#10b981', // chart-4 equivalent (emerald)
      '#f59e0b', // chart-5 equivalent (amber)
      '#3b82f6', // blue
      '#ef4444', // red
      '#22c55e', // green
      '#a855f7', // purple
      '#ec4899', // pink
      '#6366f1', // indigo
      '#14b8a6', // teal
      '#f97316', // orange
      '#84cc16', // lime
      '#06b6d4'  // cyan
    ];

    return Array.from(assetMap.entries())
      .filter(([_, value]) => value > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15) // Show top 15 assets
      .map(([symbol, value], index) => {
        const asset = loaderData.assets.find(a => a.symbol === symbol);
        
        // Determine asset type
        let type: TreemapData['type'] = 'stock';
        if (symbol === 'Cash' || symbol === 'CASH') {
          type = 'cash';
        } else if (asset?.instrumentType?.toLowerCase().includes('crypto')) {
          type = 'crypto';
        } else if (asset?.instrumentType?.toLowerCase().includes('bond')) {
          type = 'bond';
        } else if (asset?.instrumentType?.toLowerCase().includes('etf')) {
          type = 'etf';
        }

        return {
          name: symbol,
          value: value * 1.12, // Apply growth factor
          fill: colors[index % colors.length],
          type,
        };
      });
  })();

  const formatCurrency = (amount: number, currency = "USD") => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (portfolios.length === 0) {
    // No portfolios - show invitation to create one
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16 space-y-8">
          {/* Header section with proper spacing */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center mb-6">
              <div className="rounded-full bg-primary/10 p-4">
                <Wallet className="h-12 w-12 text-primary" />
              </div>
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
              Welcome to Wallet Manager
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Take control of your financial future with intelligent portfolio management and real-time insights
            </p>
          </div>

          <Separator className="max-w-xs mx-auto" />

          {/* Main call-to-action card */}
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader className="text-center space-y-4">
                <CardTitle className="text-2xl">Get Started</CardTitle>
                <CardDescription>
                  Create your first portfolio to begin tracking investments and building wealth
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Feature highlights */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center space-y-2 p-4 rounded-lg border">
                    <div className="rounded-full bg-blue-100 dark:bg-blue-900/20 w-12 h-12 flex items-center justify-center mx-auto">
                      <Target className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="font-semibold">Set Goals</h3>
                    <p className="text-sm text-muted-foreground">
                      Define investment objectives
                    </p>
                  </div>
                  <div className="text-center space-y-2 p-4 rounded-lg border">
                    <div className="rounded-full bg-green-100 dark:bg-green-900/20 w-12 h-12 flex items-center justify-center mx-auto">
                      <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="font-semibold">Track Growth</h3>
                    <p className="text-sm text-muted-foreground">
                      Monitor performance
                    </p>
                  </div>
                  <div className="text-center space-y-2 p-4 rounded-lg border">
                    <div className="rounded-full bg-purple-100 dark:bg-purple-900/20 w-12 h-12 flex items-center justify-center mx-auto">
                      <PiggyBank className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <h3 className="font-semibold">Build Wealth</h3>
                    <p className="text-sm text-muted-foreground">
                      Grow your future
                    </p>
                  </div>
                </div>

                <Separator />

                {/* CTA Button */}
                <div className="text-center space-y-4">
                  <Button 
                    onClick={() => setOpenPortfolio(true)}
                    size="lg"
                    className="w-full sm:w-auto"
                  >
                    <PlusCircle className="mr-2 h-5 w-5" />
                    Create Your First Portfolio
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    Get started in under a minute
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <PortfolioCreation
          open={openPortfolio}
          openChange={setOpenPortfolio}
          onCreate={(p) => {
            toast.info("Creating portfolio...");
            const formData = new FormData();
            setCreatedPortfolio(p);
            formData.append("portfolio", JSON.stringify(p));
            fetcher.submit(formData, {
              method: "post",
              action: "/createPortfolio",
            });
          }}
          currencies={loaderData.currencies}
          institutions={loaderData.institutions}
        />
        <Toaster />
      </div>
    );
  }

  // Custom tooltip component for treemap
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const totalValue = treemapData.reduce((sum, d) => sum + d.value, 0);
      const percentage = ((data.value / totalValue) * 100).toFixed(1);
      
      return (
        <Card className="p-3 shadow-lg border">
          <div className="space-y-1">
            <p className="font-semibold">{data.name}</p>
            <p className="text-sm">{formatCurrency(data.value)}</p>
            <p className="text-sm text-muted-foreground">{percentage}% of total</p>
            <Badge variant="outline" className="text-xs">
              {data.type.toUpperCase()}
            </Badge>
          </div>
        </Card>
      );
    }
    return null;
  };

  // Portfolios exist - show dashboard
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Portfolio Dashboard</h1>
              <p className="text-muted-foreground">
                {portfolios.length} portfolio{portfolios.length > 1 ? 's' : ''} • 
                Total value {portfolioStats ? formatCurrency(portfolioStats.currentValue) : '$0'}
              </p>
            </div>
          </div>
        </div>

        {/* Portfolio Stats Grid */}
        {portfolioStats && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Value</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(portfolioStats.currentValue)}</div>
                <div className="flex items-center pt-1">
                  {portfolioStats.totalGainLoss >= 0 ? (
                    <Badge variant="secondary" className="text-green-600">
                      <TrendingUp className="mr-1 h-3 w-3" />
                      +{formatCurrency(portfolioStats.totalGainLoss)}
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-red-600">
                      <TrendingDown className="mr-1 h-3 w-3" />
                      {formatCurrency(portfolioStats.totalGainLoss)}
                    </Badge>
                  )}
                  <span className="ml-2 text-xs text-muted-foreground">
                    {portfolioStats.totalGainLossPercentage >= 0 ? '+' : ''}{portfolioStats.totalGainLossPercentage.toFixed(1)}%
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Invested</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(portfolioStats.totalInvestment)}</div>
                <p className="text-xs text-muted-foreground pt-1">
                  Principal amount invested
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cash Available</CardTitle>
                <PiggyBank className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(portfolioStats.cashValue)}</div>
                <p className="text-xs text-muted-foreground pt-1">
                  {((portfolioStats.cashValue / portfolioStats.currentValue) * 100).toFixed(1)}% of total portfolio
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Invested Assets</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(portfolioStats.investedValue)}</div>
                <p className="text-xs text-muted-foreground pt-1">
                  {((portfolioStats.investedValue / portfolioStats.currentValue) * 100).toFixed(1)}% in active investments
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Asset Allocation Treemap */}
        {treemapData.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div className="space-y-1">
                <CardTitle className="text-xl font-semibold">Asset Allocation</CardTitle>
                <CardDescription>
                  Interactive breakdown of your portfolio holdings across {treemapData.length} assets
                </CardDescription>
              </div>
              <div className="rounded-lg bg-primary/10 p-2">
                <Coins className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="h-96 w-full rounded-lg border bg-muted/50">
                <style>{`
                  .recharts-treemap-rectangle {
                    rx: 8px !important;
                    ry: 8px !important;
                  }
                `}</style>
                <ResponsiveContainer width="100%" height="100%">
                  <Treemap
                    data={treemapData}
                    dataKey="value"
                    aspectRatio={4 / 3}
                  >
                    <Tooltip content={<CustomTooltip />} />
                    {treemapData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Treemap>
                </ResponsiveContainer>
              </div>

              <Separator />

              {/* Asset Legend */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Top Holdings</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {treemapData.slice(0, 8).map((item, index) => (
                    <div key={item.name} className="flex items-center gap-2 p-2 rounded-lg border bg-card">
                      <div 
                        className="w-3 h-3 rounded-sm shrink-0" 
                        style={{ backgroundColor: item.fill }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {((item.value / treemapData.reduce((sum, d) => sum + d.value, 0)) * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <TransactionCreation
        open={openTransaction}
        openChange={setOpenTransaction}
        onCreate={(t) => {
          toast.info("Adding transaction...");
          const formData = new FormData();
          formData.append("transaction", JSON.stringify(t));
          fetcher.submit(formData, {
            method: "POST",
            action: "/api/transactions",
          });
        }}
        portfolios={portfolios}
        selectedPortfolioId={portfolios[0]?.id || 0}
        currencies={loaderData.currencies}
      />

      <PortfolioCreation
        open={openPortfolio}
        openChange={setOpenPortfolio}
        onCreate={(p) => {
          toast.info("Creating portfolio...");
          const formData = new FormData();
          setCreatedPortfolio(p);
          formData.append("portfolio", JSON.stringify(p));
          fetcher.submit(formData, {
            method: "post",
            action: "/createPortfolio",
          });
        }}
        currencies={loaderData.currencies}
        institutions={loaderData.institutions}
      />
      <Toaster />
    </div>
  );
}
