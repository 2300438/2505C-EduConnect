import React, { useState, useEffect, useRef } from 'react';
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
import SubtopicPage from './pages/SubtopicPage';
import EditCourse from './pages/EditCourse';
import BrowseCourses from './pages/BrowseCourses';
import ProtectedRoute from './components/ProtectedRoute';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import CreateQuiz from './pages/CreateQuiz';
import TakeQuiz from './pages/TakeQuiz';
import EditQuiz from './pages/EditQuiz';
import DiscussionRoom from './pages/DiscussionRoom';
import SupportPage from './pages/SupportPage';

// Components
import Chatbot from './components/Chatbot';
import SidebarLayout from './components/SidebarLayout';

// --- THE NAVBAR COMPONENT ---
const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAuthenticated } = useAuth();

  // State and ref for the dropdown
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = () => {
    setDropdownOpen(false); // Close dropdown on logout
    logout();
    navigate('/');
  };

  // Close dropdown if user clicks outside of it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isHomepage = location.pathname === '/';

  return (
    <nav className="navbar" style={{
      display: 'grid',
      gridTemplateColumns: '1fr auto 1fr',
      alignItems: 'center',
      padding: '1rem 2rem',
      background: '#fff',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      position: 'relative',
      zIndex: 50 // Increased z-index to ensure dropdown renders over everything
    }}>

      {/* 1. Left Section (Logo) */}
      <div className="nav-left" style={{ textAlign: 'left' }}>
        <Link to="/" style={{ fontSize: '1.5rem', fontWeight: 'bold', textDecoration: 'none' }}>
          <span style={{ color: '#1976d2' }}>Edu</span><span style={{ color: '#27ae60' }}>Connect</span>
        </Link>
      </div>

      {/* 2. Center Section (Home & Dashboard Links) */}
      <div className="nav-center" style={{ textAlign: 'center' }}>
        <ul style={{ display: 'inline-flex', listStyle: 'none', gap: '20px', margin: 0, padding: 0 }}>
          <li><Link to="/" style={{ textDecoration: 'none', color: '#333' }}>Home</Link></li>
          {/* Only show Dashboard if logged in (Profile moved to dropdown) */}
          {isAuthenticated && user && (
            <li>
              <Link
                to={user.role === 'instructor' ? "/instructor-dashboard" : "/dashboard"}
                style={{ textDecoration: 'none', color: '#333' }}
              >
                My Courses
              </Link>
            </li>
          )}
        </ul>
      </div>

      {/* 3. Right Section (Dropdown & Login) */}
      <div className="nav-right" style={{ display: 'flex', justifyContent: 'flex-end' }}>
        {isAuthenticated && user ? (
          // USER PROFILE DROPDOWN
          <div style={{ position: 'relative' }} ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              style={{
                background: 'none',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                padding: '5px 10px',
                borderRadius: '6px',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f6fa'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <span style={{ fontWeight: '500', color: '#333', fontSize: '1rem' }}>
                {user.fullName || user.name}
              </span>
              <span style={{ fontSize: '0.8rem', color: '#7f8c8d' }}>
                {dropdownOpen ? '▲' : '▼'}
              </span>
            </button>

            {/* DROPDOWN MENU */}
            {dropdownOpen && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '10px',
                backgroundColor: '#fff',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                borderRadius: '8px',
                width: '160px',
                overflow: 'hidden',
                zIndex: 100
              }}>
                <Link
                  to="/profile"
                  onClick={() => setDropdownOpen(false)}
                  style={{
                    display: 'block',
                    padding: '12px 16px',
                    color: '#2c3e50',
                    textDecoration: 'none',
                    borderBottom: '1px solid #ecf0f1',
                    fontSize: '0.95rem'
                  }}
                >
                  👤 Profile
                </Link>
                <button
                  onClick={handleLogout}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '12px 16px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#e74c3c',
                    cursor: 'pointer',
                    fontSize: '0.95rem',
                    fontWeight: '500'
                  }}
                >
                  🚪 Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          isHomepage && (
            <button onClick={() => navigate('/login')} style={{ backgroundColor: '#1976d2', color: '#fff', border: 'none', padding: '0.5rem 1rem', cursor: 'pointer', borderRadius: '4px' }}>
              Login
            </button>
          )
        )}
      </div>
    </nav>
  );
};

const AppContent = () => {
  const { isAuthenticated, user } = useAuth();
  const showChatbot = isAuthenticated && user;

  return (
    <div className="app-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Routes>
          {/* ========================================== */}
          {/* PUBLIC ROUTES (No Sidebar)                 */}
          {/* ========================================== */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          {/* ========================================== */}
          {/* PROTECTED ROUTES (With Sidebar)            */}
          {/* ========================================== */}
          <Route element={<SidebarLayout />}>

            {/* Student Routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute allowedRole="student"><Dashboard /></ProtectedRoute>
            } />
            <Route path="/courses" element={
              <ProtectedRoute allowedRole="student"><BrowseCourses /></ProtectedRoute>
            } />

            {/* Instructor Routes */}
            <Route path="/instructor-dashboard" element={
              <ProtectedRoute allowedRole="instructor"><InstructorDashboard /></ProtectedRoute>
            } />
            <Route path="/new-course" element={
              <ProtectedRoute allowedRole="instructor"><NewCourse /></ProtectedRoute>
            } />
            <Route path="/course/edit/:id" element={
              <ProtectedRoute allowedRole="instructor"><EditCourse /></ProtectedRoute>
            } />
            <Route path="/course/:id/quizzes/new" element={
              <ProtectedRoute allowedRole="instructor"><CreateQuiz /></ProtectedRoute>
            } />

            <Route path="/course/:id/quizzes/edit/:quizId" element={
              <ProtectedRoute allowedRole="instructor"><EditQuiz /></ProtectedRoute>
            } />

            {/* General Protected Routes */}
            <Route path="/courses/:id" element={
              <ProtectedRoute><CoursePage /></ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute><Profile /></ProtectedRoute>
            } />
            <Route path="/courses/:id/subtopic/:subtopicId" element={
              <ProtectedRoute><SubtopicPage /></ProtectedRoute>
            } />
            <Route path="/courses/:id/quiz/:quizId" element={
              <ProtectedRoute><TakeQuiz /></ProtectedRoute>
            } />
            <Route path="/courses/:id/discussion/:discId" element={
              <ProtectedRoute><DiscussionRoom /></ProtectedRoute>
            } />
          </Route>

          <Route path="/supportpage" element={
            <ProtectedRoute><SupportPage /></ProtectedRoute>
            } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {showChatbot && <Chatbot />}
    </div>
  );
};

// --- MAIN APP ---
function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;