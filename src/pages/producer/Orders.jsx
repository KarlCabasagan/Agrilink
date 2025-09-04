import { useState, useEffect, useContext } from "react";
import { Icon } from "@iconify/react";
import { AuthContext } from "../../App.jsx";
import ProducerNavigationBar from "../../components/ProducerNavigationBar";
import supabase from "../../SupabaseClient.jsx";

const orderStatuses = [
    {
        value: "pending",
        label: "Pending",
        color: "bg-yellow-100 text-yellow-800",
        icon: "mingcute:time-line",
    },
    {
        value: "confirmed",
        label: "Confirmed",
        color: "bg-blue-100 text-blue-800",
        icon: "mingcute:check-circle-line",
    },
    {
        value: "preparing",
        label: "Preparing",
        color: "bg-orange-100 text-orange-800",
        icon: "mingcute:box-line",
    },
    {
        value: "ready",
        label: "Ready for Pickup",
        color: "bg-purple-100 text-purple-800",
        icon: "mingcute:truck-line",
    },
    {
        value: "completed",
        label: "Completed",
        color: "bg-green-100 text-green-800",
        icon: "mingcute:check-circle-fill",
    },
    {
        value: "cancelled",
        label: "Cancelled",
        color: "bg-red-100 text-red-800",
        icon: "mingcute:close-circle-line",
    },
];

