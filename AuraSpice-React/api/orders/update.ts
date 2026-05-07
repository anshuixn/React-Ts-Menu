import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ensureMethod } from '../_lib/http';
import { supabaseAdmin } from '../_lib/supabaseAdmin';
import { updateOrderSchema } from '../_lib/validation';
import { requireStaffSession } from '../_lib/verifyToken';

type OrderStatus = 'new' | 'cooking' | 'ready' | 'completed';

interface OrderRow {
  id: string;
  status: OrderStatus;
}

const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  new: ['new', 'cooking'],
  cooking: ['cooking', 'ready'],
  ready: ['ready', 'completed'],
  completed: ['completed'],
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!ensureMethod(req, res, ['POST'])) {
    return;
  }

  res.setHeader('Cache-Control', 'no-store');

  const session = await requireStaffSession(req, res, ['Admin', 'Staff']);

  if (!session) {
    return;
  }

  const parsedBody = updateOrderSchema.safeParse(req.body);

  if (!parsedBody.success) {
    return res.status(400).json({
      success: false,
      message: parsedBody.error.issues[0]?.message ?? 'Invalid request payload',
    });
  }

  const { id, status } = parsedBody.data;

  try {
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('id, status')
      .eq('id', id)
      .single<OrderRow>();

    if (orderError || !order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (!ALLOWED_TRANSITIONS[order.status].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid order status transition' });
    }

    const { error: updateError } = await supabaseAdmin
      .from('orders')
      .update({ status })
      .eq('id', id);

    if (updateError) {
      return res.status(500).json({ success: false, message: 'Unable to update order' });
    }

    return res.status(200).json({ success: true, order: { id, status } });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
}
