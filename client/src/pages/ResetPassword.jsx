import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import '../styles/auth.css';

const ResetPassword = () => {
    const { token } = useParams(); // Grabs the :token from the URL
    const navigate = useNavigate();

    const [passwords, setPasswords] = useState({
        newPassword: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setPasswords({
            ...passwords,
            [e.target.id]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        // 1. Client-side Validation: Match Check
        if (passwords.newPassword !== passwords.confirmPassword) {
            setError("Passwords do not match.");
            setLoading(false);
            return;
        }

        // 2. Client-side Validation: Length Check
        if (passwords.newPassword.length < 6) {
            setError("Password must be at least 6 characters.");
            setLoading(false);
            return;
        }

        try {
            const response = await api.post(`/auth/reset-password/${token}`, { 
                password: passwords.newPassword 
            });
            
            setMessage("Password reset successful! You can now log in with your new credentials.");
            
            // Optional: Auto-redirect to login after 3 seconds
            setTimeout(() => {
                navigate('/login');
            }, 3500);

        } catch (err) {
            console.error("Reset password error:", err);
            setError(err.response?.data?.message || "Invalid or expired token. Please request a new link.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2>Reset Password 🔑</h2>
                <p className="auth-subtitle">
                    Please enter and confirm your new secure password.
                </p>

                {message ? (
                    <div className="success-banner">
                        <p>{message}</p>
                        <Link to="/login" className="back-to-login">
                            Go to Login Now
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="form-group">
                            <label htmlFor="newPassword">New Password</label>
                            <input
                                type="password"
                                id="newPassword"
                                placeholder="Min. 6 characters"
                                value={passwords.newPassword}
                                onChange={handleChange}
                                required
                                disabled={loading}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="confirmPassword">Confirm New Password</label>
                            <input
                                type="password"
                                id="confirmPassword"
                                placeholder="Repeat new password"
                                value={passwords.confirmPassword}
                                onChange={handleChange}
                                required
                                disabled={loading}
                            />
                        </div>

                        {error && <p className="error-text" style={{ marginBottom: '15px' }}>{error}</p>}

                        <button 
                            type="submit" 
                            className="btn-primary" 
                            disabled={loading || !passwords.newPassword}
                        >
                            {loading ? "Updating..." : "Update Password"}
                        </button>

                        <div className="auth-footer">
                            <Link to="/login">Back to Login</Link>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ResetPassword;