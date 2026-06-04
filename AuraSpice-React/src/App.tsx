import { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { GlobalErrorBoundary } from './components/ui/GlobalErrorBoundary';
import { OfflineBanner } from './components/ui/OfflineBanner';

const HomePage    = lazy(() => import('./pages/HomePage'));
const OrderPage   = lazy(() => import('./pages/OrderPage'));
const StaffPage   = lazy(() => import('./pages/StaffPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

/**
 * RouteErrorBoundaryWrapper — wraps the route tree INSIDE BrowserRouter
 * so useLocation() is available. Passes the current pathname as resetKey so
 * the GlobalErrorBoundary automatically clears any caught error when the user
 * navigates to a different page. This is the fix for the menu glitch:
 *
 *   User is on /  → clicks menu → navigates to /order
 *   → resetKey changes from "/" to "/order"
 *   → GlobalErrorBoundary.getDerivedStateFromProps detects key change
 *   → hasError is cleared → OrderPage renders normally
 */
function RouteErrorBoundaryWrapper() {
  const location = useLocation();

  useEffect(() => {
    // Safety check: dismiss the HTML fallback loader once React is hydrated
    const loader = document.getElementById('app-loader');
    if (loader) {
      loader.classList.add('fade-out');
      const timer = setTimeout(() => {
        loader.style.display = 'none';
      }, 400);
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <GlobalErrorBoundary resetKey={location.pathname}>
      <Suspense
        fallback={
          <div
            style={{
              minHeight: '100vh',
              display: 'grid',
              placeItems: 'center',
              background: 'var(--bg-dark)',
              color: 'var(--text-muted)',
            }}
          >
            Loading…
          </div>
        }
      >
        <Routes>
          <Route path="/"      element={<HomePage />} />
          <Route path="/order" element={<OrderPage />} />
          <Route path="/staff" element={<StaffPage />} />
          <Route path="*"      element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </GlobalErrorBoundary>
  );
}

export default function App() {
  return (
    <>
      <OfflineBanner />
      <BrowserRouter>
        <RouteErrorBoundaryWrapper />
      </BrowserRouter>
    </>
  );
}
