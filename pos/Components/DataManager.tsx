// FIX: Add React import to fix 'Cannot find namespace React' error.
import React, { useRef, useState } from 'react';
import { db, User } from '../db';

// FIX: Add props interface to accept currentUser
interface DataManagerProps {
    currentUser: User;
}

const DataManager: React.FC<DataManagerProps> = ({ currentUser }) => {
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const clearMessages = () => {
        setError('');
        setMessage('');
    }

// FIX: Make handler async to await db call.
    const handleExport = async () => {
        clearMessages();
        if (!currentUser.businessId) {
            setError("Cannot export: business ID is missing.");
            return;
        }
        try {
// FIX: Await the async exportData function.
            const jsonData = await db.exportData(currentUser.businessId);
            const blob = new Blob([jsonData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `pos_backup_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            setMessage('Data exported successfully.');
        } catch (err) {
            setError('Failed to export data.');
        }
    };
    
    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

// FIX: Make handler async to await db call.
    const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
        clearMessages();
        if (!currentUser.businessId) {
            setError("Cannot import: business ID is missing.");
            return;
        }
        const files = event.target.files;
        if (files && files.length > 0) {
            if (window.confirm("Are you sure? Importing will overwrite ALL current data (products, staff, sales, etc). This cannot be undone.")) {
                const file = files[0];
                const reader = new FileReader();
                reader.onload = async (e) => {
                    try {
                        const jsonString = e.target?.result as string;
// FIX: Await the async importData function.
                        await db.importData(currentUser.businessId!, jsonString);
                        setMessage('Data imported successfully. Please refresh the page to see changes.');
                    } catch (err: any) {
                        setError(`Import failed: ${err.message}`);
                    }
                };
                reader.readAsText(file);
            }
        }
        event.target.value = ''; // Reset file input
    };

// FIX: Make handler async to await db call.
    const handleClearSales = async () => {
        clearMessages();
        if (!currentUser.businessId) {
            setError("Cannot clear sales: business ID is missing.");
            return;
        }
        if (window.confirm("Are you sure you want to delete ALL sales data? This cannot be undone.")) {
// FIX: Pass businessId and await the async function.
            await db.clearSalesData(currentUser.businessId);
            setMessage("All sales data has been cleared. Refresh to see the changes in the sales report.");
        }
    };

// FIX: Make handler async to await db call.
    const handleResetApp = async () => {
        clearMessages();
        if (!currentUser.businessId) {
            setError("Cannot reset application: business ID is missing.");
            return;
        }
        if (window.prompt("This will reset the entire application, deleting all products, staff, and sales. This action cannot be undone. Type 'RESET' to confirm.") === 'RESET') {
// FIX: Await the async resetApplication function.
            await db.resetApplication(currentUser.businessId);
            setMessage("Application has been reset. You will be logged out.");
            setTimeout(() => window.location.reload(), 2000);
        }
    };

    return (
        <div className="card">
             <div className="card-header">
                <h2>Data Management</h2>
            </div>
            {message && <div className="success-message">{message}</div>}
            {error && <div className="error-message">{error}</div>}

            <div className="data-manager-actions">
                <div className="data-action-card">
                    <h4>Export Data</h4>
                    <p>Save a backup of all your application data (products, staff, sales, etc.).</p>
                    <button onClick={handleExport} className="btn btn-primary">Export Backup File</button>
                </div>

                <div className="data-action-card">
                    <h4>Import Data</h4>
                    <p>Restore data from a backup file. <strong>Warning:</strong> This will overwrite all existing data.</p>
                    <input type="file" ref={fileInputRef} accept=".json" style={{ display: 'none' }} onChange={handleFileSelected} />
                    <button onClick={handleImportClick} className="btn btn-secondary">Select and Import File</button>
                </div>
            </div>

            <div className="data-action-card danger-zone" style={{marginTop: '20px'}}>
                <h4>Danger Zone</h4>
                <p>Clear all sales records. This is useful for clearing test data. Products and staff will not be affected.</p>
                <button onClick={handleClearSales} className="btn btn-danger">Clear Sales Data</button>
                <hr style={{margin: '20px 0'}}/>
                <p>Reset the entire application to its initial setup state. Your license key will remain, but all other data will be lost.</p>
                <button onClick={handleResetApp} className="btn btn-danger">Factory Reset Application</button>
            </div>
        </div>
    );
};

export default DataManager;