import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcrypt';
import { consumeRateLimit, peekRateLimit, resetRateLimit } from "../_lib/rateLimit.js";
import { getAuthTokenFromRequest, verifyToken, createStaffToken, requireStaffSession } from "../_lib/verifyToken.js";
import { ensureMethod, getClientIp, setAuthCookie, clearAuthCookie, setRetryAfterHeader } from "../_lib/http.js";
import { supabaseAdmin } from "../_lib/supabaseAdmin.js";
import { loginRequestSchema, registerRequestSchema, staffIdParamSchema } from "../_lib/validation.js";

// --- Rate Limits ---
const PUBLIC_RATE_LIMIT = { limit: 60, windowMs: 60_000 };
const FAILED_LOGIN_RATE_LIMIT = { limit: 5, windowMs: 15 * 60_000 };
const REGISTER_RATE_LIMIT = { limit: 3, windowMs: 60 * 60_000 };

// --- Types ---
interface StaffLoginRow { id: string; name: string; role: string; password_hash: string; }
interface StaffSessionInsertRow { token: string; staff_id: string; expires_at: string; }
interface StaffAccountRow { id: string; name: string; role: string; registered_at: string; }
interface SettingRow { value: string; }
interface StaffInsertRow { id: string; name: string; role: 'Staff'; password_hash: string; }
interface StaffRoleRow { role: string; }
interface CountRow { count: number | null; }

// --- Route Handlers ---

