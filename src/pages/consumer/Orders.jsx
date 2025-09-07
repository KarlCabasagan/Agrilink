import { useState, useEffect, useContext } from "react";
import { Icon } from "@iconify/react";
import { Link, useNavigate } from "react-router-dom";
import NavigationBar from "../../components/NavigationBar";
import supabase from "../../SupabaseClient";
import { AuthContext } from "../../App.jsx";

function Orders() {
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const [activeTab, setActiveTab] = useState("all");
    const [expandedOrders, setExpandedOrders] = useState({});
    const [expandedFarmers, setExpandedFarmers] = useState({});
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!user) {
            navigate("/login");
            return;
        }
        fetchOrders();
    }, [user, navigate]);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const { data: ordersData, error: ordersError } = await supabase
                .from("orders")
                .select(
                    `
                    *,
                    statuses!orders_status_id_fkey (
                        name
                    ),
                    delivery_methods!orders_delivery_method_id_fkey (
                        name
                    ),
                    payment_methods!orders_payment_method_id_fkey (
                        name
                    ),
                    profiles!orders_seller_id_fkey (
                        name,
                        address,
                        contact
                    ),
                    order_items (
                        *,
                        products (
                            *,
                            categories (
                                name
                            )
                        )
                    )
                `
                )
                .eq("user_id", user.id)
                .order("created_at", { ascending: false });

            if (ordersError) throw ordersError;

            // Transform data to match expected format
            const transformedOrders = ordersData.map((order) => {
                // Calculate total from order items (no total_amount field in new schema)
                const itemsTotal = order.order_items.reduce(
                    (sum, item) => sum + item.price_at_purchase * item.quantity,
                    0
                );
                const total = itemsTotal + (order.delivery_fee_at_order || 0);

                return {
                    id: order.id,
                    date: order.created_at,
                    status: order.statuses?.name || "unknown",
                    total: total,
                    deliveryMethod: order.delivery_methods?.name || "unknown",
                    paymentMethod: order.payment_methods?.name || "unknown",
                    deliveryFee: order.delivery_fee_at_order || 0,
                    sellerName: order.profiles?.name || "Unknown Seller",
                    sellerAddress:
                        order.profiles?.address || "Location not available",
                    sellerContact: order.profiles?.contact || "",
                    items: order.order_items.map((item) => ({
                        id: item.id,
                        name: item.name_at_purchase, // Use name_at_purchase from new schema
                        price: item.price_at_purchase, // Use price_at_purchase from new schema
                        quantity: item.quantity,
                        image:
                            item.products?.image_url ||
                            "https://via.placeholder.com/300x200?text=No+Image",
                        farmerName: order.profiles?.name || "Unknown Seller", // Single seller per order now
                        farmerId: order.seller_id,
                        farmerPhone: order.profiles?.contact || "",
                        farmerAddress:
                            order.profiles?.address || "Location not available",
                        category: item.products?.categories?.name || "Other",
                    })),
                };
            });

            setOrders(transformedOrders);
        } catch (error) {
            console.error("Error fetching orders:", error);
            setError("Failed to fetch orders. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const tabs = [
        { id: "all", label: "All Orders", count: orders.length },
        {
            id: "pending",
            label: "Pending",
            count: orders.filter((o) => o.status === "pending").length,
        },
        {
            id: "confirmed",
            label: "Confirmed",
            count: orders.filter((o) => o.status === "confirmed").length,
        },
        {
            id: "preparing",
            label: "Preparing",
            count: orders.filter((o) => o.status === "preparing").length,
        },
        {
            id: "ready for pickup",
            label: "Ready",
            count: orders.filter((o) => o.status === "ready for pickup").length,
        },
        {
            id: "completed",
            label: "Completed",
            count: orders.filter((o) => o.status === "completed").length,
        },
        {
            id: "cancelled",
            label: "Cancelled",
            count: orders.filter((o) => o.status === "cancelled").length,
        },
    ];

    const getStatusColor = (status) => {
        switch (status) {
            case "pending":
                return "text-yellow-600 bg-yellow-100";
            case "confirmed":
                return "text-blue-600 bg-blue-100";
            case "preparing":
                return "text-orange-600 bg-orange-100";
            case "ready for pickup":
                return "text-purple-600 bg-purple-100";
            case "completed":
                return "text-green-600 bg-green-100";
            case "cancelled":
                return "text-red-600 bg-red-100";
            default:
                return "text-gray-600 bg-gray-100";
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case "pending":
                return "mingcute:time-line";
            case "confirmed":
                return "mingcute:check-circle-line";
            case "preparing":
                return "mingcute:box-line";
            case "ready for pickup":
                return "mingcute:truck-line";
            case "completed":
                return "mingcute:check-circle-fill";
            case "cancelled":
                return "mingcute:close-circle-line";
            default:
                return "mingcute:package-line";
        }
    };

    const filteredOrders =
        activeTab === "all"
            ? orders
            : orders.filter((order) => order.status === activeTab);

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    const toggleOrderExpansion = (orderId) => {
        setExpandedOrders((prev) => ({
            ...prev,
            [orderId]: !prev[orderId],
        }));
    };

    const toggleFarmerExpansion = (orderId, farmerId) => {
        const key = `${orderId}_${farmerId}`;
        setExpandedFarmers((prev) => ({
            ...prev,
            [key]: prev[key] === false ? true : false,
        }));
    };

    const groupItemsByFarmer = (items) => {
        const grouped = items.reduce((groups, item) => {
            const farmerId = item.farmerId || `farmer_${item.id}`;
            const farmerName = item.farmerName;

            if (!groups[farmerId]) {
                groups[farmerId] = {
                    farmerName: farmerName,
                    farmerId: farmerId,
                    items: [],
                    totalQuantity: 0,
                    totalPrice: 0,
                };
            }

            groups[farmerId].items.push(item);
            groups[farmerId].totalQuantity += item.quantity;
            groups[farmerId].totalPrice += item.price * item.quantity;

            return groups;
        }, {});

        return Object.values(grouped);
    };

    const handleReorder = (order) => {
        console.log("Reordering:", order);
        alert("Items added to cart!");
        navigate("/cart");
    };

    const handleTrackOrder = (orderId) => {
        console.log("Tracking order:", orderId);
        alert("Order tracking feature coming soon!");
    };

    const handleCancelOrder = async (orderId) => {
        if (window.confirm("Are you sure you want to cancel this order?")) {
            try {
                const { error } = await supabase
                    .from("orders")
                    .update({
                        status_id: 8, // "cancelled" status ID from statuses table
                    })
                    .eq("id", orderId)
                    .eq("user_id", user.id);

                if (error) throw error;

                // Update local state
                setOrders((prev) =>
                    prev.map((order) =>
                        order.id === orderId
                            ? {
                                  ...order,
                                  status: "cancelled",
                              }
                            : order
                    )
                );
            } catch (error) {
                console.error("Error cancelling order:", error);
                alert("Failed to cancel order. Please try again.");
            }
        }
    };

    return (
        <div className="min-h-screen w-full flex flex-col relative items-center scrollbar-hide bg-background overflow-x-hidden text-text pb-20">
            {/* Header */}
            <div className="fixed top-0 left-0 w-full bg-white shadow-md z-50 px-4 py-3">
                <div className="flex items-center">
                    <button
                        onClick={() => navigate(-1)}
                        className="text-primary hover:text-primary-dark mr-3"
                    >
                        <Icon
                            icon="mingcute:left-line"
                            width="24"
                            height="24"
                        />
                    </button>
                    <h1 className="text-lg font-semibold text-primary">
                        My Orders
                    </h1>
                </div>
            </div>

            <div className="w-full max-w-4xl mx-4 sm:mx-auto my-16">
                {/* Tabs */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
                    <div className="flex overflow-x-auto">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 min-w-fit px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                                    activeTab === tab.id
                                        ? "text-primary border-primary bg-primary/5"
                                        : "text-gray-500 border-transparent hover:text-gray-700"
                                }`}
                            >
                                <div className="flex items-center justify-center gap-2">
                                    <span>{tab.label}</span>
                                    {tab.count > 0 && (
                                        <span
                                            className={`px-2 py-1 text-xs rounded-full ${
                                                activeTab === tab.id
                                                    ? "bg-primary text-white"
                                                    : "bg-gray-200 text-gray-600"
                                            }`}
                                        >
                                            {tab.count}
                                        </span>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Orders List */}
                {loading ? (
                    <div className="bg-white rounded-lg shadow-md p-8 text-center">
                        <Icon
                            icon="mingcute:loading-line"
                            width="40"
                            height="40"
                            className="text-primary mx-auto mb-4 animate-spin"
                        />
                        <p className="text-gray-600">Loading your orders...</p>
                    </div>
                ) : error ? (
                    <div className="bg-white rounded-lg shadow-md p-8 text-center">
                        <Icon
                            icon="mingcute:alert-triangle-line"
                            width="60"
                            height="60"
                            className="text-red-500 mx-auto mb-4"
                        />
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">
                            Error Loading Orders
                        </h3>
                        <p className="text-gray-500 mb-4">{error}</p>
                        <button
                            onClick={fetchOrders}
                            className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-dark transition-colors font-medium inline-flex items-center gap-2"
                        >
                            <Icon
                                icon="mingcute:refresh-1-line"
                                width="20"
                                height="20"
                            />
                            Try Again
                        </button>
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-md p-8 text-center">
                        <Icon
                            icon="mingcute:package-line"
                            width="80"
                            height="80"
                            className="text-gray-300 mb-4 mx-auto"
                        />
                        <h3 className="text-xl font-semibold text-gray-600 mb-2">
                            No orders found
                        </h3>
                        <p className="text-gray-500 mb-6">
                            {activeTab === "all"
                                ? "You haven't placed any orders yet."
                                : `No ${activeTab} orders found.`}
                        </p>
                        <Link
                            to="/"
                            className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-dark transition-colors font-medium inline-flex items-center gap-2"
                        >
                            <Icon
                                icon="mingcute:shopping-bag-1-line"
                                width="20"
                                height="20"
                            />
                            Start Shopping
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredOrders.map((order) => {
                            const isExpanded = expandedOrders[order.id];
                            const farmerGroups = groupItemsByFarmer(
                                order.items
                            );

                            return (
                                <div
                                    key={order.id}
                                    className="bg-white rounded-lg shadow-md overflow-hidden"
                                >
                                    {/* Order Header - Clickable */}
                                    <div
                                        className="p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
                                        onClick={() =>
                                            toggleOrderExpansion(order.id)
                                        }
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                                                    Order #{order.id}
                                                    <Icon
                                                        icon={
                                                            isExpanded
                                                                ? "mingcute:up-line"
                                                                : "mingcute:down-line"
                                                        }
                                                        width="16"
                                                        height="16"
                                                        className="text-gray-400"
                                                    />
                                                </h3>
                                                <p className="text-sm text-gray-500">
                                                    Placed on{" "}
                                                    {formatDate(order.date)}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(
                                                        order.status
                                                    )}`}
                                                >
                                                    <Icon
                                                        icon={getStatusIcon(
                                                            order.status
                                                        )}
                                                        width="14"
                                                        height="14"
                                                    />
                                                    {order.status
                                                        .charAt(0)
                                                        .toUpperCase() +
                                                        order.status.slice(1)}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <p className="text-lg font-bold text-primary">
                                                ₱{order.total.toFixed(2)}
                                            </p>
                                            <div className="flex items-center gap-4">
                                                <p className="text-sm text-gray-500">
                                                    {order.items.length} item
                                                    {order.items.length !== 1
                                                        ? "s"
                                                        : ""}
                                                </p>
                                                <p className="text-xs text-primary bg-primary/10 px-2 py-1 rounded-full">
                                                    {order.deliveryMethod ===
                                                    "delivery"
                                                        ? "Delivery"
                                                        : "Pickup"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expandable Order Details */}
                                    {isExpanded && (
                                        <div className="p-4">
                                            {/* Farmer Groups */}
                                            <div className="space-y-4 mb-6">
                                                <h4 className="font-semibold text-gray-800 text-sm mb-3 flex items-center gap-2">
                                                    <Icon
                                                        icon="mingcute:group-line"
                                                        width="16"
                                                        height="16"
                                                        className="text-primary"
                                                    />
                                                    Order Items by Farmer
                                                </h4>
                                                {farmerGroups.map((farmer) => {
                                                    const farmerKey = `${order.id}_${farmer.farmerId}`;
                                                    const isFarmerExpanded =
                                                        expandedFarmers[
                                                            farmerKey
                                                        ] !== false;
                                                    const hasMultipleItems =
                                                        farmer.items.length > 1;

                                                    return (
                                                        <div
                                                            key={
                                                                farmer.farmerId
                                                            }
                                                            className="border border-gray-200 rounded-lg overflow-hidden"
                                                        >
                                                            {/* Farmer Header - Clickable if multiple items */}
                                                            <div
                                                                className={`bg-green-50 p-3 border-b border-green-200 ${
                                                                    hasMultipleItems
                                                                        ? "cursor-pointer hover:bg-green-100 transition-colors"
                                                                        : ""
                                                                }`}
                                                                onClick={() =>
                                                                    hasMultipleItems &&
                                                                    toggleFarmerExpansion(
                                                                        order.id,
                                                                        farmer.farmerId
                                                                    )
                                                                }
                                                            >
                                                                <div className="flex justify-between items-center">
                                                                    <div className="flex items-center gap-2">
                                                                        <Icon
                                                                            icon="mingcute:user-3-line"
                                                                            width="16"
                                                                            height="16"
                                                                            className="text-green-600"
                                                                        />
                                                                        <h5 className="font-semibold text-green-800 text-sm flex items-center gap-2">
                                                                            {
                                                                                farmer.farmerName
                                                                            }
                                                                            {hasMultipleItems && (
                                                                                <Icon
                                                                                    icon={
                                                                                        isFarmerExpanded
                                                                                            ? "mingcute:up-line"
                                                                                            : "mingcute:down-line"
                                                                                    }
                                                                                    width="14"
                                                                                    height="14"
                                                                                    className="text-green-600"
                                                                                />
                                                                            )}
                                                                        </h5>
                                                                        {hasMultipleItems && (
                                                                            <span className="text-xs text-green-600 bg-green-200 px-2 py-1 rounded-full">
                                                                                {
                                                                                    farmer
                                                                                        .items
                                                                                        .length
                                                                                }{" "}
                                                                                items
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <p className="text-xs text-green-700">
                                                                            {farmer.totalQuantity.toFixed(
                                                                                1
                                                                            )}
                                                                            kg
                                                                            total
                                                                        </p>
                                                                        <p className="text-sm font-bold text-green-800">
                                                                            ₱
                                                                            {farmer.totalPrice.toFixed(
                                                                                2
                                                                            )}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Farmer's Items - Collapsible for multiple items */}
                                                            {(!hasMultipleItems ||
                                                                isFarmerExpanded) && (
                                                                <div className="divide-y divide-gray-100">
                                                                    {farmer.items.map(
                                                                        (
                                                                            item
                                                                        ) => (
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
                                                                                        className="w-12 h-12 object-cover rounded-lg"
                                                                                    />
                                                                                    <div className="flex-1">
                                                                                        <h6 className="font-medium text-gray-800 text-sm">
                                                                                            {
                                                                                                item.name
                                                                                            }
                                                                                        </h6>
                                                                                        <p className="text-xs text-gray-500">
                                                                                            ₱
                                                                                            {item.price.toFixed(
                                                                                                2
                                                                                            )}
                                                                                            /kg
                                                                                            ×{" "}
                                                                                            {
                                                                                                item.quantity
                                                                                            }
                                                                                            kg
                                                                                        </p>
                                                                                    </div>
                                                                                    <div className="text-right">
                                                                                        <p className="text-sm font-medium text-gray-800">
                                                                                            ₱
                                                                                            {(
                                                                                                item.price *
                                                                                                item.quantity
                                                                                            ).toFixed(
                                                                                                2
                                                                                            )}
                                                                                        </p>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        )
                                                                    )}
                                                                </div>
                                                            )}

                                                            {/* Collapsed summary for multiple items */}
                                                            {hasMultipleItems &&
                                                                !isFarmerExpanded && (
                                                                    <div className="p-3 bg-gray-50 text-center">
                                                                        <p className="text-sm text-gray-600">
                                                                            Click
                                                                            to
                                                                            view{" "}
                                                                            {
                                                                                farmer
                                                                                    .items
                                                                                    .length
                                                                            }{" "}
                                                                            items
                                                                            from
                                                                            this
                                                                            farmer
                                                                        </p>
                                                                    </div>
                                                                )}
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {/* Order Details */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                                                {/* Delivery/Pickup Method */}
                                                <div className="bg-gray-50 rounded-lg p-3">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Icon
                                                            icon={
                                                                order.deliveryMethod ===
                                                                "delivery"
                                                                    ? "mingcute:truck-line"
                                                                    : "mingcute:location-line"
                                                            }
                                                            width="16"
                                                            height="16"
                                                            className="text-gray-500"
                                                        />
                                                        <span className="text-sm font-medium text-gray-700">
                                                            {order.deliveryMethod ===
                                                            "delivery"
                                                                ? "Home Delivery"
                                                                : "Farm Pickup"}
                                                        </span>
                                                    </div>
                                                    <div className="ml-5">
                                                        <p className="text-sm text-gray-600 mb-1">
                                                            {order.deliveryMethod ===
                                                            "Home Delivery"
                                                                ? "Delivery to your address"
                                                                : `Pickup from: ${order.sellerAddress}`}
                                                        </p>
                                                        <p className="text-xs text-blue-600">
                                                            Seller:{" "}
                                                            {order.sellerName}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Payment Method */}
                                                <div className="bg-gray-50 rounded-lg p-3">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Icon
                                                            icon={
                                                                order.paymentMethod ===
                                                                "cod"
                                                                    ? "mingcute:cash-line"
                                                                    : "mingcute:credit-card-line"
                                                            }
                                                            width="16"
                                                            height="16"
                                                            className="text-gray-500"
                                                        />
                                                        <span className="text-sm font-medium text-gray-700">
                                                            Payment Method
                                                        </span>
                                                    </div>
                                                    <div className="ml-5">
                                                        <p className="text-sm text-gray-600">
                                                            {order.paymentMethod ===
                                                            "cod"
                                                                ? `Cash on ${
                                                                      order.deliveryMethod ===
                                                                      "delivery"
                                                                          ? "Delivery"
                                                                          : "Pickup"
                                                                  }`
                                                                : "Online Payment"}
                                                        </p>
                                                        {order.status !==
                                                            "cancelled" &&
                                                            order.paymentMethod ===
                                                                "cod" && (
                                                                <p className="text-xs text-orange-600">
                                                                    Payment due:
                                                                    ₱
                                                                    {order.total.toFixed(
                                                                        2
                                                                    )}
                                                                </p>
                                                            )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Order Breakdown */}
                                            <div className="bg-blue-50 rounded-lg p-3 mb-4">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Icon
                                                        icon="mingcute:receipt-line"
                                                        width="16"
                                                        height="16"
                                                        className="text-blue-600"
                                                    />
                                                    <span className="text-sm font-medium text-blue-800">
                                                        Order Breakdown
                                                    </span>
                                                </div>
                                                <div className="ml-5 space-y-1">
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-600">
                                                            Subtotal
                                                        </span>
                                                        <span className="text-gray-800">
                                                            ₱
                                                            {(
                                                                order.total -
                                                                order.deliveryFee
                                                            ).toFixed(2)}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-600">
                                                            {order.deliveryMethod ===
                                                            "delivery"
                                                                ? "Delivery Fee"
                                                                : "Pickup Fee"}
                                                        </span>
                                                        <span className="text-gray-800">
                                                            {order.deliveryFee >
                                                            0
                                                                ? `₱${order.deliveryFee.toFixed(
                                                                      2
                                                                  )}`
                                                                : "Free"}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between text-sm font-semibold border-t border-blue-200 pt-1">
                                                        <span className="text-blue-800">
                                                            Total
                                                        </span>
                                                        <span className="text-blue-800">
                                                            ₱
                                                            {order.total.toFixed(
                                                                2
                                                            )}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Customer Details */}
                                            <div className="bg-gray-50 rounded-lg p-3 mb-4">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Icon
                                                        icon="mingcute:user-line"
                                                        width="16"
                                                        height="16"
                                                        className="text-gray-500"
                                                    />
                                                    <span className="text-sm font-medium text-gray-700">
                                                        Seller Information
                                                    </span>
                                                </div>
                                                <div className="ml-5 space-y-1">
                                                    <p className="text-sm text-gray-600">
                                                        <strong>Seller:</strong>{" "}
                                                        {order.sellerName}
                                                    </p>
                                                    <p className="text-sm text-gray-600">
                                                        <strong>
                                                            Address:
                                                        </strong>{" "}
                                                        {order.sellerAddress}
                                                    </p>
                                                    {order.sellerContact && (
                                                        <p className="text-sm text-gray-600">
                                                            <strong>
                                                                Contact:
                                                            </strong>{" "}
                                                            {
                                                                order.sellerContact
                                                            }
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Order Actions */}
                                            <div className="flex flex-wrap gap-2">
                                                {(order.status === "pending" ||
                                                    order.status ===
                                                        "confirmed") && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleCancelOrder(
                                                                order.id
                                                            );
                                                        }}
                                                        className="px-4 py-2 text-sm border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                                                    >
                                                        Cancel Order
                                                    </button>
                                                )}

                                                {(order.status ===
                                                    "preparing" ||
                                                    order.status ===
                                                        "ready for pickup") && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleTrackOrder(
                                                                order.id
                                                            );
                                                        }}
                                                        className="px-4 py-2 text-sm border border-primary text-primary rounded-lg hover:bg-primary/5 transition-colors"
                                                    >
                                                        Track Order
                                                    </button>
                                                )}

                                                {order.status ===
                                                    "completed" && (
                                                    <>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleReorder(
                                                                    order
                                                                );
                                                            }}
                                                            className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                                                        >
                                                            Reorder
                                                        </button>
                                                        <button
                                                            onClick={(e) =>
                                                                e.stopPropagation()
                                                            }
                                                            className="px-4 py-2 text-sm border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                                                        >
                                                            Leave Review
                                                        </button>
                                                    </>
                                                )}

                                                {order.status ===
                                                    "cancelled" && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleReorder(
                                                                order
                                                            );
                                                        }}
                                                        className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                                                    >
                                                        Order Again
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <NavigationBar />
        </div>
    );
}

export default Orders;
