import { Button } from "~/components/ui/button"
import { Plus, Clock, Calendar, Trash2, Eye, ArrowLeft } from "lucide-react"
import { useMemo, useState } from "react"
import { type TransactionType } from "~/datatypes/transaction"
import { userPortfolios } from "~/stateManagement/portfolioContext"
import { fetchRecurringTransactions, fetchCronRunsForTransaction } from "~/db/actions"
import { useTransactionDialog, useDialogContext } from "~/contexts/transactionDialogContext"
import { useAllTransactions } from "~/hooks/useTransactions"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table"
import { Badge } from "~/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog"
import type { Route } from "/types/+recurringTransactions"

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

export async function loader({ request, params }: Route.LoaderArgs) {
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
  const { openPortfolioDialog } = useDialogContext()
  const [isUpdating, setIsUpdating] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<RecurringTransactionWithRuns | null>(null)
  const [showRelatedDialog, setShowRelatedDialog] = useState(false)
  
  // Check if there are any real portfolios (excluding "All" portfolio with id -1)
  const hasRealPortfolios = portfolios.some(p => p.id !== -1)
  
  // Use TanStack Query to fetch all transactions for filtering
  const { data: allTransactions, isLoading: isLoadingAllTransactions } = useAllTransactions()

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

  const handleRemoveRecurrence = async (transactionId: number) => {
    setIsUpdating(true)
    try {
      const response = await fetch(`/api/transactions/${transactionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recurrence: "",
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update transaction')
      }

      // Reload the page to show updated data
      window.location.reload()
    } catch (error) {
      console.error('Error removing recurrence:', error)
      alert('Failed to remove recurrence. Please try again.')
    } finally {
      setIsUpdating(false)
    }
  }

  // Filter related transactions using TanStack Query data
  const relatedTransactions = useMemo(() => {
    if (!selectedTransaction || !allTransactions) return []
    
    return allTransactions.filter((t: any) => 
      t.recurrenceOf === selectedTransaction.id
    )
  }, [selectedTransaction, allTransactions])

  const handleViewRelatedTransactions = (transaction: RecurringTransactionWithRuns) => {
    setSelectedTransaction(transaction)
    setShowRelatedDialog(true)
  }

  const formatTransactionDate = (dateString: string) => {
    try {
      const date = new Date(parseInt(dateString))
      return date.toLocaleDateString() + " " + date.toLocaleTimeString()
    } catch {
      return dateString
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

  // Show disabled state when no real portfolios exist
  if (!hasRealPortfolios) {
    return (
      <main className="pt-16 p-4 container mx-auto">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
              <Clock className="h-6 w-6 sm:h-8 sm:w-8" />
              Recurring Transactions
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              View and manage transactions with recurring schedules
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>No Portfolios Available</CardTitle>
            <CardDescription>
              You need to create at least one portfolio before you can manage recurring transactions.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center py-8">
              <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Create Your First Portfolio</h3>
              <p className="text-muted-foreground mb-4">
                Recurring transactions are associated with portfolios. Start by creating a portfolio to enable this feature.
              </p>
              <Button 
                onClick={openPortfolioDialog}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Portfolio
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <Clock className="h-6 w-6 sm:h-8 sm:w-8" />
            Recurring Transactions
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            View and manage transactions with recurring schedules
            {selectedPortfolio && selectedPortfolio.id !== -1 && (
              <span> for {selectedPortfolio.name}</span>
            )}
          </p>
        </div>
        <Button 
          onClick={() => openDialog()}
          className="w-full sm:w-auto shrink-0"
        >
          <Plus className="mr-2 h-4 w-4" />
          <span className="hidden xs:inline">Add Transaction</span>
          <span className="xs:hidden">Add</span>
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
                  <TableHead>Actions</TableHead>
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
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewRelatedTransactions(transaction)}
                          disabled={isUpdating}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="destructive"
                              size="sm"
                              disabled={isUpdating}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove Recurring Schedule</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to remove the recurring schedule from this transaction?
                                <br /><br />
                                <strong>This will only remove the recurrence pattern, not the transaction itself.</strong>
                                <br /><br />
                                The transaction will remain in your records, but it will no longer run automatically on the scheduled intervals.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleRemoveRecurrence(transaction.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Remove Recurrence
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Related Transactions Dialog */}
      <Dialog open={showRelatedDialog} onOpenChange={setShowRelatedDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Related Transactions
              {selectedTransaction && (
                <span className="text-sm font-normal text-muted-foreground">
                  for {selectedTransaction.asset.symbol}
                </span>
              )}
            </DialogTitle>
            <DialogDescription>
              Transactions created automatically from the recurring schedule
            </DialogDescription>
          </DialogHeader>

          {isLoadingAllTransactions ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Loading related transactions...</div>
            </div>
          ) : relatedTransactions.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Related Transactions</h3>
                <p className="text-muted-foreground">
                  This recurring transaction hasn't created any automatic transactions yet.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Found {relatedTransactions.length} transaction{relatedTransactions.length !== 1 ? 's' : ''} created from this recurring schedule
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Asset</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Portfolio</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {relatedTransactions.map((transaction: any) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <div className="text-sm">
                          {formatTransactionDate(transaction.date)}
                        </div>
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
                      <TableCell className="font-medium">
                        {transaction.asset}
                      </TableCell>
                      <TableCell>{transaction.quantity}</TableCell>
                      <TableCell>${transaction.price.toFixed(2)}</TableCell>
                      <TableCell>${(transaction.quantity * transaction.price).toFixed(2)}</TableCell>
                      <TableCell>{getPortfolioName(transaction.portfolioId)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </main>
  )
}
