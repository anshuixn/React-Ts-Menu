import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import OrderPage from './pages/OrderPage';
import StaffPage from './pages/StaffPage';

// ============================================
// App — Agent 18: Routing
// ============================================
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"      element={<HomePage />} />
        <Route path="/order" element={<OrderPage />} />
        <Route path="/staff" element={<StaffPage />} />
      </Routes>
    </BrowserRouter>
  );
}
