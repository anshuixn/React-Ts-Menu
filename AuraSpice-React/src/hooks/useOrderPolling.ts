import { useEffect, useMemo, useState, useRef } from 'react';
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

export function useOrderPolling(
  currentOrderId: string | null,
  tableNumber: string | null,
  trackingToken: string | null = null,
) {
  const [status, setStatus] = useState<OrderStatus | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const initialFetchDone = useRef(false);

  // Initial HTTP fetch to hydrate state
  useEffect(() => {
    if (!currentOrderId || !tableNumber) {
      setStatus(null);
      setIsConnected(false);
      initialFetchDone.current = false;
      return;
    }

    let isCancelled = false;

    const fetchStatus = async () => {
      try {
        const query = new URLSearchParams({ id: currentOrderId, table: tableNumber });
        if (trackingToken) query.set('token', trackingToken);
        const response = await fetch(`/api/orders/status?${query.toString()}`);
        const payload = await response.json() as OrderStatusResponse;

        if (!response.ok || !payload.success || !payload.status) {
          throw new Error(payload.message ?? 'Unable to fetch order status');
        }

        if (!isCancelled) {
          setStatus(payload.status);
          setIsConnected(true);
          initialFetchDone.current = true;
        }
      } catch {
        if (!isCancelled) {
          setIsConnected(false);
        }
      }
    };

    void fetchStatus();

    return () => {
      isCancelled = true;
    };
  }, [currentOrderId, tableNumber, trackingToken]);

  // Supabase Realtime subscription for live updates (only when credentials are real)
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
        }
      },
    });

    return unsubscribe;
  }, [currentOrderId]);

  const trackerData = useMemo(() => (status ? trackerStates[status] : null), [status]);

  return { status, trackerData, isConnected };
}
