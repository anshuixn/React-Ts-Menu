import { useEffect } from 'react';
import { menuData } from '../../data/menuData';
import type { Category } from '../../types';
import { MenuCard } from './MenuCard';

// ============================================
// MenuGrid — Agent 16
// ============================================
interface MenuGridProps {
  filter: Category;
}

export function MenuGrid({ filter }: MenuGridProps) {
  const items = filter === 'all' ? menuData : menuData.filter((i) => i.category === filter);

  useEffect(() => {
    // Trigger reveal animations for newly rendered cards
    const cards = document.querySelectorAll('#menu-items .reveal');
    requestAnimationFrame(() => cards.forEach((c) => c.classList.add('active')));
  }, [filter]);

  return (
    <div className="menu-grid" id="menu-items">
      {items.map((item) => (
        <MenuCard key={item.id} item={item} />
      ))}
    </div>
  );
}
