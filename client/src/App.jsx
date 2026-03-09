import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import InstructorDashboard from './pages/Instructor-Dashboard';
import Chatbot from './components/Chatbot';
import { jwtDecode } from "jwt-decode"; // Ensure this is installed

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
        // 1. Get the ID from the token
        const decoded = jwtDecode(token);
        const userId = decoded.id;

        // 2. Fetch the FULL profile from the DB (Same logic as Profile.jsx)
        const response = await fetch(`http://localhost:3001/api/profile/${userId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          // 3. Set the user state with the fullName from the database response
          setUser(data); 
        }
      } catch (error) {
        console.error("Navbar Sync Error:", error);
        setUser(null);
      }
    };

    fetchUserData();
  }, [location]); // Re-runs on every page change to keep the name updated

  const handleLogout = () => {
    localStorage.removeItem('token');
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
          <li><Link to="/dashboard">Dashboard</Link></li>
          <li><Link to="/profile">Profile</Link></li>
        </ul>
        
        <div className="nav-actions">
          {user ? (
            <div className="user-logged-in">
              {/* Use fullName because that's what your backend returns */}
              <span className="user-name">Hi, {user.fullName || "User"}</span>
              <button onClick={handleLogout} className="btn-logout">Logout</button>
            </div>
          ) : (
            isHomepage && (
              <div className="nav-buttons">
                <button onClick={() => navigate('/dashboard')} className="btn-login">
                  Login as Student
                </button>
                <button 
                  onClick={() => navigate('/instructor-dashboard')} 
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

function App() {
  return (
    <Router>
      <div className="app-container">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/instructor-dashboard" element={<InstructorDashboard />} />
        </Routes>
        <Chatbot />
      </div>
    </Router>
  );
}

export default App;