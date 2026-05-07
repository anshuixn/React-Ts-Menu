import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcrypt';
import { consumeRateLimit } from '../_lib/rateLimit';
import { ensureMethod, getClientIp, setRetryAfterHeader } from '../_lib/http';
import { supabaseAdmin } from '../_lib/supabaseAdmin';
import { registerRequestSchema } from '../_lib/validation';

const PUBLIC_RATE_LIMIT = {
  limit: 60,
  windowMs: 60_000,
};

const REGISTER_RATE_LIMIT = {
  limit: 3,
  windowMs: 60 * 60_000,
};

interface SettingRow {
  value: string;
}

interface StaffInsertRow {
  id: string;
  name: string;
  role: 'Staff';
  password_hash: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!ensureMethod(req, res, ['POST'])) {
    return;
  }

  res.setHeader('Cache-Control', 'no-store');

  const clientIp = getClientIp(req);
  const publicRateLimit = await consumeRateLimit({
    key: `public:staff-register:${clientIp}`,
    ...PUBLIC_RATE_LIMIT,
  });

  if (!publicRateLimit.allowed) {
    setRetryAfterHeader(res, publicRateLimit.retryAfterSeconds);
    return res.status(429).json({ success: false, message: 'Too many requests' });
  }

  const registerRateLimit = await consumeRateLimit({
    key: `staff-register:${clientIp}`,
    ...REGISTER_RATE_LIMIT,
  });

  if (!registerRateLimit.allowed) {
    setRetryAfterHeader(res, registerRateLimit.retryAfterSeconds);
    return res.status(429).json({ success: false, message: 'Too many registration attempts' });
  }

  const parsedBody = registerRequestSchema.safeParse(req.body);

  if (!parsedBody.success) {
    return res.status(400).json({
      success: false,
      message: parsedBody.error.issues[0]?.message ?? 'Invalid request payload',
    });
  }

  const {
    account: { id, name, password },
    key,
  } = parsedBody.data;

  try {
    const { data: setting, error: settingError } = await supabaseAdmin
      .from('settings')
      .select('value')
      .eq('key', 'establishment_key')
      .single<SettingRow>();

    if (settingError || !setting || setting.value !== key) {
      return res.status(401).json({ success: false, message: 'Invalid establishment key' });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const { error: insertError } = await supabaseAdmin
      .from('staff_accounts')
      .insert<StaffInsertRow>({
        id,
        name,
        role: 'Staff',
        password_hash: passwordHash,
      });

    if (insertError?.code === '23505') {
      return res.status(409).json({ success: false, message: 'Staff ID already exists' });
    }

    if (insertError) {
      return res.status(500).json({ success: false, message: 'Unable to create staff account' });
    }

    return res.status(201).json({ success: true, message: 'Registration successful' });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
}
