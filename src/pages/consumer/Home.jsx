import { useState, useMemo, useEffect, useContext } from "react";
import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";
import NavigationBar from "../../components/NavigationBar";
import ConsumerSearch from "../../components/ConsumerSearch.jsx";
import Modal from "../../components/Modal";
import supabase from "../../SupabaseClient.jsx";
import { AuthContext } from "../../App.jsx";
import { getCartCount } from "../../utils/cartUtils.js";

import useUpdateLastLogin from "../../hooks/useUpdateLastLogin";

function Home() {
    const { user } = useContext(AuthContext);
    useUpdateLastLogin(user?.id);

    const [selectedCategory, setSelectedCategory] = useState("All");
    const [search, setSearch] = useState("");
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([
        { name: "All", icon: "mdi:apps-box" },
    ]);
    const [loading, setLoading] = useState(true);
    const [favorites, setFavorites] = useState(new Set()); // Track favorite product IDs
    const [cartCount, setCartCount] = useState(0);
    const [hasOrdersWithStatus6, setHasOrdersWithStatus6] = useState(false);
    const [modal, setModal] = useState({
        open: false,
        type: "",
        title: "",
        message: "",
        onConfirm: null,
    });

    const showModal = (type, title, message, onConfirm = null) => {
        setModal({ open: true, type, title, message, onConfirm });
    };

    // Helper: Fisher-Yates shuffle algorithm to randomize array in place
    const shuffleArray = (array) => {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    };

    // Fetch categories from database
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const { data, error } = await supabase
                    .from("categories")
                    .select("*")
                    .order("name");

                if (error) {
                    console.error("Error fetching categories:", error);
                    return;
                }

                const dbCategories = data.map((cat) => ({
                    name: cat.name,
                    icon: cat.icon || "mingcute:leaf-line", // Use icon from DB, with a fallback
                    id: cat.id,
                }));

                setCategories([
                    { name: "All", icon: "mdi:apps-box" },
                    ...dbCategories,
                ]);
            } catch (error) {
                console.error("Error fetching categories:", error);
            }
        };

        fetchCategories();
    }, []);

    // Fetch user's favorites from database
    useEffect(() => {
        const fetchFavorites = async () => {
            if (!user) return;

            try {
                const { data, error } = await supabase
                    .from("favorites")
                    .select("product_id")
                    .eq("user_id", user.id);

                if (error) {
                    console.error("Error fetching favorites:", error);
                    return;
                }

                const favoriteIds = new Set(data.map((fav) => fav.product_id));
                setFavorites(favoriteIds);
            } catch (error) {
                console.error("Error fetching favorites:", error);
            }
        };

        fetchFavorites();
    }, [user]);

    // Fetch cart count
    useEffect(() => {
        const fetchCartCount = async () => {
            if (user) {
                const count = await getCartCount(user.id);
                setCartCount(count);
            }
        };

        fetchCartCount();

        // Optional: Set up interval to refresh cart count every 30 seconds
        const interval = setInterval(fetchCartCount, 30000);

        return () => clearInterval(interval);
    }, [user]);

    // Check for orders with status_id 6 and subscribe to real-time changes
    useEffect(() => {
        if (!user?.id) return;

        const checkOrderStatus = async () => {
            try {
                const { data, error } = await supabase
                    .from("orders")
                    .select("id")
                    .eq("user_id", user.id)
                    .eq("status_id", 6)
                    .limit(1);

                if (!error && data && data.length > 0) {
                    setHasOrdersWithStatus6(true);
                } else {
                    setHasOrdersWithStatus6(false);
                }
            } catch (error) {
                console.error("Error checking order status:", error);
            }
        };

        // Initial check
        checkOrderStatus();

        // Subscribe to real-time changes
        const channel = supabase
            .channel(`orders-status-${user.id}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "orders",
                    filter: `user_id=eq.${user.id}`,
                },
                () => {
                    // On any order change, recheck status
                    checkOrderStatus();
                }
            )
            .subscribe();

        return () => {
            channel.unsubscribe();
        };
    }, [user?.id]);

    // Handle adding/removing favorites
    const toggleFavorite = async (productId, event) => {
        event.preventDefault();
        event.stopPropagation();

        if (!user) {
            showModal(
                "warning",
                "Login Required",
                "Please log in to add favorites",
                () => setModal((prev) => ({ ...prev, open: false }))
            );
            return;
        }

        const isFavorite = favorites.has(productId);

        try {
            if (isFavorite) {
                // Remove from favorites
                const { error } = await supabase
                    .from("favorites")
                    .delete()
                    .eq("user_id", user.id)
                    .eq("product_id", productId);

                if (error) throw error;

                setFavorites((prev) => {
                    const newFavorites = new Set(prev);
                    newFavorites.delete(productId);
                    return newFavorites;
                });
            } else {
                // Add to favorites
                const { error } = await supabase.from("favorites").insert({
                    user_id: user.id,
                    product_id: productId,
                    created_at: new Date().toISOString(),
                });

                if (error) throw error;

                setFavorites((prev) => new Set([...prev, productId]));
            }
        } catch (error) {
            console.error("Error toggling favorite:", error);
            showModal(
                "error",
                "Error",
                "Failed to update favorites. Please try again.",
                () => setModal((prev) => ({ ...prev, open: false }))
            );
        }
    };

    // Fetch products from database
    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from("products")
                    .select(
                        `
                    *,
                    categories(name),
                    profiles!user_id(name, address, delivery_cost, minimum_order_quantity),
                    statuses(name),
                    reviews!reviews_product_id_fkey(
                        rating
                    )
                `
                    )
                    .neq("status_id", 2) // exclude status_id = 2
                    .not("approval_date", "is", null) // exclude NULL
                    .neq("approval_date", "1970-01-01 00:00:00+00") // exclude default date
                    .eq("statuses.name", "active")
                    .order("created_at", { ascending: false });

                if (error) {
                    console.error("Error fetching products:", error);
                    setProducts([]);
                    return;
                }

                if (!data || data.length === 0) {
                    console.log("No products found in database");
                    setProducts([]);
                    return;
                }

                const formattedProducts = data.map((product) => ({
                    id: product.id,
                    name: product.name,
                    price: parseFloat(product.price),
                    image:
                        product.image_url ||
                        "https://via.placeholder.com/300x200?text=No+Image",
                    address:
                        product.profiles?.address || "Location not available",
                    category: product.categories?.name || "Other",
                    farmerName: product.profiles?.name || "Unknown Farmer",
                    description: product.description,
                    stock: parseFloat(product.stock) || 0,
                    rating: product.reviews?.length
                        ? product.reviews.reduce(
                              (sum, review) => sum + parseFloat(review.rating),
                              0
                          ) / product.reviews.length
                        : 0,
                    reviewCount: product.reviews?.length || 0,
                    minimumOrderQuantity:
                        parseFloat(product.profiles?.minimum_order_quantity) ||
                        1,
                    deliveryCost:
                        parseFloat(product.profiles?.delivery_cost) || 50,
                    pickupLocation:
                        product.profiles?.address || "Farm location",
                    farmerId: product.user_id,
                }));

                // Randomize product order before setting state
                const randomizedProducts = shuffleArray(formattedProducts);
                setProducts(randomizedProducts);
            } catch (error) {
                console.error("Error fetching products:", error);
                setProducts([]);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, []);

    // Set up real-time subscription to product changes
    useEffect(() => {
        const subscriptionRef = supabase
            .channel("products-channel")
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "products",
                },
                async (payload) => {
                    // Fetch the new product with all filters to verify it should be visible
                    const { data, error } = await supabase
                        .from("products")
                        .select(
                            `
                        *,
                        categories(name),
                        profiles!user_id(name, address, delivery_cost, minimum_order_quantity),
                        statuses(name),
                        reviews!reviews_product_id_fkey(
                            rating
                        )
                    `
                        )
                        .eq("id", payload.new.id)
                        .neq("status_id", 2)
                        .not("approval_date", "is", null)
                        .neq("approval_date", "1970-01-01 00:00:00+00")
                        .eq("statuses.name", "active");

                    if (!error && data && data.length === 1) {
                        // Product passes filters, add to list
                        const product = data[0];
                        const formattedProduct = {
                            id: product.id,
                            name: product.name,
                            price: parseFloat(product.price),
                            image:
                                product.image_url ||
                                "https://via.placeholder.com/300x200?text=No+Image",
                            address:
                                product.profiles?.address ||
                                "Location not available",
                            category: product.categories?.name || "Other",
                            farmerName:
                                product.profiles?.name || "Unknown Farmer",
                            description: product.description,
                            stock: parseFloat(product.stock) || 0,
                            rating: product.reviews?.length
                                ? product.reviews.reduce(
                                      (sum, review) =>
                                          sum + parseFloat(review.rating),
                                      0
                                  ) / product.reviews.length
                                : 0,
                            reviewCount: product.reviews?.length || 0,
                            minimumOrderQuantity:
                                parseFloat(
                                    product.profiles?.minimum_order_quantity
                                ) || 1,
                            deliveryCost:
                                parseFloat(product.profiles?.delivery_cost) ||
                                50,
                            pickupLocation:
                                product.profiles?.address || "Farm location",
                            farmerId: product.user_id,
                        };

                        // Append new product to the end of the list
                        setProducts((prev) => [...prev, formattedProduct]);
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
                    // Fetch the updated product with all filters
                    const { data, error } = await supabase
                        .from("products")
                        .select(
                            `
                        *,
                        categories(name),
                        profiles!user_id(name, address, delivery_cost, minimum_order_quantity),
                        statuses(name),
                        reviews!reviews_product_id_fkey(
                            rating
                        )
                    `
                        )
                        .eq("id", payload.new.id)
                        .neq("status_id", 2)
                        .not("approval_date", "is", null)
                        .neq("approval_date", "1970-01-01 00:00:00+00")
                        .eq("statuses.name", "active");

                    setProducts((prev) => {
                        const productIndex = prev.findIndex(
                            (p) => p.id === payload.new.id
                        );

                        if (data && data.length === 1) {
                            // Product still passes filters
                            const product = data[0];
                            const formattedProduct = {
                                id: product.id,
                                name: product.name,
                                price: parseFloat(product.price),
                                image:
                                    product.image_url ||
                                    "https://via.placeholder.com/300x200?text=No+Image",
                                address:
                                    product.profiles?.address ||
                                    "Location not available",
                                category: product.categories?.name || "Other",
                                farmerName:
                                    product.profiles?.name || "Unknown Farmer",
                                description: product.description,
                                stock: parseFloat(product.stock) || 0,
                                rating: product.reviews?.length
                                    ? product.reviews.reduce(
                                          (sum, review) =>
                                              sum + parseFloat(review.rating),
                                          0
                                      ) / product.reviews.length
                                    : 0,
                                reviewCount: product.reviews?.length || 0,
                                minimumOrderQuantity:
                                    parseFloat(
                                        product.profiles?.minimum_order_quantity
                                    ) || 1,
                                deliveryCost:
                                    parseFloat(
                                        product.profiles?.delivery_cost
                                    ) || 50,
                                pickupLocation:
                                    product.profiles?.address ||
                                    "Farm location",
                                farmerId: product.user_id,
                            };

                            if (productIndex !== -1) {
                                // Replace existing product at same index
                                const updated = [...prev];
                                updated[productIndex] = formattedProduct;
                                return updated;
                            } else {
                                // Product not in list but now passes filters, append it
                                return [...prev, formattedProduct];
                            }
                        } else {
                            // Product no longer passes filters (suspended/unapproved)
                            if (productIndex !== -1) {
                                // Remove it from the list
                                return prev.filter(
                                    (p) => p.id !== payload.new.id
                                );
                            }
                            return prev;
                        }
                    });
                }
            )
            .subscribe();

        return () => {
            subscriptionRef.unsubscribe();
        };
    }, []);

    const filteredProducts = useMemo(() => {
        if (!products || products.length === 0) {
            return [];
        }

        return products
            .filter(
                (product) =>
                    selectedCategory === "All" ||
                    product.category === selectedCategory
            )
            .filter(
                (product) =>
                    product.name.toLowerCase().includes(search.toLowerCase()) ||
                    product.address.toLowerCase().includes(search.toLowerCase())
            );
    }, [products, selectedCategory, search]);

    const renderStars = (rating) => {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;
        const emptyStars = 5 - Math.ceil(rating);

        return (
            <>
                {[...Array(fullStars)].map((_, i) => (
                    <Icon
                        key={i}
                        icon="mingcute:star-fill"
                        className="text-yellow-400"
                        width="12"
                        height="12"
                    />
                ))}
                {hasHalfStar && (
                    <Icon
                        key="half"
                        icon="mingcute:star-half-fill"
                        className="text-yellow-400"
                        width="12"
                        height="12"
                    />
                )}
                {[...Array(emptyStars)].map((_, i) => (
                    <Icon
                        key={`empty-${i}`}
                        icon="mingcute:star-line"
                        className="text-gray-300"
                        width="12"
                        height="12"
                    />
                ))}
            </>
        );
    };

    return (
        <div className="min-h-screen w-full flex flex-col relative items-center scrollbar-hide bg-background overflow-x-hidden text-text pb-20">
            {/* Header with Search and Cart */}
            <div className="fixed top-0 left-0 w-full bg-white shadow-md z-50 px-4 py-3 flex justify-between items-center">
                <h1 className="text-lg font-semibold text-primary">AgriLink</h1>
                <Link
                    to="/orders"
                    className="relative text-gray-600 hover:text-primary"
                >
                    <Icon icon="mingcute:truck-line" width="24" height="24" />
                    {hasOrdersWithStatus6 && (
                        <span className="absolute -top-1 -right-2 w-2.5 h-2.5 bg-red-500 rounded-full"></span>
                    )}
                </Link>
            </div>

            <div className="w-full max-w-6xl mx-4 sm:mx-auto my-16">
                {/* Search Bar */}
                <div className="mb-6 mt-4">
                    <ConsumerSearch
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
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
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 px-2">
                    {loading ? (
                        // Loading skeleton
                        Array.from({ length: 8 }).map((_, i) => (
                            <div
                                key={i}
                                className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse"
                            >
                                <div className="w-full h-40 sm:h-48 bg-gray-300"></div>
                                <div className="p-3">
                                    <div className="h-4 bg-gray-300 rounded mb-2"></div>
                                    <div className="h-3 bg-gray-300 rounded mb-2 w-3/4"></div>
                                    <div className="h-3 bg-gray-300 rounded mb-2 w-1/2"></div>
                                    <div className="h-4 bg-gray-300 rounded w-1/3"></div>
                                </div>
                            </div>
                        ))
                    ) : !products || products.length === 0 ? (
                        <div className="col-span-full flex flex-col items-center justify-center py-16">
                            <Icon
                                icon="mingcute:inbox-line"
                                width="64"
                                height="64"
                                className="text-gray-300 mb-4"
                            />
                            <p className="text-gray-400 text-lg">
                                No products available
                            </p>
                            <p className="text-gray-400 text-sm">
                                Products will appear here when farmers add them
                            </p>
                        </div>
                    ) : filteredProducts.length === 0 ? (
                        <div className="col-span-full flex flex-col items-center justify-center py-16">
                            <Icon
                                icon="mingcute:search-line"
                                width="64"
                                height="64"
                                className="text-gray-300 mb-4"
                            />
                            <p className="text-gray-400 text-lg">
                                No products found
                            </p>
                            <p className="text-gray-400 text-sm">
                                Try adjusting your search or filters
                            </p>
                        </div>
                    ) : (
                        filteredProducts.map((product) => (
                            <Link
                                to={`/product/${product.id}`}
                                key={product.id}
                                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden"
                            >
                                <div className="relative">
                                    <img
                                        src={product.image}
                                        alt={product.name}
                                        className="w-full h-40 sm:h-48 object-cover"
                                        loading="lazy"
                                        onError={(e) => {
                                            e.target.src =
                                                "https://via.placeholder.com/300x200?text=No+Image";
                                        }}
                                    />
                                    <div className="absolute top-2 left-2 bg-primary text-white px-2 py-1 rounded-full text-xs font-medium">
                                        {product.category}
                                    </div>
                                    <button
                                        onClick={(e) =>
                                            toggleFavorite(product.id, e)
                                        }
                                        className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md hover:bg-gray-50 transition-colors"
                                    >
                                        <Icon
                                            icon={
                                                favorites.has(product.id)
                                                    ? "mingcute:heart-fill"
                                                    : "mingcute:heart-line"
                                            }
                                            width="16"
                                            height="16"
                                            className={
                                                favorites.has(product.id)
                                                    ? "text-red-500"
                                                    : "text-gray-400"
                                            }
                                        />
                                    </button>
                                </div>

                                <div className="p-3">
                                    <h3 className="font-semibold text-gray-800 line-clamp-2 mb-1 text-sm">
                                        {product.name}
                                    </h3>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Icon
                                            icon="mingcute:user-3-line"
                                            width="12"
                                            height="12"
                                            className="text-green-600"
                                        />
                                        <span className="text-xs text-green-700 font-medium">
                                            {product.farmerName}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1 mb-2">
                                        <div className="flex">
                                            {renderStars(product.rating)}
                                        </div>
                                        <span className="text-xs text-gray-500">
                                            {product.reviewCount > 0
                                                ? product.rating.toFixed(1)
                                                : "No"}{" "}
                                            {product.reviewCount === 1
                                                ? "review"
                                                : "reviews"}
                                        </span>
                                    </div>{" "}
                                    <div className="flex items-center gap-1 mb-2">
                                        <Icon
                                            icon="mingcute:location-line"
                                            width="12"
                                            height="12"
                                            className="text-gray-400"
                                        />
                                        <span className="text-xs text-gray-500 line-clamp-1">
                                            {product.address}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <p className="text-primary font-bold text-lg">
                                            ₱{product.price.toFixed(2)}/kg
                                        </p>
                                        <span
                                            className={`text-xs ${
                                                product.stock > 0
                                                    ? "text-green-600"
                                                    : "text-red-500"
                                            }`}
                                        >
                                            {product.stock > 0
                                                ? `${product.stock} kg left`
                                                : "Out of stock"}
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            </div>
            <NavigationBar />
            <Modal
                isOpen={modal.open}
                type={modal.type}
                title={modal.title}
                message={modal.message}
                onConfirm={modal.onConfirm}
                onCancel={() => setModal((prev) => ({ ...prev, open: false }))}
            />
        </div>
    );
}

export default Home;
