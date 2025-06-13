

import { TransactionsDataTable } from "~/components/transactions/data-table"
import { columns } from "~/components/transactions/columns"
import { Button } from "~/components/ui/button"
import { Plus } from "lucide-react"
import { useMemo, useState } from "react"
import { type TransactionType } from "~/datatypes/transaction"
import { type AssetType } from "~/datatypes/asset"
import { userPortfolios } from "~/stateManagement/portfolioContext"
import { fetchAllTransactions } from "~/db/actions"
import { useQueries } from "@tanstack/react-query"
import { AssetDetailSheet } from "~/components/assetDetailSheet"
import type { Route } from "./+types/transactions"

export async function loader({ request, params }: Route.LoaderArgs) {
  try {
    const allTransactions = await fetchAllTransactions()
    return { transactions: allTransactions }
  } catch (error) {
    console.error("Error loading transactions:", error)
    return { transactions: [], error: "Failed to load transactions" }
  }
}

export default function Transactions({ loaderData }: Route.ComponentProps) {
  const { transactions: rawTransactions, error } = loaderData
  const [selectedAsset, setSelectedAsset] = useState<AssetType | null>(null)
  const [isAssetSheetOpen, setIsAssetSheetOpen] = useState(false)
  
  const portfolios = userPortfolios()
  const selectedPortfolio = portfolios.find(p => p.selected)
  
  // Transform and filter the raw transaction data
  const transactions = useMemo(() => {
    if (!rawTransactions) return []
    
    const transformedTransactions = rawTransactions.map((rawTransaction: any): TransactionType => ({
      id: rawTransaction.id,
      portfolioId: rawTransaction.portfolioId,
      targetPortfolioId: rawTransaction.targetPortfolioId,
      date: rawTransaction.date,
      type: rawTransaction.type,
      asset: {
        symbol: rawTransaction.asset,
        isFetchedFromApi: false, // Default value since DB stores string
      },
      quantity: rawTransaction.quantity,
      price: rawTransaction.price,
      commision: rawTransaction.commision,
      tax: rawTransaction.tax,
      recurrence: rawTransaction.recurrence,
      tags: rawTransaction.tags || "",
      notes: rawTransaction.notes,
      isHousekeeping: Boolean(rawTransaction.isHouskeeping),
      isCreatedByUser: true, // Default value
    }))
    
    // Filter transactions based on selected portfolio
    if (!selectedPortfolio || selectedPortfolio.id === -1) {
      // Show all transactions if no portfolio selected or "All" is selected
      return transformedTransactions
    } else {
      // Show only transactions for the selected portfolio
      return transformedTransactions.filter(t => t.portfolioId === selectedPortfolio.id)
    }
  }, [rawTransactions, selectedPortfolio])

  // Get unique asset symbols for fetching
  const uniqueAssetSymbols = useMemo(() => {
    return Array.from(new Set(transactions.map(t => t.asset.symbol)))
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

  // Update transactions with fetched asset data
  const transactionsWithAssets = useMemo(() => {
    return transactions.map(transaction => ({
      ...transaction,
      asset: {
        ...transaction.asset,
        isFetchedFromApi: assetsMap.has(transaction.asset.symbol),
      }
    }))
  }, [transactions, assetsMap])

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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Transactions</h1>
          <p className="text-muted-foreground">
            Manage and view all your portfolio transactions
          </p>
        </div>
        <Button onClick={() => window.location.href = '/createTransaction'}>
          <Plus className="mr-2 h-4 w-4" />
          Add Transaction
        </Button>
      </div>
      
      <TransactionsDataTable 
        columns={columns} 
        data={transactionsWithAssets || []} 
        onAssetClick={handleAssetClick}
      />

      <AssetDetailSheet
        open={isAssetSheetOpen}
        onOpenChange={setIsAssetSheetOpen}
        asset={selectedAsset}
        transactions={transactionsWithAssets}
      />
    </main>
  )
}
