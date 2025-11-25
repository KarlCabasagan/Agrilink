import { useState, useEffect, useContext, useRef } from "react";
import { Icon } from "@iconify/react";
import { Link, useNavigate } from "react-router-dom";
import NavigationBar from "../../components/NavigationBar";
import ReviewModal from "../../components/ReviewModal";
import supabase from "../../SupabaseClient";
import { AuthContext } from "../../App.jsx";
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

    const handleTrackOrder = (orderId) => {
        console.log("Tracking order:", orderId);
        alert("Order tracking feature coming soon!");
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
        <div className="min-h-screen w-full flex flex-col relative items-center scrollbar-hide bg-background overflow-x-hidden text-text pb-20">
            {/* Inject animation styles */}
            <style>{styles}</style>

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
                                                    {order.deliveryMethod ||
                                                        "Unknown"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expandable Order Details */}
                                    {isExpanded && (
                                        <div className="p-4">
                                            {/* Farmer Groups */}
                                            <div className="space-y-4 mb-2">
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
                                                            key={farmerKey}
                                                            className="border border-gray-200 rounded-lg overflow-hidden"
                                                        >
                                                            {/* Farmer Header */}
                                                            <div
                                                                className="bg-gray-50 p-3 flex justify-between items-center cursor-pointer hover:bg-gray-100 transition-colors"
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
                                                                        className="text-primary"
                                                                    />
                                                                    <span className="font-medium text-sm">
                                                                        {
                                                                            farmer.farmerName
                                                                        }
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center gap-3">
                                                                    <div className="text-sm text-gray-600">
                                                                        {
                                                                            farmer
                                                                                .items
                                                                                .length
                                                                        }{" "}
                                                                        items
                                                                    </div>
                                                                    <Icon
                                                                        icon={
                                                                            isFarmerExpanded
                                                                                ? "mingcute:up-line"
                                                                                : "mingcute:down-line"
                                                                        }
                                                                        width="16"
                                                                        height="16"
                                                                        className="text-gray-400"
                                                                    />
                                                                </div>
                                                            </div>

                                                            {/* Product Items */}
                                                            {isFarmerExpanded && (
                                                                <div className="divide-y divide-gray-200">
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
                                                                                <div className="flex gap-4">
                                                                                    {/* Product Image */}
                                                                                    <div className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-gray-100">
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
                                                                                    <div className="flex-1">
                                                                                        <div className="flex items-start justify-between mb-1">
                                                                                            <div>
                                                                                                <div className="mb-2">
                                                                                                    <Link
                                                                                                        to={`/product/${item.product_id}`}
                                                                                                        className="font-medium text-green-700"
                                                                                                    >
                                                                                                        {
                                                                                                            item.name
                                                                                                        }
                                                                                                    </Link>
                                                                                                </div>
                                                                                                <div>
                                                                                                    <div className="text-sm text-gray-600">
                                                                                                        {
                                                                                                            item.quantity
                                                                                                        }{" "}
                                                                                                        kg
                                                                                                        x
                                                                                                        ₱
                                                                                                        {item.price.toFixed(
                                                                                                            2
                                                                                                        )}
                                                                                                    </div>
                                                                                                    <div className="text-sm text-primary font-medium mt-1">
                                                                                                        Total:
                                                                                                        ₱
                                                                                                        {(
                                                                                                            item.quantity *
                                                                                                            item.price
                                                                                                        ).toFixed(
                                                                                                            2
                                                                                                        )}
                                                                                                    </div>
                                                                                                </div>
                                                                                            </div>
                                                                                            <div className="flex flex-col items-end gap-2">
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
                                                                                                            className="px-3 py-1.5 text-sm text-green-500 hover:text-green-700 flex items-center gap-1.5 group transition-colors"
                                                                                                        >
                                                                                                            <Icon
                                                                                                                icon="mingcute:star-fill"
                                                                                                                width="14"
                                                                                                                height="14"
                                                                                                                className="text-yellow-400 group-hover:text-yellow-500"
                                                                                                            />
                                                                                                            View
                                                                                                            Review
                                                                                                        </Link>
                                                                                                    ) : (
                                                                                                        <button
                                                                                                            type="button"
                                                                                                            onClick={(
                                                                                                                e
                                                                                                            ) => {
                                                                                                                e.stopPropagation(); // prevent collapsing the row
                                                                                                                handleOpenReviewModal(
                                                                                                                    item.product_id,
                                                                                                                    item.name
                                                                                                                );
                                                                                                            }}
                                                                                                            className="px-3 py-1.5 text-sm border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1.5"
                                                                                                        >
                                                                                                            <Icon
                                                                                                                icon="mingcute:star-line"
                                                                                                                width="14"
                                                                                                                height="14"
                                                                                                            />
                                                                                                            Rate
                                                                                                            &
                                                                                                            Review
                                                                                                        </button>
                                                                                                    ))}
                                                                                                {order.status ===
                                                                                                    "completed" &&
                                                                                                    (item.request_replacement_reason ? (
                                                                                                        <div className="px-3 py-1.5 text-sm bg-orange-50 text-orange-600 rounded-lg flex items-center gap-1.5 border border-orange-200">
                                                                                                            <Icon
                                                                                                                icon="mingcute:alert-line"
                                                                                                                width="14"
                                                                                                                height="14"
                                                                                                            />
                                                                                                            Replacement
                                                                                                            Requested
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
                                                                                                            className="px-3 py-1.5 text-sm border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1.5"
                                                                                                        >
                                                                                                            <Icon
                                                                                                                icon="mingcute:refresh-2-line"
                                                                                                                width="14"
                                                                                                                height="14"
                                                                                                            />
                                                                                                            Request
                                                                                                            Replacement
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
                                                            "Home Delivery"
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
                                                            "Home Delivery"
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
                                                                      "Home Delivery"
                                                                          ? "Home Delivery"
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
                                                            Order Again
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
                <>
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black opacity-50"></div>
                    <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full text-center fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[10000]">
                        <div className="mb-4">
                            <Icon
                                icon="mingcute:alert-circle-fill"
                                width="48"
                                height="48"
                                className="mx-auto mb-3 text-red-500"
                            />
                            <p className="text-gray-700">
                                {reorderModal.message}
                            </p>
                        </div>
                        <button
                            className="w-full mt-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
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
                </>
            )}

            {/* Replacement Request Modal */}
            {replacementModal.isOpen && (
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
                                Request Replacement
                            </h2>
                            <button
                                onClick={handleCloseReplacementModal}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
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
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Reason for Replacement{" "}
                                <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={replacementModal.reason}
                                onChange={(e) =>
                                    setReplacementModal((prev) => ({
                                        ...prev,
                                        reason: e.target.value,
                                    }))
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-700"
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
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Please specify{" "}
                                    <span className="text-red-500">*</span>
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
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-700"
                                />
                            </div>
                        )}

                        {/* Image Upload */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Upload Image (Optional)
                            </label>
                            {replacementModal.imagePreview ? (
                                <div className="relative">
                                    <img
                                        src={replacementModal.imagePreview}
                                        alt="Replacement preview"
                                        className="w-full h-48 object-cover rounded-lg border border-gray-300"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleRemoveReplacementImage}
                                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
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
                                        className="w-full p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-400 hover:bg-orange-50 transition-colors flex flex-col items-center justify-center gap-2 cursor-pointer"
                                    >
                                        <Icon
                                            icon="mingcute:image-add-line"
                                            width="24"
                                            height="24"
                                            className="text-gray-400"
                                        />
                                        <span className="text-sm text-gray-600">
                                            Click to upload image
                                        </span>
                                        <span className="text-xs text-gray-400">
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
                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={handleCloseReplacementModal}
                                disabled={replacementModal.isLoading}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
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
                                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                </>
            )}
        </div>
    );
}

export default Orders;
