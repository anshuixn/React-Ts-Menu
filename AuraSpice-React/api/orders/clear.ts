import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ensureMethod } from '../_lib/http';
import { supabaseAdmin } from '../_lib/supabaseAdmin';
import { requireStaffSession } from '../_lib/verifyToken';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!ensureMethod(req, res, ['POST'])) {
    return;
  }

  res.setHeader('Cache-Control', 'no-store');

  const session = await requireStaffSession(req, res, ['Admin', 'Staff']);

  if (!session) {
    return;
  }

  try {
    const { error } = await supabaseAdmin
      .from('orders')
      .delete()
      .eq('status', 'completed');

    if (error) {
      return res.status(500).json({ success: false, message: 'Unable to clear completed orders' });
    }

    return res.status(200).json({ success: true });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
}
