import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
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

                // 1. Check if user exists before fetching
                if (!user || !user.id) return;

                // 2. Hit the exact backend route you built for the student dashboard
                const response = await api.get(`/dashboard/student/${user.id}`);

                // 3. Extract the 'enrollments' array from the JSON object your backend sent
                const enrollmentData = response.data.enrollments || [];
                const approvedCourses = enrollmentData.filter(e => e.status === 'approved');

                const formattedCourses = approvedCourses.map((enrollment) => {
                    // Note: ensure the alias 'course' or 'Course' matches your index.js
                    const courseDetails = enrollment.course || enrollment.Course || {};

                    return {
                        id: courseDetails.id || enrollment.courseId,
                        name: courseDetails.title || 'Untitled Course',
                        task: 'Continue learning',
                        progress: 0,
                        icon: getCourseIcon(courseDetails.title || '')
                    };
                });

                setCourses(formattedCourses);
            } catch (err) {
                console.error('Failed to fetch dashboard courses:', err.response?.data || err.message);
                setError(err.response?.data?.message || 'Failed to load your courses.');
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardCourses();
    }, [user]); // <-- Added 'user' to the dependency array


    return (
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
                                <div 
                                    className="course-card" 
                                    key={course.id}
                                    // 1. Make the whole card clickable
                                    onClick={() => navigate(`/courses/${course.id}`)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <div className="course-icon">{course.icon}</div>
                                    <h4>{course.name}</h4>
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
                                    
                                    {/* 2. Add a button to make it visually clear */}
                                    <div className="card-actions" style={{ marginTop: '15px' }}>
                                        <button className="btn-primary" style={{ width: '100%' }}>
                                            Continue Course
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </main>
    );
};

export default Dashboard;