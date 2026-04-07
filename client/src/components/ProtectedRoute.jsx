import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRole }) => {
    const { user, loading, isAuthenticated } = useAuth();
    const location = useLocation();

    // 1. IMPORTANT: If AuthContext is still checking the token, show nothing or a spinner.
    // This prevents the "null" error during initial page load.
    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                Loading...
            </div>
        );
    }

    // 2. If the user is NOT logged in, send them to login.
    // We save the 'from' location so we can redirect them back after they log in.
    if (!isAuthenticated || !user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // 3. ROLE CHECK: If the route requires a specific role (e.g., instructor).
    // We use optional chaining (user?.role) as a second layer of safety.
    if (allowedRole && user?.role !== allowedRole) {
        console.warn(`Access denied: Required ${allowedRole}, but user is ${user?.role}`);
        return <Navigate to="/" replace />;
    }

    return children;
};

export default ProtectedRoute;