import "dotenv/config";
import { drizzle } from "drizzle-orm/mysql2";
import {
  assetTable,
  currencyTable,
  institutionTable,
  portfolioTable,
  transactionTable,
  cronRuns,
} from "./schema";
import mysql from "mysql2/promise";
import { eq, inArray, desc, ne, and } from "drizzle-orm";
import type { InstitutionType } from "~/datatypes/institution";
import type { PortfolioType } from "~/datatypes/portfolio";
import type { TransactionType } from "~/datatypes/transaction";
import type { AssetType } from "~/datatypes/asset";

const connection = await mysql.createConnection({
  host: process.env.DATABASE_HOST!,
  port: process.env.DATABASE_PORT ? parseInt(process.env.DATABASE_PORT) : 3306,
  user: process.env.DATABASE_USER!,
  password: process.env.DATABASE_PASSWORD!,
  database: process.env.DATABASE_NAME!,
  ssl: {},
});
// Constants
const HOUSEKEEPING_TRANSACTION = 1;
const REGULAR_TRANSACTION = 0;
const TRANSFER_TYPES = ["Buy", "Sell", "Dividend"] as const;

// Type definitions
type CreateTransactionResult = {
  mainTransaction: { id: number };
  housekeepingTransaction?: { id: number };
};

const db = drizzle({ client: connection });

export async function fetchPortfolios() {
  return db.select().from(portfolioTable);
}

export async function fetchPortfolioById(portfolioId: number) {
  return db
    .select()
    .from(portfolioTable)
    .where(eq(portfolioTable.id, portfolioId))
    .limit(1);
}

export async function fetchInstitutions() {
  return db.select().from(institutionTable);
}

export async function fetchInstitutionById(institutionId: number) {
  return db
    .select()
    .from(institutionTable)
    .where(eq(institutionTable.id, institutionId))
    .limit(1);
}

export async function fetchInstitutionByIds(institutionIds: number[]) {
  return db
    .select()
    .from(institutionTable)
    .where(inArray(institutionTable.id, institutionIds));
}

export async function fetchCurrencies() {
  return db.select().from(currencyTable);
}

export async function fetchDefaultCurrency() {
  return db
    .select()
    .from(currencyTable)
    .where(eq(currencyTable.isDefault, 1))
    .limit(1);
}

export async function fetchCurrenciesByIds(currencyIds: number[]) {
  return db
    .select()
    .from(currencyTable)
    .where(inArray(currencyTable.id, currencyIds));
}

export async function fetchCurrencyById(currencyId: number) {
  return db
    .select()
    .from(currencyTable)
    .where(eq(currencyTable.id, currencyId))
    .limit(1);
}

