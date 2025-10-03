// FIX: Add React import to fix 'Cannot find namespace React' error.
import React, { useState, useEffect } from 'react';
import { db, Product, User } from '../db';
import Modal from './Modal';

const emptyProduct: Omit<Product, 'id' | 'business_id'> = { name: '', urduName: '', price: 0, purchasePrice: 0, category: '' };

// FIX: Add props interface to accept currentUser
interface ProductManagerProps {
    currentUser: User;
}

const ProductManager: React.FC<ProductManagerProps> = ({ currentUser }) => {
// FIX: Initialize products as an empty array and fetch asynchronously.
    const [products, setProducts] = useState<Product[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | Omit<Product, 'id'> | null>(null);

// FIX: Fetch products when the component mounts or currentUser changes.
    useEffect(() => {
        refreshProducts();
    }, [currentUser.businessId]);

    const refreshProducts = async () => {
        if (!currentUser.businessId) return;
        const fetchedProducts = await db.getProducts(currentUser.businessId);
        setProducts(fetchedProducts);
    };

    const handleOpenModal = (product: Product | null = null) => {
        setEditingProduct(product ? { ...product } : { ...emptyProduct });
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingProduct(null);
    };

    const handleSave = async () => {
        if (!editingProduct || !editingProduct.name || !editingProduct.category || editingProduct.price <= 0) {
            alert("Please fill in at least Name, Category, and a valid Price.");
            return;
        }
        if ('id' in editingProduct) {
            await db.updateProduct(editingProduct as Product);
        } else {
            if (!currentUser.businessId) {
                alert("Cannot add product: business ID is missing.");
                return;
            }
// FIX: Pass business_id when adding a new product.
            await db.addProduct({ ...editingProduct, business_id: currentUser.businessId });
        }
        await refreshProducts();
        handleCloseModal();
    };

    const handleDelete = async (productId: string) => {
        if (window.confirm("Are you sure you want to delete this product?")) {
            await db.deleteProduct(productId);
            await refreshProducts();
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!editingProduct) return;
        const { name, value, type } = e.target;
        setEditingProduct(prev => ({ ...prev!, [name]: type === 'number' ? parseFloat(value) || 0 : value }));
    };

    return (
        <div className="card">
            <div className="card-header">
                <h2>Product Management</h2>
                <button className="btn btn-primary" onClick={() => handleOpenModal()}>Add New Product</button>
            </div>
            <table className="data-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th className="urdu-name-cell">Urdu Name</th>
                        <th>Category</th>
                        <th>Price</th>
                        <th>Cost</th>
                        <th className="actions">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {products.map(p => (
                        <tr key={p.id}>
                            <td>{p.name}</td>
                            <td className="urdu-name-cell">{p.urduName}</td>
                            <td>{p.category}</td>
                            <td>{p.price.toFixed(2)}</td>
                            <td>{p.purchasePrice.toFixed(2)}</td>
                            <td className="actions">
                                <button className="btn btn-secondary" onClick={() => handleOpenModal(p)}>Edit</button>
                                <button className="btn btn-danger" onClick={() => handleDelete(p.id)}>Delete</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {isModalOpen && editingProduct && (
                <Modal onClose={handleCloseModal}>
                    <h2>{'id' in editingProduct ? 'Edit' : 'Add'} Product</h2>
                    <div className="form-group">
                        <label>Product Name</label>
                        <input name="name" value={editingProduct.name} onChange={handleInputChange} placeholder="e.g., Zinger Burger" />
                    </div>
                     <div className="form-group">
                        <label>Urdu Name</label>
                        <input name="urduName" value={editingProduct.urduName} onChange={handleInputChange} placeholder="مثال: زنگر برگر" style={{fontFamily: 'var(--font-family-urdu)', direction: 'rtl'}}/>
                    </div>
                     <div className="form-group">
                        <label>Category</label>
                        <input name="category" value={editingProduct.category} onChange={handleInputChange} placeholder="e.g., Burgers" />
                    </div>
                     <div className="form-group">
                        <label>Selling Price</label>
                        <input name="price" type="number" value={editingProduct.price} onChange={handleInputChange} placeholder="e.g., 450" />
                    </div>
                     <div className="form-group">
                        <label>Purchase Price (Cost)</label>
                        <input name="purchasePrice" type="number" value={editingProduct.purchasePrice} onChange={handleInputChange} placeholder="e.g., 280" />
                    </div>
                    <div className="modal-actions">
                        <button className="btn btn-secondary" onClick={handleCloseModal}>Cancel</button>
                        <button className="btn btn-primary" onClick={handleSave}>Save Product</button>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default ProductManager;