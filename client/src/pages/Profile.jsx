import React, { useState, useEffect } from 'react';
import '../styles/profile.css';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Profile = () => {
    const { user } = useAuth();

    const [userData, setUserData] = useState({
        name: '',
        role: '',
        email: '',
        location: 'Singapore',
        bio: '',
        modules: []
    });

    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [newBio, setNewBio] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                setLoading(true);
                setError('');
                setSuccessMessage('');

                // Fetch profile
                // Preferred backend route:
                // GET /api/profile/me
                // Fallback route:
                // GET /api/profile/:id
                let profileResponse;
                try {
                    profileResponse = await api.get('/profile/me');
                } catch (err) {
                    if (!user?.id) throw err;
                    profileResponse = await api.get(`/profile/${user.id}`);
                }

                const profile = profileResponse.data;

                // Fetch enrolled modules/courses
                let modules = [];
                try {
                    const modulesResponse = await api.get('/course/my-courses');
                    const courseData = Array.isArray(modulesResponse.data)
                        ? modulesResponse.data
                        : modulesResponse.data.courses || [];

                    modules = courseData.map((course) => ({
                        id: course.courseCode || course.id,
                        name: course.title || course.name || 'Untitled Course'
                    }));
                } catch (moduleError) {
                    console.error('Failed to fetch modules:', moduleError);
                }

                setUserData({
                    name: profile.fullName || user?.fullName || 'User',
                    role: profile.role || user?.role || 'student',
                    email: profile.email || user?.email || '',
                    location: profile.location || 'Singapore',
                    bio: profile.bio || 'No bio yet!',
                    modules
                });

                setNewBio(profile.bio || '');
            } catch (error) {
                console.error('Profile Error:', error);
                setError('Failed to load profile.');
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [user]);

    const handleEditToggle = () => {
        if (isEditing) {
            setNewBio(userData.bio === 'No bio yet!' ? '' : userData.bio);
            setIsEditing(false);
        } else {
            setNewBio(userData.bio === 'No bio yet!' ? '' : userData.bio);
            setIsEditing(true);
        }
    };

    const handleSaveBio = async () => {
        try {
            setError('');
            setSuccessMessage('');

            // Preferred backend route:
            // PUT /api/profile/me
            // Fallback route:
            // PUT /api/profile/:id
            try {
                await api.put('/profile/me', {
                    fullName: userData.name,
                    bio: newBio
                });
            } catch (err) {
                if (!user?.id) throw err;
                await api.put(`/profile/${user.id}`, {
                    fullName: userData.name,
                    bio: newBio
                });
            }

            setUserData((prev) => ({
                ...prev,
                bio: newBio.trim() || 'No bio yet!'
            }));

            setNewBio(newBio.trim());
            setIsEditing(false);
            setSuccessMessage('Profile updated successfully.');
        } catch (error) {
            console.error('Update Error:', error);
            setError('Failed to update profile.');
        }
    };

    if (loading) {
        return <div className="loading">Loading your profile...</div>;
    }

    return (
        <div className="profile-page">
            <div className="profile-container">
                <aside className="profile-sidebar">
                    <div className="avatar-placeholder">
                        {userData.name ? userData.name.charAt(0).toUpperCase() : 'U'}
                    </div>

                    <h2 className="user-name">{userData.name}</h2>
                    <p
                        className="user-role"
                        style={{ textTransform: 'capitalize' }}
                    >
                        {userData.role}
                    </p>

                    <div className="contact-info">
                        <p>📧 {userData.email}</p>
                        <p>📍 {userData.location}</p>
                    </div>

                    <button
                        className={`btn-edit-profile ${isEditing ? 'cancel-mode' : ''}`}
                        onClick={handleEditToggle}
                    >
                        {isEditing ? 'Cancel' : 'Edit Profile'}
                    </button>
                </aside>

                <main className="profile-content">
                    {error && <p className="error-message">{error}</p>}
                    {successMessage && <p className="success-message">{successMessage}</p>}

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
                                <button
                                    className="btn-save"
                                    onClick={handleSaveBio}
                                >
                                    Save Changes
                                </button>
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