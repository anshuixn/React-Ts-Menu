-- ============================================
-- AuraSpice: Rate Limits Table & RPC
-- Required for distributed rate limiting
-- across Vercel serverless cold starts.
-- ============================================

CREATE TABLE IF NOT EXISTS public.rate_limits (
  key        TEXT        PRIMARY KEY,
  count      INTEGER     NOT NULL DEFAULT 0,
  reset_at   TIMESTAMPTZ NOT NULL
);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Block all anon/user access; service-role bypasses RLS
DROP POLICY IF EXISTS "service_role_only" ON public.rate_limits;
CREATE POLICY "service_role_only" ON public.rate_limits
  USING (false) WITH CHECK (false);

-- Atomic increment function for race-free rate limiting
CREATE OR REPLACE FUNCTION increment_rate_limit(
  p_key       TEXT,
  p_limit     INTEGER,
  p_window_ms INTEGER,
  p_reset_at  TEXT
)
RETURNS TABLE(count INTEGER, reset_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_now       TIMESTAMPTZ := NOW();
  v_reset_at  TIMESTAMPTZ := p_reset_at::TIMESTAMPTZ;
  v_row       RECORD;
BEGIN
  -- Try to find existing bucket
  SELECT rl.count, rl.reset_at INTO v_row
  FROM public.rate_limits rl
  WHERE rl.key = p_key
  FOR UPDATE;

  IF NOT FOUND THEN
    -- No bucket exists — create fresh
    INSERT INTO public.rate_limits (key, count, reset_at)
    VALUES (p_key, 1, v_reset_at);
    RETURN QUERY SELECT 1, v_reset_at;
    RETURN;
  END IF;

  IF v_row.reset_at <= v_now THEN
    -- Window expired — reset bucket
    UPDATE public.rate_limits rl
    SET count = 1, reset_at = v_reset_at
    WHERE rl.key = p_key;
    RETURN QUERY SELECT 1, v_reset_at;
    RETURN;
  END IF;

  -- Window still active — increment
  UPDATE public.rate_limits rl
  SET count = rl.count + 1
  WHERE rl.key = p_key;

  RETURN QUERY SELECT v_row.count + 1, v_row.reset_at;
END;
$$;
