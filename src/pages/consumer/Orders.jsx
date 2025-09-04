import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { Link, useNavigate } from "react-router-dom";
import NavigationBar from "../../components/NavigationBar";

function Orders() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("all");
    const [orders, setOrders] = useState([
        {
            id: "ORD-2024-001",
            date: "2024-12-15",
            status: "delivered",
            total: 68.25,
            items: [
                {
                    id: 1,
                    name: "Fresh Tomatoes",
                    price: 25.0,
                    quantity: 2.5,
                    image: "https://images.unsplash.com/photo-1546470427-e8357872b6d8",
                    farmerName: "Juan Santos",
                },
                {
                    id: 2,
                    name: "Green Lettuce",
                    price: 15.0,
                    quantity: 1.0,
                    image: "https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1",
                    farmerName: "Maria Cruz",
                },
            ],
            deliveryAddress: "123 Main St, Quezon City",
            deliveryFee: 50.0,
        },
        {
            id: "ORD-2024-002",
            date: "2024-12-16",
            status: "processing",
            total: 77.75,
            items: [
                {
                    id: 3,
                    name: "Sweet Corn",
                    price: 18.5,
                    quantity: 1.5,
                    image: "https://images.unsplash.com/photo-1586313168876-870e85adc4d6",
                    farmerName: "Pedro Reyes",
                },
            ],
            deliveryAddress: "456 Oak Ave, Makati City",
            deliveryFee: 50.0,
        },
        {
            id: "ORD-2024-003",
            date: "2024-12-17",
            status: "shipped",
            total: 67.0,
            items: [
                {
                    id: 4,
                    name: "Organic Carrots",
                    price: 20.0,
                    quantity: 2.5,
                    image: "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37",
                    farmerName: "Anna Garcia",
                },
                {
                    id: 5,
                    name: "Fresh Cabbage",
                    price: 12.5,
                    quantity: 1.0,
                    image: "https://images.unsplash.com/photo-1594282942168-16ac7b7ba0f7",
                    farmerName: "Roberto Martinez",
                },
            ],
            deliveryAddress: "789 Pine St, Taguig City",
            deliveryFee: 50.0,
        },
        {
            id: "ORD-2024-004",
            date: "2024-12-18",
            status: "cancelled",
            total: 85.0,
            items: [
                {
                    id: 6,
                    name: "Red Bell Peppers",
                    price: 35.0,
                    quantity: 1.0,
                    image: "https://images.unsplash.com/photo-1563565375-f3fdfdbefa83",
                    farmerName: "Carlos Dela Cruz",
                },
            ],
            deliveryAddress: "321 Elm St, Pasig City",
            deliveryFee: 50.0,
        },
    ]);

    const tabs = [
        { id: "all", label: "All Orders", count: orders.length },
        {
            id: "processing",
            label: "Processing",
            count: orders.filter((o) => o.status === "processing").length,
        },
        {
            id: "shipped",
            label: "Shipped",
            count: orders.filter((o) => o.status === "shipped").length,
        },
        {
            id: "delivered",
            label: "Delivered",
            count: orders.filter((o) => o.status === "delivered").length,
        },
        {
            id: "cancelled",
            label: "Cancelled",
            count: orders.filter((o) => o.status === "cancelled").length,
        },
    ];

    const getStatusColor = (status) => {
        switch (status) {
            case "processing":
                return "text-yellow-600 bg-yellow-100";
            case "shipped":
                return "text-blue-600 bg-blue-100";
            case "delivered":
                return "text-green-600 bg-green-100";
            case "cancelled":
                return "text-red-600 bg-red-100";
            default:
                return "text-gray-600 bg-gray-100";
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case "processing":
                return "mingcute:time-line";
            case "shipped":
                return "mingcute:truck-line";
            case "delivered":
                return "mingcute:check-circle-line";
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

    const handleReorder = (order) => {
        // Add items to cart and navigate to cart
        console.log("Reordering:", order);
        // This would typically add items to a cart context
        alert("Items added to cart!");
        navigate("/cart");
    };

    const handleTrackOrder = (orderId) => {
        // Navigate to order tracking page
        console.log("Tracking order:", orderId);
        alert("Order tracking feature coming soon!");
    };

    const handleCancelOrder = (orderId) => {
        if (window.confirm("Are you sure you want to cancel this order?")) {
            setOrders(
                orders.map((order) =>
                    order.id === orderId
                        ? { ...order, status: "cancelled" }
                        : order
                )
            );
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
                {filteredOrders.length === 0 ? (
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
                        {filteredOrders.map((order) => (
                            <div
                                key={order.id}
                                className="bg-white rounded-lg shadow-md overflow-hidden"
                            >
                                {/* Order Header */}
                                <div className="p-4 border-b border-gray-200">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h3 className="font-semibold text-gray-800">
                                                Order #{order.id}
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
                                        <p className="text-sm text-gray-500">
                                            {order.items.length} item
                                            {order.items.length !== 1
                                                ? "s"
                                                : ""}
                                        </p>
                                    </div>
                                </div>

                                {/* Order Items */}
                                <div className="p-4">
                                    <div className="space-y-3 mb-4">
                                        {order.items.map((item) => (
                                            <div
                                                key={item.id}
                                                className="flex items-center gap-3"
                                            >
                                                <img
                                                    src={item.image}
                                                    alt={item.name}
                                                    className="w-12 h-12 object-cover rounded-lg"
                                                />
                                                <div className="flex-1">
                                                    <h4 className="font-medium text-gray-800 text-sm">
                                                        {item.name}
                                                    </h4>
                                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                                        <Icon
                                                            icon="mingcute:user-3-line"
                                                            width="12"
                                                            height="12"
                                                            className="text-green-600"
                                                        />
                                                        <span>
                                                            {item.farmerName}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-medium text-gray-800">
                                                        ₱{item.price.toFixed(2)}
                                                        /kg × {item.quantity} kg
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        ₱
                                                        {(
                                                            item.price *
                                                            item.quantity
                                                        ).toFixed(2)}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Delivery Address */}
                                    <div className="bg-gray-50 rounded-lg p-3 mb-4">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Icon
                                                icon="mingcute:location-line"
                                                width="16"
                                                height="16"
                                                className="text-gray-500"
                                            />
                                            <span className="text-sm font-medium text-gray-700">
                                                Delivery Address
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600 ml-5">
                                            {order.deliveryAddress}
                                        </p>
                                    </div>

                                    {/* Order Actions */}
                                    <div className="flex flex-wrap gap-2">
                                        {order.status === "processing" && (
                                            <button
                                                onClick={() =>
                                                    handleCancelOrder(order.id)
                                                }
                                                className="px-4 py-2 text-sm border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                                            >
                                                Cancel Order
                                            </button>
                                        )}

                                        {(order.status === "processing" ||
                                            order.status === "shipped") && (
                                            <button
                                                onClick={() =>
                                                    handleTrackOrder(order.id)
                                                }
                                                className="px-4 py-2 text-sm border border-primary text-primary rounded-lg hover:bg-primary/5 transition-colors"
                                            >
                                                Track Order
                                            </button>
                                        )}

                                        {order.status === "delivered" && (
                                            <>
                                                <button
                                                    onClick={() =>
                                                        handleReorder(order)
                                                    }
                                                    className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                                                >
                                                    Reorder
                                                </button>
                                                <button className="px-4 py-2 text-sm border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
                                                    Leave Review
                                                </button>
                                            </>
                                        )}

                                        {order.status === "cancelled" && (
                                            <button
                                                onClick={() =>
                                                    handleReorder(order)
                                                }
                                                className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                                            >
                                                Order Again
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <NavigationBar />
        </div>
    );
}

export default Orders;
