/**
 * realtimeManager.ts — Singleton Supabase Realtime channel manager.
 *
 * AGENT 1  — Core singleton pattern (one channel, many subscribers)
 * AGENT 2  — Auto-reconnect with exponential backoff (fixes silent stall on drop)
 * AGENT 3  — Proper channel teardown & status lifecycle
 * AGENT 4  — Public isReady() helper for consumers to check connection health
 * AGENT 5  — Heartbeat guard: re-connects if channel goes silent for > 45s
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

// AGENT 2 — Exponential backoff constants
const BASE_RETRY_MS    = 2_000;   // 2s first retry
const MAX_RETRY_MS     = 60_000;  // cap at 1 minute
const HEARTBEAT_MS     = 45_000;  // re-connect if silent for 45s

class RealtimeManager {
  private channel: RealtimeChannel | null = null;
  private subscribers = new Map<string, Subscriber>();
  private subscriberIdCounter = 0;
  private connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error' = 'disconnected';

  // AGENT 2 — Reconnect state
  private retryTimeout: ReturnType<typeof setTimeout> | null = null;
  private retryAttempt = 0;

  // AGENT 5 — Heartbeat state
  private heartbeatTimeout: ReturnType<typeof setTimeout> | null = null;
  private lastEventAt = 0;

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

  /** AGENT 2 — Compute backoff delay for retry attempt n */
  private backoffMs(): number {
    const delay = BASE_RETRY_MS * Math.pow(2, this.retryAttempt);
    return Math.min(delay, MAX_RETRY_MS);
  }

  private scheduleReconnect(): void {
    if (this.subscribers.size === 0) return; // Nobody listening — don't bother
    if (this.retryTimeout) return;           // Already scheduled

    const delay = this.backoffMs();
    this.retryAttempt++;

    this.retryTimeout = setTimeout(() => {
      this.retryTimeout = null;
      // Tear down stale channel first, then reconnect
      this.destroyChannel();
      this.connect();
    }, delay);
  }

  /** AGENT 5 — Heartbeat: force reconnect if no event received for 45s */
  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimeout = setInterval(() => {
      const silent = Date.now() - this.lastEventAt;
      if (silent > HEARTBEAT_MS && this.connectionStatus !== 'connecting') {
        this.destroyChannel();
        this.connect();
      }
    }, HEARTBEAT_MS);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimeout) {
      clearInterval(this.heartbeatTimeout);
      this.heartbeatTimeout = null;
    }
  }

  /** Destroy channel object without removing subscribers */
  private destroyChannel(): void {
    if (this.channel) {
      void supabase.removeChannel(this.channel);
      this.channel = null;
    }
    this.connectionStatus = 'disconnected';
  }

  private connect(): void {
    // AGENT 3 — Only guard against 'connecting' phase, not stale channel objects
    if (this.connectionStatus === 'connecting') return;
    if (this.channel) return; // Already have a live channel

    this.connectionStatus = 'connecting';
    this.lastEventAt = Date.now(); // Treat connection start as activity

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
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          // AGENT 2 — Successful connection; reset retry counter
          this.connectionStatus = 'connected';
          this.retryAttempt = 0;
          this.startHeartbeat();
        } else if (
          status === 'CHANNEL_ERROR' ||
          status === 'TIMED_OUT' ||
          status === 'CLOSED'
        ) {
          // AGENT 2 — Channel dropped; nullify and schedule reconnect
          if (import.meta.env.DEV) {
            console.warn('[RealtimeManager] Channel dropped, reconnecting…', status, err);
          }
          this.connectionStatus = 'error';
          this.channel = null; // Allow connect() to create a new one
          this.stopHeartbeat();
          this.scheduleReconnect();
        }
        // 'UNSUBSCRIBED' happens on intentional disconnect — don't reconnect
      });
  }

  private disconnect(): void {
    // AGENT 3 — Cancel pending reconnects
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }
    this.retryAttempt = 0;
    this.stopHeartbeat();
    this.destroyChannel();
  }

  private dispatch(
    event: ChangeEvent,
    raw: RealtimePostgresChangesPayload<Record<string, unknown>>,
  ): void {
    // AGENT 5 — Record activity for heartbeat guard
    this.lastEventAt = Date.now();

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

  /** AGENT 4 — Public helpers for consumers */
  get status() {
    return this.connectionStatus;
  }

  isReady(): boolean {
    return this.connectionStatus === 'connected';
  }
}

// Exported singleton — import this everywhere instead of creating channels directly
export const realtimeManager = new RealtimeManager();
