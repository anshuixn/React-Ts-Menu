import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';
import { z } from 'zod';
import { consumeRateLimit } from "../_lib/rateLimit.js";
import { ensureMethod, getClientIp, setRetryAfterHeader } from "../_lib/http.js";
import { getSupabaseAdmin, supabaseAdmin } from "../_lib/supabaseAdmin.js";
import { sanitizeString } from "../_lib/sanitize.js";
import { orderStatusQuerySchema, updateOrderSchema } from "../_lib/validation.js";
import { requireStaffSession } from "../_lib/verifyToken.js";

// --- Types & Schemas ---

const PUBLIC_RATE_LIMIT = { limit: 30, windowMs: 60_000 };
const STATUS_RATE_LIMIT = { limit: 60, windowMs: 60_000 };

const orderItemSchema = z.object({
  id: z.number().int().positive(),
  qty: z.number().int().min(1).max(50),
});

const createOrderSchema = z.object({
  table_number: z.string().trim().min(1, 'Table number is required').max(16, 'Table number must be 16 characters or fewer'),
  items: z.array(orderItemSchema).min(1, 'At least one item is required').max(100, 'Too many items'),
});

type OrderStatus = 'new' | 'cooking' | 'ready' | 'completed';

interface OrderRow {
  id: string;
  table_number?: string;
  items?: Array<{ id: number; name: string; qty: number; price: number }>;
  total?: number;
  status: OrderStatus;
  created_at?: string;
}

interface MenuPriceRow {
  id: number;
  name: string;
  price: number;
}

const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  new: ['new', 'cooking'],
  cooking: ['cooking', 'ready'],
  ready: ['ready', 'completed'],
  completed: ['completed'],
};

// --- Route Handlers ---

async function handleGetOrders(req: VercelRequest, res: VercelResponse) {
  if (!ensureMethod(req, res, ['GET'])) return;
  const session = await requireStaffSession(req, res, ['Admin', 'Staff']);
  if (!session) return;

  try {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('id, table_number, items, total, status, created_at')
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ success: false, message: 'Unable to fetch orders' });

    const orders = (data ?? []).map((order) => {
      const row = order as OrderRow;
      return {
        id: row.id,
        table: row.table_number,
        items: row.items,
        total: row.total,
        status: row.status,
        timestamp: row.created_at,
      };
    });
    return res.status(200).json({ success: true, orders });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
}

