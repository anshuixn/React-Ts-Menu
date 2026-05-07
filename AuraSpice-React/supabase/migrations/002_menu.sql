-- ============================================
-- AuraSpice: Menu Items Table
-- Migrates all 29 items from static menuData.ts
-- into a proper database table.
-- ============================================

CREATE TABLE IF NOT EXISTS public.menu_items (
  id           SERIAL PRIMARY KEY,
  name         TEXT NOT NULL,
  category     TEXT NOT NULL,
  price        NUMERIC NOT NULL,
  calories     INTEGER NOT NULL DEFAULT 0,
  image        TEXT NOT NULL DEFAULT '',
  "desc"       TEXT NOT NULL DEFAULT '',
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

-- Public can only read available items
DROP POLICY IF EXISTS "Allow public select on menu_items" ON public.menu_items;
CREATE POLICY "Allow public select on menu_items"
ON public.menu_items
FOR SELECT
TO PUBLIC
USING (is_available = true);

CREATE INDEX IF NOT EXISTS idx_menu_items_category ON public.menu_items(category);
CREATE INDEX IF NOT EXISTS idx_menu_items_available ON public.menu_items(is_available);

-- ============================================
-- Seed all 29 menu items
-- ============================================

INSERT INTO public.menu_items (id, name, category, price, calories, image, "desc") VALUES
  (1,  'Dim Sum Platter',       'chinese',       249, 320, '/assets/menu/chinese/dimsum.png',          'Steamed crystal-skin dumplings filled with prawn and truffle, served with chili oil'),
  (2,  'Kung Pao Chicken',      'chinese',       289, 450, '/assets/menu/chinese/kungpao.png',         'Wok-fired chicken with roasted peanuts, dried chilies, and Wok Hei finish'),
  (3,  'Chilli Paneer',         'chinese',       229, 380, '/assets/menu/chinese/chilli-paneer.png',   'Crispy paneer cubes tossed in a fiery Indo-Chinese chili garlic sauce'),
  (4,  'Hakka Noodles',         'chinese',       199, 420, '/assets/menu/chinese/hakka-noodles.png',   'Wok-tossed egg noodles with julienned vegetables and soy glaze'),
  (5,  'Veg Manchurian',        'chinese',       209, 350, '/assets/menu/chinese/veg-manchurian.png',  'Deep-fried veggie balls in a tangy Manchurian gravy with spring onions'),
  (6,  'Spring Rolls',          'chinese',       179, 280, '/assets/menu/chinese/spring-rolls.png',    'Golden crispy rolls stuffed with cabbage, carrots, and glass noodles'),
  (7,  'Fried Rice',            'chinese',       219, 480, '/assets/menu/chinese/fried-rice.png',      'Classic wok-fried rice with egg, vegetables, and a hint of sesame'),
  (8,  'Pepper Steak',          'chinese',       399, 520, '/assets/menu/chinese/steak.png',           'Seared steak strips in a black pepper sauce with bell peppers'),
  (9,  'Butter Chicken',        'north-indian',  349, 550, '/assets/menu/north-indian/butter-chicken.png',       'Tandoori chicken in a rich, creamy tomato-butter gravy — the undisputed classic'),
  (10, 'Paneer Butter Masala',  'north-indian',  299, 480, '/assets/menu/north-indian/paneer-butter-masala.png', 'Soft paneer cubes in a velvety makhani gravy with a touch of cream'),
  (11, 'Chicken Biryani',       'north-indian',  329, 620, '/assets/menu/north-indian/chicken-biryani.png',      'Dum-cooked basmati rice layered with spiced chicken, saffron, and caramelized onions'),
  (12, 'Dal Makhani',           'north-indian',  249, 380, '/assets/menu/north-indian/dal-makhani.png',          'Black lentils slow-cooked overnight with butter and cream — pure comfort'),
  (13, 'Garlic Naan',           'north-indian',   69, 260, '/assets/menu/north-indian/garlic-naan.png',          'Soft tandoori naan brushed with garlic butter and fresh coriander'),
  (14, 'Masala Dosa',           'south-indian',  149, 350, '/assets/menu/south-indian/masala-dosa.png',   'Crispy rice-batter crepe filled with spiced potato masala, served with chutneys'),
  (15, 'Idli Sambar',           'south-indian',  119, 220, '/assets/menu/south-indian/idli-sambar.png',   'Fluffy steamed rice cakes served with hot sambar and coconut chutney'),
  (16, 'Medu Vada',             'south-indian',   99, 280, '/assets/menu/south-indian/medu-vada.png',     'Crispy urad dal fritters — golden on the outside, soft and fluffy inside'),
  (17, 'Uttapam',               'south-indian',  139, 310, '/assets/menu/south-indian/uttapam.png',       'Thick rice pancake topped with onions, tomatoes, and green chilies'),
  (18, 'Filter Coffee',         'south-indian',   79,  80, '/assets/menu/south-indian/filter-coffee.png', 'Traditional South Indian filter coffee — strong, frothy, and aromatic'),
  (19, 'Classic Smash Burger',  'fast-food',     279, 680, '/assets/menu/fast-food/burger.png',       'Double-smashed beef patty with cheddar, caramelized onions, and house sauce'),
  (20, 'Loaded Fries',          'fast-food',     179, 450, '/assets/menu/fast-food/french-fries.png', 'Crispy golden fries topped with cheese sauce, jalapeños, and crispy bacon bits'),
  (21, 'Steamed Momos',         'fast-food',     149, 300, '/assets/menu/fast-food/momos.png',        'Juicy chicken momos steamed in bamboo baskets, served with spicy red chutney'),
  (22, 'Penne Arrabiata',       'fast-food',     249, 520, '/assets/menu/fast-food/pasta.png',        'Al dente penne in a spicy tomato-garlic arrabiata sauce with fresh basil'),
  (23, 'Loaded Pizza',          'fast-food',     329, 750, '/assets/menu/fast-food/pizza.png',        'Hand-tossed crust loaded with mozzarella, pepperoni, olives, and jalapeños'),
  (24, 'Club Sandwich',         'fast-food',     219, 480, '/assets/menu/fast-food/sandwich.png',     'Triple-decker with grilled chicken, bacon, lettuce, tomato, and herb mayo'),
  (25, 'Virgin Mojito',         'beverages',     159, 120, '/assets/menu/beverages/mojito.png',          'Fresh lime, mint leaves, and soda — shaken and chilled to perfection'),
  (26, 'Cold Coffee',           'beverages',     149, 200, '/assets/menu/beverages/cold-coffee.png',     'Creamy blended cold coffee with a frothy top and a hint of vanilla'),
  (27, 'Mango Shake',           'beverages',     129, 280, '/assets/menu/beverages/mango-shake.png',     'Thick and luscious Alphonso mango shake made with real fruit pulp'),
  (28, 'Masala Chai',           'beverages',      49,  80, '/assets/menu/beverages/masala-chai.png',     'Spiced Indian tea with ginger, cardamom, and cloves — brewed fresh'),
  (29, 'Fresh Lime Soda',       'beverages',      89,  60, '/assets/menu/beverages/fresh-lime-soda.png', 'Tangy lime juice with soda, cumin salt, and a touch of mint')
ON CONFLICT (id) DO NOTHING;

-- Reset sequence to avoid ID conflicts on future inserts
SELECT setval('menu_items_id_seq', (SELECT MAX(id) FROM public.menu_items));
