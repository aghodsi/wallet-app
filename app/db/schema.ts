import { int, double, mysqlTable, varchar, json, timestamp, boolean } from 'drizzle-orm/mysql-core';


export const portfolioTable = mysqlTable('portfolio', {
    id: int().autoincrement().primaryKey(),
    name: varchar({ length: 255 }).notNull().default('New Portfolio'),
    currency: int().references(() => currencyTable.id, { onDelete: 'cascade'}).notNull(),
    symbol: varchar({ length: 255 }),
    type: varchar({ length: 50, enum: ["Current", "Saving", "Investment"]}).default("Investment").notNull(),
    institutionId : int('institution_id').references(() => institutionTable.id, { onDelete: 'cascade' }).notNull(),
    userId: varchar('user_id', { length: 255 }).notNull().references(() => userTable.id, { onDelete: 'cascade' }),
    cashBalance: double('cash_balance').default(0),
    tags: varchar({ length: 500 }).default(''),
    createdAt: varchar({ length: 200 }).notNull().default(''),
});

export const transactionTable = mysqlTable('transaction', {
    id: int().autoincrement().primaryKey(),
    portfolioId: int('portfolio_id')
        .notNull()
        .references(() => portfolioTable.id, { onDelete: 'cascade' }),
    date: varchar({ length: 200 }).notNull().default(''),
    type: varchar({ length: 50, enum:["Buy", "Sell", "Dividend", "Deposit", "Withdraw"]}).notNull().default('Buy'), // e.g., 'buy', 'sell', 'dividend'
    asset: varchar({ length: 255 }).notNull().default('CASH'),
    quantity: double('quantity').notNull().default(0),
    price: double('price').notNull().default(0),
    commision: double('commission').notNull().default(0),
    currency: int().references(() => currencyTable.id, { onDelete: 'cascade'}), // Transaction currency, defaults to portfolio currency if null
    recurrence: varchar({ length: 50 } ), // cron expression for recurring transactions
    tax: double('tax').notNull().default(0),
    tags: varchar({ length: 500 }).default(''),
    notes: varchar({ length: 500 }).default(''),
    isHouskeeping: int('is_houskeeping').notNull().default(0), // 0 for false, 1 for true
    duplicateOf: int('duplicate_of'), // reference to original transaction when duplicated
    recurrenceOf: int('recurrence_of'), // reference to original transaction when created by cron
});

export const institutionTable = mysqlTable('institution', {
    id: int().autoincrement().primaryKey(),
    name: varchar({ length: 255 }).notNull().default('Default Institution'),
    isDefault: int('is_default').notNull().default(0),
    website: varchar({ length: 255 }),
    apiKey: varchar({ length: 255 }),
    apiSecret: varchar({ length: 255 }),
    apiUrl: varchar({ length: 255 }),
    lastUpdated: varchar({ length: 200 })
});

export const currencyTable = mysqlTable('currency', {
    id: int().autoincrement().primaryKey(),
    code: varchar({ length: 10 }).notNull().default('USD'),
    name: varchar({ length: 255 }).notNull().default('US Dollar'),
    symbol: varchar({ length: 10 }).notNull().default('$'),
    exchangeRate: double('exchange_rate'),
    isDefault: int('is_default').notNull().default(0),
    lastUpdated: varchar({ length: 200 }).notNull().default('')
});

export const assetTable = mysqlTable('asset', {
    id: int().autoincrement().primaryKey(),
    symbol: varchar('symbol', { length: 20 }).notNull().default('UNKNOWN'),
    currency: varchar({ length: 10 }).notNull().default('USD'),
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
    lastUpdated: varchar({ length: 200 }).notNull().default('')
});

// Add cron runs table
export const cronRuns = mysqlTable('cron_runs', {
  id: int('id').autoincrement().primaryKey(),
  transactionId: int('transaction_id').notNull().references(() => transactionTable.id),
  runtime: varchar({length:100}).notNull().default(''),
  status: varchar({length:100}).notNull().default('completed'), // 'completed', 'failed', 'pending'
  createdAt: varchar('created_at', {length:100}).notNull().default(''),
  errorMessage: varchar('error_message', {length:100}),
});

// Authentication tables for better-auth
export const userTable = mysqlTable('user', {
  id: varchar({ length: 255 }).primaryKey(),
  name: varchar({ length: 255 }).notNull().default('Anonymous User'),
  email: varchar({ length: 255 }).notNull().unique().default('user@wallet.app'),
  emailVerified: boolean('email_verified').notNull().default(false),
  username: varchar({ length: 50 }).notNull().unique().default('anonymous_user'),
  displayUsername: varchar({ length: 255 }).notNull().default('Anonymous'),
  image: varchar({ length: 255 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
  defaultCurrency: int('default_currency').references(() => currencyTable.id, { onDelete: 'set null' }).default(1), // Default to USD
});

export const sessionTable = mysqlTable('session', {
  id: varchar({ length: 255 }).primaryKey(),
  token: varchar({ length: 255 }).notNull().unique().default(''),
  expiresAt: timestamp('expires_at').notNull(),
  ipAddress: varchar('ip_address', { length: 255 }),
  userAgent: varchar('user_agent', { length: 255 }),
  userId: varchar('user_id', { length: 255 }).notNull().references(() => userTable.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
});

export const accountTable = mysqlTable('account', {
  id: varchar({ length: 255 }).primaryKey(),
  accountId: varchar('account_id', { length: 255 }).notNull().default(''),
  providerId: varchar('provider_id', { length: 255 }).notNull().default('email'),
  userId: varchar('user_id', { length: 255 }).notNull().references(() => userTable.id, { onDelete: 'cascade' }),
  accessToken: varchar('access_token', { length: 255 }),
  refreshToken: varchar('refresh_token', { length: 255 }),
  idToken: varchar('id_token', { length: 255 }),
  expiresAt: timestamp('expires_at'),
  password: varchar({ length: 255 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
});

export const verificationTable = mysqlTable('verification', {
  id: varchar({ length: 255 }).primaryKey(),
  identifier: varchar({ length: 255 }).notNull().default(''),
  value: varchar({ length: 255 }).notNull().default(''),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
});
