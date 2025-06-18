import { create } from 'domain';
import { int, double, mysqlTable, varchar, json } from 'drizzle-orm/mysql-core';


export const portfolioTable = mysqlTable('portfolio', {
    id: int().autoincrement().primaryKey(),
    name: varchar({ length: 255 }).notNull(),
    currency: int().references(() => currencyTable.id, { onDelete: 'cascade'}).notNull(),
    symbol: varchar({ length: 255 }),
    type: varchar({ length: 50, enum: ["Current", "Saving", "Investment"]}).default("Investment").notNull(),
    institutionId : int('institution_id').references(() => institutionTable.id, { onDelete: 'cascade' }).notNull(),
    cashBalance: double('cash_balance').default(0),
    tags: varchar({ length: 500 }).default(''),
    createdAt: varchar({ length: 200 }).notNull(),
});

export const transactionTable = mysqlTable('transaction', {
    id: int().autoincrement().primaryKey(),
    portfolioId: int('portfolio_id')
        .notNull()
        .references(() => portfolioTable.id, { onDelete: 'cascade' }),
    date: varchar({ length: 200 }).notNull(),
    type: varchar({ length: 50, enum:["Buy", "Sell", "Dividend", "Deposit", "Withdraw"]}).notNull(), // e.g., 'buy', 'sell', 'dividend'
    asset: varchar({ length: 255 }).notNull(),
    quantity: double('quantity').notNull(),
    price: double('price').notNull(),
    commision: double('commission').notNull(),
    recurrence: varchar({ length: 50 } ), // cron expression for recurring transactions
    tax: double('tax').notNull(),
    tags: varchar({ length: 500 }).default(''),
    notes: varchar({ length: 500 }).default(''),
    isHouskeeping: int('is_houskeeping').notNull().default(0), // 0 for false, 1 for true
    duplicateOf: int('duplicate_of'), // reference to original transaction when duplicated
    recurrenceOf: int('recurrence_of'), // reference to original transaction when created by cron
});

export const institutionTable = mysqlTable('institution', {
    id: int().autoincrement().primaryKey(),
    name: varchar({ length: 255 }).notNull(),
    isDefault: int('is_default').notNull().default(0),
    website: varchar({ length: 255 }),
    apiKey: varchar({ length: 255 }),
    apiSecret: varchar({ length: 255 }),
    apiUrl: varchar({ length: 255 }),
    lastUpdated: varchar({ length: 200 })
});

export const currencyTable = mysqlTable('currency', {
    id: int().autoincrement().primaryKey(),
    code: varchar({ length: 10 }).notNull(),
    name: varchar({ length: 255 }).notNull(),
    symbol: varchar({ length: 10 }).notNull(),
    exchangeRate: double('exchange_rate'),
    isDefault: int('is_default').notNull().default(0),
    lastUpdated: varchar({ length: 200 }).notNull()
});

export const assetTable = mysqlTable('asset', {
    id: int().autoincrement().primaryKey(),
    symbol: varchar('symbol', { length: 20 }).notNull(),
    currency: varchar({ length: 10 }).notNull(),
    exchangeName: varchar({ length: 50 }),
    fullExchangeName: varchar({ length: 100 }),
    instrumentType: varchar({ length: 20 }),
    timezone: varchar({ length: 10 }),
    exchangeTimezoneName: varchar({ length: 50 }),
    longName: varchar({ length: 255 }),
    shortName: varchar({ length: 255 }),
    quotes: json('quotes').$type<{
        date: string;
        high?: number;
        volume?: number;
        open?: number;
        low?: number;
        close?: number;
        adjclose?: number;
    }[]>(),
    events: json('events').$type<{
        dividends: {
            amount: number;
            date: string; // epoch time in milliseconds
        }[],
        splits: {
            date: string; // epoch time in milliseconds
            numerator: number;
            denominator: number;
            splitRatio: string;
        }[];
    }>(),
    isFromApi: int('is_from_api').notNull().default(0), // 0 for false, 1 for true
    lastUpdated: varchar({ length: 200 }).notNull()
});

// Add cron runs table
export const cronRuns = mysqlTable('cron_runs', {
  id: int('id').autoincrement().primaryKey(),
  transactionId: int('transaction_id').notNull().references(() => transactionTable.id),
  runtime: varchar({length:100}).notNull(),
  status: varchar({length:100}).notNull().default('completed'), // 'completed', 'failed', 'pending'
  createdAt: varchar('created_at', {length:100}).notNull(),
  errorMessage: varchar('error_message', {length:100}),
});
