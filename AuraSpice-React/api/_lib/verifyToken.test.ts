import jwt from 'jsonwebtoken';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { fromMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
}));

vi.mock('./supabaseAdmin', () => ({
  supabaseAdmin: {
    from: fromMock,
  },
}));

import { verifyToken, getAuthTokenFromRequest, requireStaffSession } from "./verifyToken.js";
import type { VercelRequest, VercelResponse } from '@vercel/node';

function createSessionSelectResult(session: { staff_id: string; expires_at: string } | null) {
  return {
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(async () =>
          session
            ? { data: session, error: null }
            : { data: null, error: { message: 'not found' } },
        ),
      })),
    })),
    delete: vi.fn(() => ({
      eq: vi.fn(async () => ({ error: null })),
    })),
  };
}

function createAccountSelectResult(account: { id: string; name: string; role: string } | null) {
  return {
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(async () =>
          account
            ? { data: account, error: null }
            : { data: null, error: { message: 'not found' } },
        ),
      })),
    })),
  };
}

describe('verifyToken', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
    process.env.SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key';
    fromMock.mockReset();
  });

  it('returns the verified session for a valid token', async () => {
    const token = jwt.sign(
      { sub: 'admin', role: 'Admin', name: 'System Admin' },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' },
    );

    fromMock.mockImplementation((table: string) => {
      if (table === 'staff_sessions') {
        return createSessionSelectResult({
          staff_id: 'admin',
          expires_at: new Date(Date.now() + 60_000).toISOString(),
        });
      }

      if (table === 'staff_accounts') {
        return createAccountSelectResult({
          id: 'admin',
          name: 'System Admin',
          role: 'Admin',
        });
      }

      throw new Error(`Unexpected table: ${table}`);
    });

    const result = await verifyToken(token);

    expect(result).toEqual({
      account: {
        id: 'admin',
        name: 'System Admin',
        role: 'Admin',
      },
      expiresAt: expect.any(String),
      token,
    });
  });

  it('returns null for an expired token', async () => {
    const token = jwt.sign(
      { sub: 'admin', role: 'Admin', name: 'System Admin' },
      process.env.JWT_SECRET!,
      { expiresIn: -1 },
    );

    const result = await verifyToken(token);

    expect(result).toBeNull();
    expect(fromMock).not.toHaveBeenCalled();
  });

  it('returns null for a malformed payload', async () => {
    const token = jwt.sign({ foo: 'bar' }, process.env.JWT_SECRET!, { expiresIn: '1h' });

    fromMock.mockImplementation((table: string) => {
      if (table === 'staff_sessions') {
        return {
          delete: vi.fn(() => ({
            eq: vi.fn(async () => ({ error: null })),
          })),
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    });

    const result = await verifyToken(token);

    expect(result).toBeNull();
  });

  it('returns null when database session returns error', async () => {
    const token = jwt.sign(
      { sub: 'admin', role: 'Admin', name: 'System Admin' },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );

    fromMock.mockImplementation((table: string) => {
      if (table === 'staff_sessions') {
        return createSessionSelectResult(null);
      }
      throw new Error(`Unexpected table: ${table}`);
    });

    const result = await verifyToken(token);
    expect(result).toBeNull();
  });

  it('returns null and deletes session when session is expired in database', async () => {
    const token = jwt.sign(
      { sub: 'admin', role: 'Admin', name: 'System Admin' },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );

    const deleteEqMock = vi.fn(async () => ({ error: null }));
    fromMock.mockImplementation((table: string) => {
      if (table === 'staff_sessions') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(async () => ({
                data: {
                  staff_id: 'admin',
                  // Expired 10 minutes ago
                  expires_at: new Date(Date.now() - 600_000).toISOString(),
                },
                error: null,
              })),
            })),
          })),
          delete: vi.fn(() => ({
            eq: deleteEqMock,
          })),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    });

    const result = await verifyToken(token);
    expect(result).toBeNull();
    expect(deleteEqMock).toHaveBeenCalledWith('token', token);
  });

  it('returns null and deletes session when session sub does not match decoded token sub', async () => {
    const token = jwt.sign(
      { sub: 'admin', role: 'Admin', name: 'System Admin' },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );

    const deleteEqMock = vi.fn(async () => ({ error: null }));
    fromMock.mockImplementation((table: string) => {
      if (table === 'staff_sessions') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(async () => ({
                data: {
                  staff_id: 'different-user',
                  expires_at: new Date(Date.now() + 60_000).toISOString(),
                },
                error: null,
              })),
            })),
          })),
          delete: vi.fn(() => ({
            eq: deleteEqMock,
          })),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    });

    const result = await verifyToken(token);
    expect(result).toBeNull();
    expect(deleteEqMock).toHaveBeenCalledWith('token', token);
  });

  it('returns null and deletes session when account is not found in database', async () => {
    const token = jwt.sign(
      { sub: 'admin', role: 'Admin', name: 'System Admin' },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );

    const deleteEqMock = vi.fn(async () => ({ error: null }));
    fromMock.mockImplementation((table: string) => {
      if (table === 'staff_sessions') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(async () => ({
                data: {
                  staff_id: 'admin',
                  expires_at: new Date(Date.now() + 60_000).toISOString(),
                },
                error: null,
              })),
            })),
          })),
          delete: vi.fn(() => ({
            eq: deleteEqMock,
          })),
        };
      }

      if (table === 'staff_accounts') {
        return createAccountSelectResult(null);
      }

      throw new Error(`Unexpected table: ${table}`);
    });

    const result = await verifyToken(token);
    expect(result).toBeNull();
    expect(deleteEqMock).toHaveBeenCalledWith('token', token);
  });
});