export async function updateCurrency(currencyId: number, updates: {
  exchangeRate?: number;
  isDefault?: boolean;
}) {
  try {
    return await db.transaction(async (tx) => {
      // If setting this currency as default, first unset all other defaults
      if (updates.isDefault) {
        await tx
          .update(currencyTable)
          .set({ isDefault: 0 })
          .where(ne(currencyTable.id, currencyId));
      }

      // Update the specified currency
      const updateData: any = {};
      if (updates.exchangeRate !== undefined) updateData.exchangeRate = updates.exchangeRate;
      if (updates.isDefault !== undefined) updateData.isDefault = updates.isDefault ? 1 : 0;
      updateData.lastUpdated = new Date().getTime().toString();

      await tx
        .update(currencyTable)
        .set(updateData)
        .where(eq(currencyTable.id, currencyId));

      return [{ id: currencyId }];
    });
  } catch (error) {
    console.error("Error updating currency:", error);
    throw new Error(
      `Failed to update currency: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export async function updateCurrencyExchangeRates(exchangeRates: Array<{
  currencyId: number;
  exchangeRate: number;
}>) {
  try {
    return await db.transaction(async (tx) => {
      for (const { currencyId, exchangeRate } of exchangeRates) {
        await tx
          .update(currencyTable)
          .set({ 
            exchangeRate,
            lastUpdated: new Date().getTime().toString()
          })
          .where(eq(currencyTable.id, currencyId));
      }
      return { success: true };
    });
  } catch (error) {
    console.error("Error updating currency exchange rates:", error);
    throw new Error(
      `Failed to update currency exchange rates: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export async function fetchTransactionsForPortfolio(portfolioId: number) {
  return db
    .select()
    .from(transactionTable)
    .where(eq(transactionTable.portfolioId, portfolioId));
}

export async function fetchAllTransactions() {
  return db.select().from(transactionTable);
}

export async function fetchTransactionById(transactionId: number) {
  return db
    .select()
    .from(transactionTable)
    .where(eq(transactionTable.id, transactionId))
    .limit(1);
}

export async function createPortfolio(portfolio: PortfolioType) {
  try {
    return await db.transaction(async (tx) => {
      let institutionId = portfolio.institution.id;

      if (portfolio.institution.isNew) {
        const created = await createInstitution(portfolio.institution);
        if (!created || !Array.isArray(created) || created.length === 0) {
          throw new Error("Failed to create new institution");
        }
        institutionId = created[0].id;
      }

      const result = await tx
        .insert(portfolioTable)
        .values({
          name: portfolio.name,
          currency: portfolio.currency.id,
          symbol: portfolio.symbol,
          type: portfolio.type || "Investment",
          institutionId: institutionId,
          createdAt: new Date().getTime().toString(),
          tags: portfolio.tags || "",
        })
        .$returningId();

      return result;
    });
  } catch (error) {
    console.error("Error creating portfolio:", error);
    throw new Error(
      `Failed to create portfolio: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export async function updatePortfolio(portfolioId: number, portfolio: Partial<PortfolioType>) {
  try {
    return await db.transaction(async (tx) => {
      let institutionId = portfolio.institution?.id;

      if (portfolio.institution?.isNew) {
        const created = await createInstitution(portfolio.institution);
        if (!created || !Array.isArray(created) || created.length === 0) {
          throw new Error("Failed to create new institution");
        }
        institutionId = created[0].id;
      }

      const updateData: any = {};
      
      if (portfolio.name !== undefined) updateData.name = portfolio.name;
      if (portfolio.currency !== undefined) updateData.currency = portfolio.currency.id;
      if (portfolio.symbol !== undefined) updateData.symbol = portfolio.symbol;
      if (portfolio.type !== undefined) updateData.type = portfolio.type;
      if (institutionId !== undefined) updateData.institutionId = institutionId;
      if (portfolio.tags !== undefined) updateData.tags = portfolio.tags || "";

      await tx
        .update(portfolioTable)
        .set(updateData)
        .where(eq(portfolioTable.id, portfolioId));

      return [{ id: portfolioId }];
    });
  } catch (error) {
    console.error("Error updating portfolio:", error);
    throw new Error(
      `Failed to update portfolio: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export async function createInstitution(institution: InstitutionType) {
  try {
    return db
      .insert(institutionTable)
      .values({
        name: institution.name,
        isDefault: institution.isDefault ? 1 : 0,
        website: institution.website,
        apiKey: institution.apiKey,
        apiSecret: institution.apiSecret,
        apiUrl: institution.apiUrl,
        lastUpdated: new Date().getTime().toString(),
      })
      .$returningId();
  } catch (error) {
    console.error("Error creating institution:", error);
    throw new Error(
      `Failed to create institution: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export async function getMostRecentAssetBySymbol(symbol: string) {
  return db
    .select()
    .from(assetTable)
    .where(eq(assetTable.symbol, symbol))
    .orderBy(desc(assetTable.lastUpdated))
    .limit(1);
}

export async function getAllAssetBySymbolOrderedDesc(symbol: string) {
  return db
    .select()
    .from(assetTable) 
    .where(eq(assetTable.symbol, symbol))
    .orderBy(desc(assetTable.lastUpdated));
}

export async function getAssetsBySymbols(symbols: string[]) {
  return db
    .select()
    .from(assetTable)
    .where(inArray(assetTable.symbol, symbols));
}

export async function getAllAssets() {
  return db.select().from(assetTable);
}

export async function getAllAssetsWithDateRange() {
  return db.select().from(assetTable);
}

export async function createAsset(asset: AssetType) {
  return db.insert(assetTable).values({
    symbol: asset.symbol,
    currency: asset.currency,
    exchangeName: asset.exchangeName,
    fullExchangeName: asset.fullExchangeName,
    instrumentType: asset.instrumentType,
    timezone: asset.timezone,
    exchangeTimezoneName: asset.exchangeTimezoneName,
    longName: asset.longName,
    shortName: asset.shortName,
    quotes: asset.quotes,
    events: asset.events,
    isFromApi: asset.isFromApi ? 1 : 0,
    lastUpdated: new Date().getTime().toString(),
  }).$returningId();
}

export async function createTransaction(
  transaction: TransactionType
): Promise<CreateTransactionResult> {
  try {
    console.log("Creating transaction (in DB Actions):", transaction);

    const result = await db.transaction(async (tx) => {
      // Create main transaction
      const mainTransaction = await tx
        .insert(transactionTable)
        .values({
          portfolioId: transaction.portfolioId,
          date: transaction.date,
          type: transaction.type,
          asset: (transaction.type === "Withdraw" || transaction.type === "Deposit") ? "Cash" : transaction.asset.symbol,
          quantity: transaction.quantity,
          price: transaction.price,
          commision: transaction.commision,
          recurrence: transaction.recurrence || "",
          tax: transaction.tax,
          tags: transaction.tags || "",
          notes: transaction.notes || "",
          isHouskeeping: REGULAR_TRANSACTION,
          duplicateOf: transaction.duplicateOf || null,
          recurrenceOf: transaction.recurrenceOf || null,
        })
        .$returningId();

      const result: CreateTransactionResult = {
        mainTransaction: mainTransaction[0],
      };

      // Handle transfer between portfolios
      const needsHousekeeping =
        TRANSFER_TYPES.includes(transaction.type as any) &&
        transaction.targetPortfolioId &&
        transaction.targetPortfolioId !== transaction.portfolioId;

      if (needsHousekeeping) {
        console.log(
          "Creating housekeeping transaction for transfer between portfolios"
        );

        const housekeepingType =
          transaction.type === "Buy" ? "Withdraw" : "Deposit";

        const housekeepingTransaction = await tx
          .insert(transactionTable)
          .values({
            portfolioId: transaction.targetPortfolioId!,
            date: transaction.date,
            type: housekeepingType,
            asset: "Cash",
            quantity: transaction.quantity,
            price: transaction.price,
            commision: transaction.commision,
            tax: transaction.tax,
            notes: `Transfer to other portfolio for purchase of asset ${transaction.asset}`,
            isHouskeeping: HOUSEKEEPING_TRANSACTION,
          })
          .$returningId();

        result.housekeepingTransaction = housekeepingTransaction[0];
        if (!result.housekeepingTransaction) {
          tx.rollback();
          throw new Error("Failed to create housekeeping transaction");
        }
        console.log("Housekeeping transaction created");
      }

      return result;
    });

    // Schedule the transaction if it has a recurrence pattern
    if (transaction.recurrence && transaction.recurrence.trim() !== '') {
      try {
        // Import cronService here to avoid circular dependency issues
        const { cronService } = await import('~/services/cronService');
        await cronService.scheduleIfRecurring(result.mainTransaction.id, transaction.recurrence);
      } catch (error) {
        console.error("Failed to schedule recurring transaction:", error);
        // Don't throw error here to prevent transaction creation from failing
      }
    }

    return result;
  } catch (error) {
    console.error("Error creating transaction:", error);
    throw new Error(
      `Failed to create transaction: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export async function updateTransaction(
  transactionId: number,
  transaction: Partial<TransactionType>
): Promise<void> {
  try {
    console.log("Updating transaction:", transactionId, transaction);

    const updateData: any = {};
    
    if (transaction.portfolioId !== undefined) updateData.portfolioId = transaction.portfolioId;
    if (transaction.date !== undefined) updateData.date = transaction.date;
    if (transaction.type !== undefined) updateData.type = transaction.type;
    if (transaction.asset !== undefined) updateData.asset = transaction.asset.symbol;
    if (transaction.quantity !== undefined) updateData.quantity = transaction.quantity;
    if (transaction.price !== undefined) updateData.price = transaction.price;
    if (transaction.commision !== undefined) updateData.commision = transaction.commision;
    if (transaction.recurrence !== undefined) updateData.recurrence = transaction.recurrence || "";
    if (transaction.tax !== undefined) updateData.tax = transaction.tax;
    if (transaction.tags !== undefined) updateData.tags = transaction.tags || "";
    if (transaction.notes !== undefined) updateData.notes = transaction.notes || "";

    await db
      .update(transactionTable)
      .set(updateData)
      .where(eq(transactionTable.id, transactionId));

    console.log("Transaction updated successfully");
  } catch (error) {
    console.error("Error updating transaction:", error);
    throw new Error(
      `Failed to update transaction: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export async function deleteTransaction(transactionId: number): Promise<void> {
  try {
    console.log("Deleting transaction:", transactionId);

    await db
      .delete(transactionTable)
      .where(eq(transactionTable.id, transactionId));

    console.log("Transaction deleted successfully");
  } catch (error) {
    console.error("Error deleting transaction:", error);
    throw new Error(
      `Failed to delete transaction: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export async function fetchRecurringTransactions(portfolioId?: number) {
  try {
    const conditions = [ne(transactionTable.recurrence, "")];
    
    if (portfolioId && portfolioId !== -1) {
      conditions.push(eq(transactionTable.portfolioId, portfolioId));
    }

    return db
      .select({
        id: transactionTable.id,
        portfolioId: transactionTable.portfolioId,
        date: transactionTable.date,
        type: transactionTable.type,
        asset: transactionTable.asset,
        quantity: transactionTable.quantity,
        price: transactionTable.price,
        commision: transactionTable.commision,
        recurrence: transactionTable.recurrence,
        tax: transactionTable.tax,
        tags: transactionTable.tags,
        notes: transactionTable.notes,
        isHouskeeping: transactionTable.isHouskeeping,
      })
      .from(transactionTable)
      .where(conditions.length > 1 ? and(...conditions) : conditions[0]);
  } catch (error) {
    console.error("Error fetching recurring transactions:", error);
    throw new Error(
      `Failed to fetch recurring transactions: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export async function fetchCronRunsForTransaction(transactionId: number) {
  try {
    return db
      .select()
      .from(cronRuns)
      .where(eq(cronRuns.transactionId, transactionId))
      .orderBy(desc(cronRuns.createdAt));
  } catch (error) {
    console.error("Error fetching cron runs:", error);
    throw new Error(
      `Failed to fetch cron runs: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export async function createRecurringTransaction(transactionId: number) {
  try {
    // Get the original transaction
    const transaction = await db.select().from(transactionTable)
      .where(eq(transactionTable.id, transactionId))
      .limit(1);

    if (!transaction || transaction.length === 0) {
      throw new Error('Transaction not found');
    }

    // Create a new transaction based on the original
    const newTransaction = {
      ...transaction[0],
      id: undefined, // Let the database generate a new ID
      recurrence: null, // Only the original transaction should have a recurrence
      date: new Date().getTime().toString(), // Use current time
      recurrenceOf: transactionId, // Set reference to the original recurring transaction
      duplicateOf: null, // This is not a duplicate, it's a recurrence
    };

    // Insert the new transaction
    const result = await db.insert(transactionTable).values(newTransaction).$returningId();
    return result[0];
  } catch (error) {
    console.error("Error creating recurring transaction:", error);
    throw new Error(
      `Failed to create recurring transaction: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export async function duplicateTransaction(transactionId: number): Promise<{ id: number }> {
  try {
    // Get the original transaction
    const transaction = await db.select().from(transactionTable)
      .where(eq(transactionTable.id, transactionId))
      .limit(1);

    if (!transaction || transaction.length === 0) {
      throw new Error('Transaction not found');
    }

    // Create a new transaction based on the original
    const newTransaction = {
      ...transaction[0],
      id: undefined, // Let the database generate a new ID
      recurrence: null, // Duplicates should not inherit recurrence
      date: new Date().getTime().toString(), // Use current time
      duplicateOf: transactionId, // Set reference to the original transaction
      recurrenceOf: null, // This is not a recurrence, it's a duplicate
    };

    // Insert the new transaction
    const result = await db.insert(transactionTable).values(newTransaction).$returningId();
    return result[0];
  } catch (error) {
    console.error("Error duplicating transaction:", error);
    throw new Error(
      `Failed to duplicate transaction: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export async function fetchTransactionsByRecurrenceOf(transactionId: number) {
  try {
    return db
      .select()
      .from(transactionTable)
      .where(eq(transactionTable.recurrenceOf, transactionId))
      .orderBy(desc(transactionTable.date));
  } catch (error) {
    console.error("Error fetching transactions by recurrenceOf:", error);
    throw new Error(
      `Failed to fetch transactions by recurrenceOf: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export async function fetchTransactionsByDuplicateOf(transactionId: number) {
  try {
    return db
      .select()
      .from(transactionTable)
      .where(eq(transactionTable.duplicateOf, transactionId))
      .orderBy(desc(transactionTable.date));
  } catch (error) {
    console.error("Error fetching transactions by duplicateOf:", error);
    throw new Error(
      `Failed to fetch transactions by duplicateOf: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export async function logCronRun(
  transactionId: number,
  status: 'completed' | 'failed',
  errorMessage?: string
) {
  try {
    return db.insert(cronRuns).values({
      transactionId,
      runtime: new Date().toISOString(),
      status,
      createdAt: new Date().toISOString(),
      errorMessage: errorMessage || null,
    });
  } catch (error) {
    console.error("Error logging cron run:", error);
    throw new Error(
      `Failed to log cron run: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
