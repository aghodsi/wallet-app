import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "~/db/db";
import { userTable, sessionTable, accountTable, verificationTable } from "~/db/schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "mysql",
    schema: {
      user: userTable,
      session: sessionTable,
      account: accountTable,
      verification: verificationTable,
    },
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 24 hours
  },
  baseURL: process.env.NODE_ENV === "production" ? "https://your-domain.com" : "http://localhost:5173",
  trustedOrigins: ["http://localhost:5173", "http://localhost:3000"],
  logger: {
    level: "debug",
    disabled: false,
  },
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
