// FIX: Add React import to fix 'Cannot find namespace React' error.
import React, { useState, useEffect } from 'react';
import { db, User } from '../db';
import Modal from './Modal';

const emptyStaff: Omit<User, 'id' | 'passwordHash' | 'role' | 'email'> = { name: '', username: '', fatherName: '', cnic: '', dob: '', contact: '', emergencyContact: '', permissions: { canAccessAdminDashboard: false } };

// FIX: Add props interface to accept currentUser
interface StaffManagerProps {
    currentUser: User;
}

const StaffManager: React.FC<StaffManagerProps> = ({ currentUser }) => {
// FIX: Initialize staff as an empty array and fetch asynchronously.
    const [staff, setStaff] = useState<User[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStaff, setEditingStaff] = useState<User | null>(null);
    const [newPassword, setNewPassword] = useState('');
    const [formState, setFormState] = useState<Partial<User>>({});

// FIX: Fetch staff when the component mounts or currentUser changes.
    useEffect(() => {
        refreshStaff();
    }, [currentUser.businessId]);

    const refreshStaff = async () => {
        if (currentUser.businessId) {
            setStaff(await db.getStaff(currentUser.businessId));
        }
    };

    const handleOpenModal = (staffMember: User | null = null) => {
        setEditingStaff(staffMember);
        setFormState(staffMember ? { ...staffMember } : { ...emptyStaff });
        setNewPassword('');
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingStaff(null);
        setFormState({});
    };

    const handleSave = async () => {
        try {
            if (!formState.name || !formState.username) {
                alert("Name and Username are required.");
                return;
            }
            if (editingStaff) { // Update
                await db.updateStaff(formState as User, newPassword || undefined);
            } else { // Add
                if (!newPassword || newPassword.length < 4) {
                    alert("A password of at least 4 characters is required for new staff members.");
                    return;
                }
                if (!currentUser.businessId) {
                    alert("Cannot add staff: business ID is missing.");
                    return;
                }
// FIX: Pass businessId as the third argument to addStaff.
                await db.addStaff(formState as any, newPassword, currentUser.businessId);
            }
            await refreshStaff();
            handleCloseModal();
        } catch (error: any) {
            alert(error.message);
        }
    };
    
    const handleDelete = async (staffId: string) => {
        if (window.confirm("Are you sure you want to delete this staff member?")) {
            await db.deleteStaff(staffId);
            await refreshStaff();
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: value }));
    };

    const handlePermissionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { checked } = e.target;
        setFormState(prev => ({ ...prev, permissions: { ...(prev.permissions || {}), canAccessAdminDashboard: checked } }));
    };


    return (
        <div className="card">
            <div className="card-header">
                <h2>Staff Management</h2>
                <button className="btn btn-primary" onClick={() => handleOpenModal()}>Add New Staff</button>
            </div>
            <table className="data-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Username</th>
                        <th>Contact</th>
                        <th>Admin Access</th>
                        <th className="actions">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {staff.map(s => (
                        <tr key={s.id}>
                            <td>{s.name}</td>
                            <td>{s.username}</td>
                            <td>{s.contact}</td>
                            <td>{s.permissions?.canAccessAdminDashboard ? 'Yes' : 'No'}</td>
                            <td className="actions">
                                <button className="btn btn-secondary" onClick={() => handleOpenModal(s)}>Edit</button>
                                <button className="btn btn-danger" onClick={() => handleDelete(s.id)}>Delete</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            
            {isModalOpen && (
                <Modal onClose={handleCloseModal}>
                    <form className="staff-form" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                        <h2>{editingStaff ? 'Edit' : 'Add'} Staff Member</h2>
                        <div className="form-grid">
                             <div className="form-group">
                                <label>Full Name</label>
                                <input name="name" value={formState.name || ''} onChange={handleInputChange} required />
                            </div>
                             <div className="form-group">
                                <label>Username (for login)</label>
                                <input name="username" value={formState.username || ''} onChange={handleInputChange} required />
                            </div>
                             <div className="form-group">
                                <label>Contact Number</label>
                                <input name="contact" value={formState.contact || ''} onChange={handleInputChange} />
                            </div>
                            <div className="form-group">
                                <label>CNIC (optional)</label>
                                <input name="cnic" value={formState.cnic || ''} onChange={handleInputChange} />
                            </div>
                        </div>
                        <hr/>
                        <h4>Security & Permissions</h4>
                        <div className="form-group">
                            <label>{editingStaff ? "New Password (optional)" : "Password"}</label>
                            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder={editingStaff ? "Leave blank to keep current password" : "Min. 4 characters"} />
                        </div>
                        <div className="form-group-checkbox">
                            <input type="checkbox" id="adminAccess" checked={formState.permissions?.canAccessAdminDashboard || false} onChange={handlePermissionChange} />
                            <label htmlFor="adminAccess">Can Access Admin Dashboard</label>
                        </div>

                        <div className="modal-actions">
                            <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>Cancel</button>
                            <button type="submit" className="btn btn-primary">Save</button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
};

export default StaffManager;