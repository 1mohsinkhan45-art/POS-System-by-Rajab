// FIX: Add React import to fix 'Cannot find namespace React' error.
import React from 'react';

interface WelcomeProps {
    onFinish: () => void;
}

const AppFooter = () => (
    <footer className="app-footer">
        Developed by Rajab Ali | v1.0.0
    </footer>
);

const Welcome: React.FC<WelcomeProps> = ({ onFinish }) => {
    return (
        <div className="welcome-container">
            <div className="welcome-card card">
                <h1>Welcome to POS Pro</h1>
                <p>Your all-in-one business management solution.</p>
                <div className="auth-actions">
                    <button onClick={onFinish} className="btn btn-primary btn-lg">
                        Get Started
                    </button>
                </div>
            </div>
            <AppFooter />
        </div>
    );
};

export default Welcome;
