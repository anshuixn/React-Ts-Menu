import { beforeEach, describe, expect, it, vi } from 'vitest';
import handler from './[[...action]].js';

const { consumeRateLimitMock, getSupabaseAdminMock, fromMock } = vi.hoisted(() => ({
  consumeRateLimitMock: vi.fn(),
  getSupabaseAdminMock: vi.fn(),
  fromMock: vi.fn(),
}));

vi.mock('../_lib/rateLimit.js', () => ({
  consumeRateLimit: consumeRateLimitMock,
}));

vi.mock('../_lib/supabaseAdmin.js', () => ({
  getSupabaseAdmin: getSupabaseAdminMock,
  supabaseAdmin: { from: fromMock },
}));

vi.mock('../_lib/verifyToken.js', () => ({
  requireStaffSession: vi.fn(),
}));

function createResponse() {
  const headers = new Map<string, string>();
  const res = {
    statusCode: 200,
    body: undefined as unknown,
    setHeader: vi.fn((key: string, value: string) => {
      headers.set(key, value);
      return res;
    }),
    status: vi.fn((code: number) => {
      res.statusCode = code;
      return res;
    }),
    json: vi.fn((body: unknown) => {
      res.body = body;
      return res;
    }),
    end: vi.fn(() => res),
    headers,
  };

  return res;
}

function createRequest(query: Record<string, string | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value) search.set(key, value);
  }

  return {
    method: 'GET',
    query: { action: 'status', ...query },
    url: `/api/orders/status?${search.toString()}`,
    headers: {
      'x-forwarded-for': '203.0.113.10',
      origin: 'http://localhost:5173',
    },
  };
}

function mockStatusQuery(order: { id: string; table_number: string; status: string } | null) {
  const single = vi.fn(async () =>
    order
      ? { data: order, error: null }
      : { data: null, error: { message: 'not found' } },
  );
  const eqToken = vi.fn(() => ({ single }));
  const eqTable = vi.fn(() => ({ eq: eqToken }));
  const eqId = vi.fn(() => ({ eq: eqTable }));
  const select = vi.fn(() => ({ eq: eqId }));

  fromMock.mockReturnValue({ select });

  return { select, eqId, eqTable, eqToken, single };
}

describe('orders API status route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    consumeRateLimitMock.mockResolvedValue({ allowed: true, remaining: 59, retryAfterSeconds: 0 });
    getSupabaseAdminMock.mockReturnValue({ from: fromMock });
  });

  it('rejects public status lookups without a tracking token', async () => {
    const req = createRequest({ id: 'ORD-123', table: '12' });
    const res = createResponse();

    await handler(req as never, res as never);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Tracking token is required',
    });
    expect(fromMock).not.toHaveBeenCalled();
  });

  it('returns 404 when the tracking token does not match the order', async () => {
    mockStatusQuery(null);
    const req = createRequest({ id: 'ORD-123', table: '12', token: 'wrong-token' });
    const res = createResponse();

    await handler(req as never, res as never);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Order not found' });
  });

  it('returns status only when id, table, and tracking token all match', async () => {
    const query = mockStatusQuery({ id: 'ORD-123', table_number: '12', status: 'cooking' });
    const req = createRequest({ id: 'ORD-123', table: '12', token: 'tracking-token-123' });
    const res = createResponse();

    await handler(req as never, res as never);

    expect(query.eqId).toHaveBeenCalledWith('id', 'ORD-123');
    expect(query.eqTable).toHaveBeenCalledWith('table_number', '12');
    expect(query.eqToken).toHaveBeenCalledWith('tracking_token', 'tracking-token-123');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, status: 'cooking' });
  });
});
