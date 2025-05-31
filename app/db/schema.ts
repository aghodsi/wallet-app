import { int, real, mysqlTable, varchar } from 'drizzle-orm/mysql-core';


export const portfolioTable = mysqlTable('portfolio', {
    id: int().autoincrement().primaryKey(),
    name: varchar({ length: 255 }).notNull(),
    currency: int().references(() => currencyTable.id, { onDelete: 'cascade'}).notNull(),
    symbol: varchar({ length: 255 }),
    type: varchar({ length: 50, enum: ["Current", "Saving", "Investment"]}).default("Investment").notNull(),
    institutionId : int('institution_id').references(() => institutionTable.id, { onDelete: 'cascade' }).notNull(),
    cashBalance: real('cash_balance').default(0),
    tags: varchar({ length: 500 }).default(''),
});

export const transactionTable = mysqlTable('transaction', {
    id: int().autoincrement().primaryKey(),
    portfolioId: int('portfolio_id')
        .notNull()
        .references(() => portfolioTable.id, { onDelete: 'cascade' }),
    date: varchar({ length: 100 }).notNull(),
    type: varchar({ length: 50, enum:["Buy", "Sell", "Dividend", "Deposit", "Withdraw"]}).notNull(), // e.g., 'buy', 'sell', 'dividend'
    asset: varchar({ length: 255 }).notNull(),
    quantity: int('quantity').notNull(),
    price: real('price').notNull(),
    commision: real('commission').notNull(),
    recurrence: varchar({ length: 50 } ), // cron expression for recurring transactions
    tax: real('tax').notNull(),
    tags: varchar({ length: 500 }).default(''),
    notes: varchar({ length: 500 }).default(''),
    isHouskeeping: int('is_houskeeping').notNull().default(0), // 0 for false, 1 for true
});

export const institutionTable = mysqlTable('institution', {
    id: int().autoincrement().primaryKey(),
    name: varchar({ length: 255 }).notNull(),
    isDefault: int('is_default').notNull().default(0),
    website: varchar({ length: 255 }),
    apiKey: varchar({ length: 255 }),
    apiSecret: varchar({ length: 255 }),
    apiUrl: varchar({ length: 255 }),
    lastUpdated: varchar({ length: 50 })
});

export const currencyTable = mysqlTable('currency', {
    id: int().autoincrement().primaryKey(),
    code: varchar({ length: 10 }).notNull(),
    name: varchar({ length: 255 }).notNull(),
    symbol: varchar({ length: 10 }).notNull(),
    exchangeRate: real('exchange_rate'),
    isDefault: int('is_default').notNull().default(0),
    lastUpdated: varchar({ length: 50 }).notNull()
});