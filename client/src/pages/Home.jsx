import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // 1. Must import this!
import '../styles/style.css';

const Home = () => {
    const navigate = useNavigate();
    const { user } = useAuth(); // 2. Must define user here!

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

                    {/* CARD 2: PROFILE */}
                    <div
                        className="action-card"
                        onClick={() => navigate('/profile')}
                        style={{ cursor: 'pointer' }}
                    >
                        <h3>👤 My Profile</h3>
                    </div>
                    <div
                        className="action-card"
                        onClick={() => navigate(user?.role === 'instructor' ? '/instructor-dashboard' : '/dashboard')} 
                        style={{ cursor: 'pointer' }}
                    >
                        <h3>📋 Take a Quiz</h3>
                    </div>
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