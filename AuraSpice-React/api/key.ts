import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ensureMethod } from "./_lib/http.js";
import { supabaseAdmin } from "./_lib/supabaseAdmin.js";
import { updateEstablishmentKeySchema } from "./_lib/validation.js";
import { requireStaffSession } from "./_lib/verifyToken.js";

interface SettingRow {
  key: string;
  value: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!ensureMethod(req, res, ['GET', 'POST'])) {
    return;
  }

  res.setHeader('Cache-Control', 'no-store');

  const session = await requireStaffSession(req, res, ['Admin']);

  if (!session) {
    return;
  }

  if (req.method === 'GET') {
    try {
      const { data: setting, error } = await supabaseAdmin
        .from('settings')
        .select('key, value')
        .eq('key', 'establishment_key')
        .single<SettingRow>();

      if (error || !setting) {
        return res.status(404).json({ success: false, message: 'Establishment key not configured' });
      }

      return res.status(200).json({ success: true, key: setting.value });
    } catch {
      return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  }

  const parsedBody = updateEstablishmentKeySchema.safeParse(req.body);

  if (!parsedBody.success) {
    return res.status(400).json({
      success: false,
      message: parsedBody.error.issues[0]?.message ?? 'Invalid request payload',
    });
  }

  try {
    const { error } = await supabaseAdmin
      .from('settings')
      .upsert({
        key: 'establishment_key',
        value: parsedBody.data.key,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      return res.status(500).json({ success: false, message: 'Unable to update establishment key' });
    }

    return res.status(200).json({ success: true, key: parsedBody.data.key });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
}
