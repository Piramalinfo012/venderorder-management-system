import { Navigate, Route, Routes } from 'react-router-dom';
import Dashboard from './pages/admin/Dashboard';
import PartySearch from './pages/admin/PartySearch';
import PurchaseOrder from './pages/admin/PurchaseOrder';
import Sidebar from './layouts/Sidebar';

function App() {
  return (
    <Routes>
      {/* Main Layout with Sidebar */}
      <Route path="/" element={<Sidebar />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="party-search" element={<PartySearch />} />
        <Route path="quotation" element={<Navigate to="/dashboard" replace />} />
        <Route path="sales-order" element={<Navigate to="/dashboard" replace />} />
        <Route path="purchase-order" element={<PurchaseOrder />} />
        <Route path="pending-order" element={<Navigate to="/dashboard" replace />} />
        <Route path="calendar" element={<Navigate to="/dashboard" replace />} />
      </Route>
      
      {/* Redirect any unknown routes to dashboard */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
