import type { DishPillData } from '../../types';

// ============================================
// DishPill — Agent 12
// Renders real food image thumbnail + name + price
// ============================================
export function DishPill({ image, name, price }: DishPillData) {
  return (
    <div className="dish-pill">
      <img className="dish-pill-img" src={image} alt={name} />
      {name}
      <span className="dish-price">₹{price}</span>
    </div>
  );
}
