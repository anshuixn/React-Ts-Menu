import type { Category } from '../../types';

// ============================================
// FilterTabs — Agent 16
// ============================================
const TABS: { label: string; value: Category }[] = [
  { label: 'All',          value: 'all' },
  { label: '🥢 Chinese',   value: 'chinese' },
  { label: '🍛 North Indian', value: 'north-indian' },
  { label: '🥞 South Indian', value: 'south-indian' },
  { label: '🍔 Fast Food', value: 'fast-food' },
  { label: '🥤 Beverages', value: 'beverages' },
];

interface FilterTabsProps {
  active: Category;
  onChange: (cat: Category) => void;
}

export function FilterTabs({ active, onChange }: FilterTabsProps) {
  return (
    <div className="filter-tabs" id="filter-tabs">
      {TABS.map((tab) => (
        <button
          key={tab.value}
          className={`filter-tab${active === tab.value ? ' active' : ''}`}
          data-filter={tab.value}
          onClick={() => onChange(tab.value)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
