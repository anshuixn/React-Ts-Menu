import React, { useMemo, useReducer, useEffect } from 'react';
import { CartContext } from './cart-context';
import { safeLocalStorage } from '../lib/storage';
import type { Cart, CartItem, MenuItem } from '../types';

// ─── Storage key helpers ──────────────────────────────────────────────────────

const CART_STORAGE_VERSION = 'auraspice_cart_v1';

/**
 * Per-table storage key. Each table gets its own localStorage entry so that
 * switching tables never shares or contaminates cart state.
 *
 * Example: "auraspice_cart_v1:05"
 */
export function cartStorageKey(tableNumber: string): string {
  return `${CART_STORAGE_VERSION}:${tableNumber}`;
}

// ─── Persist helpers ──────────────────────────────────────────────────────────

function loadCartFromStorage(tableNumber: string): Cart {
  if (typeof window === 'undefined') return {};
  try {
    const raw = safeLocalStorage.getItem(cartStorageKey(tableNumber));
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    // Basic schema guard — each value must have id, qty, price, name
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return {};
    const validated: Cart = {};
    for (const [key, val] of Object.entries(parsed)) {
      if (
        val &&
        typeof val === 'object' &&
        typeof (val as CartItem).id === 'number' &&
        typeof (val as CartItem).qty === 'number' &&
        typeof (val as CartItem).price === 'number' &&
        typeof (val as CartItem).name === 'string'
      ) {
        validated[Number(key)] = val as CartItem;
      }
    }
    return validated;
  } catch {
    return {};
  }
}

function saveCartToStorage(tableNumber: string, cart: Cart): void {
  if (typeof window === 'undefined') return;
  try {
    const key = cartStorageKey(tableNumber);
    if (Object.keys(cart).length === 0) {
      safeLocalStorage.removeItem(key);
    } else {
      safeLocalStorage.setItem(key, JSON.stringify(cart));
    }
  } catch {
    // Storage quota exceeded or private browsing — fail silently
  }
}

// ─── Reducer ──────────────────────────────────────────────────────────────────

type CartAction =
  | { type: 'ADD_ITEM'; payload: MenuItem }
  | { type: 'REMOVE_ITEM'; payload: number }
  | { type: 'INCREASE_QTY'; payload: number }
  | { type: 'CLEAR_CART' };

function cartReducer(state: Cart, action: CartAction): Cart {
  switch (action.type) {
    case 'ADD_ITEM': {
      const id = action.payload.id;
      const existing = state[id];
      return {
        ...state,
        [id]: existing
          ? { ...existing, qty: existing.qty + 1 }
          : { ...action.payload, qty: 1 },
      };
    }
    case 'REMOVE_ITEM': {
      const id = action.payload;
      if (!state[id]) return state;
      const newQty = state[id].qty - 1;
      if (newQty <= 0) {
        const next = { ...state };
        delete next[id];
        return next;
      }
      return { ...state, [id]: { ...state[id], qty: newQty } };
    }
    case 'INCREASE_QTY': {
      const id = action.payload;
      if (!state[id]) return state;
      return { ...state, [id]: { ...state[id], qty: state[id].qty + 1 } };
    }
    case 'CLEAR_CART':
      return {};
    default:
      return state;
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────────

interface CartProviderProps {
  /**
   * The table number this cart belongs to. The provider keys its localStorage
   * entry and context value off this string.
   *
   * IMPORTANT: OrderPage must pass `key={tableNumber}` alongside this prop so
   * that React remounts the provider (and resets reducer state) every time the
   * table changes. Without the `key` prop the reducer state would be stale even
   * though the storage key changed.
   */
  tableNumber: string;
  children: React.ReactNode;
}

export function CartProvider({ tableNumber, children }: CartProviderProps) {
  // Lazy initialiser runs exactly once on mount (and again on remount, which
  // happens whenever the `key` prop changes in OrderPage).
  const [cart, dispatch] = useReducer(
    cartReducer,
    undefined,
    () => loadCartFromStorage(tableNumber),
  );

  // Persist to localStorage on every cart state change, scoped to this table.
  useEffect(() => {
    saveCartToStorage(tableNumber, cart);
  }, [tableNumber, cart]);

  const computed = useMemo(() => {
    const items = Object.values(cart) as CartItem[];
    return {
      totalQty: items.reduce((sum, item) => sum + item.qty, 0),
      totalPrice: items.reduce((sum, item) => sum + item.price * item.qty, 0),
    };
  }, [cart]);

  return (
    <CartContext.Provider value={{ tableNumber, cart, dispatch, ...computed }}>
      {children}
    </CartContext.Provider>
  );
}
