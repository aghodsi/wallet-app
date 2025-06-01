import { createTransaction } from "~/db/actions";
import type { Route } from "./+types/createTransaction";

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const transactionData = JSON.parse(formData.get("transaction") as string);

  // Call your database or API to create the portfolio
  const [hasHouskeeping, housekeepingId, createdTransactionPromise] =
    await createTransaction(transactionData);
  const createdTransactionResult = await createdTransactionPromise;
  if (
    !Array.isArray(createdTransactionResult) ||
    createdTransactionResult.length <= 0
  ) {
    console.log("Error creating transaction:", createdTransactionResult);
    return {
      ok: false,
      error: "Failed to create transaction",
      action: "createTransaction",
      data: null,
    };
  }
  const createdTransaction =
    Array.isArray(createdTransactionResult) &&
    createdTransactionResult.length > 0
      ? createdTransactionResult[0].insertId
      : undefined;

  return {
    ok: true,
    data: [hasHouskeeping, housekeepingId, createdTransaction],
    action: "createTransaction",
    error: undefined,
  };
}
