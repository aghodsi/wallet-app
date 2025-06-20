import { betterAuth } from "better-auth";
import { username } from "better-auth/plugins"
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "~/db/db";
import { userTable, sessionTable, accountTable, verificationTable } from "~/db/schema";

const restrictedUsernames = ["admin", "root", "superuser", "administrator", "test", "guest", "anonymous", "support", "info", "contact", "webmaster", "sysadmin", "moderator", "owner", "developer", "manager", "staff", "team", "user", "member", "client", "customer", "service", "sales", "marketing", "finance", "hr", "it", "ops", "legal", "compliance", "security", "support", "helpdesk", "serviceaccount", "automation", "bot", "script", "cron", "scheduler", "taskrunner", "background", "worker", "process", "daemon", "serviceuser", "systemuser", "applicationuser", "wallet", "apiuser", "integration", "connector", "sync", "syncuser", "syncaccount", "syncservice", "syncbot", "syncdaemon", "syncworker", "syncprocess", "syncscript", "synccron", "synctaskrunner", "syncscheduler"];

export const auth = betterAuth({
  user:{
    additionalFields: {
      defaultCurrency: {
        type: "number",
        defaultValue: 1,
        input: true
      }

    }
  },
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
    autoSignIn: true,
  },
  plugins: [
    username({
      usernameValidator: (username) => {
        if (restrictedUsernames.indexOf(username) !== -1) {
          return false
        }
        return true;
      }
    })
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 24 hours
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    },
  },
  baseURL: process.env.NODE_ENV === "production" ? "https://your-domain.com" : "http://localhost:5173",
  trustedOrigins: ["http://localhost:5173", "http://localhost:3000"],
  rateLimit: {
    enabled: true,
    window: 60, // 1 minute
    max: 100, // 100 requests per minute
  },
  advanced: {
    crossSubDomainCookies: {
      enabled: false,
    },
    useSecureCookies: process.env.NODE_ENV === "production",
  },
  logger: {
    level: process.env.NODE_ENV === "production" ? "error" : "debug",
    disabled: false,
  },
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
