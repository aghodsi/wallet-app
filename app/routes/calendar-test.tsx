import CalendarComponent from "~/components/calendarComponent";
import type { TransactionType } from "~/datatypes/transaction";
import type { AssetType } from "~/datatypes/asset";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

// Generate sample transactions for the current month and some recent dates
const generateSampleTransactions = (): TransactionType[] => {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  return [
    {
      id: 1,
      portfolioId: 1,
      date: new Date(currentYear, currentMonth, 5).toISOString(),
      type: "Buy",
      asset: { symbol: "AAPL", isFetchedFromApi: true },
      quantity: 10,
      price: 150.25,
      commision: 9.99,
      tax: 0,
      tags: "tech",
      isHousekeeping: false,
      isCreatedByUser: true,
    },
    {
      id: 2,
      portfolioId: 1,
      date: new Date(currentYear, currentMonth, 12).toISOString(),
      type: "Buy",
      asset: { symbol: "MSFT", isFetchedFromApi: true },
      quantity: 5,
      price: 420.80,
      commision: 9.99,
      tax: 0,
      tags: "tech",
      isHousekeeping: false,
      isCreatedByUser: true,
    },
    {
      id: 3,
      portfolioId: 1,
      date: new Date(currentYear, currentMonth, 15).toISOString(),
      type: "Sell",
      asset: { symbol: "AAPL", isFetchedFromApi: true },
      quantity: 3,
      price: 155.75,
      commision: 9.99,
      tax: 12.50,
      tags: "tech",
      isHousekeeping: false,
      isCreatedByUser: true,
    },
    {
      id: 4,
      portfolioId: 1,
      date: new Date(currentYear, currentMonth, 20).toISOString(),
      type: "Buy",
      asset: { symbol: "GOOGL", isFetchedFromApi: true },
      quantity: 2,
      price: 175.30,
      commision: 9.99,
      tax: 0,
      tags: "tech",
      isHousekeeping: false,
      isCreatedByUser: true,
    },
    {
      id: 5,
      portfolioId: 1,
      date: new Date(currentYear, currentMonth, 25).toISOString(),
      type: "Dividend",
      asset: { symbol: "AAPL", isFetchedFromApi: true },
      quantity: 7, // remaining shares after selling 3
      price: 0.25, // dividend per share
      commision: 0,
      tax: 0.43, // tax on dividend
      tags: "dividend",
      isHousekeeping: false,
      isCreatedByUser: false,
    },
    // Add some transactions from previous month
    {
      id: 6,
      portfolioId: 1,
      date: new Date(currentYear, currentMonth - 1, 28).toISOString(),
      type: "Buy",
      asset: { symbol: "TSLA", isFetchedFromApi: true },
      quantity: 8,
      price: 245.60,
      commision: 9.99,
      tax: 0,
      tags: "ev",
      isHousekeeping: false,
      isCreatedByUser: true,
    },
    {
      id: 7,
      portfolioId: 1,
      date: new Date(currentYear, currentMonth + 1, 3).toISOString(),
      type: "Sell",
      asset: { symbol: "TSLA", isFetchedFromApi: true },
      quantity: 3,
      price: 250.25,
      commision: 9.99,
      tax: 8.75,
      tags: "ev",
      isHousekeeping: false,
      isCreatedByUser: true,
    },
  ];
};

// Generate sample assets with dividend events
const generateSampleAssets = (): AssetType[] => {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  return [
    {
      id: 1,
      symbol: "AAPL",
      currency: "USD",
      exchangeName: "NMS",
      fullExchangeName: "NASDAQ",
      instrumentType: "EQUITY",
      timezone: "America/New_York",
      exchangeTimezoneName: "EDT",
      longName: "Apple Inc.",
      shortName: "Apple",
      quotes: [],
      events: {
        dividends: [
          {
            amount: 0.25,
            date: new Date(currentYear, currentMonth, 25).getTime().toString(),
          },
          {
            amount: 0.24,
            date: new Date(currentYear, currentMonth - 3, 15).getTime().toString(),
          },
        ],
        splits: [],
      },
      isFromApi: true,
      lastUpdated: new Date().toISOString(),
    },
    {
      id: 2,
      symbol: "MSFT",
      currency: "USD",
      exchangeName: "NMS",
      fullExchangeName: "NASDAQ",
      instrumentType: "EQUITY",
      timezone: "America/New_York",
      exchangeTimezoneName: "EDT",
      longName: "Microsoft Corporation",
      shortName: "Microsoft",
      quotes: [],
      events: {
        dividends: [
          {
            amount: 0.75,
            date: new Date(currentYear, currentMonth, 18).getTime().toString(),
          },
        ],
        splits: [],
      },
      isFromApi: true,
      lastUpdated: new Date().toISOString(),
    },
    {
      id: 3,
      symbol: "GOOGL",
      currency: "USD",
      exchangeName: "NMS",
      fullExchangeName: "NASDAQ",
      instrumentType: "EQUITY",
      timezone: "America/New_York",
      exchangeTimezoneName: "EDT",
      longName: "Alphabet Inc.",
      shortName: "Alphabet",
      quotes: [],
      events: {
        dividends: [], // No dividends
        splits: [],
      },
      isFromApi: true,
      lastUpdated: new Date().toISOString(),
    },
    {
      id: 4,
      symbol: "TSLA",
      currency: "USD",
      exchangeName: "NMS",
      fullExchangeName: "NASDAQ",
      instrumentType: "EQUITY",
      timezone: "America/New_York",
      exchangeTimezoneName: "EDT",
      longName: "Tesla, Inc.",
      shortName: "Tesla",
      quotes: [],
      events: {
        dividends: [], // Tesla doesn't pay dividends
        splits: [],
      },
      isFromApi: true,
      lastUpdated: new Date().toISOString(),
    },
  ];
};

export default function CalendarTest() {
  const sampleTransactions = generateSampleTransactions();
  const sampleAssets = generateSampleAssets();

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Calendar Component Test</h1>
        <p className="text-muted-foreground">
          This page demonstrates the calendar component with sample transaction and dividend data.
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Sample Data Overview</CardTitle>
          <CardDescription>
            The calendar below shows sample transactions and dividend events:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h3 className="font-semibold mb-2">Legend:</h3>
              <ul className="space-y-1 text-sm">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span>Buy transactions</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  <span>Sell transactions</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span>Dividend payments</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Sample Transactions:</h3>
              <ul className="space-y-1 text-sm">
                {sampleTransactions.slice(0, 5).map((transaction) => (
                  <li key={transaction.id}>
                    <span className="font-medium">{transaction.asset.symbol}</span> - {transaction.type} on{" "}
                    {new Date(transaction.date).toLocaleDateString()}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Transaction Calendar</CardTitle>
          <CardDescription>
            View transactions and dividend events by date. Hover over dots to see transaction details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CalendarComponent 
            transactions={sampleTransactions}
            assets={sampleAssets}
            title="Transaction Calendar"
          />
        </CardContent>
      </Card>
    </div>
  );
}
