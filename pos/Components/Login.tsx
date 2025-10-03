// FIX: Add React import to fix 'Cannot find namespace React' error.
import React, { useState } from 'react';
import { db, User } from '../db';
import Recovery from './Recovery';

interface LoginProps {
    onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
    const [credential, setCredential] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showRecovery, setShowRecovery] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            const user = await db.authenticateUser(credential, password);
            if (user) {
                onLogin(user);
            } else {
                setError('Invalid credentials. Please try again.');
            }
        } catch (err: any) {
            setError(err.message || "An unknown error occurred during login.");
        } finally {
            setIsLoading(false);
        }
    };
    
    if (showRecovery) {
        return <Recovery onBackToLogin={() => setShowRecovery(false)} />;
    }

    return (
        <div className="auth-container">
            <div className="auth-card card">
                <h1>Welcome Back!</h1>
                <h2>Please sign in to continue</h2>
                <form onSubmit={handleSubmit}>
                     {error && <div className="error-message">{error}</div>}
                    <div className="form-group">
                        <label htmlFor="credential">Email or Username</label>
                        <input
                            id="credential"
                            type="text"
                            value={credential}
                            onChange={(e) => setCredential(e.target.value)}
                            required
                            disabled={isLoading}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={isLoading}
                        />
                    </div>
                    <button type="submit" className="btn btn-primary btn-block" disabled={isLoading}>
                        {isLoading ? 'Logging in...' : 'Login'}
                    </button>
                </form>
                <a href="#" onClick={(e) => {e.preventDefault(); setShowRecovery(true)}} className="forgot-password-link">
                    Forgot Password? (Owner only)
                </a>
            </div>
        </div>
    );
};

export default Login;
