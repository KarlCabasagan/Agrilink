import {
    useState,
    useMemo,
    useContext,
    useEffect,
    useCallback,
    memo,
} from "react";
import { Icon } from "@iconify/react";
import { Link, useNavigate } from "react-router-dom";
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

// Memoized ProductModal component to prevent unnecessary re-renders
const ProductModal = memo(
    ({
        isEdit = false,
        isOpen,
        onClose,
        productForm,
        onInputChange,
        onImageUpload,
        cropTypeSearch,
        onCropTypeSearch,
        showCropDropdown,
        setShowCropDropdown,
        filteredCrops,
        onCropTypeSelect,
        onSubmit,
        categories,
    }) => {
        if (!isOpen) return null;

        return (
            <>
                <div
                    className="fixed inset-0 z-[9999] bg-black opacity-50"
                    onClick={onClose}
                ></div>
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md sm:max-w-lg md:max-w-2xl lg:max-w-3xl xl:max-w-4xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold">
                                    {isEdit
                                        ? "Edit Product"
                                        : "Add New Product"}
                                </h3>
                                <button
                                    onClick={onClose}
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
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Product Name *
                                        </label>
                                        <input
                                            type="text"
                                            value={productForm.name}
                                            onChange={(e) =>
                                                onInputChange(
                                                    "name",
                                                    e.target.value
                                                )
                                            }
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                                            placeholder="Enter product name"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Price per kg (₱) *
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={productForm.price}
                                            onChange={(e) =>
                                                onInputChange(
                                                    "price",
                                                    e.target.value
                                                )
                                            }
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                                            placeholder="0.00"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Stock (kg) *
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.1"
                                            value={productForm.stock}
                                            onChange={(e) =>
                                                onInputChange(
                                                    "stock",
                                                    e.target.value
                                                )
                                            }
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                                            placeholder="0.0"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Category *
                                        </label>
                                        <select
                                            value={productForm.category}
                                            onChange={(e) =>
                                                onInputChange(
                                                    "category",
                                                    e.target.value
                                                )
                                            }
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                                            required
                                        >
                                            {categories.slice(1).map((cat) => (
                                                <option
                                                    key={cat.name}
                                                    value={cat.name}
                                                >
                                                    {cat.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Minimum Quantity for Delivery (kg) *
                                        </label>
                                        <input
                                            type="number"
                                            min="0.1"
                                            step="0.1"
                                            value={productForm.minimumQuantity}
                                            onChange={(e) =>
                                                onInputChange(
                                                    "minimumQuantity",
                                                    e.target.value
                                                )
                                            }
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                                            placeholder="1.0"
                                            required
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            Minimum quantity required for home
                                            delivery option
                                        </p>
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Crop Type *
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={cropTypeSearch}
                                                onChange={(e) =>
                                                    onCropTypeSearch(
                                                        e.target.value
                                                    )
                                                }
                                                onFocus={() =>
                                                    setShowCropDropdown(true)
                                                }
                                                onBlur={() =>
                                                    setTimeout(
                                                        () =>
                                                            setShowCropDropdown(
                                                                false
                                                            ),
                                                        200
                                                    )
                                                }
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                                                placeholder="Search for crop type..."
                                                required
                                            />
                                            {showCropDropdown &&
                                                filteredCrops.length > 0 && (
                                                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                                                        {filteredCrops.map(
                                                            (crop) => (
                                                                <div
                                                                    key={crop}
                                                                    onClick={() =>
                                                                        onCropTypeSelect(
                                                                            crop
                                                                        )
                                                                    }
                                                                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                                                                >
                                                                    {crop}
                                                                </div>
                                                            )
                                                        )}
                                                    </div>
                                                )}
                                        </div>
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-3">
                                            Product Image
                                        </label>

                                        {/* Image Preview Section */}
                                        {productForm.imagePreview ? (
                                            <div className="relative mb-4">
                                                <div className="w-full h-48 bg-gray-100 rounded-lg overflow-hidden border-2 border-dashed border-gray-300">
                                                    <img
                                                        src={
                                                            productForm.imagePreview
                                                        }
                                                        alt="Product Preview"
                                                        className="w-full h-full object-cover rounded-lg"
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        onInputChange(
                                                            "image",
                                                            null
                                                        );
                                                        onInputChange(
                                                            "imagePreview",
                                                            ""
                                                        );
                                                    }}
                                                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-md transition-colors"
                                                >
                                                    <Icon
                                                        icon="mingcute:close-line"
                                                        width="16"
                                                        height="16"
                                                    />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="w-full h-48 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center mb-4">
                                                <Icon
                                                    icon="mingcute:image-line"
                                                    width="48"
                                                    height="48"
                                                    className="text-gray-400 mb-2"
                                                />
                                                <p className="text-sm text-gray-500 text-center">
                                                    No image selected
                                                </p>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    Upload an image to see
                                                    preview
                                                </p>
                                            </div>
                                        )}

                                        {/* Compact File Input */}
                                        <div className="flex items-center gap-3">
                                            <label className="flex-1 cursor-pointer">
                                                <div className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                                                    <Icon
                                                        icon="mingcute:upload-2-line"
                                                        width="18"
                                                        height="18"
                                                        className="text-gray-600"
                                                    />
                                                    <span className="text-sm font-medium text-gray-700">
                                                        {productForm.imagePreview
                                                            ? "Change Image"
                                                            : "Upload Image"}
                                                    </span>
                                                </div>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={onImageUpload}
                                                    className="hidden"
                                                />
                                            </label>

                                            {productForm.imagePreview && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        onInputChange(
                                                            "image",
                                                            null
                                                        );
                                                        onInputChange(
                                                            "imagePreview",
                                                            ""
                                                        );
                                                    }}
                                                    className="px-3 py-2.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                    Remove
                                                </button>
                                            )}
                                        </div>

                                        <p className="text-xs text-gray-500 mt-2">
                                            Recommended: JPG, PNG or WebP
                                            format, max 5MB
                                        </p>
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Description
                                        </label>
                                        <textarea
                                            value={productForm.description}
                                            onChange={(e) =>
                                                onInputChange(
                                                    "description",
                                                    e.target.value
                                                )
                                            }
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                                            rows="3"
                                            placeholder="Describe your product..."
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={onClose}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={onSubmit}
                                    disabled={
                                        !productForm.name ||
                                        !productForm.price ||
                                        !productForm.stock
                                    }
                                    className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                                >
                                    {isEdit ? "Update" : "Add"} Product
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    }
);

