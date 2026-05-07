import type { DishPillData } from '../../types';


export function DishPill({ image, name, price }: DishPillData) {
  return (
    <div className="dish-pill">
      <img className="dish-pill-img" src={image} alt={name} />
      {name}
      <span className="dish-price">₹{price}</span>
    </div>
  );
}
