import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import '../styles/dashboard.css'; // Added dashboard CSS for the sidebar
import '../styles/profile.css';

const Profile = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();

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
    
    // States for editing
    const [newName, setNewName] = useState('');
    const [newBio, setNewBio] = useState('');
    
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                setLoading(true);
                setError('');
                setSuccessMessage('');

                let profileResponse;
                try {
                    profileResponse = await api.get('/profile/me');
                } catch (err) {
                    if (!user?.id) throw err;
                    profileResponse = await api.get(`/profile/${user.id}`);
                }

                const profile = profileResponse.data;

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

                const fetchedName = profile.fullName || user?.fullName || 'User';
                const fetchedBio = profile.bio || 'No bio yet!';

                setUserData({
                    name: fetchedName,
                    role: profile.role || user?.role || 'student',
                    email: profile.email || user?.email || '',
                    location: profile.location || 'Singapore',
                    bio: fetchedBio,
                    modules
                });

                // Initialize edit states
                setNewName(fetchedName);
                setNewBio(fetchedBio);
                
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
            // Cancel clicked: Reset fields back to original data
            setNewName(userData.name);
            setNewBio(userData.bio === 'No bio yet!' ? '' : userData.bio);
            setIsEditing(false);
        } else {
            // Edit clicked: Prepare fields for editing
            setNewName(userData.name);
            setNewBio(userData.bio === 'No bio yet!' ? '' : userData.bio);
            setIsEditing(true);
        }
    };

    const handleSaveProfile = async () => {
        if (!newName.trim()) {
            setError('Name cannot be empty.');
            return;
        }

        try {
            setError('');
            setSuccessMessage('');

            const payload = {
                fullName: newName.trim(),
                bio: newBio.trim()
            };

            try {
                await api.put('/profile/me', payload);
            } catch (err) {
                if (!user?.id) throw err;
                await api.put(`/profile/${user.id}`, payload);
            }

            setUserData((prev) => ({
                ...prev,
                name: newName.trim(),
                bio: newBio.trim() || 'No bio yet!'
            }));

            setIsEditing(false);
            setSuccessMessage('Profile updated successfully.');
        } catch (error) {
            console.error('Update Error:', error);
            setError('Failed to update profile.');
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    if (loading) {
        return <div className="loading">Loading your profile...</div>;
    }

    return (
            <main className="main-content">
                <header className="dashboard-header">
                    <h2>My Profile</h2>
                    <p>Manage your account details and view your progress.</p>
                </header>

                <div className="profile-container" style={{ marginTop: '20px' }}>
                    <aside className="profile-sidebar">
                        <div className="avatar-placeholder">
                            {userData.name ? userData.name.charAt(0).toUpperCase() : 'U'}
                        </div>

                        {/* TOGGLE BETWEEN TEXT AND INPUT FOR NAME */}
                        {isEditing ? (
                            <input 
                                type="text" 
                                value={newName} 
                                onChange={(e) => setNewName(e.target.value)}
                                className="name-input"
                                style={{ 
                                    fontSize: '1.2rem', 
                                    textAlign: 'center', 
                                    padding: '5px', 
                                    marginTop: '10px', 
                                    width: '90%',
                                    borderRadius: '6px',
                                    border: '1px solid #ccc'
                                }}
                            />
                        ) : (
                            <h2 className="user-name">{userData.name}</h2>
                        )}

                        <p className="user-role" style={{ textTransform: 'capitalize' }}>
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

                    <section className="profile-content">
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
                                        onClick={handleSaveProfile}
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            ) : (
                                <p className="bio-text">{userData.bio}</p>
                            )}
                        </section>

                        {/* ONLY SHOW MODULES FOR STUDENTS */}
                        {userData.role === 'student' && (
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
                        )}
                    </section>
                </div>
            </main>
    );
};

export default Profile;