describe('getAuthTokenFromRequest', () => {
  it('extracts token from Bearer authorization header', () => {
    const req = {
      headers: {
        authorization: 'Bearer my-bearer-token',
      },
    } as unknown as VercelRequest;

    expect(getAuthTokenFromRequest(req)).toBe('my-bearer-token');
  });

  it('extracts token from x-staff-token header', () => {
    const req = {
      headers: {
        'x-staff-token': 'my-legacy-token',
      },
    } as unknown as VercelRequest;

    expect(getAuthTokenFromRequest(req)).toBe('my-legacy-token');
  });

  it('extracts token from cookies', () => {
    const req = {
      headers: {
        cookie: 'aura_staff_session=my-cookie-token',
      },
    } as unknown as VercelRequest;

    expect(getAuthTokenFromRequest(req)).toBe('my-cookie-token');
  });

  it('returns null if no token is found', () => {
    const req = {
      headers: {},
    } as unknown as VercelRequest;

    expect(getAuthTokenFromRequest(req)).toBeNull();
  });
});

describe('requireStaffSession', () => {
  it('sends 401 response and clears cookie when session is invalid', async () => {
    const req = {
      headers: {
        authorization: 'Bearer invalid-token',
      },
    } as unknown as VercelRequest;

    const setHeaderMock = vi.fn();
    const statusJsonMock = vi.fn();
    const res = {
      setHeader: setHeaderMock,
      status: vi.fn(() => ({
        json: statusJsonMock,
      })),
    } as unknown as VercelResponse;

    const result = await requireStaffSession(req, res);
    expect(result).toBeNull();
    expect(setHeaderMock).toHaveBeenCalledWith('Set-Cookie', expect.stringContaining('aura_staff_session=;'));
    expect(res.status).toHaveBeenCalledWith(401);
    expect(statusJsonMock).toHaveBeenCalledWith({ success: false, message: 'Unauthorized' });
  });

  it('sends 403 response when role is not allowed', async () => {
    const token = jwt.sign(
      { sub: 'staff-1', role: 'Staff', name: 'John Doe' },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );

    fromMock.mockImplementation((table: string) => {
      if (table === 'staff_sessions') {
        return createSessionSelectResult({
          staff_id: 'staff-1',
          expires_at: new Date(Date.now() + 60_000).toISOString(),
        });
      }

      if (table === 'staff_accounts') {
        return createAccountSelectResult({
          id: 'staff-1',
          name: 'John Doe',
          role: 'Staff',
        });
      }

      throw new Error(`Unexpected table: ${table}`);
    });

    const req = {
      headers: {
        authorization: `Bearer ${token}`,
      },
    } as unknown as VercelRequest;

    const statusJsonMock = vi.fn();
    const res = {
      status: vi.fn(() => ({
        json: statusJsonMock,
      })),
    } as unknown as VercelResponse;

    // requireStaffSession only allowing Admin role
    const result = await requireStaffSession(req, res, ['Admin']);
    expect(result).toBeNull();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(statusJsonMock).toHaveBeenCalledWith({ success: false, message: 'Forbidden' });
  });

  it('returns session when user is authorized and has allowed role', async () => {
    const token = jwt.sign(
      { sub: 'admin-1', role: 'Admin', name: 'John Admin' },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );

    fromMock.mockImplementation((table: string) => {
      if (table === 'staff_sessions') {
        return createSessionSelectResult({
          staff_id: 'admin-1',
          expires_at: new Date(Date.now() + 60_000).toISOString(),
        });
      }

      if (table === 'staff_accounts') {
        return createAccountSelectResult({
          id: 'admin-1',
          name: 'John Admin',
          role: 'Admin',
        });
      }

      throw new Error(`Unexpected table: ${table}`);
    });

    const req = {
      headers: {
        authorization: `Bearer ${token}`,
      },
    } as unknown as VercelRequest;

    const res = {} as unknown as VercelResponse;

    const result = await requireStaffSession(req, res, ['Admin']);
    expect(result).not.toBeNull();
    expect(result?.account.role).toBe('Admin');
  });
});
