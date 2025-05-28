import { int, real, mysqlTable, serial, varchar } from 'drizzle-orm/mysql-core';


export const portfolioTable = mysqlTable('portfolio', {
    id: int().autoincrement().primaryKey(),
    name: varchar({ length: 255 }).notNull(),
    currency: varchar({ length: 50 }).notNull(),
    symbol: varchar({ length: 255 }),
    first_category: int('first_category').references(() => categoryTable.id),
    second_category: int('second_category').references(() => categoryTable.id),
});

export const categoryTable = mysqlTable('category', {
    id: int().autoincrement().primaryKey(),
    name: varchar({ length: 255 }).notNull(),
    description: varchar({ length: 500 }),
});

export const transactionTable = mysqlTable('transaction', {
    id: int().autoincrement().primaryKey(),
    portfolioId: int('portfolio_id')
        .notNull()
        .references(() => portfolioTable.id, { onDelete: 'cascade' }),
    date: varchar({ length: 50 }).notNull(),
    broker: int('broker_id')
        .notNull()
        .references(() => brokerTable.id, { onDelete: 'cascade' }),
    type: varchar({ length: 50 }).notNull(), // e.g., 'buy', 'sell', 'dividend'
    asset: varchar({ length: 255 }).notNull(),
    quantity: int('quantity').notNull(),
    price: real('price').notNull(),
    commision: real('commission').notNull(),
    tax: real('tax').notNull()
});

export const brokerTable = mysqlTable('broker', {
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
    exchangeRate: real('exchange_rate').notNull(),
    lastUpdated: varchar({ length: 50 }).notNull()
});