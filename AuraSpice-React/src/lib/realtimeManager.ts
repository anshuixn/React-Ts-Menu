/**
 * realtimeManager.ts — Singleton Supabase Realtime channel manager.
 *
 * Problem solved: Without this, every customer order-tracking page and the
 * staff dashboard each open their own WebSocket channel to Supabase.
 * At 50 concurrent tables that's 50+ open channels — hitting free-tier limits fast.
 *
 * Solution: One shared channel for the entire app. Components register
 * callbacks via subscribe()/unsubscribe(). The manager dispatches incoming
 * Postgres change events to the correct subscribers.
 */

import { supabase } from './supabase';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export type ChangeEvent = 'INSERT' | 'UPDATE' | 'DELETE';

export interface OrderChangePayload {
  event: ChangeEvent;
  orderId: string;
  newRecord: Record<string, unknown>;
  oldRecord: Record<string, unknown>;
}

type SubscriberCallback = (payload: OrderChangePayload) => void;

interface Subscriber {
  /** Filter to a specific order ID, or '*' for all orders */
  orderId: string | '*';
  events: ChangeEvent[];
  callback: SubscriberCallback;
}

class RealtimeManager {
  private channel: RealtimeChannel | null = null;
  private subscribers = new Map<string, Subscriber>();
  private subscriberIdCounter = 0;
  private connectionStatus: 'disconnected' | 'connecting' | 'connected' = 'disconnected';

  /** Subscribe to order change events. Returns an unsubscribe handle. */
  subscribe(subscriber: Omit<Subscriber, never>): () => void {
    const id = `sub_${++this.subscriberIdCounter}`;
    this.subscribers.set(id, subscriber);

    // Boot the shared channel if this is the first subscriber
    if (this.subscribers.size === 1) {
      this.connect();
    }

    return () => this.unsubscribe(id);
  }

  private unsubscribe(id: string): void {
    this.subscribers.delete(id);

    // Tear down channel when nobody is listening
    if (this.subscribers.size === 0) {
      this.disconnect();
    }
  }

  private connect(): void {
    if (this.channel || this.connectionStatus === 'connecting') return;
    this.connectionStatus = 'connecting';

    this.channel = supabase
      .channel('auraspice-orders-shared')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (raw) => this.dispatch('INSERT', raw),
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        (raw) => this.dispatch('UPDATE', raw),
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'orders' },
        (raw) => this.dispatch('DELETE', raw),
      )
      .subscribe((status) => {
        this.connectionStatus = status === 'SUBSCRIBED' ? 'connected' : 'connecting';
      });
  }

  private disconnect(): void {
    if (this.channel) {
      void supabase.removeChannel(this.channel);
      this.channel = null;
    }
    this.connectionStatus = 'disconnected';
  }

  private dispatch(
    event: ChangeEvent,
    raw: RealtimePostgresChangesPayload<Record<string, unknown>>,
  ): void {
    const newRecord = (raw.new ?? {}) as Record<string, unknown>;
    const oldRecord = (raw.old ?? {}) as Record<string, unknown>;
    const orderId = (newRecord['id'] ?? oldRecord['id'] ?? '') as string;

    const payload: OrderChangePayload = { event, orderId, newRecord, oldRecord };

    for (const sub of this.subscribers.values()) {
      if (!sub.events.includes(event)) continue;
      if (sub.orderId !== '*' && sub.orderId !== orderId) continue;
      try {
        sub.callback(payload);
      } catch {
        // Prevent a bad subscriber from crashing others
      }
    }
  }

  get status() {
    return this.connectionStatus;
  }
}

// Exported singleton — import this everywhere instead of creating channels directly
export const realtimeManager = new RealtimeManager();
