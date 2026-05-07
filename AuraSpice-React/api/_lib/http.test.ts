import type { VercelRequest, VercelResponse } from '@vercel/node';
import { afterEach, describe, expect, it } from 'vitest';
import {
  applyCors,
  clearAuthCookie,
  ensureMethod,
  getClientIp,
  getCookieToken,
  isAllowedOrigin,
  setAuthCookie,
  setRetryAfterHeader,
  setSecurityHeaders,
} from "./http.js";

const originalEnv = { ...process.env };

function createResponseMock() {
  const headers = new Map<string, string>();
  let statusCode = 200;
  let jsonBody: unknown = null;
  let ended = false;

  const response = {
    setHeader(key: string, value: string) {
      headers.set(key, value);
      return response;
    },
    status(code: number) {
      statusCode = code;
      return response;
    },
    json(body: unknown) {
      jsonBody = body;
      return response;
    },
    end() {
      ended = true;
      return response;
    },
  };

  return {
    headers,
    get statusCode() {
      return statusCode;
    },
    get jsonBody() {
      return jsonBody;
    },
    get ended() {
      return ended;
    },
    response: response as unknown as VercelResponse,
  };
}

afterEach(() => {
  process.env = { ...originalEnv };
});

describe('http helpers', () => {
  it('accepts configured origins and normalizes trailing slashes', () => {
    process.env.ALLOWED_ORIGINS = 'https://auraspice.app';

    expect(isAllowedOrigin('https://auraspice.app/')).toBe(true);
    expect(isAllowedOrigin('https://example.com')).toBe(false);
  });

  it('applies CORS headers for allowed origins', () => {
    process.env.ALLOWED_ORIGINS = 'https://auraspice.app';
    const resMock = createResponseMock();
    const request = {
      method: 'POST',
      headers: { origin: 'https://auraspice.app' },
    } as unknown as VercelRequest;

    const allowed = applyCors(request, resMock.response, ['POST']);

    expect(allowed).toBe(true);
    expect(resMock.headers.get('Access-Control-Allow-Origin')).toBe('https://auraspice.app');
    expect(resMock.headers.get('X-Frame-Options')).toBe('DENY');
  });

  it('blocks requests from disallowed origins', () => {
    process.env.ALLOWED_ORIGINS = 'https://auraspice.app';
    const resMock = createResponseMock();
    const request = {
      method: 'POST',
      headers: { origin: 'https://malicious.app' },
    } as unknown as VercelRequest;

    const allowed = applyCors(request, resMock.response, ['POST']);

    expect(allowed).toBe(false);
    expect(resMock.statusCode).toBe(403);
    expect(resMock.jsonBody).toEqual({ success: false, message: 'Origin not allowed' });
  });

  it('handles preflight and method rejections', () => {
    process.env.ALLOWED_ORIGINS = 'https://auraspice.app';

    const optionsResponse = createResponseMock();
    const optionsRequest = {
      method: 'OPTIONS',
      headers: { origin: 'https://auraspice.app' },
    } as unknown as VercelRequest;

    expect(ensureMethod(optionsRequest, optionsResponse.response, ['POST'])).toBe(false);
    expect(optionsResponse.statusCode).toBe(204);
    expect(optionsResponse.ended).toBe(true);

    const methodResponse = createResponseMock();
    const methodRequest = {
      method: 'GET',
      headers: { origin: 'https://auraspice.app' },
    } as unknown as VercelRequest;

    expect(ensureMethod(methodRequest, methodResponse.response, ['POST'])).toBe(false);
    expect(methodResponse.statusCode).toBe(405);
    expect(methodResponse.headers.get('Allow')).toBe('POST');
  });

  it('parses auth cookies and IP headers', () => {
    const request = {
      headers: {
        cookie: 'aura_staff_session=test-token; other=value',
        'x-forwarded-for': '10.0.0.1, 10.0.0.2',
      },
    } as unknown as VercelRequest;

    expect(getCookieToken(request)).toBe('test-token');
    expect(getClientIp(request)).toBe('10.0.0.1');
  });

  it('serializes auth cookies, retry-after, and security headers', () => {
    process.env.NODE_ENV = 'production';
    const resMock = createResponseMock();

    setAuthCookie(resMock.response, 'jwt-token');
    expect(resMock.headers.get('Set-Cookie')).toContain('aura_staff_session=jwt-token');
    expect(resMock.headers.get('Set-Cookie')).toContain('HttpOnly');
    expect(resMock.headers.get('Set-Cookie')).toContain('Secure');

    clearAuthCookie(resMock.response);
    expect(resMock.headers.get('Set-Cookie')).toContain('Max-Age=0');

    setRetryAfterHeader(resMock.response, 1.2);
    expect(resMock.headers.get('Retry-After')).toBe('2');

    setSecurityHeaders(resMock.response);
    expect(resMock.headers.get('Permissions-Policy')).toBe('camera=(), microphone=(), geolocation=()');
  });
});
