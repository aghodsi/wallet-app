import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { authClient } from "~/lib/auth-client";
import type { User, Session } from "~/lib/auth-client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshAuth = async () => {
    try {
      console.log("🔄 Refreshing auth state...");
      const sessionData = await authClient.getSession();
      console.log("📦 Session data received:", sessionData);
      
      if (sessionData.data) {
        console.log("✅ User authenticated:", sessionData.data.user);
        setSession(sessionData.data as Session);
        setUser(sessionData.data.user);
      } else {
        console.log("❌ No session data found");
        setSession(null);
        setUser(null);
      }
    } catch (error) {
      console.error("❌ Auth check failed:", error);
      setSession(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshAuth();

    // Listen for auth refresh events (triggered by 401 responses)
    const handleAuthRefresh = () => {
      console.log("🔄 Auth refresh requested by API client");
      refreshAuth();
    };

    window.addEventListener('auth-refresh-needed', handleAuthRefresh);
    
    return () => {
      window.removeEventListener('auth-refresh-needed', handleAuthRefresh);
    };
  }, []);

  const signOut = async () => {
    try {
      await authClient.signOut();
      setUser(null);
      setSession(null);
    } catch (error) {
      console.error("Sign out failed:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, isLoading, signOut, refreshAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
