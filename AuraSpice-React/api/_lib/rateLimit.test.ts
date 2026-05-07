import { beforeEach, describe, expect, it, vi } from 'vitest';
import { consumeRateLimit, peekRateLimit, resetRateLimit } from "./rateLimit.js";

describe('rateLimit', () => {
  beforeEach(() => {
    vi.useRealTimers();
    void resetRateLimit('test-key');
  });

  it('allows requests until the configured limit is reached', async () => {
    expect((await consumeRateLimit({ key: 'test-key', limit: 2, windowMs: 1_000 })).allowed).toBe(true);
    expect((await consumeRateLimit({ key: 'test-key', limit: 2, windowMs: 1_000 })).allowed).toBe(true);
    expect((await consumeRateLimit({ key: 'test-key', limit: 2, windowMs: 1_000 })).allowed).toBe(false);
  });

  it('reports remaining requests without consuming the limit', async () => {
    await consumeRateLimit({ key: 'test-key', limit: 3, windowMs: 1_000 });

    const snapshot = await peekRateLimit({ key: 'test-key', limit: 3, windowMs: 1_000 });

    expect(snapshot.allowed).toBe(true);
    expect(snapshot.remaining).toBe(2);
  });

  it('resets a rate limit entry on demand', async () => {
    await consumeRateLimit({ key: 'test-key', limit: 1, windowMs: 1_000 });
    await resetRateLimit('test-key');

    const result = await consumeRateLimit({ key: 'test-key', limit: 1, windowMs: 1_000 });

    expect(result.allowed).toBe(true);
  });
});
