import { AssetsDataTable } from "~/components/assets/data-table"
import { createColumns, type AssetHoldingType } from "~/components/assets/columns"
import { useMemo, useState } from "react"
import { type TransactionType } from "~/datatypes/transaction"
import { type AssetType } from "~/datatypes/asset"
import { type CurrencyType } from "~/datatypes/currency"
import { userPortfolios } from "~/stateManagement/portfolioContext"
import { fetchAllTransactions } from "~/db/actions"
import { useQueries } from "@tanstack/react-query"
import { AssetDetailSheet } from "~/components/assetDetailSheet"
import { useTransactionDialog } from "~/contexts/transactionDialogContext"
import { useCurrencyDisplay } from "~/contexts/currencyDisplayContext"
import { convertCurrency, getDefaultCurrency } from "~/lib/currencyUtils"

export async function loader() {
  try {
    const allTransactions = await fetchAllTransactions()
    return { transactions: allTransactions }
  } catch (error) {
    console.error("Error loading transactions:", error)
    return { transactions: [], error: "Failed to load transactions" }
  }
}

export default function Assets({ loaderData }: { loaderData: { transactions: any[], error?: string } }) {
  const { transactions: rawTransactions, error } = loaderData
  const [selectedAsset, setSelectedAsset] = useState<AssetType | null>(null)
  const [isAssetSheetOpen, setIsAssetSheetOpen] = useState(false)
  
  const portfolios = userPortfolios()
  const selectedPortfolio = portfolios.find(p => p.selected)
  const { currencies } = useTransactionDialog()
  const { showOriginalCurrency } = useCurrencyDisplay()
  
  // Transform and filter the raw transaction data
  const transactions = useMemo(() => {
    if (!rawTransactions) return []
    
    const transformedTransactions = rawTransactions.map((rawTransaction: any): TransactionType => {
      const transactionPortfolio = portfolios.find(p => p.id === rawTransaction.portfolioId)
      return {
        id: rawTransaction.id,
        portfolioId: rawTransaction.portfolioId,
        targetPortfolioId: rawTransaction.targetPortfolioId,
        date: rawTransaction.date,
        type: rawTransaction.type,
        asset: {
          symbol: rawTransaction.asset,
          isFetchedFromApi: false,
        },
        quantity: rawTransaction.quantity,
        price: rawTransaction.price,
        commision: rawTransaction.commision,
        currency: rawTransaction.currency ? currencies.find((c: any) => c.id === rawTransaction.currency) : transactionPortfolio?.currency,
        tax: rawTransaction.tax,
        recurrence: rawTransaction.recurrence,
        tags: rawTransaction.tags || "",
        notes: rawTransaction.notes,
        isHousekeeping: Boolean(rawTransaction.isHouskeeping),
        isCreatedByUser: true,
      }
    })
    
    // Filter transactions based on selected portfolio
    if (!selectedPortfolio || selectedPortfolio.id === -1) {
      return transformedTransactions
    } else {
      return transformedTransactions.filter(t => t.portfolioId === selectedPortfolio.id)
    }
  }, [rawTransactions, selectedPortfolio, currencies])

  // Get unique asset symbols for fetching
  const uniqueAssetSymbols = useMemo(() => {
    // Only get symbols from Buy/Sell transactions (not Cash deposits/withdrawals)
    const assetTransactions = transactions.filter(t => 
      t.type === "Buy" || t.type === "Sell" || t.type === "Dividend"
    )
    return Array.from(new Set(assetTransactions.map(t => t.asset.symbol)))
  }, [transactions])

  // Fetch asset data using TanStack Query
  const assetQueries = useQueries({
    queries: uniqueAssetSymbols.map((symbol) => ({
      queryKey: ["assetFetch", symbol],
      queryFn: async () => {
        const res = await fetch("/fetchAssetChart?q=" + symbol)
        if (!res.ok) {
          throw new Error(`Error fetching asset data for ${symbol}: ${res.statusText}`)
        }
        const resJson = await res.json()
        return resJson as AssetType
      },
      staleTime: 15 * 60 * 1000, // 15 minutes
      enabled: !!symbol,
    })),
  })

  // Create a map of assets by symbol for quick lookup
  const assetsMap = useMemo(() => {
    const map = new Map<string, AssetType>()
    assetQueries.forEach((query, index) => {
      if (query.data) {
        map.set(uniqueAssetSymbols[index], query.data)
      }
    })
    return map
  }, [assetQueries, uniqueAssetSymbols])

  // Calculate asset holdings
  const assetHoldings = useMemo(() => {
    const holdings = new Map<string, { portfolioId: number, symbol: string, totalQuantity: number, totalCost: number, transactions: TransactionType[] }>()
    
    // Process transactions to calculate holdings
    transactions.forEach(transaction => {
      if (transaction.type !== "Buy" && transaction.type !== "Sell") return
      
      const key = `${transaction.portfolioId}-${transaction.asset.symbol}`
      
      if (!holdings.has(key)) {
        holdings.set(key, {
          portfolioId: transaction.portfolioId,
          symbol: transaction.asset.symbol,
          totalQuantity: 0,
          totalCost: 0,
          transactions: []
        })
      }
      
      const holding = holdings.get(key)!
      holding.transactions.push(transaction)
      
      if (transaction.type === "Buy") {
        holding.totalQuantity += transaction.quantity
        // Convert transaction cost to portfolio currency if needed
        const portfolioCurrency = portfolios.find(p => p.id === transaction.portfolioId)?.currency
        const transactionCurrency = transaction.currency || portfolioCurrency
        let cost = transaction.quantity * transaction.price + (transaction.commision || 0) + (transaction.tax || 0)
        
        if (portfolioCurrency && transactionCurrency && portfolioCurrency.id !== transactionCurrency.id) {
          cost = convertCurrency(cost, transactionCurrency, portfolioCurrency)
        }
        
        holding.totalCost += cost
      } else if (transaction.type === "Sell") {
        holding.totalQuantity -= transaction.quantity
        // Calculate proportional cost reduction
        const costPerShare = holding.totalCost / (holding.totalQuantity + transaction.quantity)
        holding.totalCost -= costPerShare * transaction.quantity
      }
    })
    
    // Convert to AssetHoldingType array, filtering out zero holdings
    const holdingsArray: AssetHoldingType[] = []
    
    holdings.forEach(holding => {
      if (holding.totalQuantity <= 0.001) return // Skip very small or zero holdings
      
      const portfolio = portfolios.find(p => p.id === holding.portfolioId)
      if (!portfolio) return
      
      const asset = assetsMap.get(holding.symbol)
      const averagePrice = holding.totalCost / holding.totalQuantity
      
      // Get current price from asset data
      let currentPrice = averagePrice // fallback to average price
      if (asset && asset.quotes && asset.quotes.length > 0) {
        const latestQuote = asset.quotes[asset.quotes.length - 1]
        currentPrice = latestQuote.close || latestQuote.adjclose || averagePrice
      }
      
      const totalValue = holding.totalQuantity * currentPrice
      const unrealizedGainLoss = totalValue - holding.totalCost
      const unrealizedGainLossPercentage = (unrealizedGainLoss / holding.totalCost) * 100
      
      holdingsArray.push({
        symbol: holding.symbol,
        name: asset?.longName || asset?.shortName || holding.symbol,
        portfolio: portfolio.name,
        portfolioId: portfolio.id,
        totalQuantity: holding.totalQuantity,
        averagePrice,
        currentPrice,
        totalValue,
        unrealizedGainLoss,
        unrealizedGainLossPercentage,
        currency: portfolio.currency,
        instrumentType: asset?.instrumentType,
        exchangeName: asset?.exchangeName,
        lastUpdated: asset?.lastUpdated,
      })
    })
    
    return holdingsArray.sort((a, b) => b.totalValue - a.totalValue) // Sort by total value descending
  }, [transactions, portfolios, assetsMap])

  // Create columns with portfolio data
  const columns = createColumns({
    portfolios,
    selectedPortfolioId: selectedPortfolio?.id,
    showOriginalCurrency,
    allCurrencies: currencies,
  })

  const handleAssetClick = (symbol: string) => {
    const asset = assetsMap.get(symbol)
    if (asset) {
      setSelectedAsset(asset)
      setIsAssetSheetOpen(true)
    }
  }

  if (error) {
    return (
      <main className="pt-16 p-4 container mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-red-600">{error}</div>
        </div>
      </main>
    )
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div className="flex-1">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Assets</h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              View your portfolio assets, holdings, and performance
            </p>
          </div>
        </div>
      </div>
      
      <AssetsDataTable 
        columns={columns} 
        data={assetHoldings} 
        onAssetClick={handleAssetClick}
        portfolios={portfolios}
        selectedPortfolioId={selectedPortfolio?.id}
      />

      <AssetDetailSheet
        open={isAssetSheetOpen}
        onOpenChange={setIsAssetSheetOpen}
        asset={selectedAsset}
        transactions={transactions}
      />
    </main>
  )
}
