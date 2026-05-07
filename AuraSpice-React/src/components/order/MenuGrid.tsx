import { useEffect, useState } from 'react';
import { menuData as fallbackMenuData } from '../../data/menuData';
import type { Category, MenuItem } from '../../types';
import { MenuCard } from './MenuCard';
import { SkeletonCard } from '../ui/SkeletonCard';
import { resolveImageSrc } from '../../lib/imageSrc';

interface MenuGridProps {
  filter: Category;
}

export function MenuGrid({ filter }: MenuGridProps) {
  // Start with static data immediately — loading:false prevents any skeleton hang
  const [menuItems, setMenuItems] = useState<MenuItem[]>(fallbackMenuData);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const fetchMenu = async () => {
      const controller = new AbortController();
      // 4 second timeout — fail fast so we never block the menu
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      try {
        const response = await fetch('/api/menu', { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!response.ok) return; // silently keep static data

        const payload = await response.json() as { success: boolean; items?: MenuItem[] };

        if (!cancelled && payload.success && Array.isArray(payload.items) && payload.items.length > 0) {
          const normalizedItems = payload.items.map((menuItem) => ({
            ...menuItem,
            image: resolveImageSrc(menuItem.image),
          }));
          setMenuItems(normalizedItems);
        }
      } catch {
        // AbortError (timeout) or network error — keep static data, don't log
        clearTimeout(timeoutId);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void fetchMenu();

    return () => {
      cancelled = true;
    };
  }, []);

  const items = filter === 'all' ? menuItems : menuItems.filter((i) => i.category === filter);

  if (loading) {
    return (
      <div className="menu-grid" id="menu-items">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="menu-grid" id="menu-items">
      {items.map((item) => (
        <MenuCard key={item.id} item={item} />
      ))}
    </div>
  );
}
