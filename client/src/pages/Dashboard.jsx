import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import '../styles/dashboard.css';

const Dashboard = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const getCourseIcon = (courseTitle = '') => {
        const title = courseTitle.toLowerCase();

        if (title.includes('crypto')) return '📜';
        if (title.includes('network')) return '🛡️';
        if (title.includes('machine learning')) return '🤖';
        if (title.includes('programming')) return '💻';
        if (title.includes('database')) return '🗄️';
        return '📚';
    };

    useEffect(() => {
        const fetchDashboardCourses = async () => {
            try {
                setLoading(true);
                setError('');

                // Change this endpoint to match your backend
                const response = await api.get('/course/my-courses');

                // Adjust depending on your backend response shape
                const courseData = response.data || [];

                const formattedCourses = courseData.map((course) => ({
                    id: course.courseCode || course.id,
                    name: course.title || course.name || 'Untitled Course',
                    task: course.nextTask || 'No upcoming task',
                    progress: Number(course.progress || 0),
                    icon: getCourseIcon(course.title || course.name || '')
                }));

                setCourses(formattedCourses);
            } catch (err) {
                console.error('Failed to fetch dashboard courses:', err);
                setError('Failed to load your courses.');
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardCourses();
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <div className="dashboard-container">
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
                    <li style={{ marginTop: '40px' }}>
                        <button onClick={handleLogout}>
                            🚪 Log Out
                        </button>
                    </li>
                </ul>
            </aside>

            <main className="main-content">
                <header className="dashboard-header">
                    <h2>Welcome back, {user?.fullName || 'Student'}! 👋</h2>
                    <p>Here is an overview of your learning progress.</p>
                </header>

                <section className="enrolled-courses">
                    <h3>Currently Enrolled</h3>

                    {loading && <p>Loading your courses...</p>}

                    {error && <p className="error-message">{error}</p>}

                    {!loading && !error && courses.length === 0 && (
                        <p>You are not enrolled in any courses yet.</p>
                    )}

                    {!loading && !error && courses.length > 0 && (
                        <div className="course-grid">
                            {courses.map((course) => (
                                <div className="course-card" key={course.id}>
                                    <div className="course-icon">{course.icon}</div>
                                    <h4>{course.id}: {course.name}</h4>
                                    <p>Next task: {course.task}</p>
                                    <div className="progress-container">
                                        <div
                                            className="progress-bar"
                                            style={{ width: `${course.progress}%` }}
                                        ></div>
                                    </div>
                                    <span className="progress-text">
                                        {course.progress}% Completed
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
};

export default Dashboard;