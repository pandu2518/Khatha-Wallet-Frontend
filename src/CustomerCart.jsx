import { useState } from "react";
import axiosClient from "./api/axiosClient";
import { Plus, Minus, Trash2, ShoppingCart } from "lucide-react";
import { toast } from "react-toastify"; // ✅ Import react-toastify
import "./CustomerApp.css";

function CustomerCart({ cart, account, addToCart, removeFromCart, clearCart, onOrderPlaced }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [paymentMode, setPaymentMode] = useState("COD"); // ✅ Payment State

    const cartItems = Object.values(cart);
    const cartTotal = cartItems.reduce((sum, item) => sum + (item.price * item.qty), 0);

    const placeOrder = async () => {
        if (cartItems.length === 0) return;

        // 1. Group items by Retailer ID
        const ordersByRetailer = {};
        cartItems.forEach(item => {
            // Prioritize item.retailerId (newly exposed) or item.retailer.id
            const rId = item.retailerId || (item.retailer ? item.retailer.id : (account ? account.retailerId : null));
            if (!rId) return;

            if (!ordersByRetailer[rId]) {
                ordersByRetailer[rId] = {
                    retailerId: rId,
                    items: [],
                    total: 0
                };
            }

            ordersByRetailer[rId].items.push({
                barcode: item.barcode, // ✅ ADDED BARCODE
                name: item.name,
                qty: item.qty,
                price: item.price,
                total: item.price * item.qty,
                imageUrl: item.imageUrl // ✅ ADDED FOR PERSISTENCE
            });
            ordersByRetailer[rId].total += (item.price * item.qty);
        });

        try {
            setLoading(true);
            setError("");

            // 2. Send separate requests for each retailer
            console.log("DEBUG: Placing Orders", ordersByRetailer); // ✅ DEBUG LOG

            const promises = Object.values(ordersByRetailer).map(group => {
                const itemsJson = JSON.stringify(group.items);
                console.log("DEBUG: Sending Items JSON:", itemsJson); // ✅ DEBUG LOG

                return axiosClient.post("/orders/create", {
                    customerId: account.customerId,
                    retailerId: group.retailerId,
                    items: itemsJson, // ✅ USE THE JSON STRING
                    totalAmount: group.total,
                    paymentMode: paymentMode // ✅ Send Payment Mode
                });
            });

            await Promise.all(promises);

            setLoading(false);
            clearCart();
            toast.success(`Order placed successfully via ${paymentMode}!`); // ✅ Use toast.success
            onOrderPlaced();
        } catch (err) {
            const errorMsg = err.response?.data || err.message;
            console.error("Order failed details:", errorMsg); // ✅ MORE DETAILED LOGGING
            setError("Failed to place order: " + (typeof errorMsg === 'string' ? errorMsg : "Check console"));
            setLoading(false);
            toast.error("Order failed. Please try again.");
        }
    };

    if (cartItems.length === 0) {
        return (
            <div className="empty-state-premium fade-in">
                <div className="empty-icon-wrapper">
                    <ShoppingCart size={80} strokeWidth={1} />
                </div>
                <h3>Your cart is empty</h3>
                <p>Looks like you haven't added anything to your cart yet.</p>
                <button className="start-shopping-btn" onClick={() => onOrderPlaced && onOrderPlaced()}>
                    Start Shopping
                </button>
            </div>
        );
    }

    return (
        <div className="cart-container fade-in">
            <h3 className="section-title">Your Cart</h3>

            <div className="cart-items-list">
                {cartItems.map(item => (
                    <div key={item.barcode} className="cart-item-card">
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <div className="cart-item-img">
                                {item.imageUrl ? (
                                    <img src={item.imageUrl} alt={item.name} />
                                ) : (
                                    <span style={{ fontSize: '18px' }}>📦</span>
                                )}
                            </div>
                            <div className="item-info">
                                <h4>{item.name}</h4>
                                <p className="item-price-sub">₹ {item.price} per {item.unit || 'unit'}</p>
                            </div>
                        </div>

                        <div className="item-actions" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <div className="qty-control">
                                <button onClick={() => removeFromCart(item.barcode)}>
                                    <Minus size={14} />
                                </button>
                                <span>{item.qty}</span>
                                <button onClick={() => addToCart(item)}>
                                    <Plus size={14} />
                                </button>
                            </div>
                            <div className="item-total" style={{ fontWeight: 800, minWidth: '60px', textAlign: 'right' }}>
                                ₹ {item.price * item.qty}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bill-details">
                <h4 style={{ marginBottom: '15px', fontSize: '16px', fontWeight: 700 }}>Payment Method</h4>
                <div className="payment-tile-grid">
                    <div
                        className={`payment-tile ${paymentMode === "COD" ? 'active' : ''}`}
                        onClick={() => setPaymentMode("COD")}
                    >
                        <span style={{ fontSize: '24px' }}>💵</span>
                        <span>Cash on Delivery</span>
                    </div>
                    <div
                        className={`payment-tile ${paymentMode === "UPI" ? 'active' : ''}`}
                        onClick={() => setPaymentMode("UPI")}
                    >
                        <span style={{ fontSize: '24px' }}>📱</span>
                        <span>UPI Payment</span>
                    </div>
                    <div
                        className={`payment-tile ${paymentMode === "KHATHA" ? 'active' : ''}`}
                        onClick={() => setPaymentMode("KHATHA")}
                    >
                        <span style={{ fontSize: '24px' }}>📔</span>
                        <span>Pay on Khatha</span>
                    </div>
                </div>

                <div style={{ marginTop: '20px' }}>
                    <div className="bill-row">
                        <span>Item Total</span>
                        <span>₹ {cartTotal}</span>
                    </div>
                    <div className="bill-row">
                        <span>Delivery Fee</span>
                        <span style={{ color: '#00b259', fontWeight: 700 }}>FREE</span>
                    </div>
                    <div className="bill-row total">
                        <span>Grand Total</span>
                        <span>₹ {cartTotal}</span>
                    </div>
                </div>

                {error && <p className="error-text" style={{ color: '#ef4444', fontSize: '13px', marginTop: '10px' }}>{error}</p>}

                <button
                    className="checkout-btn"
                    onClick={placeOrder}
                    disabled={loading}
                >
                    {loading ? "Confirming Order..." : `Place Order • ₹${cartTotal}`}
                </button>
            </div>
        </div>
    );
}

export default CustomerCart;
