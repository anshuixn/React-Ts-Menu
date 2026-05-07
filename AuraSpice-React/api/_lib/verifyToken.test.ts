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

import { verifyToken } from "./verifyToken.js";

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
});
