import { useRef } from 'react';
import { useCart } from '../../store/cartStore';
import { CartItem } from './CartItem';
import { useTouchPhysics } from '../../hooks/useTouchPhysics';

// ============================================
// CartDrawer — Agent 14 & 20
// ============================================
interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckout: () => void;
}

export function CartDrawer({ isOpen, onClose, onCheckout }: CartDrawerProps) {
  const { cart, totalQty, totalPrice } = useCart();
  const items = Object.values(cart);
  const drawerRef = useRef<HTMLDivElement>(null);

  useTouchPhysics(drawerRef, 'right', isOpen, onClose);

  return (
    <div
      ref={drawerRef}
      id="cart-drawer"
      className={`cart-drawer${isOpen ? ' open' : ''}`}
      aria-hidden={!isOpen}
    >
      <div className="drawer-header">
        <h2 className="drawer-title">Your Order</h2>
        <button className="close-drawer" data-close="cart" onClick={onClose} aria-label="Close cart">✕</button>
      </div>

      <div id="cart-items" className="cart-items-list">
        {items.length === 0 ? (
          <p className="cart-empty-fade" style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0', margin: 0 }}>
            Your cart is empty.
          </p>
        ) : (
          items.map((item) => <CartItem key={item.id} id={item.id} />)
        )}
      </div>

      <div className="cart-footer">
        <div className="cart-total-row">
          <span>Total</span>
          <span id="cart-total">₹{totalPrice}</span>
        </div>
        <button
          id="checkout-btn"
          className="btn-primary"
          style={{ width: '100%', marginTop: 16, opacity: items.length === 0 ? 0.5 : 1, cursor: items.length === 0 ? 'not-allowed' : 'pointer' }}
          disabled={items.length === 0}
          onClick={onCheckout}
        >
          Place Order
        </button>
      </div>
    </div>
  );
}
