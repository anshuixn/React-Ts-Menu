import { useCallback, useEffect, useRef, useState } from 'react';
import { realtimeManager } from '../lib/realtimeManager';
import type { Order, OrderStatus } from '../types';
import { useAudio } from './useAudio';
import { useAuth } from '../store/useAuth';

interface OrdersResponse {
  success?: boolean;
  message?: string;
  orders?: Order[];
}

interface OrderMutationResponse {
  success?: boolean;
  message?: string;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unexpected error';
}

export function useStaffOrdersRealtime() {
  const { authFetch, user } = useAuth();
  const { playChime } = useAudio();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const previousOrderIdsRef = useRef<Set<string>>(new Set());

  const fetchOrders = useCallback(async (showLoadingState = false) => {
    if (!user) {
      setOrders([]);
      setLoading(false);
      setIsConnected(false);
      return;
    }

    if (showLoadingState) {
      setLoading(true);
    }

    try {
      const response = await authFetch('/api/orders');
      const payload = await response.json() as OrdersResponse;

      if (!response.ok || !payload.success) {
        throw new Error(payload.message ?? 'Unable to load orders');
      }

      const nextOrders = payload.orders ?? [];
      const previousIds = previousOrderIdsRef.current;
      const nextIds = new Set(nextOrders.map((order) => order.id));
      const hasNewOrder =
        previousIds.size > 0 &&
        nextOrders.some((order) => !previousIds.has(order.id));

      if (hasNewOrder) {
        playChime();
      }

      previousOrderIdsRef.current = nextIds;
      setOrders(nextOrders);
      setError(null);
      setIsConnected(true);
    } catch (fetchError) {
      setError(getErrorMessage(fetchError));
      setIsConnected(false);
    } finally {
      setLoading(false);
    }
  }, [authFetch, playChime, user]);

  // Initial HTTP fetch to hydrate state
  useEffect(() => {
    if (!user) {
      return;
    }

    void fetchOrders(true);
  }, [fetchOrders, user]);

  // Shared realtime subscription — one channel for the whole app
  useEffect(() => {
    if (!user) return;

    const unsubscribe = realtimeManager.subscribe({
      orderId: '*',
      events: ['INSERT', 'UPDATE', 'DELETE'],
      callback: ({ event, newRecord, orderId }) => {
        if (event === 'INSERT' || event === 'DELETE') {
          // Re-fetch full list to get server-normalized data
          void fetchOrders(false);
        } else if (event === 'UPDATE' && orderId) {
          const updatedStatus = newRecord['status'] as OrderStatus | undefined;
          if (updatedStatus) {
            setOrders((current) =>
              current.map((o) =>
                o.id === orderId ? { ...o, status: updatedStatus } : o,
              ),
            );
          }
        }
      },
    });

    return unsubscribe;
  }, [fetchOrders, user]);

  const updateOrderStatus = useCallback(async (id: string, status: OrderStatus) => {
    const previousOrders = orders;

    setOrders((currentOrders) =>
      currentOrders.map((order) => (order.id === id ? { ...order, status } : order)),
    );

    try {
      const response = await authFetch('/api/orders/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });

      const payload = await response.json() as OrderMutationResponse;

      if (!response.ok || !payload.success) {
        throw new Error(payload.message ?? 'Unable to update order');
      }

      setError(null);
    } catch (updateError) {
      setOrders(previousOrders);
      setError(getErrorMessage(updateError));
    }
  }, [authFetch, orders]);

  const clearOrders = useCallback(async () => {
    try {
      const response = await authFetch('/api/orders/clear', {
        method: 'POST',
      });

      const payload = await response.json() as OrderMutationResponse;

      if (!response.ok || !payload.success) {
        throw new Error(payload.message ?? 'Unable to clear completed orders');
      }

      setOrders((currentOrders) => currentOrders.filter((order) => order.status !== 'completed'));
      previousOrderIdsRef.current = new Set(
        orders.filter((order) => order.status !== 'completed').map((order) => order.id),
      );
      setError(null);
    } catch (clearError) {
      setError(getErrorMessage(clearError));
    }
  }, [authFetch, orders]);

  return { orders, loading, error, isConnected, updateOrderStatus, clearOrders };
}
