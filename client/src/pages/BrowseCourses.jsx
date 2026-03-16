import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import '../styles/dashboard.css';

const BrowseCourses = () => {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchAllCourses = async () => {
            try {
                setLoading(true);
                // Fetch all available courses from your backend
                const response = await api.get('/courses');
                setCourses(response.data || []);
            } catch (err) {
                console.error('Failed to fetch courses:', err);
                setError('Failed to load the course catalog.');
            } finally {
                setLoading(false);
            }
        };

        fetchAllCourses();
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <div className="dashboard-container">
            {/* Sidebar for easy navigation */}
            <aside className="sidebar">
                <ul className="sidebar-menu">
                    <li>
                        <button onClick={() => navigate('/dashboard')}>
                            🏠 Dashboard
                        </button>
                    </li>
                    <li>
                        {/* Highlights this tab as active */}
                        <button onClick={() => navigate('/courses')} className="active">
                            📚 Browse Courses
                        </button>
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
                    <h2>Course Catalog 📖</h2>
                    <p>Discover and enroll in new courses to expand your knowledge.</p>
                </header>

                <section className="enrolled-courses">
                    {loading && <p>Loading available courses...</p>}
                    {error && <p className="error-message">{error}</p>}

                    {!loading && !error && courses.length === 0 && (
                        <p>No courses are currently available.</p>
                    )}

                    {!loading && !error && courses.length > 0 && (
                        <div className="course-grid">
                            {courses.map((course) => (
                                <div className="course-card" key={course.id} style={{ display: 'flex', flexDirection: 'column' }}>
                                    <h4 style={{ marginBottom: '10px' }}>{course.title}</h4>
                                    
                                    <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '15px', flex: 1 }}>
                                        {course.description.length > 80 
                                            ? `${course.description.substring(0, 80)}...` 
                                            : course.description}
                                    </p>

                                    <div style={{ fontSize: '0.85rem', marginBottom: '15px' }}>
                                        <strong>Instructor:</strong> {course.instructor?.fullName || 'TBA'} <br/>
                                        <strong>Category:</strong> {course.category || 'General'}
                                    </div>

                                    {/* Sends the student to the CoursePage.jsx where they can click Enroll */}
                                    <button 
                                        onClick={() => navigate(`/courses/${course.id}`)}
                                        style={{
                                            padding: '10px',
                                            backgroundColor: '#1976d2',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontWeight: 'bold'
                                        }}
                                    >
                                        View Details
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
};

export default BrowseCourses;