import { ArrowLeft, Search, Filter, Download, Eye, FileText, Image as ImageIcon, User, ArrowUpRight, X, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { getAllBills } from "./api/billApi";
import { getProducts } from "./api/productApi";
import BillReceipt from "./BillReceipt";
import EditBillModal from "./EditBillModal";
import "./BillList.css";

function BillList({ onBack }) {
    const [bills, setBills] = useState([]);
    const [filteredBills, setFilteredBills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedBill, setSelectedBill] = useState(null);

    useEffect(() => {
        loadBills();
    }, []);

    useEffect(() => {
        const safeBills = Array.isArray(bills) ? bills : [];
        if (!searchTerm) {
            setFilteredBills(safeBills);
        } else {
            const lower = searchTerm.toLowerCase();
            setFilteredBills(
                safeBills.filter(
                    (b) =>
                        b.billNumber?.toLowerCase().includes(lower) ||
                        b.customer?.name?.toLowerCase().includes(lower) ||
                        b.status?.toLowerCase().includes(lower)
                )
            );
        }
    }, [searchTerm, bills]);

    const loadBills = async () => {
        setLoading(true);
        try {
            const res = await getAllBills();
            const sortedBills = (res.data || []).sort((a, b) =>
                new Date(b.billDate || b.createdAt) - new Date(a.billDate || a.createdAt)
            );
            setBills(sortedBills);
            setFilteredBills(sortedBills);
        } catch (err) {
            console.error("Failed to load bills", err);
        } finally {
            setLoading(false);
        }
    };



    // Load products for receipt
    const [products, setProducts] = useState([]);
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const retailerId = sessionStorage.getItem("retailerId");
                const res = await getProducts(retailerId);
                setProducts(res.data || []);
            } catch (e) {
                console.error("Failed to load products for receipt:", e);
            }
        };
        fetchProducts();
    }, []);

    // Wait, I will use a cleaner approach. 
    // I will replace the imports FIRST.


    // Export to Excel (CSV)
    const handleExport = () => {
        const csvRows = [];
        // Headers
        csvRows.push(["Date", "Bill No", "Customer", "Items", "Amount", "Paid", "Due", "Mode", "Status"]);

        bills.forEach(bill => {
            const date = new Date(bill.billDate || bill.createdAt).toLocaleDateString();
            const customer = bill.customer ? bill.customer.name : "Walk-in";
            // Escape commas in items
            const items = `"${(bill.items || "").replace(/"/g, '""')}"`;

            csvRows.push([
                date,
                bill.billNumber,
                customer,
                items,
                bill.amount,
                bill.paidAmount,
                bill.dueAmount,
                bill.paymentMode,
                bill.status
            ]);
        });

        const csvContent = "data:text/csv;charset=utf-8," + csvRows.map(e => e.join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "bills_export.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const [editingBill, setEditingBill] = useState(null);

    return (
        <div className="bill-list-container fade-in">
            {/* Header Area */}
            <div className="glass-card bill-list-header">
                <div className="header-left">
                    <h2>📜 All Bills</h2>
                    <p className="text-muted">History of all transactions</p>
                </div>

                <div className="header-actions" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div className="search-box">
                        <Search className="search-icon" size={16} />
                        <input
                            type="text"
                            placeholder="Bill no, name or status..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && <X className="clear-search" size={16} onClick={() => setSearchTerm("")} />}
                    </div>

                    <button className="btn secondary icon-btn" onClick={handleExport} title="Export to CSV">
                        <Download size={18} />
                    </button>
                    <button className="btn ghost" onClick={onBack}>← Back</button>
                </div>
            </div>

            {/* Content */}
            {/* Content */}
            <div className="glass-card table-wrapper">
                <div className="table-container">
                    <table className="modern-table desktop-only">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Bill No</th>
                                <th>Customer</th>
                                <th>Items</th>
                                <th>Amount</th>
                                <th>Mode</th>
                                <th>Status</th>
                                <th>Receipt</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="9" style={{ textAlign: "center", padding: "20px" }}>Loading bills...</td>
                                </tr>
                            ) : filteredBills.length === 0 ? (
                                <tr>
                                    <td colSpan="9" style={{ textAlign: "center", padding: "40px" }}>
                                        <div className="empty-state" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                            <FileText size={48} opacity={0.2} />
                                            <p>No bills found</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredBills.map((bill) => (
                                    <tr key={bill.id}>
                                        <td>
                                            {new Date(bill.billDate || bill.createdAt).toLocaleDateString()}
                                            <div style={{ fontSize: '10px', color: '#94a3b8' }}>{new Date(bill.billDate || bill.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                        </td>
                                        <td className="font-mono">
                                            {bill.billNumber}
                                            {bill.billNumber?.startsWith('ORD-') && (
                                                <span className="status-pill pill-info" style={{ marginLeft: 8, fontSize: 10 }}>
                                                    🛒 ONLINE
                                                </span>
                                            )}
                                        </td>
                                        <td>
                                            {bill.customer ? (
                                                <div className="customer-cell">
                                                    <span>{bill.customer.name}</span>
                                                </div>
                                            ) : (
                                                <span className="status-pill" style={{ background: '#f1f5f9', color: '#64748b' }}>Walk-in</span>
                                            )}
                                        </td>
                                        <td className="truncate-cell" title={bill.items}>
                                            {bill.items && bill.items.length > 30 ? bill.items.substring(0, 30) + "..." : bill.items}
                                        </td>
                                        <td className="font-bold">₹{bill.amount}</td>
                                        <td>{bill.paymentMode}</td>
                                        <td>
                                            <span className={`status-pill ${bill.status === "PAID" ? "pill-success" :
                                                bill.status === "PARTIAL" ? "pill-warning" : "pill-danger"
                                                }`}>
                                                {bill.status}
                                            </span>
                                        </td>
                                        <td>
                                            <button className="icon-btn" title="View Receipt" onClick={() => setSelectedBill(bill)}>
                                                <Eye size={18} />
                                            </button>
                                        </td>
                                        <td>
                                            {bill.customer && (!bill.billNumber?.startsWith('ORD-') || bill.paymentMode === 'KHATHA') && (
                                                <button className="icon-btn" title="Edit Bill" onClick={() => setEditingBill(bill)}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                                        ✏️ Edit
                                                    </div>
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>

                    {/* ✅ MOBILE CARD VIEW */}
                    <div className="mobile-only">
                        {filteredBills.map(bill => (
                            <div className="mobile-card" key={bill.id}>
                                <div className="mobile-card-row">
                                    <span className="mobile-card-label">
                                        #{bill.billNumber}
                                        {bill.billNumber?.startsWith('ORD-') && (
                                            <span className="status-pill pill-info" style={{ marginLeft: 6, fontSize: 10 }}>
                                                🛒 ONLINE
                                            </span>
                                        )}
                                    </span>
                                    <span className="mobile-card-value">{new Date(bill.billDate || bill.createdAt).toLocaleDateString()} {new Date(bill.billDate || bill.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>

                                <div className="mobile-card-row">
                                    <span style={{ fontWeight: 'bold' }}>
                                        {bill.customer ? bill.customer.name : "Walk-in"}
                                    </span>
                                    <span style={{ fontWeight: 'bold' }}>₹{bill.amount}</span>
                                </div>

                                <div className="mobile-card-row">
                                    <span className="mobile-card-label">Status</span>
                                    <span className={`status-pill ${bill.status === "PAID" ? "pill-success" :
                                        bill.status === "PARTIAL" ? "pill-warning" : "pill-danger"
                                        }`} style={{ fontSize: '10px' }}>
                                        {bill.status}
                                    </span>
                                </div>

                                <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                                    <button
                                        className="btn-view"
                                        style={{ flex: 1, padding: '8px', fontSize: '12px' }}
                                        onClick={() => setSelectedBill(bill)}
                                    >
                                        View Bill
                                    </button>
                                    {bill.customer && (!bill.billNumber?.startsWith('ORD-') || bill.paymentMode === 'KHATHA') && (
                                        <button
                                            className="btn-view"
                                            style={{ flex: 1, padding: '8px', fontSize: '12px', background: '#f1f5f9', color: '#475569' }}
                                            onClick={() => setEditingBill(bill)}
                                        >
                                            Edit
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bill Modal */}
            {selectedBill && (
                <BillReceipt
                    bill={selectedBill}
                    products={products}
                    onClose={() => setSelectedBill(null)}
                />
            )}

            {/* Edit Modal */}
            {editingBill && (
                <EditBillModal
                    bill={editingBill}
                    onClose={() => setEditingBill(null)}
                    onUpdate={loadBills}
                />
            )}
        </div>
    );
}

export default BillList;
