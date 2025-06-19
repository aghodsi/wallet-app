import { createAuthClient } from "better-auth/react";
import type { Session, User } from "./auth";

export const authClient = createAuthClient({
  baseURL: typeof window !== "undefined" ? window.location.origin : "http://localhost:5173",
});

export type { Session, User };
