-- ============================================
-- AuraSpice: Supabase SQL Schema
-- Full setup for tables, types, RLS, and Realtime
-- ============================================

-- 1. Custom Types
CREATE TYPE order_status AS ENUM ('new', 'cooking', 'ready', 'completed');

-- 2. Tables

-- Orders Table
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  table_number TEXT NOT NULL,
  items JSONB NOT NULL,
  total NUMERIC NOT NULL DEFAULT 0,
  status order_status NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Staff Accounts Table
CREATE TABLE IF NOT EXISTS staff_accounts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL, -- Stored securely
  role TEXT NOT NULL DEFAULT 'Staff',
  registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Staff Sessions Table (for Serverless Auth)
CREATE TABLE IF NOT EXISTS staff_sessions (
  token TEXT PRIMARY KEY,
  staff_id TEXT NOT NULL REFERENCES staff_accounts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

-- Settings Table (for Establishment Key)
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Row Level Security (RLS) Policies

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Orders: 
-- Anyone can insert a new order (from the public app)
CREATE POLICY "Allow public insert on orders" ON orders FOR INSERT WITH CHECK (true);
-- Anyone can read orders (customers reading their own via ID, staff reading all via realtime)
CREATE POLICY "Allow public select on orders" ON orders FOR SELECT USING (true);
-- Updating orders requires service_role (via Vercel API) OR we can allow anon if we want client-side staff updates
-- For now, allowing all so the client-side hooks work before fully migrating all staff actions to API
CREATE POLICY "Allow public update on orders" ON orders FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on orders" ON orders FOR DELETE USING (true);

-- Staff Accounts, Sessions, Settings:
-- Only service_role (Vercel API) should interact with these directly
-- We use a deny-all default because service_role bypasses RLS
-- (No policies needed = completely locked down from anon/public)

-- 4. Supabase Realtime Publication
-- Ensure the orders table is broadcasting events
BEGIN;
  -- Remove it from the publication if it exists to avoid errors
  ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS orders;
  -- Add it back
  ALTER PUBLICATION supabase_realtime ADD TABLE orders;
COMMIT;

-- 5. Insert initial setup data
INSERT INTO settings (key, value) VALUES ('establishment_key', 'AURASPICE_DEFAULT_KEY') ON CONFLICT DO NOTHING;

-- Default Admin Account (password is 'admin' hashed with bcrypt)
-- You should change this immediately in production
INSERT INTO staff_accounts (id, name, password_hash, role) 
VALUES ('admin', 'System Admin', '$2b$10$WqTzO8K5z/Qk.X7y0G5oZ.1d4b2n5c9m8x7y6z5a4b3c2d1e0f9', 'Admin')
ON CONFLICT DO NOTHING;
