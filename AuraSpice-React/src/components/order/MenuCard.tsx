import { useState, useCallback, useRef } from 'react';
import type { MenuItem } from '../../types';
import { useCart } from '../../store/useCart';
import { FALLBACK_MENU_IMAGE, resolveImageSrc } from '../../lib/imageSrc';

export function MenuCard({ item }: { item: MenuItem }) {
  const { cart, dispatch } = useCart();
  const btnRef = useRef<HTMLButtonElement>(null);
  const qty = cart[item.id]?.qty ?? 0;
  const [addedState, setAddedState] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [prevImage, setPrevImage] = useState(item.image);

  if (item.image !== prevImage) {
    setPrevImage(item.image);
    setImageError(false);
  }

  const imageSrc = imageError ? FALLBACK_MENU_IMAGE : resolveImageSrc(item.image);

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = btnRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    btn.style.transition = 'transform 0.05s linear';
    btn.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px) scale(1.05)`;
  }, []);

  const onMouseLeave = useCallback(() => {
    if (btnRef.current) {
      btnRef.current.style.transition = '';
      btnRef.current.style.transform = '';
    }
  }, []);

  const spawnParticle = useCallback(() => {
    const btn = btnRef.current;
    const cartOrb = document.getElementById('cart-orb');
    if (!btn || !cartOrb) return;
    const rect = btn.getBoundingClientRect();
    const orbRect = cartOrb.getBoundingClientRect();

    const p = document.createElement('div');
    p.className = 'add-particle';
    p.style.left = `${rect.left + rect.width / 2}px`;
    p.style.top = `${rect.top + rect.height / 2}px`;
    document.body.appendChild(p);

    requestAnimationFrame(() => {
      const deltaX = (orbRect.left + orbRect.width / 2) - (rect.left + rect.width / 2);
      const deltaY = (orbRect.top + orbRect.height / 2) - (rect.top + rect.height / 2);
      p.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(0)`;
    });
    setTimeout(() => p.remove(), 600);
  }, []);

  const handleAdd = useCallback(() => {
    dispatch({ type: 'ADD_ITEM', payload: item });
    spawnParticle();

    const currentQty = cart[item.id]?.qty ?? 0;
    const nextQty = currentQty + 1;

    setAddedState(true);
    setTimeout(() => {
      setAddedState(false);
    }, 800);

    // Badge bounce via DOM — ephemeral visual effect only
    const badge = document.getElementById('cart-badge');
    if (badge) {
      badge.classList.remove('badge-bounce');
      void badge.offsetWidth;
      badge.classList.add('badge-bounce');
    }

    // Use nextQty in closure to avoid stale reference warning
    void nextQty;
  }, [dispatch, item, cart, spawnParticle]);

  const buttonLabel = addedState
    ? '✓ Added'
    : qty > 0
      ? `Add (+${qty})`
      : 'Add';

  return (
    <div className="menu-card" style={{ transitionDelay: '0s' }}>
      <div className="card-image">
        <img
          src={imageSrc}
          alt={item.name}
          loading="lazy"
          onError={() => setImageError(true)}
        />
      </div>
      <div className="card-content">
        <h3 className="card-title">{item.name}</h3>
        <p className="card-desc">{item.desc}</p>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: 6 }}>{item.calories} cal</div>
        <div className="card-footer">
          <span className="price">₹{item.price}</span>
          <button
            ref={btnRef}
            id={`add-btn-${item.id}`}
            className={`btn-primary btn-add btn-magnetic${addedState ? ' added' : ''}`}
            onMouseMove={onMouseMove}
            onMouseLeave={onMouseLeave}
            onClick={handleAdd}
            aria-label={`Add ${item.name} to cart`}
          >
            {buttonLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
