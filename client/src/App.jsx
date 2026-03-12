import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import InstructorDashboard from './pages/Instructor-Dashboard';
import Chatbot from './components/Chatbot';
import { jwtDecode } from "jwt-decode";
import Login from './pages/Login';
import Register from './pages/Register';
import { useAuth } from './context/AuthContext'; // Ensure this path is correct

// --- 1. THE PROTECTED ROUTE COMPONENT (The Bouncer) ---
const ProtectedRoute = ({ children, allowedRole }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) return <div>Loading...</div>;

  if (!isAuthenticated) {
    return <Navigate to="/register" replace />;
  }

  if (allowedRole && user?.role !== allowedRole) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// --- 2. THE NAVBAR COMPONENT ---
const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setUser(null);
        return;
      }

      try {
        const decoded = jwtDecode(token);
        const userId = decoded.id;

        const response = await fetch(`http://localhost:3001/api/profile/${userId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data);
        }
      } catch (error) {
        console.error("Navbar Sync Error:", error);
        setUser(null);
      }
    };

    fetchUserData();
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user'); // Also clear the user object
    setUser(null);
    navigate('/');
  };

  const isHomepage = location.pathname === '/';

  return (
    <nav className="navbar">
      <div className="container">
        <Link to="/" className="logo">
          <span className="edu">Edu</span><span className="connect">Connect</span>
        </Link>
        <ul className="nav-links">
          <li><Link to="/">Home</Link></li>
          {/* DYNAMIC DASHBOARD LINK: Directs based on role */}
          <li>
            <Link to={user?.role === 'instructor' ? "/instructor-dashboard" : "/dashboard"}>
              Dashboard
            </Link>
          </li>
          <li><Link to="/profile">Profile</Link></li>
        </ul>

        <div className="nav-actions">
          {user ? (
            <div className="user-logged-in">
              <span className="user-name">Hi, {user.fullName || "User"}</span>
              <button onClick={handleLogout} className="btn-logout">Logout</button>
            </div>
          ) : (
            isHomepage && (
              <div className="nav-buttons">
                <button
                  onClick={() => navigate('/login', { state: { role: 'student' } })}
                  className="btn-login"
                  style={{ backgroundColor: '#1976d2', color: 'white', border: 'none' }}
                >
                  Login as Student
                </button>

                <button
                  onClick={() => navigate('/login', { state: { role: 'instructor' } })}
                  className="btn-signup"
                  style={{ backgroundColor: '#27ae60' }}
                >
                  Login as Instructor
                </button>
              </div>
            )
          )}
        </div>
      </div>
    </nav>
  );
};

// --- 3. THE MAIN APP COMPONENT ---
function App() {
  return (
    <Router>
      <div className="app-container">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Student Only */}
          <Route path="/dashboard" element={
            <ProtectedRoute allowedRole="student">
              <Dashboard />
            </ProtectedRoute>
          } />

          {/* Instructor Only */}
          <Route path="/instructor-dashboard" element={
            <ProtectedRoute allowedRole="instructor">
              <InstructorDashboard />
            </ProtectedRoute>
          } />

          {/* Any logged-in user */}
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
        </Routes>
        <Chatbot />
      </div>
    </Router>
  );
}

export default App;