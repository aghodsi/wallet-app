import { Button } from "~/components/ui/button"
import { Plus, Clock, Calendar } from "lucide-react"
import { useMemo } from "react"
import { type TransactionType } from "~/datatypes/transaction"
import { userPortfolios } from "~/stateManagement/portfolioContext"
import { fetchRecurringTransactions, fetchCronRunsForTransaction } from "~/db/actions"
import { useTransactionDialog } from "~/contexts/transactionDialogContext"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table"
import { Badge } from "~/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"

interface CronRun {
  id: number
  transactionId: number
  runtime: string
  status: string
  createdAt: string
  errorMessage?: string
}

interface RecurringTransactionWithRuns extends TransactionType {
  lastRun?: CronRun
  nextRun?: string
}

export async function loader() {
  try {
    const recurringTransactions = await fetchRecurringTransactions()
    
    // Get the latest cron run for each transaction
    const transactionsWithRuns = await Promise.all(
      recurringTransactions.map(async (transaction: any) => {
        const cronRuns = await fetchCronRunsForTransaction(transaction.id)
        const lastRun = cronRuns.length > 0 ? cronRuns[0] : undefined
        
        return {
          ...transaction,
          lastRun,
        }
      })
    )

    return { transactions: transactionsWithRuns }
  } catch (error) {
    console.error("Error loading recurring transactions:", error)
    return { transactions: [], error: "Failed to load recurring transactions" }
  }
}

export default function RecurringTransactions({ loaderData }: { loaderData: any }) {
  const { transactions: rawTransactions, error } = loaderData
  const portfolios = userPortfolios()
  const selectedPortfolio = portfolios.find(p => p.selected)
  const { openDialog } = useTransactionDialog()

  // Transform and filter the raw transaction data
  const transactions = useMemo(() => {
    if (!rawTransactions) return []
    
    const transformedTransactions = rawTransactions.map((rawTransaction: any): RecurringTransactionWithRuns => ({
      id: rawTransaction.id,
      portfolioId: rawTransaction.portfolioId,
      date: rawTransaction.date,
      type: rawTransaction.type,
      asset: {
        symbol: rawTransaction.asset,
        isFetchedFromApi: false,
      },
      quantity: rawTransaction.quantity,
      price: rawTransaction.price,
      commision: rawTransaction.commision,
      tax: rawTransaction.tax,
      recurrence: rawTransaction.recurrence,
      tags: rawTransaction.tags || "",
      notes: rawTransaction.notes,
      isHousekeeping: Boolean(rawTransaction.isHouskeeping),
      isCreatedByUser: true,
      lastRun: rawTransaction.lastRun,
    }))
    
    // Filter transactions based on selected portfolio
    if (!selectedPortfolio || selectedPortfolio.id === -1) {
      return transformedTransactions
    } else {
      return transformedTransactions.filter((t: RecurringTransactionWithRuns) => t.portfolioId === selectedPortfolio.id)
    }
  }, [rawTransactions, selectedPortfolio])

  const getPortfolioName = (portfolioId: number) => {
    const portfolio = portfolios.find(p => p.id === portfolioId)
    return portfolio?.name || `Portfolio ${portfolioId}`
  }

  const formatCronExpression = (cron: string) => {
    // Simple cron expression formatter - you might want to use a library like cronstrue
    if (!cron) return "No recurrence"
    
    const parts = cron.split(' ')
    if (parts.length >= 5) {
      const [minute, hour, day, month, weekday] = parts
      
      // Common patterns
      if (cron === "0 0 * * *") return "Daily at midnight"
      if (cron === "0 0 * * 0") return "Weekly on Sunday"
      if (cron === "0 0 1 * *") return "Monthly on 1st"
      if (cron === "0 0 1 1 *") return "Yearly on Jan 1st"
      
      return `Custom: ${cron}`
    }
    
    return cron
  }

  const formatLastRun = (lastRun?: CronRun) => {
    if (!lastRun) return "Never"
    
    try {
      const date = new Date(parseInt(lastRun.createdAt))
      return date.toLocaleDateString() + " " + date.toLocaleTimeString()
    } catch {
      return "Unknown"
    }
  }

  const getStatusBadge = (lastRun?: CronRun) => {
    if (!lastRun) {
      return <Badge variant="secondary">Never Run</Badge>
    }
    
    switch (lastRun.status) {
      case "completed":
        return <Badge variant="default">Completed</Badge>
      case "failed":
        return <Badge variant="destructive">Failed</Badge>
      case "pending":
        return <Badge variant="outline">Pending</Badge>
      default:
        return <Badge variant="secondary">{lastRun.status}</Badge>
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
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Clock className="h-8 w-8" />
            Recurring Transactions
          </h1>
          <p className="text-muted-foreground">
            View and manage transactions with recurring schedules
            {selectedPortfolio && selectedPortfolio.id !== -1 && (
              <span> for {selectedPortfolio.name}</span>
            )}
          </p>
        </div>
        <Button onClick={() => openDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Add Transaction
        </Button>
      </div>

      {transactions.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Recurring Transactions</CardTitle>
            <CardDescription>
              You don't have any transactions with recurring schedules yet. 
              Create a transaction with a recurrence pattern to see it here.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Recurring Transactions ({transactions.length})
            </CardTitle>
            <CardDescription>
              Transactions that are scheduled to run automatically based on their recurrence patterns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Portfolio</TableHead>
                  <TableHead>Recurrence</TableHead>
                  <TableHead>Last Run</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction: RecurringTransactionWithRuns) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-medium">
                      {transaction.asset.symbol}
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        transaction.type === "Buy" ? "default" :
                        transaction.type === "Sell" ? "destructive" :
                        transaction.type === "Dividend" ? "secondary" :
                        "outline"
                      }>
                        {transaction.type}
                      </Badge>
                    </TableCell>
                    <TableCell>{transaction.quantity}</TableCell>
                    <TableCell>${transaction.price.toFixed(2)}</TableCell>
                    <TableCell>{getPortfolioName(transaction.portfolioId)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {formatCronExpression(transaction.recurrence || "")}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {formatLastRun(transaction.lastRun)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(transaction.lastRun)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </main>
  )
}
