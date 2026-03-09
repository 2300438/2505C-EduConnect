import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import InstructorDashboard from './pages/Instructor-Dashboard';
import Chatbot from './components/Chatbot';
import Login from './pages/Login';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation(); // 1. Grabs the current URL path

  // 2. Checks if the user is currently on the root homepage
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
        
        {/* 3. Conditional Rendering: Only displays if isHomepage is true */}
        {isHomepage && (
          <div className="nav-buttons">
            <button onClick={() => navigate('/login')} className="btn-login">
              Login
            </button>
            <button 
              onClick={() => navigate('/instructor-dashboard')} 
              className="btn-signup" 
              style={{ backgroundColor: '#27ae60' }}
            >
              Login as Instructor
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

function App() {
  return (
    <Router>
      <div className="app-container">
        <Navbar /> {/* Global Navbar stays here */}
        
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/instructor-dashboard" element={<InstructorDashboard />} />
          <Route path="/login" element={<Login />} />
        </Routes>
        
        <Chatbot /> {/* Global Chatbot stays here */}
      </div>
    </Router>
  );
}

export default App;