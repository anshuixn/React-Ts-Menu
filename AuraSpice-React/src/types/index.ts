// ============================================
// AURA & SPICE — Shared TypeScript Interfaces
// ============================================

export type Category = 'chinese' | 'north-indian' | 'south-indian' | 'fast-food' | 'beverages' | 'all';
export type OrderStatus = 'new' | 'cooking' | 'ready' | 'completed';

export interface MenuItem {
  id: number;
  name: string;
  category: Category;
  price: number;
  calories: number;
  image: string;
  desc: string;
}

export interface CartItem extends MenuItem {
  qty: number;
}

export interface Cart {
  [id: number]: CartItem;
}

export interface OrderItem {
  id: number;
  name: string;
  qty: number;
  price: number;
}

export interface Order {
  id: string;
  table: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  timestamp: string;
}

export interface OrbState {
  cartOpen: boolean;
  statusOpen: boolean;
  orderState: OrderStatus | 'none';
}

export interface DishPillData {
  image: string;
  name: string;
  price: number;
}

export interface StatItem {
  count: number;
  label: string;
}

export interface GalleryCardData {
  image: string;
  title: string;
  desc: string;
  alt: string;
}

export interface TrackerState {
  title: string;
  desc: string;
  color: string;
}

export interface CuisineSectionProps {
  chapter: string;
  title: string;
  desc: string;
  image: string;
  alt: string;
  reversed: boolean;
  dishes: DishPillData[];
  orderLink: string;
}

export interface StaffAccount {
  id: string;
  name: string;
  role: string;
  registeredAt?: string;
}
