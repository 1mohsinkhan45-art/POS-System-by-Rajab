// FIX: Add React import to fix 'Cannot find namespace React' error.
import React, { useState, useMemo, useEffect } from 'react';
import { db, Product, CartItem, User, Sale, BusinessDetails } from '../db';
import Modal from './Modal';
import PrintBill from './PrintBill';

interface POSViewProps {
    currentUser: User;
    businessDetails: BusinessDetails | null;
    handleLogout: () => void;
    setView: (view: 'pos' | 'admin') => void;
    canAccessAdmin: boolean;
}

const PrintableReceipt: React.FC<{ sale: Sale, businessDetails: BusinessDetails | null }> = ({ sale, businessDetails }) => {
    if (!businessDetails) return null;
    const { items, subtotal, taxAmount, total, staffName, customerName, timestamp } = sale;
    const taxRate = businessDetails.taxRate || 0;

    return (
        <div id="printable-receipt" className={`font-${businessDetails.receiptFontSize || 'medium'}`}>
            <div className="receipt-header">
                {businessDetails.logoUrl && <img src={businessDetails.logoUrl} alt="Logo" className="receipt-logo" />}
                <h2 className="business-name">{businessDetails.businessName}</h2>
            </div>
            <div className="receipt-details">
                <p><strong>Date:</strong> {new Date(timestamp).toLocaleString()}</p>
                <p><strong>Cashier:</strong> {staffName}</p>
                {customerName && <p><strong>Customer:</strong> {customerName}</p>}
            </div>
            <table className="receipt-table">
                <thead>
                    <tr>
                        <th className="col-item">Item</th>
                        <th className="col-price">Price</th>
                        <th className="col-total">Total</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map(item => (
                        <tr key={item.product.id}>
                            <td>{item.product.name}<br/>x {item.quantity}</td>
                            <td className="col-price">Rs. {item.product.price.toFixed(2)}</td>
                            <td className="col-total">Rs. {(item.quantity * item.product.price).toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
                <tfoot>
                    <tr className="summary-row subtotal">
                        <td></td>
                        <td className="summary-label">Subtotal</td>
                        <td className="summary-value">Rs. {subtotal.toFixed(2)}</td>
                    </tr>
                    {taxRate > 0 && (
                        <tr className="summary-row">
                            <td></td>
                            <td className="summary-label">Tax ({taxRate}%)</td>
                            <td className="summary-value">Rs. {taxAmount.toFixed(2)}</td>
                        </tr>
                    )}
                    <tr className="summary-row grand-total">
                        <td></td>
                        <td className="summary-label">Grand Total</td>
                        <td className="summary-value">Rs. {total.toFixed(2)}</td>
                    </tr>
                </tfoot>
            </table>
            <p className="receipt-footer">{businessDetails.receiptFooter || 'Thank you!'}</p>
        </div>
    );
};


const POSView: React.FC<POSViewProps> = ({ currentUser, businessDetails, handleLogout, setView, canAccessAdmin }) => {
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [cart, setCart] = useState<CartItem[]>([]);
    const [customerName, setCustomerName] = useState('');
    const [lastSale, setLastSale] = useState<Sale | null>(null);
    const [saleComplete, setSaleComplete] = useState(false);

    useEffect(() => {
        const fetchProducts = async () => {
            if (!currentUser.businessId) {
                setError("Business ID not found for current user.");
                setIsLoading(false);
                return;
            }
            try {
                setIsLoading(true);
                const products = await db.getProducts(currentUser.businessId);
                setAllProducts(products);
                setError('');
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProducts();
    }, [currentUser.businessId]);

    const categories = useMemo(() => ['All', ...new Set(allProducts.map(p => p.category))], [allProducts]);
    
    const filteredProducts = useMemo(() => {
        return allProducts.filter(p => {
            const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
            const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                p.urduName.includes(searchTerm);
            return matchesCategory && matchesSearch;
        });
    }, [allProducts, selectedCategory, searchTerm]);

    const addToCart = (product: Product) => {
        setCart(prevCart => {
            const existingItem = prevCart.find(item => item.product.id === product.id);
            if (existingItem) {
                return prevCart.map(item => 
                    item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            }
            return [...prevCart, { product, quantity: 1 }];
        });
    };

    const updateQuantity = (productId: string, newQuantity: number) => {
        if (newQuantity <= 0) {
            setCart(prevCart => prevCart.filter(item => item.product.id !== productId));
        } else {
            setCart(prevCart => prevCart.map(item =>
                item.product.id === productId ? { ...item, quantity: newQuantity } : item
            ));
        }
    };

    const cartSummary = useMemo(() => {
        const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
        const taxRate = (businessDetails?.taxRate || 0) / 100;
        const taxAmount = subtotal * taxRate;
        const total = subtotal + taxAmount;
        return { subtotal, taxAmount, total };
    }, [cart, businessDetails]);

    const handleCheckout = async () => {
        if (cart.length === 0) return;
        
        const sale: Omit<Sale, 'id' | 'timestamp'> = {
            items: cart,
            subtotal: cartSummary.subtotal,
            taxAmount: cartSummary.taxAmount,
            total: cartSummary.total,
            staffName: currentUser.name,
            customerName: customerName || undefined
        };
        
        try {
            if (!currentUser.businessId) throw new Error("Business ID is missing.");
            await db.addSale(sale, currentUser.businessId);
            const completedSale = { ...sale, id: 'temp', timestamp: Date.now() };
            setLastSale(completedSale);
            setSaleComplete(true);
            setCart([]);
            setCustomerName('');
        } catch (err: any) {
            alert(`Failed to record sale: ${err.message}`);
        }
    };

    const startNewSale = () => {
        setSaleComplete(false);
        setLastSale(null);
    };

    return (
        <div className="pos-container">
            <header className="pos-header card">
                <h1>{businessDetails?.businessName || "POS"}</h1>
                <div className="user-info">
                    <span>Cashier: {currentUser.name}</span>
                    {canAccessAdmin && <button className="btn btn-secondary" onClick={() => setView('admin')}>Admin Panel</button>}
                    <button className="btn btn-danger" onClick={handleLogout}>Logout</button>
                </div>
            </header>
            <main className="pos-main-content">
                <aside className="pos-sidebar card">
                    <nav className="category-nav">
                        {categories.map(cat => (
                            <button key={cat} onClick={() => setSelectedCategory(cat)} className={`nav-btn ${selectedCategory === cat ? 'active' : ''}`}>
                                {cat}
                            </button>
                        ))}
                    </nav>
                </aside>
                <section className="product-display-area card">
                    <div className="product-grid-header">
                        <input type="text" placeholder="Search products..." className="search-input" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    </div>
                    <div className="product-grid">
                        {isLoading && <p>Loading products...</p>}
                        {error && <p className="error-message">{error}</p>}
                        {!isLoading && !error && filteredProducts.length === 0 && <p className="no-products-found">No products found.</p>}
                        {!isLoading && !error && filteredProducts.map((p, index) => (
                            <div key={p.id} className={`product-card color-${(index % 6) + 1}`} onClick={() => addToCart(p)}>
                                <h4>{p.name}</h4>
                                <p className="urdu-name">{p.urduName}</p>
                                <p>Rs. {p.price}</p>
                            </div>
                        ))}
                    </div>
                </section>
                <aside className="cart-sidebar card">
                    {saleComplete ? (
                        <div>
                            <h3>Sale Recorded!</h3>
                            <div style={{ margin: '20px 0', textAlign: 'center' }}>
                                <p>Total: <strong>Rs. {lastSale?.total.toFixed(2)}</strong></p>
                            </div>
                            {lastSale && <PrintBill />}
                            <button onClick={startNewSale} className="btn btn-secondary btn-block" style={{ marginTop: '10px' }}>New Sale</button>
                        </div>
                    ) : (
                        <>
                            <h3>Current Order</h3>
                            <div className="cart-items">
                                {cart.length === 0 && <p style={{ textAlign: 'center', color: 'var(--text-light)', marginTop: '20px' }}>Cart is empty</p>}
                                {cart.map(item => (
                                    <div key={item.product.id} className="cart-item">
                                        <div className="item-info">
                                            {item.product.name}
                                            <span>Rs. {item.product.price.toFixed(2)}</span>
                                        </div>
                                        <div className="item-controls">
                                            <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)}>-</button>
                                            <input type="number" value={item.quantity} onChange={(e) => updateQuantity(item.product.id, parseInt(e.target.value) || 0)} />
                                            <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)}>+</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="cart-summary">
                                <div className="form-group">
                                    <input type="text" placeholder="Customer Name (Optional)" value={customerName} onChange={e => setCustomerName(e.target.value)} />
                                </div>
                                <p>Subtotal: <strong>Rs. {cartSummary.subtotal.toFixed(2)}</strong></p>
                                {businessDetails?.taxRate && businessDetails.taxRate > 0 && <p>Tax ({businessDetails.taxRate}%): <strong>Rs. {cartSummary.taxAmount.toFixed(2)}</strong></p>}
                                <h3>Total: <strong>Rs. {cartSummary.total.toFixed(2)}</strong></h3>
                                <button onClick={handleCheckout} className="btn btn-primary btn-block btn-lg" disabled={cart.length === 0}>Checkout</button>
                            </div>
                        </>
                    )}
                </aside>
            </main>
            {lastSale && businessDetails && <PrintableReceipt sale={lastSale} businessDetails={businessDetails} />}
        </div>
    );
};

export default POSView;