ProductModal.displayName = "ProductModal";

function ProducerHome() {
    const { user } = useContext(AuthContext);
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [search, setSearch] = useState("");
    const [products, setProducts] = useState([
        // Sample product for demonstration
        {
            id: 1,
            name: "Fresh Organic Tomatoes",
            price: 45.0,
            category: "Vegetables",
            description:
                "Locally grown organic tomatoes, perfect for cooking and salads",
            stock: 50,
            image: "https://images.unsplash.com/photo-1546470427-e70c6b9a5e9c?w=400&h=300&fit=crop",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        },
        {
            id: 2,
            name: "Premium Rice",
            price: 55.0,
            category: "Grains",
            description: "High-quality jasmine rice from local farms",
            stock: 100,
            image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=300&fit=crop",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        },
        {
            id: 3,
            name: "Sweet Mangoes",
            price: 80.0,
            category: "Fruits",
            description: "Sweet and juicy mangoes, perfectly ripe",
            stock: 25,
            image: "https://images.unsplash.com/photo-1605027990121-cbae9d0541ba?w=400&h=300&fit=crop",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        },
    ]);
    const [loading, setLoading] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [deliveryCost, setDeliveryCost] = useState(50); // Default delivery cost for farmer
    const [originalDeliveryCost, setOriginalDeliveryCost] = useState(50); // Track original value
    const [productForm, setProductForm] = useState({
        name: "",
        price: "",
        category: "Vegetables",
        description: "",
        stock: "",
        image: null,
        imagePreview: "",
        cropType: "",
        minimumQuantity: "1.0", // Minimum quantity for home delivery
    });
    const [cropTypeSearch, setCropTypeSearch] = useState("");
    const [showCropDropdown, setShowCropDropdown] = useState(false);

    // Available crop types from crop recommendation
    const availableCrops = [
        "Sweet Potato",
        "Lettuce",
        "Herbs (Basil, Cilantro)",
        "Bell Peppers",
        "Cabbage",
        "Tomatoes",
        "Carrots",
        "Rice",
    ];

    const filteredCrops = availableCrops.filter((crop) =>
        crop.toLowerCase().includes(cropTypeSearch.toLowerCase())
    );

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

    const handleAddProduct = useCallback(async () => {
        if (
            !productForm.name ||
            !productForm.price ||
            !productForm.stock ||
            !productForm.cropType ||
            !productForm.minimumQuantity
        )
            return;

        // Validate crop type exists in available crops
        if (!availableCrops.includes(productForm.cropType)) {
            alert("Please select a valid crop type from the list");
            return;
        }

        try {
            // For demo purposes, we'll add to local state instead of Supabase
            const newProduct = {
                id: Date.now(), // Simple ID generation for demo
                name: productForm.name,
                price: parseFloat(productForm.price),
                category: productForm.category,
                description: productForm.description,
                stock: parseFloat(productForm.stock) || 0,
                image:
                    productForm.imagePreview ||
                    "https://via.placeholder.com/300x200?text=No+Image",
                cropType: productForm.cropType,
                minimumQuantity: parseFloat(productForm.minimumQuantity) || 1.0,
                deliveryCost: deliveryCost,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };

            setProducts((prev) => [newProduct, ...prev]);
            setShowAddModal(false);
            resetForm();

            // If you want to use Supabase, uncomment the code below:
            /*
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
            */
        } catch (error) {
            console.error("Unexpected error:", error);
        }
    }, [productForm, availableCrops, deliveryCost]);

    const handleEditProduct = useCallback(async () => {
        if (
            !selectedProduct ||
            !productForm.name ||
            !productForm.price ||
            !productForm.stock ||
            !productForm.minimumQuantity
        )
            return;

        try {
            // For demo purposes, we'll update local state instead of Supabase
            const updatedProduct = {
                ...selectedProduct,
                name: productForm.name,
                price: parseFloat(productForm.price),
                category: productForm.category,
                description: productForm.description,
                stock: parseFloat(productForm.stock) || 0,
                image: productForm.imagePreview || selectedProduct.image,
                minimumQuantity: parseFloat(productForm.minimumQuantity) || 1.0,
                deliveryCost: deliveryCost,
                updated_at: new Date().toISOString(),
            };

            setProducts((prev) =>
                prev.map((p) =>
                    p.id === selectedProduct.id ? updatedProduct : p
                )
            );
            setShowEditModal(false);
            resetForm();

            // If you want to use Supabase, uncomment the code below:
            /*
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
            */
        } catch (error) {
            console.error("Unexpected error:", error);
        }
    }, [selectedProduct, productForm, deliveryCost]);

    const handleDeleteProduct = async () => {
        if (!selectedProduct) return;

        try {
            // For demo purposes, we'll remove from local state instead of Supabase
            setProducts((prev) =>
                prev.filter((p) => p.id !== selectedProduct.id)
            );
            setShowDeleteModal(false);
            setSelectedProduct(null);

            // If you want to use Supabase, uncomment the code below:
            /*
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
            */
        } catch (error) {
            console.error("Unexpected error:", error);
        }
    };

    const resetForm = useCallback(() => {
        setProductForm({
            name: "",
            price: "",
            category: "Vegetables",
            description: "",
            stock: "",
            image: null,
            imagePreview: "",
            cropType: "",
            minimumQuantity: "1.0",
        });
        setCropTypeSearch("");
        setShowCropDropdown(false);
        setSelectedProduct(null);
    }, []);

    // Memoized input handlers to prevent modal refresh
    const handleInputChange = useCallback((field, value) => {
        setProductForm((prev) => ({ ...prev, [field]: value }));
    }, []);

    const handleImageUpload = useCallback((e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith("image/")) {
            setProductForm((prev) => ({
                ...prev,
                image: file,
                imagePreview: URL.createObjectURL(file),
            }));
        }
    }, []);

    const handleCropTypeSelect = useCallback((cropType) => {
        setProductForm((prev) => ({
            ...prev,
            cropType: cropType,
        }));
        setCropTypeSearch(cropType);
        setShowCropDropdown(false);
    }, []);

    const handleCropTypeSearch = useCallback((value) => {
        setCropTypeSearch(value);
        setShowCropDropdown(true);
        setProductForm((prev) => ({
            ...prev,
            cropType: value,
        }));
    }, []);

    const openEditModal = useCallback((product) => {
        setSelectedProduct(product);
        setProductForm({
            name: product.name,
            price: product.price.toString(),
            category: product.category,
            description: product.description || "",
            stock: product.stock?.toString() || "",
            image: null,
            imagePreview: product.image || "",
            cropType: product.cropType || "",
            minimumQuantity: product.minimumQuantity?.toString() || "1.0",
        });
        setCropTypeSearch(product.cropType || "");
        setShowEditModal(true);
    }, []);

    const openDeleteModal = useCallback((product) => {
        setSelectedProduct(product);
        setShowDeleteModal(true);
    }, []);

    // Stable modal handlers
    const handleCloseAddModal = useCallback(() => {
        setShowAddModal(false);
        resetForm();
    }, [resetForm]);

    const handleCloseEditModal = useCallback(() => {
        setShowEditModal(false);
        resetForm();
    }, [resetForm]);

    return (
        <div className="min-h-screen w-full flex flex-col relative items-center scrollbar-hide bg-background overflow-x-hidden text-text pb-20">
            {/* Modals */}
            <ProductModal
                isOpen={showAddModal}
                isEdit={false}
                onClose={handleCloseAddModal}
                productForm={productForm}
                onInputChange={handleInputChange}
                onImageUpload={handleImageUpload}
                cropTypeSearch={cropTypeSearch}
                onCropTypeSearch={handleCropTypeSearch}
                showCropDropdown={showCropDropdown}
                setShowCropDropdown={setShowCropDropdown}
                filteredCrops={filteredCrops}
                onCropTypeSelect={handleCropTypeSelect}
                onSubmit={handleAddProduct}
                categories={categories}
            />
            <ProductModal
                isOpen={showEditModal}
                isEdit={true}
                onClose={handleCloseEditModal}
                productForm={productForm}
                onInputChange={handleInputChange}
                onImageUpload={handleImageUpload}
                cropTypeSearch={cropTypeSearch}
                onCropTypeSearch={handleCropTypeSearch}
                showCropDropdown={showCropDropdown}
                setShowCropDropdown={setShowCropDropdown}
                filteredCrops={filteredCrops}
                onCropTypeSelect={handleCropTypeSelect}
                onSubmit={handleEditProduct}
                categories={categories}
            />
            <ConfirmModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDeleteProduct}
                title="Delete Product"
                message={`Are you sure you want to delete "${selectedProduct?.name}"? This action cannot be undone.`}
                confirmText="Delete"
                confirmButtonClass="bg-red-600 hover:bg-red-700"
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
                {/* Delivery Settings */}
                <div className="mb-6 mt-4">
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Icon
                                    icon="mingcute:truck-line"
                                    width="24"
                                    height="24"
                                    className="text-primary"
                                />
                                <h3 className="text-lg font-semibold text-gray-800">
                                    Delivery Settings
                                </h3>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Delivery Cost
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                                        ₱
                                    </span>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={deliveryCost}
                                        onChange={(e) =>
                                            setDeliveryCost(
                                                parseFloat(e.target.value) || 0
                                            )
                                        }
                                        className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                                        placeholder="50.00"
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    This applies once per order from your farm
                                </p>
                            </div>
                            <div className="flex items-center">
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                    <div className="flex items-center gap-2 text-blue-700">
                                        <Icon
                                            icon="mingcute:information-line"
                                            width="16"
                                            height="16"
                                        />
                                        <span className="text-sm font-medium">
                                            How it works
                                        </span>
                                    </div>
                                    <p className="text-xs text-blue-600 mt-1">
                                        If a customer orders from multiple
                                        farmers, each farmer's delivery cost
                                        will be added separately.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Action buttons - only show when there are changes */}
                        {deliveryCost !== originalDeliveryCost && (
                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                                <button
                                    onClick={() =>
                                        setDeliveryCost(originalDeliveryCost)
                                    }
                                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        // Here you would typically save to database
                                        console.log(
                                            "Delivery cost saved:",
                                            deliveryCost
                                        );
                                        setOriginalDeliveryCost(deliveryCost); // Update original value after saving
                                        alert(
                                            "Delivery settings saved successfully!"
                                        );
                                    }}
                                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                                >
                                    Save Settings
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Search Bar */}
                <div className="mb-6">
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
                            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
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
                <div className="mb-4 px-2 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">
                            {selectedCategory} Products
                        </h2>
                        <p className="text-gray-600 text-sm">
                            {filteredProducts.length} products found
                        </p>
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-2"
                    >
                        <Icon icon="mingcute:add-line" width="20" height="20" />
                        Add Product
                    </button>
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
                                    className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden relative group"
                                >
                                    <Link
                                        to={`/producer/product/${product.id}`}
                                        className="block"
                                    >
                                        <div className="relative">
                                            <img
                                                src={product.image}
                                                alt={product.name}
                                                className="w-full h-40 sm:h-48 object-cover"
                                                loading="lazy"
                                            />
                                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200"></div>
                                        </div>

                                        <div className="p-3">
                                            <h3 className="font-semibold text-gray-800 line-clamp-2 mb-1 text-sm">
                                                {product.name}
                                            </h3>

                                            <div className="flex items-center justify-between mb-2">
                                                <p className="text-primary font-bold text-lg">
                                                    ₱{product.price?.toFixed(2)}
                                                    /kg
                                                </p>
                                                <span className="text-xs text-gray-500">
                                                    {product.stock || 0} kg left
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
                                    </Link>

                                    {/* Action buttons overlay */}
                                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                openEditModal(product);
                                            }}
                                            className="bg-white rounded-full p-2 shadow-md hover:bg-gray-50 z-10"
                                        >
                                            <Icon
                                                icon="mingcute:edit-line"
                                                width="16"
                                                height="16"
                                                className="text-blue-600"
                                            />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                openDeleteModal(product);
                                            }}
                                            className="bg-white rounded-full p-2 shadow-md hover:bg-gray-50 z-10"
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
