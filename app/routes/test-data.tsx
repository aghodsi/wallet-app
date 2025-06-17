import { useState } from "react";
import { useTestData } from "~/hooks/useTestData";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Separator } from "~/components/ui/separator";

export default function TestDataPage() {
  const { generateComplete, generateAssets, generateTransactions, generateCustom, isLoading, error } = useTestData();
  const [lastResult, setLastResult] = useState<any>(null);
  const [portfolioId, setPortfolioId] = useState<number>(1);

  const handleGenerate = async (action: () => Promise<any>, actionName: string) => {
    console.log(`Starting ${actionName}...`);
    const result = await action();
    setLastResult({ ...result, actionName });
    
    if (result.success) {
      console.log(`${actionName} completed successfully:`, result.data);
      // You might want to refresh the page or navigate to show the data
      // window.location.reload(); // Uncomment to auto-refresh
    } else {
      console.error(`${actionName} failed:`, result.message);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Test Data Generator</h1>
        <p className="text-muted-foreground mt-2">
          Generate realistic test data for your wallet app. Use this page to populate your app with sample portfolios, assets, and transactions.
        </p>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {lastResult && (
        <Card className={lastResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
          <CardHeader>
            <CardTitle className={lastResult.success ? "text-green-700" : "text-red-700"}>
              {lastResult.actionName} {lastResult.success ? "Completed" : "Failed"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={lastResult.success ? "text-green-600" : "text-red-600"}>
              {lastResult.message}
            </p>
            {lastResult.success && lastResult.data && (
              <div className="mt-4 p-4 bg-white rounded border">
                <pre className="text-sm overflow-auto">
                  {JSON.stringify(lastResult.data, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Quick Setup */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Setup</CardTitle>
            <CardDescription>
              Generate complete test data with predefined configurations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Button
                onClick={() => handleGenerate(() => generateComplete("minimal"), "Minimal Setup")}
                disabled={isLoading}
                className="w-full"
                variant="outline"
              >
                {isLoading ? "Generating..." : "Minimal Setup"}
                <Badge variant="secondary" className="ml-2">1 portfolio, 5 transactions</Badge>
              </Button>
              
              <Button
                onClick={() => handleGenerate(() => generateComplete("standard"), "Standard Setup")}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? "Generating..." : "Standard Setup"}
                <Badge variant="secondary" className="ml-2">2 portfolios, 15 transactions each</Badge>
              </Button>
              
              <Button
                onClick={() => handleGenerate(() => generateComplete("extensive"), "Extensive Setup")}
                disabled={isLoading}
                className="w-full"
                variant="outline"
              >
                {isLoading ? "Generating..." : "Extensive Setup"}
                <Badge variant="secondary" className="ml-2">5 portfolios, 30 transactions each</Badge>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Individual Components */}
        <Card>
          <CardHeader>
            <CardTitle>Individual Components</CardTitle>
            <CardDescription>
              Generate specific types of test data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={() => handleGenerate(() => generateAssets(), "Generate Assets")}
              disabled={isLoading}
              className="w-full"
              variant="outline"
            >
              {isLoading ? "Generating..." : "Generate Test Assets"}
              <Badge variant="secondary" className="ml-2">AAPL, GOOGL, TSLA, MSFT, NVDA</Badge>
            </Button>

            <Separator />

            <div className="space-y-2">
              <label className="text-sm font-medium">Add transactions to portfolio:</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={portfolioId}
                  onChange={(e) => setPortfolioId(parseInt(e.target.value))}
                  className="flex-1 px-3 py-2 border rounded-md"
                  placeholder="Portfolio ID"
                  min="1"
                />
                <Button
                  onClick={() => handleGenerate(() => generateTransactions(portfolioId, 20), `Generate Transactions for Portfolio ${portfolioId}`)}
                  disabled={isLoading || !portfolioId}
                  variant="outline"
                >
                  Add 20 Transactions
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Custom Configuration */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Custom Configuration</CardTitle>
            <CardDescription>
              Generate test data with custom settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button
                onClick={() => handleGenerate(() => generateCustom({
                  portfolioCount: 3,
                  transactionsPerPortfolio: 50,
                  includeRecurring: true,
                  includeDividends: true,
                  startDate: "2023-01-01",
                  endDate: "2023-12-31"
                }), "Full Year Data")}
                disabled={isLoading}
                variant="outline"
              >
                Full Year Data
                <Badge variant="secondary" className="ml-2">2023</Badge>
              </Button>

              <Button
                onClick={() => handleGenerate(() => generateCustom({
                  portfolioCount: 1,
                  transactionsPerPortfolio: 100,
                  includeRecurring: false,
                  includeDividends: true,
                  startDate: "2024-01-01",
                  endDate: "2024-12-31"
                }), "Heavy Trading Portfolio")}
                disabled={isLoading}
                variant="outline"
              >
                Heavy Trading
                <Badge variant="secondary" className="ml-2">100 transactions</Badge>
              </Button>

              <Button
                onClick={() => handleGenerate(() => generateCustom({
                  portfolioCount: 2,
                  transactionsPerPortfolio: 25,
                  includeRecurring: true,
                  includeDividends: false,
                  startDate: "2024-06-01",
                  endDate: "2024-12-31"
                }), "Recent Activity")}
                disabled={isLoading}
                variant="outline"
              >
                Recent Activity
                <Badge variant="secondary" className="ml-2">Last 6 months</Badge>
              </Button>

              <Button
                onClick={() => handleGenerate(() => generateCustom({
                  portfolioCount: 10,
                  transactionsPerPortfolio: 10,
                  includeRecurring: false,
                  includeDividends: false
                }), "Many Portfolios")}
                disabled={isLoading}
                variant="outline"
              >
                Many Portfolios
                <Badge variant="secondary" className="ml-2">10 portfolios</Badge>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Use</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">🚀 Getting Started</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Start with "Standard Setup" for a good balance of data</li>
                <li>Check your portfolios page to see the generated portfolios</li>
                <li>Navigate to transactions to see the generated transactions</li>
                <li>Use individual components to add more specific data</li>
              </ol>
            </div>
            <div>
              <h4 className="font-semibold mb-2">📊 What Gets Generated</h4>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li><strong>Portfolios:</strong> Test Portfolio 1, Test Portfolio 2, etc.</li>
                <li><strong>Assets:</strong> AAPL, GOOGL, TSLA, MSFT, NVDA with price history</li>
                <li><strong>Institutions:</strong> Fidelity, Charles Schwab, Interactive Brokers</li>
                <li><strong>Transactions:</strong> Buy, Sell, Dividend, Deposit, Withdraw</li>
                <li><strong>Features:</strong> Recurring transactions, realistic prices, commissions</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">💡 Next Steps</h4>
            <p className="text-blue-800 text-sm">
              After generating test data, visit your <strong>Portfolios</strong> and <strong>Transactions</strong> pages to see the data in action. 
              You can then test features like charts, filtering, transaction creation, and portfolio management with realistic data.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
