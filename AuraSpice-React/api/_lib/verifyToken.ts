import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import { AUTH_SESSION_TTL_SECONDS, getServerEnv } from "./env.js";
import { clearAuthCookie, getCookieToken } from "./http.js";
import { supabaseAdmin } from "./supabaseAdmin.js";

interface StaffSessionRow {
  staff_id: string;
  expires_at: string;
}

interface StaffAccountRow {
  id: string;
  name: string;
  role: string;
}

interface StaffTokenClaims extends jwt.JwtPayload {
  sub: string;
  role: string;
  name: string;
}

export interface VerifiedStaffSession {
  account: StaffAccountRow;
  expiresAt: string;
  token: string;
}

function isStaffTokenClaims(payload: string | jwt.JwtPayload): payload is StaffTokenClaims {
  return (
    typeof payload !== 'string' &&
    typeof payload.sub === 'string' &&
    typeof payload.role === 'string' &&
    typeof payload.name === 'string'
  );
}

function normalizeRole(role: string): string {
  return role.trim().toLowerCase();
}

async function deleteSession(token: string) {
  await supabaseAdmin.from('staff_sessions').delete().eq('token', token);
}

export function createStaffToken(account: StaffAccountRow): string {
  const { jwtSecret } = getServerEnv();

  return jwt.sign(
    {
      sub: account.id,
      role: account.role,
      name: account.name,
    },
    jwtSecret,
    {
      expiresIn: AUTH_SESSION_TTL_SECONDS,
    },
  );
}

export function getAuthTokenFromRequest(req: VercelRequest): string | null {
  const authorizationHeader = req.headers.authorization;

  if (typeof authorizationHeader === 'string' && authorizationHeader.startsWith('Bearer ')) {
    return authorizationHeader.slice('Bearer '.length).trim();
  }

  const legacyHeader = req.headers['x-staff-token'];

  if (typeof legacyHeader === 'string' && legacyHeader.trim().length > 0) {
    return legacyHeader.trim();
  }

  return getCookieToken(req);
}

export async function verifyToken(token: string | string[] | undefined): Promise<VerifiedStaffSession | null> {
  if (!token || typeof token !== 'string') {
    return null;
  }

  try {
    const { jwtSecret } = getServerEnv();
    const decoded = jwt.verify(token, jwtSecret);

    if (!isStaffTokenClaims(decoded)) {
      await deleteSession(token);
      return null;
    }

    const { data: session, error: sessionError } = await supabaseAdmin
      .from('staff_sessions')
      .select('staff_id, expires_at')
      .eq('token', token)
      .single<StaffSessionRow>();

    if (sessionError || !session) {
      return null;
    }

    if (session.staff_id !== decoded.sub || new Date(session.expires_at) <= new Date()) {
      await deleteSession(token);
      return null;
    }

    const { data: account, error: accountError } = await supabaseAdmin
      .from('staff_accounts')
      .select('id, name, role')
      .eq('id', decoded.sub)
      .single<StaffAccountRow>();

    if (accountError || !account) {
      await deleteSession(token);
      return null;
    }

    return {
      account,
      expiresAt: session.expires_at,
      token,
    };
  } catch {
    return null;
  }
}

export async function requireStaffSession(
  req: VercelRequest,
  res: VercelResponse,
  allowedRoles?: string[],
): Promise<VerifiedStaffSession | null> {
  const token = getAuthTokenFromRequest(req);
  const session = await verifyToken(token ?? undefined);

  if (!session) {
    clearAuthCookie(res);
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return null;
  }

  if (
    allowedRoles &&
    !allowedRoles.some((allowedRole) => normalizeRole(allowedRole) === normalizeRole(session.account.role))
  ) {
    res.status(403).json({ success: false, message: 'Forbidden' });
    return null;
  }

  return session;
}