function Orders() {
    const { user } = useContext(AuthContext);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedStatus, setSelectedStatus] = useState("all");
    const [expandedOrder, setExpandedOrder] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortBy, setSortBy] = useState("newest");

    useEffect(() => {
        fetchOrders();
    }, [user]);

    const fetchOrders = async () => {
        if (!user) return;

        setLoading(true);
        try {
            // This would fetch orders for the producer's products
            // For now, we'll use mock data since we don't have orders table structure
            const mockOrders = [
                {
                    id: "ORD-2024-001",
                    customer_name: "John Doe",
                    customer_contact: "+63 912 345 6789",
                    customer_address: "Poblacion, Iligan City",
                    total_amount: 68.25,
                    status: "pending",
                    created_at: "2025-09-02T08:30:00Z",
                    deliveryMethod: "delivery",
                    paymentMethod: "cod",
                    deliveryAddress:
                        "123 Main St, Barangay Poblacion, Iligan City, Lanao del Norte 9200",
                    deliveryFee: 50.0,
                    customerDetails: {
                        name: "John Doe",
                        phone: "+63 912 345 6789",
                        email: "john.doe@example.com",
                    },
                    orderNotes: "Please prepare the order early in the morning",
                    estimatedDelivery: "2025-09-03",
                    items: [
                        {
                            product_name: "Carrots",
                            quantity: 2.5,
                            price: 2.5,
                            total: 6.25,
                            image: "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37",
                        },
                        {
                            product_name: "Potatoes",
                            quantity: 5.0,
                            price: 1.5,
                            total: 7.5,
                            image: "https://images.unsplash.com/photo-1518977676601-b53f82aba655",
                        },
                        {
                            product_name: "Onions",
                            quantity: 1.5,
                            price: 3.0,
                            total: 4.5,
                            image: "https://images.unsplash.com/photo-1587049352846-4a222e784d38",
                        },
                    ],
                },
                {
                    id: "ORD-2024-002",
                    customer_name: "Maria Santos",
                    customer_contact: "+63 923 456 7890",
                    customer_address: "Maria Cristina, Iligan City",
                    total_amount: 42.75,
                    status: "confirmed",
                    created_at: "2025-09-01T14:15:00Z",
                    deliveryMethod: "pickup",
                    paymentMethod: "cod",
                    pickupLocation:
                        "Santos Farm, Barangay Maria Cristina, Iligan City",
                    deliveryFee: 0.0,
                    customerDetails: {
                        name: "Maria Santos",
                        phone: "+63 923 456 7890",
                        email: "maria.santos@example.com",
                    },
                    orderNotes: "",
                    estimatedPickup: "2025-09-02",
                    items: [
                        {
                            product_name: "Rice",
                            quantity: 2.0,
                            price: 12.0,
                            total: 24.0,
                            image: "https://images.unsplash.com/photo-1586201375761-83865001e31c",
                        },
                        {
                            product_name: "Monggo",
                            quantity: 1.5,
                            price: 12.5,
                            total: 18.75,
                            image: "https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d",
                        },
                    ],
                },
                {
                    id: "ORD-2024-003",
                    customer_name: "Pedro Cruz",
                    customer_contact: "+63 934 567 8901",
                    customer_address: "Tibanga, Iligan City",
                    total_amount: 17.0,
                    status: "preparing",
                    created_at: "2025-09-01T10:20:00Z",
                    deliveryMethod: "delivery",
                    paymentMethod: "cod",
                    deliveryAddress:
                        "789 Pine St, Barangay Tibanga, Iligan City, Lanao del Norte 9200",
                    deliveryFee: 75.0,
                    customerDetails: {
                        name: "Pedro Cruz",
                        phone: "+63 934 567 8901",
                        email: "pedro.cruz@example.com",
                    },
                    orderNotes: "Call when arriving at the subdivision gate",
                    estimatedDelivery: "2025-09-02",
                    items: [
                        {
                            product_name: "Apples",
                            quantity: 1.5,
                            price: 8.0,
                            total: 12.0,
                            image: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6",
                        },
                        {
                            product_name: "Carrots",
                            quantity: 2.0,
                            price: 2.5,
                            total: 5.0,
                            image: "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37",
                        },
                    ],
                },
                {
                    id: "ORD-2024-004",
                    customer_name: "Ana Garcia",
                    customer_contact: "+63 945 678 9012",
                    customer_address: "Palao, Iligan City",
                    total_amount: 15.0,
                    status: "ready",
                    created_at: "2025-08-31T16:45:00Z",
                    deliveryMethod: "pickup",
                    paymentMethod: "cod",
                    pickupLocation: "Garcia Farm, Barangay Palao, Iligan City",
                    deliveryFee: 0.0,
                    customerDetails: {
                        name: "Ana Garcia",
                        phone: "+63 945 678 9012",
                        email: "ana.garcia@example.com",
                    },
                    orderNotes: "Will pick up after 3 PM",
                    estimatedPickup: "2025-09-01",
                    items: [
                        {
                            product_name: "Potatoes",
                            quantity: 5.0,
                            price: 1.5,
                            total: 7.5,
                            image: "https://images.unsplash.com/photo-1518977676601-b53f82aba655",
                        },
                        {
                            product_name: "Onions",
                            quantity: 2.5,
                            price: 3.0,
                            total: 7.5,
                            image: "https://images.unsplash.com/photo-1587049352846-4a222e784d38",
                        },
                    ],
                },
                {
                    id: "ORD-2024-005",
                    customer_name: "Carlos Lopez",
                    customer_contact: "+63 956 789 0123",
                    customer_address: "Buru-un, Iligan City",
                    total_amount: 60.0,
                    status: "completed",
                    created_at: "2025-08-30T09:30:00Z",
                    deliveryMethod: "delivery",
                    paymentMethod: "cod",
                    deliveryAddress:
                        "456 Oak St, Barangay Buru-un, Iligan City, Lanao del Norte 9200",
                    deliveryFee: 100.0,
                    customerDetails: {
                        name: "Carlos Lopez",
                        phone: "+63 956 789 0123",
                        email: "carlos.lopez@example.com",
                    },
                    orderNotes: "Ring the doorbell twice",
                    estimatedDelivery: "2025-08-31",
                    items: [
                        {
                            product_name: "Rice",
                            quantity: 5.0,
                            price: 12.0,
                            total: 60.0,
                            image: "https://images.unsplash.com/photo-1586201375761-83865001e31c",
                        },
                    ],
                },
            ];

            setOrders(mockOrders);
        } catch (error) {
            console.error("Error fetching orders:", error);
        } finally {
            setLoading(false);
        }
    };

    const updateOrderStatus = async (orderId, newStatus) => {
        try {
            // In real app, this would update the database
            setOrders((prev) =>
                prev.map((order) =>
                    order.id === orderId
                        ? { ...order, status: newStatus }
                        : order
                )
            );
        } catch (error) {
            console.error("Error updating order status:", error);
        }
    };

    // Search and sort functions
    const searchOrders = (orders) => {
        if (!searchTerm) return orders;

        return orders.filter(
            (order) =>
                order.customer_name
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase()) ||
                order.customer_contact.includes(searchTerm) ||
                order.customer_address
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase()) ||
                order.id.toString().includes(searchTerm) ||
                order.items.some((item) =>
                    item.product_name
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase())
                )
        );
    };

    const sortOrders = (orders) => {
        return [...orders].sort((a, b) => {
            switch (sortBy) {
                case "newest":
                    return new Date(b.created_at) - new Date(a.created_at);
                case "oldest":
                    return new Date(a.created_at) - new Date(b.created_at);
                case "highest":
                    return b.total_amount - a.total_amount;
                case "lowest":
                    return a.total_amount - b.total_amount;
                case "customer":
                    return a.customer_name.localeCompare(b.customer_name);
                default:
                    return 0;
            }
        });
    };

    const filteredOrders = sortOrders(
        searchOrders(
            orders.filter(
                (order) =>
                    selectedStatus === "all" || order.status === selectedStatus
            )
        )
    );

    const getStatusConfig = (status) => {
        return (
            orderStatuses.find((s) => s.value === status) || orderStatuses[0]
        );
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <div className="min-h-screen w-full flex flex-col relative items-center scrollbar-hide bg-background overflow-x-hidden text-text pb-20">
            {/* Header */}
            <div className="fixed top-0 left-0 w-full bg-white shadow-md z-50 px-4 py-3">
                <h1 className="text-lg font-semibold text-primary text-center">
                    Orders
                </h1>
            </div>

            <div className="w-full max-w-4xl mx-4 sm:mx-auto my-16">
                {/* Status Filter */}
                <div className="mb-6 mt-4">
                    <div className="flex overflow-x-auto gap-2 px-2 py-2 scrollbar-hide">
                        <button
                            onClick={() => setSelectedStatus("all")}
                            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                                selectedStatus === "all"
                                    ? "bg-primary text-white"
                                    : "bg-white text-gray-700 border border-gray-300"
                            }`}
                        >
                            All Orders
                        </button>
                        {orderStatuses.map((status) => (
                            <button
                                key={status.value}
                                onClick={() => setSelectedStatus(status.value)}
                                className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                                    selectedStatus === status.value
                                        ? "bg-primary text-white"
                                        : "bg-white text-gray-700 border border-gray-300"
                                }`}
                            >
                                {status.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Search and Sort */}
                <div className="mb-6">
                    <div className="flex flex-col px-2 sm:flex-row gap-4">
                        {/* Search */}
                        <div className="flex-1 relative">
                            <Icon
                                icon="mingcute:search-line"
                                width="20"
                                height="20"
                                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                            />
                            <input
                                type="text"
                                placeholder="Search by customer, order ID, product, or address..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-white"
                            />
                        </div>

                        {/* Sort */}
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600 whitespace-nowrap">
                                Sort by:
                            </span>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-white"
                            >
                                <option value="newest">Newest First</option>
                                <option value="oldest">Oldest First</option>
                                <option value="highest">Highest Amount</option>
                                <option value="lowest">Lowest Amount</option>
                                <option value="customer">Customer Name</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Orders List */}
                {loading ? (
                    <div className="flex justify-center py-16">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <Icon
                            icon="mingcute:shopping-bag-line"
                            width="64"
                            height="64"
                            className="text-gray-300 mb-4"
                        />
                        <p className="text-gray-400 text-lg">No orders found</p>
                        <p className="text-gray-400 text-sm">
                            {selectedStatus === "all"
                                ? "You haven't received any orders yet"
                                : `No ${selectedStatus} orders at the moment`}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4 px-2">
                        {filteredOrders.map((order) => {
                            const statusConfig = getStatusConfig(order.status);
                            const isExpanded = expandedOrder === order.id;

                            return (
                                <div
                                    key={order.id}
                                    className="bg-white rounded-lg shadow-md overflow-hidden"
                                >
                                    {/* Order Header */}
                                    <div
                                        className="p-4 cursor-pointer hover:bg-gray-50"
                                        onClick={() =>
                                            setExpandedOrder(
                                                isExpanded ? null : order.id
                                            )
                                        }
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h3 className="font-semibold text-gray-800">
                                                    Order #{order.id}
                                                </h3>
                                                <p className="text-sm text-gray-600">
                                                    {order.customer_name}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <span
                                                    className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}
                                                >
                                                    <Icon
                                                        icon={statusConfig.icon}
                                                        width="12"
                                                        height="12"
                                                        className="inline mr-1"
                                                    />
                                                    {statusConfig.label}
                                                </span>
                                                <p className="text-sm text-gray-500 mt-1">
                                                    {formatDate(
                                                        order.created_at
                                                    )}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-center">
                                            <p className="text-lg font-bold text-primary">
                                                ₱{order.total_amount.toFixed(2)}
                                            </p>
                                            <div className="flex items-center gap-3">
                                                <p className="text-xs text-primary bg-primary/10 px-2 py-1 rounded-full flex items-center gap-1">
                                                    <Icon
                                                        icon={
                                                            order.deliveryMethod ===
                                                            "delivery"
                                                                ? "mingcute:truck-line"
                                                                : "mingcute:location-line"
                                                        }
                                                        width="12"
                                                        height="12"
                                                    />
                                                    {order.deliveryMethod ===
                                                    "delivery"
                                                        ? "Delivery"
                                                        : "Pickup"}
                                                </p>
                                                <Icon
                                                    icon={
                                                        isExpanded
                                                            ? "mingcute:up-line"
                                                            : "mingcute:down-line"
                                                    }
                                                    width="20"
                                                    height="20"
                                                    className="text-gray-400"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expanded Order Details */}
                                    {isExpanded && (
                                        <div className="border-t border-gray-200 p-4 bg-gray-50">
                                            {/* Order Items */}
                                            <div className="mb-6">
                                                <h4 className="font-semibold text-gray-800 text-sm mb-3 flex items-center gap-2">
                                                    <Icon
                                                        icon="mingcute:shopping-bag-1-line"
                                                        width="16"
                                                        height="16"
                                                        className="text-primary"
                                                    />
                                                    Order Items
                                                </h4>
                                                <div className="space-y-2">
                                                    {order.items.map(
                                                        (item, index) => (
                                                            <div
                                                                key={index}
                                                                className="flex items-center gap-3 p-3 bg-white rounded-lg"
                                                            >
                                                                <img
                                                                    src={
                                                                        item.image
                                                                    }
                                                                    alt={
                                                                        item.product_name
                                                                    }
                                                                    className="w-12 h-12 object-cover rounded-lg"
                                                                />
                                                                <div className="flex-1">
                                                                    <h6 className="font-medium text-gray-800 text-sm">
                                                                        {
                                                                            item.product_name
                                                                        }
                                                                    </h6>
                                                                    <p className="text-xs text-gray-500">
                                                                        ₱
                                                                        {item.price.toFixed(
                                                                            2
                                                                        )}
                                                                        /kg ×{" "}
                                                                        {
                                                                            item.quantity
                                                                        }
                                                                        kg
                                                                    </p>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="text-sm font-medium text-gray-800">
                                                                        ₱
                                                                        {item.total.toFixed(
                                                                            2
                                                                        )}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        )
                                                    )}
                                                </div>
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
                                                            "delivery"
                                                                ? order.deliveryAddress
                                                                : order.pickupLocation}
                                                        </p>
                                                        {order.deliveryMethod ===
                                                            "delivery" &&
                                                            order.estimatedDelivery && (
                                                                <p className="text-xs text-green-600">
                                                                    Est.
                                                                    delivery:{" "}
                                                                    {new Date(
                                                                        order.estimatedDelivery
                                                                    ).toLocaleDateString(
                                                                        "en-US",
                                                                        {
                                                                            month: "short",
                                                                            day: "numeric",
                                                                            year: "numeric",
                                                                        }
                                                                    )}
                                                                </p>
                                                            )}
                                                        {order.deliveryMethod ===
                                                            "pickup" &&
                                                            order.estimatedPickup && (
                                                                <p className="text-xs text-green-600">
                                                                    Available
                                                                    from:{" "}
                                                                    {new Date(
                                                                        order.estimatedPickup
                                                                    ).toLocaleDateString(
                                                                        "en-US",
                                                                        {
                                                                            month: "short",
                                                                            day: "numeric",
                                                                            year: "numeric",
                                                                        }
                                                                    )}
                                                                </p>
                                                            )}
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
                                                            order.status !==
                                                                "completed" &&
                                                            order.paymentMethod ===
                                                                "cod" && (
                                                                <p className="text-xs text-orange-600">
                                                                    Payment due:
                                                                    ₱
                                                                    {order.total_amount.toFixed(
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
                                                                order.total_amount -
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
                                                            {order.total_amount.toFixed(
                                                                2
                                                            )}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Customer Information */}
                                            <div className="bg-gray-50 rounded-lg p-3 mb-4">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Icon
                                                        icon="mingcute:user-line"
                                                        width="16"
                                                        height="16"
                                                        className="text-gray-500"
                                                    />
                                                    <span className="text-sm font-medium text-gray-700">
                                                        Customer Information
                                                    </span>
                                                </div>
                                                <div className="ml-5 space-y-1">
                                                    <p className="text-sm text-gray-600">
                                                        <strong>Name:</strong>{" "}
                                                        {
                                                            order
                                                                .customerDetails
                                                                .name
                                                        }
                                                    </p>
                                                    <p className="text-sm text-gray-600">
                                                        <strong>Phone:</strong>{" "}
                                                        {
                                                            order
                                                                .customerDetails
                                                                .phone
                                                        }
                                                    </p>
                                                    <p className="text-sm text-gray-600">
                                                        <strong>Email:</strong>{" "}
                                                        {
                                                            order
                                                                .customerDetails
                                                                .email
                                                        }
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Order Notes */}
                                            {order.orderNotes && (
                                                <div className="bg-yellow-50 rounded-lg p-3 mb-4">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Icon
                                                            icon="mingcute:edit-line"
                                                            width="16"
                                                            height="16"
                                                            className="text-yellow-600"
                                                        />
                                                        <span className="text-sm font-medium text-yellow-800">
                                                            Order Notes
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-yellow-700 ml-5">
                                                        "{order.orderNotes}"
                                                    </p>
                                                </div>
                                            )}

                                            {/* Status Update Actions */}
                                            <div className="flex flex-wrap gap-2">
                                                {order.status === "pending" && (
                                                    <>
                                                        <button
                                                            onClick={() =>
                                                                updateOrderStatus(
                                                                    order.id,
                                                                    "confirmed"
                                                                )
                                                            }
                                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                                                        >
                                                            <Icon
                                                                icon="mingcute:check-line"
                                                                width="16"
                                                                height="16"
                                                                className="inline mr-1"
                                                            />
                                                            Confirm Order
                                                        </button>
                                                        <button
                                                            onClick={() =>
                                                                updateOrderStatus(
                                                                    order.id,
                                                                    "cancelled"
                                                                )
                                                            }
                                                            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
                                                        >
                                                            <Icon
                                                                icon="mingcute:close-line"
                                                                width="16"
                                                                height="16"
                                                                className="inline mr-1"
                                                            />
                                                            Cancel Order
                                                        </button>
                                                    </>
                                                )}
                                                {order.status ===
                                                    "confirmed" && (
                                                    <>
                                                        <button
                                                            onClick={() =>
                                                                updateOrderStatus(
                                                                    order.id,
                                                                    "preparing"
                                                                )
                                                            }
                                                            className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm hover:bg-orange-700 transition-colors"
                                                        >
                                                            <Icon
                                                                icon="mingcute:box-line"
                                                                width="16"
                                                                height="16"
                                                                className="inline mr-1"
                                                            />
                                                            Start Preparing
                                                        </button>
                                                        <button
                                                            onClick={() =>
                                                                updateOrderStatus(
                                                                    order.id,
                                                                    "cancelled"
                                                                )
                                                            }
                                                            className="px-4 py-2 border border-red-300 text-red-600 rounded-lg text-sm hover:bg-red-50 transition-colors"
                                                        >
                                                            Cancel Order
                                                        </button>
                                                    </>
                                                )}
                                                {order.status ===
                                                    "preparing" && (
                                                    <button
                                                        onClick={() =>
                                                            updateOrderStatus(
                                                                order.id,
                                                                "ready"
                                                            )
                                                        }
                                                        className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition-colors"
                                                    >
                                                        <Icon
                                                            icon="mingcute:truck-line"
                                                            width="16"
                                                            height="16"
                                                            className="inline mr-1"
                                                        />
                                                        Mark as Ready
                                                    </button>
                                                )}
                                                {order.status === "ready" && (
                                                    <button
                                                        onClick={() =>
                                                            updateOrderStatus(
                                                                order.id,
                                                                "completed"
                                                            )
                                                        }
                                                        className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors"
                                                    >
                                                        <Icon
                                                            icon="mingcute:check-circle-fill"
                                                            width="16"
                                                            height="16"
                                                            className="inline mr-1"
                                                        />
                                                        Complete Order
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
            <ProducerNavigationBar />
        </div>
    );
}

export default Orders;
