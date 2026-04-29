import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { StaffAccount } from '../types';

// ============================================================
// PHASE 5 — Session stored in memory (NOT localStorage).
// localStorage is accessible by any JS on the page (XSS risk).
// sessionStorage clears on tab close — acceptable for staff portal.
// The token is sent as a custom header, NOT a cookie, to avoid CSRF.
// ============================================================

interface AuthContextType {
  user: StaffAccount | null;
  token: string | null;
  login: (account: StaffAccount, token: string) => void;
  logout: () => void;
  loading: boolean;
  /** Convenience wrapper: fetch with X-Staff-Token header pre-attached */
  authFetch: (input: RequestInfo, init?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Key for session persistence — cleared on tab close automatically
const SESSION_KEY = 'auraStaffSession';
const TOKEN_KEY   = 'auraStaffToken';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,    setUser]    = useState<StaffAccount | null>(null);
  const [token,   setToken]   = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore session from sessionStorage on page reload
    try {
      const storedSession = sessionStorage.getItem(SESSION_KEY);
      const storedToken   = sessionStorage.getItem(TOKEN_KEY);
      if (storedSession && storedToken) {
        setUser(JSON.parse(storedSession));
        setToken(storedToken);
      }
    } catch {
      sessionStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem(TOKEN_KEY);
    }
    setLoading(false);
  }, []);

  const login = useCallback((account: StaffAccount, newToken: string) => {
    setUser(account);
    setToken(newToken);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(account));
    sessionStorage.setItem(TOKEN_KEY, newToken);
  }, []);

  const logout = useCallback(async () => {
    // Tell server to invalidate the token
    if (token) {
      try {
        await fetch('/api/staff/logout', {
          method: 'POST',
          headers: { 'X-Staff-Token': token },
        });
      } catch {
        // Silently ignore — local session will be cleared regardless
      }
    }
    setUser(null);
    setToken(null);
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
  }, [token]);

  /** Attaches the auth token header to every authenticated fetch call */
  const authFetch = useCallback((input: RequestInfo, init: RequestInit = {}) => {
    const headers = new Headers(init.headers);
    if (token) headers.set('X-Staff-Token', token);
    return fetch(input, { ...init, headers });
  }, [token]);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading, authFetch }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
