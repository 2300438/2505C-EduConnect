import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Pages
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import InstructorDashboard from './pages/Instructor-Dashboard';
import NewCourse from './pages/New-Course';
import Login from './pages/Login';
import Register from './pages/Register';
import ProtectedRoute from './components/ProtectedRoute';

// Components
import Chatbot from './components/Chatbot';


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
    <nav className="navbar" style={{ 
      display: 'grid', 
      gridTemplateColumns: '1fr auto 1fr', // This is the secret sauce
      alignItems: 'center', 
      padding: '1rem 2rem', 
      background: '#fff', 
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)' 
    }}>
      
      {/* 1. Left Section (Logo) */}
      <div className="nav-left" style={{ textAlign: 'left' }}>
        <Link to="/" style={{ fontSize: '1.5rem', fontWeight: 'bold', textDecoration: 'none' }}>
          <span style={{ color: '#1976d2' }}>Edu</span><span style={{ color: '#27ae60' }}>Connect</span>
        </Link>
      </div>

      {/* 2. Center Section (Home Link) */}
      <div className="nav-center" style={{ textAlign: 'center' }}>
        <ul style={{ display: 'inline-flex', listStyle: 'none', gap: '20px', margin: 0, padding: 0 }}>
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

      {/* 3. Right Section (Buttons or Logout) */}
      <div className="nav-right" style={{ textAlign: 'right' }}>
        {isAuthenticated && user ? (
          <button onClick={handleLogout}>Logout</button>
        ) : (
          /* This only shows on the Home page, but the 'div' stays here 
             to keep the 1fr width on the right side! */
          isHomepage && (
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
               <button onClick={() => navigate('/login')} style={{ backgroundColor: '#1976d2', color: '#fff', border: 'none', padding: '0.5rem 1rem', cursor: 'pointer' }}>
                Login
              </button>
            </div>
          )
        )}
      </div>
    </nav>
  );
};
const AppContent = () => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  // Logic: Show only if logged in AND on the homepage
  const showChatbot = isAuthenticated && user && location.pathname === '/';

  return (
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
            <Route path="/new-course" element={
              <ProtectedRoute allowedRole="instructor">
                <NewCourse />
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

      {/* CONDITIONAL RENDERING */}
      {showChatbot && <Chatbot />}
    </div>
  );
};
// --- 3. MAIN APP ---
function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;