"use client"

import { type ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, ChartCandlestick, Edit, Trash2, Copy } from "lucide-react"
import { type TransactionType } from "~/datatypes/transaction"
import { type PortfolioType } from "~/datatypes/portfolio"
import { type CurrencyType } from "~/datatypes/currency"
import { Button } from "~/components/ui/button"
import { Checkbox } from "~/components/ui/checkbox"
import { Badge } from "~/components/ui/badge"
import { cronToNaturalLanguage } from "~/lib/cronUtils"
import { convertTextToIcon } from "~/lib/iconHelper"
import { convertCurrency, formatCurrency } from "~/lib/currencyUtils"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog"

interface ColumnsOptions {
  portfolios?: PortfolioType[]
  selectedPortfolioId?: number
  showOriginalCurrency?: boolean
  allCurrencies?: CurrencyType[]
  assetsMap?: Map<string, any>
}

export function createColumns(options?: ColumnsOptions): ColumnDef<TransactionType>[] {
  const { portfolios = [], selectedPortfolioId, showOriginalCurrency = false, allCurrencies = [], assetsMap = new Map() } = options || {}
  const isShowingAllPortfolios = selectedPortfolioId === -1
  const selectedPortfolio = portfolios.find(p => p.id === selectedPortfolioId)

  const columns: ColumnDef<TransactionType>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "date",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const dateValue = row.getValue("date") as string
      // Parse epoch timestamp - if it's a string, convert to number first
      const timestamp = typeof dateValue === 'string' ? parseInt(dateValue) : dateValue
      const date = new Date(timestamp)
      return <div className="font-medium">{date.toLocaleDateString()}</div>
    },
  },
  ...(isShowingAllPortfolios ? [{
    id: "portfolio",
    header: ({ column }: { column: any }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Portfolio
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }: { row: any }) => {
      const transaction = row.original
      const portfolio = portfolios.find(p => p.id === transaction.portfolioId)
      
      if (!portfolio) {
        return <div className="text-sm text-muted-foreground">Unknown Portfolio</div>
      }
      
      return (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            {convertTextToIcon(portfolio.symbol, "h-4 w-4")}
            <span className="font-medium">{portfolio.name}</span>
          </div>
          {portfolio.institution && (
            <Badge variant="outline" className="text-xs w-fit">
              {portfolio.institution.name}
            </Badge>
          )}
        </div>
      )
    },
    accessorFn: (row: TransactionType) => {
      const portfolio = portfolios.find(p => p.id === row.portfolioId)
      return portfolio?.name || "Unknown Portfolio"
    },
    filterFn: (row: any, id: string, value: any) => {
      return value.includes(row.getValue(id))
    },
    enableHiding: true,
  }] : []),
  ...(isShowingAllPortfolios ? [{
    id: "institution",
    header: "Institution",
    cell: ({ row }: { row: any }) => {
      const transaction = row.original
      const portfolio = portfolios.find(p => p.id === transaction.portfolioId)
      
      if (!portfolio || !portfolio.institution) {
        return <div className="text-sm text-muted-foreground">-</div>
      }
      
      return <div className="text-sm">{portfolio.institution.name}</div>
    },
    accessorFn: (row: TransactionType) => {
      const portfolio = portfolios.find(p => p.id === row.portfolioId)
      return portfolio?.institution?.name || ""
    },
    filterFn: (row: any, id: string, value: any) => {
      return value.includes(row.getValue(id))
    },
    enableHiding: true,
  }] : []),
  {
    accessorKey: "type",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Type
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const type = row.getValue("type") as string
      const typeColors = {
        Buy: "bg-green-100 text-green-800",
        Sell: "bg-red-100 text-red-800",
        Dividend: "bg-blue-100 text-blue-800",
        Deposit: "bg-yellow-100 text-yellow-800",
        Withdraw: "bg-orange-100 text-orange-800",
      }
      return (
        <Badge className={typeColors[type as keyof typeof typeColors] || "bg-gray-100 text-gray-800"}>
          {type}
        </Badge>
      )
    },
    filterFn: (row: any, id: string, value: any) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    id: "asset",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Asset
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row, table }) => {
      const asset = row.original.asset
      const onAssetClick = (table.options.meta as any)?.onAssetClick
      
      return (
        <div className="flex items-center">
          <button
            className="font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer transition-colors"
            onClick={() => onAssetClick?.(asset.symbol)}
          >
            {asset.symbol}
          </button>
          {asset.isFetchedFromApi && (
            <Badge variant="outline" className="ml-2 text-xs">
              <ChartCandlestick />
            </Badge>
          )}
        </div>
      )
    },
    accessorFn: (row) => row.asset.symbol,
    enableHiding: true,
  },
  {
    accessorKey: "quantity",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Quantity
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const quantity = parseFloat(row.getValue("quantity"))
      return <div className="font-medium">{quantity.toFixed(2)}</div>
    },
  },
  {
    accessorKey: "price",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Price
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const transaction = row.original
      const price = parseFloat(row.getValue("price"))
      const transactionPortfolio = portfolios.find(p => p.id === transaction.portfolioId)
      
      // Get the transaction currency (default to portfolio currency if not set)
      const transactionCurrency = transaction.currency || transactionPortfolio?.currency
      
      if (!transactionCurrency) {
        return <div className="font-medium">${price.toFixed(2)}</div>
      }

      // Determine display currency
      let displayCurrency = transactionCurrency
      let displayPrice = price

      if (!showOriginalCurrency && selectedPortfolio && selectedPortfolio.id !== -1) {
        // Convert to portfolio currency
        displayCurrency = selectedPortfolio.currency
        displayPrice = convertCurrency(price, transactionCurrency, selectedPortfolio.currency)
      }

      return <div className="font-medium">{formatCurrency(displayPrice, displayCurrency)}</div>
    },
  },
  {
    id: "total",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Total
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const transaction = row.original
      const quantity = parseFloat(row.getValue("quantity"))
      const price = parseFloat(row.getValue("price"))
      const total = quantity * price
      const transactionPortfolio = portfolios.find(p => p.id === transaction.portfolioId)
      
      // Get the transaction currency (default to portfolio currency if not set)
      const transactionCurrency = transaction.currency || transactionPortfolio?.currency
      
      if (!transactionCurrency) {
        return <div className="font-medium">${total.toFixed(2)}</div>
      }

      // Determine display currency
      let displayCurrency = transactionCurrency
      let displayTotal = total

      if (!showOriginalCurrency && selectedPortfolio && selectedPortfolio.id !== -1) {
        // Convert to portfolio currency
        displayCurrency = selectedPortfolio.currency
        displayTotal = convertCurrency(total, transactionCurrency, selectedPortfolio.currency)
      }

      return <div className="font-medium">{formatCurrency(displayTotal, displayCurrency)}</div>
    },
    accessorFn: (row) => {
      const quantity = parseFloat(row.quantity.toString())
      const price = parseFloat(row.price.toString())
      return quantity * price
    },
  },
  {
    id: "performance",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Performance
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const transaction = row.original
      const type = transaction.type
      
      // Only show performance for Buy transactions
      if (type !== "Buy") {
        return <div className="text-sm text-muted-foreground">-</div>
      }

      const asset = assetsMap.get(transaction.asset.symbol)
      if (!asset || !asset.quotes || asset.quotes.length === 0) {
        return <div className="text-sm text-muted-foreground">No data</div>
      }

      const transactionPrice = parseFloat(row.getValue("price"))
      const quantity = parseFloat(row.getValue("quantity"))
      const transactionPortfolio = portfolios.find(p => p.id === transaction.portfolioId)
      
      // Get the latest quote
      const latestQuote = asset.quotes[asset.quotes.length - 1]
      const currentPrice = latestQuote.close || latestQuote.adjclose || 0
      
      if (currentPrice === 0) {
        return <div className="text-sm text-muted-foreground">No price</div>
      }

      // Calculate performance
      const currentValue = quantity * currentPrice
      const originalValue = quantity * transactionPrice
      const absoluteGain = currentValue - originalValue
      const percentageGain = ((currentPrice - transactionPrice) / transactionPrice) * 100

      // Get the transaction currency for display
      const transactionCurrency = transaction.currency || transactionPortfolio?.currency
      
      let displayCurrency = transactionCurrency
      let displayAbsoluteGain = absoluteGain

      if (!showOriginalCurrency && selectedPortfolio && selectedPortfolio.id !== -1 && transactionCurrency) {
        // Convert to portfolio currency
        displayCurrency = selectedPortfolio.currency
        
        // Create a mock currency object for the asset since asset.currency is a string
        const assetCurrency = {
          id: -1,
          code: asset.currency,
          name: asset.currency,
          symbol: asset.currency,
          exchangeRate: 1,
          isDefault: false,
          lastUpdated: new Date().toISOString(),
        }
        
        displayAbsoluteGain = convertCurrency(absoluteGain, assetCurrency, selectedPortfolio.currency)
      }

      const isPositive = absoluteGain >= 0
      const textColor = isPositive ? "text-green-600" : "text-red-600"
      const sign = isPositive ? "+" : ""

      return (
        <div className={`text-sm font-medium ${textColor}`}>
          <div>{sign}{displayCurrency ? formatCurrency(displayAbsoluteGain, displayCurrency) : `$${displayAbsoluteGain.toFixed(2)}`}</div>
          <div className="text-xs">{sign}{percentageGain.toFixed(2)}%</div>
        </div>
      )
    },
    accessorFn: (row) => {
      if (row.type !== "Buy") return 0
      
      const asset = assetsMap.get(row.asset.symbol)
      if (!asset || !asset.quotes || asset.quotes.length === 0) return 0
      
      const transactionPrice = parseFloat(row.price.toString())
      const latestQuote = asset.quotes[asset.quotes.length - 1]
      const currentPrice = latestQuote.close || latestQuote.adjclose || 0
      
      return ((currentPrice - transactionPrice) / transactionPrice) * 100
    },
    enableHiding: true,
  },
  {
    accessorKey: "commision",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Commission
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const transaction = row.original
      const commission = parseFloat(row.getValue("commision"))
      const transactionPortfolio = portfolios.find(p => p.id === transaction.portfolioId)
      
      // Get the transaction currency (default to portfolio currency if not set)
      const transactionCurrency = transaction.currency || transactionPortfolio?.currency
      
      if (!transactionCurrency) {
        return <div className="text-sm text-muted-foreground">${commission.toFixed(2)}</div>
      }

      // Determine display currency
      let displayCurrency = transactionCurrency
      let displayCommission = commission

      if (!showOriginalCurrency && selectedPortfolio && selectedPortfolio.id !== -1) {
        // Convert to portfolio currency
        displayCurrency = selectedPortfolio.currency
        displayCommission = convertCurrency(commission, transactionCurrency, selectedPortfolio.currency)
      }

      return <div className="text-sm text-muted-foreground">{formatCurrency(displayCommission, displayCurrency)}</div>
    },
  },
  {
    accessorKey: "tax",
    header: "Tax",
    cell: ({ row }) => {
      const transaction = row.original
      const tax = parseFloat(row.getValue("tax"))
      const transactionPortfolio = portfolios.find(p => p.id === transaction.portfolioId)
      
      // Get the transaction currency (default to portfolio currency if not set)
      const transactionCurrency = transaction.currency || transactionPortfolio?.currency
      
      if (!transactionCurrency) {
        return <div className="text-sm text-muted-foreground">${tax.toFixed(2)}</div>
      }

      // Determine display currency
      let displayCurrency = transactionCurrency
      let displayTax = tax

      if (!showOriginalCurrency && selectedPortfolio && selectedPortfolio.id !== -1) {
        // Convert to portfolio currency
        displayCurrency = selectedPortfolio.currency
        displayTax = convertCurrency(tax, transactionCurrency, selectedPortfolio.currency)
      }

      return <div className="text-sm text-muted-foreground">{formatCurrency(displayTax, displayCurrency)}</div>
    },
    enableHiding: true,
  },
  {
    accessorKey: "tags",
    header: "Tags",
    cell: ({ row }) => {
      const tags = row.getValue("tags") as string
      if (!tags) return null
      return (
        <div className="flex flex-wrap gap-1">
          {tags.split(",").map((tag, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {tag.trim()}
            </Badge>
          ))}
        </div>
      )
    },
  },
  {
    accessorKey: "recurrence",
    header: "Recurrence",
    cell: ({ row }) => {
      const recurrence = row.getValue("recurrence") as string
      if (!recurrence) {
        return <div className="text-sm text-muted-foreground">One-time</div>
      }
      const naturalLanguage = cronToNaturalLanguage(recurrence)
      return (
        <div className="text-sm">
          <div className="font-medium">{naturalLanguage}</div>
          <div className="text-xs text-muted-foreground font-mono">{recurrence}</div>
        </div>
      )
    },
    enableHiding: true,
  },
  {
    accessorKey: "notes",
    header: "Notes",
    cell: ({ row }) => {
      const notes = row.getValue("notes") as string
      if (!notes) return <div className="text-sm text-muted-foreground">-</div>
      return (
        <div className="text-sm max-w-[200px] truncate" title={notes}>
          {notes}
        </div>
      )
    },
    enableHiding: true,
  },
  {
    id: "actions",
    header: "Actions",
    enableHiding: false,
    cell: ({ row, table }) => {
      const transaction = row.original
      const onEditTransaction = (table.options.meta as any)?.onEditTransaction
      const onCloneTransaction = (table.options.meta as any)?.onCloneTransaction
      const onDeleteTransaction = (table.options.meta as any)?.onDeleteTransaction

      return (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => onEditTransaction?.(transaction)}
            title="Edit transaction"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => onCloneTransaction?.(transaction)}
            title="Duplicate transaction"
          >
            <Copy className="h-4 w-4" />
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                title="Delete transaction"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the transaction
                  for {transaction.asset.symbol} on {new Date(parseInt(transaction.date)).toLocaleDateString()}.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => onDeleteTransaction?.(transaction.id)}
                >
                  Delete Transaction
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )
    },
  },
  ]

  return columns
}

// Default columns for backward compatibility
export const columns = createColumns()
