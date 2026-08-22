import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { NotificationProvider } from './context/NotificationContext';
import { MessageProvider } from './context/MessageContext';
import ProtectedRoute from './layouts/ProtectedRoute';
import AppLayout from './layouts/AppLayout';
import AuthLayout from './layouts/AuthLayout';

import ResidentDashboard from './pages/resident/Dashboard';
import CreateReport      from './pages/resident/CreateReport';
import ReportHistory     from './pages/resident/ReportHistory';
import ViewReport     from './pages/resident/ViewReport';
import GenerateReport from './pages/resident/GenerateReport';
import ResidentMessages from './pages/resident/Messages';
import ResidentCalendar from './pages/resident/Calendar';

import AdminDashboard   from './pages/admin/Dashboard';
import Residents        from './pages/admin/Residents';
import Reports          from './pages/admin/Reports';
import ReviewReport     from './pages/admin/ReviewReport';
import AdminMessages    from './pages/admin/Messages';
import InviteReviewer   from './pages/admin/InviteReviewer';
import Settings         from './pages/Settings';

import ForgotPassword  from './pages/ForgotPassword';
import ResetPassword   from './pages/ResetPassword';
import AcceptInvite    from './pages/AcceptInvite';
import ReviewerAccess  from './pages/ReviewerAccess';
import PrivacyPolicy   from './pages/PrivacyPolicy';

const App = () => (
  <AuthProvider>
    <SocketProvider> 
      <NotificationProvider>
        <MessageProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login"           element={<AuthLayout key="auth" />} />
              <Route path="/signup"          element={<AuthLayout key="auth" />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password"  element={<ResetPassword />} />
              <Route path="/accept-invite"   element={<AcceptInvite />} />
              <Route path="/reviewer-access" element={<ReviewerAccess />} />
              <Route path="/privacy-policy"  element={<PrivacyPolicy />} />
              <Route path="/" element={<Navigate to="/login" replace />} />

              {/* Resident routes */}
              <Route element={<ProtectedRoute role="resident"><AppLayout /></ProtectedRoute>}>
                <Route path="/resident/dashboard"        element={<ResidentDashboard />} />
                <Route path="/resident/reports/new"      element={<CreateReport />} />
                <Route path="/resident/reports/:id/edit" element={<CreateReport />} />
                <Route path="/resident/reports"          element={<ReportHistory />} />
                <Route path="/resident/reports/:id"      element={<ViewReport />} />
                <Route path="/resident/submitted"        element={<ReportHistory defaultStatus="submitted" />} />
                <Route path="/resident/drafts"           element={<ReportHistory defaultStatus="draft" />} />
                <Route path="/resident/generate"         element={<GenerateReport />} />
                <Route path="/resident/messages"         element={<ResidentMessages />} />
                <Route path="/resident/calendar"         element={<ResidentCalendar />} />
                <Route path="/resident/settings"         element={<Settings />} />
              </Route>

              {/* Admin / reviewer routes */}
              <Route element={<ProtectedRoute role={['admin', 'reviewer']}><AppLayout /></ProtectedRoute>}>
                <Route path="/admin/dashboard"   element={<AdminDashboard />} />
                <Route path="/admin/residents"   element={<Residents />} />
                <Route path="/admin/reports"     element={<Reports />} />
                <Route path="/admin/reports/:id" element={<ReviewReport />} />
                <Route path="/admin/messages"    element={<AdminMessages />} />
                <Route path="/admin/invite"      element={<InviteReviewer />} />
                <Route path="/admin/settings"    element={<Settings />} />
              </Route>

              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </BrowserRouter>
        </MessageProvider>
      </NotificationProvider>
    </SocketProvider>
  </AuthProvider>
);

export default App;
