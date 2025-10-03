// FIX: Add React import to fix 'Cannot find namespace React' error.
import React, { useState, useEffect } from 'react';
import { db, User, BusinessDetails } from '../db';
import ProductManager from './ProductManager';
import StaffManager from './StaffManager';
import SalesReport from './SalesReport';
import Settings from './Settings';
import DataManager from './DataManager';

type AdminView = 'products' | 'staff' | 'sales' | 'settings' | 'data';

interface AdminDashboardProps {
    currentUser: User;
    handleLogout: () => void;
    setView: (view: 'pos' | 'admin') => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentUser, handleLogout, setView }) => {
    const [adminView, setAdminView] = useState<AdminView>('sales');
// FIX: Fetch business details asynchronously.
    const [businessDetails, setBusinessDetails] = useState<BusinessDetails | null>(null);

    useEffect(() => {
        const fetchDetails = async () => {
            if (currentUser.businessId) {
                const details = await db.getBusinessDetails(currentUser.businessId);
                setBusinessDetails(details);
            }
        };
        fetchDetails();
    }, [currentUser.businessId]);

    const renderView = () => {
        switch (adminView) {
// FIX: Pass currentUser to child components.
            case 'products':
                return <ProductManager currentUser={currentUser} />;
            case 'staff':
                return <StaffManager currentUser={currentUser} />;
            case 'sales':
                return <SalesReport currentUser={currentUser} />;
            case 'settings':
                return <Settings currentUser={currentUser} />;
            case 'data':
                return <DataManager currentUser={currentUser} />;
            default:
                return <SalesReport currentUser={currentUser} />;
        }
    };
    
    const NavButton: React.FC<{ viewName: AdminView; label: string }> = ({ viewName, label }) => (
        <button 
            className={`nav-btn ${adminView === viewName ? 'active' : ''}`}
            onClick={() => setAdminView(viewName)}
        >
            {label}
        </button>
    );

    return (
        <div className="admin-dashboard-container">
            <header className="admin-header card">
                <h1>{businessDetails?.businessName || 'Loading...'} - Admin</h1>
                <div className="user-info">
                    <span>Welcome, {currentUser.name}</span>
                    <button className="btn btn-secondary" onClick={() => setView('pos')}>Go to POS</button>
                    <button className="btn btn-danger" onClick={handleLogout}>Logout</button>
                </div>
            </header>
            <div className="admin-main-content">
                <aside className="admin-sidebar card">
                    <nav className="admin-nav">
                        <NavButton viewName="sales" label="Sales Report" />
                        <NavButton viewName="products" label="Product Management" />
                        <NavButton viewName="staff" label="Staff Management" />
                        <NavButton viewName="settings" label="Business Settings" />
                        <NavButton viewName="data" label="Data Management" />
                    </nav>
                </aside>
                <main className="admin-view-area">
                    {renderView()}
                </main>
            </div>
        </div>
    );
};

export default AdminDashboard;
