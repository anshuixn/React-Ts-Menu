import type { VercelRequest, VercelResponse } from '@vercel/node';
import { consumeRateLimit } from './_lib/rateLimit';
import { ensureMethod, getClientIp, setRetryAfterHeader } from './_lib/http';
import { getSupabaseAdmin } from './_lib/supabaseAdmin';

const PUBLIC_RATE_LIMIT = {
  limit: 60,
  windowMs: 60_000,
};

interface MenuItemRow {
  id: number;
  name: string;
  category: string;
  price: number;
  calories: number;
  image: string;
  desc: string;
  is_available: boolean;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!ensureMethod(req, res, ['GET'])) {
    return;
  }

  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');

  // Lazy init — returns null when SUPABASE_* env vars are missing/placeholder
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    // Client gracefully falls back to static menu data
    return res.status(503).json({ success: false, message: 'API not configured — running in demo mode' });
  }

  const clientIp = getClientIp(req);
  const rateLimit = await consumeRateLimit({
    key: `public:menu:${clientIp}`,
    ...PUBLIC_RATE_LIMIT,
  });

  if (!rateLimit.allowed) {
    setRetryAfterHeader(res, rateLimit.retryAfterSeconds);
    return res.status(429).json({ success: false, message: 'Too many requests' });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('menu_items')
      .select('id, name, category, price, calories, image, desc, is_available')
      .eq('is_available', true)
      .order('id', { ascending: true });

    if (error) {
      return res.status(500).json({ success: false, message: 'Unable to fetch menu' });
    }

    const items = (data ?? []).map((row) => {
      const item = row as MenuItemRow;
      return {
        id: item.id,
        name: item.name,
        category: item.category,
        price: item.price,
        calories: item.calories,
        image: item.image,
        desc: item.desc,
      };
    });

    return res.status(200).json({ success: true, items });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
}
