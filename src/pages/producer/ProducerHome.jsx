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
import ImageUpload from "../../components/ImageUpload";
import { deleteImageFromUrl, uploadImage } from "../../utils/imageUpload";
import supabase from "../../SupabaseClient.jsx";

// Memoized ProductModal component to prevent unnecessary re-renders
const ProductModal = memo(
    ({
        isEdit = false,
        isOpen,
        onClose,
        productForm,
        onInputChange,
        cropTypeSearch,
        onCropTypeSearch,
        showCropDropdown,
        setShowCropDropdown,
        filteredCrops,
        onCropTypeSelect,
        onSubmit,
        categories,
        isSubmitting = false,
        selectedProduct = null,
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

                            {isEdit && selectedProduct?.rejection_reason && (
                                <div
                                    className={
                                        selectedProduct.status_id === 2
                                            ? "mb-6 bg-red-50 border border-red-200 rounded-lg p-4"
                                            : "mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4"
                                    }
                                >
                                    <div
                                        className={
                                            selectedProduct.status_id === 2
                                                ? "flex items-start gap-3"
                                                : "flex items-start gap-3"
                                        }
                                    >
                                        <Icon
                                            icon="mingcute:warning-line"
                                            className={
                                                selectedProduct.status_id === 2
                                                    ? "text-red-500 w-5 h-5 mt-0.5 flex-shrink-0"
                                                    : "text-amber-500 w-5 h-5 mt-0.5 flex-shrink-0"
                                            }
                                        />
                                        <div>
                                            <h4
                                                className={
                                                    selectedProduct.status_id ===
                                                    2
                                                        ? "text-sm font-semibold text-red-800 mb-1"
                                                        : "text-sm font-semibold text-amber-800 mb-1"
                                                }
                                            >
                                                {selectedProduct.status_id === 2
                                                    ? "Product Suspended"
                                                    : "Product Rejected"}
                                            </h4>
                                            <p
                                                className={
                                                    selectedProduct.status_id ===
                                                    2
                                                        ? "text-sm text-red-700"
                                                        : "text-sm text-amber-700"
                                                }
                                            >
                                                {
                                                    selectedProduct.rejection_reason
                                                }
                                            </p>
                                            <p
                                                className={
                                                    selectedProduct.status_id ===
                                                    2
                                                        ? "text-xs text-red-600 mt-2"
                                                        : "text-xs text-amber-600 mt-2"
                                                }
                                            >
                                                Update your product details to
                                                address this issue. The product
                                                will be automatically
                                                resubmitted for review.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Image Section - Top, Full Width */}
                            <div className="mb-6">
                                <div className="relative group">
                                    {productForm.imagePreview ||
                                    productForm.image_url ? (
                                        <div className="relative">
                                            <img
                                                src={
                                                    productForm.imagePreview ||
                                                    productForm.image_url
                                                }
                                                alt="Product preview"
                                                className="w-full h-64 object-cover rounded-lg bg-gray-100"
                                            />
                                            {/* Camera Icon - Bottom Right */}
                                            <div className="absolute bottom-3 right-3 flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        onInputChange(
                                                            "imageFile",
                                                            null
                                                        );
                                                        onInputChange(
                                                            "imagePreview",
                                                            ""
                                                        );
                                                        if (isEdit) {
                                                            onInputChange(
                                                                "image_url",
                                                                ""
                                                            );
                                                        }
                                                    }}
                                                    className="bg-red-500 hover:bg-red-600 text-white rounded-full p-2 shadow-lg transition-colors"
                                                >
                                                    <Icon
                                                        icon="mingcute:delete-line"
                                                        width="18"
                                                        height="18"
                                                    />
                                                </button>
                                                <label className="bg-primary hover:bg-primary-dark text-white rounded-full p-2 shadow-lg transition-colors cursor-pointer">
                                                    <Icon
                                                        icon="mingcute:camera-line"
                                                        width="18"
                                                        height="18"
                                                    />
                                                    <input
                                                        type="file"
                                                        className="hidden"
                                                        accept="image/*"
                                                        onChange={(e) => {
                                                            const file =
                                                                e.target
                                                                    .files[0];
                                                            if (file) {
                                                                // Validate file type
                                                                const allowedTypes =
                                                                    [
                                                                        "image/jpeg",
                                                                        "image/jpg",
                                                                        "image/png",
                                                                        "image/webp",
                                                                    ];
                                                                if (
                                                                    !allowedTypes.includes(
                                                                        file.type
                                                                    )
                                                                ) {
                                                                    alert(
                                                                        "Invalid file type. Please select a JPEG, PNG, or WebP image."
                                                                    );
                                                                    return;
                                                                }

                                                                // Validate file size (5MB)
                                                                if (
                                                                    file.size >
                                                                    5 *
                                                                        1024 *
                                                                        1024
                                                                ) {
                                                                    alert(
                                                                        "File size too large. Maximum size is 5MB."
                                                                    );
                                                                    return;
                                                                }

                                                                // Create preview
                                                                const reader =
                                                                    new FileReader();
                                                                reader.onload =
                                                                    (e) => {
                                                                        onInputChange(
                                                                            "imagePreview",
                                                                            e
                                                                                .target
                                                                                .result
                                                                        );
                                                                    };
                                                                reader.readAsDataURL(
                                                                    file
                                                                );
                                                                onInputChange(
                                                                    "imageFile",
                                                                    file
                                                                );
                                                            }
                                                        }}
                                                    />
                                                </label>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="relative bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg h-64 hover:border-primary hover:bg-gray-50 transition-colors cursor-pointer">
                                            <label className="absolute inset-0 flex items-center justify-center cursor-pointer">
                                                <div className="text-center">
                                                    <div className="mx-auto w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                                                        <Icon
                                                            icon="mingcute:camera-line"
                                                            width="24"
                                                            height="24"
                                                            className="text-primary"
                                                        />
                                                    </div>
                                                    <p className="text-gray-700 font-medium mb-1">
                                                        Add Product Image
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        Click anywhere to select
                                                        an image
                                                    </p>
                                                </div>
                                                <input
                                                    type="file"
                                                    className="hidden"
                                                    accept="image/*"
                                                    onChange={(e) => {
                                                        const file =
                                                            e.target.files[0];
                                                        if (file) {
                                                            // Validate file type
                                                            const allowedTypes =
                                                                [
                                                                    "image/jpeg",
                                                                    "image/jpg",
                                                                    "image/png",
                                                                    "image/webp",
                                                                ];
                                                            if (
                                                                !allowedTypes.includes(
                                                                    file.type
                                                                )
                                                            ) {
                                                                alert(
                                                                    "Invalid file type. Please select a JPEG, PNG, or WebP image."
                                                                );
                                                                return;
                                                            }

                                                            // Validate file size (5MB)
                                                            if (
                                                                file.size >
                                                                5 * 1024 * 1024
                                                            ) {
                                                                alert(
                                                                    "File size too large. Maximum size is 5MB."
                                                                );
                                                                return;
                                                            }

                                                            // Create preview
                                                            const reader =
                                                                new FileReader();
                                                            reader.onload = (
                                                                e
                                                            ) => {
                                                                onInputChange(
                                                                    "imagePreview",
                                                                    e.target
                                                                        .result
                                                                );
                                                            };
                                                            reader.readAsDataURL(
                                                                file
                                                            );
                                                            onInputChange(
                                                                "imageFile",
                                                                file
                                                            );
                                                        }
                                                    }}
                                                />
                                            </label>
                                        </div>
                                    )}
                                </div>
                                <div className="mt-2 text-center">
                                    <p className="text-xs text-gray-500">
                                        {productForm.imageFile
                                            ? "New image selected • PNG, JPG, or WebP (Max 5MB)"
                                            : productForm.image_url
                                            ? "Current product image"
                                            : "PNG, JPG, or WebP (Max 5MB)"}
                                    </p>
                                </div>
                            </div>

                            {/* Product Information */}
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
                                            {categories.length > 1 &&
                                                categories
                                                    .slice(1)
                                                    .map((cat) => (
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
                                    disabled={isSubmitting}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={onSubmit}
                                    disabled={
                                        !productForm.name ||
                                        !productForm.price ||
                                        !productForm.stock ||
                                        !productForm.category ||
                                        isSubmitting ||
                                        (isEdit && // Only check for changes in edit mode
                                            productForm.name ===
                                                selectedProduct?.name &&
                                            productForm.price ===
                                                selectedProduct?.price.toString() &&
                                            productForm.stock ===
                                                selectedProduct?.stock.toString() &&
                                            productForm.category ===
                                                selectedProduct?.category &&
                                            productForm.description ===
                                                (selectedProduct?.description ||
                                                    "") &&
                                            productForm.cropType ===
                                                selectedProduct?.cropType &&
                                            !productForm.imageFile &&
                                            productForm.image_url ===
                                                selectedProduct?.image_url)
                                    }
                                    className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            {isEdit
                                                ? "Updating..."
                                                : "Adding..."}
                                        </>
                                    ) : (
                                        <>{isEdit ? "Update" : "Add"} Product</>
                                    )}
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
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deliveryCost, setDeliveryCost] = useState(50); // Default delivery cost for farmer
    const [originalDeliveryCost, setOriginalDeliveryCost] = useState(50); // Track original value
    const [minimumOrderQuantity, setMinimumOrderQuantity] = useState(2.0); // Default minimum order quantity
    const [originalMinimumOrderQuantity, setOriginalMinimumOrderQuantity] =
        useState(2.0); // Track original value
    const [isDeliverySettingsExpanded, setIsDeliverySettingsExpanded] =
        useState(false);
    const [isHowItWorksExpanded, setIsHowItWorksExpanded] = useState(false);
    const [categories, setCategories] = useState([]);
    const [productForm, setProductForm] = useState({
        name: "",
        price: "",
        category: "Vegetables",
        description: "",
        stock: "",
        image_url: "",
        imageFile: null,
        imagePreview: "",
        cropType: "",
        user_id: user?.id || "",
    });
    const [cropTypeSearch, setCropTypeSearch] = useState("");
    const [showCropDropdown, setShowCropDropdown] = useState(false);
    const [allCrops, setAllCrops] = useState([]);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const { data, error } = await supabase
                    .from("categories")
                    .select("name, icon")
                    .order("name", { ascending: true });

                if (error) {
                    console.error("Error fetching categories:", error);
                } else {
                    const allCategory = {
                        name: "All",
                        icon: "mdi:apps-box",
                    };
                    const fetchedCategories = data.map((cat) => ({
                        name: cat.name,
                        icon: cat.icon || "mingcute:leaf-line", // Default icon
                    }));
                    setCategories([allCategory, ...fetchedCategories]);
                }
            } catch (error) {
                console.error("Unexpected error fetching categories:", error);
            }
        };

        fetchCategories();
    }, []);

    useEffect(() => {
        const fetchAllCrops = async () => {
            const { data, error } = await supabase
                .from("crops")
                .select("id, name");
            if (error) {
                console.error("Error fetching crops:", error);
            } else {
                setAllCrops(data);
            }
        };
        fetchAllCrops();
    }, []);

    const availableCrops = useMemo(
        () => allCrops.map((c) => c.name),
        [allCrops]
    );

    const filteredCrops = availableCrops.filter((crop) =>
        crop.toLowerCase().includes((cropTypeSearch || "").toLowerCase())
    );

    // Fetch user's products
    useEffect(() => {
        fetchProducts();
    }, [user]);

    // Load farmer's delivery settings
    useEffect(() => {
        const loadDeliverySettings = async () => {
            if (!user?.id) return;

            try {
                const { data, error } = await supabase
                    .from("profiles")
                    .select("delivery_cost, minimum_order_quantity")
                    .eq("id", user.id)
                    .single();

                if (error) {
                    console.error("Error loading delivery settings:", error);
                } else if (data) {
                    const deliveryCostValue =
                        parseFloat(data.delivery_cost) || 50;
                    const minOrderValue =
                        parseFloat(data.minimum_order_quantity) || 2.0;

                    setDeliveryCost(deliveryCostValue);
                    setOriginalDeliveryCost(deliveryCostValue);
                    setMinimumOrderQuantity(minOrderValue);
                    setOriginalMinimumOrderQuantity(minOrderValue);
                }
            } catch (error) {
                console.error(
                    "Unexpected error loading delivery settings:",
                    error
                );
            }
        };

        loadDeliverySettings();
    }, [user?.id]);

    // Update productForm with user ID when user loads
    useEffect(() => {
        if (user?.id) {
            setProductForm((prev) => ({
                ...prev,
                user_id: user.id,
            }));
        }
    }, [user?.id]);

    const fetchProducts = async () => {
        if (!user) return;

        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("products")
                .select(
                    `
                    id,
                    name,
                    price,
                    description,
                    stock,
                    image_url,
                    status_id,
                    approval_date,
                    rejection_reason,
                    created_at,
                    updated_at,
                    categories!inner (
                        id,
                        name
                    ),
                    crops!inner (
                        id,
                        name
                    ),
                    statuses!inner (
                        name
                    )
                `
                )
                .eq("user_id", user.id)
                .order("created_at", { ascending: false });

            if (error) {
                console.error("Error fetching products:", error);
            } else {
                const formattedProducts = data.map((product) => ({
                    id: product.id,
                    name: product.name,
                    price: parseFloat(product.price),
                    category: product.categories?.name || "Other",
                    description: product.description,
                    stock: parseFloat(product.stock),
                    image:
                        product.image_url ||
                        "https://via.placeholder.com/300x200?text=No+Image",
                    image_url: product.image_url,
                    cropId: product.crops?.id,
                    cropType: product.crops?.name,
                    status_id: product.status_id,
                    approval_date: product.approval_date,
                    rejection_reason: product.rejection_reason,
                    created_at: product.created_at,
                    updated_at: product.updated_at,
                }));
                console.log(
                    "Formatted products with images:",
                    formattedProducts.map((p) => ({
                        name: p.name,
                        image: p.image,
                        image_url_raw: data.find((d) => d.id === p.id)
                            ?.image_url,
                    }))
                );
                setProducts(formattedProducts);
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
            !productForm.cropType
        )
            return;

        // Validate crop type exists in available crops
        if (!allCrops.map((c) => c.name).includes(productForm.cropType)) {
            alert("Please select a valid crop type from the list");
            return;
        }

        setIsSubmitting(true);

        try {
            // Get category_id if category is selected
            let category_id = null;
            if (productForm.category && productForm.category !== "All") {
                const { data: categoryData } = await supabase
                    .from("categories")
                    .select("id")
                    .eq("name", productForm.category)
                    .single();
                category_id = categoryData?.id;
            }

            // Get crop_id - it's required by the schema
            const selectedCrop = allCrops.find(
                (c) => c.name === productForm.cropType
            );
            if (!selectedCrop) {
                alert("Please select a valid crop type");
                setIsSubmitting(false);
                return;
            }
            const crop_id = selectedCrop.id;

            // Upload image if provided
            let image_url = null;
            if (productForm.imageFile) {
                const uploadResult = await uploadImage(
                    productForm.imageFile,
                    "products",
                    user.id
                );
                if (uploadResult.success) {
                    image_url = uploadResult.url;
                } else {
                    alert(`Image upload failed: ${uploadResult.error}`);
                    return;
                }
            }

            const { data, error } = await supabase
                .from("products")
                .insert({
                    user_id: user.id,
                    name: productForm.name,
                    price: parseFloat(productForm.price),
                    category_id: category_id,
                    crop_id: crop_id,
                    description: productForm.description,
                    stock: parseFloat(productForm.stock),
                    image_url: image_url,
                })
                .select(
                    `
                    id,
                    name,
                    price,
                    description,
                    stock,
                    image_url,
                    status_id,
                    created_at,
                    updated_at,
                    categories (
                        id,
                        name
                    ),
                    crops (
                        id,
                        name
                    )`
                )
                .single();

            if (error) {
                console.error("Error adding product:", error);
                alert("Error adding product. Please try again.");
            } else {
                const formattedProduct = {
                    id: data.id,
                    name: data.name,
                    price: parseFloat(data.price),
                    category: data.categories?.name || "Other",
                    description: data.description,
                    stock: parseFloat(data.stock),
                    image:
                        data.image_url ||
                        "https://via.placeholder.com/300x200?text=No+Image",
                    image_url: data.image_url,
                    cropId: data.crops?.id,
                    cropType: data.crops?.name,

                    // 👇 Force frontend to show Pending Approval
                    status_id: null, // ignore whatever backend returns
                    approval_date: null, // ensures label logic shows Pending Approval

                    created_at: data.created_at,
                    updated_at: data.updated_at,
                };

                setProducts((prev) => [formattedProduct, ...prev]);
                setShowAddModal(false);
                resetForm();
            }
        } catch (error) {
            console.error("Unexpected error:", error);
            alert("Unexpected error occurred. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    }, [productForm, availableCrops, deliveryCost, user, allCrops]);

    const handleEditProduct = useCallback(async () => {
        if (
            !selectedProduct ||
            !productForm.name ||
            !productForm.price ||
            !productForm.stock
        )
            return;

        const hasNonPriceStockChanges =
            productForm.name !== selectedProduct.name ||
            productForm.category !== selectedProduct.category ||
            productForm.description !== selectedProduct.description ||
            productForm.cropType !== selectedProduct.cropType ||
            productForm.imageFile !== null ||
            (!productForm.image_url && selectedProduct.image_url) ||
            (productForm.image_url && !selectedProduct.image_url);

        const hasPriceStockChanges =
            productForm.price !== selectedProduct.price.toString() ||
            productForm.stock !== selectedProduct.stock.toString();

        if (!hasNonPriceStockChanges && !hasPriceStockChanges) {
            return;
        }

        setIsSubmitting(true);

        try {
            let category_id = null;
            if (productForm.category && productForm.category !== "All") {
                const { data: categoryData } = await supabase
                    .from("categories")
                    .select("id")
                    .eq("name", productForm.category)
                    .single();
                category_id = categoryData?.id;
            }

            const selectedCrop = allCrops.find(
                (c) => c.name === productForm.cropType
            );
            if (!selectedCrop) {
                alert("Please select a valid crop type");
                setIsSubmitting(false);
                return;
            }
            const crop_id = selectedCrop.id;

            let image_url = selectedProduct.image_url;

            const userDeletedImage =
                !productForm.imagePreview && !productForm.image_url;

            if (userDeletedImage && selectedProduct.image_url) {
                await deleteImageFromUrl(selectedProduct.image_url, "products");
                image_url = null;
            } else if (productForm.imageFile) {
                const uploadResult = await uploadImage(
                    productForm.imageFile,
                    "products",
                    user.id,
                    selectedProduct.image_url
                );
                if (uploadResult.success) {
                    image_url = uploadResult.url;
                } else {
                    alert(`Image upload failed: ${uploadResult.error}`);
                    return;
                }
            }

            const { data, error } = await supabase
                .from("products")
                .update({
                    name: productForm.name,
                    price: parseFloat(productForm.price),
                    category_id,
                    crop_id,
                    description: productForm.description,
                    stock: parseFloat(productForm.stock),
                    image_url,
                    status_id: 1, // ✅ Always set to Active after edit
                    rejection_reason: null, // Clear rejection reason on update
                    ...(hasNonPriceStockChanges && selectedProduct.approval_date
                        ? { approval_date: null }
                        : {}),
                })
                .eq("id", selectedProduct.id)
                .select(
                    `
                *,
                categories(name),
                crops(name)
            `
                )
                .single();

            if (error) {
                console.error("Error updating product:", error);
                alert("Error updating product. Please try again.");
            } else {
                const updatedProduct = {
                    id: data.id,
                    name: data.name,
                    price: parseFloat(data.price),
                    category: data.categories?.name || productForm.category,
                    description: data.description,
                    stock: parseFloat(data.stock),
                    image: data.image_url || "/assets/gray-apple.png",
                    image_url: data.image_url,
                    cropType: data.crops?.name || productForm.cropType,
                    status_id: 1, // ✅ force Active in UI
                    approval_date: hasNonPriceStockChanges
                        ? null
                        : selectedProduct.approval_date,
                    created_at: data.created_at,
                    updated_at: data.updated_at,
                };

                // ✅ Instantly update UI (buttery smooth)
                setProducts((prev) =>
                    prev.map((p) =>
                        p.id === selectedProduct.id ? updatedProduct : p
                    )
                );

                // 🚫 Remove any suspension record since product was successfully updated
                const { error: suspendedDeleteError } = await supabase
                    .from("suspended_products")
                    .delete()
                    .eq("product_id", selectedProduct.id);

                if (suspendedDeleteError) {
                    console.error(
                        "Error removing product from suspended_products:",
                        suspendedDeleteError
                    );
                }

                setShowEditModal(false);
                resetForm();
            }
        } catch (error) {
            console.error("Unexpected error:", error);
            alert("Unexpected error occurred. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    }, [selectedProduct, productForm, deliveryCost, user, allCrops]);

    const handleDeleteProduct = async () => {
        if (!selectedProduct) return;

        setIsSubmitting(true); // optional — prevents double-click UI
        try {
            // Attempt to delete the product row and return the deleted row (id + image_url)
            const { data, error } = await supabase
                .from("products")
                .delete()
                .eq("id", selectedProduct.id)
                .select("id, image_url")
                .single();

            if (error) {
                console.error("Error deleting product:", error);

                // Friendly, actionable messages for common cases
                if (error.code === "21000") {
                    // scalar subquery returned multiple rows -> likely malformed RLS policy
                    alert(
                        "Delete failed due to a server policy error (RLS). Please check the product deletion policy in the database (subquery returned multiple rows)."
                    );
                } else if (error.status === 401 || error.status === 403) {
                    alert(
                        "You are not allowed to delete this product (permission denied)."
                    );
                } else {
                    alert("Error deleting product. Please try again.");
                }

                return;
            }

            // If DB deletion succeeded, `data` will contain the deleted row (id, image_url)
            // Now delete the image from storage (best-effort). If it fails, log but keep UX consistent.
            const imageUrl = data?.image_url;
            if (
                imageUrl &&
                !imageUrl.includes("placeholder") &&
                !imageUrl.includes("gray-apple.png")
            ) {
                try {
                    await deleteImageFromUrl(imageUrl, "products");
                } catch (imgErr) {
                    console.error(
                        "Error deleting image from storage after DB delete:",
                        imgErr
                    );
                    // we don't block the UI for this; image cleanup can be retried later
                }
            }

            // Update UI immediately
            setProducts((prev) =>
                prev.filter((p) => p.id !== selectedProduct.id)
            );
            setShowDeleteModal(false);
            setSelectedProduct(null);
        } catch (err) {
            console.error("Unexpected error deleting product:", err);
            alert("Unexpected error occurred. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = useCallback(() => {
        setProductForm({
            name: "",
            price: "",
            category: categories.length > 1 ? categories[1].name : "",
            description: "",
            stock: "",
            image_url: "",
            imageFile: null,
            imagePreview: "",
            cropType: "",
            user_id: user?.id || "",
        });
        setCropTypeSearch("");
        setShowCropDropdown(false);
        setSelectedProduct(null);
    }, [user, categories]);

    // Memoized input handlers to prevent modal refresh
    const handleInputChange = useCallback((field, value) => {
        setProductForm((prev) => ({ ...prev, [field]: value }));
    }, []);

    const handleCropTypeSelect = useCallback((cropType) => {
        setProductForm((prev) => ({
            ...prev,
            cropType: typeof cropType === "string" ? cropType : "",
        }));
        setCropTypeSearch(typeof cropType === "string" ? cropType : "");
        setShowCropDropdown(false);
    }, []);

    const handleCropTypeSearch = useCallback((value) => {
        setCropTypeSearch(typeof value === "string" ? value : "");
        setShowCropDropdown(true);
        setProductForm((prev) => ({
            ...prev,
            cropType: typeof value === "string" ? value : "",
        }));
    }, []);

    const openEditModal = useCallback(
        (product) => {
            setSelectedProduct({
                ...product,
                rejection_reason: product.rejection_reason,
                status: product.status_id,
            });
            const productCropName = product.cropType;

            setProductForm({
                name: product.name,
                price: product.price.toString(),
                category: product.category,
                description: product.description || "",
                stock: product.stock?.toString() || "",
                image_url: product.image_url || "",
                imageFile: null,
                imagePreview: "",
                cropType: productCropName || "",
                user_id: user?.id || "",
            });

            // Set the crop search field to show the current crop name
            setCropTypeSearch(productCropName || "");
            setShowEditModal(true);
        },
        [user]
    );

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
                cropTypeSearch={cropTypeSearch}
                onCropTypeSearch={handleCropTypeSearch}
                showCropDropdown={showCropDropdown}
                setShowCropDropdown={setShowCropDropdown}
                filteredCrops={filteredCrops}
                onCropTypeSelect={handleCropTypeSelect}
                onSubmit={handleAddProduct}
                categories={categories}
                isSubmitting={isSubmitting}
                selectedProduct={null}
            />
            <ProductModal
                isOpen={showEditModal}
                isEdit={true}
                onClose={handleCloseEditModal}
                productForm={productForm}
                onInputChange={handleInputChange}
                cropTypeSearch={cropTypeSearch}
                onCropTypeSearch={handleCropTypeSearch}
                showCropDropdown={showCropDropdown}
                setShowCropDropdown={setShowCropDropdown}
                filteredCrops={filteredCrops}
                onCropTypeSelect={handleCropTypeSelect}
                onSubmit={handleEditProduct}
                categories={categories}
                isSubmitting={isSubmitting}
                selectedProduct={selectedProduct}
            />
            <ConfirmModal
                open={showDeleteModal}
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
                {/* <button
                    onClick={() => setShowAddModal(true)}
                    className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-2"
                >
                    <Icon icon="mingcute:add-line" width="20" height="20" />
                    Add Product
                </button> */}
            </div>

            <div className="w-full max-w-6xl mx-4 sm:mx-auto my-16">
                {/* Delivery Settings */}
                <div className="mb-6 mt-4">
                    <div className="bg-white rounded-lg shadow-md">
                        {/* Header - Always visible */}
                        <div
                            className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                            onClick={() =>
                                setIsDeliverySettingsExpanded(
                                    !isDeliverySettingsExpanded
                                )
                            }
                        >
                            <div className="flex items-center justify-between">
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
                                <Icon
                                    icon={
                                        isDeliverySettingsExpanded
                                            ? "mingcute:up-line"
                                            : "mingcute:down-line"
                                    }
                                    width="20"
                                    height="20"
                                    className="text-gray-500 transition-transform"
                                />
                            </div>
                        </div>

                        {/* Expandable Content */}
                        {isDeliverySettingsExpanded && (
                            <div className="px-6 pb-6 pt-0">
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
                                                        parseFloat(
                                                            e.target.value
                                                        ) || 0
                                                    )
                                                }
                                                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                                                placeholder="50.00"
                                            />
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">
                                            This applies once per order from
                                            your farm
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Minimum Order Quantity (kg)
                                        </label>
                                        <input
                                            type="number"
                                            min="0.1"
                                            step="0.1"
                                            value={minimumOrderQuantity}
                                            onChange={(e) =>
                                                setMinimumOrderQuantity(
                                                    parseFloat(
                                                        e.target.value
                                                    ) || 1.0
                                                )
                                            }
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                                            placeholder="2.0"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            Total quantity required for home
                                            delivery
                                        </p>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg">
                                        {/* How it works header */}
                                        <div
                                            className="p-3 cursor-pointer hover:bg-blue-100 transition-colors"
                                            onClick={() =>
                                                setIsHowItWorksExpanded(
                                                    !isHowItWorksExpanded
                                                )
                                            }
                                        >
                                            <div className="flex items-center justify-between">
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
                                                <Icon
                                                    icon={
                                                        isHowItWorksExpanded
                                                            ? "mingcute:up-line"
                                                            : "mingcute:down-line"
                                                    }
                                                    width="16"
                                                    height="16"
                                                    className="text-blue-700 transition-transform"
                                                />
                                            </div>
                                        </div>

                                        {/* How it works content */}
                                        {isHowItWorksExpanded && (
                                            <div className="px-3 pb-3">
                                                <div className="text-xs text-blue-600 space-y-1">
                                                    <p>
                                                        • Delivery cost is
                                                        charged once per order
                                                        from your farm
                                                    </p>
                                                    <p>
                                                        • Customers must order
                                                        at least{" "}
                                                        {minimumOrderQuantity}kg
                                                        total from your farm for
                                                        delivery
                                                    </p>
                                                    <p>
                                                        • Multiple products can
                                                        be combined to meet the
                                                        minimum quantity
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Action buttons - only show when there are changes */}
                                {(deliveryCost !== originalDeliveryCost ||
                                    minimumOrderQuantity !==
                                        originalMinimumOrderQuantity) && (
                                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                                        <button
                                            onClick={() => {
                                                setDeliveryCost(
                                                    originalDeliveryCost
                                                );
                                                setMinimumOrderQuantity(
                                                    originalMinimumOrderQuantity
                                                );
                                            }}
                                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={async () => {
                                                try {
                                                    // Save delivery settings to farmer's profile
                                                    const { error } =
                                                        await supabase
                                                            .from("profiles")
                                                            .update({
                                                                delivery_cost:
                                                                    deliveryCost,
                                                                minimum_order_quantity:
                                                                    minimumOrderQuantity,
                                                            })
                                                            .eq("id", user.id);

                                                    if (error) {
                                                        console.error(
                                                            "Error saving delivery settings:",
                                                            error
                                                        );
                                                        alert(
                                                            "Error saving delivery settings. Please try again."
                                                        );
                                                    } else {
                                                        setOriginalDeliveryCost(
                                                            deliveryCost
                                                        );
                                                        setOriginalMinimumOrderQuantity(
                                                            minimumOrderQuantity
                                                        );
                                                        alert(
                                                            "Delivery settings saved successfully!"
                                                        );
                                                    }
                                                } catch (error) {
                                                    console.error(
                                                        "Unexpected error:",
                                                        error
                                                    );
                                                    alert(
                                                        "An unexpected error occurred. Please try again."
                                                    );
                                                }
                                            }}
                                            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                                        >
                                            Save Settings
                                        </button>
                                    </div>
                                )}
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
                                    {selectedCategory === "All" &&
                                    products.length === 0
                                        ? "Start by adding your first product"
                                        : "Try adjusting your search or filters"}
                                </p>
                                {selectedCategory === "All" &&
                                    products.length === 0 && (
                                        <button
                                            onClick={() =>
                                                setShowAddModal(true)
                                            }
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
                                            <div className="relative">
                                                <img
                                                    src={
                                                        product.image ||
                                                        "/assets/gray-apple.png"
                                                    }
                                                    alt={product.name}
                                                    className="w-full h-40 sm:h-48 object-cover"
                                                    loading="lazy"
                                                    onError={(e) => {
                                                        e.target.src =
                                                            "/assets/gray-apple.png";
                                                    }}
                                                />
                                                {/* Status Label */}
                                                {(() => {
                                                    if (
                                                        product.status_id === 2
                                                    ) {
                                                        // Suspended
                                                        return (
                                                            <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded-lg font-medium">
                                                                Suspended
                                                            </div>
                                                        );
                                                    } else if (
                                                        product.approval_date ===
                                                        null
                                                    ) {
                                                        // New product or modified with non-price/stock changes
                                                        return (
                                                            <div className="absolute top-2 left-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-lg font-medium">
                                                                Pending Approval
                                                            </div>
                                                        );
                                                    } else if (
                                                        new Date(
                                                            product.approval_date
                                                        ).getTime() ===
                                                        new Date(
                                                            "1970-01-01"
                                                        ).getTime()
                                                    ) {
                                                        // Needs editing
                                                        return (
                                                            <div className="absolute top-2 left-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-lg font-medium">
                                                                Needs Editing
                                                            </div>
                                                        );
                                                    } else if (
                                                        product.status_id === 1
                                                    ) {
                                                        // Active
                                                        return (
                                                            <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-lg font-medium">
                                                                Active
                                                            </div>
                                                        );
                                                    }
                                                })()}
                                            </div>
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
