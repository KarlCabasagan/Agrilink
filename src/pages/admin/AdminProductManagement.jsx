import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";
import supabase from "../../SupabaseClient";
import AdminNavigationBar from "../../components/AdminNavigationBar";
import ConfirmModal from "../../components/ConfirmModal";

// Custom Rejection Modal Component
const ActionModal = ({
    open,
    onClose,
    onConfirm,
    productName,
    isSubmitting,
    type,
}) => {
    const [reason, setReason] = useState("");
    const [error, setError] = useState("");

    const isRejection = type === "rejection";
    const title = isRejection ? "Reject" : "Suspend";
    const actionText = isRejection ? "rejection" : "suspension";

    const handleSubmit = () => {
        if (!reason.trim()) {
            setError(`Please provide a ${actionText} reason`);
            return;
        }
        onConfirm(reason.trim());
    };

    if (!open) return null;

    return (
        <>
            <div className="fixed inset-0 bg-black opacity-50 flex items-center justify-center z-[9990] px-4"></div>
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full z-[9999] fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-100 rounded-full">
                                <Icon
                                    icon="mingcute:close-circle-line"
                                    className="w-6 h-6 text-red-600"
                                />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                    {title} Product
                                </h3>
                                <p className="text-sm text-gray-600 mt-1">
                                    You are about to {actionText.toLowerCase()}{" "}
                                    "{productName}". Please provide a reason for{" "}
                                    {actionText}.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mb-4">
                        <label
                            htmlFor="actionReason"
                            className="block text-sm font-medium text-gray-700 mb-1"
                        >
                            {title} Reason{" "}
                            <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            id="actionReason"
                            rows={3}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                                error ? "border-red-300" : "border-gray-300"
                            }`}
                            placeholder={`Please provide a detailed reason for ${actionText.toLowerCase()} this product...`}
                            value={reason}
                            onChange={(e) => {
                                setReason(e.target.value);
                                setError("");
                            }}
                        />
                        {error && (
                            <p className="mt-1 text-sm text-red-600">{error}</p>
                        )}
                    </div>

                    <div className="flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-800"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                        >
                            {isSubmitting ? (
                                <>
                                    <Icon
                                        icon="mingcute:loading-line"
                                        className="animate-spin mr-2"
                                    />
                                    {`${title}ing...`}
                                </>
                            ) : (
                                `${title} Product`
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

function AdminProductManagement() {
    // Get initial tab from localStorage or default to "pending"
    const [activeTab, setActiveTab] = useState(() => {
        return localStorage.getItem("adminProductsActiveTab") || "pending";
    });

    // Save activeTab to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem("adminProductsActiveTab", activeTab);
    }, [activeTab]);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showRejectionModal, setShowRejectionModal] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [selectedProductForRejection, setSelectedProductForRejection] =
        useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showImageModal, setShowImageModal] = useState(false);
    const [selectedImage, setSelectedImage] = useState("");
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [showSuspensionModal, setShowSuspensionModal] = useState(false);
    const [selectedProductForSuspension, setSelectedProductForSuspension] =
        useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortConfig, setSortConfig] = useState({
        key: null,
        direction: "asc",
    });

    // Categories management
    const [categories, setCategories] = useState([]);
    const [newCategory, setNewCategory] = useState({
        name: "",
        description: "",
        icon: "",
    });
    const [blockedCategoryInfo, setBlockedCategoryInfo] = useState(null);

    // Top-level helper to fetch categories
    const fetchCategories = async () => {
        const { data, error } = await supabase
            .from("categories")
            .select("*")
            .order("name");

        if (error) {
            console.error("Error fetching categories:", error);
            return;
        }

        setCategories(data);
    };

    // Fetch categories on mount
    useEffect(() => {
        fetchCategories();
    }, []);

    const [pendingProducts, setPendingProducts] = useState([]);

    // Top-level helper to fetch pending products
    const fetchPendingProducts = async () => {
        console.log("Fetching pending products...");
        const { data: products, error } = await supabase
            .from("products")
            .select(
                `
                *,
                user_id:profiles!products_user_id_fkey(name),
                category_id:categories!products_category_id_fkey(name),
                crops!products_crop_id_fkey(id, name)
            `
            )
            .is("approval_date", null)
            .is("rejection_reason", null); // Only get products pending for approval

        console.log("Pending products query result:", { products, error });

        if (error) {
            console.error("Error fetching pending products:", error);
            return;
        }

        const formattedProducts = products.map((product) => ({
            id: product.id,
            name: product.name,
            producer: product.user_id.name,
            category: product.category_id.name,
            cropId: product.crops.id,
            cropType: product.crops.name,
            price: product.price,
            description: product.description,
            image: product.image_url,
            submittedDate: new Date(product.created_at)
                .toISOString()
                .split("T")[0],
            status: "pending",
            stock: product.stock,
        }));

        setPendingProducts(formattedProducts);
    };

    // Fetch pending products on mount
    useEffect(() => {
        fetchPendingProducts();
    }, []);

    const [approvedProducts, setApprovedProducts] = useState([]);

    // Top-level helper to fetch approved products
    const fetchApprovedProducts = async () => {
        console.log("Fetching approved products...");
        const { data: products, error } = await supabase
            .from("products")
            .select(
                `
                *,
                user_id:profiles!products_user_id_fkey(
                    name,
                    status_id(name),
                    suspension_reason
                ),
                crop:crops!products_crop_id_fkey(name),
                status_id:statuses!products_status_id_fkey(name),
                order_items(
                    quantity,
                    order:orders!order_items_order_id_fkey(
                        status_id:statuses!orders_status_id_fkey(name)
                    )
                )
            `
            )
            .not("approval_date", "is", null)
            .not("approval_date", "eq", "1970-01-01T00:00:00Z"); // Not rejected

        console.log("Approved products query result:", { products, error });

        if (error) {
            console.error("Error fetching approved products:", error);
            return;
        }

        const formattedProducts = products.map((product) => {
            // Calculate total sales from completed orders
            const completedSales = product.order_items.reduce((total, item) => {
                if (item.order.status_id.name === "completed") {
                    return total + Number(item.quantity);
                }
                return total;
            }, 0);

            return {
                id: product.id,
                name: product.name,
                producer: product.user_id.name,
                cropType: product.crop.name,
                price: product.price,
                description: product.description,
                image: product.image_url,
                approvedDate: new Date(product.approval_date)
                    .toISOString()
                    .split("T")[0],
                status:
                    product.status_id.name === "active"
                        ? "Active"
                        : "Suspended",
                stock: product.stock,
                sales: completedSales,
                ownerStatus: product.user_id.status_id.name,
                ownerSuspensionReason: product.user_id.suspension_reason,
            };
        });

        setApprovedProducts(formattedProducts);
    };

    // Fetch approved products on mount
    useEffect(() => {
        fetchApprovedProducts();
    }, []);

    // Utility functions
    const handleSort = (key) => {
        let direction = "asc";
        if (sortConfig.key === key && sortConfig.direction === "asc") {
            direction = "desc";
        }
        setSortConfig({ key, direction });
    };

    const sortData = (data) => {
        if (!sortConfig.key) return data;

        return [...data].sort((a, b) => {
            if (a[sortConfig.key] < b[sortConfig.key]) {
                return sortConfig.direction === "asc" ? -1 : 1;
            }
            if (a[sortConfig.key] > b[sortConfig.key]) {
                return sortConfig.direction === "asc" ? 1 : -1;
            }
            return 0;
        });
    };

    const filterData = (data) => {
        if (!searchTerm) return data;
        return data.filter(
            (item) =>
                item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.producer
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase()) ||
                item.cropType.toLowerCase().includes(searchTerm.toLowerCase())
        );
    };

    const handleImageClick = (imageUrl) => {
        setSelectedImage(imageUrl);
        setShowImageModal(true);
    };

    // Set up Realtime subscriptions for selective section updates
    useEffect(() => {
        const realtimeChannel = supabase.channel("admin_product_management");

        // Helper to format a single product for approved list
        const formatApprovedProduct = (product) => {
            const completedSales =
                product.order_items?.reduce((total, item) => {
                    if (item.order?.status_id?.name === "completed") {
                        return total + Number(item.quantity);
                    }
                    return total;
                }, 0) || 0;

            return {
                id: product.id,
                name: product.name,
                producer: product.user_id?.name || "Unknown",
                cropType: product.crop?.name || "Unknown",
                price: product.price,
                description: product.description,
                image: product.image_url,
                approvedDate: product.approval_date
                    ? new Date(product.approval_date)
                          .toISOString()
                          .split("T")[0]
                    : "",
                status:
                    product.status_id?.name === "active"
                        ? "Active"
                        : "Suspended",
                stock: product.stock,
                sales: completedSales,
                ownerStatus: product.user_id?.status_id?.name || "Unknown",
                ownerSuspensionReason: product.user_id?.suspension_reason,
            };
        };

        // Helper to format a single product for pending list
        const formatPendingProduct = (product) => ({
            id: product.id,
            name: product.name,
            producer: product.user_id?.name || "Unknown",
            category: product.category_id?.name || "Unknown",
            cropId: product.crops?.id || "",
            cropType: product.crops?.name || "Unknown",
            price: product.price,
            description: product.description,
            image: product.image_url,
            submittedDate: product.created_at
                ? new Date(product.created_at).toISOString().split("T")[0]
                : "",
            status: "pending",
            stock: product.stock,
        });

        // Categories listener - only update categories
        realtimeChannel
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "categories",
                },
                (payload) => {
                    // Idempotently add category if not already present
                    setCategories((prev) => {
                        if (prev.some((cat) => cat.id === payload.new.id)) {
                            return prev;
                        }
                        return [...prev, payload.new];
                    });
                }
            )
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "categories",
                },
                (payload) => {
                    setCategories((prev) =>
                        prev.map((cat) =>
                            cat.id === payload.new.id ? payload.new : cat
                        )
                    );
                }
            )
            .on(
                "postgres_changes",
                {
                    event: "DELETE",
                    schema: "public",
                    table: "categories",
                },
                (payload) => {
                    setCategories((prev) =>
                        prev.filter((cat) => cat.id !== payload.old.id)
                    );
                }
            );

        // Products listener - handle pending/approved transitions
        realtimeChannel
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "products",
                },
                async (payload) => {
                    // Fetch full product data to properly categorize
                    const { data, error } = await supabase
                        .from("products")
                        .select(
                            `
                            *,
                            user_id:profiles!products_user_id_fkey(name),
                            category_id:categories!products_category_id_fkey(name),
                            crops!products_crop_id_fkey(id, name)
                        `
                        )
                        .eq("id", payload.new.id)
                        .single();

                    if (error || !data) return;

                    // Check if pending or approved
                    if (!data.approval_date) {
                        // Pending product
                        const formatted = formatPendingProduct(data);
                        setPendingProducts((prev) => {
                            if (prev.some((p) => p.id === formatted.id)) {
                                return prev;
                            }
                            return [...prev, formatted];
                        });
                    } else if (data.approval_date !== "1970-01-01T00:00:00Z") {
                        // Approved product - need full data with order_items
                        const { data: fullData } = await supabase
                            .from("products")
                            .select(
                                `
                                *,
                                user_id:profiles!products_user_id_fkey(name, status_id(name), suspension_reason),
                                crop:crops!products_crop_id_fkey(name),
                                status_id:statuses!products_status_id_fkey(name),
                                order_items(quantity, order:orders!order_items_order_id_fkey(status_id:statuses!orders_status_id_fkey(name)))
                            `
                            )
                            .eq("id", data.id)
                            .single();

                        if (fullData) {
                            const formatted = formatApprovedProduct(fullData);
                            setApprovedProducts((prev) => {
                                if (prev.some((p) => p.id === formatted.id)) {
                                    return prev;
                                }
                                return [...prev, formatted];
                            });
                        }
                    }
                }
            )
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "products",
                },
                async (payload) => {
                    // Helper to determine state from approval_date and rejection_reason
                    const getProductState = (approvalDate, rejectionReason) => {
                        if (approvalDate === null && rejectionReason === null) {
                            return "pending";
                        }
                        if (
                            approvalDate === "1970-01-01T00:00:00Z" &&
                            rejectionReason
                        ) {
                            return "rejected";
                        }
                        if (
                            approvalDate &&
                            approvalDate !== "1970-01-01T00:00:00Z" &&
                            !rejectionReason
                        ) {
                            return "approved";
                        }
                        return "unknown";
                    };

                    const oldState = getProductState(
                        payload.old.approval_date,
                        payload.old.rejection_reason
                    );
                    const newState = getProductState(
                        payload.new.approval_date,
                        payload.new.rejection_reason
                    );

                    // Derive boolean flags for easier branching
                    const wasPending = oldState === "pending";
                    const isPending = newState === "pending";
                    const wasApproved = oldState === "approved";
                    const isApproved = newState === "approved";
                    const wasRejected = oldState === "rejected";
                    const isRejected = newState === "rejected";

                    // (1) Transition into pending: isPending && !wasPending
                    if (isPending && !wasPending) {
                        // Fetch full product data with same select as fetchPendingProducts
                        const { data: fullData } = await supabase
                            .from("products")
                            .select(
                                `
                                *,
                                user_id:profiles!products_user_id_fkey(name),
                                category_id:categories!products_category_id_fkey(name),
                                crops!products_crop_id_fkey(id, name)
                            `
                            )
                            .eq("id", payload.new.id)
                            .single();

                        if (fullData) {
                            const formatted = formatPendingProduct(fullData);
                            setPendingProducts((prev) => {
                                // Check if already in list; if so, update; if not, append
                                const existingIndex = prev.findIndex(
                                    (p) => p.id === formatted.id
                                );
                                if (existingIndex >= 0) {
                                    const updated = [...prev];
                                    updated[existingIndex] = formatted;
                                    return updated;
                                }
                                return [...prev, formatted];
                            });
                            // Remove from approved if present
                            setApprovedProducts((prev) =>
                                prev.filter((p) => p.id !== payload.new.id)
                            );
                        }
                    }
                    // (2) Transition pending→approved: wasPending && isApproved
                    else if (wasPending && isApproved) {
                        // Moving from pending to approved
                        setPendingProducts((prev) =>
                            prev.filter((p) => p.id !== payload.new.id)
                        );

                        // Fetch full product data for approved list
                        const { data: fullData } = await supabase
                            .from("products")
                            .select(
                                `
                                *,
                                user_id:profiles!products_user_id_fkey(name, status_id(name), suspension_reason),
                                crop:crops!products_crop_id_fkey(name),
                                status_id:statuses!products_status_id_fkey(name),
                                order_items(quantity, order:orders!order_items_order_id_fkey(status_id:statuses!orders_status_id_fkey(name)))
                            `
                            )
                            .eq("id", payload.new.id)
                            .single();

                        if (fullData) {
                            const formatted = formatApprovedProduct(fullData);
                            setApprovedProducts((prev) => {
                                if (prev.some((p) => p.id === formatted.id)) {
                                    return prev.map((p) =>
                                        p.id === formatted.id ? formatted : p
                                    );
                                }
                                return [...prev, formatted];
                            });
                        }
                    }
                    // (3) Transition pending→rejected: wasPending && isRejected
                    else if (wasPending && isRejected) {
                        setPendingProducts((prev) =>
                            prev.filter((p) => p.id !== payload.new.id)
                        );
                    }
                    // (4) Staying pending: wasPending && isPending (in-place update)
                    else if (wasPending && isPending) {
                        setPendingProducts((prev) =>
                            prev.map((p) =>
                                p.id === payload.new.id
                                    ? {
                                          ...p,
                                          price: payload.new.price,
                                          stock: payload.new.stock,
                                          name: payload.new.name,
                                          description: payload.new.description,
                                      }
                                    : p
                            )
                        );
                    }
                    // (5) Approved in-place updates: (wasApproved || isApproved)
                    else if (wasApproved || isApproved) {
                        setApprovedProducts((prev) =>
                            prev.map((p) =>
                                p.id === payload.new.id
                                    ? {
                                          ...p,
                                          price: payload.new.price,
                                          stock: payload.new.stock,
                                          name: payload.new.name,
                                          status:
                                              payload.new.status_id === 1
                                                  ? "Active"
                                                  : "Suspended",
                                      }
                                    : p
                            )
                        );
                    }
                    // (6) Reject: isRejected
                    else if (isRejected) {
                        setPendingProducts((prev) =>
                            prev.filter((p) => p.id !== payload.new.id)
                        );
                        setApprovedProducts((prev) =>
                            prev.filter((p) => p.id !== payload.new.id)
                        );
                    }
                }
            )
            .on(
                "postgres_changes",
                {
                    event: "DELETE",
                    schema: "public",
                    table: "products",
                },
                (payload) => {
                    setPendingProducts((prev) =>
                        prev.filter((p) => p.id !== payload.old.id)
                    );
                    setApprovedProducts((prev) =>
                        prev.filter((p) => p.id !== payload.old.id)
                    );
                }
            );

        // Order items listener - update approved products sales only
        realtimeChannel.on(
            "postgres_changes",
            {
                event: "*",
                schema: "public",
                table: "order_items",
            },
            async (payload) => {
                // Recompute sales for affected product
                const productId =
                    payload.new?.product_id || payload.old?.product_id;
                if (!productId) return;

                const product = approvedProducts.find(
                    (p) => p.id === productId
                );
                if (!product) return;

                // Query new sales total for this product
                const { data: orderItems } = await supabase
                    .from("order_items")
                    .select(
                        `
                            quantity,
                            order:orders!order_items_order_id_fkey(
                                status_id:statuses!orders_status_id_fkey(name)
                            )
                        `
                    )
                    .eq("product_id", productId);

                if (orderItems) {
                    const newSales = orderItems.reduce((total, item) => {
                        if (item.order?.status_id?.name === "completed") {
                            return total + Number(item.quantity);
                        }
                        return total;
                    }, 0);

                    setApprovedProducts((prev) =>
                        prev.map((p) =>
                            p.id === productId ? { ...p, sales: newSales } : p
                        )
                    );
                }
            }
        );

        // Orders listener - update sales when order status changes
        realtimeChannel.on(
            "postgres_changes",
            {
                event: "UPDATE",
                schema: "public",
                table: "orders",
            },
            async (payload) => {
                // Recompute sales for all affected products
                const { data: orderItems } = await supabase
                    .from("order_items")
                    .select(
                        `
                            product_id,
                            quantity,
                            order:orders!order_items_order_id_fkey(
                                status_id:statuses!orders_status_id_fkey(name)
                            )
                        `
                    )
                    .eq("order_id", payload.new.id);

                if (orderItems) {
                    const salesByProduct = {};
                    orderItems.forEach((item) => {
                        if (!salesByProduct[item.product_id]) {
                            salesByProduct[item.product_id] = 0;
                        }
                        if (item.order?.status_id?.name === "completed") {
                            salesByProduct[item.product_id] += Number(
                                item.quantity
                            );
                        }
                    });

                    setApprovedProducts((prev) =>
                        prev.map((p) => {
                            if (salesByProduct[p.id] !== undefined) {
                                return {
                                    ...p,
                                    sales: salesByProduct[p.id],
                                };
                            }
                            return p;
                        })
                    );
                }
            }
        );

        realtimeChannel.subscribe();

        // Cleanup: unsubscribe on unmount
        return () => {
            realtimeChannel.unsubscribe();
        };
    }, []);
    const handleAddCategory = async () => {
        if (newCategory.name.trim()) {
            const { data, error } = await supabase
                .from("categories")
                .insert({
                    name: newCategory.name.trim(),
                    description: newCategory.description.trim(),
                    icon: newCategory.icon.trim() || "twemoji:package",
                })
                .select()
                .single();

            if (error) {
                console.error("Error adding category:", error);
                return;
            }

            setCategories([...categories, data]);
            setNewCategory({ name: "", description: "", icon: "" });
        }
    };

    const handleEditCategory = (category) => {
        setSelectedCategory(category);
        setNewCategory({
            name: category.name,
            description: category.description,
            icon: category.icon || "",
        });
    };

    const handleUpdateCategory = async () => {
        if (selectedCategory && newCategory.name.trim()) {
            const { data, error } = await supabase
                .from("categories")
                .update({
                    name: newCategory.name.trim(),
                    description: newCategory.description.trim(),
                    icon: newCategory.icon.trim() || "twemoji:package",
                })
                .eq("id", selectedCategory.id)
                .select()
                .single();

            if (error) {
                console.error("Error updating category:", error);
                return;
            }

            setCategories(
                categories.map((cat) =>
                    cat.id === selectedCategory.id ? data : cat
                )
            );
            setSelectedCategory(null);
            setNewCategory({ name: "", description: "", icon: "" });
        }
    };

    const handleDeleteCategory = async (category) => {
        // Check if any crops are using this category
        const { count, error: countError } = await supabase
            .from("crops")
            .select("id", { count: "exact", head: true })
            .eq("category_id", category.id);

        if (countError) {
            console.error("Error checking crops for category:", countError);
            return;
        }

        // If crops are using this category, show blocked modal
        if (count > 0) {
            setBlockedCategoryInfo({
                name: category.name,
                count: count,
            });
            return;
        }

        // Otherwise, proceed with deletion
        const { error } = await supabase
            .from("categories")
            .delete()
            .eq("id", category.id);

        if (error) {
            console.error("Error deleting category:", error);
            return;
        }

        setCategories((prev) => prev.filter((cat) => cat.id !== category.id));
    };

    const handleProductRejection = async (rejectionReason) => {
        if (!selectedProductForRejection || !rejectionReason) return;

        setIsSubmitting(true);
        try {
            const { error: updateError } = await supabase
                .from("products")
                .update({
                    approval_date: "1970-01-01T00:00:00Z",
                    rejection_reason: rejectionReason,
                })
                .eq("id", selectedProductForRejection.id);

            if (updateError) {
                throw new Error(
                    `Error rejecting product: ${updateError.message}`
                );
            }

            // Remove from pending products in UI
            setPendingProducts((prev) =>
                prev.filter((p) => p.id !== selectedProductForRejection.id)
            );

            setShowRejectionModal(false);
            setSelectedProductForRejection(null);
        } catch (error) {
            console.error("Error in handleProductRejection:", error);
            alert("Failed to reject product. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleProductAction = (productId, action) => {
        if (!productId || !action) {
            console.error("Invalid product action parameters:", {
                productId,
                action,
            });
            return;
        }

        if (action === "rejected") {
            const product = pendingProducts.find((p) => p.id === productId);
            if (!product) {
                console.error("Product not found:", productId);
                return;
            }
            setSelectedProductForRejection(product);
            setShowRejectionModal(true);
        } else {
            console.log("Setting confirm action:", {
                id: productId,
                type: action,
            });
            setConfirmAction({ id: productId, type: action });
            setShowConfirmModal(true);
        }
    };

    const handleProductSuspension = async (suspensionReason) => {
        if (!selectedProductForSuspension) return;

        setIsSubmitting(true);
        try {
            const { data: statusData, error: statusError } = await supabase
                .from("statuses")
                .select("id")
                .eq("name", "suspended")
                .single();

            if (statusError) {
                throw new Error(
                    `Error getting status ID: ${statusError.message}`
                );
            }

            const { error: updateError } = await supabase
                .from("products")
                .update({
                    status_id: statusData.id,
                    rejection_reason: suspensionReason,
                })
                .eq("id", selectedProductForSuspension.id);

            if (updateError) {
                throw new Error(
                    `Error suspending product: ${updateError.message}`
                );
            }

            const { data: existingSuspension, error: fetchSuspensionError } =
                await supabase
                    .from("suspended_products")
                    .select("id")
                    .eq("product_id", selectedProductForSuspension.id)
                    .maybeSingle();

            if (fetchSuspensionError) {
                throw new Error(
                    `Error checking suspended product: ${fetchSuspensionError.message}`
                );
            }

            if (existingSuspension) {
                const { error: updateSuspendedError } = await supabase
                    .from("suspended_products")
                    .update({
                        updated_at: new Date().toISOString(),
                    })
                    .eq("id", existingSuspension.id);

                if (updateSuspendedError) {
                    throw new Error(
                        `Error updating suspended product: ${updateSuspendedError.message}`
                    );
                }
            } else {
                const { error: insertSuspendedError } = await supabase
                    .from("suspended_products")
                    .insert({
                        product_id: selectedProductForSuspension.id,
                    });

                if (insertSuspendedError) {
                    throw new Error(
                        `Error storing suspended product: ${insertSuspendedError.message}`
                    );
                }
            }

            setApprovedProducts((prev) =>
                prev.map((product) =>
                    product.id === selectedProductForSuspension.id
                        ? {
                              ...product,
                              status: "Suspended",
                          }
                        : product
                )
            );

            setShowSuspensionModal(false);
            setSelectedProductForSuspension(null);
        } catch (error) {
            console.error("Error in handleProductSuspension:", error);
            alert("Failed to suspend product. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle product status change (suspend/activate)
    const handleProductStatusAction = async (productId, action) => {
        const product = approvedProducts.find((p) => p.id === productId);
        if (!product) {
            console.error("Product not found:", productId);
            return;
        }

        if (action === "suspend") {
            setSelectedProductForSuspension(product);
            setShowSuspensionModal(true);
            return;
        }

        // Check if owner is suspended before activation
        if (action === "activate" && product.ownerStatus === "suspended") {
            console.error("Cannot activate product: Owner is suspended");
            return;
        }

        // Handle activation
        const { data: statusData, error: statusError } = await supabase
            .from("statuses")
            .select("id")
            .eq("name", "active")
            .single();

        if (statusError) {
            console.error("Error getting status ID:", statusError);
            return;
        }

        const { error: updateError } = await supabase
            .from("products")
            .update({
                status_id: statusData.id,
                rejection_reason: null,
            })
            .eq("id", productId);

        if (updateError) {
            console.error("Error updating product status:", updateError);
            return;
        }

        const { error: deleteSuspensionError } = await supabase
            .from("suspended_products")
            .delete()
            .eq("product_id", productId);

        if (deleteSuspensionError) {
            console.error(
                "Error removing suspended product record:",
                deleteSuspensionError
            );
            return;
        }

        setApprovedProducts((prev) =>
            prev.map((product) =>
                product.id === productId
                    ? {
                          ...product,
                          status: "Active",
                      }
                    : product
            )
        );
    };

    const confirmProductAction = async () => {
        console.log("Confirming action:", confirmAction);
        if (!confirmAction) {
            console.error("No confirm action found");
            return;
        }

        const product = pendingProducts.find((p) => p.id === confirmAction.id);
        console.log("Found product:", product);
        if (!product) {
            console.error("Product not found:", confirmAction.id);
            return;
        }

        try {
            if (confirmAction.type === "approved") {
                console.log("Approving product...");
                // Get active status
                const { data: statusData, error: statusError } = await supabase
                    .from("statuses")
                    .select("id")
                    .eq("name", "active")
                    .single();

                if (statusError || !statusData) {
                    throw new Error(
                        `Failed to get active status: ${
                            statusError?.message || "Status not found"
                        }`
                    );
                }

                // Update product with current timestamp for approval
                const now = new Date().toISOString();
                const { error: updateError } = await supabase
                    .from("products")
                    .update({
                        status_id: statusData.id,
                        approval_date: now,
                        rejection_reason: null,
                    })
                    .eq("id", confirmAction.id);

                if (updateError) {
                    throw new Error(
                        `Error approving product: ${updateError.message}`
                    );
                }

                console.log(
                    "Successfully approved product. Adding to approved products list."
                );
                // Move to approved products in UI
                setApprovedProducts((prev) => [
                    ...prev,
                    {
                        ...product,
                        status: "Active",
                        approvedDate: now.split("T")[0],
                        sales: 0,
                        rating: "N/A",
                        reviews: 0,
                    },
                ]);
            } else if (confirmAction.type === "rejected") {
                console.log("Rejecting product...");
                // Update product with epoch timestamp (1970) to mark as rejected
                const { error: updateError } = await supabase
                    .from("products")
                    .update({
                        approval_date: "1970-01-01T00:00:00Z",
                    })
                    .eq("id", confirmAction.id);

                if (updateError) {
                    throw new Error(
                        `Error rejecting product: ${updateError.message}`
                    );
                }
                console.log("Successfully rejected product");
            } else {
                throw new Error(`Invalid action type: ${confirmAction.type}`);
            }

            // Remove from pending products in UI
            setPendingProducts((prev) =>
                prev.filter((p) => p.id !== confirmAction.id)
            );

            console.log(`Product ${confirmAction.type} successfully`);
        } catch (error) {
            console.error("Error in confirmProductAction:", error);
            // You might want to show an error message to the user here
        } finally {
            setShowConfirmModal(false);
            setConfirmAction(null);
        }
    };

    return (
        <div className="min-h-screen w-full flex flex-col relative items-center bg-slate-50/50 text-slate-800 overflow-x-hidden">
            {/* Mobile Header */}
            <header className="md:hidden fixed top-0 left-0 w-full bg-white/95 backdrop-blur-md border-b border-slate-200 z-40 px-4 h-14 flex items-center justify-center">
                <h1 className="text-base font-bold text-slate-900 tracking-tight">
                    Product Management
                </h1>
            </header>

            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 pt-16 md:pt-20 pb-24 md:pb-16">
                {/* Desktop Header Banner */}
                <div className="hidden md:flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                            Product Management
                        </h1>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Review producer submissions, catalog listings, and crop categories.
                        </p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-1.5 mb-6">
                    <div className="flex gap-2">
                        <button
                            onClick={() => setActiveTab("pending")}
                            className={`flex-1 min-h-[42px] py-2 px-4 text-center text-xs font-semibold rounded-xl transition-all duration-150 cursor-pointer active:scale-[0.98] flex items-center justify-center gap-2 ${
                                activeTab === "pending"
                                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200/80 shadow-2xs"
                                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                            }`}
                        >
                            <span>Pending Approval</span>
                            {pendingProducts.length > 0 && (
                                <span className="bg-emerald-800 text-white text-[10px] font-bold tabular-nums min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full shadow-2xs">
                                    {pendingProducts.length}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab("approved")}
                            className={`flex-1 min-h-[42px] py-2 px-4 text-center text-xs font-semibold rounded-xl transition-all duration-150 cursor-pointer active:scale-[0.98] ${
                                activeTab === "approved"
                                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200/80 shadow-2xs"
                                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                            }`}
                        >
                            Approved Catalog
                        </button>
                        <button
                            onClick={() => setActiveTab("categories")}
                            className={`flex-1 min-h-[42px] py-2 px-4 text-center text-xs font-semibold rounded-xl transition-all duration-150 cursor-pointer active:scale-[0.98] ${
                                activeTab === "categories"
                                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200/80 shadow-2xs"
                                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                            }`}
                        >
                            Categories
                        </button>
                    </div>
                </div>

                {/* Pending Products Tab */}
                {activeTab === "pending" && (
                    <div className="space-y-4">
                        {/* Search Bar */}
                        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-3.5 sm:p-4">
                            <div className="relative">
                                <Icon
                                    icon="mingcute:search-line"
                                    width="20"
                                    height="20"
                                    className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400"
                                />
                                <input
                                    type="text"
                                    placeholder="Search pending products by title, producer, or crop type…"
                                    value={searchTerm}
                                    onChange={(e) =>
                                        setSearchTerm(e.target.value)
                                    }
                                    className="w-full h-11 pl-10 pr-4 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 transition-all"
                                />
                            </div>
                        </div>

                        {filterData(sortData(pendingProducts)).length === 0 ? (
                            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-10 text-center flex flex-col items-center">
                                <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 mb-3">
                                    <Icon
                                        icon="mingcute:box-2-line"
                                        width="28"
                                        height="28"
                                    />
                                </div>
                                <h3 className="text-base font-bold text-slate-900 mb-1">
                                    No Pending Products
                                </h3>
                                <p className="text-xs text-slate-500 max-w-sm">
                                    All submitted products have been reviewed and processed.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {filterData(sortData(pendingProducts)).map(
                                    (product) => (
                                        <div
                                            key={product.id}
                                            className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 sm:p-6 transition-all duration-150"
                                        >
                                            <div className="flex flex-col lg:flex-row gap-5 sm:gap-6">
                                                {/* Product Image */}
                                                <div className="lg:w-48 shrink-0">
                                                    <img
                                                        src={product.image}
                                                        alt={product.name}
                                                        className="w-full h-44 sm:h-48 object-cover rounded-xl border border-slate-200 shadow-2xs cursor-pointer hover:opacity-85 transition-opacity"
                                                        onClick={() =>
                                                            handleImageClick(
                                                                product.image
                                                            )
                                                        }
                                                    />
                                                </div>

                                                {/* Product Details */}
                                                <div className="flex-1">
                                                    <div className="flex items-start justify-between gap-3 mb-3">
                                                        <div>
                                                            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                                                                {product.name}
                                                            </h3>
                                                            <p className="text-xs text-slate-500">
                                                                by {product.producer}
                                                            </p>
                                                            <p className="text-[11px] text-slate-400 mt-0.5 tabular-nums">
                                                                Submitted on{" "}
                                                                {new Date(
                                                                    product.submittedDate
                                                                ).toLocaleDateString("en-US", {
                                                                    year: "numeric",
                                                                    month: "short",
                                                                    day: "numeric",
                                                                })}
                                                            </p>
                                                        </div>
                                                        <span className="bg-amber-50 text-amber-800 border border-amber-200/80 px-2.5 py-0.5 rounded-full text-[11px] font-semibold shrink-0">
                                                            Pending Review
                                                        </span>
                                                    </div>

                                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/70 border border-slate-200/70 rounded-xl p-3.5 mb-3.5">
                                                        <div>
                                                            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                                                                Category
                                                            </h4>
                                                            <select
                                                                value={
                                                                    product.category
                                                                }
                                                                onChange={(
                                                                    e
                                                                ) => {
                                                                    setPendingProducts(
                                                                        (
                                                                            prev
                                                                        ) =>
                                                                            prev.map(
                                                                                (
                                                                                    p
                                                                                ) =>
                                                                                    p.id ===
                                                                                    product.id
                                                                                        ? {
                                                                                              ...p,
                                                                                              category:
                                                                                                  e
                                                                                                      .target
                                                                                                      .value,
                                                                                          }
                                                                                        : p
                                                                            )
                                                                    );
                                                                }}
                                                                className="text-xs font-semibold bg-white border border-slate-200 rounded-lg p-1.5 focus:ring-2 focus:ring-emerald-600/15 focus:border-emerald-600 outline-none w-full"
                                                            >
                                                                {categories.map(
                                                                    (cat) => (
                                                                        <option
                                                                            key={
                                                                                cat.id
                                                                            }
                                                                            value={
                                                                                cat.name
                                                                            }
                                                                        >
                                                                            {
                                                                                cat.name
                                                                            }
                                                                        </option>
                                                                    )
                                                                )}
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                                                                Crop Type
                                                            </h4>
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80">
                                                                {
                                                                    product.cropType
                                                                }
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                                                                Price
                                                            </h4>
                                                            <p className="text-base font-bold text-emerald-700 tabular-nums">
                                                                ₱{Number(product.price).toFixed(2)}{" "}
                                                                <span className="text-xs text-slate-500 font-normal">/ kg</span>
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                                                                Stock
                                                            </h4>
                                                            <p className="text-xs font-bold text-slate-800 tabular-nums">
                                                                {product.stock} kg available
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {product.description && (
                                                        <div className="mb-3.5">
                                                            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                                                                Description
                                                            </h4>
                                                            <p className="text-xs text-slate-600 leading-relaxed max-w-prose">
                                                                {
                                                                    product.description
                                                                }
                                                            </p>
                                                        </div>
                                                    )}

                                                    <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                                                        <button
                                                            onClick={() =>
                                                                handleProductAction(
                                                                    product.id,
                                                                    "rejected"
                                                                )
                                                            }
                                                            className="min-h-[38px] px-4 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 rounded-xl text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-[0.98]"
                                                        >
                                                            <Icon icon="mingcute:close-line" className="w-3.5 h-3.5" />
                                                            <span>Reject</span>
                                                        </button>
                                                        <button
                                                            onClick={() =>
                                                                handleProductAction(
                                                                    product.id,
                                                                    "approved"
                                                                )
                                                            }
                                                            className="min-h-[38px] px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-[0.98]"
                                                        >
                                                            <Icon icon="mingcute:check-line" className="w-3.5 h-3.5" />
                                                            <span>Approve Product</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Approved Products Tab */}
                {activeTab === "approved" && (
                    <div className="space-y-4">
                        {/* Search Bar */}
                        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-3.5 sm:p-4">
                            <div className="relative">
                                <Icon
                                    icon="mingcute:search-line"
                                    width="20"
                                    height="20"
                                    className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400"
                                />
                                <input
                                    type="text"
                                    placeholder="Search approved products by title, producer, crop type, or category…"
                                    value={searchTerm}
                                    onChange={(e) =>
                                        setSearchTerm(e.target.value)
                                    }
                                    className="w-full h-11 pl-10 pr-4 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 transition-all"
                                />
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50/80 border-b border-slate-200/80">
                                        <tr>
                                            <th
                                                className="px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100/60 transition-colors"
                                                onClick={() =>
                                                    handleSort("name")
                                                }
                                            >
                                                Product{" "}
                                                {sortConfig.key === "name" && (
                                                    <Icon
                                                        icon={
                                                            sortConfig.direction ===
                                                            "asc"
                                                                ? "mingcute:up-line"
                                                                : "mingcute:down-line"
                                                        }
                                                        className="inline ml-1 text-slate-700"
                                                    />
                                                )}
                                            </th>
                                            <th
                                                className="px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100/60 transition-colors"
                                                onClick={() =>
                                                    handleSort("producer")
                                                }
                                            >
                                                Producer{" "}
                                                {sortConfig.key ===
                                                    "producer" && (
                                                    <Icon
                                                        icon={
                                                            sortConfig.direction ===
                                                            "asc"
                                                                ? "mingcute:up-line"
                                                                : "mingcute:down-line"
                                                        }
                                                        className="inline ml-1 text-slate-700"
                                                    />
                                                )}
                                            </th>
                                            <th
                                                className="px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100/60 transition-colors"
                                                onClick={() =>
                                                    handleSort("cropType")
                                                }
                                            >
                                                Crop Type{" "}
                                                {sortConfig.key ===
                                                    "cropType" && (
                                                    <Icon
                                                        icon={
                                                            sortConfig.direction ===
                                                            "asc"
                                                                ? "mingcute:up-line"
                                                                : "mingcute:down-line"
                                                        }
                                                        className="inline ml-1 text-slate-700"
                                                    />
                                                )}
                                            </th>
                                            <th
                                                className="px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100/60 transition-colors"
                                                onClick={() =>
                                                    handleSort("price")
                                                }
                                            >
                                                Price{" "}
                                                {sortConfig.key === "price" && (
                                                    <Icon
                                                        icon={
                                                            sortConfig.direction ===
                                                            "asc"
                                                                ? "mingcute:up-line"
                                                                : "mingcute:down-line"
                                                        }
                                                        className="inline ml-1 text-slate-700"
                                                    />
                                                )}
                                            </th>
                                            <th
                                                className="px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100/60 transition-colors"
                                                onClick={() =>
                                                    handleSort("stock")
                                                }
                                            >
                                                Stock (kg){" "}
                                                {sortConfig.key === "stock" && (
                                                    <Icon
                                                        icon={
                                                            sortConfig.direction ===
                                                            "asc"
                                                                ? "mingcute:up-line"
                                                                : "mingcute:down-line"
                                                        }
                                                        className="inline ml-1 text-slate-700"
                                                    />
                                                )}
                                            </th>
                                            <th
                                                className="px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100/60 transition-colors"
                                                onClick={() =>
                                                    handleSort("sales")
                                                }
                                            >
                                                Sales{" "}
                                                {sortConfig.key === "sales" && (
                                                    <Icon
                                                        icon={
                                                            sortConfig.direction ===
                                                            "asc"
                                                                ? "mingcute:up-line"
                                                                : "mingcute:down-line"
                                                        }
                                                        className="inline ml-1 text-slate-700"
                                                    />
                                                )}
                                            </th>
                                            <th className="px-5 py-3 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-slate-100">
                                        {filterData(
                                            sortData(approvedProducts)
                                        ).map((product) => (
                                            <tr
                                                key={product.id}
                                                className="hover:bg-slate-50/70 transition-colors"
                                            >
                                                <td className="px-5 py-3.5 whitespace-nowrap">
                                                    <div className="flex items-center gap-3">
                                                        <img
                                                            src={product.image}
                                                            alt={product.name}
                                                            className="w-12 h-12 object-cover rounded-xl border border-slate-200 shadow-2xs shrink-0"
                                                        />
                                                        <div>
                                                            <Link
                                                                to={`/admin/product/${product.id}`}
                                                                className="text-xs font-bold text-slate-900 hover:text-emerald-700 tracking-tight transition-colors"
                                                            >
                                                                {product.name}
                                                            </Link>
                                                            <div className="text-[11px] text-slate-500 max-w-[220px] truncate mt-0.5">
                                                                {product.description}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3.5 whitespace-nowrap text-xs text-slate-800 font-medium">
                                                    {product.producer}
                                                </td>
                                                <td className="px-5 py-3.5 whitespace-nowrap">
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80">
                                                        {product.cropType}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3.5 whitespace-nowrap text-xs font-bold text-emerald-700 tabular-nums">
                                                    ₱{Number(product.price).toFixed(2)}/kg
                                                </td>
                                                <td className="px-5 py-3.5 whitespace-nowrap text-xs font-semibold text-slate-800 tabular-nums">
                                                    {product.stock} kg
                                                </td>
                                                <td className="px-5 py-3.5 whitespace-nowrap text-xs text-slate-600 tabular-nums">
                                                    {product.sales} kg sold
                                                </td>
                                                <td className="px-5 py-3.5 whitespace-nowrap text-right">
                                                    <button
                                                        onClick={() =>
                                                            handleProductStatusAction(
                                                                product.id,
                                                                product.status ===
                                                                    "Active"
                                                                    ? "suspend"
                                                                    : "activate"
                                                            )
                                                        }
                                                        disabled={
                                                            product.status !==
                                                                "Active" &&
                                                            product.ownerStatus ===
                                                                "suspended"
                                                        }
                                                        title={
                                                            product.ownerStatus ===
                                                            "suspended"
                                                                ? `Product owner suspended: ${product.ownerSuspensionReason}`
                                                                : ""
                                                        }
                                                        className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-semibold shadow-2xs transition-all duration-150 cursor-pointer active:scale-95 ${
                                                            product.status ===
                                                            "Active"
                                                                ? "bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80"
                                                                : product.ownerStatus ===
                                                                  "suspended"
                                                                ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                                                                : "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80"
                                                        }`}
                                                    >
                                                        {product.status ===
                                                        "Active"
                                                            ? "Suspend"
                                                            : "Activate"}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* Categories Tab */}
                {activeTab === "categories" && (
                    <div className="space-y-4">
                        {/* Add/Edit Category Form */}
                        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 sm:p-6">
                            <h3 className="text-sm font-bold text-slate-900 tracking-tight mb-4">
                                {selectedCategory
                                    ? "Edit Category"
                                    : "Add New Category"}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                                        Category Name
                                    </label>
                                    <input
                                        type="text"
                                        value={newCategory.name}
                                        onChange={(e) =>
                                            setNewCategory({
                                                ...newCategory,
                                                name: e.target.value,
                                            })
                                        }
                                        className="w-full h-11 px-3.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 transition-all"
                                        placeholder="Enter category name…"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                                        Description
                                    </label>
                                    <input
                                        type="text"
                                        value={newCategory.description}
                                        onChange={(e) =>
                                            setNewCategory({
                                                ...newCategory,
                                                description: e.target.value,
                                            })
                                        }
                                        className="w-full h-11 px-3.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 transition-all"
                                        placeholder="Enter brief description…"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                                        Icon Identifier{" "}
                                        <a
                                            href="https://icon-sets.iconify.design/twemoji/"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-emerald-700 text-xs hover:underline ml-1"
                                        >
                                            Icon Guide
                                        </a>
                                    </label>
                                    <input
                                        type="text"
                                        value={newCategory.icon}
                                        onChange={(e) =>
                                            setNewCategory({
                                                ...newCategory,
                                                icon: e.target.value,
                                            })
                                        }
                                        className="w-full h-11 px-3.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 transition-all"
                                        placeholder="e.g., twemoji:carrot"
                                    />
                                    {newCategory.icon && (
                                        <div className="mt-2 flex items-center gap-2">
                                            <Icon
                                                icon={newCategory.icon}
                                                className="text-2xl"
                                            />
                                            <span className="text-xs text-slate-500 font-medium">
                                                Preview Icon
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-2.5 mt-5">
                                <button
                                    onClick={
                                        selectedCategory
                                            ? handleUpdateCategory
                                            : handleAddCategory
                                    }
                                    className="min-h-[40px] px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-all active:scale-[0.98] cursor-pointer"
                                >
                                    {selectedCategory
                                        ? "Update Category"
                                        : "Save Category"}
                                </button>
                                {selectedCategory && (
                                    <button
                                        onClick={() => {
                                            setSelectedCategory(null);
                                            setNewCategory({
                                                name: "",
                                                description: "",
                                                icon: "",
                                            });
                                        }}
                                        className="min-h-[40px] px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all active:scale-[0.98] cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Categories Table */}
                        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50/80 border-b border-slate-200/80">
                                        <tr>
                                            <th className="px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                                                Icon
                                            </th>
                                            <th
                                                className="px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100/60 transition-colors"
                                                onClick={() =>
                                                    handleSort("name")
                                                }
                                            >
                                                Category Name{" "}
                                                {sortConfig.key === "name" && (
                                                    <Icon
                                                        icon={
                                                            sortConfig.direction ===
                                                            "asc"
                                                                ? "mingcute:up-line"
                                                                : "mingcute:down-line"
                                                        }
                                                        className="inline ml-1 text-slate-700"
                                                    />
                                                )}
                                            </th>
                                            <th className="px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                                                Description
                                            </th>
                                            <th className="px-5 py-3 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-slate-100">
                                        {sortData(categories).map(
                                            (category) => (
                                                <tr
                                                    key={category.id}
                                                    className="hover:bg-slate-50/70 transition-colors"
                                                >
                                                    <td className="px-5 py-3.5 whitespace-nowrap text-slate-900">
                                                        {category.icon && (
                                                            <Icon
                                                                icon={
                                                                    category.icon
                                                                }
                                                                className="text-2xl"
                                                            />
                                                        )}
                                                    </td>
                                                    <td className="px-5 py-3.5 whitespace-nowrap text-xs font-bold text-slate-900">
                                                        {category.name}
                                                    </td>
                                                    <td className="px-5 py-3.5 text-xs text-slate-500 max-w-sm truncate">
                                                        {category.description}
                                                    </td>
                                                    <td className="px-5 py-3.5 whitespace-nowrap text-right space-x-2">
                                                        <button
                                                            onClick={() =>
                                                                handleEditCategory(
                                                                    category
                                                                )
                                                            }
                                                            className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 active:scale-95 transition-all cursor-pointer"
                                                        >
                                                            <Icon
                                                                icon="mingcute:edit-line"
                                                                className="mr-1 w-3.5 h-3.5"
                                                            />
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() =>
                                                                handleDeleteCategory(
                                                                    category
                                                                )
                                                            }
                                                            className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 active:scale-95 transition-all cursor-pointer"
                                                        >
                                                            <Icon
                                                                icon="mingcute:delete-line"
                                                                className="mr-1 w-3.5 h-3.5"
                                                            />
                                                            Delete
                                                        </button>
                                                    </td>
                                                </tr>
                                            )
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Image Modal */}
            {showImageModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
                    <div
                        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
                        onClick={() => setShowImageModal(false)}
                    />
                    <div className="relative bg-white rounded-2xl shadow-xl border border-slate-200/90 max-w-2xl w-full p-4 sm:p-5 z-10 animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex justify-between items-center pb-3 mb-3 border-b border-slate-100">
                            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                                Product Image Preview
                            </h3>
                            <button
                                onClick={() => setShowImageModal(false)}
                                className="w-9 h-9 inline-flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 active:scale-95 transition-all cursor-pointer"
                                aria-label="Close modal"
                            >
                                <Icon
                                    icon="mingcute:close-line"
                                    className="w-5 h-5"
                                />
                            </button>
                        </div>
                        <div className="rounded-xl overflow-hidden bg-slate-50 border border-slate-100 flex items-center justify-center max-h-[70vh]">
                            <img
                                src={selectedImage}
                                alt="Product"
                                className="w-full h-auto max-h-[70vh] object-contain"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Confirm Modal */}
            <ConfirmModal
                open={showConfirmModal}
                onClose={() => {
                    console.log("Closing modal");
                    setShowConfirmModal(false);
                    setConfirmAction(null);
                }}
                onConfirm={async () => {
                    console.log("Modal confirm clicked");
                    await confirmProductAction();
                }}
                title={`${
                    confirmAction?.type === "approved" ? "Approve" : "Reject"
                } Product`}
                message={`Are you sure you want to ${
                    confirmAction?.type === "approved" ? "approve" : "reject"
                } this product?`}
                confirmText={
                    confirmAction?.type === "approved" ? "Approve" : "Reject"
                }
                confirmButtonClass={
                    confirmAction?.type === "approved"
                        ? "bg-green-600 hover:bg-green-700"
                        : "bg-red-600 hover:bg-red-700"
                }
            />

            {/* Custom Action Modals */}
            <ActionModal
                open={showRejectionModal}
                onClose={() => {
                    setShowRejectionModal(false);
                    setSelectedProductForRejection(null);
                }}
                onConfirm={handleProductRejection}
                productName={selectedProductForRejection?.name || ""}
                isSubmitting={isSubmitting}
                type="rejection"
            />

            <ActionModal
                open={showSuspensionModal}
                onClose={() => {
                    setShowSuspensionModal(false);
                    setSelectedProductForSuspension(null);
                }}
                onConfirm={handleProductSuspension}
                productName={selectedProductForSuspension?.name || ""}
                isSubmitting={isSubmitting}
                type="suspension"
            />

            {/* Blocked Category Modal */}
            {blockedCategoryInfo && (
                <>
                    <div className="fixed inset-0 bg-black opacity-50 flex items-center justify-center z-[9990] px-4"></div>
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full z-[9999] fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-yellow-100 rounded-full">
                                    <Icon
                                        icon="mingcute:alert-line"
                                        className="w-6 h-6 text-yellow-600"
                                    />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Cannot Delete Category
                                </h3>
                            </div>

                            <p className="text-sm text-gray-600 mb-2">
                                The category{" "}
                                <strong>"{blockedCategoryInfo.name}"</strong>{" "}
                                cannot be deleted because{" "}
                                <strong>{blockedCategoryInfo.count}</strong>{" "}
                                {blockedCategoryInfo.count === 1
                                    ? "crop is"
                                    : "crops are"}{" "}
                                still using it.
                            </p>

                            <p className="text-sm text-gray-600 mb-6">
                                Please switch these{" "}
                                {blockedCategoryInfo.count === 1
                                    ? "crop"
                                    : "crops"}{" "}
                                to other categories before deleting this
                                category.
                            </p>

                            <div className="flex justify-end">
                                <button
                                    onClick={() => setBlockedCategoryInfo(null)}
                                    className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-lg transition-colors"
                                >
                                    OK
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            <AdminNavigationBar />
        </div>
    );
}

export default AdminProductManagement;
