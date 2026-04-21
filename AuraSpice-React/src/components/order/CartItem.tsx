import { useCart } from '../../store/cartStore';

// ============================================
// CartItem — Agent 14
// ============================================
export function CartItem({ id }: { id: number }) {
  const { cart, dispatch } = useCart();
  const item = cart[id];
  if (!item) return null;

  return (
    <div className="cart-item-premium" data-id={String(id)}>
      <div className="cart-image-wrapper">
        <img src={item.image} className="cart-item-image" alt={item.name} />
      </div>
      <div className="cart-item-details">
        <h4 className="cart-item-title">{item.name}</h4>
        <span className="cart-item-unit-price">₹{item.price}</span>
      </div>
      <div className="cart-item-actions">
        <span className="cart-item-total">₹{item.price * item.qty}</span>
        <div className="cart-qty-pill">
          <button className="cart-qty-btn" onClick={() => dispatch({ type: 'REMOVE_ITEM', payload: id })}>−</button>
          <span className="cart-qty-num">{item.qty}</span>
          <button className="cart-qty-btn" onClick={() => dispatch({ type: 'INCREASE_QTY', payload: id })}>+</button>
        </div>
      </div>
    </div>
  );
}
