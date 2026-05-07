import { afterEach, describe, expect, it } from 'vitest';
import { getAllowedOrigins, getServerEnv, isProductionEnvironment, requireEnv } from './env';

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

describe('env helpers', () => {
  it('returns configured origins alongside local defaults', () => {
    process.env.ALLOWED_ORIGINS = 'https://auraspice.app, https://staging.auraspice.app';
    process.env.VERCEL_URL = 'auraspice-preview.vercel.app';

    const origins = getAllowedOrigins();

    expect(origins).toContain('https://auraspice.app');
    expect(origins).toContain('https://staging.auraspice.app');
    expect(origins).toContain('https://auraspice-preview.vercel.app');
    expect(origins).toContain('http://localhost:5173');
  });

  it('throws when a required environment variable is missing', () => {
    delete process.env.JWT_SECRET;

    expect(() => requireEnv('JWT_SECRET')).toThrow('Missing required environment variable: JWT_SECRET');
  });

  it('returns the normalized server environment', () => {
    process.env.SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key';
    process.env.JWT_SECRET = 'jwt-secret';

    expect(getServerEnv()).toEqual({
      supabaseUrl: 'https://example.supabase.co',
      supabaseServiceRoleKey: 'service-role-key',
      jwtSecret: 'jwt-secret',
    });
  });

  it('detects production mode from NODE_ENV or VERCEL_ENV', () => {
    process.env.NODE_ENV = 'production';
    expect(isProductionEnvironment()).toBe(true);

    process.env.NODE_ENV = 'test';
    process.env.VERCEL_ENV = 'production';
    expect(isProductionEnvironment()).toBe(true);
  });
});
