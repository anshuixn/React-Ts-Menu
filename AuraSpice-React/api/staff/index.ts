import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ensureMethod } from '../_lib/http';
import { supabaseAdmin } from '../_lib/supabaseAdmin';
import { requireStaffSession } from '../_lib/verifyToken';

interface StaffAccountRow {
  id: string;
  name: string;
  role: string;
  registered_at: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!ensureMethod(req, res, ['GET'])) {
    return;
  }

  res.setHeader('Cache-Control', 'no-store');

  const session = await requireStaffSession(req, res, ['Admin']);

  if (!session) {
    return;
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('staff_accounts')
      .select('id, name, role, registered_at')
      .order('registered_at', { ascending: false });

    if (error) {
      return res.status(500).json({ success: false, message: 'Unable to fetch staff accounts' });
    }

    const accounts = (data ?? []).map((account) => {
      const row = account as StaffAccountRow;

      return {
        id: row.id,
        name: row.name,
        role: row.role,
        registeredAt: row.registered_at,
      };
    });

    return res.status(200).json({ success: true, accounts });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
}
