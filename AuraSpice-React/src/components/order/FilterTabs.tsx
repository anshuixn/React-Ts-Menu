import type { Category } from '../../types';


interface TabDef {
  label: string;
  value: Category;
  icon: string;    // path under /icons/
}

const TABS: TabDef[] = [
  { label: 'All',          value: 'all',          icon: '/icons/all.png' },
  { label: 'Chinese',      value: 'chinese',      icon: '/icons/chinese.png' },
  { label: 'North Indian', value: 'north-indian', icon: '/icons/north-indian.png' },
  { label: 'South Indian', value: 'south-indian', icon: '/icons/south-indian.png' },
  { label: 'Fast Food',    value: 'fast-food',    icon: '/icons/fast-food.png' },
  { label: 'Beverages',    value: 'beverages',    icon: '/icons/beverages.png' },
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
          <img
            src={tab.icon}
            alt={tab.label}
            className="filter-tab-icon"
            draggable={false}
          />
          <span className="filter-tab-label">{tab.label}</span>
        </button>
      ))}
    </div>
  );
}
