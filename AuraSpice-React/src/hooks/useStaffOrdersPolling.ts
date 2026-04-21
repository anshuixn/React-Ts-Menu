import { useState, useEffect, useCallback, useRef } from 'react';
import type { Order } from '../types';
import { useAudio } from './useAudio';

export function useStaffOrdersPolling() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { playChime } = useAudio();
  const previousCountRef = useRef(0);

  const fetchOrders = useCallback(async (isInitial = false) => {
    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        const data: Order[] = await res.json();
        setOrders(data);
        
        // Only chime if it's a new order (and not the initial load)
        if (!isInitial && previousCountRef.current > 0 && data.length > previousCountRef.current) {
          playChime();
        }
        previousCountRef.current = data.length;
      }
    } catch (_) {
      // silent
    } finally {
      if (isInitial) setLoading(false);
    }
  }, [playChime]);

  useEffect(() => {
    fetchOrders(true);
    const interval = setInterval(() => fetchOrders(false), 2000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const updateOrderStatus = useCallback(async (id: string, status: string) => {
    try {
      // Optmistic update
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: status as any } : o));
      
      await fetch(`/api/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      // Fetch fresh data
      fetchOrders(false);
    } catch (_) {}
  }, [fetchOrders]);

  const clearOrders = useCallback(async () => {
    setOrders([]);
    previousCountRef.current = 0;
    try {
      await fetch('/api/orders', { method: 'DELETE' });
    } catch (_) {}
  }, []);

  return { orders, loading, updateOrderStatus, clearOrders };
}
