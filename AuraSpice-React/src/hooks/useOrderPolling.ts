import { useState, useEffect, useCallback } from 'react';
import type { OrderStatus, TrackerState } from '../types';
import { supabase } from '../lib/supabase';

// ============================================================
// AuraSpice: Client-Side Realtime Tracking
// Instantly updates the customer's phone when a chef moves their order.
// Uses granular UPDATE subscription — no polling, no refetch.
// ============================================================

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

export function useOrderPolling(currentOrderId: string | null) {
  const [status, setStatus] = useState<OrderStatus | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const fetchStatus = useCallback(async () => {
    if (!currentOrderId) return;
    const { data, error } = await supabase
      .from('orders')
      .select('status')
      .eq('id', currentOrderId)
      .single();
    if (!error && data) {
      setStatus(data.status as OrderStatus);
    }
  }, [currentOrderId]);

  useEffect(() => {
    if (!currentOrderId) return;

    // 1. Initial fetch
    fetchStatus();

    // 2. Subscribe to Realtime — UPDATE only for THIS specific order
    //    Granular: status is patched directly from the payload, no refetch.
    const channel = supabase
      .channel(`order_track_${currentOrderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${currentOrderId}`,
        },
        (payload) => {
          // Direct patch — O(1), zero network round-trip
          setStatus(payload.new.status as OrderStatus);
        }
      )
      .subscribe((state) => {
        setIsConnected(state === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
      setIsConnected(false);
    };
  }, [currentOrderId, fetchStatus]);

  const trackerData = status ? trackerStates[status] : null;
  return { status, trackerData, isConnected };
}
