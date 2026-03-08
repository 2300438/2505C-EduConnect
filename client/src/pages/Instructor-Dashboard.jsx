import React from 'react';
import '../styles/dashboard.css';
import '../styles/style.css';

const InstructorDashboard = () => {
    return (
        <div className="dashboard-container">
            <aside className="sidebar">
                <div className="sidebar-logo">EduConnect</div>
                <ul className="sidebar-menu">
                    <li><a href="/instructor" className="active">🏠 Instructor Home</a></li>
                    <li><a href="#">📝 Manage Courses</a></li>
                    <li><a href="/profile">👤 Profile</a></li>
                    <br /><br />
                    <li><a href="/">🚪 Log Out</a></li>
                </ul>
            </aside>

            <main className="main-content">
                <header className="dashboard-header">
                    <h2>Welcome back, Professor! 🎓</h2>
                    <p>Manage your courses and review student analytics.</p>
                </header>
                {/* Add your instructor course cards here */}
            </main>
            
        </div>
    );
};

export default InstructorDashboard;