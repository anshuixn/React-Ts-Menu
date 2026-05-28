/**
 * useOrderPolling.ts
 *
 * AGENT 6  — Initial HTTP fetch to hydrate status from server
 * AGENT 7  — Supabase Realtime subscription for live WebSocket updates
 * AGENT 8  — HTTP polling FALLBACK every 20s (mobile / weak network resilience)
 * AGENT 9  — Auto-clear polling when realtime comes back online
 * AGENT 10 — Exponential backoff on fetch failure; clears on success
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { isSupabaseConfigured } from '../lib/envValidation';
import { realtimeManager } from '../lib/realtimeManager';
import type { OrderStatus, TrackerState } from '../types';

const trackerStates: Record<OrderStatus, TrackerState> = {
  new: {
    title: 'Order Received',
    desc: 'The kitchen has received your order and will start preparing it shortly.',
    color: 'var(--status-new)',
  },
  cooking: {
    title: 'Chef is Cooking',
    desc: 'Your meal is being prepared with care and passion.',
    color: 'var(--status-cooking)',
  },
  ready: {
    title: 'Your Meal is on the Way',
    desc: 'A waiter is bringing your food to your table. Bon appétit!',
    color: 'var(--status-ready)',
  },
  completed: {
    title: 'Enjoy Your Meal',
    desc: 'We hope you love it. Let us know if you need anything else.',
    color: 'var(--text-muted)',
  },
};

interface OrderStatusResponse {
  success?: boolean;
  message?: string;
  status?: OrderStatus;
}

// AGENT 8 — Polling interval when realtime is unavailable
const FALLBACK_POLL_INTERVAL_MS = 20_000; // 20 seconds

export function useOrderPolling(
  currentOrderId: string | null,
  tableNumber: string | null,
  trackingToken: string | null = null,
) {
  const [status, setStatus] = useState<OrderStatus | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const initialFetchDone = useRef(false);
  // AGENT 8 — Track if realtime is actively receiving updates
  const realtimeReceivedRef = useRef(false);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // AGENT 10 — Track consecutive fetch failures for backoff
  const failCountRef = useRef(0);

  // AGENT 6 — Shared fetch function (used by initial fetch + fallback poller)
  const fetchStatus = useCallback(async (signal?: AbortSignal) => {
    if (!currentOrderId || !tableNumber) return;
    try {
      const query = new URLSearchParams({ id: currentOrderId, table: tableNumber });
      if (trackingToken) query.set('token', trackingToken);
      const response = await fetch(`/api/orders/status?${query.toString()}`, { signal });
      if (signal?.aborted) return;
      const payload = await response.json() as OrderStatusResponse;

      if (!response.ok || !payload.success || !payload.status) {
        throw new Error(payload.message ?? 'Unable to fetch order status');
      }

      setStatus(payload.status);
      setIsConnected(true);
      initialFetchDone.current = true;
      // AGENT 10 — Reset failure counter on success
      failCountRef.current = 0;
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      // AGENT 10 — Increment failure count; don't show disconnected on first attempt
      failCountRef.current++;
      if (failCountRef.current > 1) {
        setIsConnected(false);
      }
    }
  }, [currentOrderId, tableNumber, trackingToken]);

  // AGENT 6 — Initial HTTP fetch to hydrate state immediately
  useEffect(() => {
    if (!currentOrderId || !tableNumber) {
      setStatus(null);
      setIsConnected(false);
      initialFetchDone.current = false;
      realtimeReceivedRef.current = false;
      return;
    }

    const controller = new AbortController();
    void fetchStatus(controller.signal);

    return () => {
      controller.abort();
    };
  }, [currentOrderId, tableNumber, fetchStatus]);

  // AGENT 7 — Supabase Realtime subscription for instant live updates
  useEffect(() => {
    if (!currentOrderId || !isSupabaseConfigured()) {
      return;
    }

    const unsubscribe = realtimeManager.subscribe({
      orderId: currentOrderId,
      events: ['UPDATE'],
      callback: ({ newRecord }) => {
        const newStatus = newRecord['status'] as OrderStatus | undefined;
        if (newStatus) {
          setStatus(newStatus);
          setIsConnected(true);
          // AGENT 9 — Mark realtime as active; this suppresses polling
          realtimeReceivedRef.current = true;
        }
      },
    });

    return unsubscribe;
  }, [currentOrderId]);

  // AGENT 8 — Fallback polling: kicks in if realtime hasn't fired within 25s
  // of initial fetch, or anytime the order is active and realtime is silent.
  useEffect(() => {
    // Only poll when we have an active, non-completed order
    if (!currentOrderId || !tableNumber) {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      return;
    }

    // AGENT 9 — If status is completed, we don't need to keep polling
    if (status === 'completed') {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      return;
    }

    // Start fallback polling immediately if no realtime credentials, or
    // after a short grace period to give realtime a chance to connect.
    const startPoller = () => {
      if (pollIntervalRef.current) return; // Already running
      pollIntervalRef.current = setInterval(() => {
        // AGENT 9 — Skip poll cycles when realtime is actively delivering events
        // (realtime received an event less than 60s ago)
        if (realtimeReceivedRef.current && realtimeManager.isReady()) {
          return;
        }
        void fetchStatus();
      }, FALLBACK_POLL_INTERVAL_MS);
    };

    // If Supabase isn't configured, start polling immediately (no realtime available)
    if (!isSupabaseConfigured()) {
      startPoller();
    } else {
      // Give realtime 10s to connect, then start polling as a safety net
      const graceTimer = setTimeout(startPoller, 10_000);
      return () => {
        clearTimeout(graceTimer);
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
      };
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [currentOrderId, tableNumber, status, fetchStatus]);

  const trackerData = useMemo(() => (status ? trackerStates[status] : null), [status]);

  return { status, trackerData, isConnected };
}
