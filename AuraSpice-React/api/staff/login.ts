import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcrypt';
import { consumeRateLimit, peekRateLimit, resetRateLimit } from '../_lib/rateLimit';
import { createStaffToken } from '../_lib/verifyToken';
import { ensureMethod, getClientIp, setAuthCookie, setRetryAfterHeader } from '../_lib/http';
import { supabaseAdmin } from '../_lib/supabaseAdmin';
import { loginRequestSchema } from '../_lib/validation';

const PUBLIC_RATE_LIMIT = {
  limit: 60,
  windowMs: 60_000,
};

const FAILED_LOGIN_RATE_LIMIT = {
  limit: 5,
  windowMs: 15 * 60_000,
};

interface StaffLoginRow {
  id: string;
  name: string;
  role: string;
  password_hash: string;
}

interface StaffSessionInsertRow {
  token: string;
  staff_id: string;
  expires_at: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!ensureMethod(req, res, ['POST'])) {
    return;
  }

  res.setHeader('Cache-Control', 'no-store');

  const clientIp = getClientIp(req);
  const publicRateLimit = await consumeRateLimit({
    key: `public:staff-login:${clientIp}`,
    ...PUBLIC_RATE_LIMIT,
  });

  if (!publicRateLimit.allowed) {
    setRetryAfterHeader(res, publicRateLimit.retryAfterSeconds);
    return res.status(429).json({ success: false, message: 'Too many requests' });
  }

  const failedAttemptLimit = await peekRateLimit({
    key: `failed-login:${clientIp}`,
    ...FAILED_LOGIN_RATE_LIMIT,
  });

  if (!failedAttemptLimit.allowed) {
    setRetryAfterHeader(res, failedAttemptLimit.retryAfterSeconds);
    return res.status(429).json({ success: false, message: 'Too many failed login attempts' });
  }

  const parsedBody = loginRequestSchema.safeParse(req.body);

  if (!parsedBody.success) {
    return res.status(400).json({
      success: false,
      message: parsedBody.error.issues[0]?.message ?? 'Invalid request payload',
    });
  }

  const { id, password } = parsedBody.data;

  try {
    const { data: account, error } = await supabaseAdmin
      .from('staff_accounts')
      .select('id, name, role, password_hash')
      .eq('id', id)
      .single<StaffLoginRow>();

    if (error || !account) {
      await consumeRateLimit({
        key: `failed-login:${clientIp}`,
        ...FAILED_LOGIN_RATE_LIMIT,
      });
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, account.password_hash);

    if (!isPasswordValid) {
      const failedAttempt = await consumeRateLimit({
        key: `failed-login:${clientIp}`,
        ...FAILED_LOGIN_RATE_LIMIT,
      });
      setRetryAfterHeader(res, failedAttempt.retryAfterSeconds);
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    await resetRateLimit(`failed-login:${clientIp}`);

    const token = createStaffToken({
      id: account.id,
      name: account.name,
      role: account.role,
    });

    const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString();

    const { error: sessionError } = await supabaseAdmin
      .from('staff_sessions')
      .insert<StaffSessionInsertRow>({
        token,
        staff_id: account.id,
        expires_at: expiresAt,
      });

    if (sessionError) {
      return res.status(500).json({ success: false, message: 'Unable to create session' });
    }

    setAuthCookie(res, token);

    return res.status(200).json({
      success: true,
      token,
      account: {
        id: account.id,
        name: account.name,
        role: account.role,
      },
    });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
}
