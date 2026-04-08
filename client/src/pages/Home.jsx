import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; 
import '../styles/style.css';

const Home = () => {
    const navigate = useNavigate();
    const { user } = useAuth(); 

    return (
        <div className="home-page">
            <header className="hero">
                <div className="hero-text">
                    <h1>Welcome to Our E-Learning Portal</h1>
                    <div className="hero-image-container">
                        <img src="/images/homepage-img.png" alt="EduConnect" className="hero-image" />
                    </div>
                </div>
            </header>

            <section className="action-section">
                <div className="card-container">
                    {/* Browse courses- ONLY STUDENTS CAN SEE THIS CARD */}
                    {user?.role === 'student' && (
                        <div
                            className="action-card"
                            onClick={() => navigate('/courses')}
                            style={{ cursor: 'pointer' }}
                        >
                            <h3>📖 View all Courses</h3>
                        </div>
                    )}
                    {/* CARD 1: DYNAMIC DASHBOARD */}
                    <div
                        className="action-card"
                        onClick={() => {
                            const path = user?.role === 'instructor' ? '/instructor-dashboard' : '/dashboard';
                            navigate(path);
                        }}
                        style={{ cursor: 'pointer' }}
                    >
                        <h3>📚 My Courses</h3>
                    </div>

                    {/* CARD 2: BROWSE COURSES (Replaced Take a Quiz) */}
                    <div
                        className="action-card"
                        onClick={() => {
                            // If instructor, go to their dashboard. If student, go to the browse page.
                            const path = user?.role === 'instructor' ? '/instructor-dashboard' : '/courses';
                            navigate(path);
                        }}
                        style={{ cursor: 'pointer' }}
                    >
                        <h3>🔍 Browse All Courses</h3>
                    </div>

                    {/* CARD 3: PROFILE */}
                    <div
                        className="action-card"
                        onClick={() => navigate('/profile')}
                        style={{ cursor: 'pointer' }}
                    >
                        <h3>👤 My Profile</h3>
                    </div>

                    {/* CARD 4: SUPPORT */}
                    <div
                        className="action-card"
                        onClick={() => navigate('/supportpage')}
                        style={{ cursor: 'pointer' }}
                    >
                        <h3>🎧 Get Support</h3>
                    </div>

                </div>
            </section>
        </div>
    );
};

export default Home;