import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { StaffAccount } from '../types';

interface AuthContextType {
  user: StaffAccount | null;
  login: (account: StaffAccount) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<StaffAccount | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = sessionStorage.getItem('auraStaffSession');
    if (session) {
      try {
        setUser(JSON.parse(session));
      } catch (e) {
        sessionStorage.removeItem('auraStaffSession');
      }
    }
    setLoading(false);
  }, []);

  const login = (account: StaffAccount) => {
    setUser(account);
    sessionStorage.setItem('auraStaffSession', JSON.stringify(account));
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('auraStaffSession');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
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
