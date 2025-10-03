// FIX: Add React import to fix 'Cannot find namespace React' error.
import React, { useState, useMemo, useEffect } from 'react';
import { db, Sale, User } from '../db';

// FIX: Add props interface to accept currentUser
interface SalesReportProps {
    currentUser: User;
}

const SalesReport: React.FC<SalesReportProps> = ({ currentUser }) => {
// FIX: Initialize sales as an empty array and fetch asynchronously.
    const [sales, setSales] = useState<Sale[]>([]);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

// FIX: Fetch sales when the component mounts or currentUser changes.
    useEffect(() => {
        const fetchSales = async () => {
            if (currentUser.businessId) {
                const fetchedSales = await db.getSales(currentUser.businessId);
                setSales(fetchedSales);
            }
        };
        fetchSales();
    }, [currentUser.businessId]);

    const filteredSales = useMemo(() => {
// FIX: sales is now an array, so .filter will work.
        return sales.filter(sale => {
            const saleDate = new Date(sale.timestamp);
            const start = startDate ? new Date(startDate) : null;
            if(start) start.setHours(0,0,0,0);
            
            const end = endDate ? new Date(endDate) : null;
            if (end) end.setHours(23, 59, 59, 999);

            if (start && saleDate < start) return false;
            if (end && saleDate > end) return false;
            
            return true;
        }).sort((a, b) => b.timestamp - a.timestamp);
    }, [sales, startDate, endDate]);

    const totals = useMemo(() => {
        let totalRevenue = 0;
        let totalCost = 0;
        filteredSales.forEach(sale => {
            totalRevenue += sale.total; // Use the grand total from the sale record
            sale.items.forEach(item => {
                totalCost += (item.product.purchasePrice || 0) * item.quantity;
            });
        });
        const totalProfit = totalRevenue - totalCost;
        return { totalRevenue, totalCost, totalProfit, transactionCount: filteredSales.length };
    }, [filteredSales]);

    return (
        <div className="card">
            <div className="card-header">
                <h2>Sales Report</h2>
                 <div className="report-filters">
                    <div className="form-group">
                        <label>Start Date:</label>
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                    </div>
                     <div className="form-group">
                        <label>End Date:</label>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                    </div>
                </div>
            </div>

            <div className="stat-cards-container">
                <div className="stat-card sales">
                    <div className="info">
                        <h4>Total Revenue</h4>
                        <p>Rs. {totals.totalRevenue.toFixed(0)}</p>
                    </div>
                </div>
                 <div className="stat-card transactions">
                     <div className="info">
                        <h4>Transactions</h4>
                        <p>{totals.transactionCount}</p>
                    </div>
                </div>
                 <div className="stat-card profit">
                     <div className="info">
                        <h4>Total Profit</h4>
                        <p>Rs. {totals.totalProfit.toFixed(0)}</p>
                    </div>
                </div>
            </div>
            
            <table className="data-table">
                <thead>
                    <tr>
                        <th>Date & Time</th>
                        <th>Staff</th>
                        <th>Customer</th>
                        <th>Items</th>
                        <th>Total</th>
                        <th>Profit</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredSales.map(sale => {
                        const cost = sale.items.reduce((sum, item) => sum + (item.product.purchasePrice * item.quantity), 0);
                        const profit = sale.total - cost;
                        return (
                            <tr key={sale.id}>
                                <td>{new Date(sale.timestamp).toLocaleString()}</td>
                                <td>{sale.staffName}</td>
                                <td>{sale.customerName || 'N/A'}</td>
                                <td>{sale.items.reduce((sum, item) => sum + item.quantity, 0)}</td>
                                <td>Rs. {sale.total.toFixed(2)}</td>
                                <td>Rs. {profit.toFixed(2)}</td>
                            </tr>
                        )
                    })}
                </tbody>
                 <tfoot>
                    <tr>
                        <td colSpan={4}>Totals</td>
                        <td>Rs. {totals.totalRevenue.toFixed(2)}</td>
                        <td>Rs. {totals.totalProfit.toFixed(2)}</td>
                    </tr>
                </tfoot>
            </table>
        </div>
    );
};

export default SalesReport;