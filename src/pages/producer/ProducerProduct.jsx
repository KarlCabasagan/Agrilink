import { useState, useEffect, useContext } from "react";
import { Icon } from "@iconify/react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../../App.jsx";
import ProducerNavigationBar from "../../components/ProducerNavigationBar";
import ConfirmModal from "../../components/ConfirmModal";
import { deleteImageFromUrl, uploadImage } from "../../utils/imageUpload";
import supabase from "../../SupabaseClient.jsx";

const categories = [
    "Vegetables",
    "Fruits",
    "Grains",
    "Spices",
    "Root and Tuber",
    "Legumes",
];

function ProducerProduct() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [reviewSortBy, setReviewSortBy] = useState("newest");

    // Available crops from recommendation system
    const availableCrops = [
        "Rice",
        "Corn",
        "Tomatoes",
        "Sweet Corn",
        "Lettuce",
        "Cabbage",
        "Carrots",
        "Onions",
        "Potatoes",
        "Bell Peppers",
        "Eggplant",
        "Cucumber",
        "Squash",
        "Okra",
        "Kangkong",
        "Pechay",
        "Radish",
        "Mango",
        "Banana",
        "Papaya",
        "Pineapple",
        "Coconut",
        "Rambutan",
        "Lanzones",
        "Durian",
        "Avocado",
        "Guava",
        "Jackfruit",
        "Citrus",
    ];

    const [cropSearchTerm, setCropSearchTerm] = useState("");
    const [showCropDropdown, setShowCropDropdown] = useState(false);

    // Filter crops based on search term
    const filteredCrops = availableCrops.filter((crop) =>
        crop.toLowerCase().includes((cropSearchTerm || "").toLowerCase())
    );

    const [editForm, setEditForm] = useState({
        name: "",
        price: "",
        category: "Vegetables",
        description: "",
        stock: "",
        image_url: "",
        imageFile: null,
        imagePreview: "",
        cropType: "",
    });

    // Sample products data (replace with actual data fetching)
    const sampleProducts = [
        {
            id: 1,
            name: "Fresh Organic Tomatoes",
            price: 45.0,
            category: "Vegetables",
            cropType: "Tomatoes",
            description:
                "Locally grown organic tomatoes, perfect for cooking and salads. These tomatoes are grown without pesticides and are harvested at peak ripeness.",
            stock: 50,
            image: "https://images.unsplash.com/photo-1546470427-e70c6b9a5e9c?w=400&h=300&fit=crop",
            created_at: "2024-09-01T10:00:00Z",
            updated_at: "2024-09-03T14:30:00Z",
            rating: 4.5,
            reviewCount: 23,
            reviews: [
                {
                    id: 1,
                    userName: "Maria Santos",
                    rating: 5,
                    comment:
                        "Excellent quality! Very fresh and flavorful tomatoes. Will definitely buy again.",
                    date: "2024-09-02T10:30:00Z",
                    userImage:
                        "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face",
                },
                {
                    id: 2,
                    userName: "Juan Dela Cruz",
                    rating: 4,
                    comment:
                        "Good quality tomatoes, perfect for my restaurant. Fast delivery too!",
                    date: "2024-09-01T15:45:00Z",
                    userImage:
                        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face",
                },
                {
                    id: 3,
                    userName: "Ana Rodriguez",
                    rating: 5,
                    comment:
                        "These are the best tomatoes I've ever bought online. So fresh and organic!",
                    date: "2024-08-30T09:15:00Z",
                    userImage:
                        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face",
                },
            ],
        },
        {
            id: 2,
            name: "Premium Rice",
            price: 55.0,
            category: "Grains",
            cropType: "Rice",
            description:
                "High-quality jasmine rice from local farms. Perfect for daily meals with excellent texture and aroma.",
            stock: 100,
            image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=300&fit=crop",
            created_at: "2024-08-28T09:15:00Z",
            updated_at: "2024-09-02T16:45:00Z",
            rating: 4.2,
            reviewCount: 15,
            reviews: [
                {
                    id: 1,
                    userName: "Carlos Mendoza",
                    rating: 4,
                    comment: "Great quality rice. My family loves it!",
                    date: "2024-09-01T12:20:00Z",
                    userImage:
                        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face",
                },
                {
                    id: 2,
                    userName: "Lisa Garcia",
                    rating: 5,
                    comment:
                        "Perfect texture and very aromatic. Highly recommended!",
                    date: "2024-08-29T14:10:00Z",
                    userImage:
                        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=40&h=40&fit=crop&crop=face",
                },
            ],
        },
        {
            id: 3,
            name: "Sweet Mangoes",
            price: 80.0,
            category: "Fruits",
            cropType: "Mango",
            description:
                "Sweet and juicy mangoes, perfectly ripe. These mangoes are hand-picked at optimal ripeness for the best flavor.",
            stock: 25,
            image: "https://images.unsplash.com/photo-1605027990121-cbae9d0541ba?w=400&h=300&fit=crop",
            created_at: "2024-08-30T11:20:00Z",
            updated_at: "2024-09-01T13:10:00Z",
            rating: 4.8,
            reviewCount: 31,
            reviews: [
                {
                    id: 1,
                    userName: "Patricia Torres",
                    rating: 5,
                    comment:
                        "Absolutely delicious! The mangoes were perfectly ripe and sweet.",
                    date: "2024-08-31T16:30:00Z",
                    userImage:
                        "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=40&h=40&fit=crop&crop=face",
                },
                {
                    id: 2,
                    userName: "Roberto Silva",
                    rating: 4,
                    comment: "Very good quality mangoes. My kids loved them!",
                    date: "2024-08-30T18:45:00Z",
                    userImage:
                        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=40&h=40&fit=crop&crop=face",
                },
                {
                    id: 3,
                    userName: "Elena Morales",
                    rating: 5,
                    comment:
                        "Best mangoes I've ever tasted! Will order again soon.",
                    date: "2024-08-29T11:20:00Z",
                    userImage:
                        "https://images.unsplash.com/photo-1485875437342-9b39470b3d95?w=40&h=40&fit=crop&crop=face",
                },
            ],
        },
    ];

    // Sort reviews function
    const sortReviews = (reviews) => {
        if (!reviews || reviews.length === 0) return reviews;

        return [...reviews].sort((a, b) => {
            switch (reviewSortBy) {
                case "newest":
                    return new Date(b.date) - new Date(a.date);
                case "oldest":
                    return new Date(a.date) - new Date(b.date);
                case "highest":
                    return b.rating - a.rating;
                case "lowest":
                    return a.rating - b.rating;
                case "helpful":
                    // Generate consistent "helpful" counts for demo
                    const aHelpful = Math.floor(Math.random() * 15) + 5;
                    const bHelpful = Math.floor(Math.random() * 15) + 5;
                    return bHelpful - aHelpful;
                default:
                    return 0;
            }
        });
    };

    useEffect(() => {
        const fetchProduct = async () => {
            if (!id || !user) return;

            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from("products")
                    .select(
                        `
                        *,
                        categories(name),
                        crop_types(name)
                    `
                    )
                    .eq("id", parseInt(id))
                    .eq("farmer_id", user.id)
                    .single();

                if (error) {
                    console.error("Error fetching product:", error);
                    navigate("/producer/home");
                } else {
                    const productData = {
                        id: data.id,
                        name: data.name,
                        price: parseFloat(data.price),
                        category: data.categories?.name || "Other",
                        description: data.description,
                        stock: parseFloat(data.stock),
                        image_url: data.image_url || "",
                        cropType: data.crop_types?.name || "",
                        deliveryCost: parseFloat(data.delivery_cost) || 50,
                        unit: data.unit || "kg",
                        status: data.status,
                        created_at: data.created_at,
                        updated_at: data.updated_at,
                        reviews: [], // TODO: Fetch reviews separately if needed
                    };
                    setProduct(productData);
                    setEditForm({
                        name: productData.name,
                        price: productData.price.toString(),
                        category: productData.category,
                        cropType: productData.cropType || "",
                        description: productData.description,
                        stock: productData.stock.toString(),
                        image_url: data.image_url || "",
                        imageFile: null,
                        imagePreview: data.image_url || "",
                    });
                }
            } catch (error) {
                console.error("Unexpected error:", error);
                navigate("/producer/home");
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
    }, [id, user, navigate]);

    const handleSave = async () => {
        if (!editForm.name || !editForm.price || !editForm.stock) {
            alert("Please fill in all required fields.");
            return;
        }

        // Validate crop type
        if (editForm.cropType && !availableCrops.includes(editForm.cropType)) {
            alert(
                "Please select a valid crop type from the available options."
            );
            return;
        }

        try {
            // Get category_id if category is selected
            let category_id = null;
            if (editForm.category && editForm.category !== "All") {
                const { data: categoryData } = await supabase
                    .from("categories")
                    .select("id")
                    .eq("name", editForm.category)
                    .single();
                category_id = categoryData?.id;
            }

            // Get crop_type_id
            let crop_type_id = null;
            if (editForm.cropType) {
                const { data: cropTypeData } = await supabase
                    .from("crop_types")
                    .select("id")
                    .eq("name", editForm.cropType)
                    .single();
                crop_type_id = cropTypeData?.id;
            }

            // Handle image upload and deletion
            let image_url = product.image_url; // Keep existing image by default

            // Check if user deleted the image (both imagePreview and image_url are empty/cleared)
            const userDeletedImage =
                !editForm.imagePreview && !editForm.image_url;

            if (userDeletedImage && product.image_url) {
                // User deleted the image, delete from storage
                await deleteImageFromUrl(product.image_url, "products");
                image_url = null;
            } else if (editForm.imageFile) {
                // If new image selected, upload it
                const uploadResult = await uploadImage(
                    editForm.imageFile,
                    "products",
                    user.id,
                    product.image_url // Pass old image URL for deletion
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
                    name: editForm.name,
                    price: parseFloat(editForm.price),
                    category_id: category_id,
                    crop_type_id: crop_type_id,
                    description: editForm.description,
                    stock: parseFloat(editForm.stock),
                    image_url: image_url,
                })
                .eq("id", product.id)
                .select(
                    `
                    *,
                    categories(name),
                    crop_types(name)
                `
                )
                .single();

            if (error) {
                console.error("Error updating product:", error);
                alert("Error updating product. Please try again.");
            } else {
                // Update the local product state
                const updatedProduct = {
                    ...product,
                    name: data.name,
                    price: parseFloat(data.price),
                    category: data.categories?.name || editForm.category,
                    description: data.description,
                    stock: parseFloat(data.stock),
                    image_url: data.image_url,
                    cropType: data.crop_types?.name || editForm.cropType,
                    updated_at: data.updated_at,
                };

                setProduct(updatedProduct);
                setIsEditing(false);
            }
        } catch (error) {
            console.error("Unexpected error:", error);
            alert("An unexpected error occurred. Please try again.");
        }
    };

    const handleDelete = async () => {
        if (!product) return;

        try {
            // First, delete the image from storage if it exists
            if (
                product.image_url &&
                !product.image_url.includes("placeholder") &&
                !product.image_url.includes("gray-apple.png")
            ) {
                await deleteImageFromUrl(product.image_url, "products");
            }

            // Then delete the product from database
            const { error } = await supabase
                .from("products")
                .delete()
                .eq("id", product.id);

            if (error) {
                console.error("Error deleting product:", error);
                alert("Error deleting product. Please try again.");
            } else {
                alert("Product deleted successfully!");
                navigate("/");
            }
        } catch (error) {
            console.error("Unexpected error:", error);
            alert("An unexpected error occurred. Please try again.");
        }
    };

    const handleCancel = () => {
        setEditForm({
            name: product.name,
            price: product.price.toString(),
            category: product.category,
            cropType: product.cropType || "",
            description: product.description,
            stock: product.stock.toString(),
            image_url: product.image_url || "",
            imageFile: null,
            imagePreview: product.image_url || "",
        });
        setCropSearchTerm("");
        setShowCropDropdown(false);
        setIsEditing(false);
    };

    if (loading) {
        return (
            <div className="min-h-screen w-full flex flex-col relative items-center scrollbar-hide bg-background overflow-x-hidden text-text pb-20">
                <div className="fixed top-0 left-0 w-full bg-white shadow-md z-50 px-4 py-3">
                    <h1 className="text-lg font-semibold text-primary text-center">
                        Product Details
                    </h1>
                </div>
                <div className="flex justify-center items-center h-screen">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
                </div>
                <ProducerNavigationBar />
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen w-full flex flex-col relative items-center scrollbar-hide bg-background overflow-x-hidden text-text pb-20">
                <div className="fixed top-0 left-0 w-full bg-white shadow-md z-50 px-4 py-3">
                    <h1 className="text-lg font-semibold text-primary text-center">
                        Product Not Found
                    </h1>
                </div>
                <div className="flex flex-col justify-center items-center h-screen">
                    <Icon
                        icon="mingcute:box-line"
                        width="64"
                        height="64"
                        className="text-gray-300 mb-4"
                    />
                    <p className="text-gray-500 mb-4">Product not found</p>
                    <button
                        onClick={() => navigate("/")}
                        className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark transition-colors"
                    >
                        Back to Products
                    </button>
                </div>
                <ProducerNavigationBar />
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full flex flex-col relative items-center scrollbar-hide bg-background overflow-x-hidden text-text pb-20">
            {/* Header */}
            <div className="fixed top-0 left-0 w-full bg-white shadow-md z-50 px-4 py-3">
                <div className="flex justify-between items-center">
                    <button
                        onClick={() => navigate("/")}
                        className="text-primary hover:text-primary-dark transition-colors"
                    >
                        <Icon
                            icon="mingcute:arrow-left-line"
                            width="24"
                            height="24"
                        />
                    </button>
                    <h1 className="text-lg font-semibold text-primary">
                        Product Details
                    </h1>
                    <div className="flex gap-2">
                        {!isEditing ? (
                            <>
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="text-blue-600 hover:text-blue-800 transition-colors"
                                >
                                    <Icon
                                        icon="mingcute:edit-line"
                                        width="24"
                                        height="24"
                                    />
                                </button>
                                <button
                                    onClick={() => setShowDeleteModal(true)}
                                    className="text-red-600 hover:text-red-800 transition-colors"
                                >
                                    <Icon
                                        icon="mingcute:delete-line"
                                        width="24"
                                        height="24"
                                    />
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={handleCancel}
                                    className="text-gray-600 hover:text-gray-800 transition-colors"
                                >
                                    <Icon
                                        icon="mingcute:close-line"
                                        width="24"
                                        height="24"
                                    />
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="text-green-600 hover:text-green-800 transition-colors"
                                >
                                    <Icon
                                        icon="mingcute:check-line"
                                        width="24"
                                        height="24"
                                    />
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div className="w-full max-w-4xl mx-4 sm:mx-auto my-16">
                <div className="bg-white rounded-lg shadow-md overflow-hidden mt-4">
                    {/* Product Image */}
                    <div className="relative">
                        {isEditing ? (
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Product Image
                                </label>
                                {/* Image Section - Full Width with Camera Icon */}
                                <div className="relative group">
                                    {editForm.imagePreview ||
                                    editForm.image_url ? (
                                        <div className="relative">
                                            <img
                                                src={
                                                    editForm.imagePreview ||
                                                    editForm.image_url
                                                }
                                                alt="Product preview"
                                                className="w-full h-64 object-cover rounded-lg bg-gray-100"
                                            />
                                            {/* Camera and Delete Icons - Bottom Right */}
                                            <div className="absolute bottom-3 right-3 flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setEditForm((prev) => ({
                                                            ...prev,
                                                            imageFile: null,
                                                            imagePreview: "",
                                                            image_url: "",
                                                        }));
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
                                                                        setEditForm(
                                                                            (
                                                                                prev
                                                                            ) => ({
                                                                                ...prev,
                                                                                imagePreview:
                                                                                    e
                                                                                        .target
                                                                                        .result,
                                                                            })
                                                                        );
                                                                    };
                                                                reader.readAsDataURL(
                                                                    file
                                                                );
                                                                setEditForm(
                                                                    (prev) => ({
                                                                        ...prev,
                                                                        imageFile:
                                                                            file,
                                                                    })
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
                                                                setEditForm(
                                                                    (prev) => ({
                                                                        ...prev,
                                                                        imagePreview:
                                                                            e
                                                                                .target
                                                                                .result,
                                                                    })
                                                                );
                                                            };
                                                            reader.readAsDataURL(
                                                                file
                                                            );
                                                            setEditForm(
                                                                (prev) => ({
                                                                    ...prev,
                                                                    imageFile:
                                                                        file,
                                                                })
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
                                        {editForm.imageFile
                                            ? "New image selected • PNG, JPG, or WebP (Max 5MB)"
                                            : editForm.image_url
                                            ? "Current product image"
                                            : "PNG, JPG, or WebP (Max 5MB)"}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="h-64 sm:h-80 bg-gray-200">
                                <img
                                    src={
                                        product.image_url ||
                                        "/assets/gray-apple.png"
                                    }
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        e.target.src = "/assets/gray-apple.png";
                                    }}
                                />
                            </div>
                        )}
                    </div>

                    {/* Product Details */}
                    <div className="p-6">
                        {isEditing ? (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Product Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={editForm.name}
                                        onChange={(e) =>
                                            setEditForm((prev) => ({
                                                ...prev,
                                                name: e.target.value,
                                            }))
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Price per kg (₱) *
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={editForm.price}
                                            onChange={(e) =>
                                                setEditForm((prev) => ({
                                                    ...prev,
                                                    price: e.target.value,
                                                }))
                                            }
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
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
                                            value={editForm.stock}
                                            onChange={(e) =>
                                                setEditForm((prev) => ({
                                                    ...prev,
                                                    stock: e.target.value,
                                                }))
                                            }
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Category *
                                        </label>
                                        <select
                                            value={editForm.category}
                                            onChange={(e) =>
                                                setEditForm((prev) => ({
                                                    ...prev,
                                                    category: e.target.value,
                                                }))
                                            }
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                                            required
                                        >
                                            {categories.map((cat) => (
                                                <option key={cat} value={cat}>
                                                    {cat}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Crop Type Field */}
                                <div className="relative">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Crop Type
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={editForm.cropType}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setEditForm((prev) => ({
                                                    ...prev,
                                                    cropType: value,
                                                }));
                                                setCropSearchTerm(value);
                                                setShowCropDropdown(
                                                    value.length > 0
                                                );
                                            }}
                                            onFocus={() => {
                                                setCropSearchTerm(
                                                    editForm.cropType
                                                );
                                                setShowCropDropdown(true);
                                            }}
                                            onBlur={() => {
                                                setTimeout(
                                                    () =>
                                                        setShowCropDropdown(
                                                            false
                                                        ),
                                                    150
                                                );
                                            }}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                                            placeholder="Search for crop type..."
                                        />
                                        <Icon
                                            icon="material-symbols:search"
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"
                                        />

                                        {/* Dropdown */}
                                        {showCropDropdown &&
                                            filteredCrops.length > 0 && (
                                                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                                    {filteredCrops.map(
                                                        (crop) => (
                                                            <div
                                                                key={crop}
                                                                className="px-3 py-2 hover:bg-primary/10 cursor-pointer text-sm"
                                                                onMouseDown={(
                                                                    e
                                                                ) => {
                                                                    e.preventDefault();
                                                                    setEditForm(
                                                                        (
                                                                            prev
                                                                        ) => ({
                                                                            ...prev,
                                                                            cropType:
                                                                                crop,
                                                                        })
                                                                    );
                                                                    setCropSearchTerm(
                                                                        crop
                                                                    );
                                                                    setShowCropDropdown(
                                                                        false
                                                                    );
                                                                }}
                                                            >
                                                                {crop}
                                                            </div>
                                                        )
                                                    )}
                                                </div>
                                            )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Description
                                    </label>
                                    <textarea
                                        value={editForm.description}
                                        onChange={(e) =>
                                            setEditForm((prev) => ({
                                                ...prev,
                                                description: e.target.value,
                                            }))
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                                        rows="4"
                                        placeholder="Describe your product..."
                                    />
                                </div>
                            </div>
                        ) : (
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800 mb-2">
                                    {product.name}
                                </h1>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                                    <div className="bg-gray-50 p-3 rounded-lg">
                                        <h3 className="text-sm font-medium text-gray-600 mb-1">
                                            Price per kg
                                        </h3>
                                        <p className="text-xl font-bold text-primary">
                                            ₱{product.price.toFixed(2)}
                                        </p>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded-lg">
                                        <h3 className="text-sm font-medium text-gray-600 mb-1">
                                            Stock
                                        </h3>
                                        <p className="text-lg font-semibold text-gray-800">
                                            {product.stock} kg
                                        </p>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded-lg">
                                        <h3 className="text-sm font-medium text-gray-600 mb-1">
                                            Category
                                        </h3>
                                        <p className="text-lg font-semibold text-gray-800">
                                            {product.category}
                                        </p>
                                    </div>
                                    {product.cropType && (
                                        <div className="bg-gray-50 p-3 rounded-lg">
                                            <h3 className="text-sm font-medium text-gray-600 mb-1">
                                                Crop Type
                                            </h3>
                                            <p className="text-lg font-semibold text-gray-800">
                                                {product.cropType}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {product.description && (
                                    <div className="mb-6">
                                        <h3 className="text-lg font-semibold text-gray-800 mb-2">
                                            Description
                                        </h3>
                                        <p className="text-gray-600 leading-relaxed">
                                            {product.description}
                                        </p>
                                    </div>
                                )}

                                {/* Rating and Reviews Summary */}
                                <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 mb-6">
                                    <h3 className="text-lg font-semibold text-gray-800 mb-6">
                                        Customer Reviews
                                    </h3>

                                    {/* Main Rating Display */}
                                    <div className="flex items-center justify-center mb-6 p-4 bg-gray-50 rounded-lg">
                                        <div className="text-center">
                                            <div className="text-4xl font-bold text-gray-800 mb-2">
                                                {product.rating}
                                            </div>
                                            <div className="flex items-center justify-center gap-1 mb-2">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <Icon
                                                        key={star}
                                                        icon="mingcute:star-fill"
                                                        className={`w-6 h-6 ${
                                                            star <=
                                                            Math.floor(
                                                                product.rating
                                                            )
                                                                ? "text-yellow-400"
                                                                : star ===
                                                                      Math.ceil(
                                                                          product.rating
                                                                      ) &&
                                                                  product.rating %
                                                                      1 !==
                                                                      0
                                                                ? "text-yellow-200"
                                                                : "text-gray-300"
                                                        }`}
                                                    />
                                                ))}
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                Based on {product.reviewCount}{" "}
                                                reviews
                                            </div>
                                        </div>
                                    </div>

                                    {/* Rating Breakdown */}
                                    <div className="space-y-2">
                                        {[5, 4, 3, 2, 1].map((rating) => {
                                            const count =
                                                rating === 5
                                                    ? 12
                                                    : rating === 4
                                                    ? 7
                                                    : rating === 3
                                                    ? 3
                                                    : rating === 2
                                                    ? 1
                                                    : 0;
                                            const percentage = Math.round(
                                                (count / product.reviewCount) *
                                                    100
                                            );
                                            return (
                                                <div
                                                    key={rating}
                                                    className="flex items-center gap-3"
                                                >
                                                    <div className="flex items-center gap-1 w-12">
                                                        <span className="text-sm text-gray-700">
                                                            {rating}
                                                        </span>
                                                        <Icon
                                                            icon="mingcute:star-fill"
                                                            className="text-yellow-400"
                                                            width="14"
                                                            height="14"
                                                        />
                                                    </div>
                                                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                                                        <div
                                                            className="bg-yellow-400 h-2 rounded-full"
                                                            style={{
                                                                width: `${percentage}%`,
                                                            }}
                                                        ></div>
                                                    </div>
                                                    <div className="text-sm text-gray-600 w-12 text-right">
                                                        {count}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Individual Reviews */}
                                {product.reviews &&
                                    product.reviews.length > 0 && (
                                        <div className="mb-6">
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="text-lg font-semibold text-gray-800">
                                                    Recent Reviews
                                                </h3>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm text-gray-600">
                                                        Sort by:
                                                    </span>
                                                    <select
                                                        value={reviewSortBy}
                                                        onChange={(e) =>
                                                            setReviewSortBy(
                                                                e.target.value
                                                            )
                                                        }
                                                        className="text-sm px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-white"
                                                    >
                                                        <option value="newest">
                                                            Newest First
                                                        </option>
                                                        <option value="oldest">
                                                            Oldest First
                                                        </option>
                                                        <option value="highest">
                                                            Highest Rating
                                                        </option>
                                                        <option value="lowest">
                                                            Lowest Rating
                                                        </option>
                                                        <option value="helpful">
                                                            Most Helpful
                                                        </option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                {sortReviews(product.reviews)
                                                    .slice(0, 3)
                                                    .map((review, index) => {
                                                        // Generate consistent helpful count for demo
                                                        const helpfulCount =
                                                            Math.floor(
                                                                Math.random() *
                                                                    15
                                                            ) + 5;
                                                        return (
                                                            <div
                                                                key={`${review.id}-${reviewSortBy}-${index}`}
                                                                className="bg-white border border-gray-200 rounded-lg shadow-sm p-6"
                                                            >
                                                                <div className="flex items-start justify-between mb-4">
                                                                    <div className="flex items-start gap-4 flex-1">
                                                                        <img
                                                                            src={
                                                                                review.userImage
                                                                            }
                                                                            alt={
                                                                                review.userName
                                                                            }
                                                                            className="w-12 h-12 rounded-full object-cover"
                                                                        />
                                                                        <div className="flex-1">
                                                                            <div className="flex items-center gap-2 mb-2">
                                                                                <h4 className="font-medium text-gray-800">
                                                                                    {
                                                                                        review.userName
                                                                                    }
                                                                                </h4>
                                                                                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                                                                                    Verified
                                                                                    Purchase
                                                                                </span>
                                                                            </div>
                                                                            <div className="flex items-center gap-2 mb-3">
                                                                                <div className="flex">
                                                                                    {[
                                                                                        1,
                                                                                        2,
                                                                                        3,
                                                                                        4,
                                                                                        5,
                                                                                    ].map(
                                                                                        (
                                                                                            star
                                                                                        ) => (
                                                                                            <Icon
                                                                                                key={
                                                                                                    star
                                                                                                }
                                                                                                icon="mingcute:star-fill"
                                                                                                className={`w-4 h-4 ${
                                                                                                    star <=
                                                                                                    review.rating
                                                                                                        ? "text-yellow-400"
                                                                                                        : "text-gray-300"
                                                                                                }`}
                                                                                            />
                                                                                        )
                                                                                    )}
                                                                                </div>
                                                                                <span className="text-sm text-gray-500">
                                                                                    {new Date(
                                                                                        review.date
                                                                                    ).toLocaleDateString(
                                                                                        "en-US",
                                                                                        {
                                                                                            year: "numeric",
                                                                                            month: "long",
                                                                                            day: "numeric",
                                                                                        }
                                                                                    )}
                                                                                </span>
                                                                            </div>
                                                                            <p className="text-gray-600 leading-relaxed mb-3">
                                                                                {
                                                                                    review.comment
                                                                                }
                                                                            </p>
                                                                            <div className="flex items-center gap-4 text-sm text-gray-500">
                                                                                <span className="flex items-center gap-1">
                                                                                    <Icon
                                                                                        icon="mingcute:thumb-up-line"
                                                                                        width="14"
                                                                                        height="14"
                                                                                    />
                                                                                    {
                                                                                        helpfulCount
                                                                                    }{" "}
                                                                                    helpful
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                            </div>
                                            {product.reviews.length > 3 && (
                                                <div className="mt-6 text-center">
                                                    <button className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark transition-colors font-medium">
                                                        View all{" "}
                                                        {product.reviewCount}{" "}
                                                        reviews
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                open={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDelete}
                title="Delete Product"
                message={`Are you sure you want to delete "${product.name}"? This action cannot be undone.`}
                confirmText="Delete"
                confirmButtonClass="bg-red-600 hover:bg-red-700"
            />

            <ProducerNavigationBar />
        </div>
    );
}

export default ProducerProduct;
