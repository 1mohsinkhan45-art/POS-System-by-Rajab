// FIX: Add React import to fix 'Cannot find namespace React' error.
import React, { useState, useEffect } from 'react';
import { db, ThemeSettings, User } from '../db';

// Updated default theme to match the professional design in index.css
const defaultTheme: ThemeSettings = {
    primaryColor: '#3498db',
    secondaryColor: '#2c3e50',
    dangerColor: '#e74c3c',
    successColor: '#2ecc71',
    fontFamily: "'Poppins', sans-serif",
    backgroundColor: '#f8fafc',
    cardBackgroundColor: '#ffffff',
    textColor: '#333',
    textLightColor: '#777',
    borderColor: '#e5e7eb',
    accent1: '#3498db',
    accent2: '#e74c3c',
    accent3: '#2ecc71',
    accent4: '#f1c40f',
    accent5: '#9b59b6',
    accent6: '#1abc9c',
};


const applyTheme = (theme: ThemeSettings) => {
    const root = document.documentElement;
    const cssVarMap: { [key in keyof ThemeSettings]: string } = {
        primaryColor: '--primary-color',
        secondaryColor: '--secondary-color',
        dangerColor: '--danger-color',
        successColor: '--success-color',
        fontFamily: '--font-family-sans',
        backgroundColor: '--background-color',
        cardBackgroundColor: '--card-background',
        textColor: '--text-color',
        textLightColor: '--text-light',
        borderColor: '--border-color',
        accent1: '--accent-color-1',
        accent2: '--accent-color-2',
        accent3: '--accent-color-3',
        accent4: '--accent-color-4',
        accent5: '--accent-color-5',
        accent6: '--accent-color-6',
    };
    Object.entries(theme).forEach(([key, value]) => {
        const cssVar = cssVarMap[key as keyof ThemeSettings];
        if (cssVar) {
            root.style.setProperty(cssVar, value);
        }
    });
};

// FIX: Assume component receives currentUser to get businessId
interface ThemeCustomizerProps {
    currentUser: User;
}

const ThemeCustomizer: React.FC<ThemeCustomizerProps> = ({ currentUser }) => {
// FIX: Fetch theme settings asynchronously.
    const [theme, setTheme] = useState<ThemeSettings>(defaultTheme);

    useEffect(() => {
        const fetchTheme = async () => {
            if (currentUser.businessId) {
                const savedTheme = await db.getThemeSettings(currentUser.businessId);
                setTheme(savedTheme || defaultTheme);
            }
        };
        fetchTheme();
    }, [currentUser.businessId]);

    useEffect(() => {
        applyTheme(theme);
    }, [theme]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setTheme(prev => ({ ...prev, [name]: value as any }));
    };

    const handleSave = async () => {
        if (currentUser.businessId) {
            await db.setThemeSettings(currentUser.businessId, theme);
            alert("Theme saved!");
        }
    };

    const handleReset = async () => {
        if (currentUser.businessId) {
            await db.resetThemeSettings(currentUser.businessId);
            setTheme(defaultTheme);
            alert("Theme reset to default!");
        }
    };

    const toTitleCase = (str: string) => str.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase());

    return (
        <div className="card">
            <div className="card-header">
                 <h2>Theme Customizer</h2>
            </div>
            <p>Changes are applied live. Press "Save Theme" to make them permanent for all users.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginTop: '20px' }}>
                {Object.entries(theme).map(([key, value]) => (
                    <div className="form-group" key={key}>
                        <label htmlFor={key}>{toTitleCase(key)}</label>
                        <input
                            type={key.toLowerCase().includes('color') ? 'color' : 'text'}
                            id={key}
                            name={key}
                            value={value}
                            onChange={handleChange}
                            style={{padding: key.toLowerCase().includes('color') ? '2px' : '12px', height: '48px'}}
                        />
                    </div>
                ))}
            </div>
            <div style={{ marginTop: '30px', borderTop: '1px solid var(--border-color)', paddingTop: '20px', display: 'flex', gap: '15px' }}>
                <button className="btn btn-primary" onClick={handleSave}>Save Theme</button>
                <button className="btn btn-secondary" onClick={handleReset}>Reset to Default</button>
            </div>
        </div>
    );
};

export default ThemeCustomizer;