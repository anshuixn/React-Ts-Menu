/**
 * Distributed Rate Limiter — Supabase-backed
 * ============================================
 * Replaces the previous in-memory Map implementation which was broken
 * under Vercel's serverless model (each concurrent request gets its own
 * process, so the Map was never actually shared across requests).
 *
 * This version uses a `rate_limits` table in Supabase with an atomic
 * upsert + increment pattern, giving true distributed state.
 *
 * Required SQL migration (run once in Supabase SQL editor):
 * ──────────────────────────────────────────────────────────
 * CREATE TABLE IF NOT EXISTS public.rate_limits (
 *   key        TEXT        PRIMARY KEY,
 *   count      INTEGER     NOT NULL DEFAULT 0,
 *   reset_at   TIMESTAMPTZ NOT NULL
 * );
 * ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
 * -- Only the service role key may read/write this table:
 * CREATE POLICY "service_role_only" ON public.rate_limits
 *   USING (false) WITH CHECK (false);
 *
 * The service-role client bypasses RLS, so the policy above blocks
 * all anon/user access while still allowing our serverless functions.
 */

import { getSupabaseAdmin } from "./supabaseAdmin.js";

// ─── Public types ─────────────────────────────────────────────────────────────

export interface RateLimitOptions {
  key: string;
  limit: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

// ─── Internal row shape ───────────────────────────────────────────────────────

interface RateLimitRow {
  key: string;
  count: number;
  reset_at: string;
}

// ─── In-memory fallback map ──────────────────────────────────────────────────
// Used when Supabase admin client is not configured (e.g. testing or demo environment)
const fallbackMap = new Map<string, { count: number; resetAt: Date }>();

// Periodic cleanup to avoid memory leak
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = new Date();
    for (const [key, value] of fallbackMap.entries()) {
      if (value.resetAt <= now) {
        fallbackMap.delete(key);
      }
    }
  }, 60_000);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcRetryAfter(resetAt: string): number {
  return Math.max(0, (new Date(resetAt).getTime() - Date.now()) / 1000);
}

// ─── Core functions ───────────────────────────────────────────────────────────

/**
 * peekRateLimit — reads the current bucket state WITHOUT incrementing.
 * Use this to check if a key is already blocked before doing expensive work.
 */
export async function peekRateLimit(options: RateLimitOptions): Promise<RateLimitResult> {
  const admin = getSupabaseAdmin();
  const now = new Date();

  if (!admin) {
    const entry = fallbackMap.get(options.key);
    if (!entry || entry.resetAt <= now) {
      return { allowed: true, remaining: options.limit, retryAfterSeconds: 0 };
    }
    const remaining = Math.max(0, options.limit - entry.count);
    const retryAfterSeconds = Math.max(0, (entry.resetAt.getTime() - now.getTime()) / 1000);
    return {
      allowed: entry.count < options.limit,
      remaining,
      retryAfterSeconds,
    };
  }

  const { data, error } = await admin
    .from('rate_limits')
    .select('count, reset_at')
    .eq('key', options.key)
    .single<Pick<RateLimitRow, 'count' | 'reset_at'>>();

  // No row yet — not rate-limited at all
  if (error || !data) {
    return { allowed: true, remaining: options.limit, retryAfterSeconds: 0 };
  }

  // Window has expired — treat as fresh bucket
  if (new Date(data.reset_at) <= now) {
    return { allowed: true, remaining: options.limit, retryAfterSeconds: 0 };
  }

  const remaining = Math.max(0, options.limit - data.count);
  const retryAfterSeconds = calcRetryAfter(data.reset_at);

  return {
    allowed: data.count < options.limit,
    remaining,
    retryAfterSeconds,
  };
}

/**
 * consumeRateLimit — atomically increments the counter and returns
 * whether the request is allowed.
 */
export async function consumeRateLimit(options: RateLimitOptions): Promise<RateLimitResult> {
  const admin = getSupabaseAdmin();
  const now = new Date();
  const resetAtDate = new Date(now.getTime() + options.windowMs);
  const resetAt = resetAtDate.toISOString();

  if (!admin) {
    let entry = fallbackMap.get(options.key);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: resetAtDate };
    }
    entry.count++;
    fallbackMap.set(options.key, entry);

    const remaining = Math.max(0, options.limit - entry.count);
    const retryAfterSeconds = Math.max(0, (entry.resetAt.getTime() - now.getTime()) / 1000);
    return {
      allowed: entry.count <= options.limit,
      remaining,
      retryAfterSeconds,
    };
  }

  // Try to atomically increment via RPC.
  const { data: rpcData, error } = await admin.rpc('increment_rate_limit', {
    p_key: options.key,
    p_limit: options.limit,
    p_window_ms: options.windowMs,
    p_reset_at: resetAt,
  }) as { data: Array<{ count: number; reset_at: string }> | null; error: unknown };

  const row = Array.isArray(rpcData) ? rpcData[0] : null;

  if (error || !row) {
    // Fallback: plain upsert (slightly less atomic but still distributed)
    return await fallbackUpsert(options, resetAt);
  }

  const remaining = Math.max(0, options.limit - row.count);
  const retryAfterSeconds = calcRetryAfter(row.reset_at);

  return {
    allowed: row.count <= options.limit,
    remaining,
    retryAfterSeconds,
  };
}

/**
 * Fallback upsert path — used when the RPC function isn't available.
 */
async function fallbackUpsert(
  options: RateLimitOptions,
  resetAt: string,
): Promise<RateLimitResult> {
  const admin = getSupabaseAdmin();
  if (!admin) {
    return { allowed: true, remaining: options.limit, retryAfterSeconds: 0 };
  }
  const now = new Date();

  // Read current state first
  const { data: existing } = await admin
    .from('rate_limits')
    .select('count, reset_at')
    .eq('key', options.key)
    .single<Pick<RateLimitRow, 'count' | 'reset_at'>>();

  const windowExpired = !existing || new Date(existing.reset_at) <= now;
  const newCount = windowExpired ? 1 : existing.count + 1;
  const newResetAt = windowExpired ? resetAt : existing.reset_at;

  await admin
    .from('rate_limits')
    .upsert({ key: options.key, count: newCount, reset_at: newResetAt });

  const remaining = Math.max(0, options.limit - newCount);
  const retryAfterSeconds = calcRetryAfter(newResetAt);

  return {
    allowed: newCount <= options.limit,
    remaining,
    retryAfterSeconds,
  };
}

/**
 * resetRateLimit — clears the rate limit bucket for a key.
 * Called after a successful login to clear failed-attempt counters.
 */
export async function resetRateLimit(key: string): Promise<void> {
  const admin = getSupabaseAdmin();
  if (!admin) {
    fallbackMap.delete(key);
    return;
  }
  await admin.from('rate_limits').delete().eq('key', key);
}
