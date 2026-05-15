import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './layouts/ProtectedRoute';
import AppLayout from './layouts/AppLayout';

import AuthLayout from './layouts/AuthLayout';

import ResidentDashboard from './pages/resident/Dashboard';
import CreateReport      from './pages/resident/CreateReport';
import ReportHistory     from './pages/resident/ReportHistory';
import ViewReport        from './pages/resident/ViewReport';

import AdminDashboard from './pages/admin/Dashboard';
import Residents      from './pages/admin/Residents';
import Reports        from './pages/admin/Reports';
import ReviewReport   from './pages/admin/ReviewReport';
import Settings       from './pages/Settings';

const App = () => (
  <AuthProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/login"  element={<AuthLayout key="auth" />} />
        <Route path="/signup" element={<AuthLayout key="auth" />} />
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Resident routes */}
        <Route element={<ProtectedRoute role="resident"><AppLayout /></ProtectedRoute>}>
          <Route path="/resident/dashboard"   element={<Navigate to="/resident/reports/new" replace />} />
          <Route path="/resident/reports/new" element={<CreateReport />} />
          <Route path="/resident/reports"     element={<ReportHistory />} />
          <Route path="/resident/reports/:id" element={<ViewReport />} />
          <Route path="/resident/settings"    element={<Settings />} />
        </Route>

        {/* Admin routes */}
        <Route element={<ProtectedRoute role="admin"><AppLayout /></ProtectedRoute>}>
          <Route path="/admin/dashboard"   element={<AdminDashboard />} />
          <Route path="/admin/residents"   element={<Residents />} />
          <Route path="/admin/reports"     element={<Reports />} />
          <Route path="/admin/reports/:id" element={<ReviewReport />} />
          <Route path="/admin/settings"   element={<Settings />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  </AuthProvider>
);

export default App;
