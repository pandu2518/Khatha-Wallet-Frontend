import { useState, useEffect } from "react";
import { Plus, Minus, Store, Grid, Tag, MapPin, ChevronLeft, ChevronRight, ShoppingBag } from "lucide-react";
import { toast } from "react-toastify";
import { getAllProducts } from "./api/productApi";
import "./CustomerApp.css";

// ✅ CATEGORY MAPPING (Icon + Label)
const CATEGORY_DATA = {
    "ALL": { label: "All Items", icon: "🛍️" },
    "FRUITS_VEGETABLES": { label: "Fruits & Veg", icon: "🥦" },
    "STAPLES_GRAINS": { label: "Staples", icon: "🌾" },
    "SPICES_MASALAS": { label: "Spices", icon: "🌶️" },
    "COOKING_OILS_GHEE": { label: "Oil & Ghee", icon: "🛢️" },
    "DAIRY_PRODUCTS": { label: "Dairy", icon: "🥛" },
    "BAKERY_BREAD": { label: "Bakery", icon: "🍞" },
    "SNACKS_PACKAGED": { label: "Snacks", icon: "🍪" },
    "BEVERAGES": { label: "Beverages", icon: "🥤" },
    "PERSONAL_CARE": { label: "Personal Care", icon: "🧼" },
    "HOUSEHOLD_CLEANING": { label: "Cleaning", icon: "🧹" },
    "BABY_CARE": { label: "Baby Care", icon: "👶" },
    "HEALTH_WELLNESS": { label: "Health", icon: "💊" },
    "PET_CARE": { label: "Pet Care", icon: "🐶" },
    "MEAT_FISH_EGGS": { label: "Meat & Eggs", icon: "🥚" },
    "READY_TO_EAT": { label: "Ready Foods", icon: "🍜" },
    "PAPER_DISPOSABLES": { label: "Disposables", icon: "🧻" },
    "SEASONAL_FESTIVAL": { label: "Seasonal", icon: "🎉" },
    "MISCELLANEOUS": { label: "Others", icon: "📦" }
};

