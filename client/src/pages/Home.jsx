import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/style.css';

const Home = () => {
    // You don't need navigate here for the login buttons anymore, 
    // but you might want it later for the "Action Cards"
    const navigate = useNavigate(); 

    return (
        <div className="home-page">
            {/* The <nav> block is completely gone from here */}

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
                    <div className="action-card"><h3>📚 Browse Courses</h3></div>
                    <div className="action-card"><h3>💻 Join a Class</h3></div>
                    <div className="action-card"><h3>📋 Take a Quiz</h3></div>
                    <div className="action-card"><h3>🎧 Get Support</h3></div>
                </div>
            </section>
        </div>
    );
};

export default Home;