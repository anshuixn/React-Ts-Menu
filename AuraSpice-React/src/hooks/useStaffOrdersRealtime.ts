import { useState, useEffect, useCallback, useRef } from 'react';
import type { Order, OrderStatus } from '../types';
import { useAudio } from './useAudio';
import { supabase } from '../lib/supabase';

// ============================================================
// AuraSpice: Supabase Realtime Hook (Granular Event Engine)
// Replaces "refetch everything" with surgical INSERT/UPDATE/DELETE
// patch operations — O(1) updates, instant cross-device sync.
// ============================================================

/** Map a raw Supabase row → our Order interface */
function rowToOrder(o: any): Order {
  return {
    id: o.id,
    table: o.table_number,
    items: o.items,
    total: o.total,
    status: o.status,
    timestamp: o.created_at,
  };
}

export function useStaffOrdersRealtime() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { playChime } = useAudio();
  const previousCountRef = useRef(0);

  // ── Initial full fetch ────────────────────────────────────
  const fetchOrders = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedOrders = (data || []).map(rowToOrder);
      setOrders(formattedOrders);
      previousCountRef.current = formattedOrders.length;
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();

    // ── Granular Realtime subscription ───────────────────────
    // INSERT  → prepend the new row; play chime
    // UPDATE  → patch the single changed order in-place (no refetch!)
    // DELETE  → filter out the removed order
    const channel = supabase
      .channel('staff_orders_rt')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => {
          const newOrder = rowToOrder(payload.new);
          setOrders((prev) => [newOrder, ...prev]);
          previousCountRef.current += 1;
          playChime();
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        (payload) => {
          const updatedOrder = rowToOrder(payload.new);
          setOrders((prev) =>
            prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o))
          );
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'orders' },
        (payload) => {
          setOrders((prev) => prev.filter((o) => o.id !== payload.old.id));
          previousCountRef.current = Math.max(0, previousCountRef.current - 1);
        }
      )
      .subscribe((state) => {
        setIsConnected(state === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
      setIsConnected(false);
    };
  }, [fetchOrders, playChime]);

  // ── Status update (optimistic + server confirm) ───────────
  const updateOrderStatus = useCallback(async (id: string, status: OrderStatus) => {
    // Optimistic UI: patch local state immediately
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status } : o))
    );
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', id);

      if (error) {
        // Rollback on error by re-fetching
        console.error('Status update failed, rolling back:', error.message);
        fetchOrders();
      }
      // On success: the Realtime UPDATE event will confirm the change.
    } catch (err: any) {
      console.error('Update failed:', err.message);
      fetchOrders();
    }
  }, [fetchOrders]);

  // ── Clear all completed orders ────────────────────────────
  const clearOrders = useCallback(async () => {
    if (!window.confirm('Clear ALL orders? This cannot be undone.')) return;
    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .neq('id', '0'); // Delete all rows

      if (error) throw error;
      setOrders([]);
      previousCountRef.current = 0;
    } catch (err: any) {
      console.error('Clear failed:', err.message);
    }
  }, []);

  return { orders, loading, error, isConnected, updateOrderStatus, clearOrders };
}
