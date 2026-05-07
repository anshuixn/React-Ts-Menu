import type { VercelRequest, VercelResponse } from '@vercel/node';
import { consumeRateLimit } from '../_lib/rateLimit';
import { ensureMethod, getClientIp, setRetryAfterHeader } from '../_lib/http';
import { getSupabaseAdmin } from '../_lib/supabaseAdmin';
import { orderStatusQuerySchema } from '../_lib/validation';

const PUBLIC_RATE_LIMIT = {
  limit: 60,
  windowMs: 60_000,
};

interface OrderStatusRow {
  id: string;
  table_number: string;
  status: 'new' | 'cooking' | 'ready' | 'completed';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!ensureMethod(req, res, ['GET'])) {
    return;
  }

  res.setHeader('Cache-Control', 'no-store');

  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    return res.status(503).json({ success: false, message: 'API not configured — order status requires Supabase credentials' });
  }

  const clientIp = getClientIp(req);
  const rateLimit = await consumeRateLimit({
    key: `public:order-status:${clientIp}`,
    ...PUBLIC_RATE_LIMIT,
  });

  if (!rateLimit.allowed) {
    setRetryAfterHeader(res, rateLimit.retryAfterSeconds);
    return res.status(429).json({ success: false, message: 'Too many requests' });
  }

  const parsedQuery = orderStatusQuerySchema.safeParse({
    id: req.query.id,
    table: req.query.table,
  });

  if (!parsedQuery.success) {
    return res.status(400).json({
      success: false,
      message: parsedQuery.error.issues[0]?.message ?? 'Invalid request parameters',
    });
  }

  try {
    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select('id, table_number, status')
      .eq('id', parsedQuery.data.id)
      .eq('table_number', parsedQuery.data.table)
      .single<OrderStatusRow>();

    if (error || !order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    return res.status(200).json({ success: true, status: order.status });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
}
