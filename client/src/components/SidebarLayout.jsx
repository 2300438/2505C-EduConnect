import React from 'react';
import { useNavigate, Link, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/dashboard.css';

const SidebarLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    // Helper function to check if a link is active
    const isActive = (path) => location.pathname.startsWith(path) ? 'active' : '';

    return (
        <div className="dashboard-container" style={{ 
            display: 'flex', 
            height: 'calc(100vh - 70px)', // Accounts for Navbar height (adjust 70px if needed)
            overflow: 'hidden' 
        }}>
            {/* SIDEBAR */}
            <aside className="sidebar" style={{ 
                width: '250px', 
                height: '100%', 
                flexShrink: 0, 
                backgroundColor: '#2c3e50' 
            }}>
                <ul className="sidebar-menu">
                    {user?.role === 'instructor' ? (
                        <>
                            <li>
                                <Link to="/instructor-dashboard" className={isActive('/instructor-dashboard')}>
                                    👨‍🏫 Instructor Home
                                </Link>
                            </li>
                            <li>
                                {/* Changed from /manage-courses to /courses to match your routes */}
                                <Link to="/courses" className={isActive('/courses')}>
                                    📝 Manage Courses
                                </Link>
                            </li>
                        </>
                    ) : (
                        <>
                            <li>
                                <Link to="/dashboard" className={isActive('/dashboard')}>
                                    🏠 Dashboard
                                </Link>
                            </li>
                            <li>
                                <Link to="/courses" className={isActive('/courses')}>
                                    📚 My Courses
                                </Link>
                            </li>
                            <li>
                                <Link to="/quizzes" className={isActive('/quizzes')}>
                                    📋 Quizzes
                                </Link>
                            </li>
                        </>
                    )}
                    
                    <li>
                        <Link to="/profile" className={isActive('/profile')}>
                            👤 Profile
                        </Link>
                    </li>
                    <li style={{ marginTop: '40px' }}>
                        <button 
                            onClick={handleLogout} 
                            style={{ 
                                width: '100%', 
                                textAlign: 'left', 
                                background: 'none', 
                                border: 'none', 
                                color: 'white', 
                                cursor: 'pointer',
                                padding: '10px 20px',
                                fontSize: 'inherit'
                            }}
                        >
                            🚪 Log Out
                        </button>
                    </li>
                </ul>
            </aside>

            {/* MAIN CONTENT AREA: This is what allows the pages to scroll */}
            <main className="main-content" style={{ 
                flex: 1, 
                overflowY: 'auto', // CRITICAL: This enables scrolling
                padding: '30px', 
                backgroundColor: '#f4f7f6' 
            }}>
                <Outlet />
            </main>
        </div>
    );
};

export default SidebarLayout;