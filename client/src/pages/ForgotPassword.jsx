import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api'; // Using your existing api service
import '../styles/auth.css'; // Reusing your login/register styles

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        try {
            const response = await api.post('/auth/forgot-password', { email });
            // We show a success message regardless of whether the email exists (Security best practice)
            setMessage("If an account exists with that email, a reset link has been sent.");
        } catch (err) {
            console.error("Forgot password error:", err);
            setError(err.response?.data?.message || "Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2>Forgot Password? 🔐</h2>
                <p className="auth-subtitle">
                    Enter your email address and we'll send you a link to reset your password.
                </p>

                {message ? (
                    <div className="success-banner">
                        <p>{message}</p>
                        <Link to="/login" className="back-to-login">
                            Return to Login
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="form-group">
                            <label htmlFor="email">Email Address</label>
                            <input
                                type="email"
                                id="email"
                                placeholder="e.g. professor@educonnect.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={loading}
                            />
                        </div>

                        {error && <p className="error-text">{error}</p>}

                        <button 
                            type="submit" 
                            className="btn-primary" 
                            disabled={loading || !email}
                        >
                            {loading ? "Sending Link..." : "Send Reset Link"}
                        </button>

                        <div className="auth-footer">
                            <span>Remember your password? </span>
                            <Link to="/login">Login here</Link>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ForgotPassword;