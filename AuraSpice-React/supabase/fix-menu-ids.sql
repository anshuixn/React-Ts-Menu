-- ============================================================
-- AuraSpice: Fix "Menu item with ID X not found" glitch
-- 
-- Run this in your Supabase Dashboard → SQL Editor
-- This upserts all 29 menu items with the correct IDs
-- matching the frontend's menuData.ts
-- ============================================================

-- First, check what's currently in the table:
-- SELECT id, name FROM menu_items ORDER BY id;

-- Upsert all 29 items with the correct IDs
INSERT INTO public.menu_items (id, name, category, price, calories, image, "desc") VALUES
  (1,  'Dim Sum Platter',       'chinese',       249, 320, '/assets/menu/chinese/dimsum.webp',                          'Steamed crystal-skin dumplings filled with prawn and truffle, served with chili oil'),
  (2,  'Kung Pao Chicken',      'chinese',       289, 450, '/assets/menu/chinese/kungpao.webp',                         'Wok-fired chicken with roasted peanuts, dried chilies, and Wok Hei finish'),
  (3,  'Chilli Paneer',         'chinese',       229, 380, '/assets/menu/chinese/chilli-paneer.webp',                   'Crispy paneer cubes tossed in a fiery Indo-Chinese chili garlic sauce'),
  (4,  'Hakka Noodles',         'chinese',       199, 420, '/assets/menu/chinese/hakka-noodles.webp',                   'Wok-tossed egg noodles with julienned vegetables and soy glaze'),
  (5,  'Veg Manchurian',        'chinese',       209, 350, '/assets/menu/chinese/veg-manchurian.webp',                  'Deep-fried veggie balls in a tangy Manchurian gravy with spring onions'),
  (6,  'Spring Rolls',          'chinese',       179, 280, '/assets/menu/chinese/spring-rolls.webp',                    'Golden crispy rolls stuffed with cabbage, carrots, and glass noodles'),
  (7,  'Fried Rice',            'chinese',       219, 480, '/assets/menu/chinese/fried-rice.webp',                      'Classic wok-fried rice with egg, vegetables, and a hint of sesame'),
  (8,  'Pepper Steak',          'chinese',       399, 520, '/assets/menu/chinese/steak.webp',                           'Seared steak strips in a black pepper sauce with bell peppers'),
  (9,  'Butter Chicken',        'north-indian',  349, 550, '/assets/menu/north-indian/butter-chicken.webp',             'Tandoori chicken in a rich, creamy tomato-butter gravy — the undisputed classic'),
  (10, 'Paneer Butter Masala',  'north-indian',  299, 480, '/assets/menu/north-indian/paneer-butter-masala.webp',       'Soft paneer cubes in a velvety makhani gravy with a touch of cream'),
  (11, 'Chicken Biryani',       'north-indian',  329, 620, '/assets/menu/north-indian/chicken-biryani.webp',            'Dum-cooked basmati rice layered with spiced chicken, saffron, and caramelized onions'),
  (12, 'Dal Makhani',           'north-indian',  249, 380, '/assets/menu/north-indian/dal-makhani.webp',                'Black lentils slow-cooked overnight with butter and cream — pure comfort'),
  (13, 'Garlic Naan',           'north-indian',   69, 260, '/assets/menu/north-indian/garlic-naan.webp',                'Soft tandoori naan brushed with garlic butter and fresh coriander'),
  (14, 'Masala Dosa',           'south-indian',  149, 350, '/assets/menu/south-indian/masala-dosa.webp',                'Crispy rice-batter crepe filled with spiced potato masala, served with chutneys'),
  (15, 'Idli Sambar',           'south-indian',  119, 220, '/assets/menu/south-indian/idli-sambar.webp',                'Fluffy steamed rice cakes served with hot sambar and coconut chutney'),
  (16, 'Medu Vada',             'south-indian',   99, 280, '/assets/menu/south-indian/medu-vada.webp',                  'Crispy urad dal fritters — golden on the outside, soft and fluffy inside'),
  (17, 'Uttapam',               'south-indian',  139, 310, '/assets/menu/south-indian/uttapam.webp',                    'Thick rice pancake topped with onions, tomatoes, and green chilies'),
  (18, 'Filter Coffee',         'south-indian',   79,  80, '/assets/menu/south-indian/filter-coffee.webp',              'Traditional South Indian filter coffee — strong, frothy, and aromatic'),
  (19, 'Classic Smash Burger',  'fast-food',     279, 680, '/assets/menu/fast-food/burger.webp',                        'Double-smashed beef patty with cheddar, caramelized onions, and house sauce'),
  (20, 'Loaded Fries',          'fast-food',     179, 450, '/assets/menu/fast-food/french-fries.webp',                  'Crispy golden fries topped with cheese sauce, jalapeños, and crispy bacon bits'),
  (21, 'Steamed Momos',         'fast-food',     149, 300, '/assets/menu/fast-food/momos.webp',                         'Juicy chicken momos steamed in bamboo baskets, served with spicy red chutney'),
  (22, 'Penne Arrabiata',       'fast-food',     249, 520, '/assets/menu/fast-food/pasta.webp',                         'Al dente penne in a spiced tomato-garlic arrabiata sauce with fresh basil'),
  (23, 'Loaded Pizza',          'fast-food',     329, 750, '/assets/menu/fast-food/pizza.webp',                         'Hand-tossed crust loaded with mozzarella, pepperoni, olives, and jalapeños'),
  (24, 'Club Sandwich',         'fast-food',     219, 480, '/assets/menu/fast-food/sandwich.webp',                      'Triple-decker with grilled chicken, bacon, lettuce, tomato, and herb mayo'),
  (25, 'Virgin Mojito',         'beverages',     159, 120, '/assets/menu/beverages/mojito.webp',                        'Fresh lime, mint leaves, and soda — shaken and chilled to perfection'),
  (26, 'Cold Coffee',           'beverages',     149, 200, '/assets/menu/beverages/cold-coffee.webp',                   'Creamy blended cold coffee with a frothy top and a hint of vanilla'),
  (27, 'Mango Shake',           'beverages',     129, 280, '/assets/menu/beverages/mango-shake.webp',                   'Thick and luscious Alphonso mango shake made with real fruit pulp'),
  (28, 'Masala Chai',           'beverages',      49,  80, '/assets/menu/beverages/masala-chai.webp',                   'Spiced Indian tea with ginger, cardamom, and cloves — brewed fresh'),
  (29, 'Fresh Lime Soda',       'beverages',      89,  60, '/assets/menu/beverages/fresh-lime-soda.webp',               'Tangy lime juice with soda, cumin salt, and a touch of mint')
ON CONFLICT (id) DO UPDATE SET
  name         = EXCLUDED.name,
  category     = EXCLUDED.category,
  price        = EXCLUDED.price,
  calories     = EXCLUDED.calories,
  image        = EXCLUDED.image,
  "desc"       = EXCLUDED."desc",
  is_available = true;

-- Reset the serial sequence so future inserts don't collide
SELECT setval('menu_items_id_seq', (SELECT MAX(id) FROM public.menu_items));

-- Verify: should show 29 rows with ids 1-29
SELECT id, name, price FROM public.menu_items ORDER BY id;
