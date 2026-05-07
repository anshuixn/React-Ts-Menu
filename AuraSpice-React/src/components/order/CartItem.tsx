import { useState } from 'react';
import { useCart } from '../../store/useCart';
import { FALLBACK_MENU_IMAGE, resolveImageSrc } from '../../lib/imageSrc';

export function CartItem({ id }: { id: number }) {
  const { cart, dispatch } = useCart();
  const item = cart[id];
  const [imageError, setImageError] = useState(false);
  const [prevImage, setPrevImage] = useState(item?.image);

  if (item?.image !== prevImage) {
    setPrevImage(item?.image);
    setImageError(false);
  }

  if (!item) return null;

  const imageSrc = imageError ? FALLBACK_MENU_IMAGE : resolveImageSrc(item?.image);

  return (
    <div className="cart-item-premium" data-id={String(id)}>
      <div className="cart-image-wrapper">
        <img
          src={imageSrc}
          className="cart-item-image"
          alt={item.name}
          onError={() => setImageError(true)}
        />
      </div>
      <div className="cart-item-details">
        <h4 className="cart-item-title">{item.name}</h4>
        <span className="cart-item-unit-price">₹{item.price}</span>
      </div>
      <div className="cart-item-actions">
        <span className="cart-item-total">₹{item.price * item.qty}</span>
        <div className="cart-qty-pill">
          <button className="cart-qty-btn" onClick={() => dispatch({ type: 'REMOVE_ITEM', payload: id })} aria-label={`Remove one ${item.name}`}>−</button>
          <span className="cart-qty-num">{item.qty}</span>
          <button className="cart-qty-btn" onClick={() => dispatch({ type: 'INCREASE_QTY', payload: id })} aria-label={`Add one more ${item.name}`}>+</button>
        </div>
      </div>
    </div>
  );
}
