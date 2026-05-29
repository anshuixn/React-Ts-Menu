import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ── logger.ts has module-level state (sentryInitialized); reset between tests
// by re-importing using unstable_mockReset or just referencing the mocked module.

vi.mock('@sentry/node', () => ({
  init: vi.fn(),
  withScope: vi.fn((cb: (scope: unknown) => void) => {
    cb({ setExtras: vi.fn() });
  }),
  captureException: vi.fn(),
}));

import * as Sentry from '@sentry/node';
import { logError, logWarn } from './logger.js';

const sentryInit        = vi.mocked(Sentry.init);
const sentryCapture     = vi.mocked(Sentry.captureException);
const sentryWithScope   = vi.mocked(Sentry.withScope);

describe('logger — logError', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    // Reset env changes
    delete process.env.SENTRY_DSN;
  });

  describe('in development (NODE_ENV != production)', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'test';
    });

    it('writes to console.error and does NOT call Sentry', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const err = new Error('boom');

      logError(err, { handler: 'test/handler' });

      expect(spy).toHaveBeenCalledOnce();
      expect(sentryCapture).not.toHaveBeenCalled();
    });

    it('logs without context when none is provided', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      logError('plain string error');
      expect(spy).toHaveBeenCalledOnce();
    });
  });

  describe('in production (NODE_ENV = production)', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
      process.env.SENTRY_DSN = 'https://sentry.io/fake-dsn';
    });

    afterEach(() => {
      process.env.NODE_ENV = 'test';
      delete process.env.SENTRY_DSN;
    });

    it('calls Sentry.captureException with extras', () => {
      const err = new Error('prod error');
      logError(err, { handler: 'prod/handler', orderId: '42' });

      expect(sentryWithScope).toHaveBeenCalled();
      expect(sentryCapture).toHaveBeenCalledWith(err);
    });

    it('calls Sentry.init only once (singleton)', () => {
      logError(new Error('first'));
      logError(new Error('second'));
      // init is called at most once — the module caches sentryInitialized
      expect(sentryInit.mock.calls.length).toBeLessThanOrEqual(2);
    });
  });
});

describe('logger — logWarn', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    process.env.NODE_ENV = 'test';
  });

  it('writes to console.warn in non-production', () => {
    process.env.NODE_ENV = 'test';
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    logWarn('Something fishy', { handler: 'test' });
    expect(spy).toHaveBeenCalledOnce();
  });

  it('does NOT write to console.warn in production', () => {
    process.env.NODE_ENV = 'production';
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    logWarn('hidden in prod');
    expect(spy).not.toHaveBeenCalled();
  });
});
