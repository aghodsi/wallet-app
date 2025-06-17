import { useMutation, useQueryClient } from "@tanstack/react-query"
import { TransactionCreation } from "./transactionCreation"
import { PortfolioCreation } from "./portfolioCreation"
import { useDialogContext } from "~/contexts/transactionDialogContext"
import { userPortfolios } from "~/stateManagement/portfolioContext"
import type { TransactionType } from "~/datatypes/transaction"
import type { PortfolioType } from "~/datatypes/portfolio"

export function GlobalDialogs() {
  const { activeDialog, closeDialog, currencies, institutions } = useDialogContext()
  const portfolios = userPortfolios()
  const selectedPortfolio = portfolios.find(p => p.selected)
  const queryClient = useQueryClient()

  // Mutation for creating transactions
  const createTransactionMutation = useMutation({
    mutationFn: async (transactionData: TransactionType) => {
      const formData = new FormData()
      formData.append("transaction", JSON.stringify(transactionData))
      
      const response = await fetch("/api/transactions", {
        method: "POST",
        body: formData,
      })
      
      if (!response.ok) {
        throw new Error("Failed to create transaction")
      }
      
      return response.json()
    },
    onSuccess: () => {
      // Invalidate and refetch transactions
      queryClient.invalidateQueries({ queryKey: ["transactions"] })
      closeDialog()
      // Refresh the page to show updated data
      window.location.reload()
    },
    onError: (error) => {
      console.error("Error creating transaction:", error)
      alert("Failed to create transaction: " + (error as Error).message)
    },
  })

  // Mutation for creating portfolios
  const createPortfolioMutation = useMutation({
    mutationFn: async (portfolioData: PortfolioType) => {
      const formData = new FormData()
      formData.append("portfolio", JSON.stringify(portfolioData))
      
      const response = await fetch("/createPortfolio", {
        method: "POST",
        body: formData,
      })
      
      if (!response.ok) {
        throw new Error("Failed to create portfolio")
      }
      
      return response.json()
    },
    onSuccess: () => {
      // Invalidate and refetch portfolios
      queryClient.invalidateQueries({ queryKey: ["portfolios"] })
      closeDialog()
      // Refresh the page to show updated data
      window.location.reload()
    },
    onError: (error) => {
      console.error("Error creating portfolio:", error)
      alert("Failed to create portfolio: " + (error as Error).message)
    },
  })

  return (
    <>
      <TransactionCreation
        open={activeDialog === 'transaction'}
        openChange={closeDialog}
        onCreate={(transaction) => createTransactionMutation.mutate(transaction)}
        portfolios={portfolios}
        currencies={currencies}
        selectedPortfolioId={selectedPortfolio?.id}
      />
      
      <PortfolioCreation
        open={activeDialog === 'portfolio'}
        openChange={(open) => !open && closeDialog()}
        onCreate={(portfolio) => createPortfolioMutation.mutate(portfolio)}
        institutions={institutions}
        currencies={currencies}
      />
    </>
  )
}

// Keep the old export name for backward compatibility
export const GlobalTransactionDialog = GlobalDialogs
