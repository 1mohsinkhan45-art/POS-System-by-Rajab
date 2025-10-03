import React, { useState } from 'react';
import { db } from '../db';

const DeveloperDashboard: React.FC = () => {
    const [keyToActivate, setKeyToActivate] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    
    const handleActivate = () => {
        setError('');
        setMessage('');
        if (db.activateLicense(keyToActivate)) {
            setMessage(`Key "${keyToActivate}" activated successfully. Please refresh.`);
        } else {
            setError(`Key "${keyToActivate}" is invalid.`);
        }
    };
    
    const showAllData = () => {
        console.clear();
        console.log("--- ALL LOCAL STORAGE DATA ---");
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key) {
                try {
                     console.log(key, ":", JSON.parse(localStorage.getItem(key) as string));
                } catch(e) {
                     console.log(key, ":", localStorage.getItem(key));
                }
            }
        }
        setMessage("All local storage data has been logged to the browser console.");
    }
    
    return (
        <div>
            <h2>Developer Dashboard</h2>
            <p style={{fontStyle: 'italic'}}>For internal use only.</p>
            
            <div style={{ border: '1px solid #ccc', padding: '1rem', marginBottom: '1rem' }}>
                <h3>License Activation</h3>
                <input 
                    type="text"
                    value={keyToActivate}
                    onChange={(e) => setKeyToActivate(e.target.value)}
                    placeholder="Enter license key"
                    style={{marginRight: '1rem'}}
                />
                <button onClick={handleActivate}>Activate Key</button>
            </div>

            <div style={{ border: '1px solid #ccc', padding: '1rem', marginBottom: '1rem' }}>
                <h3>Debug Tools</h3>
                <button onClick={showAllData}>Log All Data to Console</button>
            </div>

            {message && <p style={{color: 'green', marginTop: '1rem'}}>{message}</p>}
            {error && <p style={{color: 'red', marginTop: '1rem'}}>{error}</p>}
        </div>
    );
};

export default DeveloperDashboard;