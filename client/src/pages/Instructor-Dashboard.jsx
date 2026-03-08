import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/dashboard.css';

const InstructorDashboard = () => {
    const navigate = useNavigate();

    // Mock Data for the Facilitator View
    const teachingCourses = [
        { id: 'ICT2503', name: "Applied Statistics & Analytics", students: 45, pendingGrades: 12, icon: "📊" },
        { id: 'ICT2504', name: "Modern Software Engineering", students: 38, pendingGrades: 5, icon: "💻" },
        { id: 'ICT2505', name: "Digital Systems & Security", students: 50, pendingGrades: 20, icon: "🔐" }
    ];

    return (
        <div className="dashboard-container">
            {/* --- SIDEBAR --- */}
            <aside className="sidebar">
                <ul className="sidebar-menu">
                    <li>
                        <button onClick={() => navigate('/instructor-dashboard')} className="active">
                            👨‍🏫 Instructor Home
                        </button>
                    </li>
                    <li>
                        <Link to="/manage-courses">📝 Manage Courses</Link>
                    </li>
                    <li>
                        <button onClick={() => navigate('/profile')}>
                            👤 Profile
                        </button>
                    </li>
                    {/* Replaced <br /> tags with a styled margin to push the button down safely */}
                    <li style={{ marginTop: '40px' }}>
                        <button onClick={() => navigate('/')}>
                            🚪 Log Out
                        </button>
                    </li>
                </ul>
            </aside>

            {/* --- MAIN CONTENT --- */}
            <main className="main-content">
                <header className="dashboard-header">
                    <h2>Welcome back, Professor! 🎓</h2>
                    <p>Manage your courses and review student analytics.</p>
                </header>

                {/* --- QUICK STATS GRID --- */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <h3>Total Enrolled</h3>
                        <p>133</p>
                    </div>
                    <div className="stat-card alert">
                        <h3>Pending Grades</h3>
                        <p>37</p>
                    </div>
                    <div className="stat-card">
                        <h3>Active Modules</h3>
                        <p>3</p>
                    </div>
                </div>

                {/* --- COURSE CARDS --- */}
                <section className="enrolled-courses">
                    <h3>Your Teaching Modules</h3>
                    
                    {/* Maps through the teachingCourses array to generate the UI */}
                    <div className="course-grid">
                        {teachingCourses.map(course => (
                            <div className="course-card" key={course.id}>
                                <div className="course-icon">{course.icon}</div>
                                <h4>{course.id}: {course.name}</h4>
                                <p style={{ marginBottom: '5px' }}>
                                    Enrolled Students: <strong>{course.students}</strong>
                                </p>
                                <p style={{ color: course.pendingGrades > 0 ? '#e74c3c' : '#2ecc71', fontWeight: '600', fontSize: '13px' }}>
                                    {course.pendingGrades} Assignments Pending
                                </p>
                                
                                <div className="card-actions">
                                    <button className="btn-primary">Manage</button>
                                    <button className="btn-secondary">Grade</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
};

export default InstructorDashboard;