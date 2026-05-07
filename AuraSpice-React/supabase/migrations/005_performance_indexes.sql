-- ============================================================
-- AuraSpice Migration 005: Performance Indexes
-- ============================================================
-- Eliminates sequential scans for all active query patterns.
-- ============================================================

-- Per-customer order lookup (after tracking_token column added)
CREATE INDEX IF NOT EXISTS idx_orders_tracking_token
  ON public.orders(tracking_token);

-- Composite for staff dashboard (active orders sorted by time)
CREATE INDEX IF NOT EXISTS idx_orders_table_created
  ON public.orders(table_number, created_at DESC);

-- Status filter (used by dashboard to show only non-completed)
CREATE INDEX IF NOT EXISTS idx_orders_status_created
  ON public.orders(status, created_at DESC)
  WHERE status != 'completed';

-- Session expiry cleanup (used by session validation)
CREATE INDEX IF NOT EXISTS idx_staff_sessions_expires_at
  ON public.staff_sessions(expires_at);
