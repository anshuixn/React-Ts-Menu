import React, { useMemo, useReducer, useEffect } from 'react';
import { CartContext } from './cart-context';
import type { Cart, CartItem, MenuItem } from '../types';

// Versioned storage key — bump version to invalidate stale persisted carts
const CART_STORAGE_KEY = 'auraspice_cart_v1';

// ─── Persist helpers ──────────────────────────────────────────────────────────

function loadCartFromStorage(): Cart {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    // Basic schema guard — each value must have id, qty, price
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

function saveCartToStorage(cart: Cart): void {
  if (typeof window === 'undefined') return;
  try {
    if (Object.keys(cart).length === 0) {
      localStorage.removeItem(CART_STORAGE_KEY);
    } else {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
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

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, dispatch] = useReducer(cartReducer, undefined, loadCartFromStorage);

  // Persist to localStorage on every state change
  useEffect(() => {
    saveCartToStorage(cart);
  }, [cart]);

  const computed = useMemo(() => {
    const items = Object.values(cart) as CartItem[];
    return {
      totalQty: items.reduce((sum, item) => sum + item.qty, 0),
      totalPrice: items.reduce((sum, item) => sum + item.price * item.qty, 0),
    };
  }, [cart]);

  return (
    <CartContext.Provider value={{ cart, dispatch, ...computed }}>
      {children}
    </CartContext.Provider>
  );
}
