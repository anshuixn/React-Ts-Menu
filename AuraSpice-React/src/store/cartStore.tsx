import React, { createContext, useContext, useReducer, useMemo } from 'react';
import type { Cart, CartItem, MenuItem } from '../types';

// ============================================
// Cart Store — Agent 9
// Replaces vanilla cart={} + OrbStore proxy
// ============================================

type CartAction =
  | { type: 'ADD_ITEM'; payload: MenuItem }
  | { type: 'REMOVE_ITEM'; payload: number }
  | { type: 'INCREASE_QTY'; payload: number }
  | { type: 'CLEAR_CART' };

interface CartContextValue {
  cart: Cart;
  dispatch: React.Dispatch<CartAction>;
  totalQty: number;
  totalPrice: number;
}

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

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, dispatch] = useReducer(cartReducer, {} as Cart);

  const computed = useMemo(() => {
    const items = Object.values(cart) as CartItem[];
    return {
      totalQty: items.reduce((sum, i) => sum + i.qty, 0),
      totalPrice: items.reduce((sum, i) => sum + i.price * i.qty, 0),
    };
  }, [cart]);

  return (
    <CartContext.Provider value={{ cart, dispatch, ...computed }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
