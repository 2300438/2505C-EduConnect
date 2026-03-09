import React, { useState, useEffect } from 'react';
import '../styles/profile.css';
import { jwtDecode } from "jwt-decode";

const Profile = () => {
    const [userData, setUserData] = useState({
        name: "",
        role: "",
        email: "",
        location: "Singapore",
        bio: "",
        modules: []
    });
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [newBio, setNewBio] = useState("");

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;

                const decoded = jwtDecode(token);
                const userId = decoded.id;

                const response = await fetch(`http://localhost:3001/api/profile/${userId}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    
                    // CRITICAL FIX: Ensure mapping matches User.js columns exactly
                    setUserData({
                        name: data.fullName || "User", // data.fullName from DB
                        role: data.role || "student",
                        email: data.email || "",
                        bio: data.bio || "No bio yet!", // Handles null bio from DB
                        location: "Singapore",
                        modules: [] 
                    });
                    setNewBio(data.bio || "");
                }
            } catch (error) {
                console.error("Profile Error:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    const handleSaveBio = async () => {
        try {
            const token = localStorage.getItem('token');
            const decoded = jwtDecode(token);
            const userId = decoded.id;

            const response = await fetch(`http://localhost:3001/api/profile/${userId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    fullName: userData.name, // Required by friend's Yup schema
                    bio: newBio 
                })
            });

            if (response.ok) {
                // Update local state immediately so UI refreshes
                setUserData(prev => ({ ...prev, bio: newBio }));
                setIsEditing(false);
                alert("Profile updated!");
            } else {
                alert("Failed to update profile.");
            }
        } catch (error) {
            console.error("Update Error:", error);
        }
    };

    if (loading) return <div className="loading">Loading your profile...</div>;

    return (
        <div className="profile-page">
            <div className="profile-container">
                <aside className="profile-sidebar">
                    <div className="avatar-placeholder">
                        {userData.name ? userData.name.charAt(0) : "U"}
                    </div>
                    <h2 className="user-name">{userData.name}</h2>
                    <p className="user-role" style={{ textTransform: 'capitalize' }}>{userData.role}</p>

                    <div className="contact-info">
                        <p>📧 {userData.email}</p>
                        <p>📍 {userData.location}</p>
                    </div>

                    <button 
                        className={`btn-edit-profile ${isEditing ? 'cancel-mode' : ''}`} 
                        onClick={() => setIsEditing(!isEditing)}
                    >
                        {isEditing ? "Cancel" : "Edit Profile"}
                    </button>
                </aside>

                <main className="profile-content">
                    <section className="profile-section">
                        <h3>About Me</h3>
                        {isEditing ? (
                            <div className="edit-bio-container">
                                <textarea 
                                    className="bio-textarea"
                                    value={newBio}
                                    onChange={(e) => setNewBio(e.target.value)}
                                    placeholder="Tell us about yourself..."
                                />
                                <button className="btn-save" onClick={handleSaveBio}>Save Changes</button>
                            </div>
                        ) : (
                            <p className="bio-text">{userData.bio}</p>
                        )}
                    </section>

                    <section className="profile-section">
                        <h3>Academic Modules</h3>
                        {userData.modules.length > 0 ? (
                            <ul className="academic-list">
                                {userData.modules.map((mod) => (
                                    <li key={mod.id}>
                                        <strong>{mod.id}:</strong> {mod.name}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p>No modules enrolled yet.</p>
                        )}
                    </section>
                </main>
            </div>
        </div>
    );
};

export default Profile;