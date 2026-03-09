import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/dashboard.css';

const Dashboard = () => {
    const navigate = useNavigate();

    // Mock Database Array
    const courses = [
        { id: 'ICT2503', name: "Cryptography Fundamentals", task: "RSA Algorithm Quiz", progress: '75%', icon: "📜" },
        { id: 'ICT2504', name: "Network Security", task: "Firewall Configuration Lab", progress: '50%', icon: "🛡️" },
        { id: 'ICT2505', name: "Machine Learning Basics", task: "Neural Networks Assignment", progress: '30%', icon: "🤖" }
    ];

    return (
        <div className="dashboard-container">
            {/* --- SIDEBAR --- */}
            <aside className="sidebar">
                <ul className="sidebar-menu">
                    <li>
                        <button onClick={() => navigate('/dashboard')} className="active">
                            🏠 Dashboard
                        </button>
                    </li>
                    <li>
                        <Link to="/courses">📚 My Courses</Link>
                    </li>
                    <li>
                        <Link to="/quizzes">📋 Quizzes</Link>
                    </li>
                    <li>
                        <button onClick={() => navigate('/profile')}>
                            👤 View Profile
                        </button>
                    </li>
                    {/* Replaced <br> with a styled list item to push the logout button down */}
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
                    <h2>Welcome back, Student! 👋</h2>
                    <p>Here is an overview of your learning progress.</p>
                </header>

                <section className="enrolled-courses">
                    <h3>Currently Enrolled</h3>

                    {/* MAPPING LOGIC */}
                    <div className="course-grid">
                        {courses.map(course => (
                            <div className="course-card" key={course.id}>
                                <div className="course-icon">{course.icon}</div>
                                <h4>{course.id}: {course.name}</h4>
                                <p>Next task: {course.task}</p>
                                
                                <div className="progress-container">
                                    <div className="progress-bar" style={{ width: course.progress }}></div>
                                </div>
                                <span className="progress-text">{course.progress} Completed</span>
                            </div>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
};

export default Dashboard;