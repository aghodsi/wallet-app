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
import { DataTableFacetedFilter } from "./data-table-faceted-filter"
import { convertTextToIcon } from "~/lib/iconHelper"
import { transactionsToCSV, downloadCSV } from "~/lib/csvUtils"
import { type TransactionType } from "~/datatypes/transaction"
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
  onEditTransaction?: (transaction: any) => void
  onCloneTransaction?: (transaction: any) => void
  onDeleteTransaction?: (transactionId: number) => void
  portfolios?: PortfolioType[]
  selectedPortfolioId?: number
  showOriginalCurrency?: boolean
}

// Helper function to convert column IDs to proper display names
function getColumnDisplayName(columnId: string): string {
  const columnNames: Record<string, string> = {
    "select": "Select",
    "date": "Date",
    "portfolio": "Portfolio",
    "institution": "Institution",
    "type": "Type",
    "asset": "Asset",
    "quantity": "Quantity",
    "price": "Price",
    "total": "Total",
    "commision": "Commission",
    "tax": "Tax",
    "tags": "Tags",
    "recurrence": "Recurrence",
    "notes": "Notes",
    "actions": "Actions"
  }
  
  return columnNames[columnId] || columnId.charAt(0).toUpperCase() + columnId.slice(1)
}

export function TransactionsDataTable<TData, TValue>({
  columns,
  data,
  onAssetClick,
  onEditTransaction,
  onCloneTransaction,
  onDeleteTransaction,
  portfolios = [],
  selectedPortfolioId,
  showOriginalCurrency = false,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({
      tax: false,        // Hide tax column by default
      institution: false, // Hide institution column by default
      recurrence: false,  // Hide recurrence column by default
      notes: false       // Hide notes column by default
    })
  const [rowSelection, setRowSelection] = React.useState({})

  // Check if we're showing all portfolios
  const isShowingAllPortfolios = selectedPortfolioId === -1

  // Get unique institutions from portfolios
  const uniqueInstitutions = React.useMemo(() => {
    if (!portfolios) return []
    const institutions = portfolios
      .filter(p => p.institution && p.institution.name && p.institution.id >= 0)
      .map(p => p.institution.name)
    return Array.from(new Set(institutions))
  }, [portfolios])

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
      onEditTransaction,
      onCloneTransaction,
      onDeleteTransaction,
    },
  })

  // Handle CSV export
  const handleExportCSV = React.useCallback(() => {
    const selectedRows = table.getFilteredSelectedRowModel().rows
    const hasSelectedRows = selectedRows.length > 0
    
    // Get transactions to export (selected or all filtered)
    const transactionsToExport = hasSelectedRows 
      ? selectedRows.map(row => row.original as TransactionType)
      : table.getFilteredRowModel().rows.map(row => row.original as TransactionType)
    
    // Get selected portfolio for currency conversion
    const selectedPortfolio = portfolios.find(p => p.id === selectedPortfolioId)
    
    // Generate CSV content
    const csvContent = transactionsToCSV(transactionsToExport, {
      portfolios,
      showOriginalCurrency,
      selectedPortfolio
    })
    
    // Generate filename with timestamp and selection info
    const timestamp = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
    const selectionInfo = hasSelectedRows ? `selected_${selectedRows.length}` : 'all'
    const portfolioName = selectedPortfolio && selectedPortfolio.id !== -1 
      ? `_${selectedPortfolio.name.replace(/[^a-zA-Z0-9]/g, '_')}`
      : ''
    const filename = `transactions_${selectionInfo}${portfolioName}_${timestamp}.csv`
    
    // Download the CSV
    downloadCSV(csvContent, filename)
  }, [table, portfolios, selectedPortfolioId, showOriginalCurrency])

  return (
    <div className="w-full">
      <div className="flex items-center py-4 gap-4 flex-wrap">
        <Input
          placeholder="Filter by asset symbol..."
          value={(table.getColumn("asset")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("asset")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <DataTableFacetedFilter
          column={table.getColumn("type")}
          title="Type"
          options={[
            { label: "Buy", value: "Buy" },
            { label: "Sell", value: "Sell" },
            { label: "Dividend", value: "Dividend" },
            { label: "Deposit", value: "Deposit" },
            { label: "Withdraw", value: "Withdraw" },
          ]}
        />
        
        {isShowingAllPortfolios && (
          <>
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

            <DataTableFacetedFilter
              column={table.getColumn("institution")}
              title="Institution"
              options={uniqueInstitutions.map(institution => ({
                label: institution,
                value: institution,
              }))}
            />
          </>
        )}

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
                    ? `Export ${table.getFilteredSelectedRowModel().rows.length} selected transactions`
                    : `Export all ${table.getFilteredRowModel().rows.length} transactions`
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
                  No transactions found.
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
