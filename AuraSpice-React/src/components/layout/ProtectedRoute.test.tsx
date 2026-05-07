import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProtectedRoute } from './ProtectedRoute';
import { useAuth } from '../../store/useAuth';

vi.mock('../../store/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../staff/AuthTabs', () => ({
  AuthTabs: () => <div>Auth Tabs Placeholder</div>,
}));

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReset();
  });

  it('renders the auth screen for unauthenticated users', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      token: null,
      login: vi.fn(),
      logout: vi.fn(),
      loading: false,
      authFetch: vi.fn(),
    });

    render(
      <ProtectedRoute>
        <div>Secret Content</div>
      </ProtectedRoute>,
    );

    expect(screen.getByText('Auth Tabs Placeholder')).toBeInTheDocument();
    expect(screen.queryByText('Secret Content')).not.toBeInTheDocument();
  });

  it('renders protected content for authenticated users', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 'admin', name: 'System Admin', role: 'Admin' },
      token: 'token',
      login: vi.fn(),
      logout: vi.fn(),
      loading: false,
      authFetch: vi.fn(),
    });

    render(
      <ProtectedRoute>
        <div>Secret Content</div>
      </ProtectedRoute>,
    );

    expect(screen.getByText('Secret Content')).toBeInTheDocument();
  });
});
