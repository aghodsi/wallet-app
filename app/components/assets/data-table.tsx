"use client"

import * as React from "react"
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ChevronDown, Download } from "lucide-react"

import { Button } from "~/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu"
import { Input } from "~/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table"
import { DataTableFacetedFilter } from "~/components/transactions/data-table-faceted-filter"
import { convertTextToIcon } from "~/lib/iconHelper"
import { type AssetHoldingType } from "./columns"
import { type PortfolioType } from "~/datatypes/portfolio"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  onAssetClick?: (symbol: string) => void
  portfolios?: PortfolioType[]
  selectedPortfolioId?: number
}

// Helper function to convert column IDs to proper display names
function getColumnDisplayName(columnId: string): string {
  const columnNames: Record<string, string> = {
    "select": "Select",
    "symbol": "Symbol",
    "name": "Name",
    "portfolio": "Portfolio",
    "totalQuantity": "Quantity",
    "averagePrice": "Avg. Price",
    "currentPrice": "Current Price",
    "totalValue": "Total Value",
    "unrealizedGainLoss": "P&L",
    "instrumentType": "Type",
    "exchangeName": "Exchange",
    "actions": "Actions"
  }
  
  return columnNames[columnId] || columnId.charAt(0).toUpperCase() + columnId.slice(1)
}

export function AssetsDataTable<TData, TValue>({
  columns,
  data,
  onAssetClick,
  portfolios = [],
  selectedPortfolioId,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({
      instrumentType: false, // Hide instrument type column by default
      exchangeName: false,   // Hide exchange column by default
    })
  const [rowSelection, setRowSelection] = React.useState({})

  // Check if we're showing all portfolios
  const isShowingAllPortfolios = selectedPortfolioId === -1

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    filterFns: {
      arrIncludes: (row, id, value) => {
        return value.includes(row.getValue(id))
      },
    },
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    meta: {
      onAssetClick,
    },
  })

  // Handle CSV export
  const handleExportCSV = React.useCallback(() => {
    const selectedRows = table.getFilteredSelectedRowModel().rows
    const hasSelectedRows = selectedRows.length > 0
    
    // Get assets to export (selected or all filtered)
    const assetsToExport = hasSelectedRows 
      ? selectedRows.map(row => row.original as AssetHoldingType)
      : table.getFilteredRowModel().rows.map(row => row.original as AssetHoldingType)
    
    // Generate CSV content
    const headers = [
      'Symbol',
      'Name',
      'Portfolio',
      'Quantity',
      'Average Price',
      'Current Price',
      'Total Value',
      'Unrealized P&L',
      'Unrealized P&L %',
      'Instrument Type',
      'Exchange'
    ]
    
    const csvRows = [
      headers.join(','),
      ...assetsToExport.map(asset => [
        asset.symbol,
        `"${asset.name}"`,
        `"${asset.portfolio}"`,
        asset.totalQuantity,
        asset.averagePrice,
        asset.currentPrice,
        asset.totalValue,
        asset.unrealizedGainLoss,
        asset.unrealizedGainLossPercentage,
        asset.instrumentType || '',
        asset.exchangeName || ''
      ].join(','))
    ]
    
    const csvContent = csvRows.join('\n')
    
    // Generate filename with timestamp and selection info
    const timestamp = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
    const selectionInfo = hasSelectedRows ? `selected_${selectedRows.length}` : 'all'
    const selectedPortfolio = portfolios.find(p => p.id === selectedPortfolioId)
    const portfolioName = selectedPortfolio && selectedPortfolio.id !== -1 
      ? `_${selectedPortfolio.name.replace(/[^a-zA-Z0-9]/g, '_')}`
      : ''
    const filename = `assets_${selectionInfo}${portfolioName}_${timestamp}.csv`
    
    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [table, portfolios, selectedPortfolioId])

  return (
    <div className="w-full">
      <div className="flex items-center py-4 gap-4 flex-wrap">
        <Input
          placeholder="Filter by asset symbol..."
          value={(table.getColumn("symbol")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("symbol")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        
        {isShowingAllPortfolios && (
          <DataTableFacetedFilter
            column={table.getColumn("portfolio")}
            title="Portfolio"
            options={portfolios
              .filter(portfolio => portfolio.id !== -1)
              .map(portfolio => ({
                label: portfolio.name,
                value: portfolio.name,
                icon: () => convertTextToIcon(portfolio.symbol, "h-4 w-4"),
              }))}
          />
        )}

        <DataTableFacetedFilter
          column={table.getColumn("instrumentType")}
          title="Type"
          options={[
            { label: "Stock", value: "Stock" },
            { label: "ETF", value: "ETF" },
            { label: "Mutual Fund", value: "Mutual Fund" },
            { label: "Bond", value: "Bond" },
            { label: "Cryptocurrency", value: "Cryptocurrency" },
          ]}
        />

        <div className="flex items-center gap-2 ml-auto">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportCSV}
                  disabled={table.getFilteredRowModel().rows.length === 0}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {table.getFilteredSelectedRowModel().rows.length > 0
                    ? `Export ${table.getFilteredSelectedRowModel().rows.length} selected assets`
                    : `Export all ${table.getFilteredRowModel().rows.length} assets`
                  }
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                Columns <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {getColumnDisplayName(column.id)}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No assets found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
