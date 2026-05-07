import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ensureMethod } from '../../_lib/http';
import { supabaseAdmin } from '../../_lib/supabaseAdmin';
import { staffIdParamSchema } from '../../_lib/validation';
import { requireStaffSession } from '../../_lib/verifyToken';

interface StaffRoleRow {
  role: string;
}

interface CountRow {
  count: number | null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!ensureMethod(req, res, ['DELETE'])) {
    return;
  }

  res.setHeader('Cache-Control', 'no-store');

  const session = await requireStaffSession(req, res, ['Admin']);

  if (!session) {
    return;
  }

  const parsedParams = staffIdParamSchema.safeParse({ id: req.query.id });

  if (!parsedParams.success) {
    return res.status(400).json({
      success: false,
      message: parsedParams.error.issues[0]?.message ?? 'Invalid staff ID',
    });
  }

  const targetId = parsedParams.data.id;

  if (targetId === session.account.id) {
    return res.status(400).json({ success: false, message: 'You cannot remove your own account' });
  }

  try {
    const { data: targetAccount, error: targetError } = await supabaseAdmin
      .from('staff_accounts')
      .select('role')
      .eq('id', targetId)
      .single<StaffRoleRow>();

    if (targetError || !targetAccount) {
      return res.status(404).json({ success: false, message: 'Staff account not found' });
    }

    if (targetAccount.role.toLowerCase() === 'admin') {
      const { count, error: adminCountError } = await supabaseAdmin
        .from('staff_accounts')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'Admin');

      if (adminCountError) {
        return res.status(500).json({ success: false, message: 'Unable to verify admin ownership' });
      }

      const adminSummary: CountRow = { count };

      if ((adminSummary.count ?? 0) <= 1) {
        return res.status(403).json({
          success: false,
          message: 'At least one admin account must remain active',
        });
      }
    }

    const { error: deleteError } = await supabaseAdmin
      .from('staff_accounts')
      .delete()
      .eq('id', targetId);

    if (deleteError) {
      return res.status(500).json({ success: false, message: 'Unable to delete staff account' });
    }

    return res.status(200).json({ success: true });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
}
