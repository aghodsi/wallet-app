import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';
import { config } from "dotenv";

config({ path: ".env.local" });


export default defineConfig({
  out: './drizzle',
  schema: './app/db/schema.ts',
  dialect: 'mysql',
  dbCredentials: {
    host: process.env.DATABASE_HOST!,
    port: process.env.DATABASE_PORT ? parseInt(process.env.DATABASE_PORT) : 3306,
    user: process.env.DATABASE_USER!,
    password: process.env.DATABASE_PASSWORD!,
    database: process.env.DATABASE_NAME!,
    ssl: {}
  }
});