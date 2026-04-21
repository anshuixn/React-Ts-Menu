import { useState, useEffect, useRef } from 'react';
import type { OrderStatus, TrackerState } from '../types';

// ============================================
// useOrderPolling — Agent 10
// Ports startStatusPolling + checkOrderStatus from order.js
// ============================================

const trackerStates: Record<OrderStatus, TrackerState> = {
  new: {
    title: '🍽️ Order Received!',
    desc: 'The kitchen has received your order and will start preparing it shortly.',
    color: 'var(--status-new)',
  },
  cooking: {
    title: '👨‍🍳 Chef is Cooking!',
    desc: 'Your meal is being prepared with care and passion.',
    color: 'var(--status-cooking)',
  },
  ready: {
    title: '✨ Your Meal is on the Way!',
    desc: 'A waiter is bringing your food to your table. Bon appétit!',
    color: 'var(--status-ready)',
  },
  completed: {
    title: '😊 Enjoy Your Meal!',
    desc: 'We hope you love it. Let us know if you need anything else.',
    color: 'var(--text-muted)',
  },
};

export function useOrderPolling(currentOrderId: string | null) {
  const [status, setStatus] = useState<OrderStatus | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!currentOrderId) return;

    const check = async () => {
      try {
        const res = await fetch(`/api/orders/${currentOrderId}`);
        if (!res.ok) return;
        const order = await res.json();
        if (order?.status) {
          setStatus(order.status as OrderStatus);
          if (order.status === 'completed') {
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
          }
        }
      } catch (_) { /* silent */ }
    };

    check();
    intervalRef.current = setInterval(check, 2000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [currentOrderId]);

  const trackerData = status ? trackerStates[status] : null;
  return { status, trackerData };
}
