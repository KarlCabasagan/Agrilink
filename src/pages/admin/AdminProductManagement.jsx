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

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!reason.trim()) {
            setError(`Please provide a reason for ${actionText}`);
            return;
        }
        onConfirm(reason.trim());
    };

    if (!open) return null;

    return (
        <>
            <div
                className="fixed inset-0 z-[9999] bg-black opacity-50"
                onClick={onClose}
            ></div>
            <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {title} Product
                    </h3>
                    <p className="text-gray-600 mb-4">
                        You are about to {actionText.toLowerCase()} "
                        {productName}". Please provide a reason for {actionText}
                        .
                    </p>

                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {title} Reason{" "}
                                <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={reason}
                                onChange={(e) => {
                                    setReason(e.target.value);
                                    if (error) setError("");
                                }}
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                                    error ? "border-red-500" : "border-gray-300"
                                }`}
                                rows="3"
                                placeholder={`Please provide a detailed reason for ${actionText.toLowerCase()} this product...`}
                            />
                            {error && (
                                <p className="mt-1 text-sm text-red-500">
                                    {error}
                                </p>
                            )}
                        </div>

                        <div className="flex justify-end gap-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={!reason.trim() || isSubmitting}
                                className={`px-4 py-2 rounded text-white font-medium transition-colors 
                                    ${
                                        !reason.trim() || isSubmitting
                                            ? "bg-red-400 cursor-not-allowed"
                                            : "bg-red-600 hover:bg-red-700"
                                    }`}
                            >
                                {isSubmitting ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        {`${title}ing...`}
                                    </div>
                                ) : (
                                    `${title} Product`
                                )}
                            </button>
                        </div>
                    </form>
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

    // Fetch categories from Supabase
    useEffect(() => {
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

        fetchCategories();
    }, []);

    const [newCategory, setNewCategory] = useState({
        name: "",
        description: "",
        icon: "",
    });

    const [pendingProducts, setPendingProducts] = useState([]);

    // Fetch pending products from Supabase
    useEffect(() => {
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
                .is("approval_date", null); // Only get products with null approval_date

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

        fetchPendingProducts();
    }, []);

    const [approvedProducts, setApprovedProducts] = useState([]);

    // Fetch approved products from Supabase
    useEffect(() => {
        const fetchApprovedProducts = async () => {
            console.log("Fetching approved products...");
            const { data: products, error } = await supabase
                .from("products")
                .select(
                    `
                    *,
                    user_id:profiles!products_user_id_fkey(name),
                    category_id:categories!products_category_id_fkey(name),
                    status_id:statuses!products_status_id_fkey(name)
                `
                )
                .not("approval_date", "is", null) // Not pending
                .not("approval_date", "eq", "1970-01-01T00:00:00Z"); // Not rejected

            console.log("Approved products query result:", { products, error });

            if (error) {
                console.error("Error fetching approved products:", error);
                return;
            }

            // Fetch sales data for each product
            const { data: orderItems, error: orderError } = await supabase
                .from("order_items")
                .select("product_id, quantity");

            if (orderError) {
                console.error("Error fetching order items:", orderError);
                return;
            }

            // Calculate total sales for each product
            const salesByProduct = {};
            orderItems?.forEach((item) => {
                if (!salesByProduct[item.product_id]) {
                    salesByProduct[item.product_id] = 0;
                }
                salesByProduct[item.product_id] += item.quantity;
            });

            const formattedProducts = products.map((product) => ({
                id: product.id,
                name: product.name,
                producer: product.user_id.name,
                category: product.category_id.name,
                cropType: product.crop_type,
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
                sales: salesByProduct[product.id] || 0,
                rating: "N/A",
                reviews: 0,
            }));

            setApprovedProducts(formattedProducts);
        };

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
                item.category
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase()) ||
                (item.cropType &&
                    item.cropType
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase()))
        );
    };

    const handleImageClick = (imageUrl) => {
        setSelectedImage(imageUrl);
        setShowImageModal(true);
    };

    // Category management functions
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

    const handleDeleteCategory = async (categoryId) => {
        const { error } = await supabase
            .from("categories")
            .delete()
            .eq("id", categoryId);

        if (error) {
            console.error("Error deleting category:", error);
            return;
        }

        setCategories(categories.filter((cat) => cat.id !== categoryId));
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
        if (action === "suspend") {
            const product = approvedProducts.find((p) => p.id === productId);
            if (!product) {
                console.error("Product not found:", productId);
                return;
            }
            setSelectedProductForSuspension(product);
            setShowSuspensionModal(true);
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
        <div className="min-h-screen w-full flex flex-col relative items-center scrollbar-hide bg-background overflow-x-hidden text-text pb-20">
            {/* Header */}
            <div className="fixed top-0 left-0 w-full bg-white shadow-md z-50 px-4 py-3">
                <h1 className="text-lg font-semibold text-primary text-center">
                    Product Management
                </h1>
            </div>

            <div className="w-full max-w-7xl mx-4 sm:mx-auto my-16">
                {/* Tabs */}
                <div className="bg-white rounded-lg shadow-md mb-6 mt-4">
                    <div className="flex border-b border-gray-200">
                        <button
                            onClick={() => setActiveTab("pending")}
                            className={`flex-1 py-3 px-4 text-center font-medium transition-colors ${
                                activeTab === "pending"
                                    ? "text-primary border-b-2 border-primary"
                                    : "text-gray-600 hover:text-gray-800"
                            }`}
                        >
                            Pending Approval
                            {pendingProducts.length > 0 && (
                                <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                                    {pendingProducts.length}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab("approved")}
                            className={`flex-1 py-3 px-4 text-center font-medium transition-colors ${
                                activeTab === "approved"
                                    ? "text-primary border-b-2 border-primary"
                                    : "text-gray-600 hover:text-gray-800"
                            }`}
                        >
                            Approved Products
                        </button>
                        <button
                            onClick={() => setActiveTab("categories")}
                            className={`flex-1 py-3 px-4 text-center font-medium transition-colors ${
                                activeTab === "categories"
                                    ? "text-primary border-b-2 border-primary"
                                    : "text-gray-600 hover:text-gray-800"
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
                        <div className="bg-white rounded-lg shadow-md p-4">
                            <div className="relative">
                                <Icon
                                    icon="mingcute:search-line"
                                    width="20"
                                    height="20"
                                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                                />
                                <input
                                    type="text"
                                    placeholder="Search products..."
                                    value={searchTerm}
                                    onChange={(e) =>
                                        setSearchTerm(e.target.value)
                                    }
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                                />
                            </div>
                        </div>

                        {filterData(sortData(pendingProducts)).length === 0 ? (
                            <div className="bg-white rounded-lg shadow-md p-8 text-center">
                                <Icon
                                    icon="mingcute:box-2-line"
                                    width="64"
                                    height="64"
                                    className="mx-auto text-gray-300 mb-4"
                                />
                                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                                    No Pending Products
                                </h3>
                                <p className="text-gray-500">
                                    All products have been reviewed.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {filterData(sortData(pendingProducts)).map(
                                    (product) => (
                                        <div
                                            key={product.id}
                                            className="bg-white rounded-lg shadow-md p-6"
                                        >
                                            <div className="flex flex-col lg:flex-row gap-6">
                                                {/* Product Image */}
                                                <div className="lg:w-48 flex-shrink-0">
                                                    <img
                                                        src={product.image}
                                                        alt={product.name}
                                                        className="w-full h-48 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                                                        onClick={() =>
                                                            handleImageClick(
                                                                product.image
                                                            )
                                                        }
                                                    />
                                                </div>

                                                {/* Product Details */}
                                                <div className="flex-1">
                                                    <div className="flex items-start justify-between mb-4">
                                                        <div>
                                                            <h3 className="text-xl font-semibold text-gray-800">
                                                                {product.name}
                                                            </h3>
                                                            <p className="text-sm text-gray-600">
                                                                by{" "}
                                                                {
                                                                    product.producer
                                                                }
                                                            </p>
                                                            <p className="text-xs text-gray-500 mt-1">
                                                                Submitted on{" "}
                                                                {new Date(
                                                                    product.submittedDate
                                                                ).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                        <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
                                                            Pending Review
                                                        </span>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                                                        <div>
                                                            <h4 className="font-medium text-gray-700 mb-1">
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
                                                                className="text-sm border-gray-300 rounded-md focus:ring-primary focus:border-primary w-full"
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
                                                            <h4 className="font-medium text-gray-700 mb-1">
                                                                Crop Type
                                                            </h4>
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                                {
                                                                    product.cropType
                                                                }
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <h4 className="font-medium text-gray-700 mb-1">
                                                                Price
                                                            </h4>
                                                            <p className="text-lg font-semibold text-green-600">
                                                                ₱{product.price}{" "}
                                                                / kg
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <h4 className="font-medium text-gray-700 mb-1">
                                                                Stock
                                                            </h4>
                                                            <p className="text-sm text-gray-600">
                                                                {product.stock}{" "}
                                                                kg available
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="mb-4">
                                                        <h4 className="font-medium text-gray-700 mb-2">
                                                            Description
                                                        </h4>
                                                        <p className="text-sm text-gray-600 leading-relaxed">
                                                            {
                                                                product.description
                                                            }
                                                        </p>
                                                    </div>

                                                    <div className="flex justify-end gap-3">
                                                        <button
                                                            onClick={() =>
                                                                handleProductAction(
                                                                    product.id,
                                                                    "approved"
                                                                )
                                                            }
                                                            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                                                        >
                                                            <Icon icon="mingcute:check-line" />
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={() =>
                                                                handleProductAction(
                                                                    product.id,
                                                                    "rejected"
                                                                )
                                                            }
                                                            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                                                        >
                                                            <Icon icon="mingcute:close-line" />
                                                            Reject
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
                        <div className="bg-white rounded-lg shadow-md p-4">
                            <div className="relative">
                                <Icon
                                    icon="mingcute:search-line"
                                    width="20"
                                    height="20"
                                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                                />
                                <input
                                    type="text"
                                    placeholder="Search approved products..."
                                    value={searchTerm}
                                    onChange={(e) =>
                                        setSearchTerm(e.target.value)
                                    }
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                                />
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-md overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
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
                                                        className="inline ml-1"
                                                    />
                                                )}
                                            </th>
                                            <th
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
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
                                                        className="inline ml-1"
                                                    />
                                                )}
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Category
                                            </th>
                                            <th
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
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
                                                        className="inline ml-1"
                                                    />
                                                )}
                                            </th>
                                            <th
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
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
                                                        className="inline ml-1"
                                                    />
                                                )}
                                            </th>
                                            <th
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
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
                                                        className="inline ml-1"
                                                    />
                                                )}
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {filterData(
                                            sortData(approvedProducts)
                                        ).map((product) => (
                                            <tr
                                                key={product.id}
                                                className="hover:bg-gray-50"
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <img
                                                            src={product.image}
                                                            alt={product.name}
                                                            className="w-16 h-16 object-cover rounded-lg"
                                                        />
                                                        <div className="ml-4">
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {product.name}
                                                            </div>
                                                            <div className="text-sm text-gray-500">
                                                                {product.description.substring(
                                                                    0,
                                                                    50
                                                                )}
                                                                ...
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {product.producer}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <select
                                                        value={product.category}
                                                        onChange={(e) => {
                                                            setApprovedProducts(
                                                                (prev) =>
                                                                    prev.map(
                                                                        (p) =>
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
                                                        className="text-sm border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                                                    >
                                                        {categories.map(
                                                            (cat) => (
                                                                <option
                                                                    key={cat.id}
                                                                    value={
                                                                        cat.name
                                                                    }
                                                                >
                                                                    {cat.name}
                                                                </option>
                                                            )
                                                        )}
                                                    </select>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    ₱{product.price}/kg
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {product.stock} kg
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {product.sales} sold
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
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
                                                        className={`inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white ${
                                                            product.status ===
                                                            "Active"
                                                                ? "bg-red-600 hover:bg-red-700"
                                                                : "bg-green-600 hover:bg-green-700"
                                                        } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
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
                        {/* Add Category Form */}
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <h3 className="text-lg font-semibold mb-4">
                                {selectedCategory
                                    ? "Edit Category"
                                    : "Add New Category"}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
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
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                                        placeholder="Enter category name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
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
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                                        placeholder="Enter description"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Icon{" "}
                                        <a
                                            href="https://icon-sets.iconify.design/twemoji/"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-primary text-xs hover:underline ml-1"
                                        >
                                            FAQ
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
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                                        placeholder="e.g., twemoji:carrot"
                                    />
                                    {newCategory.icon && (
                                        <div className="mt-2 flex items-center gap-2">
                                            <Icon
                                                icon={newCategory.icon}
                                                className="text-2xl"
                                            />
                                            <span className="text-sm text-gray-500">
                                                Preview
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-2 mt-4">
                                <button
                                    onClick={
                                        selectedCategory
                                            ? handleUpdateCategory
                                            : handleAddCategory
                                    }
                                    className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
                                >
                                    {selectedCategory
                                        ? "Update Category"
                                        : "Add Category"}
                                </button>
                                {selectedCategory && (
                                    <button
                                        onClick={() => {
                                            setSelectedCategory(null);
                                            setNewCategory({
                                                name: "",
                                                description: "",
                                            });
                                        }}
                                        className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Categories Table */}
                        <div className="bg-white rounded-lg shadow-md overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Icon
                                            </th>
                                            <th
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
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
                                                        className="inline ml-1"
                                                    />
                                                )}
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Description
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {sortData(categories).map(
                                            (category) => (
                                                <tr
                                                    key={category.id}
                                                    className="hover:bg-gray-50"
                                                >
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {category.icon && (
                                                            <Icon
                                                                icon={
                                                                    category.icon
                                                                }
                                                                className="text-2xl"
                                                            />
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        {category.name}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {category.description}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                                        <button
                                                            onClick={() =>
                                                                handleEditCategory(
                                                                    category
                                                                )
                                                            }
                                                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                                        >
                                                            <Icon
                                                                icon="mingcute:edit-line"
                                                                className="mr-1"
                                                            />
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() =>
                                                                handleDeleteCategory(
                                                                    category.id
                                                                )
                                                            }
                                                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                                        >
                                                            <Icon
                                                                icon="mingcute:delete-line"
                                                                className="mr-1"
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
                <>
                    <div
                        className="fixed inset-0 bg-black opacity-50 flex items-center justify-center z-[9999]"
                        onClick={() => setShowImageModal(false)}
                    ></div>
                    <div className="bg-white p-4 rounded-lg max-w-2xl max-h-[80vh] overflow-auto z-[10000] fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-11/12 md:w-3/4 lg:w-1/2">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">
                                Product Image
                            </h3>
                            <button
                                onClick={() => setShowImageModal(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <Icon
                                    icon="mingcute:close-line"
                                    width="24"
                                    height="24"
                                />
                            </button>
                        </div>
                        <img
                            src={selectedImage}
                            alt="Product"
                            className="w-full h-auto rounded-lg"
                        />
                    </div>
                </>
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

            <AdminNavigationBar />
        </div>
    );
}

export default AdminProductManagement;
