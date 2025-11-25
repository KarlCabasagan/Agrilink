import { useState, useEffect, useContext } from "react";
import { Icon } from "@iconify/react";
import { AuthContext } from "../../App.jsx";
import ProducerNavigationBar from "../../components/ProducerNavigationBar";
import supabase from "../../SupabaseClient.jsx";
import { toast } from "react-hot-toast";
import { useLocation } from "react-router-dom";
import { getProfileAvatarUrl } from "../../utils/avatarUtils.js";
import { deleteImageFromUrl } from "../../utils/imageUpload.js";

// Add subtle pulse animation for ready orders tab
const styles = `
  @keyframes subtle-pulse {
    0%, 100% {
      opacity: 1;
      box-shadow: 0 0 0 0 rgba(168, 85, 247, 0.7);
    }
    50% {
      opacity: 0.95;
      box-shadow: 0 0 0 4px rgba(168, 85, 247, 0);
    }
  }
  
  .animate-ready-pulse {
    animation: subtle-pulse 2s infinite;
  }
`;

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
        value: "ready for pickup",
        label: "Ready",
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
    const location = useLocation();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("all");
    const [expandedOrder, setExpandedOrder] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortBy, setSortBy] = useState("newest");
    const [viewRequestModal, setViewRequestModal] = useState({
        open: false,
        item: null,
    });
    const [resolvingRequestId, setResolvingRequestId] = useState(null);

    // Handle deep linking from messages (highlight order when navigated from replacement request)
    useEffect(() => {
        if (location.state?.highlightOrderId) {
            const orderId = location.state.highlightOrderId;
            setExpandedOrder(orderId);

            // Optional: Scroll the order into view after a brief delay to ensure DOM is ready
            setTimeout(() => {
                const orderElement = document.getElementById(
                    `order-${orderId}`
                );
                if (orderElement) {
                    orderElement.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                    });
                }
            }, 100);

            // Clear the history state to prevent re-expanding on refresh
            window.history.replaceState(
                {},
                document.title,
                window.location.pathname
            );
        }
    }, [location]);

    useEffect(() => {
        fetchOrders();
    }, [user]);

    const fetchOrders = async () => {
        if (!user) return;

        setLoading(true);
        try {
            // Fetch orders where this user is the seller, including producer profile for pickup orders
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
                    profiles!orders_user_id_fkey (
                        name,
                        address,
                        contact,
                        email,
                        avatar_url
                    ),
                    producer:profiles!orders_seller_id_fkey (
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
                .eq("seller_id", user.id)
                .order("created_at", { ascending: false });

            if (ordersError) throw ordersError;

            // Transform orders with normalized fields
            const transformedOrders = ordersData.map((order) => {
                // Calculate total from order items with safety checks
                const orderTotal = order.order_items.reduce((sum, item) => {
                    const price = parseFloat(item.price_at_purchase) || 0;
                    const quantity = parseFloat(item.quantity) || 0;
                    return sum + price * quantity;
                }, 0);

                return {
                    id: order.id,
                    customer_name: order.profiles?.name || "Unknown Customer",
                    customer_contact: order.profiles?.contact || "",
                    customer_address: order.profiles?.address || "",
                    customer_avatar: getProfileAvatarUrl(order.profiles || {}),
                    producer_address: order.producer?.address || "",
                    total_amount:
                        orderTotal +
                        (parseFloat(order.delivery_fee_at_order) || 0),
                    itemCount: order.order_items.length,
                    status: order.statuses?.name || "unknown",
                    created_at: order.created_at,
                    deliveryMethod: order.delivery_methods?.name || "Unknown",
                    paymentMethod: order.payment_methods?.name || "Unknown",
                    deliveryFee: parseFloat(order.delivery_fee_at_order) || 0,
                    customerDetails: {
                        name: order.profiles?.name || "Unknown Customer",
                        phone: order.profiles?.contact || "",
                        address: order.profiles?.address || "",
                        email: order.profiles?.email || "Not provided",
                    },
                    items: order.order_items.map((item) => ({
                        id: item.id,
                        product_id: item.product_id,
                        name: item.name_at_purchase || "Unknown Product",
                        quantity: parseFloat(item.quantity) || 0,
                        unit_price: parseFloat(item.price_at_purchase) || 0,
                        subtotal:
                            (parseFloat(item.price_at_purchase) || 0) *
                            (parseFloat(item.quantity) || 0),
                        category: item.products?.categories?.name || "Other",
                        image_url: item.products?.image_url || "",
                        request_replacement_reason:
                            item.request_replacement_reason || null,
                        request_replacement_image_url:
                            item.request_replacement_image_url || null,
                    })),
                };
            });
            console.log("Fetched orders:", transformedOrders);
            setOrders(transformedOrders);

            // Check and auto-cancel stale home delivery orders
            await checkAndCancelStaleOrders(transformedOrders);
        } catch (error) {
            console.error("Error fetching orders:", error);
        } finally {
            setLoading(false);
        }
    };

    // Real-time subscription to orders
    useEffect(() => {
        if (!user?.id) return;

        // Helper function to format a single order using the same logic as fetchOrders
        const formatOrder = (rawOrder) => {
            const orderTotal = (rawOrder.order_items || []).reduce(
                (sum, item) => {
                    const price = parseFloat(item.price_at_purchase) || 0;
                    const quantity = parseFloat(item.quantity) || 0;
                    return sum + price * quantity;
                },
                0
            );

            return {
                id: rawOrder.id,
                customer_name: rawOrder.profiles?.name || "Unknown Customer",
                customer_contact: rawOrder.profiles?.contact || "",
                customer_address: rawOrder.profiles?.address || "",
                customer_avatar: getProfileAvatarUrl(rawOrder.profiles || {}),
                producer_address: rawOrder.producer?.address || "",
                total_amount:
                    orderTotal +
                    (parseFloat(rawOrder.delivery_fee_at_order) || 0),
                itemCount: (rawOrder.order_items || []).length,
                status: rawOrder.statuses?.name || "unknown",
                created_at: rawOrder.created_at,
                deliveryMethod: rawOrder.delivery_methods?.name || "Unknown",
                paymentMethod: rawOrder.payment_methods?.name || "Unknown",
                deliveryFee: parseFloat(rawOrder.delivery_fee_at_order) || 0,
                customerDetails: {
                    name: rawOrder.profiles?.name || "Unknown Customer",
                    phone: rawOrder.profiles?.contact || "",
                    address: rawOrder.profiles?.address || "",
                    email: rawOrder.profiles?.email || "Not provided",
                },
                items: (rawOrder.order_items || []).map((item) => ({
                    id: item.id,
                    product_id: item.product_id,
                    name: item.name_at_purchase || "Unknown Product",
                    quantity: parseFloat(item.quantity) || 0,
                    unit_price: parseFloat(item.price_at_purchase) || 0,
                    subtotal:
                        (parseFloat(item.price_at_purchase) || 0) *
                        (parseFloat(item.quantity) || 0),
                    category: item.products?.categories?.name || "Other",
                    image_url: item.products?.image_url || "",
                    request_replacement_reason:
                        item.request_replacement_reason || null,
                    request_replacement_image_url:
                        item.request_replacement_image_url || null,
                })),
            };
        };

        const channel = supabase
            .channel(`orders-producer-${user.id}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "orders",
                    filter: `seller_id=eq.${user.id}`,
                },
                async (payload) => {
                    // Re-select the new order with full relations
                    const { data: newOrderData, error } = await supabase
                        .from("orders")
                        .select(
                            `
                            *,
                            statuses!orders_status_id_fkey (name),
                            delivery_methods!orders_delivery_method_id_fkey (name),
                            payment_methods!orders_payment_method_id_fkey (name),
                            profiles!orders_user_id_fkey (name, address, contact, email),
                            producer:profiles!orders_seller_id_fkey (name, address, contact),
                            order_items (*, products (*, categories (name)))
                        `
                        )
                        .eq("id", payload.new.id)
                        .single();

                    if (!error && newOrderData) {
                        const formatted = formatOrder(newOrderData);
                        setOrders((prev) => [formatted, ...prev]);
                    }
                }
            )
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "orders",
                    filter: `seller_id=eq.${user.id}`,
                },
                async (payload) => {
                    // Re-select the updated order with full relations
                    const { data: updatedOrderData, error } = await supabase
                        .from("orders")
                        .select(
                            `
                            *,
                            statuses!orders_status_id_fkey (name),
                            delivery_methods!orders_delivery_method_id_fkey (name),
                            payment_methods!orders_payment_method_id_fkey (name),
                            profiles!orders_user_id_fkey (name, address, contact, email),
                            producer:profiles!orders_seller_id_fkey (name, address, contact),
                            order_items (*, products (*, categories (name)))
                        `
                        )
                        .eq("id", payload.new.id)
                        .single();

                    if (!error && updatedOrderData) {
                        const formatted = formatOrder(updatedOrderData);
                        setOrders((prev) =>
                            prev.map((o) =>
                                o.id === updatedOrderData.id ? formatted : o
                            )
                        );
                    }
                }
            )
            .on(
                "postgres_changes",
                {
                    event: "DELETE",
                    schema: "public",
                    table: "orders",
                    filter: `seller_id=eq.${user.id}`,
                },
                (payload) => {
                    setOrders((prev) =>
                        prev.filter((o) => o.id !== payload.old.id)
                    );
                }
            )
            .subscribe();

        return () => {
            channel.unsubscribe();
        };
    }, [user?.id]);

    // Check and auto-cancel stale orders (any delivery method) created before today
    const checkAndCancelStaleOrders = async (fetchedOrders) => {
        if (
            !user?.id ||
            !Array.isArray(fetchedOrders) ||
            fetchedOrders.length === 0
        ) {
            return;
        }

        const today = new Date();
        const todayStart = new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate()
        );

        try {
            // Find orders that meet the stale criteria
            const staleOrders = fetchedOrders.filter((order) => {
                const isNotCompleted = order.status !== "completed";
                const isNotCancelled = order.status !== "cancelled";
                const createdDate = new Date(order.created_at);
                const createdDateStart = new Date(
                    createdDate.getFullYear(),
                    createdDate.getMonth(),
                    createdDate.getDate()
                );
                const isBeforeToday = createdDateStart < todayStart;

                return isNotCompleted && isNotCancelled && isBeforeToday;
            });

            if (staleOrders.length === 0) {
                return; // No stale orders to cancel
            }

            // Cancel each stale order and restore stock
            for (const staleOrder of staleOrders) {
                try {
                    // Restore stock for all items in the stale order
                    for (const item of staleOrder.items) {
                        try {
                            const { data: currentProduct, error: fetchError } =
                                await supabase
                                    .from("products")
                                    .select("stock")
                                    .eq("id", item.product_id)
                                    .single();

                            if (fetchError) {
                                console.error(
                                    `Error fetching stock for product ${item.product_id}:`,
                                    fetchError
                                );
                                continue;
                            }

                            const restoredStock =
                                currentProduct.stock + item.quantity;

                            const { error: stockError } = await supabase
                                .from("products")
                                .update({ stock: restoredStock })
                                .eq("id", item.product_id);

                            if (stockError) {
                                console.error(
                                    `Error restoring stock for product ${item.product_id}:`,
                                    stockError
                                );
                            }
                        } catch (stockRestoreError) {
                            console.error(
                                "Error in stock restoration:",
                                stockRestoreError
                            );
                        }
                    }

                    // Cancel the order (status_id: 8)
                    const { error: cancelError } = await supabase
                        .from("orders")
                        .update({ status_id: 8 })
                        .eq("id", staleOrder.id);

                    if (cancelError) {
                        console.error(
                            `Error cancelling stale order ${staleOrder.id}:`,
                            cancelError
                        );
                    } else {
                        console.log(
                            `Auto-cancelled stale home delivery order: ${staleOrder.id}`
                        );
                    }
                } catch (singleOrderError) {
                    console.error(
                        `Error processing stale order ${staleOrder.id}:`,
                        singleOrderError
                    );
                }
            }

            // Update local state to reflect cancellations
            setOrders((prev) =>
                prev.map((order) =>
                    staleOrders.some((stale) => stale.id === order.id)
                        ? { ...order, status: "cancelled" }
                        : order
                )
            );
        } catch (error) {
            console.error("Error checking and cancelling stale orders:", error);
        }
    };

    const updateOrderStatus = async (orderId, newStatus) => {
        try {
            // Map status names to IDs from the statuses table
            const statusMap = {
                pending: 3,
                confirmed: 4,
                preparing: 5,
                "ready for pickup": 6,
                completed: 7,
                cancelled: 8,
            };

            const statusId = statusMap[newStatus];
            if (!statusId) {
                console.error("Unknown status:", newStatus);
                return;
            }

            // If cancelling the order, restore stock for all order items
            if (newStatus === "cancelled") {
                // Find the order to get its items
                const orderToCancel = orders.find(
                    (order) => order.id === orderId
                );
                if (orderToCancel) {
                    // Restore stock for each item in the order
                    for (const item of orderToCancel.items) {
                        try {
                            // Get current stock
                            const { data: currentProduct, error: fetchError } =
                                await supabase
                                    .from("products")
                                    .select("stock")
                                    .eq("id", item.product_id)
                                    .single();

                            if (fetchError) {
                                console.error(
                                    "Error fetching current stock for product",
                                    item.product_id,
                                    ":",
                                    fetchError
                                );
                                continue;
                            }

                            // Restore stock
                            const restoredStock =
                                currentProduct.stock + item.quantity;

                            const { error: stockError } = await supabase
                                .from("products")
                                .update({ stock: restoredStock })
                                .eq("id", item.product_id);

                            if (stockError) {
                                console.error(
                                    "Error restoring stock for product",
                                    item.product_id,
                                    ":",
                                    stockError
                                );
                            } else {
                                console.log(
                                    `Restored stock for product ${item.product_id}: ${currentProduct.stock} + ${item.quantity} = ${restoredStock}`
                                );
                            }
                        } catch (stockRestoreError) {
                            console.error(
                                "Error in stock restoration:",
                                stockRestoreError
                            );
                        }
                    }
                }
            }

            const { error } = await supabase
                .from("orders")
                .update({ status_id: statusId })
                .eq("id", orderId);

            if (error) throw error;

            // Update local state
            setOrders((prev) =>
                prev.map((order) =>
                    order.id === orderId
                        ? { ...order, status: newStatus }
                        : order
                )
            );
        } catch (error) {
            console.error("Error updating order status:", error);
            alert("Failed to update order status. Please try again.");
        }
    };

    // Handle resolving a replacement request
    const handleResolveRequest = async () => {
        if (!viewRequestModal.item) return;

        const itemId = viewRequestModal.item.id;
        const imageUrl = viewRequestModal.item.request_replacement_image_url;

        setResolvingRequestId(itemId);

        try {
            // Step 1: Find the parent order and buyer ID
            const parentOrder = orders.find((order) =>
                order.items.some((item) => item.id === itemId)
            );

            if (!parentOrder) {
                throw new Error("Order not found for this item");
            }

            // Extract buyer/consumer ID from the order
            // Note: orders are fetched with profiles!orders_user_id_fkey, but we need user_id from the order
            // We'll fetch it fresh to be safe
            const { data: orderData, error: orderFetchError } = await supabase
                .from("orders")
                .select("user_id, id")
                .eq("id", parentOrder.id)
                .single();

            if (orderFetchError) {
                throw new Error(
                    `Failed to fetch order details: ${orderFetchError.message}`
                );
            }

            const buyerId = orderData.user_id;

            // Step 2: Check for existing conversation or create one
            const { data: existingConv, error: convFetchError } = await supabase
                .from("conversations")
                .select("id")
                .eq("consumer_id", buyerId)
                .eq("producer_id", user.id)
                .maybeSingle();

            if (convFetchError && convFetchError.code !== "PGRST116") {
                throw new Error(
                    `Failed to check conversation: ${convFetchError.message}`
                );
            }

            let conversationId;

            if (existingConv) {
                conversationId = existingConv.id;
            } else {
                // Create a new conversation
                const { data: newConv, error: convCreateError } = await supabase
                    .from("conversations")
                    .insert({
                        user_id: buyerId,
                        seller_id: user.id,
                    })
                    .select("id")
                    .single();

                if (convCreateError) {
                    throw new Error(
                        `Failed to create conversation: ${convCreateError.message}`
                    );
                }

                conversationId = newConv.id;
            }

            // Step 3: Insert the automated message
            const messageBody = `✅ Replacement Request Resolved: ${viewRequestModal.item.name} (Order #${parentOrder.id})`;

            const { error: messageError } = await supabase
                .from("messages")
                .insert({
                    conversation_id: conversationId,
                    sender_id: user.id,
                    body: messageBody,
                });

            if (messageError) {
                console.warn(
                    "Failed to send resolution message, but continuing with request resolution:",
                    messageError
                );
            }

            // Step 4: Delete the image from storage
            if (imageUrl) {
                const deleteResult = await deleteImageFromUrl(
                    imageUrl,
                    "request_replacement_images"
                );
                if (!deleteResult.success) {
                    console.warn(
                        "Failed to delete image, but continuing with request resolution:",
                        deleteResult.error
                    );
                }
            }

            // Step 5: Update the order_items table to clear the replacement request
            const { error: updateError } = await supabase
                .from("order_items")
                .update({
                    request_replacement_reason: null,
                    request_replacement_image_url: null,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", itemId);

            if (updateError) {
                throw new Error(
                    `Failed to resolve request: ${updateError.message}`
                );
            }

            // Step 6: Update local state
            setOrders((prev) =>
                prev.map((order) => ({
                    ...order,
                    items: order.items.map((item) =>
                        item.id === itemId
                            ? {
                                  ...item,
                                  request_replacement_reason: null,
                                  request_replacement_image_url: null,
                              }
                            : item
                    ),
                }))
            );

            // Step 7: Show success and close modal
            toast.success("Replacement request resolved successfully!");
            setViewRequestModal({ open: false, item: null });
        } catch (error) {
            console.error("Error resolving request:", error);
            toast.error(
                error.message ||
                    "Failed to resolve replacement request. Please try again."
            );
        } finally {
            setResolvingRequestId(null);
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
                    item.name.toLowerCase().includes(searchTerm.toLowerCase())
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
                (order) => activeTab === "all" || order.status === activeTab
            )
        )
    );

    // Create tabs array for tab-style UI
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

    // Compute status counts
    const statusCounts = {
        all: orders.length,
        ...orderStatuses.reduce((acc, status) => {
            acc[status.value] = orders.filter(
                (order) => order.status === status.value
            ).length;
            return acc;
        }, {}),
    };

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
            {/* Inject animation styles */}
            <style>{styles}</style>

            {/* Header */}
            <div className="fixed top-0 left-0 w-full bg-white shadow-md z-50 px-4 py-3">
                <h1 className="text-lg font-semibold text-primary text-center">
                    Orders
                </h1>
            </div>

            <div className="w-full max-w-4xl mx-4 sm:mx-auto my-16">
                {/* Policy Notice Banner */}
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg mb-4 text-sm flex items-center gap-2">
                    <span className="text-base mb-0.5">⚠️</span>
                    <span>
                        To guarantee freshness for the customer, All orders
                        expire at midnight. Please complete delivery today to
                        avoid auto-cancellation.
                    </span>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
                    <div className="flex overflow-x-auto">
                        {tabs.map((tab) => {
                            const hasReadyOrders =
                                tab.id === "ready for pickup" && tab.count > 0;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex-1 min-w-fit px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                                        activeTab === tab.id
                                            ? "text-primary border-primary bg-primary/5"
                                            : "text-gray-500 border-transparent hover:text-gray-700"
                                    } ${
                                        hasReadyOrders
                                            ? "animate-ready-pulse"
                                            : ""
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
                            );
                        })}
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
                            {activeTab === "all"
                                ? "You haven't received any orders yet"
                                : `No ${activeTab} orders at the moment`}
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
                                    id={`order-${order.id}`}
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
                                            <div className="flex items-center gap-3 flex-1">
                                                {order.customer_avatar ? (
                                                    <img
                                                        src={
                                                            order.customer_avatar
                                                        }
                                                        alt={
                                                            order.customer_name
                                                        }
                                                        className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                                                    />
                                                ) : (
                                                    <img
                                                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                                                            order.customer_name
                                                        )}&background=random`}
                                                        alt={
                                                            order.customer_name
                                                        }
                                                        className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                                                    />
                                                )}
                                                <div>
                                                    <h3 className="font-semibold text-gray-800">
                                                        Order #{order.id}
                                                    </h3>
                                                    <p className="text-sm text-gray-600">
                                                        {order.customer_name}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {order.customer_contact}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span
                                                    className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}
                                                >
                                                    <Icon
                                                        icon={statusConfig.icon}
                                                        width="12"
                                                        height="12"
                                                        className="inline mb-0.5 mr-1"
                                                    />
                                                    {(order.status ===
                                                        "ready for pickup" &&
                                                        (order.deliveryMethod ===
                                                        "Farm Pickup"
                                                            ? "Ready for Pickup"
                                                            : "Ready for Delivery")) ||
                                                        statusConfig.label}
                                                </span>
                                                <p className="text-sm text-gray-500 mt-2">
                                                    {formatDate(
                                                        order.created_at
                                                    )}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="text-lg font-bold text-primary">
                                                    ₱
                                                    {(
                                                        order.total_amount || 0
                                                    ).toFixed(2)}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    · {order.itemCount || 0}{" "}
                                                    {order.itemCount === 1
                                                        ? "item"
                                                        : "items"}
                                                </p>
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                                <div className="flex items-center gap-3">
                                                    <div className="text-right">
                                                        <p className="text-xs text-primary bg-primary/10 px-2 py-1 rounded-full flex items-center gap-1 whitespace-nowrap">
                                                            <Icon
                                                                icon={
                                                                    order.deliveryMethod ===
                                                                    "Farm Pickup"
                                                                        ? "mingcute:location-line"
                                                                        : "mingcute:truck-line"
                                                                }
                                                                width="12"
                                                                height="12"
                                                            />
                                                            {order.deliveryMethod ===
                                                            "Farm Pickup"
                                                                ? " Farm Pickup"
                                                                : "Home Delivery"}
                                                        </p>
                                                        {/* {order.status ===
                                                            "ready for pickup" && (
                                                            <p className="text-xs text-green-600 mt-1 font-medium">
                                                                {order.deliveryMethod ===
                                                                "Farm Pickup"
                                                                    ? "Ready for Pickup"
                                                                    : "Ready for Delivery"}
                                                            </p>
                                                        )} */}
                                                    </div>
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
                                                {/* {order.status === "ready for pickup" && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            updateOrderStatus(order.id, "cancelled");
                                                        }}
                                                        className="text-xs px-3 py-1 bg-red-50 text-red-600 rounded-full hover:bg-red-100 transition-colors font-medium"
                                                    >
                                                        Cancel Order
                                                    </button>
                                                )} */}
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
                                                                        item.image_url
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
                                                                        {(
                                                                            item.unit_price ||
                                                                            0
                                                                        ).toFixed(
                                                                            2
                                                                        )}
                                                                        /kg ×{" "}
                                                                        {item.quantity ||
                                                                            0}
                                                                        kg
                                                                    </p>
                                                                    {item.request_replacement_reason && (
                                                                        <button
                                                                            onClick={() =>
                                                                                setViewRequestModal(
                                                                                    {
                                                                                        open: true,
                                                                                        item: item,
                                                                                    }
                                                                                )
                                                                            }
                                                                            className="text-xs text-orange-600 underline cursor-pointer hover:text-orange-700 mt-1"
                                                                        >
                                                                            View
                                                                            Replacement
                                                                            Request
                                                                        </button>
                                                                    )}
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="text-sm font-medium text-gray-800">
                                                                        ₱
                                                                        {(
                                                                            item.subtotal ||
                                                                            0
                                                                        ).toFixed(
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
                                                                "Farm Pickup"
                                                                    ? "mingcute:location-line"
                                                                    : "mingcute:truck-line"
                                                            }
                                                            width="16"
                                                            height="16"
                                                            className="text-gray-500"
                                                        />
                                                        <span className="text-sm font-medium text-gray-700">
                                                            {order.deliveryMethod ===
                                                            "Farm Pickup"
                                                                ? "Farm Pickup"
                                                                : "Home Delivery"}
                                                        </span>
                                                    </div>
                                                    <div className="ml-5">
                                                        <p className="text-sm text-gray-600 mb-1">
                                                            {order.deliveryMethod ===
                                                            "Farm Pickup"
                                                                ? order.producer_address
                                                                : order.customer_address}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Payment Method */}
                                                <div className="bg-gray-50 rounded-lg p-3">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Icon
                                                            icon={
                                                                order.paymentMethod ===
                                                                "COD/COP"
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
                                                            "COD/COP"
                                                                ? `Cash on ${
                                                                      order.deliveryMethod ===
                                                                      "Farm Pickup"
                                                                          ? "Pickup"
                                                                          : "Delivery"
                                                                  }`
                                                                : "Online Payment"}
                                                        </p>
                                                        {order.status !==
                                                            "cancelled" &&
                                                            order.status !==
                                                                "completed" &&
                                                            order.paymentMethod ===
                                                                "Cash on Delivery" && (
                                                                <p className="text-xs text-orange-600">
                                                                    Payment due:
                                                                    ₱
                                                                    {(
                                                                        order.total_amount ||
                                                                        0
                                                                    ).toFixed(
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
                                                                (order.total_amount ||
                                                                    0) -
                                                                (order.deliveryFee ||
                                                                    0)
                                                            ).toFixed(2)}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-600">
                                                            {order.deliveryMethod ===
                                                            "Home Delivery"
                                                                ? "Delivery Fee"
                                                                : "Pickup Fee"}
                                                        </span>
                                                        <span className="text-gray-800">
                                                            {(order.deliveryFee ||
                                                                0) > 0
                                                                ? `₱${(
                                                                      order.deliveryFee ||
                                                                      0
                                                                  ).toFixed(2)}`
                                                                : "Free"}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between text-sm font-semibold border-t border-blue-200 pt-1">
                                                        <span className="text-blue-800">
                                                            Total
                                                        </span>
                                                        <span className="text-blue-800">
                                                            ₱
                                                            {(
                                                                order.total_amount ||
                                                                0
                                                            ).toFixed(2)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Customer Information */}
                                            <div className="bg-gray-50 rounded-lg p-3 mb-4 border-gray-200 border">
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
                                            <div className="flex justify-end flex-wrap gap-2">
                                                {order.status === "pending" && (
                                                    <>
                                                        <button
                                                            onClick={() =>
                                                                updateOrderStatus(
                                                                    order.id,
                                                                    "confirmed"
                                                                )
                                                            }
                                                            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                                                        >
                                                            <Icon
                                                                icon="mingcute:check-circle-fill"
                                                                width="16"
                                                                height="16"
                                                                className="mr-1"
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
                                                            className="px-4 py-2 border border-red-300 text-red-600 rounded-lg text-sm hover:bg-red-50 transition-colors"
                                                        >
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
                                                            className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg text-sm hover:bg-orange-700 transition-colors"
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
                                                                "ready for pickup"
                                                            )
                                                        }
                                                        className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition-colors"
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
                                                {order.status ===
                                                    "ready for pickup" && (
                                                    <>
                                                        <button
                                                            onClick={() =>
                                                                updateOrderStatus(
                                                                    order.id,
                                                                    "completed"
                                                                )
                                                            }
                                                            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors"
                                                        >
                                                            <Icon
                                                                icon="mingcute:check-circle-fill"
                                                                width="16"
                                                                height="16"
                                                                className="mr-1"
                                                            />
                                                            Complete Order
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
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* View Replacement Request Modal */}
            {viewRequestModal.open && viewRequestModal.item && (
                <>
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black opacity-50"></div>
                    <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[10000] max-h-[90vh] overflow-y-auto">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                <Icon
                                    icon="mingcute:refresh-2-line"
                                    width="20"
                                    height="20"
                                    className="text-orange-600"
                                />
                                Replacement Request Details
                            </h2>
                            <button
                                onClick={() =>
                                    setViewRequestModal({
                                        open: false,
                                        item: null,
                                    })
                                }
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <Icon
                                    icon="mingcute:close-line"
                                    width="20"
                                    height="20"
                                />
                            </button>
                        </div>

                        {/* Item Info */}
                        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                            <h3 className="font-medium text-gray-800 mb-1">
                                {viewRequestModal.item.name}
                            </h3>
                            <p className="text-xs text-gray-600">
                                Qty: {viewRequestModal.item.quantity} kg @ ₱
                                {(
                                    viewRequestModal.item.unit_price || 0
                                ).toFixed(2)}
                                /kg
                            </p>
                        </div>

                        {/* Reason */}
                        <div className="mb-4">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Reason:
                            </label>
                            <p className="text-sm text-gray-700 bg-orange-50 p-3 rounded-lg border border-orange-200">
                                {
                                    viewRequestModal.item
                                        .request_replacement_reason
                                }
                            </p>
                        </div>

                        {/* Proof Image */}
                        {viewRequestModal.item
                            .request_replacement_image_url && (
                            <div className="mb-4">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Proof:
                                </label>
                                <img
                                    src={
                                        viewRequestModal.item
                                            .request_replacement_image_url
                                    }
                                    alt="Replacement proof"
                                    className="w-full rounded-lg border border-gray-300 object-cover max-h-56"
                                    onError={(e) => {
                                        e.target.src = "/assets/gray-apple.png";
                                    }}
                                />
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3 pt-4 border-t border-gray-200">
                            <button
                                onClick={() =>
                                    setViewRequestModal({
                                        open: false,
                                        item: null,
                                    })
                                }
                                disabled={resolvingRequestId}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                            >
                                Close
                            </button>
                            <button
                                onClick={handleResolveRequest}
                                disabled={
                                    resolvingRequestId ===
                                    viewRequestModal.item.id
                                }
                                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {resolvingRequestId ===
                                viewRequestModal.item.id ? (
                                    <>
                                        <Icon
                                            icon="mingcute:loading-line"
                                            width="16"
                                            height="16"
                                            className="animate-spin"
                                        />
                                        Resolving...
                                    </>
                                ) : (
                                    <>
                                        <Icon
                                            icon="mingcute:check-circle-line"
                                            width="16"
                                            height="16"
                                        />
                                        Resolve Request
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </>
            )}

            <ProducerNavigationBar />
        </div>
    );
}

export default Orders;
