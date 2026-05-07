import { useRef } from 'react';
import { useCart } from '../../store/useCart';
import { CartItem } from './CartItem';
import { useTouchPhysics } from '../../hooks/useTouchPhysics';
import { useFocusTrap } from '../../hooks/useFocusTrap';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckout: () => void;
}

export function CartDrawer({ isOpen, onClose, onCheckout }: CartDrawerProps) {
  const { cart, totalPrice } = useCart();
  const items = Object.values(cart);
  const drawerRef = useRef<HTMLDivElement>(null);

  useTouchPhysics(drawerRef, 'right', isOpen, onClose);
  useFocusTrap(drawerRef, isOpen);

  return (
    <div
      ref={drawerRef}
      id="cart-drawer"
      className={`cart-drawer${isOpen ? ' open' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="cart-drawer-title"
      aria-hidden={!isOpen}
    >
      <div className="drawer-header">
        <h2 id="cart-drawer-title" className="drawer-title">Your Order</h2>
        <button className="close-drawer" data-close="cart" onClick={onClose} aria-label="Close cart drawer">✕</button>
      </div>

      <div id="cart-items" className="cart-items-list" aria-live="polite">
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
          <span id="cart-total" aria-live="polite">₹{totalPrice.toFixed(2)}</span>
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