async function handleClearOrders(req: VercelRequest, res: VercelResponse) {
  if (!ensureMethod(req, res, ['POST'])) return;
  const session = await requireStaffSession(req, res, ['Admin', 'Staff']);
  if (!session) return;

  try {
    const { error } = await supabaseAdmin.from('orders').delete().eq('status', 'completed');
    if (error) return res.status(500).json({ success: false, message: 'Unable to clear completed orders' });
    return res.status(200).json({ success: true });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
}

async function handleCreateOrder(req: VercelRequest, res: VercelResponse) {
  if (!ensureMethod(req, res, ['POST'])) return;
  const admin = getSupabaseAdmin();
  if (!admin) return res.status(503).json({ success: false, message: 'API not configured — orders require Supabase credentials' });

  const clientIp = getClientIp(req);
  const rateLimit = await consumeRateLimit({ key: `public:order-create:${clientIp}`, ...PUBLIC_RATE_LIMIT });
  if (!rateLimit.allowed) {
    setRetryAfterHeader(res, rateLimit.retryAfterSeconds);
    return res.status(429).json({ success: false, message: 'Too many requests' });
  }

  const parsedBody = createOrderSchema.safeParse(req.body);
  if (!parsedBody.success) return res.status(400).json({ success: false, message: parsedBody.error.issues[0]?.message ?? 'Invalid request payload' });

  const { table_number: rawTableNumber, items } = parsedBody.data;
  const table_number = sanitizeString(rawTableNumber);
  const itemIds = items.map((i) => i.id);

  try {
    const { data: menuRows, error: menuError } = await admin.from('menu_items').select('id, name, price').in('id', itemIds);
    if (menuError) return res.status(500).json({ success: false, message: 'Unable to verify menu prices' });

    const priceMap = new Map<number, MenuPriceRow>();
    for (const row of (menuRows ?? []) as MenuPriceRow[]) priceMap.set(row.id, row);

    for (const item of items) {
      if (!priceMap.has(item.id)) return res.status(400).json({ success: false, message: `Menu item with ID ${item.id} not found` });
    }

    const orderItems = items.map((item) => {
      const menuItem = priceMap.get(item.id)!;
      return { id: item.id, name: menuItem.name, qty: item.qty, price: menuItem.price };
    });

    const total = orderItems.reduce((sum, item) => sum + item.price * item.qty, 0);
    const orderId = `ORD-${crypto.randomUUID()}`;
    const trackingToken = crypto.randomUUID();

    const { error: insertError } = await admin.from('orders').insert({
      id: orderId,
      table_number,
      items: orderItems,
      total,
      status: 'new',
      tracking_token: trackingToken,
      created_at: new Date().toISOString(),
    });

    if (insertError) return res.status(500).json({ success: false, message: 'Unable to create order' });

    return res.status(201).json({
      success: true,
      order: { id: orderId, table_number, items: orderItems, total, status: 'new', tracking_token: trackingToken },
    });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
}

async function handleOrderStatus(req: VercelRequest, res: VercelResponse) {
  if (!ensureMethod(req, res, ['GET'])) return;
  const admin = getSupabaseAdmin();
  if (!admin) return res.status(503).json({ success: false, message: 'API not configured' });

  const clientIp = getClientIp(req);
  const rateLimit = await consumeRateLimit({ key: `public:order-status:${clientIp}`, ...STATUS_RATE_LIMIT });
  if (!rateLimit.allowed) {
    setRetryAfterHeader(res, rateLimit.retryAfterSeconds);
    return res.status(429).json({ success: false, message: 'Too many requests' });
  }

  const parsedQuery = orderStatusQuerySchema.safeParse({ id: req.query.id, table: req.query.table });
  if (!parsedQuery.success) return res.status(400).json({ success: false, message: parsedQuery.error.issues[0]?.message ?? 'Invalid request parameters' });

  try {
    const { data: order, error } = await admin.from('orders').select('id, table_number, status').eq('id', parsedQuery.data.id).eq('table_number', parsedQuery.data.table).single<OrderRow>();
    if (error || !order) return res.status(404).json({ success: false, message: 'Order not found' });
    return res.status(200).json({ success: true, status: order.status });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
}

async function handleOrderUpdate(req: VercelRequest, res: VercelResponse) {
  if (!ensureMethod(req, res, ['POST'])) return;
  const session = await requireStaffSession(req, res, ['Admin', 'Staff']);
  if (!session) return;

  const parsedBody = updateOrderSchema.safeParse(req.body);
  if (!parsedBody.success) return res.status(400).json({ success: false, message: parsedBody.error.issues[0]?.message ?? 'Invalid request payload' });

  const { id, status } = parsedBody.data;

  try {
    const { data: order, error: orderError } = await supabaseAdmin.from('orders').select('id, status').eq('id', id).single<OrderRow>();
    if (orderError || !order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (!ALLOWED_TRANSITIONS[order.status].includes(status)) return res.status(400).json({ success: false, message: 'Invalid order status transition' });

    const { error: updateError } = await supabaseAdmin.from('orders').update({ status }).eq('id', id);
    if (updateError) return res.status(500).json({ success: false, message: 'Unable to update order' });

    return res.status(200).json({ success: true, order: { id, status } });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
}

// --- Main Router ---

const KNOWN_ACTIONS = new Set(['create', 'update', 'status', 'clear', 'list']);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');

  // Prefer Vercel's injected query param, but fall back to parsing req.url directly.
  // With the Vite framework preset, the [[...action]] catch-all path param may not
  // be injected into req.query in production, causing action to be undefined even
  // for requests like /api/orders/create — which would fall through to handleGetOrders
  // and return 405 for POST requests.
  const actionPath = req.query.action;
  let action: string | undefined = Array.isArray(actionPath) ? actionPath[0] : actionPath;

  if (!action) {
    // Parse the last path segment from the URL (e.g. /api/orders/create → 'create')
    const urlPath = (req.url ?? '').split('?')[0];
    const lastSegment = urlPath.split('/').filter(Boolean).pop();
    if (lastSegment && KNOWN_ACTIONS.has(lastSegment)) {
      action = lastSegment;
    }
  }

  switch (action) {
    case 'list':
      return handleGetOrders(req, res);
    case 'create':
      return handleCreateOrder(req, res);
    case 'update':
      return handleOrderUpdate(req, res);
    case 'status':
      return handleOrderStatus(req, res);
    case 'clear':
      return handleClearOrders(req, res);
    case undefined:
      return handleGetOrders(req, res);
    default:
      return res.status(404).json({ success: false, message: 'Not Found' });
  }
}
