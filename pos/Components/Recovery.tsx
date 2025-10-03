// FIX: Add React import to fix 'Cannot find namespace React' error.
import React, { useState } from 'react';
import { db } from '../db';

interface RecoveryProps {
    onBackToLogin: () => void;
}

const Recovery: React.FC<RecoveryProps> = ({ onBackToLogin }) => {
    const [step, setStep] = useState(1);
    const [mobileNumber, setMobileNumber] = useState('');
    const [passcode, setPasscode] = useState('');
    const [recoveredCreds, setRecoveredCreds] = useState<{ name: string; email: string } | null>(null);
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

// FIX: Make handler async to await db call.
    const handleVerify = async () => {
        setError('');
// FIX: Await the promise from recoverOwner.
        const creds = await db.recoverOwner(mobileNumber, passcode);
        if (creds) {
            setRecoveredCreds(creds);
            setStep(2);
// FIX: creds is now the resolved object, so creds.name is accessible.
            setMessage(`Account found for ${creds.name}. Please set a new password.`);
        } else {
            setError('Invalid mobile number or passcode.');
        }
    };

// FIX: Make handler async to await db call.
    const handleResetPassword = async () => {
        setError('');
        if (newPassword !== confirmNewPassword) {
            setError('Passwords do not match.');
            return;
        }
        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }
        if (!recoveredCreds) {
            setError('An error occurred. Please start over.');
            return;
        }
        
// FIX: Await the promise from updateOwnerCredentials.
        const success = await db.updateOwnerCredentials(mobileNumber, {
            ...recoveredCreds,
            password: newPassword,
        });

        if (success) {
            setMessage('Password has been reset successfully. You can now log in.');
            setStep(3); // Go to a final success step
            setTimeout(() => {
                onBackToLogin();
            }, 3000);
        } else {
            setError('Failed to update password. Please try again.');
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card card">
                <h1>Account Recovery</h1>
                 {error && <div className="error-message">{error}</div>}
                 {message && <div className="success-message">{message}</div>}

                {step === 1 && (
                    <form onSubmit={(e) => { e.preventDefault(); handleVerify(); }}>
                        <p className="auth-note" style={{marginBottom: '20px'}}>Enter the mobile number and 4-digit passcode you used during setup.</p>
                        <div className="form-group">
                            <label>Mobile Number</label>
                            <input value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} placeholder="03xxxxxxxxx" required />
                        </div>
                        <div className="form-group">
                            <label>4-Digit Passcode</label>
                            <input value={passcode} onChange={(e) => setPasscode(e.target.value)} placeholder="••••" type="password" maxLength={4} required/>
                        </div>
                        <button type="submit" className="btn btn-primary btn-block">Verify</button>
                    </form>
                )}
                
                {step === 2 && (
                    <form onSubmit={(e) => { e.preventDefault(); handleResetPassword(); }}>
                         <div className="form-group">
                            <label>New Password</label>
                            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter at least 6 characters" required />
                        </div>
                        <div className="form-group">
                            <label>Confirm New Password</label>
                            <input type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} placeholder="Confirm your new password" required />
                        </div>
                        <button type="submit" className="btn btn-primary btn-block">Reset Password</button>
                    </form>
                )}

                {step !== 3 && (
                    <a href="#" onClick={(e) => {e.preventDefault(); onBackToLogin()}} className="forgot-password-link">Back to Login</a>
                )}
            </div>
        </div>
    );
};

export default Recovery;