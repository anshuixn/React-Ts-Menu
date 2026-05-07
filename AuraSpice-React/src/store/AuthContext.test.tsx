import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider } from './AuthContext';
import { useAuth } from './useAuth';

function AuthProbe() {
  const { authFetch, login, logout, token, user, loading } = useAuth();

  return (
    <div>
      <span data-testid="user">{user?.name ?? 'anonymous'}</span>
      <span data-testid="token">{token ?? 'none'}</span>
      <span data-testid="loading">{String(loading)}</span>
      <button
        type="button"
        onClick={() =>
          login(
            { id: 'chef01', name: 'Chef One', role: 'Staff' },
            'token-123',
          )
        }
      >
        Login
      </button>
      <button type="button" onClick={() => void logout()}>
        Logout
      </button>
      <button type="button" onClick={() => void authFetch('/api/test', { method: 'POST' })}>
        Auth Fetch
      </button>
    </div>
  );
}

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('starts in loading state and resolves to anonymous when /api/staff/me returns 401', async () => {
    const fetchMock = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>(
      async (input) => {
        if (typeof input === 'string' && input.includes('/api/staff/me')) {
          return new Response(JSON.stringify({ success: false }), { status: 401 });
        }
        return new Response(null, { status: 200 });
      },
    );
    vi.stubGlobal('fetch', fetchMock);

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));

    expect(screen.getByTestId('user')).toHaveTextContent('anonymous');
    expect(screen.getByTestId('token')).toHaveTextContent('none');
    const meCall = fetchMock.mock.calls.find(
      (call) => typeof call[0] === 'string' && call[0].includes('/api/staff/me'),
    );
    expect(meCall?.[1]?.credentials).toBe('include');
  });

  it('restores session from /api/staff/me on mount', async () => {
    const fetchMock = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>(
      async (input) => {
        if (typeof input === 'string' && input.includes('/api/staff/me')) {
          return new Response(
            JSON.stringify({
              success: true,
              account: { id: 'admin', name: 'System Admin', role: 'Admin' },
              token: 'server-token',
            }),
            { status: 200 },
          );
        }
        return new Response(null, { status: 200 });
      },
    );
    vi.stubGlobal('fetch', fetchMock);

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));

    expect(screen.getByTestId('user')).toHaveTextContent('System Admin');
    expect(screen.getByTestId('token')).toHaveTextContent('server-token');
  });

  it('attaches the bearer token to authenticated fetch requests', async () => {
    const fetchMock = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>(
      async (input) => {
        if (typeof input === 'string' && input.includes('/api/staff/me')) {
          return new Response(JSON.stringify({ success: false }), { status: 401 });
        }
        return new Response(null, { status: 200 });
      },
    );
    vi.stubGlobal('fetch', fetchMock);

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));

    fireEvent.click(screen.getByText('Login'));
    fireEvent.click(screen.getByText('Auth Fetch'));

    await waitFor(() => {
      // First call is /api/staff/me on mount, second is the auth fetch
      const authFetchCall = fetchMock.mock.calls.find(
        (call) => typeof call[0] === 'string' && call[0].includes('/api/test'),
      );
      expect(authFetchCall).toBeDefined();
    });

    const authFetchCall = fetchMock.mock.calls.find(
      (call) => typeof call[0] === 'string' && call[0].includes('/api/test'),
    );
    const init = authFetchCall?.[1];
    const headers = new Headers(init?.headers);

    expect(headers.get('Authorization')).toBe('Bearer token-123');
  });

  it('clears the local session on logout', async () => {
    const fetchMock = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>(
      async (input) => {
        if (typeof input === 'string' && input.includes('/api/staff/me')) {
          return new Response(JSON.stringify({ success: false }), { status: 401 });
        }
        return new Response(null, { status: 200 });
      },
    );
    vi.stubGlobal('fetch', fetchMock);

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));

    fireEvent.click(screen.getByText('Login'));
    expect(screen.getByTestId('user')).toHaveTextContent('Chef One');

    fireEvent.click(screen.getByText('Logout'));

    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('anonymous'));
    expect(screen.getByTestId('token')).toHaveTextContent('none');
  });
});
