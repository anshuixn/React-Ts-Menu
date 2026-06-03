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
      const response = await authFetch('/api/orders/list');
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
        if (event === 'INSERT') {
          // Bug 5 fix: Optimistically inject the new order from the realtime payload
          // instead of triggering a full HTTP refetch. This eliminates network round-trip
          // lag on every new order event — critical on busy services.
          const incomingId = newRecord['id'] as string | undefined;
          if (!incomingId) {
            // Malformed payload — fall back to HTTP fetch
            void fetchOrders(false);
            return;
          }

          const newOrder = {
            id: newRecord['id'] as string,
            table: newRecord['table_number'] as string,
            items: (newRecord['items'] ?? []) as Order['items'],
            total: newRecord['total'] as number,
            status: (newRecord['status'] ?? 'new') as OrderStatus,
            timestamp: newRecord['created_at'] as string,
          };

          setOrders((current) => {
            // Guard against duplicates if the event fires twice
            if (current.some((o) => o.id === newOrder.id)) return current;
            const updated = [newOrder, ...current];
            const previousIds = previousOrderIdsRef.current;
            if (previousIds.size > 0 && !previousIds.has(newOrder.id)) {
              playChime();
            }
            previousOrderIdsRef.current = new Set(updated.map((o) => o.id));
            return updated;
          });
        } else if (event === 'DELETE') {
          // For DELETE, we only know the old record ID — remove it locally
          const deletedId = (newRecord['id'] ?? orderId) as string | undefined;
          if (deletedId) {
            setOrders((current) => current.filter((o) => o.id !== deletedId));
            previousOrderIdsRef.current = new Set(
              [...previousOrderIdsRef.current].filter((id) => id !== deletedId),
            );
          } else {
            void fetchOrders(false);
          }
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
  }, [fetchOrders, playChime, user]);

  const updateOrderStatus = useCallback(async (id: string, status: OrderStatus) => {
    // Bug 2 fix: Capture the snapshot INSIDE the functional update so it is always
    // the latest state at the time of the update call, not a stale closure.
    let snapshotForRollback: Order[] = [];

    setOrders((currentOrders) => {
      snapshotForRollback = currentOrders;
      return currentOrders.map((order) => (order.id === id ? { ...order, status } : order));
    });

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
      // Rollback using the snapshot we captured synchronously before the async call
      setOrders(snapshotForRollback);
      setError(getErrorMessage(updateError));
    }
  }, [authFetch]);

  const clearOrders = useCallback(async () => {
    try {
      const response = await authFetch('/api/orders/clear', {
        method: 'POST',
      });

      const payload = await response.json() as OrderMutationResponse;

      if (!response.ok || !payload.success) {
        throw new Error(payload.message ?? 'Unable to clear completed orders');
      }

      // Bug 3 fix: Use functional state update to read the LATEST orders state
      // rather than the stale closure captured at callback definition time.
      setOrders((currentOrders) => {
        const remaining = currentOrders.filter((order) => order.status !== 'completed');
        // Also update the ref atomically with the new set
        previousOrderIdsRef.current = new Set(remaining.map((order) => order.id));
        return remaining;
      });
      setError(null);
    } catch (clearError) {
      setError(getErrorMessage(clearError));
    }
  }, [authFetch]);

  return { orders, loading, error, isConnected, updateOrderStatus, clearOrders };
}
