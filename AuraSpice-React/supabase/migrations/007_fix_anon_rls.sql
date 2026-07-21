-- ============================================================
-- AuraSpice Migration 007: Fix Overly Permissive RLS Policies
-- ============================================================
--
-- Fixes two security issues introduced by earlier migrations:
--
-- Issue A (HIGH): Migration 20260503 re-opened a "public insert" policy on
-- orders that bypasses the API layer (no rate limiting, no server-side price
-- validation, no tracking_token generation by our code).
--
-- Issue B (MEDIUM): Migration 006 added "anon_select_active_orders" which
-- lets any anonymous client SELECT * from all orders in the last 24 hours,
-- exposing table numbers, items, totals, and tracking_token UUIDs for every
-- active order — across all tables.
--
-- After this migration:
--   INSERT  → service_role only (via /api/orders/create Vercel function)
--   SELECT  → anon may only read their own order when they supply the correct
--             tracking_token (existing "anon_select_own_order" policy from 004)
--   UPDATE  → service_role only (via /api/orders/update Vercel function)
--   DELETE  → service_role only (via /api/orders/clear Vercel function)
--
-- NOTE ON SUPABASE REALTIME:
-- Removing "anon_select_active_orders" means the Supabase Realtime channel
-- (anon key) will stop delivering row-level events to anonymous clients,
-- because Realtime enforces RLS on SELECT.
-- This is INTENTIONAL — the frontend already has a robust HTTP polling
-- fallback (useOrderPolling.ts, 20s interval). Realtime events were a
-- performance optimisation, not a requirement.
-- ============================================================


-- ── Remove the re-opened public INSERT policy (Issue A) ───────────────────────

DROP POLICY IF EXISTS "Allow public insert on orders" ON public.orders;

-- Ensure service_role insert policy is present (from migration 004).
-- We use CREATE POLICY ... IF NOT EXISTS pattern via DO block for safety.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'orders'
      AND policyname = 'service_role_insert_orders'
  ) THEN
    CREATE POLICY "service_role_insert_orders"
      ON public.orders
      FOR INSERT
      TO service_role
      WITH CHECK (true);
  END IF;
END $$;


-- ── Remove the overly broad anon SELECT policy (Issue B) ─────────────────────

DROP POLICY IF EXISTS "anon_select_active_orders" ON public.orders;


-- ── Verify the token-gated anon SELECT policy exists (from migration 004) ────
--
-- "anon_select_own_order" allows SELECT only when the tracking_token in the
-- row matches a token the client presents via request context. This is the
-- correct policy — narrow, auditable, and safe.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'orders'
      AND policyname = 'anon_select_own_order'
  ) THEN
    -- Recreate if somehow missing
    CREATE POLICY "anon_select_own_order"
      ON public.orders
      FOR SELECT
      TO anon
      USING (
        tracking_token::text = current_setting('request.jwt.claims', true)::json->>'tracking_token'
        OR
        tracking_token::text = current_setting('app.tracking_token', true)
      );
  END IF;
END $$;


-- ── Sanity check: confirm RLS is still enabled on all tables ─────────────────

ALTER TABLE public.orders        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings       ENABLE ROW LEVEL SECURITY;
