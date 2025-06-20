import { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import type { ReactNode } from "react";
import { authClient } from "~/lib/auth-client";
import type { User, Session } from "~/lib/auth-client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  justLoggedIn: boolean;
  signOut: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  clearJustLoggedIn: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [justLoggedIn, setJustLoggedIn] = useState(false);
  const isMountedRef = useRef(true);

  const refreshAuth = useCallback(async () => {
    try {
      console.log("🔄 Refreshing auth state...");
      const sessionData = await authClient.getSession();
      console.log("📦 Session data received:", sessionData);
      
      // Prevent state updates if component is unmounted
      if (!isMountedRef.current) return;
      
      if (sessionData.data) {
        console.log("✅ User authenticated:", sessionData.data.user);
        const wasLoggedOut = !user;
        setSession(sessionData.data as Session);
        setUser(sessionData.data.user);
        if (wasLoggedOut && !isLoading) {
          setJustLoggedIn(true);
        }
      } else {
        console.log("❌ No session data found");
        setSession(null);
        setUser(null);
        setJustLoggedIn(false);
      }
    } catch (error) {
      console.error("❌ Auth check failed:", error);
      if (!isMountedRef.current) return;
      setSession(null);
      setUser(null);
      setJustLoggedIn(false);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [user, isLoading]);

  useEffect(() => {
    refreshAuth();

    // Create a ref to the refresh function for event handler
    const handleAuthRefresh = () => {
      console.log("🔄 Auth refresh requested by API client");
      refreshAuth();
    };

    window.addEventListener('auth-refresh-needed', handleAuthRefresh);
    
    return () => {
      isMountedRef.current = false;
      window.removeEventListener('auth-refresh-needed', handleAuthRefresh);
    };
  }, [refreshAuth]);

  const signOut = useCallback(async () => {
    try {
      await authClient.signOut();
      if (!isMountedRef.current) return;
      setUser(null);
      setSession(null);
      setJustLoggedIn(false);
    } catch (error) {
      console.error("Sign out failed:", error);
    }
  }, []);

  const clearJustLoggedIn = useCallback(() => {
    setJustLoggedIn(false);
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, isLoading, justLoggedIn, signOut, refreshAuth, clearJustLoggedIn }}>
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
