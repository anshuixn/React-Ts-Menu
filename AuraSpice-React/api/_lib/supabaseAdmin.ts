import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let _instance: SupabaseClient | null = null;
let _initAttempted = false;

/**
 * Lazy singleton — initializes only on first call.
 * Returns null if SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY are missing,
 * so API handlers can degrade gracefully instead of crashing on startup.
 */
export function getSupabaseAdmin(): SupabaseClient | null {
  if (_initAttempted) return _instance;
  _initAttempted = true;

  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (
    !url ||
    !key ||
    url.includes('your-project') ||
    key.includes('your-server-only')
  ) {
    console.warn('[AuraSpice API] Supabase admin client not initialized — SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY are missing or placeholder values.');
    return null;
  }

  _instance = createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return _instance;
}

/**
 * @deprecated Use getSupabaseAdmin() for lazy initialization.
 * Kept for backward compatibility — will return null when env vars are missing.
 */
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabaseAdmin();
    if (!client) {
      throw new Error('[AuraSpice API] supabaseAdmin accessed before initialization. Use getSupabaseAdmin() instead.');
    }
    return client[prop as keyof SupabaseClient];
  },
});
