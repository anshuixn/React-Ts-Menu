-- ============================================================
-- AuraSpice Migration 006: Allow Anon SELECT for Active Orders
-- Allows real-time WebSocket subscriptions to receive events
-- for active orders (created in the last 24 hours).
-- ============================================================

DROP POLICY IF EXISTS "anon_select_active_orders" ON public.orders;

CREATE POLICY "anon_select_active_orders"
  ON public.orders
  FOR SELECT
  TO anon
  USING (created_at > now() - interval '24 hours');
