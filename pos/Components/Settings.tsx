// FIX: Add React import to fix 'Cannot find namespace React' error.
import React, { useState, useEffect } from 'react';
import { db, BusinessDetails, User } from '../db';

// FIX: Add props interface to accept currentUser
interface SettingsProps {
    currentUser: User;
}

const Settings: React.FC<SettingsProps> = ({ currentUser }) => {
// FIX: Initialize details as null and fetch asynchronously.
    const [details, setDetails] = useState<BusinessDetails | null>(null);
    const [message, setMessage] = useState('');

// FIX: Fetch business details when the component mounts or currentUser changes.
    useEffect(() => {
        const fetchDetails = async () => {
            if (currentUser.businessId) {
                const fetchedDetails = await db.getBusinessDetails(currentUser.businessId);
                setDetails(fetchedDetails);
            }
        };
        fetchDetails();
    }, [currentUser.businessId]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const isNumber = type === 'number';
        setDetails(prev => prev ? ({ ...prev, [name]: isNumber ? parseFloat(value) || 0 : value as any }) : null);
    };

    const handleSave = async () => {
        if (!details || !currentUser.businessId) return;
// FIX: Pass businessId as the first argument to updateBusinessDetails.
        await db.updateBusinessDetails(currentUser.businessId, details);
        setMessage('Settings saved successfully! Changes will be fully applied on next login/refresh.');
        setTimeout(() => setMessage(''), 3000);
    };

    if (!details) {
        return <div className="card"><p>Loading settings...</p></div>;
    }

    return (
        <div className="card">
            <div className="card-header">
                 <h2>Business & Receipt Settings</h2>
            </div>
            {message && <div className="success-message">{message}</div>}
            
            <form className="settings-form" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                <h3 className="form-section-title">Business Information</h3>
                <div className="form-group">
                    <label htmlFor="businessName">Business Name</label>
                    <input id="businessName" name="businessName" value={details.businessName} onChange={handleChange} />
                </div>

                <div className="form-group">
                    <label>Display Language (for product names)</label>
                    <select name="displayLanguage" value={details.displayLanguage} onChange={handleChange}>
                        <option value="english">English Only</option>
                        <option value="urdu">Urdu Only</option>
                        <option value="both">Both (English & Urdu)</option>
                    </select>
                </div>
                
                <h3 className="form-section-title" style={{marginTop: '30px'}}>Receipt Customization</h3>
                <div className="form-group">
                    <label htmlFor="logoUrl">Company Logo URL</label>
                    <input id="logoUrl" name="logoUrl" value={details.logoUrl || ''} onChange={handleChange} placeholder="https://... or data:image/png;base64,..." />
                     <p className="form-note">For offline use, convert your logo to a Base64 string and paste it here.</p>
                </div>
                 <div className="form-group">
                    <label htmlFor="receiptFooter">Receipt Footer Message</label>
                    <textarea id="receiptFooter" name="receiptFooter" value={details.receiptFooter || ''} onChange={handleChange} rows={3}></textarea>
                </div>
                <div className="form-grid" style={{gridTemplateColumns: '1fr 1fr', gap: '20px'}}>
                    <div className="form-group">
                        <label htmlFor="taxRate">Sales Tax Rate (%)</label>
                        <input id="taxRate" name="taxRate" type="number" min="0" step="0.1" value={details.taxRate || 0} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="receiptFontSize">Receipt Font Size</label>
                        <select id="receiptFontSize" name="receiptFontSize" value={details.receiptFontSize || 'medium'} onChange={handleChange}>
                            <option value="small">Small</option>
                            <option value="medium">Medium</option>
                            <option value="large">Large</option>
                        </select>
                    </div>
                </div>

                <div className="form-actions">
                    <button type="submit" className="btn btn-primary">Save Settings</button>
                </div>
            </form>
        </div>
    );
};

export default Settings;