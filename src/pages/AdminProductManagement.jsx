import { useState } from "react";
import { Icon } from "@iconify/react";
import AdminNavigationBar from "../components/AdminNavigationBar";
import ConfirmModal from "../components/ConfirmModal";

function AdminProductManagement() {
    const [activeTab, setActiveTab] = useState("pending");
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null);

    const [pendingProducts, setPendingProducts] = useState([
        {
            id: 1,
            name: "Organic Tomatoes",
            producer: "John Farmer",
            category: "Vegetables",
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
            price: 25,
            unit: "piece",
            description: "Sweet and tender corn",
            image: "/assets/adel.jpg",
            approvedDate: "2024-08-25",
            status: "approved",
            stock: 100,
            sales: 45,
        },
        {
            id: 102,
            name: "Fresh Lettuce",
            producer: "Carlos Mendoza",
            category: "Vegetables",
            price: 35,
            unit: "head",
            description: "Crisp lettuce leaves",
            image: "/assets/adel.jpg",
            approvedDate: "2024-08-20",
            status: "approved",
            stock: 75,
            sales: 32,
        },
    ]);

    const handleProductAction = (productId, action) => {
        setConfirmAction({ id: productId, type: action });
        setShowConfirmModal(true);
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
                        sales: 0,
                    },
                ]);
            }

            // Remove from pending
            setPendingProducts((prev) =>
                prev.filter((p) => p.id !== confirmAction.id)
            );
        }
        setShowConfirmModal(false);
        setConfirmAction(null);
    };

    const suspendProduct = (productId) => {
        setApprovedProducts((prev) =>
            prev.map((product) =>
                product.id === productId
                    ? {
                          ...product,
                          status:
                              product.status === "approved"
                                  ? "suspended"
                                  : "approved",
                      }
                    : product
            )
        );
    };

    return (
        <div className="min-h-screen w-full flex flex-col relative items-center scrollbar-hide bg-background overflow-x-hidden text-text pb-20">
            {/* Header */}
            <div className="fixed top-0 left-0 w-full bg-white shadow-md z-50 px-4 py-3">
                <h1 className="text-lg font-semibold text-primary text-center">
                    Product Management
                </h1>
            </div>

            <div className="w-full max-w-6xl mx-4 sm:mx-auto my-16">
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
                    </div>
                </div>

                {/* Pending Products Tab */}
                {activeTab === "pending" && (
                    <div className="space-y-4">
                        {pendingProducts.length === 0 ? (
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
                            pendingProducts.map((product) => (
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
                                                className="w-full h-48 object-cover rounded-lg"
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
                                                        by {product.producer}
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
                                                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                                                        {product.category}
                                                    </span>
                                                </div>
                                                <div>
                                                    <h4 className="font-medium text-gray-700 mb-1">
                                                        Price
                                                    </h4>
                                                    <p className="text-lg font-semibold text-green-600">
                                                        ₱{product.price} /{" "}
                                                        {product.unit}
                                                    </p>
                                                </div>
                                                <div>
                                                    <h4 className="font-medium text-gray-700 mb-1">
                                                        Stock
                                                    </h4>
                                                    <p className="text-sm text-gray-600">
                                                        {product.stock}{" "}
                                                        {product.unit}s
                                                        available
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="mb-4">
                                                <h4 className="font-medium text-gray-700 mb-2">
                                                    Description
                                                </h4>
                                                <p className="text-sm text-gray-600 leading-relaxed">
                                                    {product.description}
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
                                                    className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium"
                                                >
                                                    <Icon
                                                        icon="mingcute:check-line"
                                                        width="20"
                                                        height="20"
                                                        className="inline mr-2"
                                                    />
                                                    Approve Product
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        handleProductAction(
                                                            product.id,
                                                            "rejected"
                                                        )
                                                    }
                                                    className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors font-medium"
                                                >
                                                    <Icon
                                                        icon="mingcute:close-line"
                                                        width="20"
                                                        height="20"
                                                        className="inline mr-2"
                                                    />
                                                    Reject Product
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* Approved Products Tab */}
                {activeTab === "approved" && (
                    <div className="bg-white rounded-lg shadow-md overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Product
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Producer
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Price
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Stock
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Sales
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {approvedProducts.map((product) => (
                                        <tr
                                            key={product.id}
                                            className="hover:bg-gray-50"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <img
                                                        src={product.image}
                                                        alt={product.name}
                                                        className="w-12 h-12 rounded-lg object-cover mr-3"
                                                    />
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {product.name}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {product.category}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {product.producer}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                                                ₱{product.price} /{" "}
                                                {product.unit}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {product.stock} {product.unit}s
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {product.sales} sold
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span
                                                    className={`px-2 py-1 text-xs rounded-full ${
                                                        product.status ===
                                                        "approved"
                                                            ? "bg-green-100 text-green-800"
                                                            : "bg-red-100 text-red-800"
                                                    }`}
                                                >
                                                    {product.status ===
                                                    "approved"
                                                        ? "Active"
                                                        : "Suspended"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <button
                                                    onClick={() =>
                                                        suspendProduct(
                                                            product.id
                                                        )
                                                    }
                                                    className={`${
                                                        product.status ===
                                                        "approved"
                                                            ? "text-red-600 hover:text-red-900"
                                                            : "text-green-600 hover:text-green-900"
                                                    }`}
                                                >
                                                    {product.status ===
                                                    "approved"
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
                )}
            </div>

            {/* Confirmation Modal */}
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
