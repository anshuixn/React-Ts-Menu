import { createContext } from 'react';
import type { StaffAccount } from '../types';

export interface AuthContextType {
  user: StaffAccount | null;
  token: string | null;
  login: (account: StaffAccount, token: string) => void;
  logout: () => Promise<void>;
  loading: boolean;
  authFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
