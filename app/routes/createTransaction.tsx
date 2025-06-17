import { createTransaction } from "~/db/actions";
import type { Route } from "./+types/createTransaction";
import type { TransactionType } from "~/datatypes/transaction";

export async function loader({ }: Route.LoaderArgs) {
  // This route does not need to load any data, so we return an empty object
  return {};
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const transactionData = JSON.parse(formData.get("transaction") as string) as TransactionType;
  
  try {
    const createdTransactions = await createTransaction(transactionData);
    return {
      ok: true,
      data: createdTransactions,
      action: "createTransaction",
      error: undefined,
    };
  } catch (err) {
    console.log("Error creating transaction:", err);
    return {
      ok: false,
      error: "Failed to create transaction",
      action: "createTransaction",
      data: null,
    };
  }
}
