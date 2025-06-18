

import { TransactionsDataTable } from "~/components/transactions/data-table"
import { createColumns } from "~/components/transactions/columns"
import { Button } from "~/components/ui/button"
import { Switch } from "~/components/ui/switch"
import { Label } from "~/components/ui/label"
import { Plus } from "lucide-react"
import { useMemo, useState } from "react"
import { type TransactionType } from "~/datatypes/transaction"
import { type AssetType } from "~/datatypes/asset"
import { userPortfolios } from "~/stateManagement/portfolioContext"
import { fetchAllTransactions } from "~/db/actions"
import { useQueries } from "@tanstack/react-query"
import { AssetDetailSheet } from "~/components/assetDetailSheet"
import { TransactionDetailSheet } from "~/components/transactionDetailSheet"
import { useTransactionDialog } from "~/contexts/transactionDialogContext"
import { useCurrencyDisplay } from "~/contexts/currencyDisplayContext"
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
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionType | null>(null)
  const [isTransactionSheetOpen, setIsTransactionSheetOpen] = useState(false)
  const [transactionSheetMode, setTransactionSheetMode] = useState<"edit" | "clone" | null>(null)
  
  const portfolios = userPortfolios()
  const selectedPortfolio = portfolios.find(p => p.selected)
  const { openDialog, currencies } = useTransactionDialog()
  const { showOriginalCurrency, toggleCurrencyDisplay } = useCurrencyDisplay()
  
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
          isFetchedFromApi: false, // Default value since DB stores string
        },
        quantity: rawTransaction.quantity,
        price: rawTransaction.price,
        commision: rawTransaction.commision,
        currency: rawTransaction.currency ? currencies.find((c: any) => c.id === rawTransaction.currency) : transactionPortfolio?.currency, // Use transaction currency or fall back to portfolio currency
        tax: rawTransaction.tax,
        recurrence: rawTransaction.recurrence,
        tags: rawTransaction.tags || "",
        notes: rawTransaction.notes,
        isHousekeeping: Boolean(rawTransaction.isHouskeeping),
        isCreatedByUser: true, // Default value
      }
    })
    
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

  // Create columns with portfolio data (after assetsMap is defined)
  const columns = createColumns({
    portfolios,
    selectedPortfolioId: selectedPortfolio?.id,
    showOriginalCurrency,
    allCurrencies: currencies,
    assetsMap
  })

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

  // Check if there are transactions with different currencies than their portfolio currency
  const hasDifferentCurrencies = useMemo(() => {
    return transactionsWithAssets.some(transaction => {
      const transactionPortfolio = portfolios.find(p => p.id === transaction.portfolioId)
      const portfolioCurrency = transactionPortfolio?.currency
      const transactionCurrency = transaction.currency
      
      // If transaction has a specific currency that's different from portfolio currency
      return transactionCurrency && portfolioCurrency && 
             transactionCurrency.id !== portfolioCurrency.id
    })
  }, [transactionsWithAssets, portfolios])

  const handleAssetClick = (symbol: string) => {
    const asset = assetsMap.get(symbol)
    if (asset) {
      setSelectedAsset(asset)
      setIsAssetSheetOpen(true)
    }
  }

  const handleEditTransaction = (transaction: TransactionType) => {
    setSelectedTransaction(transaction)
    setTransactionSheetMode("edit")
    setIsTransactionSheetOpen(true)
  }

  const handleCloneTransaction = (transaction: TransactionType) => {
    setSelectedTransaction(transaction)
    setTransactionSheetMode("clone")
    setIsTransactionSheetOpen(true)
  }

  const handleDeleteTransaction = async (transactionId: number) => {
    try {
      const response = await fetch(`/api/transactions/${transactionId}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to delete transaction' }))
        throw new Error(errorData.error || 'Failed to delete transaction')
      }
      // Refresh the page to show updated data
      window.location.reload()
    } catch (error) {
      console.error('Error deleting transaction:', error)
      alert('Failed to delete transaction: ' + (error as Error).message)
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
            <h1 className="text-2xl sm:text-3xl font-bold">Transactions</h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Manage and view all your portfolio transactions
            </p>
          </div>
        </div>
        <Button 
          onClick={() => openDialog()}
          className="w-full sm:w-auto shrink-0"
          size="default"
        >
          <Plus className="mr-2 h-4 w-4" />
          <span className="hidden xs:inline">Add Transaction</span>
          <span className="xs:hidden">Add</span>
        </Button>
      </div>
      
      {/* Currency Display Toggle - only show if there are transactions with different currencies */}
      {hasDifferentCurrencies && (
        <div className="flex items-center justify-end space-x-2 mb-4">
          <Label htmlFor="currency-toggle" className="text-sm font-medium">
            Show in original currency
          </Label>
          <Switch
            id="currency-toggle"
            checked={showOriginalCurrency}
            onCheckedChange={toggleCurrencyDisplay}
          />
        </div>
      )}
      
      <TransactionsDataTable 
        columns={columns} 
        data={transactionsWithAssets || []} 
        onAssetClick={handleAssetClick}
        onEditTransaction={handleEditTransaction}
        onCloneTransaction={handleCloneTransaction}
        onDeleteTransaction={handleDeleteTransaction}
        portfolios={portfolios}
        selectedPortfolioId={selectedPortfolio?.id}
        showOriginalCurrency={showOriginalCurrency}
      />

      <AssetDetailSheet
        open={isAssetSheetOpen}
        onOpenChange={setIsAssetSheetOpen}
        asset={selectedAsset}
        transactions={transactionsWithAssets}
      />

      <TransactionDetailSheet
        open={isTransactionSheetOpen}
        onOpenChange={setIsTransactionSheetOpen}
        transaction={selectedTransaction}
        mode={transactionSheetMode}
        portfolios={portfolios}
        currencies={currencies}
      />

    </main>
  )
}
