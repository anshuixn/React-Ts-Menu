import { useState, useEffect, useCallback, useRef } from 'react';
import type { Order } from '../types';
import { useAudio } from './useAudio';
import { useAuth } from '../store/AuthContext';

// ============================================================
// PHASE 5 — All staff API calls now include the auth token.
// VULN FIXED: plain fetch('/api/orders') was unauthenticated →
// anyone on the network could poll all customer orders.
// ============================================================

export function useStaffOrdersPolling() {
  const { authFetch } = useAuth();
  const [orders,  setOrders]  = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const { playChime }         = useAudio();
  const previousCountRef      = useRef(0);

  const fetchOrders = useCallback(async (isInitial = false) => {
    try {
      const res = await authFetch('/api/orders');
      if (res.status === 401) {
        setError('Session expired. Please log in again.');
        return;
      }
      if (res.ok) {
        const data: Order[] = await res.json();
        setOrders(data);
        setError(null);

        if (!isInitial && previousCountRef.current > 0 && data.length > previousCountRef.current) {
          playChime();
        }
        previousCountRef.current = data.length;
      } else {
        if (isInitial) setError('Server returned an error. Is the backend running?');
      }
    } catch {
      if (isInitial) setError('Cannot reach the backend server. Run `node server.js` in the root directory.');
    } finally {
      if (isInitial) setLoading(false);
    }
  }, [authFetch, playChime]);

  useEffect(() => {
    fetchOrders(true);
    const interval = setInterval(() => fetchOrders(false), 2000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const updateOrderStatus = useCallback(async (id: string, status: string) => {
    try {
      // Optimistic update
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: status as Order['status'] } : o));

      const res = await authFetch(`/api/orders/${id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ status }),
      });

      if (!res.ok) {
        // Rollback on failure
        fetchOrders(false);
      }
    } catch {
      fetchOrders(false); // Rollback
    }
  }, [authFetch, fetchOrders]);

  const clearOrders = useCallback(async () => {
    setOrders([]);
    previousCountRef.current = 0;
    try {
      await authFetch('/api/orders', { method: 'DELETE' });
    } catch {
      // Re-fetch in case local clear was premature
      fetchOrders(false);
    }
  }, [authFetch, fetchOrders]);

  return { orders, loading, error, updateOrderStatus, clearOrders };
}
