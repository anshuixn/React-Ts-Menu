import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ensureMethod } from '../_lib/http';
import { getAuthTokenFromRequest, verifyToken } from '../_lib/verifyToken';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!ensureMethod(req, res, ['GET'])) {
    return;
  }

  res.setHeader('Cache-Control', 'no-store');

  const token = getAuthTokenFromRequest(req);
  const session = await verifyToken(token ?? undefined);

  if (!session) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  return res.status(200).json({
    success: true,
    account: {
      id: session.account.id,
      name: session.account.name,
      role: session.account.role,
    },
    token: session.token,
  });
}
