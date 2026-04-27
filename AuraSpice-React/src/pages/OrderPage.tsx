import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CartProvider, useCart } from '../store/cartStore';
import { FilterTabs } from '../components/order/FilterTabs';
import { MenuGrid } from '../components/order/MenuGrid';
import { CartDrawer } from '../components/order/CartDrawer';
import { StatusDrawer } from '../components/order/StatusDrawer';
import { OrbButton, SuccessOverlay } from '../components/order/OrbButton';
import { TableSelector } from '../components/order/TableSelector';
import { useAudio } from '../hooks/useAudio';
import { useOrderPolling } from '../hooks/useOrderPolling';
import type { Category, Order } from '../types';

// ============================================
// OrderPageInner — needs CartProvider above it
// Agent 18
// ============================================
function OrderPageInner() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTable = searchParams.get('table');

  // If no table param in URL → show the selector immediately
  const [tableNumber, setTableNumber] = useState<string>(initialTable ?? '');
  const [showTableSelector, setShowTableSelector] = useState<boolean>(!initialTable);

  const initialFilter = (searchParams.get('filter') ?? 'all') as Category;

  const [activeFilter, setActiveFilter] = useState<Category>(initialFilter);
  const [cartOpen, setCartOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(
    () => sessionStorage.getItem('currentOrderId')
  );

  const { cart, dispatch, totalQty } = useCart();
  const { playSwoosh, playChime } = useAudio();
  const { status, trackerData } = useOrderPolling(currentOrderId);

  // Play chime when order status changes to cooking/ready/completed
  useEffect(() => {
    if (status && ['cooking', 'ready', 'completed'].includes(status)) {
      playChime();
    }
  }, [status, playChime]);

  const handleSelectTable = useCallback((table: string) => {
    setTableNumber(table);
    setShowTableSelector(false);
    // Sync to URL so the QR link stays shareable
    setSearchParams((prev) => { prev.set('table', table); return prev; }, { replace: true });
  }, [setSearchParams]);

  const openCart = useCallback(() => {
    playSwoosh();
    setCartOpen(true);
    setStatusOpen(false);
  }, [playSwoosh]);

  const openStatus = useCallback(() => {
    playSwoosh();
    setStatusOpen(true);
    setCartOpen(false);
  }, [playSwoosh]);

  const submitOrder = useCallback(async () => {
    const items = Object.values(cart);
    if (items.length === 0) return;
    if (!tableNumber) {
      setShowTableSelector(true);
      return;
    }

    const orderId = `ORD-${Date.now()}`;
    const order: Order = {
      id: orderId,
      table: tableNumber,
      items: items.map((i) => ({ id: i.id, name: i.name, qty: i.qty, price: i.price })),
      total: items.reduce((sum, i) => sum + i.price * i.qty, 0),
      status: 'new',
      timestamp: new Date().toISOString(),
    };

    try {
      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order),
      });
    } catch (_) {}

    dispatch({ type: 'CLEAR_CART' });
    setCartOpen(false);
    setCurrentOrderId(orderId);
    sessionStorage.setItem('currentOrderId', orderId);

    setShowOverlay(true);
    setTimeout(() => setShowOverlay(false), 2500);
  }, [cart, dispatch, tableNumber]);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-dark)', paddingTop: 80 }}>
      {/* Page Header */}
      <div className="order-page-header" style={{ padding: '30px 5% 20px', borderBottom: '1px solid var(--glass-border)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div className="logo" style={{ fontSize: '1.4rem' }}>Aura<span>&</span>Spice</div>

          {/* Table badge — clickable to change table */}
          <button
            id="table-selector-btn"
            onClick={() => setShowTableSelector(true)}
            title="Tap to change table"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(212, 175, 55, 0.08)',
              border: '1px solid rgba(212, 175, 55, 0.35)',
              borderRadius: 10,
              padding: '6px 14px',
              cursor: 'pointer',
              transition: 'all 0.25s ease',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(212,175,55,0.16)';
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(212,175,55,0.6)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(212,175,55,0.08)';
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(212,175,55,0.35)';
            }}
          >
            <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>🪑 Table</span>
            <span style={{ color: 'var(--accent-gold)', fontWeight: 700, fontSize: '1rem', minWidth: 24 }}>
              {tableNumber ? parseInt(tableNumber) : '—'}
            </span>
            <span style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>✎</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ padding: '20px 5%', maxWidth: 1200, margin: '0 auto' }}>
        <FilterTabs active={activeFilter} onChange={setActiveFilter} />
      </div>

      {/* Menu Grid */}
      <div style={{ padding: '0 5% 120px', maxWidth: 1200, margin: '0 auto' }}>
        <MenuGrid filter={activeFilter} />
      </div>

      {/* Floating Orbs */}
      <OrbButton
        id="status-orb"
        icon="📋"
        ariaLabel="View order status"
        ariaExpanded={statusOpen}
        onClick={openStatus}
        badge={status ? 1 : 0}
        badgeId="status-badge"
        glowClass="status-glow"
        style={{ position: 'fixed', bottom: 110, left: 30, zIndex: 900 }}
      />
      <OrbButton
        id="cart-orb"
        icon="🛒"
        badge={totalQty}
        badgeId="cart-badge"
        glowClass="cart-glow"
        ariaLabel="Open cart"
        ariaExpanded={cartOpen}
        onClick={openCart}
        style={{ position: 'fixed', bottom: 30, right: 30, zIndex: 900 }}
      />

      {/* Backdrop */}
      {(cartOpen || statusOpen) && (
        <div
          id="orb-backdrop"
          className="orb-backdrop open"
          onClick={() => { setCartOpen(false); setStatusOpen(false); }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 800 }}
        />
      )}

      {/* Drawers */}
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} onCheckout={submitOrder} />
      <StatusDrawer isOpen={statusOpen} onClose={() => setStatusOpen(false)} status={status} trackerData={trackerData} />

      {/* Success Overlay */}
      <SuccessOverlay active={showOverlay} />

      {/* Table Selector Modal */}
      <TableSelector
        isOpen={showTableSelector}
        current={tableNumber}
        onSelect={handleSelectTable}
      />
    </div>
  );
}

export default function OrderPage() {
  return (
    <CartProvider>
      <OrderPageInner />
    </CartProvider>
  );
}
