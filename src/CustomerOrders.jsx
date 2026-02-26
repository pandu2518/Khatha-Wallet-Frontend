import { useState } from "react";
import { Clock, CheckCircle, Package, XCircle, X } from "lucide-react";
import axiosClient from "./api/axiosClient";
import { toast } from "react-toastify";
import "./CustomerApp.css";

function CustomerOrders({ orders, onRefresh }) {
    const [loading, setLoading] = useState(false);

    const cancelOrder = async (orderId) => {
        if (!window.confirm("Are you sure you want to cancel this order?")) return;

        try {
            setLoading(true);
            await axiosClient.put(`/orders/${orderId}/status`, null, {
                params: { status: "CANCELLED" }
            });
            toast.success("Order cancelled successfully");
            if (onRefresh) onRefresh();
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data || "Failed to cancel order");
        } finally {
            setLoading(false);
        }
    };

    if (!orders || orders.length === 0) {
        return (
            <div className="empty-state">
                <h3>No orders yet 📦</h3>
                <p>Place your first order from the Shop!</p>
            </div>
        );
    }

    return (
        <div className="orders-container">
            <h3 className="section-title">My Orders</h3>

            <div className="orders-list">
                {[...orders].sort((a, b) => new Date(b.orderDate || b.createdAt) - new Date(a.orderDate || a.createdAt)).map(order => {
                    const items = order.items ? JSON.parse(order.items) : [];
                    return (
                        <div key={order.id} className="order-card-detailed fade-in">
                            <div className="order-header-row">
                                <div className="order-id">
                                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#999', display: 'block', marginBottom: '2px' }}>Order ID</span>
                                    <span style={{ fontSize: '15px', fontWeight: 800 }}>#{order.id}</span>
                                    {order.retailerName && (
                                        <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <span style={{ fontSize: '13px', fontWeight: 600, color: '#4f46e5' }}>🏬 {order.retailerName}</span>
                                        </div>
                                    )}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
                                    <OrderStatusBadge status={order.status} />
                                    {order.status === "PENDING" && (
                                        <button
                                            className="cancel-btn"
                                            style={{
                                                padding: '6px 12px',
                                                fontSize: '11px',
                                                fontWeight: 700,
                                                background: '#fff',
                                                color: '#ef4444',
                                                border: '1px solid #fee2e2',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                transition: '0.2s'
                                            }}
                                            onClick={() => cancelOrder(order.id)}
                                            disabled={loading}
                                        >
                                            Cancel Order
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="order-items-preview" style={{ padding: '4px 0 12px' }}>
                                {items.map((item, idx) => (
                                    <div key={idx} className="order-item-line" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', marginBottom: '8px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{ width: '24px', height: '24px', background: '#f8fafc', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                                {item.imageUrl ? (
                                                    <img src={item.imageUrl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                                ) : (
                                                    <span style={{ fontSize: '12px' }}>📦</span>
                                                )}
                                            </div>
                                            <span style={{ fontWeight: 500, color: '#444' }}>{item.qty} x {item.name}</span>
                                        </div>
                                        <span style={{ fontWeight: 700 }}>₹{item.total}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="order-footer" style={{ borderTop: '1px solid #f5f5f5', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontSize: '11px', color: '#aaa', fontWeight: 600 }}>ORDER PLACED ON</span>
                                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#666' }}>
                                        {new Date(order.orderDate || order.createdAt).toLocaleDateString()} at {new Date(order.orderDate || order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <span style={{ fontSize: '11px', color: '#aaa', fontWeight: 600, display: 'block' }}>TOTAL AMOUNT</span>
                                    <span style={{ fontSize: '18px', fontWeight: 900, color: '#1a1a1a' }}>₹{order.totalAmount}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function OrderStatusBadge({ status }) {
    const config = {
        PENDING: { icon: Clock, color: "orange", bg: "#fff7ed" },
        PACKED: { icon: Package, color: "blue", bg: "#eff6ff" },
        COMPLETED: { icon: CheckCircle, color: "green", bg: "#f0fdf4" },
        DELIVERED: { icon: CheckCircle, color: "green", bg: "#f0fdf4" },
        CANCELLED: { icon: XCircle, color: "red", bg: "#fef2f2" }
    };

    const { icon: Icon, color, bg } = config[status] || config.PENDING;

    return (
        <span className="status-badge" style={{ color, background: bg }}>
            <Icon size={14} />
            {status}
        </span>
    );
}

export default CustomerOrders;
