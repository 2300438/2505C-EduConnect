import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRole }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) return <div>Loading...</div>;

  // 1. If not logged in at all, kick them to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 2. If their role doesn't match the required role, kick them to home
  if (allowedRole && user?.role !== allowedRole) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;