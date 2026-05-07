-- ============================================
-- AuraSpice: Production Supabase Schema
-- Public clients may create orders only.
-- All staff, session, and settings access flows through the server API.
-- ============================================

DO $$ BEGIN
  CREATE TYPE order_status AS ENUM ('new', 'cooking', 'ready', 'completed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  table_number TEXT NOT NULL,
  items JSONB NOT NULL,
  total NUMERIC NOT NULL DEFAULT 0,
  status order_status NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS staff_accounts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'Staff',
  registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS staff_sessions (
  token TEXT PRIMARY KEY,
  staff_id TEXT NOT NULL REFERENCES staff_accounts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_staff_sessions_staff_id ON staff_sessions(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_sessions_expires_at ON staff_sessions(expires_at);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public insert on orders" ON public.orders;
CREATE POLICY "Allow public insert on orders"
ON public.orders
FOR INSERT
TO PUBLIC
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public select on orders" ON public.orders;
DROP POLICY IF EXISTS "Allow public update on orders" ON public.orders;
DROP POLICY IF EXISTS "Allow public delete on orders" ON public.orders;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE orders;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Sensitive bootstrap data is intentionally excluded from the schema.
-- Use scripts/init-admin.mjs to create the first admin account and establishment key.
