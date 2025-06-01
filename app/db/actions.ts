import "dotenv/config";
import { drizzle } from "drizzle-orm/mysql2";
import {
  currencyTable,
  institutionTable,
  portfolioTable,
  transactionTable,
} from "./schema";
import mysql from "mysql2/promise";
import { eq, inArray } from "drizzle-orm";
import type { InstitutionType } from "~/datatypes/institution";
import type { PortfolioType } from "~/datatypes/portfolio";
import type { TransactionType } from "~/datatypes/transaction";

const connection = await mysql.createConnection({
  host: process.env.DATABASE_HOST!,
  port: process.env.DATABASE_PORT ? parseInt(process.env.DATABASE_PORT) : 3306,
  user: process.env.DATABASE_USER!,
  password: process.env.DATABASE_PASSWORD!,
  database: process.env.DATABASE_NAME!,
  ssl: {},
});
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
  return db.select().from(currencyTable); // Adjust the table name as per your schema
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

export async function fetchTransactionById(transactionId: number) {
  return db
    .select()
    .from(transactionTable)
    .where(eq(transactionTable.id, transactionId))
    .limit(1);
}

export async function createPortfolio(portfolio: PortfolioType) {
  let institutionId = portfolio.institution.id;
  if (portfolio.institution.isNew) {
    const created = await createInstitution(portfolio.institution);
    if (!created || !Array.isArray(created) || created.length === 0) {
      throw new Error("Failed to create new institution");
    }
    institutionId = created[0].id;
  }
  return db.insert(portfolioTable).values({
    name: portfolio.name,
    currency: portfolio.currency.id,
    symbol: portfolio.symbol,
    type: portfolio.type || "Investment",
    institutionId: institutionId,
    tags: portfolio.tags || "",
  });
}

export async function createInstitution(institution: InstitutionType) {
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
}

export async function createTransaction(transaction: TransactionType) {
  console.log("Creating transaction (in DB Actions):", transaction);
  let [hasHouskeeping, houskeepingId] = [
    (transaction.type === "Buy" ||
      transaction.type === "Sell" ||
      transaction.type === "Dividend") &&
      transaction.targetPortfolioId &&
      transaction.targetPortfolioId !== transaction.portfolioId,
    0,
  ];
  if (hasHouskeeping) {
    console.log(
      "Creating housekeeping transaction for transfer between portfolios"
    );
    // Handle transfer between portfolios
    const housekeepingResult = await db
      .insert(transactionTable)
      .values({
        portfolioId: transaction.targetPortfolioId!,
        date: transaction.date,
        type: transaction.type === "Buy" ? "Withdraw" : "Deposit", // Adjust type for transfer
        asset: "Cash",
        quantity: transaction.quantity,
        price: transaction.price,
        commision: transaction.commision,
        tax: transaction.tax,
        notes: `Tansfer to other portfolio for purchase of asset ${transaction.asset}`,
        isHouskeeping: 1, // Mark as housekeeping transaction
      })
      .$returningId();
    houskeepingId =
      Array.isArray(housekeepingResult) && housekeepingResult.length > 0
        ? housekeepingResult[0].id
        : 0;
    console.log("Housekeeping transaction created with ID:", houskeepingId);
  }
  return [
    db
      .insert(transactionTable)
      .values({
        portfolioId: transaction.portfolioId,
        date: transaction.date,
        type: transaction.type,
        asset: transaction.asset,
        quantity: transaction.quantity,
        price: transaction.price,
        commision: transaction.commision,
        recurrence: transaction.recurrence || "",
        tax: transaction.tax,
        tags: transaction.tags || "",
        notes: transaction.notes || "",
        isHouskeeping: 0, // Default to false
      }),
    hasHouskeeping,
    houskeepingId,
  ];
}
