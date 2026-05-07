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

import { supabaseAdmin } from "./supabaseAdmin.js";

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
  const now = new Date();

  const { data, error } = await supabaseAdmin
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
 *
 * Uses an upsert: if the row doesn't exist (or the window has expired)
 * it creates a fresh bucket starting at 1.  If it exists within the
 * window it increments.  The increment check is done in one round-trip
 * via a Postgres RPC to avoid TOCTOU races.
 */
export async function consumeRateLimit(options: RateLimitOptions): Promise<RateLimitResult> {
  const now = new Date();
  const resetAt = new Date(now.getTime() + options.windowMs).toISOString();

  // Try to atomically increment via RPC.
  // Falls back to the safe upsert path if the RPC isn't set up yet.
  const { data, error } = await supabaseAdmin.rpc('increment_rate_limit', {
    p_key: options.key,
    p_limit: options.limit,
    p_window_ms: options.windowMs,
    p_reset_at: resetAt,
  }) as { data: { count: number; reset_at: string } | null; error: unknown };

  if (error || !data) {
    // Fallback: plain upsert (slightly less atomic but still distributed)
    return await fallbackUpsert(options, resetAt);
  }

  const remaining = Math.max(0, options.limit - data.count);
  const retryAfterSeconds = calcRetryAfter(data.reset_at);

  return {
    allowed: data.count <= options.limit,
    remaining,
    retryAfterSeconds,
  };
}

/**
 * Fallback upsert path — used when the RPC function isn't available.
 * Less atomic than the RPC but still far better than the old in-memory Map.
 */
async function fallbackUpsert(
  options: RateLimitOptions,
  resetAt: string,
): Promise<RateLimitResult> {
  const now = new Date();

  // Read current state first
  const { data: existing } = await supabaseAdmin
    .from('rate_limits')
    .select('count, reset_at')
    .eq('key', options.key)
    .single<Pick<RateLimitRow, 'count' | 'reset_at'>>();

  const windowExpired = !existing || new Date(existing.reset_at) <= now;
  const newCount = windowExpired ? 1 : existing.count + 1;
  const newResetAt = windowExpired ? resetAt : existing.reset_at;

  await supabaseAdmin
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
  await supabaseAdmin.from('rate_limits').delete().eq('key', key);
}
