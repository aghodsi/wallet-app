"use client"

import { type ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal, Eye } from "lucide-react"
import { Badge } from "~/components/ui/badge"
import { Button } from "~/components/ui/button"
import { Checkbox } from "~/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu"
import { convertTextToIcon } from "~/lib/iconHelper"
import { type PortfolioType } from "~/datatypes/portfolio"
import { type CurrencyType } from "~/datatypes/currency"
import { formatCurrency } from "~/lib/currencyUtils"

export type AssetHoldingType = {
  symbol: string
  name: string
  portfolio: string
  portfolioId: number
  totalQuantity: number
  averagePrice: number
  currentPrice: number
  totalValue: number
  unrealizedGainLoss: number
  unrealizedGainLossPercentage: number
  currency: CurrencyType
  instrumentType?: string
  exchangeName?: string
  lastUpdated?: string
}

interface CreateColumnsProps {
  portfolios: PortfolioType[]
  selectedPortfolioId?: number
  showOriginalCurrency: boolean
  allCurrencies: CurrencyType[]
}

export function createColumns({
  portfolios,
  selectedPortfolioId,
  showOriginalCurrency,
  allCurrencies,
}: CreateColumnsProps): ColumnDef<AssetHoldingType>[] {
  return [
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
      accessorKey: "symbol",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Symbol
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row, table }) => {
        const symbol = row.getValue("symbol") as string
        const meta = table.options.meta as any
        
        return (
          <button
            onClick={() => meta?.onAssetClick?.(symbol)}
            className="font-medium text-primary hover:underline text-left"
          >
            {symbol}
          </button>
        )
      },
    },
    {
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const name = row.getValue("name") as string
        return <div className="truncate max-w-[200px]" title={name}>{name}</div>
      },
    },
    {
      accessorKey: "portfolio",
      header: ({ column }) => {
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
      cell: ({ row }) => {
        const portfolioName = row.getValue("portfolio") as string
        const portfolioId = row.original.portfolioId
        const portfolio = portfolios.find(p => p.id === portfolioId)
        
        return (
          <div className="flex items-center gap-2">
            {portfolio && convertTextToIcon(portfolio.symbol, "h-4 w-4")}
            <span>{portfolioName}</span>
          </div>
        )
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id))
      },
    },
    {
      accessorKey: "totalQuantity",
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
        const quantity = row.getValue("totalQuantity") as number
        return <div className="text-right">{quantity.toLocaleString(undefined, { maximumFractionDigits: 6 })}</div>
      },
    },
    {
      accessorKey: "averagePrice",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Avg. Price
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const price = row.getValue("averagePrice") as number
        const currency = row.original.currency
        return (
          <div className="text-right">
            {formatCurrency(price, currency)}
          </div>
        )
      },
    },
    {
      accessorKey: "currentPrice",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Current Price
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const price = row.getValue("currentPrice") as number
        const currency = row.original.currency
        return (
          <div className="text-right">
            {formatCurrency(price, currency)}
          </div>
        )
      },
    },
    {
      accessorKey: "totalValue",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Total Value
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const value = row.getValue("totalValue") as number
        const currency = row.original.currency
        return (
          <div className="text-right font-medium">
            {formatCurrency(value, currency)}
          </div>
        )
      },
    },
    {
      accessorKey: "unrealizedGainLoss",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            P&L
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const gainLoss = row.getValue("unrealizedGainLoss") as number
        const percentage = row.original.unrealizedGainLossPercentage
        const currency = row.original.currency
        const isPositive = gainLoss >= 0
        
        return (
          <div className="text-right">
            <div className={`font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(gainLoss, currency)}
            </div>
            <div className={`text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {isPositive ? '+' : ''}{percentage.toFixed(2)}%
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "instrumentType",
      header: "Type",
      cell: ({ row }) => {
        const type = row.getValue("instrumentType") as string
        return type ? <Badge variant="outline">{type}</Badge> : null
      },
    },
    {
      accessorKey: "exchangeName",
      header: "Exchange",
      cell: ({ row }) => {
        const exchange = row.getValue("exchangeName") as string
        return exchange ? <Badge variant="secondary">{exchange}</Badge> : null
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row, table }) => {
        const asset = row.original
        const meta = table.options.meta as any

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => meta?.onAssetClick?.(asset.symbol)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(asset.symbol)}>
                Copy Symbol
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
}
