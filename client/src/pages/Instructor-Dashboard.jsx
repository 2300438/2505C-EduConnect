import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/dashboard.css';

const InstructorDashboard = () => {
    const navigate = useNavigate();
    const { logout, user } = useAuth();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch courses from MySQL on component mount
    useEffect(() => {
    const fetchMyCourses = async () => {
        try {
            // Get the token you stored during login
            const token = localStorage.getItem("accessToken"); 

            const response = await fetch(`${import.meta.env.VITE_API_URL}/courses/instructor/me`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });
            
            const data = await response.json();
            if (response.ok) {
                setCourses(data);
            }
        } catch (error) {
            console.error("Error fetching instructor courses:", error);
        } finally {
            setLoading(false);
        }
    };

    fetchMyCourses();
}, []);

    return (
        <div className="dashboard-container">
            <aside className="sidebar">
                <ul className="sidebar-menu">
                    <li>
                        <button onClick={() => navigate('/instructor-dashboard')} className="active">
                            👨‍🏫 Instructor Home
                        </button>
                    </li>
                    <li><Link to="/manage-courses">📝 Manage Courses</Link></li>
                    <li><button onClick={() => navigate('/profile')}>👤 Profile</button></li>
                    <li style={{ marginTop: '40px' }}>
                        <button onClick={() => { logout(); navigate('/'); }}>🚪 Log Out</button>
                    </li>
                </ul>
            </aside>

            <main className="main-content">
                <header className="dashboard-header">
                    <h2>Welcome back, {user?.fullName || 'Professor'}! 🎓</h2>
                    <p>Manage your courses and review student analytics.</p>
                </header>

                <section className="enrolled-courses">
                    <h3>Your Teaching Modules</h3>
                    
                    {/* --- COURSE CARDS --- */}
<div className="course-grid">
    {/* Always show the Create card first */}
    <div className="course-card create-new-card" onClick={() => navigate('/new-course')}>
        <div style={{ fontSize: '3rem', color: '#27ae60' }}>+</div>
        <h4 style={{ color: '#27ae60' }}>Create New Course</h4>
    </div>

    {courses.map(course => (
        <div className="course-card" key={course.id}>
            <div className="course-icon">
                {/* Use a thumbnail if it exists, otherwise a default icon */}
                {course.thumbnail ? <img src={course.thumbnail} alt="thumb" /> : "📚"}
            </div>
            <h4>{course.title}</h4>
            <p style={{ fontSize: '13px', color: '#666' }}>
                {course.description.substring(0, 80)}...
            </p>
            <div className="card-actions">
                <button className="btn-primary" onClick={() => navigate(`/course/edit/${course.id}`)}>Edit</button>
                <button className="btn-secondary">Analytics</button>
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