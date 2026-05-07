-- ============================================================
-- AuraSpice Migration 004: tracking_token + Strict RLS
-- ============================================================
-- Adds a per-order secret token so customers can only access
-- their own order without enumerating others.
-- ============================================================

-- 1. Add column (nullable first, so existing rows don't break)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS tracking_token UUID;

-- 2. Backfill existing rows with unique tokens (no table lock needed)
UPDATE public.orders
SET tracking_token = gen_random_uuid()
WHERE tracking_token IS NULL;

-- 3. Now enforce NOT NULL
ALTER TABLE public.orders
  ALTER COLUMN tracking_token SET NOT NULL,
  ALTER COLUMN tracking_token SET DEFAULT gen_random_uuid();

-- 4. Unique constraint (each token maps to exactly one order)
ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_tracking_token_key;
ALTER TABLE public.orders
  ADD CONSTRAINT orders_tracking_token_key UNIQUE (tracking_token);

-- ── RLS Policies ──────────────────────────────────────────────

-- Drop any previously open policies
DROP POLICY IF EXISTS "Allow public insert on orders"  ON public.orders;
DROP POLICY IF EXISTS "Allow public select on orders"  ON public.orders;
DROP POLICY IF EXISTS "Allow public update on orders"  ON public.orders;
DROP POLICY IF EXISTS "Allow public delete on orders"  ON public.orders;

-- INSERT: only the server-side API (service role) may insert.
-- The anon role is intentionally excluded — customers never
-- call Supabase directly; they hit our /api/orders/create handler.
CREATE POLICY "service_role_insert_orders"
  ON public.orders
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- SELECT: anon role may read exactly ONE order when they supply
-- the correct tracking_token via a request header we set in
-- our API handler using set_config.
-- In practice customers always go through /api/orders/status
-- which uses the service role — this policy is a safety net.
CREATE POLICY "anon_select_own_order"
  ON public.orders
  FOR SELECT
  TO anon
  USING (
    tracking_token::text = current_setting('request.jwt.claims', true)::json->>'tracking_token'
    OR
    tracking_token::text = current_setting('app.tracking_token', true)
  );

-- UPDATE: only authenticated service role (staff API handlers)
CREATE POLICY "service_role_update_orders"
  ON public.orders
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- DELETE: only service role (for clear-completed endpoint)
CREATE POLICY "service_role_delete_orders"
  ON public.orders
  FOR DELETE
  TO service_role
  USING (true);

-- Explicit deny for anon UPDATE and DELETE (belt-and-suspenders)
-- RLS deny-by-default already blocks these, but making it explicit
CREATE POLICY "deny_anon_update_orders"
  ON public.orders
  FOR UPDATE
  TO anon
  USING (false);

CREATE POLICY "deny_anon_delete_orders"
  ON public.orders
  FOR DELETE
  TO anon
  USING (false);
