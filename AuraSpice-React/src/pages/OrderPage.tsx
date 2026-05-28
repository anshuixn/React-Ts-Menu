import { Suspense, lazy, useState, useCallback, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CartProvider } from '../store/cartStore';
import { useCart } from '../store/useCart';
import { FilterTabs } from '../components/order/FilterTabs';
import { MenuGrid } from '../components/order/MenuGrid';
import { CartDrawer } from '../components/order/CartDrawer';
import { OrbButton, SuccessOverlay } from '../components/order/OrbButton';
import { TableSelector } from '../components/order/TableSelector';
import { useAudio } from '../hooks/useAudio';
import { useOrderPolling } from '../hooks/useOrderPolling';
import { safeSessionStorage } from '../lib/storage';
import type { Category } from '../types';

const StatusDrawer = lazy(async () => {
  const module = await import('../components/order/StatusDrawer');
  return { default: module.StatusDrawer };
});

function OrderPageInner() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTable = searchParams.get('table');

  const [tableNumber, setTableNumber] = useState<string>(initialTable ?? '');
  const [showTableSelector, setShowTableSelector] = useState<boolean>(!initialTable);

  const initialFilter = (searchParams.get('filter') ?? 'all') as Category;

  const [activeFilter, setActiveFilter] = useState<Category>(initialFilter);
  const [cartOpen, setCartOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(
    () => safeSessionStorage.getItem('currentOrderId')
  );
  const [currentTrackingToken, setCurrentTrackingToken] = useState<string | null>(
    () => safeSessionStorage.getItem('currentTrackingToken')
  );

  const { cart, dispatch, totalQty } = useCart();
  const { playSwoosh, playChime } = useAudio();
  const { status, trackerData } = useOrderPolling(currentOrderId, tableNumber || null, currentTrackingToken);
  const prevStatusRef = useRef<string | null>(null);

  useEffect(() => {
    if (!status) return;
    
    if (prevStatusRef.current && prevStatusRef.current !== status) {
      if (['cooking', 'ready', 'completed'].includes(status)) {
        playChime();
      }
      
      if (status === 'completed' && !statusOpen) {
        setStatusOpen(true);
      }
    }
    prevStatusRef.current = status;
  }, [status, playChime, statusOpen]);

  const handleSelectTable = useCallback((table: string) => {
    setTableNumber(table);
    setShowTableSelector(false);
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

    try {
      const response = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table_number: tableNumber,
          items: items.map((i) => ({ id: i.id, qty: i.qty })),
        }),
      });

      const payload = await response.json() as {
        success: boolean;
        message?: string;
        order?: { id: string; tracking_token: string };
      };

      if (!response.ok || !payload.success) {
        throw new Error(payload.message ?? 'Unable to place order');
      }

      const orderId = payload.order?.id;
      const trackingToken = payload.order?.tracking_token;
      if (!orderId || !trackingToken) {
        throw new Error('Invalid response from server');
      }

      dispatch({ type: 'CLEAR_CART' });
      // Clear any previous order tracking state before setting the new one
      safeSessionStorage.removeItem('currentOrderId');
      safeSessionStorage.removeItem('currentTrackingToken');
      setCartOpen(false);
      setCurrentOrderId(orderId);
      setCurrentTrackingToken(trackingToken);
      safeSessionStorage.setItem('currentOrderId', orderId);
      safeSessionStorage.setItem('currentTrackingToken', trackingToken);

      setShowOverlay(true);
      setTimeout(() => setShowOverlay(false), 2500);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to place order';
      alert(message);
    }
  }, [cart, dispatch, tableNumber]);

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg-dark)', paddingTop: 80 }}>
      {/* Page Header */}
      <header className="order-page-header" style={{ padding: '30px 5% 20px', borderBottom: '1px solid var(--glass-border)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div className="logo" style={{ fontSize: '1.4rem' }}>Aura<span>&</span>Spice</div>

          <button
            id="table-selector-btn"
            onClick={() => setShowTableSelector(true)}
            title="Tap to change table"
            aria-label={`Table ${tableNumber || 'not selected'}. Tap to change.`}
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
            <img src="/icons/table.png" alt="" style={{ width: 20, height: 20, objectFit: 'cover', borderRadius: '50%', flexShrink: 0 }} draggable={false} />
            <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Table</span>
            <span style={{ color: 'var(--accent-gold)', fontWeight: 700, fontSize: '1rem', minWidth: 24 }}>
              {tableNumber ? parseInt(tableNumber) : '—'}
            </span>
            <span style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>✎</span>
          </button>
        </div>
      </header>

      {/* Filter Tabs */}
      <section style={{ padding: '20px 5%', maxWidth: 1200, margin: '0 auto' }}>
        <FilterTabs active={activeFilter} onChange={setActiveFilter} />
      </section>

      {/* Menu Grid */}
      <section style={{ padding: '0 5% 120px', maxWidth: 1200, margin: '0 auto' }}>
        <MenuGrid filter={activeFilter} />
      </section>

      {/* Floating Orbs */}
      <OrbButton
        id="status-orb"
        icon="/icons/status.png"
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
        icon="/icons/cart.png"
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
      <Suspense fallback={null}>
        <StatusDrawer isOpen={statusOpen} onClose={() => setStatusOpen(false)} status={status} trackerData={trackerData} />
      </Suspense>

      {/* Success Overlay */}
      <SuccessOverlay active={showOverlay} />

      {/* Table Selector Modal */}
      <TableSelector
        isOpen={showTableSelector}
        current={tableNumber}
        onSelect={handleSelectTable}
      />
    </main>
  );
}

export default function OrderPage() {
  return (
    <CartProvider>
      <OrderPageInner />
    </CartProvider>
  );
}
