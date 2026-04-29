import type { ReactNode } from 'react';
import { useAuth } from '../../store/AuthContext';
import { AuthTabs } from '../staff/AuthTabs';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  if (!user) {
    return <AuthTabs />;
  }

  return <>{children}</>;
}
