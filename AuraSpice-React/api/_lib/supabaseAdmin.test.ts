import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const createClientMock = vi.fn();
vi.mock('@supabase/supabase-js', () => ({
  createClient: (...args: any[]) => createClientMock(...args),
}));

describe('supabaseAdmin', () => {
  beforeEach(() => {
    vi.resetModules();
    createClientMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return null and warn when environment variables are missing', async () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    const { getSupabaseAdmin } = await import('./supabaseAdmin.js');
    const client = getSupabaseAdmin();
    expect(client).toBeNull();
    expect(spy).toHaveBeenCalled();
  });

  it('should return null and warn when environment variables are placeholders', async () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    process.env.SUPABASE_URL = 'https://your-project.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'your-server-only-service-role-key';

    const { getSupabaseAdmin } = await import('./supabaseAdmin.js');
    const client = getSupabaseAdmin();
    expect(client).toBeNull();
    expect(spy).toHaveBeenCalled();
  });

  it('should initialize and return SupabaseClient when credentials are valid', async () => {
    process.env.SUPABASE_URL = 'https://valid-project.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'valid-service-role-key';
    const fakeClient = { mockClient: true };
    createClientMock.mockReturnValue(fakeClient);

    const { getSupabaseAdmin } = await import('./supabaseAdmin.js');
    const client = getSupabaseAdmin();
    expect(client).toBe(fakeClient);
    expect(createClientMock).toHaveBeenCalledWith(
      'https://valid-project.supabase.co',
      'valid-service-role-key',
      expect.any(Object)
    );

    // Test singleton behavior
    const client2 = getSupabaseAdmin();
    expect(client2).toBe(fakeClient);
    expect(createClientMock).toHaveBeenCalledOnce();
  });

  it('should throw error when accessing deprecated proxy client and it is not initialized', async () => {
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    const { supabaseAdmin } = await import('./supabaseAdmin.js');
    expect(() => {
      // Access any property on the proxy to trigger the get trap
      supabaseAdmin.from('some_table');
    }).toThrow('[AuraSpice API] supabaseAdmin accessed before initialization. Use getSupabaseAdmin() instead.');
  });

  it('should return property on proxy when initialized', async () => {
    process.env.SUPABASE_URL = 'https://valid-project.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'valid-service-role-key';
    const fromMock = vi.fn().mockReturnValue('mock-data');
    const fakeClient = { from: fromMock };
    createClientMock.mockReturnValue(fakeClient);

    const { supabaseAdmin } = await import('./supabaseAdmin.js');
    expect(() => {
      const result = supabaseAdmin.from('some_table');
      expect(result).toBe('mock-data');
      expect(fromMock).toHaveBeenCalledWith('some_table');
    }).not.toThrow();
  });
});