function CustomerMarketplace({ products: propProducts, cart, addToCart, removeFromCart, isGlobal = false }) {
    const [products, setProducts] = useState(propProducts || []);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState("ALL"); // ✅ Category State
    const [userLocation, setUserLocation] = useState(null); // 🌍 Location State
    const [locationStatus, setLocationStatus] = useState("Detecting location...");

    useEffect(() => {
        if (isGlobal) {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        setUserLocation({
                            lat: position.coords.latitude,
                            lng: position.coords.longitude
                        });
                        setLocationStatus("Showing nearby products 📍");
                    },
                    (error) => {
                        setLocationStatus("Showing all products (Location denied)");
                        loadGlobalProducts(null);
                    }
                );
            } else {
                setLocationStatus("Geolocation not supported");
                loadGlobalProducts(null);
            }
        } else {
            setProducts(propProducts || []);
        }
    }, [isGlobal, propProducts]);

    useEffect(() => {
        if (isGlobal && userLocation) {
            loadGlobalProducts(userLocation);
        }
    }, [userLocation, isGlobal]);

    useEffect(() => {
        const safeProducts = Array.isArray(products) ? products : [];
        if (selectedCategory === "ALL") {
            setFilteredProducts(safeProducts);
        } else {
            setFilteredProducts(safeProducts.filter(p => p.category === selectedCategory));
        }
    }, [selectedCategory, products]);

    const loadGlobalProducts = async (location = null) => {
        try {
            setLoading(true);
            const res = await getAllProducts(location);
            const rawProducts = res.data || [];

            // 🔄 DE-DUPLICATE (Global Market can have duplicates across retailers/categories)
            const seen = new Map();
            rawProducts.forEach(p => {
                const key = (p.barcode || p.name).toLowerCase().trim();
                const existing = seen.get(key);
                // Priority: Keep if it has a specific category, MRP, or is the first found
                if (!existing || (existing.category === 'MISCELLANEOUS' && p.category !== 'MISCELLANEOUS')) {
                    seen.set(key, p);
                }
            });

            setProducts(Array.from(seen.values()));
        } catch (err) {
            console.error("Failed to load global products", err);
        } finally {
            setLoading(false);
        }
    };

    const [selectedProduct, setSelectedProduct] = useState(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const openProductModal = (product) => {
        setSelectedProduct(product);
        setCurrentImageIndex(0);
        document.body.style.overflow = 'hidden';
    };

    const closeProductModal = () => {
        setSelectedProduct(null);
        document.body.style.overflow = 'auto';
    };

    const getProductMockImages = (product) => {
        if (product.imageUrl) {
            return [
                <img src={product.imageUrl} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />,
                <div style={{ fontSize: '80px' }}>{CATEGORY_DATA[product.category]?.icon || "📦"}</div>,
                <div style={{ fontSize: '80px' }}>✨</div>
            ];
        }
        const icon = CATEGORY_DATA[product.category]?.icon || "📦";
        return [
            <div style={{ fontSize: '80px' }}>{icon}</div>,
            <div style={{ fontSize: '80px' }}>📸</div>,
            <div style={{ fontSize: '80px' }}>✨</div>
        ];
    };

    const nextImage = () => setCurrentImageIndex((prev) => (prev + 1) % 3);
    const prevImage = () => setCurrentImageIndex((prev) => (prev - 1 + 3) % 3);

    if (loading) return <div className="loader">Loading Market...</div>;

    const safeProducts = Array.isArray(products) ? products : [];

    return (
        <div className="customer-body">
            {/* 1. Category Bar */}
            <div className="category-scroll-container">
                <div className="category-list">
                    {Object.entries(CATEGORY_DATA).map(([key, data]) => (
                        <div
                            key={key}
                            className={`category-item ${selectedCategory === key ? 'active' : ''}`}
                            onClick={() => setSelectedCategory(key)}
                        >
                            <div className="cat-icon">{data.icon}</div>
                            <span className="cat-label">{data.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* 2. Section Header */}
            <div style={{ padding: '0 20px', marginBottom: '10px' }}>
                <h3 className="section-title">
                    {selectedCategory === "ALL" ? "All Products" : CATEGORY_DATA[selectedCategory].label}
                </h3>
            </div>

            {/* 3. Product Grid / Category Layout */}
            {filteredProducts.length === 0 ? (
                <div className="empty-state-premium fade-in">
                    <div className="empty-icon-wrapper">
                        <ShoppingBag size={80} strokeWidth={1} />
                    </div>
                    <h3>No products found</h3>
                    <p>Try a different category or check back later.</p>
                </div>
            ) : (
                <div className="product-grid">
                    {filteredProducts.map((product) => {
                        const price = product.currentPrice || product.price || product.sellingPrice;
                        const hasDiscount = product.mrp && product.mrp > price;
                        const discountPercent = hasDiscount ? Math.round(((product.mrp - price) / product.mrp) * 100) : 0;

                        return (
                            <div
                                key={product.barcode || product.id}
                                className="product-card fade-in"
                                onClick={() => openProductModal(product)}
                            >
                                <div className="product-img-wrapper">
                                    {hasDiscount && <div className="discount-tag">{discountPercent}% OFF</div>}
                                    {product.quantity <= 0 ? (
                                        <div className="stock-tag out">Out of Stock</div>
                                    ) : product.quantity <= 5 ? (
                                        <div className="stock-tag low">Only {product.quantity} Left</div>
                                    ) : null}
                                    {product.imageUrl ? (
                                        <img src={product.imageUrl} alt={product.name} className="product-img" />
                                    ) : (
                                        <div style={{ fontSize: '48px' }}>{CATEGORY_DATA[product.category]?.icon || "📦"}</div>
                                    )}
                                </div>
                                <div className="product-info">
                                    {isGlobal && product.retailerName && (
                                        <div className="retailer-tag">
                                            <Store size={10} style={{ marginRight: 4 }} />
                                            {product.retailerName}
                                        </div>
                                    )}
                                    <h4>{product.name}</h4>
                                    <p className="unit-label">
                                        {product.unit || (product.productType === 'WEIGHT' ? '1 kg' : product.productType === 'LIQUID' ? '1 L' : 'per unit')}
                                    </p>

                                    <div className="card-footer-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                                        <div className="price-wrapper">
                                            <p className="price">₹{price}</p>
                                            {hasDiscount && <p className="mrp-sub">₹{product.mrp}</p>}
                                        </div>

                                        {cart[product.barcode] ? (
                                            <div className="qty-control" onClick={(e) => e.stopPropagation()}>
                                                <button onClick={() => removeFromCart(product.barcode)}><Minus size={14} /></button>
                                                <span>{cart[product.barcode].qty}</span>
                                                <button onClick={() => addToCart(product)}><Plus size={14} /></button>
                                            </div>
                                        ) : (
                                            <button
                                                className={`add-btn ${product.quantity <= 0 ? 'disabled' : ''}`}
                                                disabled={product.quantity <= 0}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (product.quantity <= 0) return;
                                                    console.log("DEBUG: Adding to cart", { name: product.name, rId: product.retailerId });
                                                    addToCart(product);
                                                }}
                                            >
                                                {product.quantity <= 0 ? 'SOLD OUT' : 'ADD'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}


            {/* 4. Centered Detail Modal */}
            {selectedProduct && (
                <div className="modal-backdrop" onClick={closeProductModal}>
                    <div className="modal-content-sheet" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header-actions">
                            <button className="close-btn-ghost" onClick={closeProductModal}>
                                <ChevronLeft size={24} />
                            </button>
                            <div style={{ display: 'flex', gap: '15px', color: '#64748b' }}>
                                <Tag size={20} />
                                <MapPin size={20} />
                            </div>
                        </div>

                        <div className="modal-body-scroll">
                            <div className="product-detail-img-container">
                                <div className="carousel-track" style={{ transform: `translateX(-${currentImageIndex * 100}%)` }}>
                                    {getProductMockImages(selectedProduct).map((img, index) => (
                                        <div key={index} className="carousel-slide">{img}</div>
                                    ))}
                                </div>
                                <button className="carousel-btn left" onClick={(e) => { e.stopPropagation(); prevImage(); }}><ChevronLeft size={24} /></button>
                                <button className="carousel-btn right" onClick={(e) => { e.stopPropagation(); nextImage(); }}><ChevronRight size={24} /></button>
                                <div className="carousel-dots">
                                    {[0, 1, 2].map(i => (
                                        <span key={i} className={`dot ${currentImageIndex === i ? 'active' : ''}`} />
                                    ))}
                                </div>
                            </div>

                            <div className="product-detail-info">
                                <h2>{selectedProduct.name}</h2>
                                <p className="product-detail-unit">
                                    {selectedProduct.unit || (selectedProduct.productType === 'WEIGHT' ? '1 kg' : selectedProduct.productType === 'LIQUID' ? '1 L' : 'per unit')}
                                </p>

                                <div className="product-detail-price">
                                    <span className="current-price-lg">₹{selectedProduct.currentPrice || selectedProduct.price}</span>
                                    {selectedProduct.mrp && selectedProduct.mrp > (selectedProduct.currentPrice || selectedProduct.price) && (
                                        <>
                                            <span className="mrp-lg">₹{selectedProduct.mrp}</span>
                                            <span className="discount-badge-lg">
                                                {Math.round(((selectedProduct.mrp - (selectedProduct.currentPrice || selectedProduct.price)) / selectedProduct.mrp) * 100)}% OFF
                                            </span>
                                        </>
                                    )}
                                </div>

                                {selectedProduct.quantity <= 0 ? (
                                    <div className="stock-status-detail out">Temporarily Out of Stock</div>
                                ) : selectedProduct.quantity <= 5 ? (
                                    <div className="stock-status-detail low">Hurry! Only {selectedProduct.quantity} left in stock</div>
                                ) : null}

                                <div className="detail-section">
                                    <h4>Description</h4>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.6' }}>
                                        {selectedProduct.description || "No description available for this premium product."}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer-fixed">
                            {cart[selectedProduct.barcode] ? (
                                <div className="qty-control" style={{ height: '54px', padding: '0 24px', width: '100%', borderRadius: '16px' }}>
                                    <button onClick={() => removeFromCart(selectedProduct.barcode)}>
                                        <Minus size={24} />
                                    </button>
                                    <span style={{ fontSize: '20px', fontWeight: '800' }}>{cart[selectedProduct.barcode].qty}</span>
                                    <button onClick={() => addToCart(selectedProduct)}>
                                        <Plus size={24} />
                                    </button>
                                </div>
                            ) : (
                                <button
                                    className={`add-btn-large ${selectedProduct.quantity <= 0 ? 'disabled' : ''}`}
                                    disabled={selectedProduct.quantity <= 0}
                                    onClick={() => addToCart(selectedProduct)}
                                >
                                    {selectedProduct.quantity <= 0 ? 'ITEM OUT OF STOCK' : 'ADD TO CART'}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Quick Nav Section (Floating at bottom of backdrop) */}
                    {safeProducts.filter(p => p.category === selectedProduct.category && p.barcode !== selectedProduct.barcode).length > 0 && (
                        <div className="modal-quick-nav-container" onClick={(e) => e.stopPropagation()}>
                            <div className="quick-nav-header" style={{ padding: '0 20px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    More in {CATEGORY_DATA[selectedProduct.category]?.label || 'Related'}
                                </span>
                            </div>
                            <div className="quick-nav-scroll">
                                {safeProducts
                                    .filter(p => p.category === selectedProduct.category && p.barcode !== selectedProduct.barcode)
                                    .slice(0, 15)
                                    .map((p) => (
                                        <div
                                            key={p.barcode}
                                            className="quick-nav-item related"
                                            onClick={() => openProductModal(p)}
                                        >
                                            <div className="quick-nav-img-circle">
                                                {p.imageUrl ? (
                                                    <img src={p.imageUrl} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                                ) : (
                                                    <span style={{ fontSize: '32px' }}>{CATEGORY_DATA[p.category]?.icon || "📦"}</span>
                                                )}
                                            </div>
                                            <span className="quick-nav-price" style={{ background: 'rgba(0,0,0,0.5)', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: '800', marginTop: '-10px', zIndex: 1 }}>₹{p.currentPrice || p.price}</span>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default CustomerMarketplace;

