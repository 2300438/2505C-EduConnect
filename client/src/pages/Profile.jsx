import React, { useState, useEffect } from 'react';
import '../styles/profile.css';

const Profile = () => {
    // 1. Initialize state with empty or "loading" values
    const [userData, setUserData] = useState({
        name: "",
        role: "",
        email: "",
        location: "",
        bio: "",
        modules: []
    });

    // 2. This hook will trigger the database fetch when the page loads
    useEffect(() => {
        // This is where your API call will go
        // Example: axios.get('/api/user/profile').then(res => setUserData(res.data))
        
        // For now, we simulate a database response
        const mockDatabaseResponse = {
            name: "Muhammad Yazid",
            role: "Security Analyst | ICT Student",
            email: "yazid@example.com",
            location: "Singapore",
            bio: "Dedicated Security Analyst focused on bridging cybersecurity and automation.",
            modules: [
                { id: "ICT2503", name: "Applied Statistics & Analytics" },
                { id: "ICT2504", name: "Modern Software Engineering" },
                { id: "ICT2505", name: "Digital Systems & Security" }
            ]
        };

        setUserData(mockDatabaseResponse);
    }, []);

    return (
        <div className="profile-page">
            <div className="profile-container">
                {/* --- SIDEBAR (Dynamic) --- */}
                <aside className="profile-sidebar">
                    <div className="avatar-placeholder">
                        {userData.name ? userData.name.charAt(0) : "U"}
                    </div>
                    <h2 className="user-name">{userData.name || "Loading..."}</h2>
                    <p className="user-role">{userData.role}</p>
                    
                    <div className="contact-info">
                        <p>📧 {userData.email}</p>
                        <p>📍 {userData.location}</p>
                    </div>
                    
                    <button className="btn-edit-profile">Edit Profile</button>
                </aside>

                {/* --- CONTENT (Dynamic) --- */}
                <main className="profile-content">
                    <section className="profile-section">
                        <h3>About Me</h3>
                        <p className="bio-text">{userData.bio}</p>
                    </section>

                    <section className="profile-section">
                        <h3>Academic Modules</h3>
                        <ul className="academic-list">
                            {/* 3. Map through the modules array from the database */}
                            {userData.modules.map((mod) => (
                                <li key={mod.id}>
                                    <strong>{mod.id}:</strong> {mod.name}
                                </li>
                            ))}
                        </ul>
                    </section>

                    <section className="profile-section">
                        <h3>Account Settings</h3>
                        <div className="settings-grid">
                            <div className="setting-item">
                                <div>
                                    <h4>Two-Factor Authentication</h4>
                                    <p>Secure your student account with 2FA.</p>
                                </div>
                                <button className="btn-outline">Enable</button>
                            </div>
                        </div>
                    </section>
                </main>
            </div>
        </div>
    );
};

export default Profile;