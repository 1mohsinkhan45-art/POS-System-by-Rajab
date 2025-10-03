// FIX: Add React import to fix 'Cannot find namespace React' error.
import React, { useState, useEffect } from 'react';
import { db, User, ThemeSettings, BusinessDetails } from './db';
import { supabase } from './supabaseClient';
import Login from './components/Login';
import Setup from './components/Setup';
import POSView from './components/POSView';
import AdminDashboard from './components/AdminDashboard';
import License from './components/License';
import Welcome from './components/Welcome';
import './index.css';

// This theme logic can remain as it controls CSS variables on the client.
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


const AppFooter = () => (
    <footer className="app-footer">
        Developed by Rajab Ali | v1.0.0
    </footer>
);

export const App: React.FC = () => {
    const [isLicensed, setIsLicensed] = useState(false);
    const [isSetupComplete, setIsSetupComplete] = useState(false);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [businessDetails, setBusinessDetails] = useState<BusinessDetails | null>(null);
    const [view, setView] = useState<'pos' | 'admin'>('pos');
    const [isLoading, setIsLoading] = useState(true);
    const [showWelcome, setShowWelcome] = useState(true);

    useEffect(() => {
        // Apply default theme instantly
        applyTheme(defaultTheme);

        const checkInitialState = async () => {
            setIsLoading(true);
            const setupComplete = await db.hasOwner();
            setIsSetupComplete(setupComplete);

            if (setupComplete) {
                const licensed = await db.isLicensed();
                setIsLicensed(licensed);
            }
            setIsLoading(false);
        };

        checkInitialState();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session?.user) {
                const ownerData = await db.getCurrentUser();
                if (ownerData) {
                    const owner: User = {
                        id: ownerData.user.id,
                        email: ownerData.user.email,
                        name: ownerData.details.ownerName,
                        role: 'owner',
                        businessId: ownerData.details.id,
                    }
                    setCurrentUser(owner);
                    setBusinessDetails(ownerData.details);
                    setView('admin'); // Default owner to admin view
                }
            } else {
                setCurrentUser(null);
            }
        });

        return () => subscription.unsubscribe();
    }, []);
    
    if (showWelcome) {
        return <Welcome onFinish={() => setShowWelcome(false)} />;
    }

    const handleLogin = (user: User) => {
        setCurrentUser(user);
        if (user.role === 'owner') {
            setView('admin');
        } else {
            setView('pos');
        }
    };

    const handleLogout = async () => {
        if (currentUser?.role === 'owner') {
            await db.logout();
        }
        setCurrentUser(null);
        setView('pos');
    };
    
    const handleLicenseActivated = () => {
        setIsLicensed(true);
    }
    
    const handleSetupComplete = async () => {
        setIsSetupComplete(true);
        // After setup, check for license again
        const licensed = await db.isLicensed();
        setIsLicensed(licensed);
    }

    if (isLoading) {
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading Application...</div>;
    }

    if (!isLicensed && isSetupComplete) {
        return <License onLicenseActivated={handleLicenseActivated} />;
    }
    
    if (!isSetupComplete) {
        return <Setup onSetupComplete={handleSetupComplete} />;
    }

    if (!currentUser) {
        return <Login onLogin={handleLogin} />;
    }

    const canAccessAdmin = currentUser.role === 'owner' || (currentUser.permissions?.canAccessAdminDashboard ?? false);

    return (
        <div className="app-container">
            <main>
                {view === 'pos' && <POSView currentUser={currentUser} businessDetails={businessDetails} handleLogout={handleLogout} setView={setView} canAccessAdmin={canAccessAdmin} />}
                {view === 'admin' && canAccessAdmin && <AdminDashboard currentUser={currentUser} handleLogout={handleLogout} setView={setView} />}
                {view === 'admin' && !canAccessAdmin && 
                    <div style={{textAlign: 'center', marginTop: '5rem'}}>
                        <h2>Access Denied</h2>
                        <p>You do not have permission to access the admin dashboard.</p>
                        <button className="btn btn-primary" onClick={() => setView('pos')}>Go to POS</button>
                    </div>
                }
            </main>
            <AppFooter />
        </div>
    );
};