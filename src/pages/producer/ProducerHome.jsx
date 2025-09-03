import { useState, useMemo, useContext, useEffect } from "react";
import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";
import { AuthContext } from "../../App.jsx";
import ProducerNavigationBar from "../../components/ProducerNavigationBar";
import ConfirmModal from "../../components/ConfirmModal";
import supabase from "../../SupabaseClient.jsx";

const categories = [
    { name: "All", icon: "mdi:apps-box" },
    { name: "Vegetables", icon: "twemoji:carrot" },
    { name: "Fruits", icon: "twemoji:red-apple" },
    { name: "Grains", icon: "twemoji:cooked-rice" },
    { name: "Spices", icon: "twemoji:onion" },
    { name: "Root and Tuber", icon: "twemoji:potato" },
    { name: "Legumes", icon: "twemoji:beans" },
];

function ProducerHome() {
    const { user } = useContext(AuthContext);
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [search, setSearch] = useState("");
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [productForm, setProductForm] = useState({
        name: "",
        price: "",
        category: "Vegetables",
        description: "",
        stock: "",
        image: "",
    });

    // Fetch user's products
    useEffect(() => {
        fetchProducts();
    }, [user]);

    const fetchProducts = async () => {
        if (!user) return;

        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("products")
                .select("*")
                .eq("farmer_id", user.id)
                .order("created_at", { ascending: false });

            if (error) {
                console.error("Error fetching products:", error);
            } else {
                setProducts(data || []);
            }
        } catch (error) {
            console.error("Unexpected error:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredProducts = useMemo(() => {
        return products
            .filter(
                (product) =>
                    selectedCategory === "All" ||
                    product.category === selectedCategory
            )
            .filter((product) =>
                product.name.toLowerCase().includes(search.toLowerCase())
            );
    }, [selectedCategory, search, products]);

    const handleAddProduct = async () => {
        if (!user || !productForm.name || !productForm.price) return;

        try {
            const { data, error } = await supabase
                .from("products")
                .insert({
                    farmer_id: user.id,
                    name: productForm.name,
                    price: parseFloat(productForm.price),
                    category: productForm.category,
                    description: productForm.description,
                    stock: parseInt(productForm.stock) || 0,
                    image:
                        productForm.image ||
                        "https://via.placeholder.com/300x200?text=No+Image",
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                })
                .select()
                .single();

            if (error) {
                console.error("Error adding product:", error);
            } else {
                setProducts((prev) => [data, ...prev]);
                setShowAddModal(false);
                resetForm();
            }
        } catch (error) {
            console.error("Unexpected error:", error);
        }
    };

    const handleEditProduct = async () => {
        if (!selectedProduct || !productForm.name || !productForm.price) return;

        try {
            const { data, error } = await supabase
                .from("products")
                .update({
                    name: productForm.name,
                    price: parseFloat(productForm.price),
                    category: productForm.category,
                    description: productForm.description,
                    stock: parseInt(productForm.stock) || 0,
                    image: productForm.image || selectedProduct.image,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", selectedProduct.id)
                .select()
                .single();

            if (error) {
                console.error("Error updating product:", error);
            } else {
                setProducts((prev) =>
                    prev.map((p) => (p.id === selectedProduct.id ? data : p))
                );
                setShowEditModal(false);
                resetForm();
            }
        } catch (error) {
            console.error("Unexpected error:", error);
        }
    };

    const handleDeleteProduct = async () => {
        if (!selectedProduct) return;

        try {
            const { error } = await supabase
                .from("products")
                .delete()
                .eq("id", selectedProduct.id);

            if (error) {
                console.error("Error deleting product:", error);
            } else {
                setProducts((prev) =>
                    prev.filter((p) => p.id !== selectedProduct.id)
                );
                setShowDeleteModal(false);
                setSelectedProduct(null);
            }
        } catch (error) {
            console.error("Unexpected error:", error);
        }
    };

    const resetForm = () => {
        setProductForm({
            name: "",
            price: "",
            category: "Vegetables",
            description: "",
            stock: "",
            image: "",
        });
        setSelectedProduct(null);
    };

    const openEditModal = (product) => {
        setSelectedProduct(product);
        setProductForm({
            name: product.name,
            price: product.price.toString(),
            category: product.category,
            description: product.description || "",
            stock: product.stock?.toString() || "",
            image: product.image || "",
        });
        setShowEditModal(true);
    };

    const openDeleteModal = (product) => {
        setSelectedProduct(product);
        setShowDeleteModal(true);
    };

    const ProductModal = ({ isEdit = false }) => (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black opacity-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full m-4 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">
                        {isEdit ? "Edit Product" : "Add New Product"}
                    </h3>
                    <button
                        onClick={() => {
                            isEdit
                                ? setShowEditModal(false)
                                : setShowAddModal(false);
                            resetForm();
                        }}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <Icon
                            icon="mingcute:close-line"
                            width="24"
                            height="24"
                        />
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Product Name
                        </label>
                        <input
                            type="text"
                            value={productForm.name}
                            onChange={(e) =>
                                setProductForm((prev) => ({
                                    ...prev,
                                    name: e.target.value,
                                }))
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                            placeholder="Enter product name"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Price (₱)
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                value={productForm.price}
                                onChange={(e) =>
                                    setProductForm((prev) => ({
                                        ...prev,
                                        price: e.target.value,
                                    }))
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                                placeholder="0.00"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Stock
                            </label>
                            <input
                                type="number"
                                value={productForm.stock}
                                onChange={(e) =>
                                    setProductForm((prev) => ({
                                        ...prev,
                                        stock: e.target.value,
                                    }))
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                                placeholder="0"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Category
                        </label>
                        <select
                            value={productForm.category}
                            onChange={(e) =>
                                setProductForm((prev) => ({
                                    ...prev,
                                    category: e.target.value,
                                }))
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                        >
                            {categories.slice(1).map((cat) => (
                                <option key={cat.name} value={cat.name}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Image URL
                        </label>
                        <input
                            type="url"
                            value={productForm.image}
                            onChange={(e) =>
                                setProductForm((prev) => ({
                                    ...prev,
                                    image: e.target.value,
                                }))
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                            placeholder="https://example.com/image.jpg"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                        </label>
                        <textarea
                            value={productForm.description}
                            onChange={(e) =>
                                setProductForm((prev) => ({
                                    ...prev,
                                    description: e.target.value,
                                }))
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                            rows="3"
                            placeholder="Describe your product..."
                        />
                    </div>
                </div>

                <div className="flex gap-3 mt-6">
                    <button
                        onClick={() => {
                            isEdit
                                ? setShowEditModal(false)
                                : setShowAddModal(false);
                            resetForm();
                        }}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={isEdit ? handleEditProduct : handleAddProduct}
                        className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
                    >
                        {isEdit ? "Update" : "Add"} Product
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen w-full flex flex-col relative items-center scrollbar-hide bg-background overflow-x-hidden text-text pb-20">
            {/* Modals */}
            {showAddModal && <ProductModal />}
            {showEditModal && <ProductModal isEdit={true} />}
            <ConfirmModal
                open={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDeleteProduct}
                title="Delete Product"
                message={`Are you sure you want to delete "${selectedProduct?.name}"? This action cannot be undone.`}
            />

            {/* Header */}
            <div className="fixed top-0 left-0 w-full bg-white shadow-md z-50 px-4 py-3 flex justify-between items-center">
                <h1 className="text-lg font-semibold text-primary">
                    My Products
                </h1>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-2"
                >
                    <Icon icon="mingcute:add-line" width="20" height="20" />
                    Add Product
                </button>
            </div>

            <div className="w-full max-w-6xl mx-4 sm:mx-auto my-16">
                {/* Search Bar */}
                <div className="mb-6 mt-4">
                    <div className="relative">
                        <Icon
                            icon="mingcute:search-line"
                            width="20"
                            height="20"
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                        />
                        <input
                            type="text"
                            placeholder="Search your products..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                        />
                    </div>
                </div>

                {/* Category Filter */}
                <div className="mb-6">
                    <div className="flex overflow-x-auto gap-4 px-2 py-2 scrollbar-hide">
                        {categories.map((category) => (
                            <button
                                key={category.name}
                                className={`flex flex-col items-center justify-center min-w-[70px] py-3 px-2 rounded-lg transition-all ${
                                    selectedCategory === category.name
                                        ? "bg-primary text-white shadow-md"
                                        : "bg-white hover:bg-gray-50 shadow-sm"
                                }`}
                                onClick={() =>
                                    setSelectedCategory(category.name)
                                }
                            >
                                <Icon
                                    icon={category.icon}
                                    width="32"
                                    height="32"
                                    className={
                                        selectedCategory === category.name
                                            ? "text-white"
                                            : "text-gray-600"
                                    }
                                />
                                <span
                                    className={`mt-1 text-xs font-medium truncate max-w-[70px] ${
                                        selectedCategory === category.name
                                            ? "text-white"
                                            : "text-gray-700"
                                    }`}
                                >
                                    {category.name}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Section Header */}
                <div className="mb-4 px-2">
                    <h2 className="text-xl font-bold text-gray-800">
                        {selectedCategory} Products
                    </h2>
                    <p className="text-gray-600 text-sm">
                        {filteredProducts.length} products found
                    </p>
                </div>

                {/* Products Grid */}
                {loading ? (
                    <div className="flex justify-center py-16">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 px-2">
                        {filteredProducts.length === 0 ? (
                            <div className="col-span-full flex flex-col items-center justify-center py-16">
                                <Icon
                                    icon="mingcute:box-line"
                                    width="64"
                                    height="64"
                                    className="text-gray-300 mb-4"
                                />
                                <p className="text-gray-400 text-lg">
                                    No products found
                                </p>
                                <p className="text-gray-400 text-sm mb-4">
                                    {selectedCategory === "All"
                                        ? "Start by adding your first product"
                                        : "Try adjusting your search or filters"}
                                </p>
                                {selectedCategory === "All" && (
                                    <button
                                        onClick={() => setShowAddModal(true)}
                                        className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark transition-colors"
                                    >
                                        Add Product
                                    </button>
                                )}
                            </div>
                        ) : (
                            filteredProducts.map((product) => (
                                <div
                                    key={product.id}
                                    className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden"
                                >
                                    <div className="relative">
                                        <img
                                            src={product.image}
                                            alt={product.name}
                                            className="w-full h-40 sm:h-48 object-cover"
                                            loading="lazy"
                                        />
                                        <div className="absolute top-2 right-2 flex gap-1">
                                            <button
                                                onClick={() =>
                                                    openEditModal(product)
                                                }
                                                className="bg-white rounded-full p-2 shadow-md hover:bg-gray-50"
                                            >
                                                <Icon
                                                    icon="mingcute:edit-line"
                                                    width="16"
                                                    height="16"
                                                    className="text-blue-600"
                                                />
                                            </button>
                                            <button
                                                onClick={() =>
                                                    openDeleteModal(product)
                                                }
                                                className="bg-white rounded-full p-2 shadow-md hover:bg-gray-50"
                                            >
                                                <Icon
                                                    icon="mingcute:delete-line"
                                                    width="16"
                                                    height="16"
                                                    className="text-red-600"
                                                />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="p-3">
                                        <h3 className="font-semibold text-gray-800 line-clamp-2 mb-1 text-sm">
                                            {product.name}
                                        </h3>

                                        <div className="flex items-center justify-between mb-2">
                                            <p className="text-primary font-bold text-lg">
                                                ₱{product.price?.toFixed(2)}
                                            </p>
                                            <span className="text-xs text-gray-500">
                                                {product.stock || 0} in stock
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-1 text-xs text-gray-500">
                                            <Icon
                                                icon="mingcute:tag-line"
                                                width="12"
                                                height="12"
                                            />
                                            {product.category}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
            <ProducerNavigationBar />
        </div>
    );
}

export default ProducerHome;
