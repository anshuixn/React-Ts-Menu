/**
 * logger.ts — Structured server-side logging with optional Sentry capture.
 *
 * Usage in API handlers:
 *   import { logError } from "./_lib/logger.js";
 *   logError(err, { handler: 'orders/create', orderId });
 */
import * as Sentry from '@sentry/node';

let sentryInitialized = false;

function initSentry() {
  if (sentryInitialized) return;
  const dsn = process.env.SENTRY_DSN;
  if (dsn) {
    Sentry.init({
      dsn,
      environment: process.env.VERCEL_ENV ?? 'development',
      release: process.env.VERCEL_GIT_COMMIT_SHA,
      tracesSampleRate: 0.1,
    });
  }
  sentryInitialized = true;
}

export interface LogContext {
  handler?: string;
  [key: string]: unknown;
}

/**
 * Capture an error with optional context metadata.
 * In production, sends to Sentry. Always logs to stderr in dev.
 */
export function logError(err: unknown, context?: LogContext): void {
  initSentry();

  if (process.env.NODE_ENV !== 'production') {
    console.error('[AuraSpice Error]', context?.handler ?? '', err);
    return;
  }

  Sentry.withScope((scope) => {
    if (context) {
      scope.setExtras(context);
    }
    Sentry.captureException(err);
  });
}

/**
 * Log a warning (non-fatal).
 */
export function logWarn(message: string, context?: LogContext): void {
  if (process.env.NODE_ENV !== 'production') {
    console.warn('[AuraSpice Warn]', message, context ?? '');
  }
}
