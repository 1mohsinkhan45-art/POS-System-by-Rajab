// FIX: Add React import to fix 'Cannot find namespace React' error.
import React, { useState } from 'react';
import { db, BusinessType } from '../db';

interface SetupProps {
    onSetupComplete: () => void;
}

const AppFooter = () => (
    <footer className="app-footer">
        Developed by Rajab Ali | v1.0.0
    </footer>
);

const Setup: React.FC<SetupProps> = ({ onSetupComplete }) => {
    const [step, setStep] = useState(1);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        businessName: '',
        businessType: 'fast-food' as BusinessType,
        ownerName: '',
        email: '',
        mobileNumber: '',
        passcode: '',
        password: '',
        confirmPassword: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleNext = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        setError('');
        if (step === 1) {
            if (!formData.businessName || !formData.businessType) {
                setError('Please fill out all business details.');
                return;
            }
        }
        if (step === 2) {
            if (!formData.ownerName || !formData.email || !formData.mobileNumber) {
                setError('Please fill out all owner details.');
                return;
            }
             if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
                setError('Please enter a valid email address.');
                return;
            }
        }
        setStep(prev => prev + 1);
    };
    
    const handleBack = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        setError('');
        setStep(prev => prev - 1);
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }
        if (formData.passcode.length !== 4 || !/^\d{4}$/.test(formData.passcode)) {
            setError('Recovery passcode must be exactly 4 digits.');
            return;
        }

        setIsLoading(true);
        try {
            await db.setupOwner(
                {
                    name: formData.ownerName,
                    email: formData.email,
                    businessName: formData.businessName,
                    businessType: formData.businessType,
                    mobileNumber: formData.mobileNumber,
                },
                formData.password,
                formData.passcode
            );
            
            // Apply pending license key if it exists
            const pendingHash = localStorage.getItem('pending_license_hash');
            if (pendingHash) {
                // This is a bit of a hack, but it works for the setup flow
                // The user needs to be logged in to update their business details.
                // We'll rely on the user logging in for the first time.
                // For a better UX, we could try to log them in automatically here.
                 alert('Setup complete! Please log in to finalize your license activation.');
                 localStorage.removeItem('pending_license_hash');
            } else {
                 alert('Setup complete! You can now log in.');
            }

            onSetupComplete();
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="setup-page-container">
            <div className="setup-branding">
                <h1>POS Pro</h1>
                <p>Your complete business management solution. Let's get you set up in just a few moments.</p>
            </div>
            <div className="setup-form-wrapper">
                <form className="setup-card card" onSubmit={handleSubmit}>
                    <h2>Initial Application Setup</h2>
                    <p>Step {step} of 3</p>
                    {error && <div className="error-message">{error}</div>}
                    
                    {step === 1 && (
                        <>
                            <h3 className="form-section-title">Business Details</h3>
                            <div className="form-group">
                                <label htmlFor="businessName">Business Name</label>
                                <input id="businessName" name="businessName" value={formData.businessName} onChange={handleChange} required />
                            </div>
                             <div className="form-group">
                                <label htmlFor="businessType">Business Type</label>
                                <select id="businessType" name="businessType" value={formData.businessType} onChange={handleChange} required>
                                    <option value="fast-food">Fast Food</option>
                                    <option value="bbq-restaurant">BBQ Restaurant</option>
                                    <option value="hotel">Hotel</option>
                                </select>
                                <p className="form-note">This will pre-load sample products for you.</p>
                            </div>
                            <button onClick={handleNext} className="btn btn-primary btn-block">Next</button>
                        </>
                    )}

                    {step === 2 && (
                       <>
                            <h3 className="form-section-title">Owner Information</h3>
                            <div className="form-group">
                                <label htmlFor="ownerName">Owner's Full Name</label>
                                <input id="ownerName" name="ownerName" value={formData.ownerName} onChange={handleChange} required />
                            </div>
                            <div className="form-group">
                                <label htmlFor="email">Owner's Email (for login)</label>
                                <input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required />
                            </div>
                             <div className="form-group">
                                <label htmlFor="mobileNumber">Mobile Number (for recovery)</label>
                                <input id="mobileNumber" name="mobileNumber" value={formData.mobileNumber} onChange={handleChange} required />
                            </div>
                            <div style={{display: 'flex', gap: '10px'}}>
                                <button onClick={handleBack} className="btn btn-secondary btn-block">Back</button>
                                <button onClick={handleNext} className="btn btn-primary btn-block">Next</button>
                            </div>
                        </>
                    )}

                    {step === 3 && (
                        <>
                            <h3 className="form-section-title">Security</h3>
                             <div className="form-group">
                                <label htmlFor="password">Create Owner Password</label>
                                <input id="password" name="password" type="password" value={formData.password} onChange={handleChange} minLength={6} required/>
                                <p className="form-note">Must be at least 6 characters long.</p>
                            </div>
                            <div className="form-group">
                                <label htmlFor="confirmPassword">Confirm Password</label>
                                <input id="confirmPassword" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} required />
                            </div>
                             <div className="form-group">
                                <label htmlFor="passcode">4-Digit Recovery Passcode</label>
                                <input id="passcode" name="passcode" type="password" value={formData.passcode} onChange={handleChange} maxLength={4} pattern="\d{4}" required />
                                <p className="form-note">Used with your mobile number if you forget your password.</p>
                            </div>
                            <div style={{display: 'flex', gap: '10px'}}>
                                <button onClick={handleBack} className="btn btn-secondary btn-block" disabled={isLoading}>Back</button>
                                <button type="submit" className="btn btn-primary btn-block" disabled={isLoading}>
                                     {isLoading ? 'Setting up...' : 'Complete Setup'}
                                </button>
                            </div>
                        </>
                    )}
                </form>
            </div>
            <AppFooter />
        </div>
    );
};

export default Setup;
