import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

const ProtectedRoute = ({ role, children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner fullPage />;
  if (!user) return <Navigate to="/login" replace />;
  const allowed = Array.isArray(role) ? role : [role];
  if (role && !allowed.includes(user.role)) {
    if (user.role === 'admin' || user.role === 'reviewer')
      return <Navigate to="/admin/dashboard"    replace />;
    if (user.role === 'resident')
      return <Navigate to="/resident/dashboard" replace />;
    return <Navigate to="/login" replace />;
  }
  return children;
};

export default ProtectedRoute;
