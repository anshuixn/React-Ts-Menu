// ============================================================
// AuraSpice — Server-Side Authoritative Menu Price Map
//
// This is the SINGLE SOURCE OF TRUTH for menu item prices
// on the server. It mirrors src/data/menuData.ts exactly.
//
// WHY THIS EXISTS:
// The API must validate prices server-side to prevent
// tampered requests. Querying the menu_items Supabase table
// for every order creates a hard dependency on that table
// being seeded correctly. Instead, prices live here in code —
// the same way a real POS system keeps its price list in
// a config — and the DB is only used for order storage.
//
// HOW TO UPDATE PRICES:
// 1. Change the price here
// 2. Change it in src/data/menuData.ts (frontend display)
// 3. Deploy — no DB migration needed
// ============================================================

export interface ServerMenuItem {
  id: number;
  name: string;
  category: string;
  price: number;
  calories: number;
}

/** All 29 AuraSpice menu items — kept in sync with src/data/menuData.ts */
const MENU_ITEMS: ServerMenuItem[] = [
  // ── CHINESE (8) ──────────────────────────────────────────
  { id: 1,  name: 'Dim Sum Platter',       category: 'chinese',      price: 249, calories: 320 },
  { id: 2,  name: 'Kung Pao Chicken',      category: 'chinese',      price: 289, calories: 450 },
  { id: 3,  name: 'Chilli Paneer',         category: 'chinese',      price: 229, calories: 380 },
  { id: 4,  name: 'Hakka Noodles',         category: 'chinese',      price: 199, calories: 420 },
  { id: 5,  name: 'Veg Manchurian',        category: 'chinese',      price: 209, calories: 350 },
  { id: 6,  name: 'Spring Rolls',          category: 'chinese',      price: 179, calories: 280 },
  { id: 7,  name: 'Fried Rice',            category: 'chinese',      price: 219, calories: 480 },
  { id: 8,  name: 'Pepper Steak',          category: 'chinese',      price: 399, calories: 520 },

  // ── NORTH INDIAN (5) ─────────────────────────────────────
  { id: 9,  name: 'Butter Chicken',        category: 'north-indian', price: 349, calories: 550 },
  { id: 10, name: 'Paneer Butter Masala',  category: 'north-indian', price: 299, calories: 480 },
  { id: 11, name: 'Chicken Biryani',       category: 'north-indian', price: 329, calories: 620 },
  { id: 12, name: 'Dal Makhani',           category: 'north-indian', price: 249, calories: 380 },
  { id: 13, name: 'Garlic Naan',           category: 'north-indian', price: 69,  calories: 260 },

  // ── SOUTH INDIAN (5) ─────────────────────────────────────
  { id: 14, name: 'Masala Dosa',           category: 'south-indian', price: 149, calories: 350 },
  { id: 15, name: 'Idli Sambar',           category: 'south-indian', price: 119, calories: 220 },
  { id: 16, name: 'Medu Vada',             category: 'south-indian', price: 99,  calories: 280 },
  { id: 17, name: 'Uttapam',               category: 'south-indian', price: 139, calories: 310 },
  { id: 18, name: 'Filter Coffee',         category: 'south-indian', price: 79,  calories: 80  },

  // ── FAST FOOD (6) ────────────────────────────────────────
  { id: 19, name: 'Classic Smash Burger',  category: 'fast-food',    price: 279, calories: 680 },
  { id: 20, name: 'Loaded Fries',          category: 'fast-food',    price: 179, calories: 450 },
  { id: 21, name: 'Steamed Momos',         category: 'fast-food',    price: 149, calories: 300 },
  { id: 22, name: 'Penne Arrabiata',       category: 'fast-food',    price: 249, calories: 520 },
  { id: 23, name: 'Loaded Pizza',          category: 'fast-food',    price: 329, calories: 750 },
  { id: 24, name: 'Club Sandwich',         category: 'fast-food',    price: 219, calories: 480 },

  // ── BEVERAGES (5) ────────────────────────────────────────
  { id: 25, name: 'Virgin Mojito',         category: 'beverages',    price: 159, calories: 120 },
  { id: 26, name: 'Cold Coffee',           category: 'beverages',    price: 149, calories: 200 },
  { id: 27, name: 'Mango Shake',           category: 'beverages',    price: 129, calories: 280 },
  { id: 28, name: 'Masala Chai',           category: 'beverages',    price: 49,  calories: 80  },
  { id: 29, name: 'Fresh Lime Soda',       category: 'beverages',    price: 89,  calories: 60  },
];

/**
 * O(1) lookup map: item ID → ServerMenuItem.
 * Built once at module load time.
 */
export const MENU_PRICE_MAP = new Map<number, ServerMenuItem>(
  MENU_ITEMS.map((item) => [item.id, item])
);

/**
 * Returns the menu item for a given ID, or undefined if not found.
 * Use this in API handlers instead of querying the menu_items DB table.
 */
export function getMenuItem(id: number): ServerMenuItem | undefined {
  return MENU_PRICE_MAP.get(id);
}

/** Total count of menu items — useful for validation. */
export const MENU_ITEM_COUNT = MENU_ITEMS.length;
