import { useState, useContext, useEffect, useMemo, useCallback, useRef } from "react";
import { Icon } from "@iconify/react";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext.jsx";
import NavigationBar from "../../components/NavigationBar";
import Modal from "../../components/Modal";
import supabase from "../../SupabaseClient";
import { computeCheckoutSummary } from "../../utils/checkout.js";

function Checkout() {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();
    const { cartItems = [] } = location.state || {};

    const [loading, setLoading] = useState(false);
    const [profileLoading, setProfileLoading] = useState(true);
    const [userProfile, setUserProfile] = useState(null);
    const [orderPlaced, setOrderPlaced] = useState(false);
    const [createdOrderId, setCreatedOrderId] = useState("");

    // Bottom sentinel visibility for mobile floating bar
    const [isBottomVisible, setIsBottomVisible] = useState(false);
    const bottomSubmitRef = useRef(null);

    // Real-time product monitoring state
    const [hasLiveProductIssue, setHasLiveProductIssue] = useState(false);
    const [liveProductMessage, setLiveProductMessage] = useState("");
    const [hasShownLiveProductModal, setHasShownLiveProductModal] = useState(false);

    // Delivery capacity tracking state
    const [farmersAtCapacity, setFarmersAtCapacity] = useState([]);
    const [deliveryCapacityLoading, setDeliveryCapacityLoading] = useState(true);

    // Modal state
    const [modal, setModal] = useState({
        open: false,
        type: "info",
        title: "",
        message: "",
        onConfirm: () => setModal((prev) => ({ ...prev, open: false })),
    });

    const [currentCartItems, setCurrentCartItems] = useState(() =>
        (cartItems || []).map((item) => ({
            ...item,
            farmerName: item.farmerName || "Unknown Farmer",
            farmerId: item.farmerId || `farmer_${item.id}`,
            farmerAddress: item.farmerAddress || "Location not available",
            minimumOrderQuantity: Number(item.minimumOrderQuantity) || 1.0,
            deliveryCost: Number(item.deliveryCost) || 50,
        }))
    );

    const [formData, setFormData] = useState({
        deliveryMethod: "pickup", // "delivery" or "pickup"
        paymentMethod: "cod",
        notes: "",
    });

    const showModal = useCallback((type, title, message, onConfirm = null) => {
        setModal({
            open: true,
            type,
            title,
            message,
            onConfirm: onConfirm || (() => setModal((prev) => ({ ...prev, open: false }))),
        });
    }, []);

    // Derived checkout breakdown
    const summary = useMemo(() => {
        return computeCheckoutSummary(currentCartItems, formData.deliveryMethod);
    }, [currentCartItems, formData.deliveryMethod]);

    const isHomeDeliveryAvailable = farmersAtCapacity.length === 0;

    // Cart item mutations
    const removeItemFromCart = (itemId) => {
        setCurrentCartItems((prev) => prev.filter((item) => item.id !== itemId));
    };

    const updateItemQuantity = (itemId, newQuantity) => {
        setCurrentCartItems((prev) =>
            prev.map((item) =>
                item.id === itemId
                    ? { ...item, quantity: Math.max(0.1, newQuantity) }
                    : item
            )
        );
    };

    const autoAdjustQuantityForDelivery = (itemId, farmerId) => {
        const farmerGroup = summary.farmerGroups.find((f) => f.farmerId === farmerId);
        if (!farmerGroup) return;

        const shortage = farmerGroup.minimumOrderQuantity - farmerGroup.totalQuantity;
        if (shortage <= 0) return;

        const targetItem = farmerGroup.items.find((item) => item.id === itemId);
        if (targetItem) {
            const newQuantity = Math.min(
                targetItem.quantity + shortage,
                targetItem.stock || 999
            );
            updateItemQuantity(itemId, newQuantity);
        }
    };

    // Watch scroll position & in-page bottom submit button to hide mobile floating bar when user reaches bottom of page
    useEffect(() => {
        if (profileLoading || !currentCartItems.length) return;

        const handleScroll = () => {
            const scrollBottom = window.innerHeight + window.scrollY;
            const totalHeight = document.documentElement.scrollHeight;
            // Within 200px of page bottom means user reached bottom summary/submit area
            const atBottom = scrollBottom >= totalHeight - 200;
            setIsBottomVisible((prev) => (prev !== atBottom ? atBottom : prev));
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        handleScroll();

        let observer = null;
        const el = bottomSubmitRef.current;
        if (el) {
            observer = new IntersectionObserver(
                ([entry]) => {
                    if (entry.isIntersecting) {
                        setIsBottomVisible(true);
                    }
                },
                { root: null, threshold: 0.1 }
            );
            observer.observe(el);
        }

        return () => {
            window.removeEventListener("scroll", handleScroll);
            if (observer) observer.disconnect();
        };
    }, [profileLoading, currentCartItems.length]);

    // 1. Fetch user profile and verify completeness
    useEffect(() => {
        const fetchUserProfile = async () => {
            if (!user) {
                setProfileLoading(false);
                navigate("/login");
                return;
            }

            try {
                const { data, error } = await supabase
                    .from("profiles")
                    .select("name, contact, address")
                    .eq("id", user.id)
                    .single();

                if (error) throw error;

                if (data) {
                    const isProfileComplete = data.name && data.contact && data.address;
                    if (!isProfileComplete) {
                        showModal(
                            "warning",
                            "Profile Incomplete",
                            "Please complete your profile details (name, contact, and address) before placing an order.",
                            () => {
                                setModal((p) => ({ ...p, open: false }));
                                navigate("/profile");
                            }
                        );
                        return;
                    }
                    setUserProfile(data);
                }
            } catch (err) {
                console.error("Error fetching profile:", err);
                showModal(
                    "error",
                    "Profile Error",
                    "Unable to load profile data. Please try again.",
                    () => {
                        setModal((p) => ({ ...p, open: false }));
                        navigate("/profile");
                    }
                );
            } finally {
                setProfileLoading(false);
            }
        };

        fetchUserProfile();
    }, [user, navigate, showModal]);

    // 2. Validate cart items against fresh database state on mount
    useEffect(() => {
        if (!currentCartItems.length || orderPlaced || !user) return;

        const validateCartItemsAgainstDatabase = async () => {
            try {
                const productIds = Array.from(new Set(currentCartItems.map((item) => item.id)));
                if (!productIds.length) return;

                const { data: freshProducts, error } = await supabase
                    .from("products")
                    .select("id, stock, price, status_id, approval_date")
                    .in("id", productIds);

                if (error || !freshProducts) return;

                const productMap = Object.fromEntries(freshProducts.map((p) => [p.id, p]));

                const updated = currentCartItems.map((item) => {
                    const fresh = productMap[item.id];
                    if (!fresh) return item;
                    return {
                        ...item,
                        stock: parseFloat(fresh.stock) || 0,
                        price: parseFloat(fresh.price),
                        products: {
                            ...(item.products || {}),
                            status_id: fresh.status_id,
                            approval_date: fresh.approval_date,
                        },
                    };
                });

                const anyInvalid = updated.some((item) => {
                    if (item.quantity > item.stock) return true;
                    const isSuspended = item.products?.status_id === 2;
                    const approvalDate = item.products?.approval_date
                        ? new Date(item.products.approval_date).toISOString()
                        : null;
                    const isNotApproved = !approvalDate || approvalDate.startsWith("1970-01-01");
                    return isSuspended || isNotApproved;
                });

                setCurrentCartItems(updated);

                if (anyInvalid && !hasLiveProductIssue) {
                    setHasLiveProductIssue(true);
                    setLiveProductMessage(
                        "Some produce items had stock or pricing changes. Please review your order."
                    );
                    if (!hasShownLiveProductModal) {
                        setHasShownLiveProductModal(true);
                        showModal(
                            "warning",
                            "Order Review Needed",
                            "Produce stock, price, or availability was updated by the farmer. Please review your order before confirming."
                        );
                    }
                }
            } catch (err) {
                console.error("Cart validation error:", err);
            }
        };

        validateCartItemsAgainstDatabase();
    }, [user, orderPlaced, showModal]);

    // 3. Real-time product inventory monitoring
    useEffect(() => {
        if (!currentCartItems.length || orderPlaced) return;

        const productIds = Array.from(new Set(currentCartItems.map((item) => item.id)));
        if (!productIds.length) return;

        const channel = supabase
            .channel("checkout-products-monitor")
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "products",
                    filter: `id=in.(${productIds.join(",")})`,
                },
                (payload) => {
                    const row = payload.new;
                    setCurrentCartItems((prev) => {
                        const updated = prev.map((item) => {
                            if (item.id !== row.id) return item;
                            return {
                                ...item,
                                price: parseFloat(row.price),
                                stock: parseFloat(row.stock) || 0,
                                products: {
                                    ...(item.products || {}),
                                    status_id: row.status_id,
                                    approval_date: row.approval_date,
                                },
                            };
                        });

                        const anyInvalid = updated.some((it) => it.quantity > it.stock);
                        if (anyInvalid && !hasLiveProductIssue) {
                            setHasLiveProductIssue(true);
                            setLiveProductMessage(
                                "An item in your order now exceeds available harvest stock."
                            );
                        } else if (!anyInvalid && hasLiveProductIssue) {
                            setHasLiveProductIssue(false);
                            setLiveProductMessage("");
                        }
                        return updated;
                    });
                }
            )
            .on(
                "postgres_changes",
                {
                    event: "DELETE",
                    schema: "public",
                    table: "products",
                },
                (payload) => {
                    const deletedId = payload.old.id;
                    if (currentCartItems.some((it) => it.id === deletedId)) {
                        setHasLiveProductIssue(true);
                        setLiveProductMessage("A listed item was discontinued by the producer.");
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [currentCartItems, orderPlaced, hasLiveProductIssue]);

    // 4. Daily Delivery Capacity Check
    useEffect(() => {
        if (!currentCartItems.length || orderPlaced) return;

        let channel = null;

        const fetchDeliveryCapacity = async () => {
            try {
                const farmerIds = Array.from(
                    new Set(
                        currentCartItems
                            .map((it) => it.farmerId)
                            .filter((id) => id && !String(id).startsWith("farmer_"))
                    )
                );

                if (!farmerIds.length) {
                    setFarmersAtCapacity([]);
                    setDeliveryCapacityLoading(false);
                    return;
                }

                setDeliveryCapacityLoading(true);

                const { data: profiles, error: profileErr } = await supabase
                    .from("profiles")
                    .select("id, name, daily_delivery_limit")
                    .in("id", farmerIds);

                if (profileErr) throw profileErr;

                const today = new Date();
                const startOfToday = new Date(
                    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 0, 0, 0)
                ).toISOString();
                const endOfToday = new Date(
                    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 23, 59, 59, 999)
                ).toISOString();

                const { data: todayOrders, error: ordersErr } = await supabase
                    .from("orders")
                    .select("seller_id")
                    .in("seller_id", farmerIds)
                    .eq("delivery_method_id", 2)
                    .neq("status_id", 8)
                    .gte("created_at", startOfToday)
                    .lte("created_at", endOfToday);

                if (ordersErr) throw ordersErr;

                const counts = {};
                farmerIds.forEach((id) => (counts[id] = 0));
                todayOrders.forEach((o) => {
                    counts[o.seller_id] = (counts[o.seller_id] || 0) + 1;
                });

                const atCapacity = (profiles || [])
                    .filter((farmer) => {
                        const limit = parseInt(farmer.daily_delivery_limit ?? 3);
                        const current = counts[farmer.id] || 0;
                        return limit === 0 || current >= limit;
                    })
                    .map((f) => ({ id: f.id, name: f.name }));

                setFarmersAtCapacity(atCapacity);

                if (atCapacity.length > 0 && formData.deliveryMethod === "delivery") {
                    setFormData((p) => ({ ...p, deliveryMethod: "pickup" }));
                }
            } catch (err) {
                console.error("Error fetching delivery capacity:", err);
            } finally {
                setDeliveryCapacityLoading(false);
            }
        };

        fetchDeliveryCapacity();

        const validIds = Array.from(
            new Set(
                currentCartItems
                    .map((it) => it.farmerId)
                    .filter((id) => id && !String(id).startsWith("farmer_"))
            )
        );

        if (validIds.length > 0) {
            channel = supabase
                .channel("checkout-capacity-realtime")
                .on(
                    "postgres_changes",
                    {
                        event: "UPDATE",
                        schema: "public",
                        table: "profiles",
                        filter: `id=in.(${validIds.join(",")})`,
                    },
                    () => fetchDeliveryCapacity()
                )
                .on(
                    "postgres_changes",
                    {
                        event: "*",
                        schema: "public",
                        table: "orders",
                        filter: `seller_id=in.(${validIds.join(",")})`,
                    },
                    () => fetchDeliveryCapacity()
                )
                .subscribe();
        }

        return () => {
            if (channel) supabase.removeChannel(channel);
        };
    }, [currentCartItems, orderPlaced, formData.deliveryMethod]);

    // 5. Submit Order
    const handleSubmit = async (e) => {
        if (e) e.preventDefault();

        if (!currentCartItems.length) {
            showModal("warning", "Cart is Empty", "No items to checkout", () => {
                setModal((p) => ({ ...p, open: false }));
                navigate("/cart");
            });
            return;
        }

        if (formData.deliveryMethod === "delivery" && !summary.isEligible) {
            showModal(
                "warning",
                "Delivery Requirements",
                "Some producers require a minimum order volume for direct delivery. Please add more harvest weight or switch to Farm Pickup."
            );
            return;
        }

        setLoading(true);

        try {
            const createdOrderIds = [];

            for (const farmerGroup of summary.farmerGroups) {
                const deliveryFee =
                    formData.deliveryMethod === "delivery"
                        ? parseFloat(farmerGroup.deliveryCost || 0)
                        : 0;

                const orderData = {
                    user_id: user.id,
                    seller_id: farmerGroup.farmerId,
                    delivery_method_id: formData.deliveryMethod === "delivery" ? 2 : 1,
                    payment_method_id: formData.paymentMethod === "cod" ? 1 : 2,
                    status_id: 3, // Pending
                    delivery_fee_at_order: deliveryFee,
                };

                const { data: orderResult, error: orderErr } = await supabase
                    .from("orders")
                    .insert(orderData)
                    .select()
                    .single();

                if (orderErr) throw orderErr;

                const orderId = orderResult.id;

                const orderItems = farmerGroup.items.map((item) => ({
                    order_id: orderId,
                    product_id: item.id,
                    name_at_purchase: item.name,
                    quantity: item.quantity,
                    price_at_purchase: item.price,
                }));

                const { error: itemsErr } = await supabase.from("order_items").insert(orderItems);
                if (itemsErr) {
                    await supabase.from("orders").delete().eq("id", orderId);
                    throw itemsErr;
                }

                createdOrderIds.push(orderId);
            }

            // Remove purchased items from cart_items
            const sentCartItemIds = currentCartItems
                .filter((it) => (it.quantity || 0) > 0)
                .map((it) => it.cartItemId)
                .filter(Boolean);

            if (sentCartItemIds.length > 0) {
                await supabase.from("cart_items").delete().in("id", sentCartItemIds);
            }

            // Decrement product inventory
            for (const item of currentCartItems) {
                const { data: prod } = await supabase
                    .from("products")
                    .select("stock")
                    .eq("id", item.id)
                    .single();

                if (prod) {
                    const newStock = Math.max(0, (prod.stock || 0) - item.quantity);
                    await supabase.from("products").update({ stock: newStock }).eq("id", item.id);
                }
            }

            setCreatedOrderId(
                createdOrderIds.length > 1
                    ? `ORD-${createdOrderIds.join(", ")}`
                    : `ORD-${createdOrderIds[0]}`
            );
            setOrderPlaced(true);
        } catch (err) {
            console.error("Order submission error:", err);
            showModal("error", "Order Failed", err.message || "Failed to place order. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // -------------------------------------------------------------
    // RENDER: Loading State
    // -------------------------------------------------------------
    if (profileLoading) {
        return (
            <div className="min-h-screen bg-slate-50/50 flex flex-col justify-between md:pt-16">
                <NavigationBar />
                <div className="flex-1 flex flex-col items-center justify-center p-8">
                    <div className="w-10 h-10 border-2 border-emerald-700 border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="text-sm font-medium text-slate-600">Verifying customer profile…</p>
                </div>
            </div>
        );
    }

    // -------------------------------------------------------------
    // RENDER: Order Success Screen
    // -------------------------------------------------------------
    if (orderPlaced) {
        return (
            <div className="min-h-screen bg-slate-50/50 flex flex-col justify-between md:pt-16">
                <NavigationBar />
                <div className="flex-1 flex items-center justify-center p-4 py-12">
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8 max-w-lg w-full text-center">
                        <div className="w-16 h-16 bg-emerald-50 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100">
                            <Icon icon="mingcute:check-circle-fill" className="w-8 h-8" />
                        </div>
                        <span className="inline-block text-xs font-semibold uppercase tracking-wider text-emerald-800 bg-emerald-100/60 px-3 py-1 rounded-full mb-2">
                            Order Confirmed
                        </span>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">
                            Order Placed Successfully!
                        </h1>
                        <p className="text-sm text-slate-600 mb-6 max-w-prose mx-auto">
                            Your order reference is{" "}
                            <span className="font-semibold text-slate-900 tabular-nums">
                                {createdOrderId}
                            </span>
                            . The producer has been notified and will prepare your fresh harvest.
                        </p>

                        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 text-left space-y-2 mb-6">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Total Paid</span>
                                <span className="font-semibold text-slate-900 tabular-nums">
                                    ₱{summary.finalTotal.toFixed(2)}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Fulfillment</span>
                                <span className="font-medium text-slate-800">
                                    {formData.deliveryMethod === "delivery" ? "Home Delivery" : "Farm Pickup"}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Payment</span>
                                <span className="font-medium text-slate-800">
                                    {formData.paymentMethod === "cod" ? "Cash on Hand" : "Online Payment"}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <button
                                onClick={() => navigate("/orders")}
                                className="w-full min-h-[44px] py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-sm rounded-xl transition duration-150 active:scale-[0.98]"
                            >
                                View My Orders
                            </button>
                            <button
                                onClick={() => navigate("/")}
                                className="w-full min-h-[44px] py-2.5 px-4 border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium text-sm rounded-xl transition duration-150 active:scale-[0.98]"
                            >
                                Continue Shopping
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // -------------------------------------------------------------
    // RENDER: Empty Cart Fallback
    // -------------------------------------------------------------
    if (!currentCartItems.length) {
        return (
            <div className="min-h-screen bg-slate-50/50 flex flex-col justify-between md:pt-16">
                <NavigationBar />
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-4">
                        <Icon icon="mingcute:shopping-cart-1-line" className="w-8 h-8" />
                    </div>
                    <h2 className="text-lg font-bold text-slate-900 mb-1">Your cart is empty</h2>
                    <p className="text-sm text-slate-600 mb-6 max-w-prose">
                        Add farm-fresh produce from local producers before proceeding to checkout.
                    </p>
                    <button
                        onClick={() => navigate("/cart")}
                        className="min-h-[44px] px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-sm rounded-xl transition duration-150 active:scale-[0.98]"
                    >
                        Back to Cart
                    </button>
                </div>
            </div>
        );
    }

    // -------------------------------------------------------------
    // RENDER: Main Checkout Flow
    // -------------------------------------------------------------
    const isCheckoutAllowed =
        summary.isEligible &&
        !hasLiveProductIssue &&
        currentCartItems.length > 0 &&
        !loading;

    return (
        <div className="min-h-screen bg-slate-50/50 text-slate-900 flex flex-col justify-between md:pt-16">
            {/* Standard Modal Render */}
            <Modal
                open={modal.open}
                onClose={modal.onConfirm}
                type={modal.type}
                title={modal.title}
                message={modal.message}
            />

            <NavigationBar />

            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-36 md:pb-12">
                {/* Header breadcrumb & back link */}
                <div className="flex items-center gap-3 mb-6">
                    <button
                        onClick={() => navigate("/cart")}
                        className="w-11 h-11 flex items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition duration-150 active:scale-[0.97]"
                        aria-label="Back to Cart"
                    >
                        <Icon icon="mingcute:arrow-left-line" className="w-5 h-5" />
                    </button>
                    <div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                            <span onClick={() => navigate("/cart")} className="cursor-pointer hover:underline">
                                Cart
                            </span>
                            <span>/</span>
                            <span className="text-slate-900">Checkout</span>
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Checkout</h1>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* LEFT COLUMN: Shipping, Delivery & Payment Options */}
                    <div className="lg:col-span-7 space-y-6">
                        {/* 1. Fulfillment Method Selection */}
                        <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm">
                            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 mb-4">
                                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                                    <Icon icon="mingcute:truck-line" className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-base font-semibold text-slate-900">Delivery Method</h2>
                                    <p className="text-xs text-slate-500">Choose pickup or direct delivery</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {/* Pickup Option */}
                                <label
                                    className={`flex items-start gap-3.5 p-4 rounded-xl border transition duration-150 cursor-pointer ${
                                        formData.deliveryMethod === "pickup"
                                            ? "border-emerald-600 bg-emerald-50/30 ring-1 ring-emerald-600"
                                            : "border-slate-200 hover:border-slate-300 bg-white"
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="deliveryMethod"
                                        value="pickup"
                                        checked={formData.deliveryMethod === "pickup"}
                                        onChange={() => setFormData((p) => ({ ...p, deliveryMethod: "pickup" }))}
                                        className="mt-1 text-emerald-700 focus:ring-emerald-700"
                                    />
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <span className="font-semibold text-slate-900 text-sm">Farm Pickup</span>
                                            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                                                Free
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-600 mt-1 max-w-prose">
                                            Pick up directly from the farm at your convenience. No minimum order volume required.
                                        </p>
                                    </div>
                                </label>

                                {/* Delivery Option */}
                                <label
                                    className={`flex items-start gap-3.5 p-4 rounded-xl border transition duration-150 ${
                                        !isHomeDeliveryAvailable
                                            ? "opacity-60 bg-slate-50 border-slate-200 cursor-not-allowed"
                                            : formData.deliveryMethod === "delivery"
                                            ? "border-emerald-600 bg-emerald-50/30 ring-1 ring-emerald-600 cursor-pointer"
                                            : "border-slate-200 hover:border-slate-300 bg-white cursor-pointer"
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="deliveryMethod"
                                        value="delivery"
                                        checked={formData.deliveryMethod === "delivery"}
                                        onChange={() => {
                                            if (isHomeDeliveryAvailable) {
                                                setFormData((p) => ({ ...p, deliveryMethod: "delivery" }));
                                            }
                                        }}
                                        disabled={!isHomeDeliveryAvailable}
                                        className="mt-1 text-emerald-700 focus:ring-emerald-700"
                                    />
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <span className="font-semibold text-slate-900 text-sm">Home Delivery</span>
                                            {isHomeDeliveryAvailable && (
                                                <span className="text-xs font-semibold text-slate-800 tabular-nums">
                                                    +₱{summary.farmerGroups.reduce((acc, f) => acc + (f.deliveryCost || 0), 0).toFixed(2)}
                                                </span>
                                            )}
                                        </div>

                                        {!isHomeDeliveryAvailable ? (
                                            <p className="text-xs font-medium text-amber-700 mt-1">
                                                Unavailable today:{" "}
                                                {farmersAtCapacity.map((f) => f.name).join(", ")}{" "}
                                                reached maximum daily delivery limit.
                                            </p>
                                        ) : (
                                            <p className="text-xs text-slate-600 mt-1 max-w-prose">
                                                Delivered straight to your doorstep across Iligan City.
                                            </p>
                                        )}
                                    </div>
                                </label>
                            </div>
                        </section>

                        {/* 2. Destination / Pickup Details */}
                        {formData.deliveryMethod === "delivery" ? (
                            <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm">
                                <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                                            <Icon icon="mingcute:location-line" className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h2 className="text-base font-semibold text-slate-900">Delivery Address</h2>
                                            <p className="text-xs text-slate-500">From your verified customer profile</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => navigate("/profile")}
                                        className="text-xs font-medium text-emerald-700 hover:text-emerald-800 hover:underline min-h-[44px] flex items-center"
                                    >
                                        Edit in Profile
                                    </button>
                                </div>

                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-sm text-slate-900">
                                            {userProfile?.name}
                                        </span>
                                        <span className="text-xs text-slate-500 tabular-nums">
                                            ({userProfile?.contact})
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-700 leading-relaxed max-w-prose">
                                        {userProfile?.address}
                                    </p>
                                </div>
                            </section>
                        ) : (
                            <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm">
                                <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 mb-4">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                                        <Icon icon="mingcute:time-line" className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-semibold text-slate-900">Farm Pickup Schedule</h2>
                                        <p className="text-xs text-slate-500">Pickup hours and instructions</p>
                                    </div>
                                </div>

                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 space-y-2">
                                    <p className="font-medium text-slate-900">
                                        Operating Hours: Mon–Sat, 7:00 AM – 5:00 PM
                                    </p>
                                    <p className="max-w-prose">
                                        You will receive direct contact details and farm coordinates upon order confirmation.
                                        Please present your Order Reference upon claiming.
                                    </p>
                                </div>
                            </section>
                        )}

                        {/* 3. Payment Method */}
                        <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm">
                            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 mb-4">
                                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                                    <Icon icon="mingcute:wallet-3-line" className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-base font-semibold text-slate-900">Payment Method</h2>
                                    <p className="text-xs text-slate-500">Select payment preference</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="flex items-center justify-between p-4 rounded-xl border border-emerald-600 bg-emerald-50/30 ring-1 ring-emerald-600 cursor-pointer">
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            value="cod"
                                            checked={formData.paymentMethod === "cod"}
                                            onChange={() => setFormData((p) => ({ ...p, paymentMethod: "cod" }))}
                                            className="text-emerald-700 focus:ring-emerald-700"
                                        />
                                        <div>
                                            <span className="font-semibold text-slate-900 text-sm">
                                                {formData.deliveryMethod === "delivery"
                                                    ? "Cash on Delivery (COD)"
                                                    : "Cash on Pickup"}
                                            </span>
                                            <p className="text-xs text-slate-600 mt-0.5">
                                                Pay upon receiving your fresh produce
                                            </p>
                                        </div>
                                    </div>
                                    <Icon icon="mingcute:cash-line" className="w-6 h-6 text-emerald-700" />
                                </label>

                                <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/60 opacity-60 cursor-not-allowed">
                                    <div className="flex items-center gap-3">
                                        <input type="radio" disabled className="text-slate-400" />
                                        <div>
                                            <span className="font-semibold text-slate-700 text-sm">
                                                Online Transfer (GCash / Maya)
                                            </span>
                                            <p className="text-xs text-slate-500 mt-0.5">Automated gateway coming soon</p>
                                        </div>
                                    </div>
                                    <span className="text-[11px] font-medium tracking-wider uppercase bg-slate-200/80 text-slate-600 px-2 py-0.5 rounded">
                                        Soon
                                    </span>
                                </div>
                            </div>
                        </section>

                        {/* 4. Order Notes */}
                        <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm">
                            <label htmlFor="notes" className="block text-sm font-semibold text-slate-900 mb-1">
                                Delivery Notes (Optional)
                            </label>
                            <p className="text-xs text-slate-500 mb-3 max-w-prose">
                                Add any gate directions, landmarks, or special instructions for the producer.
                            </p>
                            <textarea
                                id="notes"
                                name="notes"
                                rows="3"
                                value={formData.notes}
                                onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))}
                                placeholder="e.g. Leave by the front gate, contact upon arrival…"
                                className="w-full text-sm border border-slate-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-700 max-w-prose text-slate-900"
                            />
                        </section>
                    </div>

                    {/* RIGHT COLUMN: Sticky Order Summary & Review */}
                    <div className="lg:col-span-5">
                        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm lg:sticky lg:top-20 space-y-5">
                            <h2 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100">
                                Order Summary
                            </h2>

                            {/* Ineligibility Alert */}
                            {formData.deliveryMethod === "delivery" && !summary.isEligible && (
                                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs space-y-1.5">
                                    <div className="flex items-center gap-1.5 font-semibold text-amber-900">
                                        <Icon icon="mingcute:alert-triangle-line" className="w-4 h-4 flex-shrink-0" />
                                        <span>Minimum order required for delivery:</span>
                                    </div>
                                    {summary.ineligibleFarmers.map((f) => (
                                        <div key={f.farmerId} className="flex justify-between items-center pl-5">
                                            <span>{f.farmerName}:</span>
                                            <span className="font-semibold tabular-nums">
                                                Need {(f.minimumOrderQuantity - f.totalQuantity).toFixed(1)} kg more
                                            </span>
                                        </div>
                                    ))}
                                    <p className="text-[11px] text-amber-700 pl-5 pt-1">
                                        Click "+kg" on an item below to auto-fill the required weight.
                                    </p>
                                </div>
                            )}

                            {/* Produce Items Grouped by Farmer */}
                            <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
                                {summary.farmerGroups.map((farmer) => {
                                    const isIneligible =
                                        formData.deliveryMethod === "delivery" &&
                                        farmer.totalQuantity < farmer.minimumOrderQuantity;
                                    const shortage = farmer.minimumOrderQuantity - farmer.totalQuantity;

                                    return (
                                        <div
                                            key={farmer.farmerId}
                                            className={`p-3.5 rounded-xl border ${
                                                isIneligible
                                                    ? "border-amber-200 bg-amber-50/30"
                                                    : "border-slate-200 bg-slate-50/50"
                                            }`}
                                        >
                                            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200/60 text-xs">
                                                <div className="font-semibold text-slate-900 truncate">
                                                    {farmer.farmerName}
                                                </div>
                                                <span className="text-slate-500 tabular-nums">
                                                    {farmer.totalQuantity.toFixed(1)} kg total
                                                </span>
                                            </div>

                                            <div className="space-y-2">
                                                {farmer.items.map((item) => (
                                                    <div
                                                        key={item.id}
                                                        className="flex items-center justify-between gap-3 text-xs"
                                                    >
                                                        <div className="flex items-center gap-2.5 min-w-0">
                                                            {item.image && (
                                                                <img
                                                                    src={item.image}
                                                                    alt={item.name}
                                                                    className="w-9 h-9 rounded-lg object-cover border border-slate-200 flex-shrink-0"
                                                                />
                                                            )}
                                                            <div className="truncate">
                                                                <p className="font-medium text-slate-800 truncate">
                                                                    {item.name}
                                                                </p>
                                                                <p className="text-slate-500 tabular-nums">
                                                                    ₱{Number(item.price).toFixed(2)} × {item.quantity} {item.unit || "kg"}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-2 flex-shrink-0">
                                                            <span className="font-semibold text-slate-900 tabular-nums">
                                                                ₱{(item.price * item.quantity).toFixed(2)}
                                                            </span>

                                                            {/* Shortage quick adder */}
                                                            {isIneligible && shortage > 0 && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => autoAdjustQuantityForDelivery(item.id, farmer.farmerId)}
                                                                    className="min-h-[32px] px-2 py-1 bg-amber-700 hover:bg-amber-800 text-white font-medium text-[11px] rounded-lg transition duration-150 active:scale-[0.97]"
                                                                    title={`Add ${shortage.toFixed(1)}kg to meet delivery minimum`}
                                                                >
                                                                    +{shortage.toFixed(1)}kg
                                                                </button>
                                                            )}

                                                            {/* Remove item button */}
                                                            <button
                                                                type="button"
                                                                onClick={() => removeItemFromCart(item.id)}
                                                                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-600 rounded-lg transition duration-150 active:scale-[0.95]"
                                                                aria-label={`Remove ${item.name}`}
                                                            >
                                                                <Icon icon="mingcute:delete-2-line" className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Price Breakdown */}
                            <div className="border-t border-slate-100 pt-4 space-y-2.5 text-sm">
                                <div className="flex justify-between text-slate-600">
                                    <span>Produce Subtotal</span>
                                    <span className="tabular-nums font-medium text-slate-900">
                                        ₱{summary.subtotal.toFixed(2)}
                                    </span>
                                </div>
                                <div className="flex justify-between text-slate-600">
                                    <span>Delivery Fee</span>
                                    <span className="tabular-nums font-medium text-slate-900">
                                        {formData.deliveryMethod === "delivery"
                                            ? `₱${summary.deliveryFee.toFixed(2)}`
                                            : "Free (Pickup)"}
                                    </span>
                                </div>
                                <div className="flex justify-between items-baseline text-base font-bold text-slate-900 border-t border-slate-200/80 pt-3.5 mt-2">
                                    <span>Total Amount</span>
                                    <span className="text-xl font-extrabold text-emerald-800 tabular-nums">
                                        ₱{summary.finalTotal.toFixed(2)}
                                    </span>
                                </div>
                            </div>

                            {/* Live Alert Notice */}
                            {hasLiveProductIssue && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-start gap-2">
                                    <Icon icon="mingcute:alert-line" className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                    <span>{liveProductMessage}</span>
                                </div>
                            )}

                            {/* Desktop/In-Page Submit Button */}
                            <div ref={bottomSubmitRef} className="pt-2">
                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    disabled={!isCheckoutAllowed}
                                    className={`w-full min-h-[50px] py-3.5 px-5 font-semibold text-sm rounded-xl transition duration-150 flex items-center justify-center gap-2 ${
                                        isCheckoutAllowed
                                            ? "bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs active:scale-[0.98]"
                                            : "bg-slate-200 text-slate-400 cursor-not-allowed"
                                    }`}
                                >
                                    {loading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            <span>Processing Order…</span>
                                        </>
                                    ) : (
                                        <>
                                            <Icon icon="mingcute:check-circle-line" className="w-4 h-4" />
                                            <span>Place Order (₱{summary.finalTotal.toFixed(2)})</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Mobile Fixed Sticky Checkout Bottom Bar (sits above mobile NavigationBar; vanishes when bottom submit button is in view) */}
            <div
                className={`md:hidden fixed bottom-[60px] left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-lg z-30 transition-all duration-200 ease-out ${
                    isBottomVisible
                        ? "opacity-0 translate-y-4 pointer-events-none"
                        : "opacity-100 translate-y-0 pointer-events-auto"
                }`}
                aria-hidden={isBottomVisible}
            >
                <div className="max-w-lg mx-auto py-3 px-4 sm:px-6 flex items-center justify-between gap-4">
                    <div>
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block leading-tight">
                            Total
                        </span>
                        <span className="text-xl font-extrabold text-slate-900 tabular-nums leading-tight">
                            ₱{summary.finalTotal.toFixed(2)}
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={!isCheckoutAllowed}
                        className={`min-h-[46px] py-2.5 px-6 font-semibold text-sm rounded-xl transition duration-150 flex items-center justify-center gap-2 flex-1 max-w-[210px] ${
                            isCheckoutAllowed
                                ? "bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs active:scale-[0.98]"
                                : "bg-slate-200 text-slate-400 cursor-not-allowed"
                        }`}
                    >
                        {loading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                <span>Placing…</span>
                            </>
                        ) : (
                            <span>Place Order</span>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Checkout;
