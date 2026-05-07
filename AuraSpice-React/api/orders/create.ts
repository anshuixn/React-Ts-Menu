import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';
import { consumeRateLimit } from '../_lib/rateLimit';
import { ensureMethod, getClientIp, setRetryAfterHeader } from '../_lib/http';
import { getSupabaseAdmin } from '../_lib/supabaseAdmin';
import { sanitizeString } from '../_lib/sanitize';
import { z } from 'zod';

const PUBLIC_RATE_LIMIT = {
  limit: 30,
  windowMs: 60_000,
};

const orderItemSchema = z.object({
  id: z.number().int().positive(),
  qty: z.number().int().min(1).max(50),
});

const createOrderSchema = z.object({
  table_number: z
    .string()
    .trim()
    .min(1, 'Table number is required')
    .max(16, 'Table number must be 16 characters or fewer'),
  items: z
    .array(orderItemSchema)
    .min(1, 'At least one item is required')
    .max(100, 'Too many items'),
});

interface MenuPriceRow {
  id: number;
  name: string;
  price: number;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!ensureMethod(req, res, ['POST'])) {
    return;
  }

  res.setHeader('Cache-Control', 'no-store');

  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    return res.status(503).json({ success: false, message: 'API not configured — orders require Supabase credentials' });
  }

  const clientIp = getClientIp(req);
  const rateLimit = await consumeRateLimit({
    key: `public:order-create:${clientIp}`,
    ...PUBLIC_RATE_LIMIT,
  });

  if (!rateLimit.allowed) {
    setRetryAfterHeader(res, rateLimit.retryAfterSeconds);
    return res.status(429).json({ success: false, message: 'Too many requests' });
  }

  const parsedBody = createOrderSchema.safeParse(req.body);

  if (!parsedBody.success) {
    return res.status(400).json({
      success: false,
      message: parsedBody.error.issues[0]?.message ?? 'Invalid request payload',
    });
  }

  const { table_number: rawTableNumber, items } = parsedBody.data;
  const table_number = sanitizeString(rawTableNumber);
  const itemIds = items.map((i) => i.id);

  try {
    // Fetch real prices from the database to prevent client-side tampering
    const { data: menuRows, error: menuError } = await supabaseAdmin
      .from('menu_items')
      .select('id, name, price')
      .in('id', itemIds);

    if (menuError) {
      return res.status(500).json({ success: false, message: 'Unable to verify menu prices' });
    }

    const priceMap = new Map<number, MenuPriceRow>();
    for (const row of (menuRows ?? []) as MenuPriceRow[]) {
      priceMap.set(row.id, row);
    }

    // Verify all requested item IDs exist in the menu
    for (const item of items) {
      if (!priceMap.has(item.id)) {
        return res.status(400).json({
          success: false,
          message: `Menu item with ID ${item.id} not found`,
        });
      }
    }

    // Re-derive total server-side from actual menu prices
    const orderItems = items.map((item) => {
      const menuItem = priceMap.get(item.id)!;
      return {
        id: item.id,
        name: menuItem.name,
        qty: item.qty,
        price: menuItem.price,
      };
    });

    const total = orderItems.reduce((sum, item) => sum + item.price * item.qty, 0);
    const orderId = `ORD-${crypto.randomUUID()}`;
    const trackingToken = crypto.randomUUID();

    const { error: insertError } = await supabaseAdmin.from('orders').insert({
      id: orderId,
      table_number,
      items: orderItems,
      total,
      status: 'new',
      tracking_token: trackingToken,
      created_at: new Date().toISOString(),
    });

    if (insertError) {
      return res.status(500).json({ success: false, message: 'Unable to create order' });
    }

    return res.status(201).json({
      success: true,
      order: {
        id: orderId,
        table_number,
        items: orderItems,
        total,
        status: 'new',
        tracking_token: trackingToken,
      },
    });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
}
