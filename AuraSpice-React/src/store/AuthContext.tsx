import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { AuthContext } from './auth-context';
import type { StaffAccount } from '../types';

interface MeResponse {
  success: boolean;
  account?: StaffAccount;
  token?: string;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<StaffAccount | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // On mount, verify session via HttpOnly cookie
  useEffect(() => {
    let cancelled = false;

    const verifySession = async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      try {
        const response = await fetch('/api/staff/me', {
          credentials: 'include',
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
          if (!cancelled) {
            setUser(null);
            setToken(null);
          }
          return;
        }

        const payload = (await response.json()) as MeResponse;

        if (!cancelled && payload.success && payload.account) {
          setUser(payload.account);
          setToken(payload.token ?? null);
        }
      } catch {
        // Network error — treat as not authenticated
        if (!cancelled) {
          setUser(null);
          setToken(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void verifySession();

    return () => {
      cancelled = true;
    };
  }, []);

  const clearSession = useCallback(() => {
    setUser(null);
    setToken(null);
  }, []);

  const login = useCallback((account: StaffAccount, newToken: string) => {
    setUser(account);
    setToken(newToken);
  }, []);

  const logout = useCallback(async () => {
    try {
      const headers = new Headers();

      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }

      await fetch('/api/staff/logout', {
        method: 'POST',
        credentials: 'include',
        headers,
      });
    } catch {
      // Best-effort server logout; local session is still cleared below.
    }

    clearSession();
  }, [clearSession, token]);

  const authFetch = useCallback(async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const headers = new Headers(init.headers);

    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(input, {
      ...init,
      credentials: 'include',
      headers,
    });

    if (response.status === 401) {
      clearSession();
    }

    return response;
  }, [clearSession, token]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        loading,
        authFetch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
