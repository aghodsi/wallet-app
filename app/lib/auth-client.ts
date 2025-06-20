import { createAuthClient } from "better-auth/react";
import { usernameClient } from "better-auth/client/plugins"
import type { Session, User } from "./auth";

export const authClient = createAuthClient({
  baseURL: typeof window !== "undefined" ? window.location.origin : "http://localhost:5173",
  plugins: [ 
        usernameClient() 
    ] 
});

export type { Session, User };
