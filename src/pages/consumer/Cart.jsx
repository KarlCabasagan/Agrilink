import { useState, useEffect, useContext, useRef } from "react";
import { Icon } from "@iconify/react";
import { Link, useNavigate } from "react-router-dom";
import NavigationBar from "../../components/NavigationBar";
import Modal from "../../components/Modal";
import supabase from "../../SupabaseClient.jsx";
import { toast } from "react-hot-toast";
import { AuthContext } from "../../App.jsx";

function Cart() {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [hasInvalidItems, setHasInvalidItems] = useState(false);
    // version increments when cart data is fetched to coordinate one-time autocap
    const [cartVersion, setCartVersion] = useState(0);
    const [modal, setModal] = useState({
        open: false,
        type: "",
        title: "",
        message: "",
        onConfirm: null,
    });

    const showModal = (type, title, message, onConfirm = null) => {
        setModal({ open: true, type, title, message, onConfirm });
    };

    // Fetch cart items from database (extracted so we can re-use it)
    const fetchCartItems = async () => {
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
                        profiles!user_id(name, address, delivery_cost, minimum_order_quantity),
                        approval_date,
                        status_id
                    )
                `
                )
                .eq("carts.user_id", user.id)
                .order("created_at", { ascending: false });

            // Check for invalid products
            const hasInvalid = data?.some((item) => {
                const product = item.products;
                // Convert approval_date to a standardized format for comparison
                const approvalDate = product?.approval_date
                    ? new Date(product.approval_date).toISOString()
                    : null;
                const defaultDate = new Date(
                    "1970-01-01T00:00:00.000Z"
                ).toISOString();

                return (
                    !product?.approval_date ||
                    approvalDate.startsWith("1970-01-01T00:00:00") ||
                    approvalDate === defaultDate ||
                    product.status_id === 2
                );
            });

            setHasInvalidItems(hasInvalid);

            if (error) {
                console.error("Error fetching cart items:", error);
                return;
            }

            console.log("Raw cart data:", data); // Debug log

            const formattedCartItems = data.map((item) => ({
                id: item.product_id,
                cartItemId: item.id,
                name: item.products.name,
                price: parseFloat(item.products.price),
                quantity: parseFloat(item.quantity),
                image:
                    item.products.image_url ||
                    "https://via.placeholder.com/300x200?text=No+Image",
                farmerName: item.products.profiles?.name || "Unknown Farmer",
                farmerId: item.products.user_id, // Updated to use user_id
                products: {
                    status_id: item.products.status_id,
                    approval_date: item.products.approval_date,
                },
                farmerAddress:
                    item.products.profiles?.address || "Location not available",
                stock: parseFloat(item.products.stock),
                unit: "kg", // Default unit since not in new schema
                minimumOrderQuantity:
                    parseFloat(
                        item.products.profiles?.minimum_order_quantity
                    ) || 1.0,
                deliveryCost:
                    parseFloat(item.products.profiles?.delivery_cost) || 50.0,
                category: item.products.categories?.name || "Other",
            }));

            console.log("Formatted cart items:", formattedCartItems); // Debug log
            setCartItems(formattedCartItems);
            // bump cart version so autocap runs once per fetch
            setCartVersion((v) => v + 1);
        } catch (error) {
            console.error("Error fetching cart items:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCartItems();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    // Group cart items by farmer
    const groupedByFarmer = cartItems.reduce((groups, item) => {
        const farmerId = item.farmerId;
        if (!groups[farmerId]) {
            groups[farmerId] = {
                farmerName: item.farmerName,
                farmerId: farmerId,
                items: [],
                totalQuantity: 0,
                totalPrice: 0,
                minimumOrderQuantity: item.minimumOrderQuantity,
                deliveryCost: item.deliveryCost,
            };
        }
        groups[farmerId].items.push(item);
        groups[farmerId].totalQuantity += item.quantity;
        groups[farmerId].totalPrice += item.price * item.quantity;
        return groups;
    }, {});

    const farmerGroups = Object.values(groupedByFarmer);

    const updateQuantity = async (id, newQuantity) => {
        // Accept zero; round to 1 decimal and prevent negatives
        const roundedQuantity = Math.round(newQuantity * 10) / 10;
        if (isNaN(roundedQuantity) || roundedQuantity < 0) return;

        const item = cartItems.find((item) => item.id === id);
        if (!item) return;

        // Cap to stock defensively
        const finalQuantity = Math.min(roundedQuantity, item.stock);

        try {
            // Persist zero quantities (do not delete rows)
            const { error } = await supabase
                .from("cart_items")
                .update({ quantity: finalQuantity })
                .eq("id", item.cartItemId);

            if (error) {
                console.error("Error updating quantity:", error);
                return;
            }

            setCartItems((items) =>
                items.map((cartItem) =>
                    cartItem.id === id
                        ? { ...cartItem, quantity: finalQuantity }
                        : cartItem
                )
            );
        } catch (error) {
            console.error("Error updating cart item:", error);
        }
    };

    // Auto-cap effect: ensure cart item quantities do not exceed product stock
    const autoCapDoneForVersionRef = useRef(0);
    const autoCapTimerRef = useRef(null);
    useEffect(() => {
        // debounce and run once per cartVersion
        if (autoCapDoneForVersionRef.current === cartVersion) return;
        if (!cartItems || cartItems.length === 0) return;

        if (autoCapTimerRef.current) clearTimeout(autoCapTimerRef.current);
        autoCapTimerRef.current = setTimeout(async () => {
            try {
                const productIds = Array.from(
                    new Set(cartItems.map((it) => it.id))
                ).filter(Boolean);
                if (productIds.length === 0) {
                    autoCapDoneForVersionRef.current = cartVersion;
                    return;
                }

                const { data: productsData, error: productsError } =
                    await supabase
                        .from("products")
                        .select("id, stock")
                        .in("id", productIds);

                if (productsError) {
                    console.error(
                        "Error fetching product stocks:",
                        productsError
                    );
                    autoCapDoneForVersionRef.current = cartVersion;
                    return;
                }

                const stockMap = new Map();
                (productsData || []).forEach((p) => {
                    const s = parseFloat(p.stock);
                    stockMap.set(p.id, isNaN(s) ? 0 : Math.round(s * 10) / 10);
                });

                // identify items that need capping
                const toCap = [];
                const newCartItems = cartItems.map((it) => {
                    const stock = stockMap.has(it.id) ? stockMap.get(it.id) : 0;
                    const capped = Math.min(
                        Math.round(it.quantity * 10) / 10,
                        stock
                    );
                    const cappedRounded = Math.round(capped * 10) / 10;
                    if (cappedRounded !== it.quantity) {
                        toCap.push({ ...it, capped: cappedRounded });
                        return { ...it, quantity: cappedRounded };
                    }
                    return it;
                });

                if (toCap.length === 0) {
                    autoCapDoneForVersionRef.current = cartVersion;
                    return;
                }

                // Optimistically update local state so UI reflows smoothly
                setCartItems(newCartItems);

                // Persist caps to DB (batch via Promise.all)
                await Promise.all(
                    toCap.map((it) =>
                        supabase
                            .from("cart_items")
                            .update({ quantity: it.capped })
                            .eq("id", it.cartItemId)
                    )
                );

                // Refresh canonical data
                await fetchCartItems();
                autoCapDoneForVersionRef.current = cartVersion;
            } catch (error) {
                console.error("Error auto-capping cart items:", error);
                autoCapDoneForVersionRef.current = cartVersion;
            }
        }, 300);

        return () => {
            if (autoCapTimerRef.current) clearTimeout(autoCapTimerRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cartVersion, cartItems]);

    const handleQuantityChange = (id, value) => {
        const numValue = parseFloat(value);
        // Allow zero and positive values; prevent negatives
        if (!isNaN(numValue) && numValue >= 0) {
            const item = cartItems.find((item) => item.id === id);
            if (!item) return;
            // Apply stock cap; zeros allowed
            const capped = Math.min(numValue, item.stock);
            updateQuantity(id, Math.round(capped * 10) / 10);
        } else if (value === "") {
            // treat empty input as 0 for UX but persist as 0
            updateQuantity(id, 0);
        }
    };

    const removeItem = async (id) => {
        const item = cartItems.find((item) => item.id === id);
        if (!item) return;

        try {
            const { error } = await supabase
                .from("cart_items")
                .delete()
                .eq("id", item.cartItemId);

            if (error) {
                console.error("Error removing item:", error);
                return;
            }

            // Update cart items and recalculate hasInvalidItems
            setCartItems((prevItems) => {
                const updatedItems = prevItems.filter(
                    (cartItem) => cartItem.id !== id
                );

                // Check remaining items for invalid products
                const hasInvalid = updatedItems.some((item) => {
                    const product = item.products;
                    const approvalDate = product?.approval_date
                        ? new Date(product.approval_date).toISOString()
                        : null;
                    const defaultDate = new Date(
                        "1970-01-01T00:00:00.000Z"
                    ).toISOString();

                    return (
                        !product?.approval_date ||
                        approvalDate.startsWith("1970-01-01T00:00:00") ||
                        approvalDate === defaultDate ||
                        product.status_id === 2
                    );
                });

                // Update hasInvalidItems state
                setHasInvalidItems(hasInvalid);

                return updatedItems;
            });
        } catch (error) {
            console.error("Error removing cart item:", error);
        }
    };

    const getTotalPrice = () => {
        return cartItems.reduce(
            (total, item) => total + item.price * item.quantity,
            0
        );
    };

    const getTotalItems = () => {
        return cartItems.reduce((total, item) => total + item.quantity, 0);
    };

    // Helper function to check delivery eligibility per farmer
    const getDeliveryIneligibleFarmers = () => {
        return farmerGroups.filter(
            (group) => group.totalQuantity < group.minimumOrderQuantity
        );
    };

    const isDeliveryAvailable = () => {
        return getDeliveryIneligibleFarmers().length === 0;
    };

    const handleCheckout = async () => {
        // Filter out zero-quantity items for checkout
        const checkoutItems = cartItems.filter((it) => (it.quantity || 0) > 0);

        if (checkoutItems.length === 0) {
            showModal("warning", "Empty Cart", "Your cart is empty!", () =>
                setModal((prev) => ({ ...prev, open: false }))
            );
            return;
        }

        // Check for invalid products before proceeding
        try {
            const { data: productsData, error: productsError } = await supabase
                .from("products")
                .select("id, approval_date, status_id")
                .in(
                    "id",
                    checkoutItems.map((item) => item.id)
                );

            if (productsError) {
                console.error("Error checking products:", productsError);
                showModal(
                    "error",
                    "Checkout Error",
                    "Unable to verify products. Please try again.",
                    () => setModal((prev) => ({ ...prev, open: false }))
                );
                return;
            }

            const invalidProducts = productsData.filter(
                (product) =>
                    !product.approval_date ||
                    product.approval_date === "1970-01-01 00:00:00+00" ||
                    product.status_id === 2
            );

            if (invalidProducts.length > 0) {
                showModal(
                    "error",
                    "Unable to Checkout",
                    "Some items in your cart are no longer available for purchase. Please remove them and try again.",
                    () => setModal((prev) => ({ ...prev, open: false }))
                );
                return;
            }
        } catch (error) {
            console.error("Error verifying products:", error);
            showModal(
                "error",
                "Checkout Error",
                "Unable to verify products. Please try again.",
                () => setModal((prev) => ({ ...prev, open: false }))
            );
            return;
        }

        // Check if user profile is complete before checkout
        try {
            const { data, error } = await supabase
                .from("profiles")
                .select("name, contact, address")
                .eq("id", user.id)
                .single();

            if (error) {
                console.error("Error checking profile:", error);
                showModal(
                    "error",
                    "Profile Error",
                    "Error checking profile information. Please try again.",
                    () => setModal((prev) => ({ ...prev, open: false }))
                );
                return;
            }

            // Validate profile completeness
            const isProfileComplete =
                data && data.name && data.contact && data.address;

            if (!isProfileComplete) {
                showModal(
                    "warning",
                    "Profile Incomplete",
                    "Please complete your profile information (name, contact, and address) before proceeding to checkout.",
                    () => {
                        setModal((prev) => ({ ...prev, open: false }));
                        navigate("/profile");
                    }
                );
                return;
            }

            // Profile is complete, proceed to checkout with filtered items
            // Recompute farmer groups and totals only for checkoutItems
            const itemsByFarmer = checkoutItems.reduce((groups, item) => {
                const farmerId = item.farmerId;
                if (!groups[farmerId]) {
                    groups[farmerId] = {
                        farmerName: item.farmerName,
                        farmerId: farmerId,
                        items: [],
                        totalQuantity: 0,
                        totalPrice: 0,
                        minimumOrderQuantity: item.minimumOrderQuantity,
                        deliveryCost: item.deliveryCost,
                    };
                }
                groups[farmerId].items.push(item);
                groups[farmerId].totalQuantity += item.quantity;
                groups[farmerId].totalPrice += item.price * item.quantity;
                return groups;
            }, {});

            const checkoutFarmerGroups = Object.values(itemsByFarmer);
            const totalAmount = checkoutItems.reduce(
                (sum, it) => sum + it.price * it.quantity,
                0
            );

            navigate("/checkout", {
                state: {
                    cartItems: checkoutItems,
                    totalAmount,
                    farmerGroups: checkoutFarmerGroups,
                },
            });
        } catch (error) {
            console.error("Error validating profile:", error);
            showModal(
                "error",
                "Profile Error",
                "Error checking profile information. Please try again.",
                () => setModal((prev) => ({ ...prev, open: false }))
            );
        }
    };

    return (
        <div className="min-h-screen w-full flex flex-col relative items-center scrollbar-hide bg-background overflow-x-hidden text-text pb-20">
            {/* Header */}
            <div className="fixed top-0 left-0 w-full bg-white shadow-md z-50 px-4 py-3 flex justify-between items-center">
                <Link to="/" className="text-gray-600 hover:text-primary">
                    <Icon icon="mingcute:left-line" width="24" height="24" />
                </Link>
                <h1 className="text-lg font-semibold">My Cart</h1>
                <div className="flex items-center gap-2">
                    <Icon
                        icon="mingcute:shopping-cart-1-line"
                        width="20"
                        height="20"
                        className="text-primary"
                    />
                    <span className="text-primary font-medium">
                        {getTotalItems().toFixed(1)} items
                    </span>
                </div>
            </div>

            <div className="w-full max-w-2xl mx-4 sm:mx-auto my-16">
                {loading ? (
                    // Loading skeleton
                    <div className="space-y-4">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div
                                key={i}
                                className="bg-white rounded-lg shadow-md p-4 animate-pulse"
                            >
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-4 h-4 bg-gray-300 rounded"></div>
                                    <div className="h-4 bg-gray-300 rounded w-32"></div>
                                </div>
                                <div className="flex gap-3">
                                    <div className="w-16 h-16 bg-gray-300 rounded-lg"></div>
                                    <div className="flex-1">
                                        <div className="h-4 bg-gray-300 rounded mb-2"></div>
                                        <div className="h-3 bg-gray-300 rounded w-3/4 mb-2"></div>
                                        <div className="h-4 bg-gray-300 rounded w-1/3"></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : cartItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <Icon
                            icon="mingcute:shopping-cart-1-line"
                            width="80"
                            height="80"
                            className="text-gray-300 mb-4"
                        />
                        <h2 className="text-xl font-bold text-gray-600 mb-2">
                            Your cart is empty
                        </h2>
                        <p className="text-gray-500 text-center mb-6">
                            Start shopping and add some fresh products from
                            local farmers!
                        </p>
                        <Link
                            to="/"
                            className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-dark transition-colors font-medium"
                        >
                            Start Shopping
                        </Link>
                    </div>
                ) : (
                    <>
                        {/* Delivery Eligibility Info */}
                        {!isDeliveryAvailable() && (
                            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                                <div className="flex items-start gap-3">
                                    <Icon
                                        icon="mingcute:truck-line"
                                        width="24"
                                        height="24"
                                        className="text-orange-600 mt-0.5"
                                    />
                                    <div>
                                        <h3 className="font-semibold text-orange-800 mb-1">
                                            Home Delivery Requirements
                                        </h3>
                                        <p className="text-orange-700 text-sm mb-2">
                                            Some farmers require minimum order
                                            quantities for delivery. Add more
                                            items or choose pickup during
                                            checkout.
                                        </p>
                                        <div className="text-orange-600 text-xs">
                                            {getDeliveryIneligibleFarmers().map(
                                                (farmer, index) => (
                                                    <p key={farmer.farmerId}>
                                                        •{" "}
                                                        <strong>
                                                            {farmer.farmerName}:
                                                        </strong>{" "}
                                                        Need{" "}
                                                        {(
                                                            farmer.minimumOrderQuantity -
                                                            farmer.totalQuantity
                                                        ).toFixed(1)}
                                                        kg more (currently{" "}
                                                        {farmer.totalQuantity.toFixed(
                                                            1
                                                        )}
                                                        kg, min:{" "}
                                                        {
                                                            farmer.minimumOrderQuantity
                                                        }
                                                        kg)
                                                    </p>
                                                )
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Cart Items Grouped by Farmer */}
                        <div className="space-y-6 mb-6">
                            {farmerGroups.map((group) => {
                                const isGroupEligible =
                                    group.totalQuantity >=
                                    group.minimumOrderQuantity;

                                return (
                                    <div
                                        key={group.farmerId}
                                        className={`bg-white rounded-lg shadow-md overflow-hidden ${
                                            !isGroupEligible
                                                ? "border-l-4 border-orange-400"
                                                : "border-l-4 border-green-400"
                                        }`}
                                    >
                                        {/* Farmer Header */}
                                        <div
                                            className={`p-4 ${
                                                isGroupEligible
                                                    ? "bg-green-50"
                                                    : "bg-orange-50"
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <Icon
                                                        icon="mingcute:user-3-line"
                                                        width="20"
                                                        height="20"
                                                        className={
                                                            isGroupEligible
                                                                ? "text-green-600"
                                                                : "text-orange-600"
                                                        }
                                                    />
                                                    <div>
                                                        <h3 className="font-semibold text-gray-800">
                                                            {group.farmerName}
                                                        </h3>
                                                        <p className="text-xs text-gray-600 flex items-center gap-1 mt-0.5">
                                                            <Icon
                                                                icon="mingcute:location-line"
                                                                width="12"
                                                                height="12"
                                                            />
                                                            {group.items[0]
                                                                ?.farmerAddress ||
                                                                "Location not available"}
                                                        </p>
                                                        <div className="bg-primary/10 px-2 py-1 rounded-md inline-block mt-1">
                                                            <p className="text-sm font-bold text-primary">
                                                                ₱
                                                                {group.totalPrice.toFixed(
                                                                    2
                                                                )}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div
                                                        className={`flex items-center gap-2 text-xs ${
                                                            isGroupEligible
                                                                ? "text-green-700"
                                                                : "text-orange-600"
                                                        }`}
                                                    >
                                                        <Icon
                                                            icon={
                                                                isGroupEligible
                                                                    ? "mingcute:check-circle-fill"
                                                                    : "mingcute:alert-triangle-fill"
                                                            }
                                                            width="14"
                                                            height="14"
                                                        />
                                                        <span>
                                                            {isGroupEligible
                                                                ? "Delivery available ✓"
                                                                : `${(
                                                                      group.minimumOrderQuantity -
                                                                      group.totalQuantity
                                                                  ).toFixed(
                                                                      1
                                                                  )}kg left for delivery`}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Farmer's Items */}
                                        <div className="divide-y divide-gray-100">
                                            {group.items.map((item) => (
                                                <div
                                                    key={item.id}
                                                    className="p-4"
                                                >
                                                    <div className="flex gap-4">
                                                        <img
                                                            src={item.image}
                                                            alt={item.name}
                                                            className="w-16 h-16 object-cover rounded-lg"
                                                        />
                                                        <div className="flex-1">
                                                            <div className="flex items-start justify-between mb-1">
                                                                <h4 className="font-semibold text-gray-800">
                                                                    {item.name}
                                                                </h4>
                                                                {item.products
                                                                    ?.status_id ===
                                                                    2 && (
                                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                                                        <Icon
                                                                            icon="mingcute:alert-fill"
                                                                            className="mr-1"
                                                                            width="12"
                                                                            height="12"
                                                                        />
                                                                        Suspended
                                                                    </span>
                                                                )}
                                                                {(!item.products
                                                                    ?.approval_date ||
                                                                    new Date(
                                                                        item.products?.approval_date
                                                                    )
                                                                        .toISOString()
                                                                        .startsWith(
                                                                            "1970-01-01"
                                                                        )) && (
                                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                                                        <Icon
                                                                            icon="mingcute:time-fill"
                                                                            className="mr-1"
                                                                            width="12"
                                                                            height="12"
                                                                        />
                                                                        Not
                                                                        Approved
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-primary font-bold text-lg">
                                                                ₱
                                                                {item.price.toFixed(
                                                                    2
                                                                )}
                                                                /{item.unit}
                                                            </p>
                                                        </div>
                                                        <button
                                                            onClick={() =>
                                                                removeItem(
                                                                    item.id
                                                                )
                                                            }
                                                            className="text-gray-400 hover:text-red-500 transition-colors"
                                                        >
                                                            <Icon
                                                                icon="mingcute:delete-2-line"
                                                                width="20"
                                                                height="20"
                                                            />
                                                        </button>
                                                    </div>

                                                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-sm font-medium text-gray-700">
                                                                Quantity (
                                                                {item.unit}):
                                                            </span>
                                                            <input
                                                                type="number"
                                                                value={
                                                                    item.quantity
                                                                }
                                                                onChange={(e) =>
                                                                    handleQuantityChange(
                                                                        item.id,
                                                                        e.target
                                                                            .value
                                                                    )
                                                                }
                                                                step="0.5"
                                                                // min="0.1"
                                                                max={item.stock}
                                                                className="px-2 py-1 border border-gray-300 rounded-lg w-20 text-center focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                                                            />
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-sm text-gray-500">
                                                                Subtotal
                                                            </p>
                                                            <p className="font-bold text-gray-800">
                                                                ₱
                                                                {(
                                                                    item.price *
                                                                    item.quantity
                                                                ).toFixed(2)}
                                                            </p>
                                                            <p className="text-xs text-gray-500">
                                                                Stock:{" "}
                                                                {item.stock}{" "}
                                                                {item.unit}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Order Summary */}
                        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                            <h3 className="font-semibold text-gray-800 mb-4">
                                Order Summary
                            </h3>

                            {/* Delivery Status */}
                            <div
                                className={`mb-4 p-3 rounded-lg ${
                                    isDeliveryAvailable()
                                        ? "bg-green-50 border border-green-200"
                                        : "bg-orange-50 border border-orange-200"
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <Icon
                                        icon={
                                            isDeliveryAvailable()
                                                ? "mingcute:check-circle-fill"
                                                : "mingcute:alert-triangle-fill"
                                        }
                                        width="16"
                                        height="16"
                                        className={
                                            isDeliveryAvailable()
                                                ? "text-green-600"
                                                : "text-orange-600"
                                        }
                                    />
                                    <span
                                        className={`text-sm font-medium ${
                                            isDeliveryAvailable()
                                                ? "text-green-800"
                                                : "text-orange-800"
                                        }`}
                                    >
                                        {isDeliveryAvailable()
                                            ? "Home Delivery Available for All Farmers"
                                            : `${
                                                  getDeliveryIneligibleFarmers()
                                                      .length
                                              } Farmer(s) Need Minimum Order`}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-2 mb-4">
                                <div className="flex justify-between text-gray-600">
                                    <span>
                                        Total Items:{" "}
                                        {getTotalItems().toFixed(1)} kg
                                    </span>
                                    <span>₱{getTotalPrice().toFixed(2)}</span>
                                </div>

                                <div className="space-y-1">
                                    {farmerGroups.map((group) => (
                                        <div
                                            key={group.farmerId}
                                            className="flex justify-between text-gray-600 text-sm"
                                        >
                                            <span>
                                                {group.farmerName} delivery fee
                                            </span>
                                            <span
                                                className={
                                                    !isDeliveryAvailable()
                                                        ? "text-gray-400"
                                                        : ""
                                                }
                                            >
                                                {!isDeliveryAvailable()
                                                    ? "TBD"
                                                    : `₱${group.deliveryCost.toFixed(
                                                          2
                                                      )}`}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                <div className="border-t border-gray-200 pt-2">
                                    <div className="flex justify-between font-bold text-lg text-gray-800">
                                        <span>Total</span>
                                        <span>
                                            ₱
                                            {(
                                                getTotalPrice() +
                                                (isDeliveryAvailable()
                                                    ? farmerGroups.reduce(
                                                          (sum, g) =>
                                                              sum +
                                                              g.deliveryCost,
                                                          0
                                                      )
                                                    : 0)
                                            ).toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {!isDeliveryAvailable() && (
                                <div className="text-center text-orange-600 text-xs">
                                    * Delivery fees apply only when minimum
                                    quantities are met per farmer
                                </div>
                            )}
                        </div>

                        {/* Checkout Button */}
                        <div className="sticky bottom-20 bg-white rounded-lg shadow-lg p-4 border-t border-gray-200">
                            <button
                                onClick={handleCheckout}
                                disabled={hasInvalidItems}
                                className={`w-full py-3 rounded-lg font-semibold flex items-center justify-center gap-2 ${
                                    hasInvalidItems
                                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                        : "bg-primary text-white hover:bg-primary-dark transition-colors"
                                }`}
                            >
                                <Icon
                                    icon="mingcute:wallet-3-line"
                                    width="20"
                                    height="20"
                                />
                                Proceed to Checkout
                            </button>
                            <p className="text-center text-xs mt-2">
                                {hasInvalidItems ? (
                                    <span className="text-red-500">
                                        Some items are no longer available.
                                        Please remove them to continue.
                                    </span>
                                ) : (
                                    <span className="text-gray-500">
                                        {isDeliveryAvailable()
                                            ? "Home delivery & farm pickup available for all items"
                                            : "Farm pickup available • Some deliveries need min. quantities"}
                                    </span>
                                )}
                            </p>
                        </div>
                    </>
                )}
            </div>
            <NavigationBar />
            <Modal
                isOpen={modal.open}
                type={modal.type}
                title={modal.title}
                message={modal.message}
                onConfirm={modal.onConfirm}
                onCancel={() => setModal((prev) => ({ ...prev, open: false }))}
            />
        </div>
    );
}

export default Cart;
