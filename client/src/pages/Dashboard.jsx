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

                // 2. Fetch Enrollments
                const response = await api.get(`/dashboard/student/${user.id}`);
                const enrollmentData = response.data.enrollments || [];
                const approvedCourses = enrollmentData.filter(e => e.status === 'approved');

                // 3. Fetch Course Progress
                let progressMap = {};
                try {
                    // Call the GET /progress route we made earlier
                    const progressResponse = await api.get('/progress');
                    const progressData = progressResponse.data || [];
                    
                    // Create a lookup dictionary: { courseId: progressPercent }
                    progressData.forEach(p => {
                        progressMap[p.courseId] = p.progressPercent;
                    });
                } catch (progressErr) {
                    console.error('Failed to fetch progress:', progressErr);
                }

                // 4. Merge Enrollments with Progress
                const formattedCourses = approvedCourses.map((enrollment) => {
                    const courseDetails = enrollment.course || enrollment.Course || {};
                    const courseId = courseDetails.id || enrollment.courseId;

                    return {
                        id: courseId,
                        name: courseDetails.title || 'Untitled Course',
                        task: 'Continue learning',
                        // Map the progress using the courseId!
                        progress: progressMap[courseId] || 0,
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
    }, [user]);


    return (
            <main className="main-content">
                <header className="dashboard-header">
                    <h2>Welcome back, {user?.fullName || 'Student'}! 👋</h2>
                    <p>Here is an overview of your learning progress.</p>
                </header>

                <section className="enrolled-courses">
                    {/* --- ADDED FLEX CONTAINER AND BUTTON HERE --- */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3 style={{ margin: 0 }}>Currently Enrolled</h3>
                        <button 
                            onClick={() => navigate('/courses')}
                            style={{
                                padding: '8px 16px',
                                backgroundColor: '#1976d2',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                transition: 'background-color 0.2s ease'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1565c0'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1976d2'}
                        >
                            🔍 Browse All Courses
                        </button>
                    </div>
                    {/* ------------------------------------------- */}

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