import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MENU_PRICE_MAP, getMenuItem, MENU_ITEM_COUNT } from '../_lib/menuPrices.js';

// ─── menuPrices unit tests ────────────────────────────────────────────────────

describe('menuPrices — server-side price map', () => {
  it('contains exactly 29 menu items', () => {
    expect(MENU_ITEM_COUNT).toBe(29);
    expect(MENU_PRICE_MAP.size).toBe(29);
  });

  it('has contiguous IDs from 1 to 29', () => {
    for (let id = 1; id <= 29; id++) {
      expect(MENU_PRICE_MAP.has(id), `ID ${id} should exist`).toBe(true);
    }
  });

  it('returns undefined for unknown IDs', () => {
    expect(getMenuItem(0)).toBeUndefined();
    expect(getMenuItem(30)).toBeUndefined();
    expect(getMenuItem(-1)).toBeUndefined();
    expect(getMenuItem(99)).toBeUndefined();
  });

  it('returns the correct item for known IDs', () => {
    const item5 = getMenuItem(5);
    expect(item5).toBeDefined();
    expect(item5!.name).toBe('Veg Manchurian');
    expect(item5!.price).toBe(209);
    expect(item5!.category).toBe('chinese');

    const item10 = getMenuItem(10);
    expect(item10).toBeDefined();
    expect(item10!.name).toBe('Paneer Butter Masala');
    expect(item10!.price).toBe(299);
    expect(item10!.category).toBe('north-indian');
  });

  it('all items have positive prices', () => {
    for (const [id, item] of MENU_PRICE_MAP) {
      expect(item.price, `ID ${id} (${item.name}) should have positive price`).toBeGreaterThan(0);
    }
  });

  it('all items have non-empty names', () => {
    for (const [, item] of MENU_PRICE_MAP) {
      expect(item.name.trim().length).toBeGreaterThan(0);
    }
  });

  it('all items have valid category values', () => {
    const validCategories = new Set(['chinese', 'north-indian', 'south-indian', 'fast-food', 'beverages']);
    for (const [id, item] of MENU_PRICE_MAP) {
      expect(validCategories.has(item.category), `ID ${id} has invalid category: ${item.category}`).toBe(true);
    }
  });

  it('category breakdown matches the menu spec', () => {
    const byCat: Record<string, number> = {};
    for (const [, item] of MENU_PRICE_MAP) {
      byCat[item.category] = (byCat[item.category] ?? 0) + 1;
    }
    expect(byCat['chinese']).toBe(8);
    expect(byCat['north-indian']).toBe(5);
    expect(byCat['south-indian']).toBe(5);
    expect(byCat['fast-food']).toBe(6);
    expect(byCat['beverages']).toBe(5);
  });

  it('matches the frontend menuData prices for key items (regression)', () => {
    // These are the items that triggered the "not found" errors in production.
    // If these prices ever diverge from menuData.ts, this test will catch it.
    const regressionItems: Array<[number, string, number]> = [
      [5,  'Veg Manchurian',       209],
      [10, 'Paneer Butter Masala', 299],
      [13, 'Garlic Naan',           69],
      [18, 'Filter Coffee',         79],
      [25, 'Virgin Mojito',        159],
      [29, 'Fresh Lime Soda',       89],
    ];
    for (const [id, name, price] of regressionItems) {
      const item = getMenuItem(id);
      expect(item, `Item ${id} should exist`).toBeDefined();
      expect(item!.name).toBe(name);
      expect(item!.price).toBe(price);
    }
  });
});

// ─── Order create integration tests ──────────────────────────────────────────

