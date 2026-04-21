import { useScrollReveal } from '../hooks/useScrollReveal';
import { useParallax } from '../hooks/useParallax';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { HeroSection } from '../components/home/HeroSection';
import { StatsBar } from '../components/home/StatsBar';
import { CuisineSection } from '../components/home/CuisineSection';
import { GallerySection } from '../components/home/GallerySection';
import { CtaBanner } from '../components/home/CtaBanner';
import type { CuisineSectionProps } from '../types';

// ============================================
// HomePage — Agent 18
// ============================================
const cuisines: CuisineSectionProps[] = [
  {
    chapter: 'Chapter I', title: 'Wok & Fire', reversed: false,
    image: '/assets/menu/chinese/kungpao.png', alt: 'Wok and Fire Chinese Cuisine',
    desc: 'From the roaring heat of the wok to the delicate folds of our artisanal Dim Sum — our Chinese kitchen is an orchestra of fire, smoke, and Szechuan spice.',
    dishes: [
      { image: '/assets/menu/chinese/dimsum.png',        name: 'Dim Sum Platter', price: 249 },
      { image: '/assets/menu/chinese/chilli-paneer.png', name: 'Chilli Paneer',   price: 229 },
      { image: '/assets/menu/chinese/hakka-noodles.png', name: 'Hakka Noodles',   price: 199 },
    ],
    orderLink: '/order?table=01&filter=chinese',
  },
  {
    chapter: 'Chapter II', title: 'Royal North Indian', reversed: true,
    image: '/assets/menu/north-indian/butter-chicken.png', alt: 'North Indian Butter Chicken',
    desc: 'Rich Mughlai gravies, tandoor-kissed naan, and aromatic biryanis — our North Indian kitchen brings the warmth and grandeur of royal recipes to your table.',
    dishes: [
      { image: '/assets/menu/north-indian/butter-chicken.png',       name: 'Butter Chicken',       price: 349 },
      { image: '/assets/menu/north-indian/paneer-butter-masala.png', name: 'Paneer Butter Masala', price: 299 },
      { image: '/assets/menu/north-indian/garlic-naan.png',          name: 'Garlic Naan',           price: 69  },
    ],
    orderLink: '/order?table=01&filter=north-indian',
  },
  {
    chapter: 'Chapter III', title: 'South Indian Traditions', reversed: false,
    image: '/assets/menu/south-indian/masala-dosa.png', alt: 'South Indian Masala Dosa',
    desc: 'Crispy dosas on iron tawas, fluffy idlis steamed to perfection, and filter coffee brewed with generations of ritual — the soul of South India on a plate.',
    dishes: [
      { image: '/assets/menu/south-indian/masala-dosa.png',   name: 'Masala Dosa',  price: 149 },
      { image: '/assets/menu/south-indian/idli-sambar.png',   name: 'Idli Sambar',  price: 119 },
      { image: '/assets/menu/south-indian/filter-coffee.png', name: 'Filter Coffee', price: 79  },
    ],
    orderLink: '/order?table=01&filter=south-indian',
  },
  {
    chapter: 'Chapter IV', title: 'Quick Bites & Cravings', reversed: true,
    image: '/assets/menu/fast-food/burger.png', alt: 'Gourmet Burger',
    desc: 'When hunger calls for something fast but never basic — gourmet burgers, loaded fries, steaming momos, and hand-tossed pizzas that hit different.',
    dishes: [
      { image: '/assets/menu/fast-food/burger.png', name: 'Classic Smash Burger', price: 279 },
      { image: '/assets/menu/fast-food/momos.png',  name: 'Steamed Momos',        price: 149 },
      { image: '/assets/menu/fast-food/pizza.png',  name: 'Loaded Pizza',         price: 329 },
    ],
    orderLink: '/order?table=01&filter=fast-food',
  },
  {
    chapter: 'Chapter V', title: 'Sips & Refreshers', reversed: false,
    image: '/assets/menu/beverages/mojito.png', alt: 'Refreshing Mojito',
    desc: 'From classic masala chai to chilled mojitos and creamy cold coffees — the perfect companion to every meal. Handcrafted, never rushed.',
    dishes: [
      { image: '/assets/menu/beverages/mojito.png',      name: 'Virgin Mojito', price: 159 },
      { image: '/assets/menu/beverages/masala-chai.png', name: 'Masala Chai',   price: 49  },
      { image: '/assets/menu/beverages/mango-shake.png', name: 'Mango Shake',   price: 129 },
    ],
    orderLink: '/order?table=01&filter=beverages',
  },
];

export default function HomePage() {
  const containerRef = useScrollReveal();
  useParallax();

  return (
    <div ref={containerRef}>
      <Header />
      <HeroSection />
      <StatsBar />
      {cuisines.map((c) => <CuisineSection key={c.chapter} {...c} />)}
      <GallerySection />
      <CtaBanner />
      <Footer />
    </div>
  );
}
