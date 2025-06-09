import "dotenv/config";
import { drizzle } from "drizzle-orm/mysql2";
import {
  assetTable,
  currencyTable,
  institutionTable,
  portfolioTable,
  transactionTable,
} from "./schema";
import mysql from "mysql2/promise";
import { eq, inArray, desc } from "drizzle-orm";
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
          createdAt: new Date().toString(),
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
        lastUpdated: new Date().toISOString(),
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
  return db.select().from(transactionTable);
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
    lastUpdated: new Date().toString(),
  }).$returningId();
}

export async function createTransaction(
  transaction: TransactionType
): Promise<CreateTransactionResult> {
  try {
    console.log("Creating transaction (in DB Actions):", transaction);

    return await db.transaction(async (tx) => {
      // Create main transaction
      const mainTransaction = await tx
        .insert(transactionTable)
        .values({
          portfolioId: transaction.portfolioId,
          date: transaction.date,
          type: transaction.type,
          asset: transaction.asset.symbol,
          quantity: transaction.quantity,
          price: transaction.price,
          commision: transaction.commision,
          recurrence: transaction.recurrence || "",
          tax: transaction.tax,
          tags: transaction.tags || "",
          notes: transaction.notes || "",
          isHouskeeping: REGULAR_TRANSACTION,
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
  } catch (error) {
    console.error("Error creating transaction:", error);
    throw new Error(
      `Failed to create transaction: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
