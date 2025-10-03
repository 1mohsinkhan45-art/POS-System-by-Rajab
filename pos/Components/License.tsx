// FIX: Add React import to fix 'Cannot find namespace React' error.
import React, { useState } from 'react';
import { db } from '../db';

interface LicenseProps {
    onLicenseActivated: () => void;
}

const AppFooter = () => (
    <footer className="app-footer">
        Developed by Rajab Ali | v1.0.0
    </footer>
);

const License: React.FC<LicenseProps> = ({ onLicenseActivated }) => {
    const [licenseKey, setLicenseKey] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const handleActivate = async () => {
        setError('');
        setMessage('');
        if (!licenseKey) {
            setError('Please enter a license key.');
            return;
        }

        if (await db.activateLicense(licenseKey)) {
            setMessage('License activated successfully! Redirecting...');
            setTimeout(() => {
                onLicenseActivated();
            }, 1500);
        } else {
            setError('Invalid license key. Please try again or use DEMO-1HOUR-ACCESS for a trial.');
        }
    };
    
    return (
        <div className="auth-container">
            <div className="auth-card card">
                <h1>Activate Your Software</h1>
                <h2>Enter your license key to continue.</h2>
                <p className="form-note">If you don't have one, you can use <strong>DEMO-1HOUR-ACCESS</strong> for a 1-hour trial.</p>

                <div className="form-group" style={{marginTop: '25px'}}>
                    <label htmlFor="licenseKey">License Key</label>
                    <input
                        id="licenseKey"
                        type="text"
                        value={licenseKey}
                        onChange={(e) => setLicenseKey(e.target.value.trim())}
                        placeholder="Enter License Key"
                    />
                </div>
                
                {error && <div className="error-message">{error}</div>}
                {message && <div className="success-message">{message}</div>}

                <div className="auth-actions">
                    <button onClick={handleActivate} className="btn btn-primary btn-block">
                        Activate
                    </button>
                    <p className="auth-note">To purchase a lifetime license key, please contact us:</p>
                    <a href="https://wa.me/923016584282?text=I'm%20interested%20in%20buying%20a%20license%20for%20the%20POS%20Pro%20software." target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp btn-block">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" fill="white">
                            <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.8 0-67.6-9.5-97.8-27.2l-6.9-4-72.7 19.1 19.4-70.9-4.4-7.2c-19.5-32.3-30.4-69.8-30.4-108.7 0-107.1 87.1-194.2 194.2-194.2 51.9 0 100.3 20.2 137.2 57.1 36.9 36.9 57.1 85.3 57.1 137.2 0 107.1-87.1 194.2-194.2 194.2zM199.1 170c-3.2-5.3-7.2-5.4-10.4-5.5-3.2 0-7.2 0-11.2 5.3-4 5.3-15.2 14.8-15.2 36.1 0 21.3 15.5 41.9 17.6 44.8 2.1 2.9 30.8 49.3 75.3 66.8 36.2 14.1 44.8 11.3 52.3 10.7 7.5-.6 23.2-9.5 26.4-18.7 3.2-9.2.2-17.1-1.9-19.1-2.1-2-4.6-3.2-7.2-4.3-2.6-1.1-15.2-7.5-17.6-8.3-2.4-.8-4.1-.4-5.8 1.1-1.7 1.5-6.6 8.3-8.1 10-1.5 1.7-3.1 1.9-5.8.6-2.6-1.3-11.2-4.1-21.3-13.2-7.9-7.2-13.2-16.1-14.7-18.9-1.5-2.8-.2-4.3 1.1-5.6 1.1-1.3 2.6-3.3 3.9-4.9 1.3-1.7 1.7-2.8 2.6-4.9 1.1-2.1.2-3.9-1-5.3z"/>
                        </svg>
                        Buy on WhatsApp
                    </a>
                </div>
            </div>
            <AppFooter />
        </div>
    );
};

export default License;