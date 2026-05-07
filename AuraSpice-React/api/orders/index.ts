import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ensureMethod } from '../_lib/http';
import { supabaseAdmin } from '../_lib/supabaseAdmin';
import { requireStaffSession } from '../_lib/verifyToken';

interface OrderRow {
  id: string;
  table_number: string;
  items: Array<{ id: number; name: string; qty: number; price: number }>;
  total: number;
  status: 'new' | 'cooking' | 'ready' | 'completed';
  created_at: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!ensureMethod(req, res, ['GET'])) {
    return;
  }

  res.setHeader('Cache-Control', 'no-store');

  const session = await requireStaffSession(req, res, ['Admin', 'Staff']);

  if (!session) {
    return;
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('id, table_number, items, total, status, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ success: false, message: 'Unable to fetch orders' });
    }

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
