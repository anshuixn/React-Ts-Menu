import { createContext } from 'react';
import type { Dispatch } from 'react';
import type { Cart, MenuItem } from '../types';

export type CartAction =
  | { type: 'ADD_ITEM'; payload: MenuItem }
  | { type: 'REMOVE_ITEM'; payload: number }
  | { type: 'INCREASE_QTY'; payload: number }
  | { type: 'CLEAR_CART' };

export interface CartContextValue {
  /** The table this cart belongs to. Guaranteed to match the CartProvider's tableNumber prop. */
  tableNumber: string;
  cart: Cart;
  dispatch: Dispatch<CartAction>;
  totalQty: number;
  totalPrice: number;
}

export const CartContext = createContext<CartContextValue | null>(null);