const { consumeRateLimitMock, getSupabaseAdminMock, fromMock, insertMock } = vi.hoisted(() => ({
  consumeRateLimitMock: vi.fn(),
  getSupabaseAdminMock: vi.fn(),
  fromMock: vi.fn(),
  insertMock: vi.fn(),
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
  const res = {
    statusCode: 200,
    body: undefined as unknown,
    setHeader: vi.fn(() => res),
    status: vi.fn((code: number) => { res.statusCode = code; return res; }),
    json: vi.fn((body: unknown) => { res.body = body; return res; }),
    end: vi.fn(() => res),
  };
  return res;
}

function createCreateRequest(items: Array<{ id: number; qty: number }>, tableNumber = 'T-7') {
  return {
    method: 'POST',
    query: { action: 'create' },
    url: '/api/orders/create',
    headers: { 'x-forwarded-for': '203.0.113.10', origin: 'http://localhost:5173' },
    body: { table_number: tableNumber, items },
  };
}

describe('orders API — create route (price-map fix regression)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    consumeRateLimitMock.mockResolvedValue({ allowed: true, remaining: 29, retryAfterSeconds: 0 });

    // Mock the insert to succeed
    insertMock.mockResolvedValue({ error: null });
    fromMock.mockReturnValue({ insert: insertMock });
    getSupabaseAdminMock.mockReturnValue({ from: fromMock });
  });

  it('successfully creates an order with valid item IDs (no DB menu lookup)', async () => {
    const handler = (await import('./[[...action]].js')).default;
    const req = createCreateRequest([
      { id: 5,  qty: 2 },  // Veg Manchurian — was failing before fix
      { id: 10, qty: 1 },  // Paneer Butter Masala — was failing before fix
    ]);
    const res = createResponse();

    await handler(req as never, res as never);

    expect(res.statusCode).toBe(201);
    expect((res.body as { success: boolean }).success).toBe(true);
    // Verify prices came from server-side map, not DB
    const order = (res.body as { order: { items: Array<{ id: number; price: number; name: string }> } }).order;
    const item5 = order.items.find((i) => i.id === 5);
    const item10 = order.items.find((i) => i.id === 10);
    expect(item5?.price).toBe(209);   // Veg Manchurian
    expect(item10?.price).toBe(299);  // Paneer Butter Masala
    expect(item5?.name).toBe('Veg Manchurian');
    expect(item10?.name).toBe('Paneer Butter Masala');
  });

  it('rejects order with invalid/unknown item ID (tamper protection)', async () => {
    const handler = (await import('./[[...action]].js')).default;
    const req = createCreateRequest([{ id: 999, qty: 1 }]);
    const res = createResponse();

    await handler(req as never, res as never);

    expect(res.statusCode).toBe(400);
    expect((res.body as { message: string }).message).toContain('999');
    // Verify the DB insert was never called (fail fast)
    expect(insertMock).not.toHaveBeenCalled();
  });

  it('calculates the correct total from server-side prices', async () => {
    const handler = (await import('./[[...action]].js')).default;
    // Butter Chicken (id=9, ₹349 × 2) + Garlic Naan (id=13, ₹69 × 3) = 698 + 207 = ₹905
    const req = createCreateRequest([
      { id: 9,  qty: 2 },
      { id: 13, qty: 3 },
    ]);
    const res = createResponse();

    await handler(req as never, res as never);

    expect(res.statusCode).toBe(201);
    const order = (res.body as { order: { total: number } }).order;
    expect(order.total).toBe(349 * 2 + 69 * 3); // 905
  });

  it('rejects order with item ID 0 (boundary)', async () => {
    const handler = (await import('./[[...action]].js')).default;
    const req = createCreateRequest([{ id: 0, qty: 1 }]);
    const res = createResponse();

    await handler(req as never, res as never);

    // id: 0 fails zod (positive integer) before reaching the price map
    expect(res.statusCode).toBe(400);
  });

  it('returns 503 when Supabase is not configured', async () => {
    getSupabaseAdminMock.mockReturnValue(null);
    const handler = (await import('./[[...action]].js')).default;
    const req = createCreateRequest([{ id: 1, qty: 1 }]);
    const res = createResponse();

    await handler(req as never, res as never);

    expect(res.statusCode).toBe(503);
  });
});
