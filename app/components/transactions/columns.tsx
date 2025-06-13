"use client"

import { type ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, ChartCandlestick, Edit, Trash2, Copy } from "lucide-react"
import { type TransactionType } from "~/datatypes/transaction"
import { Button } from "~/components/ui/button"
import { Checkbox } from "~/components/ui/checkbox"
import { Badge } from "~/components/ui/badge"
import { cronToNaturalLanguage } from "~/lib/cronUtils"

export const columns: ColumnDef<TransactionType>[] = [
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
      const date = new Date(row.getValue("date"))
      return <div className="font-medium">{date.toLocaleDateString()}</div>
    },
  },
  {
    accessorKey: "type",
    header: "Type",
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
    header: "Quantity",
    cell: ({ row }) => {
      const quantity = parseFloat(row.getValue("quantity"))
      return <div className="font-medium">{quantity.toFixed(2)}</div>
    },
  },
  {
    accessorKey: "price",
    header: "Price",
    cell: ({ row }) => {
      const price = parseFloat(row.getValue("price"))
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(price)
      return <div className="font-medium">{formatted}</div>
    },
  },
  {
    id: "total",
    header: "Total",
    cell: ({ row }) => {
      const quantity = parseFloat(row.getValue("quantity"))
      const price = parseFloat(row.getValue("price"))
      const total = quantity * price
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(total)
      return <div className="font-medium">{formatted}</div>
    },
  },
  {
    accessorKey: "commision",
    header: "Commission",
    cell: ({ row }) => {
      const commission = parseFloat(row.getValue("commision"))
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(commission)
      return <div className="text-sm text-muted-foreground">{formatted}</div>
    },
  },
  {
    accessorKey: "tax",
    header: "Tax",
    cell: ({ row }) => {
      const tax = parseFloat(row.getValue("tax"))
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(tax)
      return <div className="text-sm text-muted-foreground">{formatted}</div>
    },
    enableHiding: true,
  },
  {
    id: "institution",
    header: "Institution",
    cell: ({ row }) => {
      // For now, we'll show a placeholder since we don't have institution data in the transaction
      // This would need to be populated by joining with portfolio and institution data
      return <div className="text-sm text-muted-foreground">Institution Name</div>
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
    id: "actions",
    header: "Actions",
    enableHiding: false,
    cell: ({ row }) => {
      const transaction = row.original

      return (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => {
              // TODO: Implement edit functionality
              console.log("Edit transaction:", transaction.id)
            }}
            title="Edit transaction"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => {
              // TODO: Implement duplicate functionality
              console.log("Duplicate transaction:", transaction.id)
            }}
            title="Duplicate transaction"
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            onClick={() => {
              // TODO: Implement delete functionality
              console.log("Delete transaction:", transaction.id)
            }}
            title="Delete transaction"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    },
  },
]
