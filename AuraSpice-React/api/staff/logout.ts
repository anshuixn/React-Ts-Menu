import type { VercelRequest, VercelResponse } from '@vercel/node';
import { clearAuthCookie, ensureMethod } from '../_lib/http';
import { supabaseAdmin } from '../_lib/supabaseAdmin';
import { getAuthTokenFromRequest, requireStaffSession } from '../_lib/verifyToken';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!ensureMethod(req, res, ['POST'])) {
    return;
  }

  res.setHeader('Cache-Control', 'no-store');

  const session = await requireStaffSession(req, res);

  if (!session) {
    return;
  }

  const token = getAuthTokenFromRequest(req);

  if (!token) {
    clearAuthCookie(res);
    return res.status(200).json({ success: true });
  }

  try {
    const { error } = await supabaseAdmin
      .from('staff_sessions')
      .delete()
      .eq('token', token);

    clearAuthCookie(res);

    if (error) {
      return res.status(500).json({ success: false, message: 'Unable to logout' });
    }

    return res.status(200).json({ success: true });
  } catch {
    clearAuthCookie(res);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
}
