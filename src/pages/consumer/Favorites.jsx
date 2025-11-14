import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";
import NavigationBar from "../../components/NavigationBar";
import ConsumerSearch from "../../components/ConsumerSearch.jsx";
import { useState, useEffect, useContext } from "react";
import supabase from "../../SupabaseClient.jsx";
import { AuthContext } from "../../App.jsx";
import { CartCountContext } from "../../context/CartCountContext.jsx";

function Favorites() {
    const { user } = useContext(AuthContext);
    const { cartCount, setCartCount, updateCartCount } =
        useContext(CartCountContext);
    const [search, setSearch] = useState("");
    const [favoriteProducts, setFavoriteProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isClearModalOpen, setIsClearModalOpen] = useState(false);
    const [isAddingToCart, setIsAddingToCart] = useState(false);
    const [isClearingFavorites, setIsClearingFavorites] = useState(false);
    const [addToCartResult, setAddToCartResult] = useState(null);
    const [hasOrdersWithStatus6, setHasOrdersWithStatus6] = useState(false);

    // Auto-dismiss toast after 5 seconds
    useEffect(() => {
        if (addToCartResult) {
            const timer = setTimeout(() => {
                setAddToCartResult(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [addToCartResult]);

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

    // Compute cart summary before opening modal
    const getCartSummary = () => {
        if (!filteredFavorites.length) return null;

        // Only include products with positive stock that are neither suspended nor not approved
        const availableProducts = filteredFavorites.filter(
            (product) =>
                product.stock > 0 && !product.suspended && !product.notApproved
        );
        const outOfStockCount = filteredFavorites.filter(
            (product) =>
                product.stock <= 0 && !product.suspended && !product.notApproved
        ).length;
        const suspendedCount = filteredFavorites.filter(
            (product) => product.suspended
        ).length;
        const notApprovedCount = filteredFavorites.filter(
            (product) => product.notApproved
        ).length;

        return {
            totalToAdd: availableProducts.length,
            outOfStockCount,
            suspendedCount,
            notApprovedCount,
            availableProducts,
        };
    };

    // Fetch user's favorite products from database
    useEffect(() => {
        const fetchFavorites = async () => {
            if (!user) {
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from("favorites")
                    .select(
                        `
                        product_id,
                        products (
                            *,
                            categories(name),
                            profiles!products_user_id_fkey(name, address),
                            reviews!reviews_product_id_fkey(rating)
                        )
                    `
                    )
                    .eq("user_id", user.id);

                if (error) {
                    console.error("Error fetching favorites:", error);
                    setFavoriteProducts([]);
                    return;
                }

                const formattedFavorites = data
                    .filter((fav) => fav.products) // Filter out any null products
                    .map((fav) => {
                        const product = fav.products;
                        // Calculate average rating
                        const ratings =
                            product.reviews?.map((r) => r.rating) || [];
                        const averageRating =
                            ratings.length > 0
                                ? ratings.reduce((a, b) => a + b, 0) /
                                  ratings.length
                                : 0;

                        // Derive suspended and notApproved flags independently
                        // suspended: status_id === 2
                        // notApproved: approval_date represents 1970-01-01 00:00:00+00 sentinel
                        const isSuspended = product.status_id === 2;
                        const isNotApproved =
                            product.approval_date &&
                            String(product.approval_date).startsWith(
                                "1970-01-01"
                            );

                        return {
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
                            rating: averageRating, // Real calculated rating
                            unit: product.unit || "kg",
                            minimumOrderQuantity:
                                parseFloat(product.minimum_order_quantity) || 1,
                            deliveryCost:
                                parseFloat(product.delivery_cost) || 50,
                            pickupLocation: product.pickup_location,
                            suspended: isSuspended,
                            notApproved: isNotApproved,
                        };
                    });

                setFavoriteProducts(formattedFavorites);
            } catch (error) {
                console.error("Error fetching favorites:", error);
                setFavoriteProducts([]);
            } finally {
                setLoading(false);
            }
        };

        fetchFavorites();
    }, [user]);

    // Memoize product IDs as a joined string to track actual product set for realtime subscription
    const productIdsString = favoriteProducts
        .map((p) => p.id)
        .sort()
        .join(",");

    // Real-time subscription to favorite products
    useEffect(() => {
        if (!user || favoriteProducts.length === 0) return;

        const productIds = favoriteProducts.map((p) => p.id);
        const subscriptionRef = supabase
            .channel("favorites-products-channel")
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "products",
                    filter: `id=in.(${productIds.join(",")})`,
                },
                (payload) => {
                    const newRow = payload.new;
                    setFavoriteProducts((prev) =>
                        prev.map((fav) => {
                            if (fav.id !== newRow.id) return fav;

                            // Recompute both suspended and notApproved flags independently using same logic
                            const isSuspended = newRow.status_id === 2;
                            const isNotApproved =
                                newRow.approval_date &&
                                String(newRow.approval_date).startsWith(
                                    "1970-01-01"
                                );

                            return {
                                ...fav,
                                price: parseFloat(newRow.price),
                                stock: parseFloat(newRow.stock) || 0,
                                name: newRow.name,
                                image: newRow.image_url || fav.image,
                                suspended: isSuspended,
                                notApproved: isNotApproved,
                            };
                        })
                    );
                }
            )
            .subscribe();

        return () => subscriptionRef.unsubscribe();
    }, [user, productIdsString]);

    const filteredFavorites = favoriteProducts.filter(
        (product) =>
            product.name.toLowerCase().includes(search.toLowerCase()) ||
            product.address.toLowerCase().includes(search.toLowerCase())
    );

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

    const handleRemoveFromFavorites = async (productId, e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!user) {
            alert("Please log in to remove favorites");
            return;
        }

        try {
            const { error } = await supabase
                .from("favorites")
                .delete()
                .eq("user_id", user.id)
                .eq("product_id", productId);

            if (error) {
                console.error("Error removing favorite:", error);
                alert("Failed to remove from favorites. Please try again.");
                return;
            }

            // Update local state to remove the product
            setFavoriteProducts((prev) =>
                prev.filter((product) => product.id !== productId)
            );
        } catch (error) {
            console.error("Error removing favorite:", error);
            alert("Failed to remove from favorites. Please try again.");
        }
    };

    // Handle opening clear favorites modal
    const handleOpenClearModal = () => {
        if (!user) {
            setAddToCartResult({
                type: "error",
                message: "Please log in to clear favorites",
            });
            return;
        }
        setIsClearModalOpen(true);
    };

    // Handle actual clearing of favorites
    const handleClearAllFavorites = async () => {
        if (!user) return;

        setIsClearingFavorites(true);
        try {
            const { error } = await supabase
                .from("favorites")
                .delete()
                .eq("user_id", user.id);

            if (error) throw error;

            setFavoriteProducts([]);
            setAddToCartResult({
                type: "success",
                title: "Favorites Cleared",
                details: {
                    actions: [
                        {
                            type: "clear",
                            text: "All favorites have been removed",
                        },
                    ],
                    skipped: [],
                },
            });
        } catch (error) {
            console.error("Error clearing favorites:", error);
            setAddToCartResult({
                type: "error",
                message: "Failed to clear favorites. Please try again.",
            });
        } finally {
            setIsClearingFavorites(false);
            setIsClearModalOpen(false);
        }
    };

    // Handle opening add to cart modal
    const handleOpenAddToCartModal = () => {
        if (!user) {
            alert("Please log in to add items to cart");
            return;
        }

        const summary = getCartSummary();
        if (!summary || summary.totalToAdd === 0) {
            setAddToCartResult({
                type: "error",
                message: "No products available to add to cart",
            });
            return;
        }

        setIsModalOpen(true);
        setAddToCartResult(null);
    };

    // Handle actual cart addition
    const handleAddAllToCart = async () => {
        if (!user) return;

        setIsAddingToCart(true);
        setAddToCartResult(null);

        const summary = getCartSummary();
        if (!summary || summary.totalToAdd === 0) return;

        const { availableProducts } = summary;

        try {
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

            // Get existing cart items for this user
            const { data: existingCartItems, error: existingError } =
                await supabase
                    .from("cart_items")
                    .select("product_id, quantity")
                    .eq("cart_id", cartData.id);

            if (existingError) throw existingError;

            // Create a map of existing products in cart
            const existingProductsMap = {};
            if (existingCartItems) {
                existingCartItems.forEach((item) => {
                    existingProductsMap[item.product_id] = item.quantity;
                });
            }

            // Separate products into new and existing, tracking stock limits
            const newProducts = [];
            const existingProductsToUpdate = [];
            const maxedOutCount = [];

            availableProducts.forEach((product) => {
                if (existingProductsMap[product.id]) {
                    const currentQuantity = existingProductsMap[product.id];
                    // Only update if current quantity is less than available stock
                    if (currentQuantity < product.stock) {
                        existingProductsToUpdate.push({
                            product_id: product.id,
                            current_quantity: currentQuantity,
                            new_quantity: currentQuantity + 1,
                        });
                    } else {
                        maxedOutCount.push(product.id);
                    }
                } else {
                    // New product - add with minimum order quantity if it won't exceed stock
                    const minQuantity = product.minimumOrderQuantity || 1;
                    if (minQuantity <= product.stock) {
                        newProducts.push({
                            cart_id: cartData.id,
                            product_id: product.id,
                            quantity: minQuantity,
                        });
                    }
                }
            });

            // Insert new products to cart
            if (newProducts.length > 0) {
                const { error: insertError } = await supabase
                    .from("cart_items")
                    .insert(newProducts);

                if (insertError) throw insertError;
            }

            // Update existing products in cart (add 1kg where possible)
            for (const existingProduct of existingProductsToUpdate) {
                const { error: updateError } = await supabase
                    .from("cart_items")
                    .update({ quantity: existingProduct.new_quantity })
                    .eq("cart_id", cartData.id)
                    .eq("product_id", existingProduct.product_id);

                if (updateError) throw updateError;
            }

            // Calculate net increase in cart units (new items added + existing items incremented)
            // Each new product counts as 1 item, each updated product counts as 1 item
            const netIncrease =
                newProducts.length + existingProductsToUpdate.length;

            // Optimistically update shared cart count state for immediate UI feedback
            if (netIncrease > 0) {
                setCartCount(cartCount + netIncrease);
            }

            // Background reconciliation: fetch authoritative cart count to keep state accurate
            // This runs without blocking the modal close or toast display
            updateCartCount(user.id).catch((error) => {
                console.error(
                    "Background cart count reconciliation failed:",
                    error
                );
                // Silently fail - optimistic update already showed to user
            });

            const outOfStockCount = filteredFavorites.filter(
                (product) =>
                    product.stock <= 0 &&
                    !product.suspended &&
                    !product.notApproved
            ).length;
            const suspendedCount = filteredFavorites.filter(
                (product) => product.suspended
            ).length;
            const notApprovedCount = filteredFavorites.filter(
                (product) => product.notApproved
            ).length;
            const newItemsCount = newProducts.length;
            const updatedItemsCount = existingProductsToUpdate.length;
            const maxedItemsCount = maxedOutCount.length;

            setAddToCartResult({
                type: "success",
                details: {
                    actions: [
                        newItemsCount > 0 && {
                            type: "new",
                            count: newItemsCount,
                            text: `${newItemsCount} new ${
                                newItemsCount === 1 ? "item" : "items"
                            } added`,
                        },
                        updatedItemsCount > 0 && {
                            type: "updated",
                            count: updatedItemsCount,
                            text: `${updatedItemsCount} ${
                                updatedItemsCount === 1 ? "item" : "items"
                            } updated (+1kg each)`,
                        },
                    ].filter(Boolean),
                    skipped: [
                        outOfStockCount > 0 && {
                            type: "out-of-stock",
                            count: outOfStockCount,
                            text: `${outOfStockCount} ${
                                outOfStockCount === 1 ? "item" : "items"
                            } out of stock`,
                        },
                        maxedItemsCount > 0 && {
                            type: "max-stock",
                            count: maxedItemsCount,
                            text: `${maxedItemsCount} ${
                                outOfStockCount === 1 ? "item" : "items"
                            } at max stock`,
                        },
                        suspendedCount > 0 && {
                            type: "suspended",
                            count: suspendedCount,
                            text: `${suspendedCount} ${
                                suspendedCount === 1 ? "item" : "items"
                            } suspended and not added`,
                        },
                        notApprovedCount > 0 && {
                            type: "not-approved",
                            count: notApprovedCount,
                            text: `${notApprovedCount} ${
                                notApprovedCount === 1 ? "item" : "items"
                            } not approved and not added`,
                        },
                    ].filter(Boolean),
                },
            });
            setIsModalOpen(false);
        } catch (error) {
            console.error("Error adding items to cart:", error);
            setAddToCartResult({
                type: "error",
                message: "Failed to add items to cart. Please try again.",
                error,
            });
        } finally {
            setIsAddingToCart(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex flex-col relative items-center scrollbar-hide bg-background overflow-x-hidden text-text pb-20">
            {/* Header with Back button and Title */}
            <div className="fixed top-0 left-0 w-full bg-white shadow-md z-50 px-4 py-3 flex justify-between items-center">
                <Link to="/" className="text-gray-600 hover:text-primary">
                    <Icon icon="mingcute:left-line" width="24" height="24" />
                </Link>
                <h1 className="text-lg font-semibold">My Favorites</h1>
                <div className="fixed top-0 left-0 w-full bg-white shadow-md z-50 px-4 py-3 flex justify-between items-center">
                    <h1 className="text-lg font-semibold text-primary">
                        AgriLink
                    </h1>
                    <Link
                        to="/orders"
                        className="relative text-gray-600 hover:text-primary"
                    >
                        <Icon
                            icon="mingcute:truck-line"
                            width="24"
                            height="24"
                        />
                        {hasOrdersWithStatus6 && (
                            <span className="absolute -top-1 -right-2 w-2.5 h-2.5 bg-red-500 rounded-full"></span>
                        )}
                    </Link>
                </div>
            </div>

            <div className="w-full max-w-6xl mx-4 sm:mx-auto my-16">
                {/* Search Bar */}
                <div className="mb-6 mt-4">
                    <ConsumerSearch
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                {/* Section Header */}
                <div className="mb-6 px-2">
                    <div className="flex items-center w-full gap-3 mb-2 justify-between">
                        <div className="flex items-center gap-2">
                            <Icon
                                icon="mingcute:heart-fill"
                                width="24"
                                height="24"
                                className="text-red-500"
                            />
                            <h2 className="text-xl font-bold text-gray-800">
                                Favorite Products
                            </h2>
                        </div>
                        {filteredFavorites.length > 0 && (
                            <div className="hidden flex-wrap gap-3 sm:flex">
                                <button
                                    onClick={handleOpenAddToCartModal}
                                    className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
                                >
                                    <Icon
                                        icon="mingcute:shopping-cart-1-line"
                                        width="16"
                                        height="16"
                                    />
                                    Add All to Cart
                                </button>
                                <button
                                    className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors"
                                    onClick={handleOpenClearModal}
                                >
                                    <Icon
                                        icon="mingcute:delete-2-line"
                                        width="16"
                                        height="16"
                                    />
                                    Clear All
                                </button>
                            </div>
                        )}
                    </div>
                    <p className="text-gray-600 text-sm">
                        {filteredFavorites.length} favorite products
                    </p>
                </div>
                {/* Favorites Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 px-2">
                    {loading ? (
                        // Loading skeleton
                        Array.from({ length: 4 }).map((_, i) => (
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
                    ) : !user ? (
                        <div className="col-span-full flex flex-col items-center justify-center py-16">
                            <Icon
                                icon="mingcute:user-line"
                                width="64"
                                height="64"
                                className="text-gray-300 mb-4"
                            />
                            <p className="text-gray-400 text-lg">
                                Please log in
                            </p>
                            <p className="text-gray-400 text-sm text-center">
                                You need to be logged in to view your favorites
                            </p>
                        </div>
                    ) : filteredFavorites.length === 0 ? (
                        <div className="col-span-full flex flex-col items-center justify-center py-16">
                            <Icon
                                icon="mingcute:heart-line"
                                width="64"
                                height="64"
                                className="text-gray-300 mb-4"
                            />
                            <p className="text-gray-400 text-lg">
                                No favorite products found
                            </p>
                            <p className="text-gray-400 text-sm text-center">
                                {search
                                    ? "Try adjusting your search"
                                    : "Start adding products to your favorites!"}
                            </p>
                        </div>
                    ) : (
                        filteredFavorites.map((product) => (
                            <Link
                                to={`/product/${product.id}`}
                                key={product.id}
                                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden relative"
                            >
                                <div className="relative">
                                    <img
                                        src={product.image}
                                        alt={product.name}
                                        className="w-full h-40 sm:h-48 object-cover"
                                        loading="lazy"
                                    />
                                    <button
                                        onClick={(e) =>
                                            handleRemoveFromFavorites(
                                                product.id,
                                                e
                                            )
                                        }
                                        className="absolute top-2 right-2 bg-white rounded-full p-1.5 shadow-md hover:bg-red-50 transition-colors"
                                    >
                                        <Icon
                                            icon="mingcute:heart-fill"
                                            width="16"
                                            height="16"
                                            className="text-red-500"
                                        />
                                    </button>
                                    <div className="absolute top-2 left-2 bg-primary text-white px-2 py-1 rounded-full text-xs font-medium">
                                        {product.category}
                                    </div>
                                    {product.suspended && (
                                        <div className="absolute top-9 left-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                                            Suspended
                                        </div>
                                    )}
                                    {product.notApproved &&
                                        !product.suspended && (
                                            <div className="absolute top-9 left-2 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                                                Not Approved
                                            </div>
                                        )}
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
                                            ({product.rating})
                                        </span>
                                    </div>

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
                                            ₱{product.price.toFixed(2)}/
                                            {product.unit}
                                        </p>
                                        <span
                                            className={`text-xs ${
                                                product.stock > 0
                                                    ? "text-green-600"
                                                    : "text-red-500"
                                            }`}
                                        >
                                            {product.stock > 0
                                                ? `${product.stock} ${product.unit} left`
                                                : "Out of stock"}
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))
                    )}
                </div>
                {/* Toast Notification */}
                {addToCartResult && (
                    <div
                        className={`fixed bottom-23 left-1/2 sm:left-auto -translate-x-1/2 sm:-translate-x-0 sm:bottom-25 sm:right-8 transform px-4 py-3 rounded-lg shadow-xl
                            ${
                                addToCartResult.type === "success"
                                    ? "bg-white border-l-4 border-l-primary"
                                    : "bg-white border-l-4 border-l-red-500"
                            }
                            flex flex-col min-w-[320px] max-w-md z-50 animate-[slide-up_0.3s_ease-out]`}
                        role="alert"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between pb-2">
                            <div className="flex items-center gap-2">
                                <Icon
                                    icon={
                                        addToCartResult.type === "success"
                                            ? "mingcute:check-circle-fill"
                                            : "mingcute:warning-fill"
                                    }
                                    width="20"
                                    height="20"
                                    className={
                                        addToCartResult.type === "success"
                                            ? "text-primary"
                                            : "text-red-500"
                                    }
                                />
                                <h4
                                    className={`font-medium ${
                                        addToCartResult.type === "success"
                                            ? "text-primary"
                                            : "text-red-500"
                                    }`}
                                >
                                    {addToCartResult.type === "success"
                                        ? "Cart Updated Successfully"
                                        : "Failed to Update Cart"}
                                </h4>
                            </div>
                            <button
                                onClick={() => setAddToCartResult(null)}
                                className="text-gray-400 hover:text-gray-600"
                                aria-label="Close notification"
                            >
                                <Icon
                                    icon="mingcute:close-line"
                                    width="18"
                                    height="18"
                                />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="space-y-1.5">
                            {addToCartResult.type === "success" ? (
                                <>
                                    {/* Actions Summary */}
                                    {addToCartResult.details?.actions.map(
                                        (action, idx) => (
                                            <div
                                                key={`action-${idx}`}
                                                className="flex items-center gap-2"
                                            >
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                                                    {action.text}
                                                </span>
                                            </div>
                                        )
                                    )}

                                    {/* Skipped Items */}
                                    {addToCartResult.details?.skipped.length >
                                        0 && (
                                        <div className="pt-1 space-y-1">
                                            {addToCartResult.details.skipped.map(
                                                (skip, idx) => (
                                                    <div
                                                        key={`skip-${idx}`}
                                                        className="flex items-center gap-2"
                                                    >
                                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                                            {skip.text}
                                                        </span>
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="flex items-center justify-between">
                                    <p className="text-sm text-gray-600">
                                        {addToCartResult.message}
                                    </p>
                                    <button
                                        onClick={handleAddAllToCart}
                                        className="text-sm font-medium text-red-500 hover:text-red-600 underline underline-offset-2"
                                        disabled={isAddingToCart}
                                    >
                                        Retry
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
                {/* Add to Cart Modal */}
                {isModalOpen && (
                    <>
                        <div className="fixed inset-0 bg-black opacity-50 z-[9998] flex items-center justify-center p-4" />
                        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                            <div className="bg-white rounded-lg shadow-xl z-[9999] max-w-md w-full mx-auto">
                                <div className="p-6">
                                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                                        Add All to Cart
                                    </h3>
                                    <div className="space-y-3 mb-6">
                                        {getCartSummary() && (
                                            <>
                                                <p className="text-gray-600">
                                                    {
                                                        getCartSummary()
                                                            .totalToAdd
                                                    }{" "}
                                                    items will be added to your
                                                    cart.
                                                </p>
                                                {getCartSummary()
                                                    .outOfStockCount > 0 && (
                                                    <p className="text-yellow-600 text-sm">
                                                        Note:{" "}
                                                        {
                                                            getCartSummary()
                                                                .outOfStockCount
                                                        }{" "}
                                                        items are out of stock
                                                        and will be skipped
                                                    </p>
                                                )}
                                                {getCartSummary()
                                                    .suspendedCount > 0 && (
                                                    <p className="text-red-600 text-sm">
                                                        Note:{" "}
                                                        {
                                                            getCartSummary()
                                                                .suspendedCount
                                                        }{" "}
                                                        {getCartSummary()
                                                            .suspendedCount ===
                                                        1
                                                            ? "item is"
                                                            : "items are"}{" "}
                                                        suspended and will be
                                                        skipped
                                                    </p>
                                                )}
                                                {getCartSummary()
                                                    .notApprovedCount > 0 && (
                                                    <p className="text-yellow-600 text-sm">
                                                        Note:{" "}
                                                        {
                                                            getCartSummary()
                                                                .notApprovedCount
                                                        }{" "}
                                                        {getCartSummary()
                                                            .notApprovedCount ===
                                                        1
                                                            ? "item is"
                                                            : "items are"}{" "}
                                                        not yet approved and
                                                        will be skipped
                                                    </p>
                                                )}
                                            </>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-end gap-3">
                                        <button
                                            onClick={() =>
                                                setIsModalOpen(false)
                                            }
                                            className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium disabled:opacity-50"
                                            disabled={isAddingToCart}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleAddAllToCart}
                                            className="flex items-center gap-2 bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark transition-all disabled:opacity-50"
                                            disabled={isAddingToCart}
                                        >
                                            {isAddingToCart ? (
                                                <>
                                                    <Icon
                                                        icon="mingcute:loading-line"
                                                        className="animate-spin"
                                                        width="20"
                                                        height="20"
                                                    />
                                                    Adding...
                                                </>
                                            ) : (
                                                <>
                                                    <Icon
                                                        icon="mingcute:shopping-cart-1-line"
                                                        width="20"
                                                        height="20"
                                                    />
                                                    Confirm
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* Clear Favorites Modal */}
                {isClearModalOpen && (
                    <>
                        <div className="fixed inset-0 bg-black opacity-50 z-[9998] flex items-center justify-center p-4" />
                        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                            <div className="bg-white rounded-lg shadow-xl z-[9999] max-w-md w-full mx-auto">
                                <div className="p-6">
                                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                                        Remove All Favorites
                                    </h3>
                                    <div className="space-y-3 mb-6">
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <Icon
                                                icon="mingcute:warning-fill"
                                                className="text-yellow-500"
                                                width="20"
                                                height="20"
                                            />
                                            <p>
                                                Are you sure you want to remove
                                                all favorites? This action
                                                cannot be undone.
                                            </p>
                                        </div>
                                        <p className="text-gray-500 text-sm">
                                            You currently have{" "}
                                            {filteredFavorites.length} favorite{" "}
                                            {filteredFavorites.length === 1
                                                ? "product"
                                                : "products"}
                                            .
                                        </p>
                                    </div>
                                    <div className="flex items-center justify-end gap-3">
                                        <button
                                            onClick={() =>
                                                setIsClearModalOpen(false)
                                            }
                                            className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium disabled:opacity-50"
                                            disabled={isClearingFavorites}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleClearAllFavorites}
                                            className="flex items-center gap-2 bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition-all disabled:opacity-50"
                                            disabled={isClearingFavorites}
                                        >
                                            {isClearingFavorites ? (
                                                <>
                                                    <Icon
                                                        icon="mingcute:loading-line"
                                                        className="animate-spin"
                                                        width="20"
                                                        height="20"
                                                    />
                                                    Removing...
                                                </>
                                            ) : (
                                                <>
                                                    <Icon
                                                        icon="mingcute:delete-2-line"
                                                        width="20"
                                                        height="20"
                                                    />
                                                    Remove All
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
                {/* Quick Actions */}
                {filteredFavorites.length > 0 && (
                    <div className="mt-8 px-2 sm:hidden">
                        <div className="bg-white rounded-lg shadow-md p-4">
                            <h3 className="font-semibold text-gray-800 mb-3">
                                Quick Actions
                            </h3>
                            <div className="flex flex-wrap gap-3">
                                <button
                                    onClick={handleOpenAddToCartModal}
                                    className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
                                >
                                    <Icon
                                        icon="mingcute:shopping-cart-1-line"
                                        width="16"
                                        height="16"
                                    />
                                    Add All to Cart
                                </button>
                                <button
                                    className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors"
                                    onClick={handleOpenClearModal}
                                >
                                    <Icon
                                        icon="mingcute:delete-2-line"
                                        width="16"
                                        height="16"
                                    />
                                    Clear All
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <NavigationBar />
        </div>
    );
}

export default Favorites;
