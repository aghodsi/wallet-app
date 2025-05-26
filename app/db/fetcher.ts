import 'dotenv/config';
import { drizzle } from 'drizzle-orm/mysql2';
import { portfolioTable } from './schema';


const db = drizzle(process.env.DATABASE_URL!);

export async function fetchPortfolios() {
    return db.select().from(portfolioTable)
}