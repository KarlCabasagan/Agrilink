import { useState, useContext, useEffect } from "react";
import { Icon } from "@iconify/react";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../../App";
import NavigationBar from "../../components/NavigationBar";
import Modal from "../../components/Modal";
import supabase from "../../SupabaseClient";

function Checkout() {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();
    const { cartItems = [], totalAmount = 0 } = location.state || {};

    const [loading, setLoading] = useState(false);
    const [profileLoading, setProfileLoading] = useState(true);
    const [orderPlaced, setOrderPlaced] = useState(false);
    const [orderId, setOrderId] = useState("");

    // Modal state
    const [modal, setModal] = useState({
        open: false,
        type: "info",
        title: "",
        message: "",
        onConfirm: () => setModal((prev) => ({ ...prev, open: false })),
    });
    const [currentCartItems, setCurrentCartItems] = useState(
        cartItems.map((item) => ({
            ...item,
            farmerName: item.farmerName || "Unknown Farmer",
            farmerId: item.farmerId || `farmer_${item.id}`,
            farmerAddress: item.farmerAddress || "Location not available",
            minimumOrderQuantity: item.minimumOrderQuantity || 1.0,
            deliveryCost: item.deliveryCost || 50,
        }))
    );

    // Group cart items by farmer
    const groupedByFarmer = currentCartItems.reduce((groups, item) => {
        const farmerId = item.farmerId;
        if (!groups[farmerId]) {
            groups[farmerId] = {
                farmerName: item.farmerName,
                farmerId: farmerId,
                farmerAddress: item.farmerAddress || "Location not available",
                items: [],
                totalQuantity: 0,
                totalPrice: 0,
                minimumOrderQuantity: item.minimumOrderQuantity || 1.0,
                deliveryCost: item.deliveryCost || 50,
            };
        }
        groups[farmerId].items.push(item);
        groups[farmerId].totalQuantity += item.quantity;
        groups[farmerId].totalPrice += item.price * item.quantity;
        return groups;
    }, {});

    const farmerGroups = Object.values(groupedByFarmer);

    const [formData, setFormData] = useState({
        address: "",
        city: "Iligan City",
        province: "Lanao del Norte",
        postalCode: "9200",
        deliveryMethod: "pickup", // "delivery" or "pickup" - pickup is now default
        paymentMethod: "cod",
        notes: "",
    });

    const [errors, setErrors] = useState({});

    // Modal helper function
    const showModal = (type, title, message, onConfirm = null) => {
        setModal({
            open: true,
            type,
            title,
            message,
            onConfirm:
                onConfirm ||
                (() => setModal((prev) => ({ ...prev, open: false }))),
        });
    };

    // Helper functions to manage cart items and check delivery eligibility
    const removeItemFromCart = (itemId) => {
        const updatedItems = currentCartItems.filter(
            (item) => item.id !== itemId
        );
        setCurrentCartItems(updatedItems);
    };

    const updateItemQuantity = (itemId, newQuantity) => {
        const updatedItems = currentCartItems.map((item) =>
            item.id === itemId
                ? { ...item, quantity: Math.max(0.1, newQuantity) }
                : item
        );
        setCurrentCartItems(updatedItems);
    };

    const autoAdjustQuantityForDelivery = (itemId, farmerId) => {
        const farmerGroup = groupedByFarmer[farmerId];
        if (!farmerGroup) return;

        const shortage =
            farmerGroup.minimumOrderQuantity - farmerGroup.totalQuantity;
        if (shortage <= 0) return;

        // Find the specific item and increase its quantity
        const targetItem = farmerGroup.items.find((item) => item.id === itemId);
        if (targetItem) {
            const newQuantity = Math.min(
                targetItem.quantity + shortage,
                targetItem.stock || 999 // Use stock limit or fallback to 999
            );
            updateItemQuantity(itemId, newQuantity);
        }
    };

    const getUpdatedTotalAmount = () => {
        return currentCartItems.reduce(
            (total, item) => total + item.price * item.quantity,
            0
        );
    };

    const getIneligibleFarmers = () => {
        if (formData.deliveryMethod !== "delivery") return [];
        return farmerGroups.filter(
            (farmer) => farmer.totalQuantity < farmer.minimumOrderQuantity
        );
    };

    const isCheckoutEnabled = () => {
        if (currentCartItems.length === 0) return false;
        if (formData.deliveryMethod === "delivery") {
            return getIneligibleFarmers().length === 0;
        }
        return true; // Pickup doesn't have minimum quantity restrictions
    };

    const totalPossibleDeliveryFee = farmerGroups.reduce(
        (total, farmer) => total + farmer.deliveryCost,
        0
    );

    const deliveryFee =
        formData.deliveryMethod === "delivery" ? totalPossibleDeliveryFee : 0.0;

    const hasIneligibleFarmers = getIneligibleFarmers().length > 0;
    const finalTotal = getUpdatedTotalAmount() + deliveryFee;

    // Fetch user profile data and validate completeness
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

                if (data) {
                    // Check if profile is complete
                    const isProfileComplete =
                        data.name && data.contact && data.address;

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

                    // Profile is complete, no need to populate form fields since we're removing the contact section
                    // Just store the profile data for order processing
                    setFormData((prev) => ({
                        ...prev,
                        // Remove the form field population since we're removing the contact section
                    }));
                }
            } catch (error) {
                console.error("Error fetching profile:", error);
                showModal(
                    "error",
                    "Profile Error",
                    "Error checking profile information. Please try again.",
                    () => {
                        setModal((prev) => ({ ...prev, open: false }));
                        navigate("/profile");
                    }
                );
            } finally {
                setProfileLoading(false);
            }
        };

        fetchUserProfile();
    }, [user, navigate]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors((prev) => ({
                ...prev,
                [name]: "",
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        // Since we're using user's profile address, no validation needed for delivery address
        // All delivery method selections are valid

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        if (!currentCartItems || currentCartItems.length === 0) {
            showModal("warning", "Empty Cart", "No items to checkout", () => {
                setModal((prev) => ({ ...prev, open: false }));
                navigate("/cart");
            });
            return;
        }

        // Check for delivery eligibility
        if (
            formData.deliveryMethod === "delivery" &&
            getIneligibleFarmers().length > 0
        ) {
            showModal(
                "warning",
                "Delivery Requirements",
                "Some farmers don't meet minimum quantity requirements for delivery. Please add more items or choose pickup instead.",
                () => setModal((prev) => ({ ...prev, open: false }))
            );
            return;
        }

        setLoading(true);

        try {
            const createdOrders = [];

            // Create separate orders for each farmer/seller
            for (const farmerGroup of farmerGroups) {
                const farmerItems = farmerGroup.items;

                // Calculate delivery fee for this farmer
                const deliveryFee =
                    formData.deliveryMethod === "delivery"
                        ? farmerGroup.deliveryCost
                        : 0;

                // Create the main order record with new schema
                const orderData = {
                    user_id: user.id,
                    seller_id: farmerGroup.farmerId,
                    delivery_method_id:
                        formData.deliveryMethod === "delivery" ? 2 : 1, // Map to delivery_methods table
                    payment_method_id: formData.paymentMethod === "cod" ? 1 : 2, // Map to payment_methods table
                    status_id: 3, // "pending" status from statuses table
                    delivery_fee_at_order: deliveryFee,
                };

                console.log(
                    "Creating order for farmer:",
                    farmerGroup.farmerName,
                    orderData
                );

                const { data: orderResult, error: orderError } = await supabase
                    .from("orders")
                    .insert(orderData)
                    .select()
                    .single();

                if (orderError) {
                    console.error("Error creating order:", orderError);
                    throw orderError;
                }

                const orderId = orderResult.id;
                console.log("Order created with ID:", orderId);

                // Create order items for this farmer's items
                const orderItems = farmerItems.map((item) => ({
                    order_id: orderId,
                    product_id: item.id,
                    name_at_purchase: item.name,
                    quantity: item.quantity,
                    price_at_purchase: item.price,
                }));

                const { error: itemsError } = await supabase
                    .from("order_items")
                    .insert(orderItems);

                if (itemsError) {
                    console.error("Error creating order items:", itemsError);
                    // Clean up the order if items creation fails
                    await supabase.from("orders").delete().eq("id", orderId);
                    throw itemsError;
                }

                createdOrders.push(orderId);
            }

            console.log("All orders created successfully:", createdOrders);

            // Clear the cart after successful order - need to go through carts table
            // First get the user's cart
            const { data: userCart } = await supabase
                .from("carts")
                .select("id")
                .eq("user_id", user.id)
                .single();

            if (userCart) {
                const { error: cartClearError } = await supabase
                    .from("cart_items")
                    .delete()
                    .eq("cart_id", userCart.id);

                if (cartClearError) {
                    console.error("Error clearing cart:", cartClearError);
                    // Don't throw error here, order was successful
                }
            }

            // Update product stock
            for (const item of currentCartItems) {
                const { error: stockError } = await supabase
                    .from("products")
                    .update({ stock: item.stock - item.quantity })
                    .eq("id", item.id);

                if (stockError) {
                    console.error(
                        "Error updating stock for product",
                        item.id,
                        ":",
                        stockError
                    );
                    // Don't throw error, order was successful
                }
            }

            // Set order success
            setOrderId(`ORD-${orderId}`);
            setOrderPlaced(true);
        } catch (error) {
            console.error("Error placing order:", error);
            showModal(
                "error",
                "Order Failed",
                `Failed to place order: ${
                    error.message || "Please try again."
                }`,
                () => setModal((prev) => ({ ...prev, open: false }))
            );
        } finally {
            setLoading(false);
        }
    };

    const handleContinueShopping = () => {
        navigate("/");
    };

    const handleViewOrders = () => {
        navigate("/orders");
    };

    // Order Success Screen
    if (orderPlaced) {
        return (
            <div className="min-h-screen w-full flex flex-col relative items-center scrollbar-hide bg-background overflow-x-hidden text-text pb-20">
                <div className="fixed top-0 left-0 w-full bg-white shadow-md z-50 px-4 py-3">
                    <h1 className="text-lg font-semibold text-primary text-center">
                        Order Placed
                    </h1>
                </div>

                <div className="w-full max-w-2xl mx-4 sm:mx-auto my-16 flex items-center justify-center min-h-[60vh]">
                    <div className="bg-white rounded-lg shadow-md p-8 text-center">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Icon
                                icon="mingcute:check-circle-fill"
                                width="40"
                                height="40"
                                className="text-green-600"
                            />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-3">
                            Order Placed Successfully!
                        </h2>
                        <p className="text-gray-600 mb-2">
                            Your order{" "}
                            <span className="font-semibold text-primary">
                                #{orderId}
                            </span>{" "}
                            has been placed.
                        </p>
                        <p className="text-gray-600 mb-6">
                            You will receive a confirmation email shortly with
                            tracking details.
                        </p>

                        <div className="bg-gray-50 rounded-lg p-4 mb-6">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">
                                    Order Total:
                                </span>
                                <span className="font-bold text-lg text-primary">
                                    ₱{finalTotal.toFixed(2)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-sm mt-1">
                                <span className="text-gray-600">
                                    Payment Method:
                                </span>
                                <span className="text-gray-800">
                                    {formData.paymentMethod === "cod"
                                        ? "Cash on Delivery"
                                        : "Online Payment"}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-sm mt-1">
                                <span className="text-gray-600">
                                    Delivery Method:
                                </span>
                                <span className="text-gray-800">
                                    {formData.deliveryMethod === "delivery"
                                        ? "Home Delivery"
                                        : "Farm Pickup"}
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={handleViewOrders}
                                className="flex-1 bg-primary text-white py-3 px-6 rounded-lg hover:bg-primary-dark transition-colors font-medium"
                            >
                                View My Orders
                            </button>
                            <button
                                onClick={handleContinueShopping}
                                className="flex-1 border border-primary text-primary py-3 px-6 rounded-lg hover:bg-primary/5 transition-colors font-medium"
                            >
                                Continue Shopping
                            </button>
                        </div>
                    </div>
                </div>

                <NavigationBar />
            </div>
        );
    }

    // Redirect if no cart items
    if (!currentCartItems || currentCartItems.length === 0) {
        return (
            <div className="min-h-screen w-full flex flex-col relative items-center scrollbar-hide bg-background overflow-x-hidden text-text pb-20">
                <div className="fixed top-0 left-0 w-full bg-white shadow-md z-50 px-4 py-3">
                    <h1 className="text-lg font-semibold text-primary text-center">
                        Checkout
                    </h1>
                </div>

                <div className="w-full max-w-2xl mx-4 sm:mx-auto my-16 flex items-center justify-center min-h-[60vh]">
                    <div className="bg-white rounded-lg shadow-md p-8 text-center">
                        <Icon
                            icon="mingcute:shopping-cart-1-line"
                            width="80"
                            height="80"
                            className="text-gray-300 mb-4 mx-auto"
                        />
                        <h2 className="text-xl font-bold text-gray-600 mb-2">
                            No items to checkout
                        </h2>
                        <p className="text-gray-500 mb-6">
                            Please add items to your cart before proceeding to
                            checkout.
                        </p>
                        <button
                            onClick={() => navigate("/cart")}
                            className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-dark transition-colors font-medium"
                        >
                            Back to Cart
                        </button>
                    </div>
                </div>

                <NavigationBar />
            </div>
        );
    }

    if (profileLoading) {
        return (
            <div className="min-h-screen w-full flex flex-col relative items-center scrollbar-hide bg-background overflow-x-hidden text-text pb-20">
                <div className="fixed top-0 left-0 w-full bg-white shadow-md z-50 px-4 py-3">
                    <h1 className="text-lg font-semibold text-primary text-center">
                        Checkout
                    </h1>
                </div>
                <div className="w-full max-w-2xl mx-4 sm:mx-auto my-16 flex items-center justify-center min-h-[60vh]">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
                </div>
                <NavigationBar />
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full flex flex-col relative items-center scrollbar-hide bg-background overflow-x-hidden text-text pb-20">
            {/* Header */}
            <div className="fixed top-0 left-0 w-full bg-white shadow-md z-50 px-4 py-3">
                <div className="flex items-center">
                    <button
                        onClick={() => navigate("/cart")}
                        className="text-primary hover:text-primary-dark mr-3"
                    >
                        <Icon
                            icon="mingcute:left-line"
                            width="24"
                            height="24"
                        />
                    </button>
                    <h1 className="text-lg font-semibold text-primary">
                        Checkout
                    </h1>
                </div>
            </div>

            <div className="w-full max-w-7xl mx-4 sm:mx-auto my-16">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                        {/* Checkout Form */}
                        <div className="lg:col-span-3 space-y-6">
                            {/* Delivery Method */}
                            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                                <div className="p-6 border-b border-gray-200">
                                    <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                        <Icon
                                            icon="mingcute:truck-line"
                                            width="20"
                                            height="20"
                                            className="text-primary"
                                        />
                                        Delivery Method
                                    </h2>
                                </div>
                                <div className="p-6 space-y-3">
                                    <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                                        <input
                                            type="radio"
                                            name="deliveryMethod"
                                            value="pickup"
                                            checked={
                                                formData.deliveryMethod ===
                                                "pickup"
                                            }
                                            onChange={handleInputChange}
                                            className="mr-3 text-primary focus:ring-primary"
                                        />
                                        <div className="flex items-center gap-3 flex-1">
                                            <Icon
                                                icon="mingcute:location-line"
                                                width="24"
                                                height="24"
                                                className="text-green-600"
                                            />
                                            <div>
                                                <span className="font-medium text-gray-800">
                                                    Farm Pickup
                                                </span>
                                                <p className="text-sm text-gray-600">
                                                    Pick up your order directly
                                                    from the farm
                                                </p>
                                                <p className="text-sm text-green-600 font-medium">
                                                    Free pickup
                                                </p>
                                            </div>
                                        </div>
                                    </label>

                                    <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                                        <input
                                            type="radio"
                                            name="deliveryMethod"
                                            value="delivery"
                                            checked={
                                                formData.deliveryMethod ===
                                                "delivery"
                                            }
                                            onChange={handleInputChange}
                                            className="mr-3 text-primary focus:ring-primary"
                                        />
                                        <div className="flex items-center gap-3 flex-1">
                                            <Icon
                                                icon="mingcute:home-line"
                                                width="24"
                                                height="24"
                                                className="text-blue-600"
                                            />
                                            <div>
                                                <span className="font-medium text-gray-800">
                                                    Home Delivery
                                                </span>
                                                <p className="text-sm text-gray-600">
                                                    Get your order delivered to
                                                    your doorstep
                                                </p>
                                                <p className="text-sm text-primary font-medium">
                                                    + ₱
                                                    {totalPossibleDeliveryFee.toFixed(
                                                        2
                                                    )}{" "}
                                                    delivery fee
                                                    {hasIneligibleFarmers && (
                                                        <span className="text-orange-600 text-xs ml-1">
                                                            (TBD - min. order
                                                            not met)
                                                        </span>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            {/* Address Information - Only show for delivery */}
                            {/* COMMENTED OUT: Using user's profile address instead of collecting it here
                            {formData.deliveryMethod === "delivery" && (
                                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                                    <div className="p-6 border-b border-gray-200">
                                        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                            <Icon
                                                icon="mingcute:location-line"
                                                width="20"
                                                height="20"
                                                className="text-primary"
                                            />
                                            Delivery Address
                                        </h2>
                                    </div>
                                    <div className="p-6 space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Complete Address *
                                            </label>
                                            <div className="mb-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                                <div className="flex items-start gap-2">
                                                    <Icon
                                                        icon="mingcute:information-line"
                                                        width="16"
                                                        height="16"
                                                        className="text-blue-600 mt-0.5 flex-shrink-0"
                                                    />
                                                    <div className="text-sm text-blue-800">
                                                        <strong>
                                                            Please be specific
                                                            with your address:
                                                        </strong>{" "}
                                                        Include your house
                                                        number, street name,
                                                        subdivision/village
                                                        name, and other
                                                        landmarks to help our
                                                        farmers find your
                                                        location easily.
                                                    </div>
                                                </div>
                                            </div>
                                            <textarea
                                                name="address"
                                                value={formData.address}
                                                onChange={handleInputChange}
                                                rows="3"
                                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                                                    errors.address
                                                        ? "border-red-300"
                                                        : "border-gray-300"
                                                }`}
                                                placeholder="e.g. House #123, Mabuhay Street, Green Valley Subdivision, near SM Mall"
                                            />
                                            {errors.address && (
                                                <p className="text-red-600 text-sm mt-1">
                                                    {errors.address}
                                                </p>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    City *
                                                </label>
                                                <input
                                                    type="text"
                                                    name="city"
                                                    value={formData.city}
                                                    onChange={handleInputChange}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-gray-100"
                                                    placeholder="City"
                                                    readOnly
                                                />
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Currently serving Iligan
                                                    City only
                                                </p>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Province *
                                                </label>
                                                <input
                                                    type="text"
                                                    name="province"
                                                    value={formData.province}
                                                    onChange={handleInputChange}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-gray-100"
                                                    placeholder="Province"
                                                    readOnly
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Postal Code
                                                </label>
                                                <input
                                                    type="text"
                                                    name="postalCode"
                                                    value={formData.postalCode}
                                                    onChange={handleInputChange}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-gray-100"
                                                    placeholder="Postal Code"
                                                    readOnly
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            */}

                            {/* Pickup Information - Only show for pickup */}
                            {formData.deliveryMethod === "pickup" && (
                                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                                    <div className="p-6 border-b border-gray-200">
                                        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                            <Icon
                                                icon="mingcute:location-line"
                                                width="20"
                                                height="20"
                                                className="text-primary"
                                            />
                                            Pickup Information
                                        </h2>
                                    </div>
                                    <div className="p-6">
                                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                            <div className="flex items-start gap-3">
                                                <Icon
                                                    icon="mingcute:information-line"
                                                    width="24"
                                                    height="24"
                                                    className="text-green-600 mt-0.5"
                                                />
                                                <div>
                                                    <h3 className="font-semibold text-green-800 mb-1">
                                                        Farm Pickup Instructions
                                                    </h3>
                                                    <ul className="text-green-700 text-sm space-y-1">
                                                        <li>
                                                            • You will receive
                                                            specific farm
                                                            location details
                                                            after order
                                                            confirmation
                                                        </li>
                                                        <li>
                                                            • Pickup hours: 7:00
                                                            AM - 5:00 PM (Monday
                                                            to Saturday)
                                                        </li>
                                                        <li>
                                                            • Please bring a
                                                            valid ID and your
                                                            order confirmation
                                                        </li>
                                                        <li>
                                                            • Contact the farmer
                                                            directly for any
                                                            pickup arrangements
                                                        </li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Payment Method */}
                            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                                <div className="p-6 border-b border-gray-200">
                                    <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                        <Icon
                                            icon="mingcute:wallet-3-line"
                                            width="20"
                                            height="20"
                                            className="text-primary"
                                        />
                                        Payment Method
                                    </h2>
                                </div>
                                <div className="p-6 space-y-3">
                                    <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            value="cod"
                                            checked={
                                                formData.paymentMethod === "cod"
                                            }
                                            onChange={handleInputChange}
                                            className="mr-3 text-primary focus:ring-primary"
                                        />
                                        <div className="flex items-center gap-3">
                                            <Icon
                                                icon="mingcute:cash-line"
                                                width="24"
                                                height="24"
                                                className="text-green-600"
                                            />
                                            <div>
                                                <span className="font-medium text-gray-800">
                                                    Cash on{" "}
                                                    {formData.deliveryMethod ===
                                                    "delivery"
                                                        ? "Delivery"
                                                        : "Pickup"}
                                                </span>
                                                <p className="text-sm text-gray-600">
                                                    Pay when your order{" "}
                                                    {formData.deliveryMethod ===
                                                    "delivery"
                                                        ? "arrives"
                                                        : "is picked up"}
                                                </p>
                                            </div>
                                        </div>
                                    </label>

                                    <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors opacity-50">
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            value="online"
                                            disabled
                                            className="mr-3 text-primary focus:ring-primary"
                                        />
                                        <div className="flex items-center gap-3">
                                            <Icon
                                                icon="mingcute:credit-card-line"
                                                width="24"
                                                height="24"
                                                className="text-blue-600"
                                            />
                                            <div>
                                                <span className="font-medium text-gray-800">
                                                    Online Payment
                                                </span>
                                                <p className="text-sm text-gray-600">
                                                    Coming soon
                                                </p>
                                            </div>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            {/* Order Notes */}
                            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                                <div className="p-6 border-b border-gray-200">
                                    <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                        <Icon
                                            icon="mingcute:edit-line"
                                            width="20"
                                            height="20"
                                            className="text-primary"
                                        />
                                        Order Notes (Optional)
                                    </h2>
                                </div>
                                <div className="p-6">
                                    <textarea
                                        name="notes"
                                        value={formData.notes}
                                        onChange={handleInputChange}
                                        rows="3"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                        placeholder={`Any special instructions for your ${
                                            formData.deliveryMethod ===
                                            "delivery"
                                                ? "delivery"
                                                : "pickup"
                                        }...`}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Order Summary */}
                        <div className="lg:col-span-2">
                            <div className="bg-white rounded-lg shadow-md overflow-hidden sticky top-20">
                                <div className="p-6 border-b border-gray-200">
                                    <h2 className="text-lg font-semibold text-gray-800">
                                        Order Summary
                                    </h2>
                                </div>
                                <div className="p-6">
                                    {/* Delivery Eligibility Warning */}
                                    {formData.deliveryMethod === "delivery" &&
                                        getIneligibleFarmers().length > 0 && (
                                            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                                                <div className="flex items-start gap-3">
                                                    <Icon
                                                        icon="mingcute:alert-triangle-line"
                                                        width="20"
                                                        height="20"
                                                        className="text-red-600 mt-0.5"
                                                    />
                                                    <div className="flex-1">
                                                        <h4 className="font-medium text-red-800 mb-1">
                                                            Delivery
                                                            Requirements Not Met
                                                        </h4>
                                                        <p className="text-red-700 text-sm mb-2">
                                                            Some farmers require
                                                            minimum order
                                                            quantities for
                                                            delivery. Use the
                                                            quick-add buttons
                                                            below or switch to
                                                            pickup.
                                                        </p>
                                                        <div className="text-red-600 text-xs">
                                                            {getIneligibleFarmers().map(
                                                                (
                                                                    farmer,
                                                                    index
                                                                ) => (
                                                                    <p
                                                                        key={
                                                                            farmer.farmerId
                                                                        }
                                                                    >
                                                                        •{" "}
                                                                        <strong>
                                                                            {
                                                                                farmer.farmerName
                                                                            }
                                                                            :
                                                                        </strong>{" "}
                                                                        Need{" "}
                                                                        {(
                                                                            farmer.minimumOrderQuantity -
                                                                            farmer.totalQuantity
                                                                        ).toFixed(
                                                                            1
                                                                        )}
                                                                        kg more
                                                                    </p>
                                                                )
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                    {/* Items Grouped by Farmer */}
                                    <div className="space-y-4 mb-4">
                                        {farmerGroups.map((farmer) => {
                                            const isIneligible =
                                                formData.deliveryMethod ===
                                                    "delivery" &&
                                                farmer.totalQuantity <
                                                    farmer.minimumOrderQuantity;

                                            return (
                                                <div
                                                    key={farmer.farmerId}
                                                    className={`border rounded-lg overflow-hidden ${
                                                        isIneligible
                                                            ? "border-red-200 bg-red-50"
                                                            : "border-gray-200 bg-gray-50"
                                                    }`}
                                                >
                                                    {/* Farmer Header */}
                                                    <div
                                                        className={`p-3 border-b ${
                                                            isIneligible
                                                                ? "border-red-200 bg-red-100"
                                                                : "border-gray-200 bg-gray-100"
                                                        }`}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <Icon
                                                                    icon="mingcute:user-3-line"
                                                                    width="16"
                                                                    height="16"
                                                                    className={
                                                                        isIneligible
                                                                            ? "text-red-600"
                                                                            : "text-gray-600"
                                                                    }
                                                                />
                                                                <div>
                                                                    <h4 className="font-semibold text-sm text-gray-800">
                                                                        {
                                                                            farmer.farmerName
                                                                        }
                                                                    </h4>
                                                                    <p className="text-xs text-gray-600 flex items-center gap-1">
                                                                        <Icon
                                                                            icon="mingcute:location-line"
                                                                            width="10"
                                                                            height="10"
                                                                        />
                                                                        {
                                                                            farmer.farmerAddress
                                                                        }
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-xs font-medium text-primary">
                                                                    ₱
                                                                    {farmer.totalPrice.toFixed(
                                                                        2
                                                                    )}
                                                                </p>
                                                                <p className="text-xs text-gray-500">
                                                                    Min:{" "}
                                                                    {
                                                                        farmer.minimumOrderQuantity
                                                                    }{" "}
                                                                    | Fee: ₱
                                                                    {
                                                                        farmer.deliveryCost
                                                                    }
                                                                </p>
                                                                {isIneligible && (
                                                                    <p className="text-xs text-red-600">
                                                                        {(
                                                                            farmer.minimumOrderQuantity -
                                                                            farmer.totalQuantity
                                                                        ).toFixed(
                                                                            1
                                                                        )}
                                                                        kg
                                                                        needed
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Quick Add Info for Delivery */}
                                                        {isIneligible && (
                                                            <div className="mt-2 bg-orange-50 border border-orange-200 rounded-lg p-3">
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <Icon
                                                                        icon="mingcute:information-line"
                                                                        width="14"
                                                                        height="14"
                                                                        className="text-orange-600"
                                                                    />
                                                                    <span className="text-xs text-orange-700 font-medium">
                                                                        Need{" "}
                                                                        {(
                                                                            farmer.minimumOrderQuantity -
                                                                            farmer.totalQuantity
                                                                        ).toFixed(
                                                                            1
                                                                        )}
                                                                        kg more
                                                                        for
                                                                        delivery
                                                                    </span>
                                                                </div>
                                                                <p className="text-xs text-orange-600">
                                                                    Choose a
                                                                    product
                                                                    below to
                                                                    auto-add the
                                                                    required
                                                                    quantity
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Farmer's Items */}
                                                    <div className="divide-y divide-gray-100">
                                                        {farmer.items.map(
                                                            (item) => (
                                                                <div
                                                                    key={
                                                                        item.id
                                                                    }
                                                                    className="p-3"
                                                                >
                                                                    <div className="flex items-center gap-3">
                                                                        <img
                                                                            src={
                                                                                item.image
                                                                            }
                                                                            alt={
                                                                                item.name
                                                                            }
                                                                            className="w-10 h-10 object-cover rounded-lg"
                                                                        />
                                                                        <div className="flex-1">
                                                                            <h5 className="font-medium text-gray-800 text-sm line-clamp-1">
                                                                                {
                                                                                    item.name
                                                                                }
                                                                            </h5>
                                                                            <p className="text-xs text-gray-500">
                                                                                ₱
                                                                                {item.price.toFixed(
                                                                                    2
                                                                                )}

                                                                                /
                                                                                {item.unit ||
                                                                                    "kg"}

                                                                                ×{" "}
                                                                                {
                                                                                    item.quantity
                                                                                }{" "}
                                                                                {item.unit ||
                                                                                    "kg"}
                                                                            </p>
                                                                        </div>
                                                                        <div className="text-right flex flex-col items-end gap-2">
                                                                            <p className="text-sm font-medium text-gray-800">
                                                                                ₱
                                                                                {(
                                                                                    item.price *
                                                                                    item.quantity
                                                                                ).toFixed(
                                                                                    2
                                                                                )}
                                                                            </p>
                                                                            <div className="flex items-center gap-1">
                                                                                {/* Auto-adjust button for ineligible farmers */}
                                                                                {isIneligible && (
                                                                                    <button
                                                                                        onClick={() =>
                                                                                            autoAdjustQuantityForDelivery(
                                                                                                item.id,
                                                                                                farmer.farmerId
                                                                                            )
                                                                                        }
                                                                                        className="bg-primary text-white text-xs px-2 py-1 rounded-md hover:bg-primary-dark transition-colors flex items-center gap-1"
                                                                                        title={`Add ${(
                                                                                            farmer.minimumOrderQuantity -
                                                                                            farmer.totalQuantity
                                                                                        ).toFixed(
                                                                                            1
                                                                                        )}kg to this product for delivery`}
                                                                                    >
                                                                                        <Icon
                                                                                            icon="mingcute:add-line"
                                                                                            width="12"
                                                                                            height="12"
                                                                                        />

                                                                                        +
                                                                                        {(
                                                                                            farmer.minimumOrderQuantity -
                                                                                            farmer.totalQuantity
                                                                                        ).toFixed(
                                                                                            1
                                                                                        )}
                                                                                        kg
                                                                                    </button>
                                                                                )}
                                                                                {/* Remove button */}
                                                                                <button
                                                                                    onClick={() =>
                                                                                        removeItemFromCart(
                                                                                            item.id
                                                                                        )
                                                                                    }
                                                                                    className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                                                                    title="Remove item"
                                                                                >
                                                                                    <Icon
                                                                                        icon="mingcute:delete-2-line"
                                                                                        width="14"
                                                                                        height="14"
                                                                                    />
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Pricing */}
                                    <div className="space-y-2 border-t border-gray-200 pt-4">
                                        <div className="flex justify-between text-gray-600">
                                            <span>Subtotal</span>
                                            <span>
                                                ₱
                                                {getUpdatedTotalAmount().toFixed(
                                                    2
                                                )}
                                            </span>
                                        </div>

                                        {formData.deliveryMethod ===
                                            "delivery" && (
                                            <div className="space-y-1">
                                                {farmerGroups.map((farmer) => (
                                                    <div
                                                        key={farmer.farmerId}
                                                        className="flex justify-between text-gray-600 text-sm"
                                                    >
                                                        <span>
                                                            {farmer.farmerName}{" "}
                                                            delivery
                                                        </span>
                                                        <span>
                                                            {farmer.totalQuantity >=
                                                            farmer.minimumOrderQuantity
                                                                ? `₱${farmer.deliveryCost.toFixed(
                                                                      2
                                                                  )}`
                                                                : "Not eligible"}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {formData.deliveryMethod ===
                                            "pickup" && (
                                            <div className="flex justify-between text-gray-600">
                                                <span>Pickup Fee</span>
                                                <span>Free</span>
                                            </div>
                                        )}

                                        <div className="flex justify-between font-bold text-lg text-gray-800 border-t border-gray-200 pt-2">
                                            <span>Total</span>
                                            <span>
                                                ₱{finalTotal.toFixed(2)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Place Order Button */}
                                    <button
                                        type="submit"
                                        disabled={
                                            loading || !isCheckoutEnabled()
                                        }
                                        className={`w-full py-3 rounded-lg font-semibold transition-colors mt-6 flex items-center justify-center gap-2 ${
                                            loading || !isCheckoutEnabled()
                                                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                                : "bg-primary text-white hover:bg-primary-dark"
                                        }`}
                                    >
                                        {loading ? (
                                            <>
                                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                                Placing Order...
                                            </>
                                        ) : !isCheckoutEnabled() ? (
                                            <>
                                                <Icon
                                                    icon="mingcute:alert-triangle-line"
                                                    width="20"
                                                    height="20"
                                                />
                                                {currentCartItems.length === 0
                                                    ? "Cart is Empty"
                                                    : "Adjust Quantities for Delivery"}
                                            </>
                                        ) : (
                                            <>
                                                <Icon
                                                    icon="mingcute:check-circle-line"
                                                    width="20"
                                                    height="20"
                                                />
                                                Place Order
                                            </>
                                        )}
                                    </button>

                                    {!isCheckoutEnabled() &&
                                        currentCartItems.length > 0 && (
                                            <p className="text-center text-red-600 text-xs mt-2">
                                                Some farmers don't meet delivery
                                                requirements. Use quick-add
                                                buttons above or choose pickup.
                                            </p>
                                        )}

                                    <p className="text-center text-gray-500 text-xs mt-3">
                                        By placing this order, you agree to our
                                        Terms & Conditions
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </div>

            <NavigationBar />
        </div>
    );
}

export default Checkout;
