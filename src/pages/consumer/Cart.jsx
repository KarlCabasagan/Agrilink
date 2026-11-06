import { useState, useEffect, useContext, useRef, useMemo, useCallback } from "react";
import { Icon } from "@iconify/react";
import { Link, useNavigate } from "react-router-dom";
import NavigationBar from "../../components/NavigationBar";
import Modal from "../../components/Modal";
import StateView from "../../components/StateView";
import supabase from "../../SupabaseClient.jsx";
import { AuthContext } from "../../context/AuthContext.jsx";
import { CartCountContext } from "../../context/CartCountContext.jsx";

function Cart() {
    const { user } = useContext(AuthContext);
    const { cartCount, setCartCount } = useContext(CartCountContext);
    const navigate = useNavigate();

    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [hasInvalidItems, setHasInvalidItems] = useState(false);
    const [profileIncomplete, setProfileIncomplete] = useState(false);
    const [cartVersion, setCartVersion] = useState(0);
    const [dailyDeliveryOrderCounts, setDailyDeliveryOrderCounts] = useState({});
    const [modal, setModal] = useState({
        open: false,
        type: "info",
        title: "",
        message: "",
        onConfirm: null,
    });

    const showModal = (type, title, message, onConfirm = null) => {
        setModal({ open: true, type, title, message, onConfirm });
    };

    // Fetch cart items
    const fetchCartItems = useCallback(async () => {
        if (!user) return;
        setLoading(true);

        try {
            const { data, error } = await supabase
                .from("cart_items")
                .select(
                    `
                    *,
                    carts!cart_id(user_id),
                    products(
                        *,
                        categories(name),
                        profiles!user_id(name, address, delivery_cost, minimum_order_quantity, daily_delivery_limit),
                        approval_date,
                        status_id
                    )
                    `
                )
                .eq("carts.user_id", user.id)
                .order("created_at", { ascending: false });

            if (error) {
                console.error("Error fetching cart items:", error);
                return;
            }

            const hasInvalid = data?.some((item) => {
                const product = item.products;
                const approvalDate = product?.approval_date
                    ? new Date(product.approval_date).toISOString()
                    : null;
                const defaultDate = new Date("1970-01-01T00:00:00.000Z").toISOString();

                return (
                    !product?.approval_date ||
                    approvalDate.startsWith("1970-01-01T00:00:00") ||
                    approvalDate === defaultDate ||
                    product.status_id === 2
                );
            });

            setHasInvalidItems(hasInvalid);

            const formatted = (data || []).map((item) => ({
                id: item.product_id,
                cartItemId: item.id,
                name: item.products.name,
                price: parseFloat(item.products.price) || 0,
                quantity: parseFloat(item.quantity) || 0,
                image:
                    item.products.image_url ||
                    "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=400",
                farmerName: item.products.profiles?.name || "Local Farmer",
                farmerId: item.products.user_id,
                farmerAddress: item.products.profiles?.address || "Iligan City",
                stock: parseFloat(item.products.stock) || 0,
                unit: "kg",
                minimumOrderQuantity:
                    parseFloat(item.products.profiles?.minimum_order_quantity) || 1.0,
                deliveryCost:
                    parseFloat(item.products.profiles?.delivery_cost) || 50.0,
                dailyDeliveryLimit:
                    parseInt(item.products.profiles?.daily_delivery_limit) ?? 3,
                category: item.products.categories?.name || "Produce",
                products: {
                    status_id: item.products.status_id,
                    approval_date: item.products.approval_date,
                },
            }));

            setCartItems(formatted);
            setCartVersion((v) => v + 1);
        } catch (error) {
            console.error("Error fetching cart items:", error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchCartItems();
    }, [fetchCartItems]);

    // Check profile completion
    useEffect(() => {
        if (!user) return;

        const checkProfile = async () => {
            try {
                const { data } = await supabase
                    .from("profiles")
                    .select("address, contact")
                    .eq("id", user.id)
                    .single();

                setProfileIncomplete(!data?.address || !data?.contact);
            } catch {
                setProfileIncomplete(true);
            }
        };

        checkProfile();
    }, [user]);

    // Daily delivery order counts per farmer
    useEffect(() => {
        if (cartItems.length === 0) return;

        const sellerIds = Array.from(new Set(cartItems.map((it) => it.farmerId)));
        if (sellerIds.length === 0) return;

        const fetchDailyCounts = async () => {
            try {
                const today = new Date();
                const startOfDay = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 0, 0, 0, 0));
                const endOfDay = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 23, 59, 59, 999));

                const { data: orders } = await supabase
                    .from("orders")
                    .select("seller_id")
                    .in("seller_id", sellerIds)
                    .eq("delivery_method_id", 2)
                    .neq("status_id", 8)
                    .gte("created_at", startOfDay.toISOString())
                    .lte("created_at", endOfDay.toISOString());

                const counts = {};
                (orders || []).forEach((o) => {
                    counts[o.seller_id] = (counts[o.seller_id] || 0) + 1;
                });
                setDailyDeliveryOrderCounts(counts);
            } catch (err) {
                console.error("Error fetching daily delivery counts:", err);
            }
        };

        fetchDailyCounts();
    }, [cartItems]);

    // Farmer groups memo
    const farmerGroups = useMemo(() => {
        const groups = cartItems.reduce((acc, item) => {
            const fid = item.farmerId;
            if (!acc[fid]) {
                acc[fid] = {
                    farmerName: item.farmerName,
                    farmerId: fid,
                    farmerAddress: item.farmerAddress,
                    items: [],
                    totalQuantity: 0,
                    totalPrice: 0,
                    minimumOrderQuantity: item.minimumOrderQuantity,
                    deliveryCost: item.deliveryCost,
                    dailyDeliveryLimit: item.dailyDeliveryLimit,
                };
            }
            acc[fid].items.push(item);
            acc[fid].totalQuantity += item.quantity;
            acc[fid].totalPrice += item.price * item.quantity;
            return acc;
        }, {});

        return Object.values(groups).map((group) => {
            const todayCount = dailyDeliveryOrderCounts[group.farmerId] || 0;
            const isLimitReached = group.dailyDeliveryLimit === 0 || todayCount >= group.dailyDeliveryLimit;
            return {
                ...group,
                isDeliveryLimitReached: isLimitReached,
                todayOrderCount: todayCount,
            };
        });
    }, [cartItems, dailyDeliveryOrderCounts]);

    // Quantity update
    const updateQuantity = async (id, newQuantity) => {
        const rounded = Math.round(newQuantity * 10) / 10;
        if (isNaN(rounded) || rounded < 0) return;

        const item = cartItems.find((it) => it.id === id);
        if (!item) return;

        const finalQty = Math.min(rounded, item.stock);
        try {
            await supabase
                .from("cart_items")
                .update({ quantity: finalQty })
                .eq("id", item.cartItemId);

            setCartItems((prev) =>
                prev.map((it) => (it.id === id ? { ...it, quantity: finalQty } : it))
            );
        } catch (err) {
            console.error("Error updating cart quantity:", err);
        }
    };

    const handleQuantityStep = (id, delta) => {
        const item = cartItems.find((it) => it.id === id);
        if (!item) return;
        const next = Math.max(0.1, Math.min(item.stock, Math.round((item.quantity + delta) * 10) / 10));
        updateQuantity(id, next);
    };

    const removeItem = async (id) => {
        const item = cartItems.find((it) => it.id === id);
        if (!item) return;

        try {
            await supabase
                .from("cart_items")
                .delete()
                .eq("id", item.cartItemId);

            setCartItems((prev) => {
                const next = prev.filter((it) => it.id !== id);
                setHasInvalidItems(next.some((it) => it.products?.status_id === 2 || !it.products?.approval_date));
                return next;
            });

            setCartCount((c) => Math.max(0, c - 1));
        } catch (err) {
            console.error("Error removing cart item:", err);
        }
    };

    // Auto-cap stock watcher
    const autoCapDoneRef = useRef(0);
    useEffect(() => {
        if (autoCapDoneRef.current === cartVersion || cartItems.length === 0) return;

        const timer = setTimeout(async () => {
            try {
                const productIds = Array.from(new Set(cartItems.map((it) => it.id)));
                const { data } = await supabase.from("products").select("id, stock").in("id", productIds);

                if (!data) return;
                const stockMap = new Map(data.map((p) => [p.id, Math.round(parseFloat(p.stock) * 10) / 10]));

                const toCap = [];
                const updated = cartItems.map((it) => {
                    const st = stockMap.get(it.id) ?? 0;
                    const capped = Math.min(it.quantity, st);
                    if (capped !== it.quantity) {
                        toCap.push({ ...it, capped });
                        return { ...it, quantity: capped };
                    }
                    return it;
                });

                if (toCap.length > 0) {
                    setCartItems(updated);
                    await Promise.all(
                        toCap.map((it) =>
                            supabase.from("cart_items").update({ quantity: it.capped }).eq("id", it.cartItemId)
                        )
                    );
                }
                autoCapDoneRef.current = cartVersion;
            } catch (err) {
                console.error("Auto cap error:", err);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [cartVersion, cartItems]);

    // Totals calculations
    const totalPrice = cartItems.reduce((sum, it) => sum + it.price * it.quantity, 0);
    const totalItems = cartItems.reduce((sum, it) => sum + it.quantity, 0);

    const getDeliveryIneligibleFarmers = () => {
        return farmerGroups.filter((g) => g.isDeliveryLimitReached || g.totalQuantity < g.minimumOrderQuantity);
    };

    const isDeliveryAvailable = getDeliveryIneligibleFarmers().length === 0;

    const deliveryTotal = farmerGroups.reduce((sum, g) => {
        const isEligible = !g.isDeliveryLimitReached && g.totalQuantity >= g.minimumOrderQuantity;
        return sum + (isEligible ? g.deliveryCost : 0);
    }, 0);

    const grandTotal = totalPrice + deliveryTotal;

    // Checkout gate
    const handleCheckout = async () => {
        if (profileIncomplete) {
            showModal(
                "warning",
                "Profile Incomplete",
                "Please add your contact number and delivery address in your profile before checking out.",
                () => {
                    setModal((prev) => ({ ...prev, open: false }));
                    navigate("/profile");
                }
            );
            return;
        }

        const validItems = cartItems.filter((it) => it.quantity > 0);
        if (validItems.length === 0) {
            showModal("warning", "Empty Cart", "Please ensure your cart has at least one valid item.", () =>
                setModal((prev) => ({ ...prev, open: false }))
            );
            return;
        }

        if (hasInvalidItems) {
            showModal(
                "error",
                "Unavailable Items",
                "Some items in your cart are no longer approved or suspended. Please remove them to proceed.",
                () => setModal((prev) => ({ ...prev, open: false }))
            );
            return;
        }

        navigate("/checkout", {
            state: {
                cartItems: validItems,
                totalAmount: totalPrice,
                farmerGroups,
            },
        });
    };

    return (
        <div className="min-h-screen w-full max-w-full overflow-x-hidden flex flex-col bg-slate-50/50 text-slate-900 pb-28 lg:pb-16 md:pt-16">
            {/* MOBILE TOP BAR (< 768px) */}
            <header className="md:hidden sticky top-0 left-0 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 z-40 px-4 py-3 flex items-center justify-between shadow-xs">
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center -ml-2 text-slate-700 hover:text-emerald-800 active:scale-95"
                    aria-label="Go back"
                >
                    <Icon icon="mingcute:left-line" width="22" height="22" />
                </button>
                <div className="flex items-center gap-1.5 font-bold text-slate-900">
                    <span>My Cart</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 tabular-nums">
                        {totalItems.toFixed(1)} kg
                    </span>
                </div>
                <div className="w-8" />
            </header>

            {/* MAIN CONTAINER */}
            <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 md:mt-8">
                {/* Desktop Breadcrumbs & Header */}
                <div className="hidden md:flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                            Shopping Cart
                        </h1>
                        <p className="text-xs text-slate-600 mt-1 tabular-nums">
                            {farmerGroups.length} farmer {farmerGroups.length === 1 ? "group" : "groups"} · {totalItems.toFixed(1)} kg total produce
                        </p>
                    </div>
                    <Link
                        to="/"
                        className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 flex items-center gap-1"
                    >
                        <span>Continue Shopping</span>
                        <Icon icon="mingcute:arrow-right-line" width="14" height="14" />
                    </Link>
                </div>

                {loading ? (
                    <div className="space-y-4 max-w-3xl">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="bg-white rounded-2xl p-5 border border-slate-200 animate-pulse space-y-3">
                                <div className="h-5 bg-slate-200 rounded w-1/3" />
                                <div className="h-16 bg-slate-200 rounded-xl" />
                            </div>
                        ))}
                    </div>
                ) : cartItems.length === 0 ? (
                    <div className="py-12">
                        <StateView
                            type="empty"
                            icon="mingcute:shopping-cart-1-line"
                            title="Your cart is empty"
                            description="Directly support local Iligan growers by adding fresh harvest to your cart."
                            actionText="Browse Marketplace"
                            onAction={() => navigate("/")}
                        />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
                        {/* LEFT COLUMN: Items Grouped by Farmer (col-span-8) */}
                        <div className="lg:col-span-8 space-y-6">
                            {/* Ineligible Delivery Alert */}
                            {!isDeliveryAvailable && (
                                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/90 text-amber-900 text-xs space-y-1.5 shadow-xs">
                                    <div className="flex items-center gap-2 font-bold text-amber-950">
                                        <Icon icon="mingcute:truck-line" className="w-4 h-4 text-amber-700" />
                                        <span>Delivery Requirement Notice</span>
                                    </div>
                                    <p className="text-amber-800">
                                        Some farms require a minimum weight or have reached today's delivery limit. You may still choose farm pickup at checkout.
                                    </p>
                                </div>
                            )}

                            {/* Farmer Groups */}
                            {farmerGroups.map((group) => {
                                const isMinMet = group.totalQuantity >= group.minimumOrderQuantity;
                                const isEligible = !group.isDeliveryLimitReached && isMinMet;

                                return (
                                    <div
                                        key={group.farmerId}
                                        className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-xs space-y-0"
                                    >
                                        {/* Farmer Header */}
                                        <div className="p-4 sm:p-5 bg-slate-50/80 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-2">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-xs">
                                                    {group.farmerName.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-1.5">
                                                        <h3 className="font-bold text-sm text-slate-900">
                                                            {group.farmerName}
                                                        </h3>
                                                        <Icon
                                                            icon="mingcute:check-circle-fill"
                                                            className="w-3.5 h-3.5 text-emerald-700"
                                                            title="Verified Grower"
                                                        />
                                                    </div>
                                                    <p className="text-xs text-slate-600 flex items-center gap-1">
                                                        <Icon icon="mingcute:location-line" width="12" height="12" />
                                                        <span className="truncate max-w-[200px]">{group.farmerAddress}</span>
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Delivery Status Chip */}
                                            <div className="flex items-center gap-1.5">
                                                <span
                                                    className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full tabular-nums ${
                                                        isEligible
                                                            ? "bg-emerald-100 text-emerald-800"
                                                            : "bg-amber-100 text-amber-900"
                                                    }`}
                                                >
                                                    <Icon
                                                        icon={isEligible ? "mingcute:check-fill" : "mingcute:alert-line"}
                                                        width="12"
                                                        height="12"
                                                    />
                                                    <span>
                                                        {isEligible
                                                            ? "Delivery available"
                                                            : group.isDeliveryLimitReached
                                                            ? "Delivery capacity full"
                                                            : `Min. order: ${group.minimumOrderQuantity} kg`}
                                                    </span>
                                                </span>
                                            </div>
                                        </div>

                                        {/* Items in Farmer Group */}
                                        <div className="divide-y divide-slate-100">
                                            {group.items.map((item) => (
                                                <div key={item.cartItemId} className="p-4 sm:p-5 flex gap-4 items-center">
                                                    {/* Produce Image */}
                                                    <img
                                                        src={item.image}
                                                        alt={item.name}
                                                        className="w-20 h-20 rounded-2xl object-cover border border-slate-200 shrink-0"
                                                    />

                                                    {/* Details & Controls */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div>
                                                                <h4 className="font-semibold text-sm text-slate-900 truncate">
                                                                    {item.name}
                                                                </h4>
                                                                <span className="text-xs text-slate-600">
                                                                    {item.category} · ₱{item.price.toFixed(2)} /kg
                                                                </span>
                                                            </div>
                                                            {/* Remove Button (44×44px hit area) */}
                                                            <button
                                                                type="button"
                                                                onClick={() => removeItem(item.id)}
                                                                className="min-w-[44px] min-h-[44px] flex items-center justify-center -mr-2 text-slate-400 hover:text-rose-600 active:scale-95 transition-colors"
                                                                aria-label={`Remove ${item.name} from cart`}
                                                            >
                                                                <Icon icon="mingcute:delete-2-line" width="18" height="18" />
                                                            </button>
                                                        </div>

                                                        {/* Steppers & Subtotal Row */}
                                                        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
                                                            {/* Stepper */}
                                                            <div className="flex items-center gap-1.5">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleQuantityStep(item.id, -0.5)}
                                                                    disabled={item.quantity <= 0.1}
                                                                    className="min-w-[36px] min-h-[36px] rounded-lg border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-700 disabled:opacity-40 active:scale-95 transition-all"
                                                                    aria-label="Decrease quantity by 0.5kg"
                                                                >
                                                                    <Icon icon="mingcute:minimize-line" width="14" height="14" />
                                                                </button>
                                                                <input
                                                                    type="number"
                                                                    value={item.quantity}
                                                                    onChange={(e) => updateQuantity(item.id, parseFloat(e.target.value) || 0)}
                                                                    step="0.5"
                                                                    max={item.stock}
                                                                    className="w-16 py-1 text-center font-bold text-xs tabular-nums border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleQuantityStep(item.id, 0.5)}
                                                                    disabled={item.quantity >= item.stock}
                                                                    className="min-w-[36px] min-h-[36px] rounded-lg border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-700 disabled:opacity-40 active:scale-95 transition-all"
                                                                    aria-label="Increase quantity by 0.5kg"
                                                                >
                                                                    <Icon icon="mingcute:add-line" width="14" height="14" />
                                                                </button>
                                                                <span className="text-xs text-slate-600 font-medium ml-1">kg</span>
                                                            </div>

                                                            {/* Item Total */}
                                                            <div className="text-right tabular-nums">
                                                                <span className="font-extrabold text-sm text-emerald-800">
                                                                    ₱{(item.price * item.quantity).toFixed(2)}
                                                                </span>
                                                                <span className="block text-[10px] text-slate-600">
                                                                    {item.stock} kg in farm stock
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* RIGHT COLUMN: Sticky Order Summary (col-span-4) */}
                        <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-6">
                            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-5">
                                <h2 className="text-lg font-bold text-slate-900 pb-3 border-b border-slate-100">
                                    Order Summary
                                </h2>

                                <div className="space-y-3 text-xs text-slate-600">
                                    <div className="flex justify-between items-baseline">
                                        <span>Produce Subtotal ({totalItems.toFixed(1)} kg)</span>
                                        <span className="font-bold text-sm text-slate-900 tabular-nums">
                                            ₱{totalPrice.toFixed(2)}
                                        </span>
                                    </div>

                                    {/* Per-farmer delivery estimate */}
                                    <div className="space-y-1.5 pt-2 border-t border-slate-100">
                                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                                            Delivery Estimates
                                        </span>
                                        {farmerGroups.map((g) => {
                                            const isEligible = !g.isDeliveryLimitReached && g.totalQuantity >= g.minimumOrderQuantity;
                                            return (
                                                <div key={g.farmerId} className="flex justify-between items-baseline text-slate-600">
                                                    <span className="truncate max-w-[180px]">{g.farmerName}</span>
                                                    <span className="tabular-nums font-medium text-slate-800">
                                                        {isEligible ? `₱${g.deliveryCost.toFixed(2)}` : "Pickup only"}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Grand Total */}
                                    <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
                                        <span className="font-bold text-sm text-slate-900">Total Amount</span>
                                        <span className="font-extrabold text-2xl text-emerald-800 tabular-nums">
                                            ₱{grandTotal.toFixed(2)}
                                        </span>
                                    </div>
                                </div>

                                {/* Desktop Checkout Action */}
                                <div className="hidden lg:block pt-2">
                                    <button
                                        type="button"
                                        onClick={handleCheckout}
                                        disabled={profileIncomplete || hasInvalidItems}
                                        className="w-full min-h-[48px] py-3 px-6 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-sm shadow-xs active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        <Icon icon="mingcute:wallet-3-line" width="18" height="18" />
                                        <span>Proceed to Checkout</span>
                                    </button>

                                    {profileIncomplete && (
                                        <p className="text-[11px] text-amber-700 text-center mt-2">
                                            Address and contact info required in profile before checkout.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* MOBILE STICKY CHECKOUT BAR (< 1024px) */}
            {cartItems.length > 0 && (
                <div className="lg:hidden fixed bottom-[60px] left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 z-40 px-4 py-2.5 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
                    <div className="max-w-lg mx-auto flex items-center justify-between">
                        <div>
                            <span className="text-[10px] text-slate-600 uppercase font-semibold block">Total</span>
                            <span className="font-extrabold text-lg text-emerald-800 tabular-nums">
                                ₱{grandTotal.toFixed(2)}
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={handleCheckout}
                            disabled={profileIncomplete || hasInvalidItems}
                            className="min-h-[44px] px-6 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs shadow-xs active:scale-95 flex items-center gap-1.5 disabled:opacity-50"
                        >
                            <Icon icon="mingcute:wallet-3-line" width="16" height="16" />
                            <span>Checkout</span>
                        </button>
                    </div>
                </div>
            )}

            {/* SHARED NAVIGATION */}
            <NavigationBar />

            {/* MODAL */}
            <Modal
                open={modal.open}
                type={modal.type}
                title={modal.title}
                message={modal.message}
                onConfirm={modal.onConfirm}
                onClose={() => setModal((prev) => ({ ...prev, open: false }))}
            />
        </div>
    );
}

export default Cart;
