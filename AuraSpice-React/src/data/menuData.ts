import type { MenuItem } from '../types';

// ============================================
// AURA & SPICE — Menu Data (29 items typed)
// ============================================
export const menuData: MenuItem[] = [
  // ===== CHINESE (8) =====
  { id: 1,  name: 'Dim Sum Platter',   category: 'chinese', price: 249, calories: 320, image: '/assets/menu/chinese/dimsum.png',          desc: 'Steamed crystal-skin dumplings filled with prawn and truffle, served with chili oil' },
  { id: 2,  name: 'Kung Pao Chicken',  category: 'chinese', price: 289, calories: 450, image: '/assets/menu/chinese/kungpao.png',         desc: 'Wok-fired chicken with roasted peanuts, dried chilies, and Wok Hei finish' },
  { id: 3,  name: 'Chilli Paneer',     category: 'chinese', price: 229, calories: 380, image: '/assets/menu/chinese/chilli-paneer.png',   desc: 'Crispy paneer cubes tossed in a fiery Indo-Chinese chili garlic sauce' },
  { id: 4,  name: 'Hakka Noodles',     category: 'chinese', price: 199, calories: 420, image: '/assets/menu/chinese/hakka-noodles.png',   desc: 'Wok-tossed egg noodles with julienned vegetables and soy glaze' },
  { id: 5,  name: 'Veg Manchurian',    category: 'chinese', price: 209, calories: 350, image: '/assets/menu/chinese/veg-manchurian.png',  desc: 'Deep-fried veggie balls in a tangy Manchurian gravy with spring onions' },
  { id: 6,  name: 'Spring Rolls',      category: 'chinese', price: 179, calories: 280, image: '/assets/menu/chinese/spring-rolls.png',    desc: 'Golden crispy rolls stuffed with cabbage, carrots, and glass noodles' },
  { id: 7,  name: 'Fried Rice',        category: 'chinese', price: 219, calories: 480, image: '/assets/menu/chinese/fried-rice.png',      desc: 'Classic wok-fried rice with egg, vegetables, and a hint of sesame' },
  { id: 8,  name: 'Pepper Steak',      category: 'chinese', price: 399, calories: 520, image: '/assets/menu/chinese/steak.png',           desc: 'Seared steak strips in a black pepper sauce with bell peppers' },

  // ===== NORTH INDIAN (5) =====
  { id: 9,  name: 'Butter Chicken',       category: 'north-indian', price: 349, calories: 550, image: '/assets/menu/north-indian/butter-chicken.png',       desc: 'Tandoori chicken in a rich, creamy tomato-butter gravy — the undisputed classic' },
  { id: 10, name: 'Paneer Butter Masala', category: 'north-indian', price: 299, calories: 480, image: '/assets/menu/north-indian/paneer-butter-masala.png', desc: 'Soft paneer cubes in a velvety makhani gravy with a touch of cream' },
  { id: 11, name: 'Chicken Biryani',      category: 'north-indian', price: 329, calories: 620, image: '/assets/menu/north-indian/chicken-biryani.png',      desc: 'Dum-cooked basmati rice layered with spiced chicken, saffron, and caramelized onions' },
  { id: 12, name: 'Dal Makhani',          category: 'north-indian', price: 249, calories: 380, image: '/assets/menu/north-indian/dal-makhani.png',          desc: 'Black lentils slow-cooked overnight with butter and cream — pure comfort' },
  { id: 13, name: 'Garlic Naan',          category: 'north-indian', price: 69,  calories: 260, image: '/assets/menu/north-indian/garlic-naan.png',          desc: 'Soft tandoori naan brushed with garlic butter and fresh coriander' },

  // ===== SOUTH INDIAN (5) =====
  { id: 14, name: 'Masala Dosa',   category: 'south-indian', price: 149, calories: 350, image: '/assets/menu/south-indian/masala-dosa.png',   desc: 'Crispy rice-batter crepe filled with spiced potato masala, served with chutneys' },
  { id: 15, name: 'Idli Sambar',   category: 'south-indian', price: 119, calories: 220, image: '/assets/menu/south-indian/idli-sambar.png',   desc: 'Fluffy steamed rice cakes served with hot sambar and coconut chutney' },
  { id: 16, name: 'Medu Vada',     category: 'south-indian', price: 99,  calories: 280, image: '/assets/menu/south-indian/medu-vada.png',     desc: 'Crispy urad dal fritters — golden on the outside, soft and fluffy inside' },
  { id: 17, name: 'Uttapam',       category: 'south-indian', price: 139, calories: 310, image: '/assets/menu/south-indian/uttapam.png',       desc: 'Thick rice pancake topped with onions, tomatoes, and green chilies' },
  { id: 18, name: 'Filter Coffee', category: 'south-indian', price: 79,  calories: 80,  image: '/assets/menu/south-indian/filter-coffee.png', desc: 'Traditional South Indian filter coffee — strong, frothy, and aromatic' },

  // ===== FAST FOOD (6) =====
  { id: 19, name: 'Classic Smash Burger', category: 'fast-food', price: 279, calories: 680, image: '/assets/menu/fast-food/burger.png',       desc: 'Double-smashed beef patty with cheddar, caramelized onions, and house sauce' },
  { id: 20, name: 'Loaded Fries',         category: 'fast-food', price: 179, calories: 450, image: '/assets/menu/fast-food/french-fries.png', desc: 'Crispy golden fries topped with cheese sauce, jalapeños, and crispy bacon bits' },
  { id: 21, name: 'Steamed Momos',        category: 'fast-food', price: 149, calories: 300, image: '/assets/menu/fast-food/momos.png',        desc: 'Juicy chicken momos steamed in bamboo baskets, served with spicy red chutney' },
  { id: 22, name: 'Penne Arrabiata',      category: 'fast-food', price: 249, calories: 520, image: '/assets/menu/fast-food/pasta.png',        desc: 'Al dente penne in a spicy tomato-garlic arrabiata sauce with fresh basil' },
  { id: 23, name: 'Loaded Pizza',         category: 'fast-food', price: 329, calories: 750, image: '/assets/menu/fast-food/pizza.png',        desc: 'Hand-tossed crust loaded with mozzarella, pepperoni, olives, and jalapeños' },
  { id: 24, name: 'Club Sandwich',        category: 'fast-food', price: 219, calories: 480, image: '/assets/menu/fast-food/sandwich.png',     desc: 'Triple-decker with grilled chicken, bacon, lettuce, tomato, and herb mayo' },

  // ===== BEVERAGES (5) =====
  { id: 25, name: 'Virgin Mojito',   category: 'beverages', price: 159, calories: 120, image: '/assets/menu/beverages/mojito.png',          desc: 'Fresh lime, mint leaves, and soda — shaken and chilled to perfection' },
  { id: 26, name: 'Cold Coffee',     category: 'beverages', price: 149, calories: 200, image: '/assets/menu/beverages/cold-coffee.png',     desc: 'Creamy blended cold coffee with a frothy top and a hint of vanilla' },
  { id: 27, name: 'Mango Shake',     category: 'beverages', price: 129, calories: 280, image: '/assets/menu/beverages/mango-shake.png',     desc: 'Thick and luscious Alphonso mango shake made with real fruit pulp' },
  { id: 28, name: 'Masala Chai',     category: 'beverages', price: 49,  calories: 80,  image: '/assets/menu/beverages/masala-chai.png',     desc: 'Spiced Indian tea with ginger, cardamom, and cloves — brewed fresh' },
  { id: 29, name: 'Fresh Lime Soda', category: 'beverages', price: 89,  calories: 60,  image: '/assets/menu/beverages/fresh-lime-soda.png', desc: 'Tangy lime juice with soda, cumin salt, and a touch of mint' },
];
