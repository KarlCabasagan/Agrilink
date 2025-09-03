import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";
import AdminNavigationBar from "../../components/AdminNavigationBar";
import ConfirmModal from "../../components/ConfirmModal";

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
    const [confirmAction, setConfirmAction] = useState(null);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [showImageModal, setShowImageModal] = useState(false);
    const [selectedImage, setSelectedImage] = useState("");
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortConfig, setSortConfig] = useState({
        key: null,
        direction: "asc",
    });

    // Categories management
    const [categories, setCategories] = useState([
        {
            id: 1,
            name: "Vegetables",
            description: "Fresh vegetables and greens",
            icon: "twemoji:leafy-greens",
        },
        {
            id: 2,
            name: "Grains",
            description: "Rice, corn, wheat and other grains",
            icon: "twemoji:sheaf-of-rice",
        },
        {
            id: 3,
            name: "Fruits",
            description: "Fresh seasonal fruits",
            icon: "twemoji:red-apple",
        },
        {
            id: 4,
            name: "Legumes",
            description: "Beans, lentils and other legumes",
            icon: "twemoji:beans",
        },
        {
            id: 5,
            name: "Root Crops",
            description: "Potatoes, sweet potatoes, cassava",
            icon: "twemoji:potato",
        },
    ]);

    const [newCategory, setNewCategory] = useState({
        name: "",
        description: "",
        icon: "",
    });

    const [pendingProducts, setPendingProducts] = useState([
        {
            id: 1,
            name: "Organic Tomatoes",
            producer: "John Farmer",
            category: "Vegetables",
            cropType: "Tomato",
            price: 80,
            unit: "kg",
            description: "Fresh organic tomatoes grown without pesticides",
            image: "https://drearth.com/wp-content/uploads/tomato-iStock-174932787.jpg",
            submittedDate: "2024-09-01",
            status: "pending",
            stock: 50,
        },
        {
            id: 2,
            name: "Premium Rice",
            producer: "Maria Cruz",
            category: "Grains",
            cropType: "Rice",
            price: 45,
            unit: "kg",
            description: "High-quality jasmine rice from Nueva Ecija",
            image: "https://www.bigas-online.com/cdn/shop/products/dinorado_300x300.jpg?v=1600422872",
            submittedDate: "2024-08-30",
            status: "pending",
            stock: 200,
        },
        {
            id: 3,
            name: "Fresh Carrots",
            producer: "Pedro Santos",
            category: "Vegetables",
            cropType: "Carrot",
            price: 60,
            unit: "kg",
            description: "Crisp and sweet carrots harvested daily",
            image: "/assets/adel.jpg",
            submittedDate: "2024-08-28",
            status: "pending",
            stock: 30,
        },
    ]);

    const [approvedProducts, setApprovedProducts] = useState([
        {
            id: 101,
            name: "Sweet Corn",
            producer: "Ana Garcia",
            category: "Vegetables",
            cropType: "Corn",
            price: 25,
            unit: "kg",
            description: "Sweet and tender corn",
            image: "/assets/adel.jpg",
            approvedDate: "2024-08-25",
            status: "Active", // Active or Suspended
            stock: 100,
            sales: 45,
            rating: 4.5,
            reviews: 23,
        },
        {
            id: 102,
            name: "Fresh Lettuce",
            producer: "Carlos Mendoza",
            category: "Vegetables",
            cropType: "Lettuce",
            price: 35,
            unit: "kg",
            description: "Crisp lettuce leaves perfect for salads",
            image: "/assets/adel.jpg",
            approvedDate: "2024-08-20",
            status: "Active", // Active or Suspended
            stock: 75,
            sales: 32,
            rating: 4.2,
            reviews: 18,
        },
        {
            id: 103,
            name: "Organic Cabbage",
            producer: "Linda Torres",
            category: "Vegetables",
            cropType: "Cabbage",
            price: 40,
            unit: "kg",
            description: "Organic cabbage grown with natural methods",
            image: "/assets/adel.jpg",
            approvedDate: "2024-08-18",
            status: "Suspended", // Example of suspended product
            stock: 60,
            sales: 28,
            rating: 4.0,
            reviews: 15,
        },
    ]);

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
    const handleAddCategory = () => {
        if (newCategory.name.trim()) {
            const newCategoryObj = {
                id: Math.max(...categories.map((c) => c.id)) + 1,
                name: newCategory.name.trim(),
                description: newCategory.description.trim(),
                icon: newCategory.icon.trim() || "twemoji:package",
            };
            setCategories([...categories, newCategoryObj]);
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

    const handleUpdateCategory = () => {
        if (selectedCategory && newCategory.name.trim()) {
            setCategories(
                categories.map((cat) =>
                    cat.id === selectedCategory.id
                        ? {
                              ...cat,
                              name: newCategory.name.trim(),
                              description: newCategory.description.trim(),
                              icon:
                                  newCategory.icon.trim() || "twemoji:package",
                          }
                        : cat
                )
            );
            setSelectedCategory(null);
            setNewCategory({ name: "", description: "", icon: "" });
        }
    };

    const handleDeleteCategory = (categoryId) => {
        setCategories(categories.filter((cat) => cat.id !== categoryId));
    };

    const handleProductAction = (productId, action) => {
        setConfirmAction({ id: productId, type: action });
        setShowConfirmModal(true);
    };

    // Handle product status change (suspend/activate) - separate from approval/rejection
    const handleProductStatusAction = (productId, action) => {
        setApprovedProducts((prev) =>
            prev.map((product) =>
                product.id === productId
                    ? {
                          ...product,
                          status: action === "suspend" ? "Suspended" : "Active",
                      }
                    : product
            )
        );
    };

    const confirmProductAction = () => {
        if (confirmAction) {
            const product = pendingProducts.find(
                (p) => p.id === confirmAction.id
            );

            if (confirmAction.type === "approved") {
                // Move to approved products
                setApprovedProducts((prev) => [
                    ...prev,
                    {
                        ...product,
                        status: "approved",
                        approvedDate: new Date().toISOString().split("T")[0],
                        rating: 0,
                        reviews: 0,
                        sales: 0,
                    },
                ]);
                // Remove from pending
                setPendingProducts((prev) =>
                    prev.filter((p) => p.id !== confirmAction.id)
                );
            } else if (confirmAction.type === "rejected") {
                // Remove from pending
                setPendingProducts((prev) =>
                    prev.filter((p) => p.id !== confirmAction.id)
                );
            }

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
                                                                / {product.unit}
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

                                                    <div className="flex gap-3">
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
                                            <th
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                                onClick={() =>
                                                    handleSort("rating")
                                                }
                                            >
                                                Rating{" "}
                                                {sortConfig.key ===
                                                    "rating" && (
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
                                                    ₱{product.price}/
                                                    {product.unit}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {product.stock} kg
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {product.sales} sold
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <Icon
                                                            icon="mingcute:star-fill"
                                                            className="text-yellow-400 mr-1"
                                                        />
                                                        <span className="text-sm text-gray-900">
                                                            {product.rating} (
                                                            <Link
                                                                to={`/admin/products/${product.id}/reviews`}
                                                                className="text-blue-600 hover:text-blue-800 font-medium"
                                                            >
                                                                {
                                                                    product.reviews
                                                                }{" "}
                                                                reviews
                                                            </Link>
                                                            )
                                                        </span>
                                                    </div>
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
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                    onClick={() => setShowImageModal(false)}
                >
                    <div className="bg-white p-4 rounded-lg max-w-2xl max-h-[80vh] overflow-auto">
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
                </div>
            )}

            {/* Confirm Modal */}
            {showConfirmModal && (
                <ConfirmModal
                    isOpen={showConfirmModal}
                    onClose={() => setShowConfirmModal(false)}
                    onConfirm={confirmProductAction}
                    title={`${
                        confirmAction?.type === "approved"
                            ? "Approve"
                            : "Reject"
                    } Product`}
                    message={`Are you sure you want to ${
                        confirmAction?.type === "approved"
                            ? "approve"
                            : "reject"
                    } this product?`}
                    confirmText={
                        confirmAction?.type === "approved"
                            ? "Approve"
                            : "Reject"
                    }
                    confirmButtonClass={
                        confirmAction?.type === "approved"
                            ? "bg-green-600 hover:bg-green-700"
                            : "bg-red-600 hover:bg-red-700"
                    }
                />
            )}

            <AdminNavigationBar />
        </div>
    );
}

export default AdminProductManagement;
