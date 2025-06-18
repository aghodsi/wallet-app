import { type TransactionType } from "~/datatypes/transaction"
import { type PortfolioType } from "~/datatypes/portfolio"
import { formatCurrency, convertCurrency } from "~/lib/currencyUtils"

interface ExportOptions {
  portfolios?: PortfolioType[]
  showOriginalCurrency?: boolean
  selectedPortfolio?: PortfolioType
}

export function transactionsToCSV(
  transactions: TransactionType[],
  options: ExportOptions = {}
): string {
  const { portfolios = [], showOriginalCurrency = false, selectedPortfolio } = options

  // Define CSV headers
  const headers = [
    "Date",
    "Portfolio",
    "Institution", 
    "Type",
    "Asset",
    "Quantity",
    "Price",
    "Total",
    "Commission",
    "Tax",
    "Currency",
    "Tags",
    "Recurrence",
    "Notes"
  ]

  // Helper function to escape CSV values
  const escapeCSV = (value: any): string => {
    if (value === null || value === undefined) return ""
    const str = String(value)
    // If the value contains comma, quote, or newline, wrap in quotes and escape internal quotes
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  // Convert transactions to CSV rows
  const rows = transactions.map(transaction => {
    const transactionPortfolio = portfolios.find(p => p.id === transaction.portfolioId)
    const transactionCurrency = transaction.currency || transactionPortfolio?.currency
    
    // Calculate values
    const quantity = parseFloat(transaction.quantity.toString())
    const price = parseFloat(transaction.price.toString())
    const commission = parseFloat(transaction.commision.toString())
    const tax = parseFloat(transaction.tax.toString())
    const total = quantity * price

    // Determine display currency and convert values if needed
    let displayCurrency = transactionCurrency
    let displayPrice = price
    let displayTotal = total
    let displayCommission = commission
    let displayTax = tax

    if (!showOriginalCurrency && selectedPortfolio && selectedPortfolio.id !== -1 && transactionCurrency) {
      displayCurrency = selectedPortfolio.currency
      displayPrice = convertCurrency(price, transactionCurrency, selectedPortfolio.currency)
      displayTotal = convertCurrency(total, transactionCurrency, selectedPortfolio.currency)
      displayCommission = convertCurrency(commission, transactionCurrency, selectedPortfolio.currency)
      displayTax = convertCurrency(tax, transactionCurrency, selectedPortfolio.currency)
    }

    // Format date
    const dateValue = typeof transaction.date === 'string' ? parseInt(transaction.date) : transaction.date
    const formattedDate = new Date(dateValue).toLocaleDateString()

    return [
      escapeCSV(formattedDate),
      escapeCSV(transactionPortfolio?.name || "Unknown Portfolio"),
      escapeCSV(transactionPortfolio?.institution?.name || ""),
      escapeCSV(transaction.type),
      escapeCSV(transaction.asset.symbol),
      escapeCSV(quantity.toFixed(2)),
      escapeCSV(displayCurrency ? formatCurrency(displayPrice, displayCurrency) : displayPrice.toFixed(2)),
      escapeCSV(displayCurrency ? formatCurrency(displayTotal, displayCurrency) : displayTotal.toFixed(2)),
      escapeCSV(displayCurrency ? formatCurrency(displayCommission, displayCurrency) : displayCommission.toFixed(2)),
      escapeCSV(displayCurrency ? formatCurrency(displayTax, displayCurrency) : displayTax.toFixed(2)),
      escapeCSV(displayCurrency?.symbol || ""),
      escapeCSV(transaction.tags || ""),
      escapeCSV(transaction.recurrence || "One-time"),
      escapeCSV(transaction.notes || "")
    ].join(',')
  })

  // Combine headers and rows
  return [headers.join(','), ...rows].join('\n')
}

export function downloadCSV(csvContent: string, filename: string = 'transactions.csv'): void {
  // Create blob with CSV content
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  
  // Create download link
  const link = document.createElement('a')
  if (link.download !== undefined) {
    // Create object URL
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    
    // Add to DOM, click, and remove
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    // Clean up object URL
    URL.revokeObjectURL(url)
  }
}
