import React, { useState, useEffect } from 'react';
import API from '../services/api';
import '../styles/profile.css';

const Profile = () => {
    const [userData, setUserData] = useState({
        fullName: "",
        role: "",
        email: "",
        bio: "",
        profileImage: "",
    });

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const storedUser = JSON.parse(localStorage.getItem("user"));
                if (!storedUser) return;

                const res = await API.get(`/api/profile/${storedUser.id}`);
                setUserData(res.data);
            } catch (error) {
                console.error("Failed to load profile:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    if (loading) {
        return <div>Loading profile...</div>;
    }

    return (
        <div className="profile-page">
            <div className="profile-container">
                <aside className="profile-sidebar">
                    <div className="avatar-placeholder">
                        {userData.fullName ? userData.fullName.charAt(0) : "U"}
                    </div>
                    <h2 className="user-name">{userData.fullName || "Unknown User"}</h2>
                    <p className="user-role">{userData.role}</p>

                    <div className="contact-info">
                        <p>📧 {userData.email}</p>
                    </div>

                    <button className="btn-edit-profile">Edit Profile</button>
                </aside>

                <main className="profile-content">
                    <section className="profile-section">
                        <h3>About Me</h3>
                        <p className="bio-text">{userData.bio || "No bio added yet."}</p>
                    </section>

                    <section className="profile-section">
                        <h3>Account Settings</h3>
                        <div className="settings-grid">
                            <div className="setting-item">
                                <div>
                                    <h4>Email</h4>
                                    <p>{userData.email}</p>
                                </div>
                            </div>

                            <div className="setting-item">
                                <div>
                                    <h4>Role</h4>
                                    <p>{userData.role}</p>
                                </div>
                            </div>
                        </div>
                    </section>
                </main>
            </div>
        </div>
    );
};

export default Profile;