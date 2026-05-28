import { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { GlobalErrorBoundary } from './components/ui/GlobalErrorBoundary';
import { OfflineBanner } from './components/ui/OfflineBanner';

const HomePage    = lazy(() => import('./pages/HomePage'));
const OrderPage   = lazy(() => import('./pages/OrderPage'));
const StaffPage   = lazy(() => import('./pages/StaffPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

export default function App() {
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
    <GlobalErrorBoundary>
      <OfflineBanner />
      <BrowserRouter>
        <Suspense fallback={<div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--bg-dark)', color: 'var(--text-muted)' }}>Loading…</div>}>
          <Routes>
            <Route path="/"      element={<HomePage />} />
            <Route path="/order" element={<OrderPage />} />
            <Route path="/staff" element={<StaffPage />} />
            <Route path="*"      element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </GlobalErrorBoundary>
  );
}
