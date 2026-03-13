import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Pages
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import InstructorDashboard from './pages/Instructor-Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';

// Components
import Chatbot from './components/Chatbot';

// --- 1. THE PROTECTED ROUTE (The Bouncer) ---
const ProtectedRoute = ({ children, allowedRole }) => {
  const { user, loading, isAuthenticated } = useAuth();

  // Wait for AuthContext to check localStorage/API
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '100px' }}>
        <h2>Loading EduConnect...</h2>
      </div>
    );
  }

  // If not logged in, send to Login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // If role doesn't match, send to Home
  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// --- 2. THE NAVBAR COMPONENT ---
const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAuthenticated } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isHomepage = location.pathname === '/';

  return (
    <nav className="navbar" style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem 2rem', background: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
      <div className="nav-left">
        <Link to="/" style={{ fontSize: '1.5rem', fontWeight: 'bold', textDecoration: 'none' }}>
          <span style={{ color: '#1976d2' }}>Edu</span><span style={{ color: '#27ae60' }}>Connect</span>
        </Link>
      </div>

      <div className="nav-center">
        <ul style={{ display: 'flex', listStyle: 'none', gap: '20px', margin: 0 }}>
          <li><Link to="/" style={{ textDecoration: 'none', color: '#333' }}>Home</Link></li>
          
          {/* Only show Dashboard/Profile if logged in */}
          {isAuthenticated && user && (
            <>
              <li>
                <Link 
                  to={user.role === 'instructor' ? "/instructor-dashboard" : "/dashboard"} 
                  style={{ textDecoration: 'none', color: '#333' }}
                >
                  Dashboard
                </Link>
              </li>
              <li><Link to="/profile" style={{ textDecoration: 'none', color: '#333' }}>Profile</Link></li>
            </>
          )}
        </ul>
      </div>

      <div className="nav-right">
        {isAuthenticated && user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span style={{ fontWeight: '500' }}>Hi, {user.fullName || "User"}</span>
            <button 
              onClick={handleLogout} 
              style={{ padding: '8px 16px', borderRadius: '5px', border: '1px solid #d32f2f', color: '#d32f2f', background: 'none', cursor: 'pointer' }}
            >
              Logout
            </button>
          </div>
        ) : (
          isHomepage && (
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={() => navigate('/login', { state: { role: 'student' } })}
                style={{ padding: '8px 16px', borderRadius: '5px', border: 'none', background: '#1976d2', color: '#fff', cursor: 'pointer' }}
              >
                Student Login
              </button>
              <button 
                onClick={() => navigate('/login', { state: { role: 'instructor' } })}
                style={{ padding: '8px 16px', borderRadius: '5px', border: 'none', background: '#27ae60', color: '#fff', cursor: 'pointer' }}
              >
                Instructor Login
              </button>
            </div>
          )
        )}
      </div>
    </nav>
  );
};

// --- 3. MAIN APP ---
function App() {
  return (
    <Router>
      <div className="app-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        
        <main style={{ flex: 1 }}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Student Routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute allowedRole="student">
                <Dashboard />
              </ProtectedRoute>
            } />

            {/* Protected Instructor Routes */}
            <Route path="/instructor-dashboard" element={
              <ProtectedRoute allowedRole="instructor">
                <InstructorDashboard />
              </ProtectedRoute>
            } />

            {/* General Protected Routes */}
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <Chatbot />
      </div>
    </Router>
  );
}

export default App;