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
import CoursePage from './pages/CoursePage';
import EditCourse from './pages/EditCourse';
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
      gridTemplateColumns: '1fr auto 1fr',
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

      {/* 3. Right Section (Name & Logout) */}
      <div className="nav-right" style={{ textAlign: 'right' }}>
        {isAuthenticated && user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', justifyContent: 'flex-end' }}>
            <span style={{ fontWeight: '500', color: '#333' }}>
              {/* Uses fullName, with a fallback to name just in case */}
              Hello, {user.fullName || user.name}! 
            </span>
            <button 
              onClick={handleLogout} 
              style={{ 
                backgroundColor: '#e74c3c', 
                color: '#fff', 
                border: 'none', 
                padding: '0.4rem 0.8rem', 
                cursor: 'pointer',
                borderRadius: '4px'
              }}
            >
              Logout
            </button>
          </div>
        ) : (
          /* This only shows on the Home page, but the 'div' stays here 
             to keep the 1fr width on the right side! */
          isHomepage && (
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => navigate('/login')} style={{ backgroundColor: '#1976d2', color: '#fff', border: 'none', padding: '0.5rem 1rem', cursor: 'pointer', borderRadius: '4px' }}>
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

  // Show chatbot on every page as long as user is logged in
  const showChatbot = isAuthenticated && user;

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
          <Route
            path="/Instructor-Dashboard"
            element={
              <ProtectedRoute allowedRole="instructor">
                <InstructorDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/New-Course"
            element={
              <ProtectedRoute allowedRole="instructor">
                <NewCourse />
              </ProtectedRoute>
            }
          />

          <Route
            path="/courses/:id"
            element={
              <ProtectedRoute allowedRole="instructor">
                <CoursePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/course/edit/:id"
            element={
              <ProtectedRoute allowedRole="instructor">
                <EditCourse />
              </ProtectedRoute>
            }
          />

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