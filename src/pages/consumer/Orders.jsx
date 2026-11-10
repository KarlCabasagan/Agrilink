import { useState, useEffect, useContext, useRef } from "react";
import { Icon } from "@iconify/react";
import { Link, useNavigate } from "react-router-dom";
import NavigationBar from "../../components/NavigationBar";
import ReviewModal from "../../components/ReviewModal";
import StateView from "../../components/StateView.jsx";
import supabase from "../../SupabaseClient";
import { AuthContext } from "../../context/AuthContext.jsx";
import { toast } from "react-hot-toast";
import { getProfileAvatarUrl } from "../../utils/avatarUtils.js";
import { uploadImage, validateImageFile } from "../../utils/imageUpload.js";

// Add subtle pulse animation for ready orders tab
const styles = `
  @keyframes subtle-pulse {
    0%, 100% {
      opacity: 1;
      box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7);
    }
    50% {
      opacity: 0.95;
      box-shadow: 0 0 0 4px rgba(34, 197, 94, 0);
    }
  }
  
  .animate-ready-pulse {
    animation: subtle-pulse 2s infinite;
  }
`;

function Orders() {
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const [activeTab, setActiveTab] = useState("all");
    const [expandedOrders, setExpandedOrders] = useState({});
    const [expandedFarmers, setExpandedFarmers] = useState({});
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [reviewModal, setReviewModal] = useState({
        isOpen: false,
        productId: null,
        productName: "",
    });
    const [reorderModal, setReorderModal] = useState({
        isOpen: false,
        message: "",
    });
    const [productReviews, setProductReviews] = useState({});
    const [replacementModal, setReplacementModal] = useState({
        isOpen: false,
        selectedItemId: null,
        selectedOrderId: null,
        reason: "",
        customReason: "",
        imageFile: null,
        imagePreview: null,
        isLoading: false,
    });
    const [trackingModal, setTrackingModal] = useState({
        open: false,
        order: null,
    });
    const replacementFileInputRef = useRef(null);

    // Batch check for existing reviews when orders are loaded or updated
    useEffect(() => {
        const checkReviews = async () => {
            if (!user || orders.length === 0) return;

            try {
                // Collect all unique, non-null product_id values from order items
                const productIds = new Set();
                for (const order of orders) {
                    for (const item of order.items) {
                        if (item.product_id) {
                            productIds.add(item.product_id);
                        }
                    }
                }

                if (productIds.size === 0) {
                    setProductReviews({});
                    return;
                }

                // Single batch query: fetch all reviews for these products by this user
                const { data: reviewsData, error: reviewsError } =
                    await supabase
                        .from("reviews")
                        .select("product_id")
                        .eq("user_id", user.id)
                        .in("product_id", Array.from(productIds));

                if (reviewsError) {
                    // Only log real network/permission errors; 406 "multiple rows" is expected and means reviewed
                    if (reviewsError.code !== "PGRST106") {
                        console.error("Error fetching reviews:", reviewsError);
                    }
                    setProductReviews({});
                    return;
                }

                // Build productReviews map: any product with row count ≥ 1 is marked as reviewed
                const reviews = {};
                for (const productId of productIds) {
                    reviews[productId] = false;
                }
                for (const review of reviewsData || []) {
                    reviews[review.product_id] = true;
                }
                setProductReviews(reviews);
            } catch (error) {
                console.error("Unexpected error checking reviews:", error);
                setProductReviews({});
            }
        };

        checkReviews();
    }, [orders, user]);

    useEffect(() => {
        if (!user) {
            navigate("/login");
            return;
        }
        fetchOrders();
    }, [user, navigate]);

    // Real-time subscription to order changes
    useEffect(() => {
        if (!user?.id) return;

        const channel = supabase
            .channel("orders-realtime")
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "orders",
                    filter: `user_id=eq.${user.id}`,
                },
                async (payload) => {
                    const { eventType, new: newRow, old: oldRow } = payload;

                    if (eventType === "INSERT") {
                        // Fetch the full new order with all relations
                        const { data: orderData, error: fetchError } =
                            await supabase
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
                                .eq("id", newRow.id)
                                .single();

                        if (!fetchError && orderData) {
                            // Transform the new order using the same logic as fetchOrders
                            const itemsTotal = orderData.order_items.reduce(
                                (sum, item) =>
                                    sum +
                                    item.price_at_purchase * item.quantity,
                                0
                            );
                            const total =
                                itemsTotal +
                                (orderData.delivery_fee_at_order || 0);

                            const transformedOrder = {
                                id: orderData.id,
                                date: orderData.created_at,
                                updated_at: orderData.updated_at,
                                status: orderData.statuses?.name || "unknown",
                                total: total,
                                deliveryMethod:
                                    orderData.delivery_methods?.name ||
                                    "unknown",
                                paymentMethod:
                                    orderData.payment_methods?.name ||
                                    "unknown",
                                deliveryFee:
                                    orderData.delivery_fee_at_order || 0,
                                sellerId: orderData.seller_id,
                                sellerName:
                                    orderData.profiles?.name ||
                                    "Unknown Seller",
                                sellerAddress:
                                    orderData.profiles?.address ||
                                    "Location not available",
                                sellerContact:
                                    orderData.profiles?.contact || "",
                                items: orderData.order_items.map((item) => ({
                                    id: item.id,
                                    product_id: item.product_id,
                                    name: item.name_at_purchase,
                                    price: item.price_at_purchase,
                                    quantity: item.quantity,
                                    image:
                                        item.products?.image_url ||
                                        "https://via.placeholder.com/300x200?text=No+Image",
                                    farmerName:
                                        orderData.profiles?.name ||
                                        "Unknown Seller",
                                    farmerId: orderData.seller_id,
                                    farmerPhone:
                                        orderData.profiles?.contact || "",
                                    farmerAddress:
                                        orderData.profiles?.address ||
                                        "Location not available",
                                    category:
                                        item.products?.categories?.name ||
                                        "Other",
                                    request_replacement_reason:
                                        item.request_replacement_reason || null,
                                    request_replacement_image_url:
                                        item.request_replacement_image_url ||
                                        null,
                                })),
                            };

                            // Prepend the new order to the list
                            setOrders((prev) => [transformedOrder, ...prev]);
                        }
                    } else if (eventType === "UPDATE") {
                        // Fetch just the updated order with all relations
                        const { data: orderData, error: fetchError } =
                            await supabase
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
                                .eq("id", newRow.id)
                                .single();

                        if (!fetchError && orderData) {
                            // Transform the updated order
                            const itemsTotal = orderData.order_items.reduce(
                                (sum, item) =>
                                    sum +
                                    item.price_at_purchase * item.quantity,
                                0
                            );
                            const total =
                                itemsTotal +
                                (orderData.delivery_fee_at_order || 0);

                            const transformedOrder = {
                                id: orderData.id,
                                date: orderData.created_at,
                                updated_at: orderData.updated_at,
                                status: orderData.statuses?.name || "unknown",
                                total: total,
                                deliveryMethod:
                                    orderData.delivery_methods?.name ||
                                    "unknown",
                                paymentMethod:
                                    orderData.payment_methods?.name ||
                                    "unknown",
                                deliveryFee:
                                    orderData.delivery_fee_at_order || 0,
                                sellerId: orderData.seller_id,
                                sellerName:
                                    orderData.profiles?.name ||
                                    "Unknown Seller",
                                sellerAddress:
                                    orderData.profiles?.address ||
                                    "Location not available",
                                sellerContact:
                                    orderData.profiles?.contact || "",
                                items: orderData.order_items.map((item) => ({
                                    id: item.id,
                                    product_id: item.product_id,
                                    name: item.name_at_purchase,
                                    price: item.price_at_purchase,
                                    quantity: item.quantity,
                                    image:
                                        item.products?.image_url ||
                                        "https://via.placeholder.com/300x200?text=No+Image",
                                    farmerName:
                                        orderData.profiles?.name ||
                                        "Unknown Seller",
                                    farmerId: orderData.seller_id,
                                    farmerPhone:
                                        orderData.profiles?.contact || "",
                                    farmerAddress:
                                        orderData.profiles?.address ||
                                        "Location not available",
                                    category:
                                        item.products?.categories?.name ||
                                        "Other",
                                    request_replacement_reason:
                                        item.request_replacement_reason || null,
                                    request_replacement_image_url:
                                        item.request_replacement_image_url ||
                                        null,
                                })),
                            };

                            // Update only the affected order, preserve other objects for React rendering optimization
                            setOrders((prev) =>
                                prev.map((o) =>
                                    o.id === transformedOrder.id
                                        ? transformedOrder
                                        : o
                                )
                            );
                        }
                    } else if (eventType === "DELETE") {
                        // Remove the deleted order from the list
                        setOrders((prev) =>
                            prev.filter((o) => o.id !== oldRow.id)
                        );
                    }
                }
            )
            .subscribe();

        return () => {
            channel.unsubscribe();
        };
    }, [user?.id]);

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
                    updated_at: order.updated_at,
                    status: order.statuses?.name || "unknown",
                    total: total,
                    deliveryMethod: order.delivery_methods?.name || "unknown",
                    paymentMethod: order.payment_methods?.name || "unknown",
                    deliveryFee: order.delivery_fee_at_order || 0,
                    sellerId: order.seller_id,
                    sellerName: order.profiles?.name || "Unknown Seller",
                    sellerAddress:
                        order.profiles?.address || "Location not available",
                    sellerContact: order.profiles?.contact || "",
                    items: order.order_items.map((item) => ({
                        id: item.id,
                        product_id: item.product_id, // Add product_id for cart functionality
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
                        request_replacement_reason:
                            item.request_replacement_reason || null,
                        request_replacement_image_url:
                            item.request_replacement_image_url || null,
                    })),
                };
            });

            setOrders(transformedOrders);

            // Check and auto-cancel stale home delivery orders
            await checkAndCancelStaleOrders(transformedOrders);
        } catch (error) {
            console.error("Error fetching orders:", error);
            setError("Failed to fetch orders. Please try again.");
        } finally {
            setLoading(false);
        }
    };

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
                const createdDate = new Date(order.date);
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

            // Cancel each stale order
            for (const staleOrder of staleOrders) {
                try {
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
                return "text-amber-700 bg-amber-50 border border-amber-200/70";
            case "confirmed":
                return "text-sky-700 bg-sky-50 border border-sky-200/70";
            case "preparing":
                return "text-orange-700 bg-orange-50 border border-orange-200/70";
            case "ready for pickup":
                return "text-indigo-700 bg-indigo-50 border border-indigo-200/70";
            case "completed":
                return "text-emerald-700 bg-emerald-50 border border-emerald-200/70";
            case "cancelled":
                return "text-rose-700 bg-rose-50 border border-rose-200/70";
            default:
                return "text-slate-600 bg-slate-50 border border-slate-200/70";
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

    const handleReorder = async (order) => {
        try {
            console.log("Adding order items to cart:", order);

            // Get or create user's cart
            let { data: cartData, error: cartError } = await supabase
                .from("carts")
                .select("id")
                .eq("user_id", user.id)
                .single();

            if (cartError && cartError.code === "PGRST116") {
                // Cart doesn't exist, create one
                const { data: newCart, error: createCartError } = await supabase
                    .from("carts")
                    .insert({ user_id: user.id })
                    .select("id")
                    .single();

                if (createCartError) throw createCartError;
                cartData = newCart;
            } else if (cartError) {
                throw cartError;
            }

            // Track results for summary
            const addedItems = [];
            const cappedItems = [];
            const skippedItems = [];

            // Process each order item
            for (const orderItem of order.items) {
                try {
                    // Fetch current product stock
                    const { data: productData, error: stockError } =
                        await supabase
                            .from("products")
                            .select("stock")
                            .eq("id", orderItem.product_id)
                            .single();

                    if (stockError) {
                        console.error(
                            `Stock check failed for product ${orderItem.product_id}:`,
                            stockError
                        );
                        skippedItems.push(orderItem.name);
                        continue;
                    }

                    const availableStock = productData?.stock || 0;

                    // Check if cart item already exists
                    const {
                        data: existingCartItem,
                        error: cartItemCheckError,
                    } = await supabase
                        .from("cart_items")
                        .select("id, quantity")
                        .eq("cart_id", cartData.id)
                        .eq("product_id", orderItem.product_id)
                        .single();

                    // Ignore "no rows" error, which is expected when cart item doesn't exist
                    if (
                        cartItemCheckError &&
                        cartItemCheckError.code !== "PGRST116"
                    ) {
                        console.error(
                            `Cart item check failed for product ${orderItem.product_id}:`,
                            cartItemCheckError
                        );
                        skippedItems.push(orderItem.name);
                        continue;
                    }

                    if (existingCartItem) {
                        // Update existing cart item
                        const newQuantity = Math.min(
                            existingCartItem.quantity + orderItem.quantity,
                            availableStock
                        );

                        // Only update if quantity actually increases
                        if (
                            newQuantity > existingCartItem.quantity &&
                            newQuantity > 0
                        ) {
                            const quantityAdded =
                                newQuantity - existingCartItem.quantity;

                            const { error: updateError } = await supabase
                                .from("cart_items")
                                .update({ quantity: newQuantity })
                                .eq("id", existingCartItem.id);

                            if (updateError) {
                                console.error(
                                    `Failed to update cart item for product ${orderItem.product_id}:`,
                                    updateError
                                );
                                skippedItems.push(orderItem.name);
                            } else {
                                if (quantityAdded < orderItem.quantity) {
                                    cappedItems.push(
                                        `${orderItem.name} (capped at available stock)`
                                    );
                                } else {
                                    addedItems.push(orderItem.name);
                                }
                            }
                        } else if (newQuantity === existingCartItem.quantity) {
                            // Already at maximum stock
                            cappedItems.push(
                                `${orderItem.name} (already at max stock)`
                            );
                        } else {
                            // Would exceed stock, skip
                            skippedItems.push(
                                `${orderItem.name} (insufficient stock)`
                            );
                        }
                    } else {
                        // Insert new cart item
                        const quantityToAdd = Math.min(
                            orderItem.quantity,
                            availableStock
                        );

                        if (quantityToAdd > 0) {
                            const { error: insertError } = await supabase
                                .from("cart_items")
                                .insert({
                                    cart_id: cartData.id,
                                    product_id: orderItem.product_id,
                                    quantity: quantityToAdd,
                                });

                            if (insertError) {
                                console.error(
                                    `Failed to insert cart item for product ${orderItem.product_id}:`,
                                    insertError
                                );
                                skippedItems.push(orderItem.name);
                            } else {
                                if (quantityToAdd < orderItem.quantity) {
                                    cappedItems.push(
                                        `${orderItem.name} (quantity limited by stock)`
                                    );
                                } else {
                                    addedItems.push(orderItem.name);
                                }
                            }
                        } else {
                            // Out of stock
                            skippedItems.push(
                                `${orderItem.name} (out of stock)`
                            );
                        }
                    }
                } catch (itemError) {
                    console.error(
                        `Unexpected error processing item ${orderItem.product_id}:`,
                        itemError
                    );
                    skippedItems.push(orderItem.name);
                }
            }

            // Determine outcome and show appropriate feedback
            if (addedItems.length === 0 && cappedItems.length === 0) {
                // Nothing could be added
                const message =
                    skippedItems.length > 0
                        ? `Could not add items to cart: ${skippedItems.join(
                              ", "
                          )} are out of stock or unavailable.`
                        : "No items could be added to cart.";

                setReorderModal({
                    isOpen: true,
                    message: message,
                });
            } else {
                // At least one item was added or capped
                console.log("Successfully added items to cart");

                // Build summary message
                let summaryMessage = "Items added to cart!";
                if (cappedItems.length > 0 && skippedItems.length > 0) {
                    summaryMessage += ` Some items were quantity-limited or unavailable: ${[
                        ...cappedItems,
                        ...skippedItems,
                    ].join(", ")}`;
                } else if (cappedItems.length > 0) {
                    summaryMessage += ` Note: ${cappedItems.join(
                        ", "
                    )} had quantities adjusted due to stock limits.`;
                } else if (skippedItems.length > 0) {
                    summaryMessage += ` Note: ${skippedItems.join(
                        ", "
                    )} could not be added.`;
                }

                // Show summary via toast if available, otherwise use reorderModal
                if (typeof toast !== "undefined" && toast.info) {
                    toast.info(summaryMessage);
                } else {
                    console.log(
                        "Toast not available, message:",
                        summaryMessage
                    );
                }

                navigate("/cart");
            }
        } catch (error) {
            console.error("Error adding items to cart:", error);
            setReorderModal({
                isOpen: true,
                message: "Failed to add items to cart. Please try again.",
            });
        }
    };

    const handleTrackOrder = (order) => {
        setTrackingModal({
            open: true,
            order: order,
        });
    };

    const handleMessageSeller = async (sellerId) => {
        if (!user?.id || !sellerId) {
            toast.error("Unable to start conversation");
            return;
        }

        try {
            // Check if a conversation exists
            const { data: existingConv, error: convFetchError } = await supabase
                .from("conversations")
                .select("id")
                .eq("consumer_id", user.id)
                .eq("producer_id", sellerId)
                .maybeSingle();

            if (convFetchError && convFetchError.code !== "PGRST116") {
                throw new Error(
                    `Failed to check conversation: ${convFetchError.message}`
                );
            }

            let conversationId;

            if (existingConv) {
                // Conversation exists, use it
                conversationId = existingConv.id;
            } else {
                // Create new conversation
                const { data: newConv, error: convCreateError } = await supabase
                    .from("conversations")
                    .insert({
                        consumer_id: user.id,
                        producer_id: sellerId,
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

            // Navigate to messages with conversation ID
            navigate(`/messages?conversation=${conversationId}`);
        } catch (error) {
            console.error("Error initiating conversation:", error);
            toast.error(
                error.message ||
                    "Failed to start conversation. Please try again."
            );
        }
    };

    const handleOpenReviewModal = (productId, productName) => {
        setReviewModal({
            isOpen: true,
            productId,
            productName,
        });
    };

    const handleReviewSubmitted = () => {
        // Update local state immediately for optimistic UI
        setProductReviews((prev) => ({
            ...prev,
            [reviewModal.productId]: true,
        }));

        // Refresh order data to ensure everything is in sync
        fetchOrders();
    };

    const handleCancelOrder = async (orderId) => {
        if (!window.confirm("Are you sure you want to cancel this order?")) {
            return;
        }

        try {
            // Find the order to be cancelled
            const order = orders.find((o) => o.id === orderId);
            if (!order) {
                throw new Error("Order not found");
            }

            // Start stock restoration process
            const stockUpdates = [];
            const originalStocks = new Map();

            // Collect current stock levels and prepare updates
            for (const item of order.items) {
                // Get current stock
                const { data: currentProduct, error: stockCheckError } =
                    await supabase
                        .from("products")
                        .select("stock")
                        .eq("id", item.product_id)
                        .single();

                if (stockCheckError) {
                    throw new Error(
                        `Failed to check product stock: ${stockCheckError.message}`
                    );
                }

                // Store original stock for potential rollback
                originalStocks.set(item.product_id, currentProduct.stock);

                // Prepare stock update
                stockUpdates.push({
                    id: item.product_id,
                    currentStock: currentProduct.stock,
                    quantity: item.quantity,
                });
            }

            // Update order status to cancelled
            const { error: statusError } = await supabase
                .from("orders")
                .update({
                    status_id: 8, // "cancelled" status ID
                    updated_at: new Date().toISOString(),
                })
                .eq("id", orderId)
                .eq("user_id", user.id);

            if (statusError) {
                throw new Error(
                    `Failed to update order status: ${statusError.message}`
                );
            }

            // Process all stock updates
            for (const update of stockUpdates) {
                const { error: updateError } = await supabase
                    .from("products")
                    .update({
                        stock: update.currentStock + update.quantity,
                        updated_at: new Date().toISOString(),
                    })
                    .eq("id", update.id);

                if (updateError) {
                    // Attempt to rollback stock updates
                    console.error(
                        "Stock update failed, attempting rollback..."
                    );

                    // Rollback previous stock updates
                    for (const [productId, originalStock] of originalStocks) {
                        await supabase
                            .from("products")
                            .update({
                                stock: originalStock,
                                updated_at: new Date().toISOString(),
                            })
                            .eq("id", productId);
                    }

                    // Revert order status
                    await supabase
                        .from("orders")
                        .update({
                            status_id: order.status_id,
                            updated_at: new Date().toISOString(),
                        })
                        .eq("id", orderId);

                    throw new Error(
                        "Failed to update product stocks. Changes have been rolled back."
                    );
                }
            }

            // Update local state
            setOrders((prev) =>
                prev.map((order) =>
                    order.id === orderId
                        ? { ...order, status: "cancelled" }
                        : order
                )
            );

            toast.success(
                "Order cancelled successfully and stock quantities restored"
            );
        } catch (error) {
            console.error("Error cancelling order:", error);
            toast.error(
                error.message || "Failed to cancel order. Please try again."
            );
        }
    };

    const replacementReasons = [
        "Received spoiled/rotten produce",
        "Item weight is significantly less than ordered",
        "Wrong item received",
        "Item withered/dried out",
        "Insect/Pest damage visible",
        "Others",
    ];

    const handleOpenReplacementModal = (orderId, itemId) => {
        setReplacementModal({
            isOpen: true,
            selectedItemId: itemId,
            selectedOrderId: orderId,
            reason: "",
            customReason: "",
            imageFile: null,
            imagePreview: null,
            isLoading: false,
        });
    };

    const handleCloseReplacementModal = () => {
        setReplacementModal({
            isOpen: false,
            selectedItemId: null,
            selectedOrderId: null,
            reason: "",
            customReason: "",
            imageFile: null,
            imagePreview: null,
            isLoading: false,
        });
    };

    const handleReplacementImageSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const validation = validateImageFile(file);
        if (!validation.valid) {
            toast.error(validation.error);
            return;
        }

        // Create preview URL
        const previewUrl = URL.createObjectURL(file);
        setReplacementModal((prev) => ({
            ...prev,
            imageFile: file,
            imagePreview: previewUrl,
        }));
    };

    const handleRemoveReplacementImage = () => {
        if (replacementModal.imagePreview) {
            URL.revokeObjectURL(replacementModal.imagePreview);
        }
        setReplacementModal((prev) => ({
            ...prev,
            imageFile: null,
            imagePreview: null,
        }));
    };

    const handleSubmitReplacementRequest = async () => {
        // Validation: Reason required
        if (!replacementModal.reason || replacementModal.reason.trim() === "") {
            toast.error("Please select a replacement reason");
            return;
        }

        // Validation: Custom reason required if "Others" selected
        if (
            replacementModal.reason === "Others" &&
            (!replacementModal.customReason ||
                !replacementModal.customReason.trim())
        ) {
            toast.error("Please enter a custom reason");
            return;
        }

        // Validation: Image file is mandatory
        if (!replacementModal.imageFile) {
            toast.error("Please upload an image as evidence");
            return;
        }

        // Validation: selectedItemId must be valid
        if (!replacementModal.selectedItemId) {
            toast.error("Invalid item selected. Please try again.");
            return;
        }

        // Validation: selectedOrderId must be valid
        if (!replacementModal.selectedOrderId) {
            toast.error("Invalid order selected. Please try again.");
            return;
        }

        setReplacementModal((prev) => ({ ...prev, isLoading: true }));

        try {
            let imageUrl = null;

            // Upload image (mandatory at this point)
            if (replacementModal.imageFile) {
                const uploadResult = await uploadImage(
                    replacementModal.imageFile,
                    "request_replacement_images",
                    user.id
                );

                if (!uploadResult.success) {
                    toast.error(
                        uploadResult.error ||
                            "Failed to upload image. Please try again."
                    );
                    setReplacementModal((prev) => ({
                        ...prev,
                        isLoading: false,
                    }));
                    return;
                }

                // Ensure imageUrl is correctly captured
                if (!uploadResult.url) {
                    toast.error(
                        "Image uploaded but URL not returned. Please try again."
                    );
                    setReplacementModal((prev) => ({
                        ...prev,
                        isLoading: false,
                    }));
                    return;
                }

                imageUrl = uploadResult.url;
            }

            // Determine final reason
            const finalReason =
                replacementModal.reason === "Others"
                    ? replacementModal.customReason.trim()
                    : replacementModal.reason;

            // Validate final reason is not empty
            if (!finalReason || finalReason.trim() === "") {
                throw new Error("Replacement reason cannot be empty");
            }

            // Update order_items table with proper payload
            const updatePayload = {
                request_replacement_reason: finalReason,
                request_replacement_image_url: imageUrl,
                updated_at: new Date().toISOString(),
            };

            // console.log(
            //     "Updating item with ID:",
            //     replacementModal.selectedItemId
            // );
            // console.log("Update payload:", updatePayload);

            const { data: updateData, error: updateError } = await supabase
                .from("order_items")
                .update(updatePayload)
                .eq("id", replacementModal.selectedItemId)
                .select();

            if (updateError) {
                console.error("Database update error:", updateError);
                throw updateError;
            }

            if (!updateData || updateData.length === 0) {
                throw new Error(
                    "Failed to update order item. Item not found or no rows affected."
                );
            }

            // console.log("Database update successful:", updateData);

            // Update local state optimistically
            const updatedOrders = orders.map((order) => {
                if (order.id === replacementModal.selectedOrderId) {
                    return {
                        ...order,
                        items: order.items.map((item) => {
                            if (item.id === replacementModal.selectedItemId) {
                                return {
                                    ...item,
                                    request_replacement_reason: finalReason,
                                    request_replacement_image_url: imageUrl,
                                };
                            }
                            return item;
                        }),
                    };
                }
                return order;
            });

            setOrders(updatedOrders);

            // ==========================================
            // MESSAGING LOGIC - Send notification to producer
            // ==========================================
            try {
                // Step 1: Retrieve context data from local orders state
                const order = orders.find(
                    (o) => o.id === replacementModal.selectedOrderId
                );
                const item = order?.items.find(
                    (i) => i.id === replacementModal.selectedItemId
                );

                if (!order || !item) {
                    console.error(
                        "Order or item not found in local state for messaging"
                    );
                    throw new Error(
                        "Failed to retrieve order details for messaging"
                    );
                }

                const farmerId = item.farmerId;
                const orderId = order.id;
                const itemName = item.name;

                // Step 2: Check if conversation exists or create new one
                const {
                    data: existingConversation,
                    error: conversationCheckError,
                } = await supabase
                    .from("conversations")
                    .select("id")
                    .eq("consumer_id", user.id)
                    .eq("producer_id", farmerId)
                    .single();

                let conversationId;

                if (
                    conversationCheckError &&
                    conversationCheckError.code === "PGRST116"
                ) {
                    // No conversation exists, create a new one
                    const {
                        data: newConversation,
                        error: conversationCreateError,
                    } = await supabase
                        .from("conversations")
                        .insert({
                            consumer_id: user.id,
                            producer_id: farmerId,
                        })
                        .select("id")
                        .single();

                    if (conversationCreateError) {
                        throw new Error(
                            `Failed to create conversation: ${conversationCreateError.message}`
                        );
                    }

                    conversationId = newConversation.id;
                } else if (conversationCheckError) {
                    throw new Error(
                        `Failed to check conversation: ${conversationCheckError.message}`
                    );
                } else {
                    // Conversation exists
                    conversationId = existingConversation.id;
                }

                // Step 3: Send message with replacement request details
                const replacementRequestData = {
                    orderId: orderId,
                    itemName: itemName,
                    reason: finalReason,
                    proofUrl: imageUrl,
                };
                const messageBody = `:::REPLACEMENT_REQUEST_V1:::${JSON.stringify(
                    replacementRequestData
                )}`;

                const { error: messageInsertError } = await supabase
                    .from("messages")
                    .insert({
                        conversation_id: conversationId,
                        sender_id: user.id,
                        body: messageBody,
                    });

                if (messageInsertError) {
                    console.error(
                        "Failed to send message to producer:",
                        messageInsertError
                    );
                    // Log error but don't throw - replacement request was already successful
                } else {
                    console.log("Message sent to producer successfully");
                }
            } catch (messagingError) {
                console.error("Messaging logic error:", messagingError);
                // Don't throw - the replacement request was already successful
                // Just log the error for debugging
            }
            // ==========================================
            // END OF MESSAGING LOGIC
            // ==========================================

            toast.success("Replacement request submitted successfully!");
            handleCloseReplacementModal();
        } catch (error) {
            console.error("Error submitting replacement request:", error);
            toast.error(
                error.message ||
                    "Failed to submit replacement request. Please try again."
            );
        } finally {
            setReplacementModal((prev) => ({ ...prev, isLoading: false }));
        }
    };

    return (
        <div className="min-h-screen w-full max-w-full overflow-x-hidden flex flex-col bg-slate-50/50 text-slate-900 pb-24 md:pb-12 md:pt-16">
            {/* Inject animation styles */}
            <style>{styles}</style>

            {/* Mobile Top Header */}
            <header className="md:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 flex items-center justify-between">
                <button
                    onClick={() => navigate(-1)}
                    className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center text-slate-600 hover:text-emerald-700 rounded-xl hover:bg-slate-100 active:scale-[0.97] transition-all"
                    aria-label="Back"
                >
                    <Icon
                        icon="mingcute:left-line"
                        width="22"
                        height="22"
                    />
                </button>
                <h1 className="text-base font-semibold text-slate-900">
                    My Orders
                </h1>
                <div className="w-11" aria-hidden="true" />
            </header>

            <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 md:mt-6">
                {/* Desktop Breadcrumbs */}
                <nav className="hidden md:flex items-center gap-2 text-xs font-medium text-slate-500 mb-4" aria-label="Breadcrumb">
                    <Link to="/" className="hover:text-emerald-700 transition-colors">Home</Link>
                    <span>/</span>
                    <span className="text-slate-900 font-semibold">My Orders</span>
                </nav>

                <div className="hidden md:flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Orders</h1>
                        <p className="text-xs text-slate-500 mt-1">Track and manage your farm-fresh deliveries and pickups</p>
                    </div>
                </div>

                {/* Status Filter Tabs */}
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-1.5 mb-6">
                    <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
                        {tabs.map((tab) => {
                            const hasReadyOrders =
                                tab.id === "ready for pickup" && tab.count > 0;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`min-h-[40px] px-3.5 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-all duration-150 flex items-center gap-1.5 active:scale-[0.98] ${
                                        activeTab === tab.id
                                            ? "bg-emerald-700 text-white shadow-xs"
                                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                                    } ${
                                        hasReadyOrders
                                            ? "animate-ready-pulse"
                                            : ""
                                    }`}
                                >
                                    <span>{tab.label}</span>
                                    {tab.count > 0 && (
                                        <span
                                            className={`min-w-[20px] h-5 px-1.5 text-[11px] font-bold rounded-full inline-flex items-center justify-center tabular-nums ${
                                                activeTab === tab.id
                                                    ? "bg-white/20 text-white"
                                                    : "bg-slate-200/80 text-slate-700"
                                            }`}
                                        >
                                            {tab.count}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Orders List */}
                {loading ? (
                    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-12 text-center">
                        <StateView type="loading" message="Loading your orders..." />
                    </div>
                ) : error ? (
                    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-8 text-center">
                        <StateView
                            type="error"
                            title="Error Loading Orders"
                            message={error}
                            action={{
                                label: "Try Again",
                                onClick: fetchOrders,
                                icon: "mingcute:refresh-1-line",
                            }}
                        />
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-8 text-center">
                        <StateView
                            type="empty"
                            title="No orders found"
                            message={
                                activeTab === "all"
                                    ? "You haven't placed any orders yet. Discover fresh local harvest today!"
                                    : `No ${activeTab} orders found.`
                            }
                            action={{
                                label: "Start Shopping",
                                onClick: () => navigate("/"),
                                icon: "mingcute:shopping-bag-1-line",
                            }}
                        />
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
                                    className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden transition-all duration-150"
                                >
                                    {/* Order Header - Clickable */}
                                    <div
                                        className="p-4 sm:p-5 border-b border-slate-100 cursor-pointer hover:bg-slate-50/60 transition-colors"
                                        onClick={() =>
                                            toggleOrderExpansion(order.id)
                                        }
                                    >
                                        <div className="flex justify-between items-start mb-2 sm:mb-3">
                                            <div>
                                                <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                                                    Order <span className="font-mono tabular-nums text-slate-700">#{order.id}</span>
                                                    <Icon
                                                        icon={
                                                            isExpanded
                                                                ? "mingcute:up-line"
                                                                : "mingcute:down-line"
                                                        }
                                                        width="16"
                                                        height="16"
                                                        className="text-slate-400"
                                                    />
                                                </h3>
                                                <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
                                                    Placed on {formatDate(order.date)}
                                                </p>
                                            </div>
                                            <span
                                                className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${getStatusColor(
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
                                        <div className="flex justify-between items-center pt-1">
                                            <p className="text-base sm:text-lg font-bold text-emerald-800 tabular-nums">
                                                ₱{order.total.toFixed(2)}
                                            </p>
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs text-slate-500 tabular-nums">
                                                    {order.items.length} item
                                                    {order.items.length !== 1
                                                        ? "s"
                                                        : ""}
                                                </span>
                                                <span className="text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200/60 px-2.5 py-0.5 rounded-lg">
                                                    {order.deliveryMethod ||
                                                        "Unknown"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expandable Order Details */}
                                    {isExpanded && (
                                        <div className="p-4 sm:p-5 bg-slate-50/30 space-y-4">
                                            {/* Farmer Groups */}
                                            <div className="space-y-3">
                                                <h4 className="font-semibold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                                                    <Icon
                                                        icon="mingcute:group-line"
                                                        width="16"
                                                        height="16"
                                                        className="text-emerald-700"
                                                    />
                                                    Order Items by Farmer
                                                </h4>
                                                {farmerGroups.map((farmer) => {
                                                    const farmerKey = `${order.id}_${farmer.farmerId}`;
                                                    const isFarmerExpanded =
                                                        expandedFarmers[
                                                            farmerKey
                                                        ] !== false;

                                                    return (
                                                        <div
                                                            key={farmerKey}
                                                            className="border border-slate-200/80 rounded-xl bg-white overflow-hidden shadow-2xs"
                                                        >
                                                            {/* Farmer Header */}
                                                            <div
                                                                className="bg-slate-50/80 px-4 py-3 flex justify-between items-center cursor-pointer hover:bg-slate-100/70 transition-colors"
                                                                onClick={() =>
                                                                    toggleFarmerExpansion(
                                                                        order.id,
                                                                        farmer.farmerId
                                                                    )
                                                                }
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    <Icon
                                                                        icon="mingcute:user-4-line"
                                                                        width="16"
                                                                        height="16"
                                                                        className="text-emerald-700"
                                                                    />
                                                                    <span className="font-semibold text-xs sm:text-sm text-slate-800">
                                                                        {
                                                                            farmer.farmerName
                                                                        }
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center gap-2 text-xs text-slate-500 tabular-nums">
                                                                    <span>
                                                                        {
                                                                            farmer
                                                                                .items
                                                                                .length
                                                                        }{" "}
                                                                        item{farmer.items.length !== 1 ? "s" : ""}
                                                                    </span>
                                                                    <Icon
                                                                        icon={
                                                                            isFarmerExpanded
                                                                                ? "mingcute:up-line"
                                                                                : "mingcute:down-line"
                                                                        }
                                                                        width="15"
                                                                        height="15"
                                                                        className="text-slate-400"
                                                                    />
                                                                </div>
                                                            </div>

                                                            {/* Product Items */}
                                                            {isFarmerExpanded && (
                                                                <div className="divide-y divide-slate-100">
                                                                    {farmer.items.map(
                                                                        (
                                                                            item
                                                                        ) => (
                                                                            <div
                                                                                key={
                                                                                    item.id
                                                                                }
                                                                                className="p-4"
                                                                            >
                                                                                <div className="flex gap-3 sm:gap-4">
                                                                                    {/* Product Image */}
                                                                                    <div className="shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-slate-100 border border-slate-200/60">
                                                                                        <img
                                                                                            src={
                                                                                                item.image ||
                                                                                                "/assets/blank-profile.jpg"
                                                                                            }
                                                                                            alt={
                                                                                                item.name
                                                                                            }
                                                                                            className="w-full h-full object-cover"
                                                                                            onError={(
                                                                                                e
                                                                                            ) => {
                                                                                                e.target.src =
                                                                                                    "/assets/blank-profile.jpg";
                                                                                            }}
                                                                                        />
                                                                                    </div>
                                                                                    <div className="flex-1 min-w-0">
                                                                                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-1">
                                                                                            <div>
                                                                                                <Link
                                                                                                    to={`/product/${item.product_id}`}
                                                                                                    className="font-semibold text-sm text-slate-900 hover:text-emerald-700 transition-colors line-clamp-1"
                                                                                                >
                                                                                                    {
                                                                                                        item.name
                                                                                                    }
                                                                                                </Link>
                                                                                                <div className="text-xs text-slate-500 mt-0.5 tabular-nums">
                                                                                                    {
                                                                                                        item.quantity
                                                                                                    }{" "}
                                                                                                    kg
                                                                                                    ×
                                                                                                    ₱
                                                                                                    {item.price.toFixed(
                                                                                                        2
                                                                                                    )}
                                                                                                </div>
                                                                                                <div className="text-xs sm:text-sm text-emerald-800 font-bold mt-1 tabular-nums">
                                                                                                    ₱
                                                                                                    {(
                                                                                                        item.quantity *
                                                                                                        item.price
                                                                                                    ).toFixed(
                                                                                                        2
                                                                                                    )}
                                                                                                </div>
                                                                                            </div>
                                                                                            <div className="flex flex-wrap sm:flex-col items-start sm:items-end gap-1.5">
                                                                                                {order.status ===
                                                                                                    "completed" &&
                                                                                                    (productReviews[
                                                                                                        item
                                                                                                            .product_id
                                                                                                    ] ? (
                                                                                                        <Link
                                                                                                            to={`/product/${item.product_id}?reviewFocus=user`}
                                                                                                            onClick={(
                                                                                                                e
                                                                                                            ) =>
                                                                                                                e.stopPropagation()
                                                                                                            }
                                                                                                            className="min-h-[36px] px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1.5 transition-colors"
                                                                                                        >
                                                                                                            <Icon
                                                                                                                icon="mingcute:star-fill"
                                                                                                                width="14"
                                                                                                                height="14"
                                                                                                                className="text-amber-400"
                                                                                                            />
                                                                                                            View Review
                                                                                                        </Link>
                                                                                                    ) : (
                                                                                                        <button
                                                                                                            type="button"
                                                                                                            onClick={(
                                                                                                                e
                                                                                                            ) => {
                                                                                                                e.stopPropagation();
                                                                                                                handleOpenReviewModal(
                                                                                                                    item.product_id,
                                                                                                                    item.name
                                                                                                                );
                                                                                                            }}
                                                                                                            className="min-h-[36px] px-3 py-1.5 text-xs font-semibold border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 active:scale-[0.98] transition-all flex items-center gap-1.5"
                                                                                                        >
                                                                                                            <Icon
                                                                                                                icon="mingcute:star-line"
                                                                                                                width="14"
                                                                                                                height="14"
                                                                                                                className="text-amber-500"
                                                                                                            />
                                                                                                            Rate & Review
                                                                                                        </button>
                                                                                                    ))}
                                                                                                {order.status ===
                                                                                                    "completed" &&
                                                                                                    new Date(
                                                                                                        order.updated_at
                                                                                                    ).toDateString() ===
                                                                                                        new Date().toDateString() &&
                                                                                                    (item.request_replacement_reason ? (
                                                                                                        <div className="px-3 py-1 text-xs bg-amber-50 text-amber-800 rounded-xl flex items-center gap-1.5 border border-amber-200 font-medium">
                                                                                                            <Icon
                                                                                                                icon="mingcute:alert-line"
                                                                                                                width="14"
                                                                                                                height="14"
                                                                                                            />
                                                                                                            Replacement Requested
                                                                                                        </div>
                                                                                                    ) : (
                                                                                                        <button
                                                                                                            type="button"
                                                                                                            onClick={(
                                                                                                                e
                                                                                                            ) => {
                                                                                                                e.stopPropagation();
                                                                                                                handleOpenReplacementModal(
                                                                                                                    order.id,
                                                                                                                    item.id
                                                                                                                );
                                                                                                            }}
                                                                                                            className="min-h-[36px] px-3 py-1.5 text-xs font-semibold border border-amber-200 bg-amber-50/60 text-amber-800 rounded-xl hover:bg-amber-100/70 active:scale-[0.98] transition-all flex items-center gap-1.5"
                                                                                                        >
                                                                                                            <Icon
                                                                                                                icon="mingcute:refresh-2-line"
                                                                                                                width="14"
                                                                                                                height="14"
                                                                                                            />
                                                                                                            Request Replacement
                                                                                                        </button>
                                                                                                    ))}
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        )
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {/* Order Breakdown */}
                                            <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs">
                                                <div className="flex items-center gap-2 mb-2.5">
                                                    <Icon
                                                        icon="mingcute:receipt-line"
                                                        width="16"
                                                        height="16"
                                                        className="text-emerald-700"
                                                    />
                                                    <span className="text-xs font-semibold text-slate-900">
                                                        Order Breakdown
                                                    </span>
                                                </div>
                                                <div className="space-y-1.5 text-xs">
                                                    <div className="flex justify-between text-slate-600">
                                                        <span>Subtotal</span>
                                                        <span className="font-semibold text-slate-900 tabular-nums">
                                                            ₱
                                                            {(
                                                                order.total -
                                                                order.deliveryFee
                                                            ).toFixed(2)}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between text-slate-600">
                                                        <span>
                                                            {order.deliveryMethod ===
                                                            "Home Delivery"
                                                                ? "Delivery Fee"
                                                                : "Pickup Fee"}
                                                        </span>
                                                        <span className="font-semibold text-slate-900 tabular-nums">
                                                            {order.deliveryFee >
                                                            0
                                                                ? `₱${order.deliveryFee.toFixed(
                                                                      2
                                                                  )}`
                                                                : "Free"}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between text-sm font-bold border-t border-slate-100 pt-2 text-slate-900">
                                                        <span>Total</span>
                                                        <span className="text-emerald-800 tabular-nums">
                                                            ₱
                                                            {order.total.toFixed(
                                                                2
                                                            )}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Order Details Grid */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {/* Delivery/Pickup Method */}
                                                <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-2xs">
                                                    <div className="flex items-center gap-2 mb-1.5">
                                                        <Icon
                                                            icon={
                                                                order.deliveryMethod ===
                                                                "delivery"
                                                                    ? "mingcute:truck-line"
                                                                    : "mingcute:location-line"
                                                            }
                                                            width="16"
                                                            height="16"
                                                            className="text-emerald-700"
                                                        />
                                                        <span className="text-xs font-semibold text-slate-900">
                                                            {order.deliveryMethod ===
                                                            "Home Delivery"
                                                                ? "Home Delivery"
                                                                : "Farm Pickup"}
                                                        </span>
                                                    </div>
                                                    <div className="ml-5 text-xs text-slate-600 space-y-0.5">
                                                        <p>
                                                            {order.deliveryMethod ===
                                                            "Home Delivery"
                                                                ? "Delivery to your address"
                                                                : `Pickup from: ${order.sellerAddress}`}
                                                        </p>
                                                        <p className="text-emerald-700 font-medium">
                                                            Seller: {order.sellerName}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Payment Method */}
                                                <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-2xs">
                                                    <div className="flex items-center gap-2 mb-1.5">
                                                        <Icon
                                                            icon={
                                                                order.paymentMethod ===
                                                                "COD/COP"
                                                                    ? "mingcute:cash-line"
                                                                    : "mingcute:credit-card-line"
                                                            }
                                                            width="16"
                                                            height="16"
                                                            className="text-emerald-700"
                                                        />
                                                        <span className="text-xs font-semibold text-slate-900">
                                                            Payment Method
                                                        </span>
                                                    </div>
                                                    <div className="ml-5 text-xs text-slate-600">
                                                        <p>
                                                            {order.paymentMethod ===
                                                            "COD/COP"
                                                                ? `Cash on ${
                                                                      order.deliveryMethod ===
                                                                      "Home Delivery"
                                                                          ? "Delivery"
                                                                          : "Pickup"
                                                                  }`
                                                                : "Online Payment"}
                                                        </p>
                                                        {order.status !==
                                                            "cancelled" &&
                                                            order.paymentMethod ===
                                                                "cod" && (
                                                                <p className="text-amber-700 font-semibold tabular-nums mt-0.5">
                                                                    Payment due: ₱{order.total.toFixed(2)}
                                                                </p>
                                                            )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Seller Information */}
                                            <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-2xs">
                                                <div className="flex items-center gap-2 mb-1.5">
                                                    <Icon
                                                        icon="mingcute:user-line"
                                                        width="16"
                                                        height="16"
                                                        className="text-emerald-700"
                                                    />
                                                    <span className="text-xs font-semibold text-slate-900">
                                                        Seller Information
                                                    </span>
                                                </div>
                                                <div className="ml-5 space-y-0.5 text-xs text-slate-600">
                                                    <p>
                                                        <span className="font-medium text-slate-800">Seller:</span> {order.sellerName}
                                                    </p>
                                                    <p>
                                                        <span className="font-medium text-slate-800">Address:</span> {order.sellerAddress}
                                                    </p>
                                                    {order.sellerContact && (
                                                        <p>
                                                            <span className="font-medium text-slate-800">Contact:</span> {order.sellerContact}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Order Actions */}
                                            <div className="flex flex-wrap items-center gap-2.5 pt-1">
                                                {order.status === "pending" && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleCancelOrder(
                                                                order.id
                                                            );
                                                        }}
                                                        className="min-h-[40px] px-4 py-2 text-xs font-semibold border border-rose-200 bg-rose-50/50 text-rose-700 rounded-xl hover:bg-rose-100/70 active:scale-[0.98] transition-all"
                                                    >
                                                        Cancel Order
                                                    </button>
                                                )}

                                                {order.status ===
                                                    "ready for pickup" && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleTrackOrder(
                                                                order
                                                            );
                                                        }}
                                                        className="min-h-[40px] px-4 py-2 text-xs font-semibold bg-emerald-700 text-white rounded-xl hover:bg-emerald-800 active:scale-[0.98] transition-all shadow-xs"
                                                    >
                                                        Track Order
                                                    </button>
                                                )}

                                                {(order.status === "completed" || order.status === "cancelled") && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleReorder(
                                                                order
                                                            );
                                                        }}
                                                        className="min-h-[40px] px-4 py-2 text-xs font-semibold bg-emerald-700 text-white rounded-xl hover:bg-emerald-800 active:scale-[0.98] transition-all shadow-xs"
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
            </main>

            <NavigationBar />

            {/* Review Modal */}
            {reviewModal.isOpen && (
                <ReviewModal
                    isOpen
                    onClose={() =>
                        setReviewModal({
                            isOpen: false,
                            productId: null,
                            productName: "",
                        })
                    }
                    productId={reviewModal.productId}
                    productName={reviewModal.productName}
                    userId={user?.id}
                    onReviewSubmitted={handleReviewSubmitted}
                />
            )}

            {/* Reorder Modal */}
            {reorderModal.isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
                    <div className="bg-white rounded-2xl shadow-xl border border-slate-200/90 p-6 max-w-sm w-full text-center scale-100 transition-all">
                        <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center bg-amber-50 border border-amber-200/80">
                            <Icon
                                icon="mingcute:alert-circle-fill"
                                width="28"
                                height="28"
                                className="text-amber-600"
                            />
                        </div>
                        <p className="text-sm font-medium text-slate-800 leading-relaxed mb-5">
                            {reorderModal.message}
                        </p>
                        <button
                            type="button"
                            className="w-full min-h-[44px] px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold rounded-xl shadow-xs active:scale-[0.98] transition-all"
                            onClick={() =>
                                setReorderModal({
                                    isOpen: false,
                                    message: "",
                                })
                            }
                        >
                            OK
                        </button>
                    </div>
                </div>
            )}

            {/* Replacement Request Modal */}
            {replacementModal.isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
                    <div className="bg-white rounded-2xl shadow-xl border border-slate-200/90 p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-700">
                                    <Icon
                                        icon="mingcute:refresh-2-line"
                                        width="18"
                                        height="18"
                                    />
                                </div>
                                Request Replacement
                            </h2>
                            <button
                                type="button"
                                onClick={handleCloseReplacementModal}
                                className="min-w-[36px] min-h-[36px] inline-flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                            >
                                <Icon
                                    icon="mingcute:close-line"
                                    width="20"
                                    height="20"
                                />
                            </button>
                        </div>

                        {/* Reason Selection */}
                        <div className="mb-4">
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                Reason for Replacement{" "}
                                <span className="text-rose-500">*</span>
                            </label>
                            <select
                                value={replacementModal.reason}
                                onChange={(e) =>
                                    setReplacementModal((prev) => ({
                                        ...prev,
                                        reason: e.target.value,
                                    }))
                                }
                                className="w-full h-11 px-3.5 bg-slate-50/60 border border-slate-200 rounded-xl text-sm text-slate-900 outline-none focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 transition-all"
                            >
                                <option value="">-- Select a reason --</option>
                                {replacementReasons.map((reason) => (
                                    <option key={reason} value={reason}>
                                        {reason}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Custom Reason (if Others selected) */}
                        {replacementModal.reason === "Others" && (
                            <div className="mb-4">
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                    Please specify{" "}
                                    <span className="text-rose-500">*</span>
                                </label>
                                <textarea
                                    value={replacementModal.customReason}
                                    onChange={(e) =>
                                        setReplacementModal((prev) => ({
                                            ...prev,
                                            customReason: e.target.value,
                                        }))
                                    }
                                    placeholder="Enter your reason..."
                                    rows="3"
                                    className="w-full p-3 bg-slate-50/60 border border-slate-200 rounded-xl text-sm text-slate-900 outline-none focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 transition-all"
                                />
                            </div>
                        )}

                        {/* Image Upload */}
                        <div className="mb-4">
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                Upload Photo (Optional)
                            </label>
                            {replacementModal.imagePreview ? (
                                <div className="relative rounded-xl overflow-hidden border border-slate-200">
                                    <img
                                        src={replacementModal.imagePreview}
                                        alt="Replacement preview"
                                        className="w-full h-44 object-cover"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleRemoveReplacementImage}
                                        className="absolute top-2 right-2 w-8 h-8 bg-rose-600 text-white rounded-full flex items-center justify-center hover:bg-rose-700 transition-colors shadow-md active:scale-95"
                                    >
                                        <Icon
                                            icon="mingcute:close-line"
                                            width="16"
                                            height="16"
                                        />
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            replacementFileInputRef.current?.click()
                                        }
                                        className="w-full p-5 border-2 border-dashed border-slate-200 rounded-xl hover:border-emerald-500 hover:bg-emerald-50/30 transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer text-slate-600"
                                    >
                                        <Icon
                                            icon="mingcute:image-add-line"
                                            width="24"
                                            height="24"
                                            className="text-slate-400"
                                        />
                                        <span className="text-xs font-semibold text-slate-700">
                                            Click to upload image
                                        </span>
                                        <span className="text-[11px] text-slate-400">
                                            JPEG, PNG, WebP (max 5MB)
                                        </span>
                                    </button>
                                    <input
                                        ref={replacementFileInputRef}
                                        type="file"
                                        accept="image/jpeg,image/jpg,image/png,image/webp"
                                        onChange={handleReplacementImageSelect}
                                        className="hidden"
                                    />
                                </>
                            )}
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-2.5 pt-3">
                            <button
                                type="button"
                                onClick={handleCloseReplacementModal}
                                disabled={replacementModal.isLoading}
                                className="flex-1 min-h-[44px] px-4 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50 text-xs font-semibold active:scale-[0.98]"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleSubmitReplacementRequest}
                                disabled={
                                    replacementModal.isLoading ||
                                    !replacementModal.reason ||
                                    !replacementModal.imageFile ||
                                    (replacementModal.reason === "Others" &&
                                        !replacementModal.customReason?.trim())
                                }
                                className="flex-1 min-h-[44px] px-4 py-2 bg-emerald-700 text-white rounded-xl hover:bg-emerald-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-xs font-semibold shadow-xs active:scale-[0.98]"
                            >
                                {replacementModal.isLoading ? (
                                    <>
                                        <Icon
                                            icon="mingcute:loading-line"
                                            width="16"
                                            height="16"
                                            className="animate-spin"
                                        />
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        <Icon
                                            icon="mingcute:check-line"
                                            width="16"
                                            height="16"
                                        />
                                        Submit Request
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Track Order Modal */}
            {trackingModal.open && trackingModal.order && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
                    <div className="bg-white rounded-2xl shadow-xl border border-slate-200/90 p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
                        {/* Close Button */}
                        <div className="flex justify-end mb-2">
                            <button
                                type="button"
                                onClick={() =>
                                    setTrackingModal({
                                        open: false,
                                        order: null,
                                    })
                                }
                                className="min-w-[36px] min-h-[36px] inline-flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                            >
                                <Icon
                                    icon="mingcute:close-line"
                                    width="20"
                                    height="20"
                                />
                            </button>
                        </div>

                        {/* Content */}
                        {trackingModal.order.deliveryMethod ===
                        "Home Delivery" ? (
                            <div className="text-center">
                                <div className="inline-flex items-center justify-center w-14 h-14 bg-sky-50 border border-sky-200/70 rounded-full mb-3">
                                    <Icon
                                        icon="mingcute:time-line"
                                        width="28"
                                        height="28"
                                        className="text-sky-700"
                                    />
                                </div>
                                <h2 className="text-lg font-bold text-slate-900 mb-1.5">
                                    Delivery Promise
                                </h2>
                                <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                                    Your order is guaranteed to arrive before 12:00 AM tonight.
                                </p>
                                <div className="bg-sky-50 border border-sky-200/80 rounded-xl p-3 mb-4 text-xs text-sky-800">
                                    <span className="font-semibold">Note:</span> To ensure freshness, orders not completed by end of day are automatically handled.
                                </div>
                                <div className="bg-slate-50 rounded-xl border border-slate-200/70 p-3.5 text-left mb-4 space-y-1 text-xs">
                                    <p className="text-slate-600">
                                        <span className="font-semibold text-slate-900">Order ID:</span> #{trackingModal.order.id}
                                    </p>
                                    <p className="text-slate-600">
                                        <span className="font-semibold text-slate-900">Status:</span>{" "}
                                        {trackingModal.order.status === "ready for pickup"
                                            ? "Out for Delivery"
                                            : trackingModal.order.status}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center">
                                <div className="inline-flex items-center justify-center w-14 h-14 bg-emerald-50 border border-emerald-200/70 rounded-full mb-3">
                                    <Icon
                                        icon="mingcute:store-line"
                                        width="28"
                                        height="28"
                                        className="text-emerald-700"
                                    />
                                </div>
                                <h2 className="text-lg font-bold text-slate-900 mb-1.5">
                                    Pickup Promise
                                </h2>
                                <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                                    Please pick up your order at{" "}
                                    <span className="font-semibold text-slate-900">
                                        {trackingModal.order.sellerAddress || "the farm"}
                                    </span>{" "}
                                    before 6:00 PM today.
                                </p>
                                <div className="bg-emerald-50 border border-emerald-200/80 rounded-xl p-3 mb-4 text-xs text-emerald-800">
                                    <span className="font-semibold">Note:</span> Unclaimed orders are automatically cancelled at midnight to ensure quality.
                                </div>
                                <div className="bg-slate-50 rounded-xl border border-slate-200/70 p-3.5 text-left mb-4 space-y-1 text-xs">
                                    <p className="text-slate-600">
                                        <span className="font-semibold text-slate-900">Order ID:</span> #{trackingModal.order.id}
                                    </p>
                                    <p className="text-slate-600">
                                        <span className="font-semibold text-slate-900">Status:</span>{" "}
                                        {trackingModal.order.status === "ready for pickup"
                                            ? "Ready for Pickup"
                                            : trackingModal.order.status}
                                    </p>
                                    <p className="text-slate-600">
                                        <span className="font-semibold text-slate-900">Seller:</span> {trackingModal.order.sellerName || "N/A"}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Buttons */}
                        <div className="flex gap-2.5">
                            <button
                                type="button"
                                onClick={() =>
                                    handleMessageSeller(
                                        trackingModal.order.sellerId
                                    )
                                }
                                className="flex-1 min-h-[44px] px-4 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-semibold text-xs active:scale-[0.98]"
                            >
                                Message Seller
                            </button>
                            <button
                                type="button"
                                onClick={() =>
                                    setTrackingModal({
                                        open: false,
                                        order: null,
                                    })
                                }
                                className="flex-1 min-h-[44px] px-4 py-2 bg-emerald-700 text-white rounded-xl hover:bg-emerald-800 transition-colors font-semibold text-xs active:scale-[0.98] shadow-xs"
                            >
                                Got it
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Orders;
