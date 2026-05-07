-- Remove insecure bootstrap data if it exists.
DELETE FROM public.staff_sessions
WHERE staff_id = 'admin';

DELETE FROM public.staff_accounts
WHERE id = 'admin';

DELETE FROM public.settings
WHERE key = 'establishment_key'
  AND value = 'AURASPICE_DEFAULT_KEY';

-- Ensure RLS is enabled everywhere.
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Orders are public-write only; all other access is server-mediated.
DROP POLICY IF EXISTS "Allow public insert on orders" ON public.orders;
CREATE POLICY "Allow public insert on orders"
ON public.orders
FOR INSERT
TO PUBLIC
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public select on orders" ON public.orders;
DROP POLICY IF EXISTS "Allow public update on orders" ON public.orders;
DROP POLICY IF EXISTS "Allow public delete on orders" ON public.orders;

-- Helpful indexes for staff dashboards and session verification.
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_staff_sessions_staff_id ON public.staff_sessions(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_sessions_expires_at ON public.staff_sessions(expires_at);