async function handleGetStaff(req: VercelRequest, res: VercelResponse) {
  if (!ensureMethod(req, res, ['GET'])) return;
  const session = await requireStaffSession(req, res, ['Admin']);
  if (!session) return;

  try {
    const { data, error } = await supabaseAdmin.from('staff_accounts').select('id, name, role, registered_at').order('registered_at', { ascending: false });
    if (error) return res.status(500).json({ success: false, message: 'Unable to fetch staff accounts' });

    const accounts = (data ?? []).map((account) => {
      const row = account as StaffAccountRow;
      return { id: row.id, name: row.name, role: row.role, registeredAt: row.registered_at };
    });
    return res.status(200).json({ success: true, accounts });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
}

async function handleGetMe(req: VercelRequest, res: VercelResponse) {
  if (!ensureMethod(req, res, ['GET'])) return;
  const token = getAuthTokenFromRequest(req);
  const session = await verifyToken(token ?? undefined);

  if (!session) return res.status(401).json({ success: false, message: 'Not authenticated' });

  return res.status(200).json({
    success: true,
    account: { id: session.account.id, name: session.account.name, role: session.account.role },
    token: session.token,
  });
}

async function handleLogin(req: VercelRequest, res: VercelResponse) {
  if (!ensureMethod(req, res, ['POST'])) return;
  const clientIp = getClientIp(req);
  
  const publicRateLimit = await consumeRateLimit({ key: `public:staff-login:${clientIp}`, ...PUBLIC_RATE_LIMIT });
  if (!publicRateLimit.allowed) {
    setRetryAfterHeader(res, publicRateLimit.retryAfterSeconds);
    return res.status(429).json({ success: false, message: 'Too many requests' });
  }

  const failedAttemptLimit = await peekRateLimit({ key: `failed-login:${clientIp}`, ...FAILED_LOGIN_RATE_LIMIT });
  if (!failedAttemptLimit.allowed) {
    setRetryAfterHeader(res, failedAttemptLimit.retryAfterSeconds);
    return res.status(429).json({ success: false, message: 'Too many failed login attempts' });
  }

  const parsedBody = loginRequestSchema.safeParse(req.body);
  if (!parsedBody.success) return res.status(400).json({ success: false, message: parsedBody.error.issues[0]?.message ?? 'Invalid request payload' });

  const { id, password } = parsedBody.data;

  try {
    const { data: account, error } = await supabaseAdmin.from('staff_accounts').select('id, name, role, password_hash').eq('id', id).single<StaffLoginRow>();

    if (error || !account) {
      await consumeRateLimit({ key: `failed-login:${clientIp}`, ...FAILED_LOGIN_RATE_LIMIT });
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, account.password_hash);
    if (!isPasswordValid) {
      const failedAttempt = await consumeRateLimit({ key: `failed-login:${clientIp}`, ...FAILED_LOGIN_RATE_LIMIT });
      setRetryAfterHeader(res, failedAttempt.retryAfterSeconds);
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    await resetRateLimit(`failed-login:${clientIp}`);

    const token = createStaffToken({ id: account.id, name: account.name, role: account.role });
    const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString();

    const { error: sessionError } = await supabaseAdmin.from('staff_sessions').insert<StaffSessionInsertRow>({ token, staff_id: account.id, expires_at: expiresAt });
    if (sessionError) return res.status(500).json({ success: false, message: 'Unable to create session' });

    setAuthCookie(res, token);
    return res.status(200).json({ success: true, token, account: { id: account.id, name: account.name, role: account.role } });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
}

async function handleLogout(req: VercelRequest, res: VercelResponse) {
  if (!ensureMethod(req, res, ['POST'])) return;
  const session = await requireStaffSession(req, res);
  if (!session) return;

  const token = getAuthTokenFromRequest(req);
  if (!token) {
    clearAuthCookie(res);
    return res.status(200).json({ success: true });
  }

  try {
    const { error } = await supabaseAdmin.from('staff_sessions').delete().eq('token', token);
    clearAuthCookie(res);
    if (error) return res.status(500).json({ success: false, message: 'Unable to logout' });
    return res.status(200).json({ success: true });
  } catch {
    clearAuthCookie(res);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
}

async function handleRegister(req: VercelRequest, res: VercelResponse) {
  if (!ensureMethod(req, res, ['POST'])) return;
  const clientIp = getClientIp(req);
  
  const publicRateLimit = await consumeRateLimit({ key: `public:staff-register:${clientIp}`, ...PUBLIC_RATE_LIMIT });
  if (!publicRateLimit.allowed) {
    setRetryAfterHeader(res, publicRateLimit.retryAfterSeconds);
    return res.status(429).json({ success: false, message: 'Too many requests' });
  }

  const registerRateLimit = await consumeRateLimit({ key: `staff-register:${clientIp}`, ...REGISTER_RATE_LIMIT });
  if (!registerRateLimit.allowed) {
    setRetryAfterHeader(res, registerRateLimit.retryAfterSeconds);
    return res.status(429).json({ success: false, message: 'Too many registration attempts' });
  }

  const parsedBody = registerRequestSchema.safeParse(req.body);
  if (!parsedBody.success) return res.status(400).json({ success: false, message: parsedBody.error.issues[0]?.message ?? 'Invalid request payload' });

  const { account: { id, name, password }, key } = parsedBody.data;

  try {
    const { data: setting, error: settingError } = await supabaseAdmin.from('settings').select('value').eq('key', 'establishment_key').single<SettingRow>();
    if (settingError || !setting || setting.value !== key) return res.status(401).json({ success: false, message: 'Invalid establishment key' });

    const passwordHash = await bcrypt.hash(password, 12);
    const { error: insertError } = await supabaseAdmin.from('staff_accounts').insert<StaffInsertRow>({ id, name, role: 'Staff', password_hash: passwordHash });

    if (insertError?.code === '23505') return res.status(409).json({ success: false, message: 'Staff ID already exists' });
    if (insertError) return res.status(500).json({ success: false, message: 'Unable to create staff account' });

    return res.status(201).json({ success: true, message: 'Registration successful' });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
}

async function handleDeleteById(req: VercelRequest, res: VercelResponse, targetIdRaw: string) {
  if (!ensureMethod(req, res, ['DELETE'])) return;
  const session = await requireStaffSession(req, res, ['Admin']);
  if (!session) return;

  const parsedParams = staffIdParamSchema.safeParse({ id: targetIdRaw });
  if (!parsedParams.success) return res.status(400).json({ success: false, message: parsedParams.error.issues[0]?.message ?? 'Invalid staff ID' });

  const targetId = parsedParams.data.id;
  if (targetId === session.account.id) return res.status(400).json({ success: false, message: 'You cannot remove your own account' });

  try {
    const { data: targetAccount, error: targetError } = await supabaseAdmin.from('staff_accounts').select('role').eq('id', targetId).single<StaffRoleRow>();
    if (targetError || !targetAccount) return res.status(404).json({ success: false, message: 'Staff account not found' });

    if (targetAccount.role.toLowerCase() === 'admin') {
      const { count, error: adminCountError } = await supabaseAdmin.from('staff_accounts').select('*', { count: 'exact', head: true }).eq('role', 'Admin');
      if (adminCountError) return res.status(500).json({ success: false, message: 'Unable to verify admin ownership' });

      const adminSummary: CountRow = { count };
      if ((adminSummary.count ?? 0) <= 1) return res.status(403).json({ success: false, message: 'At least one admin account must remain active' });
    }

    const { error: deleteError } = await supabaseAdmin.from('staff_accounts').delete().eq('id', targetId);
    if (deleteError) return res.status(500).json({ success: false, message: 'Unable to delete staff account' });

    return res.status(200).json({ success: true });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
}

// --- Main Router ---

const KNOWN_STAFF_ACTIONS = new Set(['login', 'logout', 'register', 'me', 'by-id']);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');

  // Prefer Vercel's injected query param, fall back to parsing req.url directly.
  // With the Vite framework preset, [[...action]] catch-all path params may not
  // be injected into req.query in production.
  const actionPath = req.query.action;
  let action: string | undefined = Array.isArray(actionPath) ? actionPath[0] : actionPath;
  let byIdTarget: string | undefined = Array.isArray(actionPath) ? actionPath[1] : undefined;

  if (!action) {
    // Parse from URL: e.g. /api/staff/login or /api/staff/by-id/alice
    const urlPath = (req.url ?? '').split('?')[0];
    const segments = urlPath.split('/').filter(Boolean);
    // segments: ['api', 'staff', 'login'] or ['api', 'staff', 'by-id', 'alice']
    const staffIndex = segments.lastIndexOf('staff');
    if (staffIndex !== -1 && segments[staffIndex + 1]) {
      const candidate = segments[staffIndex + 1];
      if (KNOWN_STAFF_ACTIONS.has(candidate)) {
        action = candidate;
        byIdTarget = segments[staffIndex + 2]; // staff ID after 'by-id'
      }
    }
  }

  if (action === 'by-id' && byIdTarget) {
    return handleDeleteById(req, res, byIdTarget);
  }

  switch (action) {
    case 'login':
      return handleLogin(req, res);
    case 'logout':
      return handleLogout(req, res);
    case 'register':
      return handleRegister(req, res);
    case 'me':
      return handleGetMe(req, res);
    case undefined:
      return handleGetStaff(req, res);
    default:
      return res.status(404).json({ success: false, message: 'Not Found' });
  }
}
