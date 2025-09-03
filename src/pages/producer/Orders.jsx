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
                    id: 1,
                    customer_name: "John Doe",
                    customer_contact: "+63 912 345 6789",
                    customer_address: "Poblacion, Iligan City",
                    total_amount: 150.5,
                    status: "pending",
                    created_at: "2025-09-02T08:30:00Z",
                    items: [
                        {
                            product_name: "Carrots",
                            quantity: 5,
                            price: 2.5,
                            total: 12.5,
                        },
                        {
                            product_name: "Potatoes",
                            quantity: 10,
                            price: 1.5,
                            total: 15.0,
                        },
                        {
                            product_name: "Onions",
                            quantity: 2,
                            price: 3.0,
                            total: 6.0,
                        },
                    ],
                },
                {
                    id: 2,
                    customer_name: "Maria Santos",
                    customer_contact: "+63 923 456 7890",
                    customer_address: "Maria Cristina, Iligan City",
                    total_amount: 85.0,
                    status: "confirmed",
                    created_at: "2025-09-01T14:15:00Z",
                    items: [
                        {
                            product_name: "Rice",
                            quantity: 5,
                            price: 12.0,
                            total: 60.0,
                        },
                        {
                            product_name: "Monggo",
                            quantity: 2,
                            price: 12.5,
                            total: 25.0,
                        },
                    ],
                },
                {
                    id: 3,
                    customer_name: "Pedro Cruz",
                    customer_contact: "+63 934 567 8901",
                    customer_address: "Tibanga, Iligan City",
                    total_amount: 45.0,
                    status: "preparing",
                    created_at: "2025-09-01T10:20:00Z",
                    items: [
                        {
                            product_name: "Apples",
                            quantity: 3,
                            price: 8.0,
                            total: 24.0,
                        },
                        {
                            product_name: "Carrots",
                            quantity: 4,
                            price: 2.5,
                            total: 10.0,
                        },
                    ],
                },
                {
                    id: 4,
                    customer_name: "Ana Garcia",
                    customer_contact: "+63 945 678 9012",
                    customer_address: "Palao, Iligan City",
                    total_amount: 75.0,
                    status: "ready",
                    created_at: "2025-08-31T16:45:00Z",
                    items: [
                        {
                            product_name: "Potatoes",
                            quantity: 20,
                            price: 1.5,
                            total: 30.0,
                        },
                        {
                            product_name: "Onions",
                            quantity: 5,
                            price: 3.0,
                            total: 15.0,
                        },
                    ],
                },
                {
                    id: 5,
                    customer_name: "Carlos Lopez",
                    customer_contact: "+63 956 789 0123",
                    customer_address: "Buru-un, Iligan City",
                    total_amount: 120.0,
                    status: "completed",
                    created_at: "2025-08-30T09:30:00Z",
                    items: [
                        {
                            product_name: "Rice",
                            quantity: 10,
                            price: 12.0,
                            total: 120.0,
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

    const filteredOrders = orders.filter(
        (order) => selectedStatus === "all" || order.status === selectedStatus
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

                                    {/* Expanded Order Details */}
                                    {isExpanded && (
                                        <div className="border-t border-gray-200 p-4 bg-gray-50">
                                            {/* Customer Info */}
                                            <div className="mb-4">
                                                <h4 className="font-medium text-gray-800 mb-2">
                                                    Customer Information
                                                </h4>
                                                <div className="space-y-1 text-sm text-gray-600">
                                                    <p className="flex items-center gap-2">
                                                        <Icon
                                                            icon="mingcute:user-line"
                                                            width="16"
                                                            height="16"
                                                        />
                                                        {order.customer_name}
                                                    </p>
                                                    <p className="flex items-center gap-2">
                                                        <Icon
                                                            icon="mingcute:phone-line"
                                                            width="16"
                                                            height="16"
                                                        />
                                                        {order.customer_contact}
                                                    </p>
                                                    <p className="flex items-center gap-2">
                                                        <Icon
                                                            icon="mingcute:location-line"
                                                            width="16"
                                                            height="16"
                                                        />
                                                        {order.customer_address}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Order Items */}
                                            <div className="mb-4">
                                                <h4 className="font-medium text-gray-800 mb-2">
                                                    Order Items
                                                </h4>
                                                <div className="space-y-2">
                                                    {order.items.map(
                                                        (item, index) => (
                                                            <div
                                                                key={index}
                                                                className="flex justify-between items-center text-sm"
                                                            >
                                                                <span className="text-gray-700">
                                                                    {
                                                                        item.product_name
                                                                    }{" "}
                                                                    x{" "}
                                                                    {
                                                                        item.quantity
                                                                    }
                                                                </span>
                                                                <span className="font-medium">
                                                                    ₱
                                                                    {item.total.toFixed(
                                                                        2
                                                                    )}
                                                                </span>
                                                            </div>
                                                        )
                                                    )}
                                                </div>
                                            </div>

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
                                                            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                                                        >
                                                            Confirm
                                                        </button>
                                                        <button
                                                            onClick={() =>
                                                                updateOrderStatus(
                                                                    order.id,
                                                                    "cancelled"
                                                                )
                                                            }
                                                            className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </>
                                                )}
                                                {order.status ===
                                                    "confirmed" && (
                                                    <button
                                                        onClick={() =>
                                                            updateOrderStatus(
                                                                order.id,
                                                                "preparing"
                                                            )
                                                        }
                                                        className="px-3 py-1 bg-orange-600 text-white rounded text-sm hover:bg-orange-700"
                                                    >
                                                        Start Preparing
                                                    </button>
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
                                                        className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
                                                    >
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
                                                        className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                                                    >
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
