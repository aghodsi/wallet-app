import { createTransaction, updateTransaction, deleteTransaction, fetchTransactionById, fetchAllTransactions } from "~/db/actions"
import type { TransactionType } from "~/datatypes/transaction"
import type { Route } from "./+types/api.transactions";

export async function loader({ params }: Route.LoaderArgs) {
  const transactionId = params.id ? parseInt(params.id) : -1
  if (transactionId === -1) {
    // If no transaction ID is provided, fetch all transactions
    return await fetchAllTransactions()
  } else {
    // If a transaction ID is provided, fetch that specific transaction
    const transaction = await fetchTransactionById(transactionId)
    if (!transaction || transaction.length === 0) {
      return new Response(
        JSON.stringify({ error: "Transaction not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      )
    }
    return transaction[0] // Return the first (and should be only) transaction
  }
}

export async function action({ request, params }: Route.ActionArgs) {
  const url = new URL(request.url)
  const pathSegments = url.pathname.split('/')
  const transactionId = params.id ? parseInt(params.id) : -1

  // if no transaction ID is provided and it's not a POST request, return an error because we need an ID to perform operations like update or delete
  // POST requests are for creating new transactions, so they don't require an ID
  if (transactionId === -1 && request.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Transaction ID is required" }),

      { status: 400, headers: { "Content-Type": "application/json" } }
    )
  }

  if (request.method === "POST") {
    // Handle POST request for creating new transactions
    try {
      const body = await request.formData()

      const transactionData = JSON.parse(body.get("transaction") as string) as TransactionType;

      const result = await createTransaction(transactionData)

      return {
        ok: true,
        data: result,
        action: "createTransaction",
        error: undefined,
      };
    } catch (error) {
      console.error("Error creating transaction:", error)
      return new Response(
        JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      )
    }
  }

  if (request.method === "PUT") {

    try {
      const id = transactionId
      let transactionData: Partial<TransactionType>

      const contentType = request.headers.get("Content-Type")
      if (contentType && contentType.includes("application/json")) {
        // Handle JSON data
        transactionData = await request.json()
      } else {
        // Handle form data (legacy support)
        const body = await request.formData()
        transactionData = JSON.parse(body.get("transaction") as string) as Partial<TransactionType>
      }

      await updateTransaction(id, transactionData)

      return new Response(
        JSON.stringify({ success: true, message: "Transaction updated successfully" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    } catch (error) {
      console.error("Error updating transaction:", error)
      return new Response(
        JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      )
    }
  }

  if (request.method === "DELETE") {

    try {
      const id = transactionId

      // Check if transaction exists before deleting
      const existingTransaction = await fetchTransactionById(id)
      if (!existingTransaction || existingTransaction.length === 0) {
        return new Response(
          JSON.stringify({ error: "Transaction not found" }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        )
      }

      await deleteTransaction(id)

      return new Response(
        JSON.stringify({ success: true, message: "Transaction deleted successfully" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    } catch (error) {
      console.error("Error deleting transaction:", error)
      return new Response(
        JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      )
    }
  }

  return new Response(
    JSON.stringify({ error: "Method not allowed" }),
    { status: 405, headers: { "Content-Type": "application/json" } }
  )
}
