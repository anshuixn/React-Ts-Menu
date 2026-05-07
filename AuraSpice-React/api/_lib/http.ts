import type { VercelRequest, VercelResponse } from '@vercel/node';
import { parse, serialize } from 'cookie';
import {
  AUTH_COOKIE_NAME,
  AUTH_SESSION_TTL_SECONDS,
  getAllowedOrigins,
  isProductionEnvironment,
} from "./env.js";

const DEFAULT_ALLOWED_HEADERS = ['Authorization', 'Content-Type'];

export function setSecurityHeaders(res: VercelResponse) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
}

function getNormalizedOrigin(origin: string): string {
  return origin.trim().replace(/\/$/, '');
}

export function isAllowedOrigin(origin: string): boolean {
  const normalizedOrigin = getNormalizedOrigin(origin);
  
  if (!isProductionEnvironment()) {
    if (
      normalizedOrigin.startsWith('http://192.168.') || 
      normalizedOrigin.startsWith('http://10.') || 
      normalizedOrigin.startsWith('http://172.') ||
      normalizedOrigin === 'http://localhost:5173' ||
      normalizedOrigin === 'http://localhost:5174'
    ) {
      return true;
    }
  }

  return getAllowedOrigins().some(
    (allowedOrigin) => getNormalizedOrigin(allowedOrigin) === normalizedOrigin,
  );
}

export function applyCors(
  req: VercelRequest,
  res: VercelResponse,
  allowedMethods: string[],
  allowedHeaders: string[] = DEFAULT_ALLOWED_HEADERS,
): boolean {
  setSecurityHeaders(res);
  res.setHeader('Vary', 'Origin');

  const requestOrigin = typeof req.headers.origin === 'string' ? req.headers.origin : undefined;

  if (requestOrigin) {
    if (!isAllowedOrigin(requestOrigin)) {
      res.status(403).json({ success: false, message: 'Origin not allowed' });
      return false;
    }

    res.setHeader('Access-Control-Allow-Origin', requestOrigin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  res.setHeader('Access-Control-Allow-Methods', allowedMethods.join(', '));
  res.setHeader('Access-Control-Allow-Headers', allowedHeaders.join(', '));

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return false;
  }

  return true;
}

export function ensureMethod(
  req: VercelRequest,
  res: VercelResponse,
  allowedMethods: string[],
): boolean {
  if (!applyCors(req, res, allowedMethods)) {
    return false;
  }

  const method = req.method ?? 'GET';

  if (!allowedMethods.includes(method)) {
    res.setHeader('Allow', allowedMethods.join(', '));
    res.status(405).json({ success: false, message: 'Method Not Allowed' });
    return false;
  }

  return true;
}

export function getCookieToken(req: VercelRequest): string | null {
  const cookieHeader = req.headers.cookie;

  if (!cookieHeader) {
    return null;
  }

  const cookies = parse(cookieHeader);
  return cookies[AUTH_COOKIE_NAME] ?? null;
}

export function setAuthCookie(res: VercelResponse, token: string) {
  res.setHeader(
    'Set-Cookie',
    serialize(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: isProductionEnvironment(),
      sameSite: 'strict',
      path: '/',
      maxAge: AUTH_SESSION_TTL_SECONDS,
    }),
  );
}

export function clearAuthCookie(res: VercelResponse) {
  res.setHeader(
    'Set-Cookie',
    serialize(AUTH_COOKIE_NAME, '', {
      httpOnly: true,
      secure: isProductionEnvironment(),
      sameSite: 'strict',
      path: '/',
      maxAge: 0,
    }),
  );
}

export function getClientIp(req: VercelRequest): string {
  const forwardedFor = req.headers['x-forwarded-for'];

  if (typeof forwardedFor === 'string' && forwardedFor.length > 0) {
    return forwardedFor.split(',')[0]?.trim() ?? 'unknown';
  }

  const realIp = req.headers['x-real-ip'];
  return typeof realIp === 'string' && realIp.length > 0 ? realIp : 'unknown';
}

export function setRetryAfterHeader(res: VercelResponse, retryAfterSeconds: number) {
  res.setHeader('Retry-After', String(Math.max(1, Math.ceil(retryAfterSeconds))));
}
