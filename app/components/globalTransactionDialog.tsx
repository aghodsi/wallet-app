import { useMutation, useQueryClient } from "@tanstack/react-query"
import { TransactionCreation } from "./transactionCreation"
import { useTransactionDialog } from "~/contexts/transactionDialogContext"
import { userPortfolios } from "~/stateManagement/portfolioContext"
import type { TransactionType } from "~/datatypes/transaction"

export function GlobalTransactionDialog() {
  const { isOpen, closeDialog, currencies } = useTransactionDialog()
  const portfolios = userPortfolios()
  const selectedPortfolio = portfolios.find(p => p.selected)
  const queryClient = useQueryClient()

  // Mutation for creating transactions
  const createTransactionMutation = useMutation({
    mutationFn: async (transactionData: TransactionType) => {
      const formData = new FormData()
      formData.append("transaction", JSON.stringify(transactionData))
      
      const response = await fetch("/createTransaction", {
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

  return (
    <TransactionCreation
      open={isOpen}
      openChange={closeDialog}
      onCreate={(transaction) => createTransactionMutation.mutate(transaction)}
      portfolios={portfolios}
      currencies={currencies}
      selectedPortfolioId={selectedPortfolio?.id}
    />
  )
}
