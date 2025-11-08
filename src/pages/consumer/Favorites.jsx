import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";
import NavigationBar from "../../components/NavigationBar";
import ConsumerSearch from "../../components/ConsumerSearch.jsx";
import { useState, useEffect, useContext } from "react";
import supabase from "../../SupabaseClient.jsx";
import { AuthContext } from "../../App.jsx";

function Favorites() {
    const { user } = useContext(AuthContext);
    const [search, setSearch] = useState("");
    const [favoriteProducts, setFavoriteProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAddingToCart, setIsAddingToCart] = useState(false);
    const [addToCartResult, setAddToCartResult] = useState(null);

    // Auto-dismiss toast after 5 seconds
    useEffect(() => {
        if (addToCartResult) {
            const timer = setTimeout(() => {
                setAddToCartResult(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [addToCartResult]);

    // Compute cart summary before opening modal
    const getCartSummary = () => {
        if (!filteredFavorites.length) return null;

        const availableProducts = filteredFavorites.filter(
            (product) => product.stock > 0
        );
        const outOfStockCount =
            filteredFavorites.length - availableProducts.length;

        return {
            totalToAdd: availableProducts.length,
            outOfStockCount,
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

    // Handle clearing all favorites
    const handleClearAllFavorites = async () => {
        if (!user) {
            alert("Please log in to clear favorites");
            return;
        }

        const confirmClear = window.confirm(
            "Are you sure you want to remove all favorites? This action cannot be undone."
        );
        if (!confirmClear) return;

        try {
            const { error } = await supabase
                .from("favorites")
                .delete()
                .eq("user_id", user.id);

            if (error) {
                console.error("Error clearing favorites:", error);
                alert("Failed to clear favorites. Please try again.");
                return;
            }

            setFavoriteProducts([]);
            alert("All favorites have been removed!");
        } catch (error) {
            console.error("Error clearing favorites:", error);
            alert("Failed to clear favorites. Please try again.");
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

            // Separate products into new and existing
            const newProducts = [];
            const existingProductsToUpdate = [];

            availableProducts.forEach((product) => {
                if (existingProductsMap[product.id]) {
                    // Product already exists in cart - add 1kg more
                    existingProductsToUpdate.push({
                        product_id: product.id,
                        current_quantity: existingProductsMap[product.id],
                        new_quantity: existingProductsMap[product.id] + 1,
                    });
                } else {
                    // New product - add with minimum order quantity
                    newProducts.push({
                        cart_id: cartData.id,
                        product_id: product.id,
                        quantity: product.minimumOrderQuantity || 1,
                    });
                }
            });

            // Insert new products to cart
            if (newProducts.length > 0) {
                const { error: insertError } = await supabase
                    .from("cart_items")
                    .insert(newProducts);

                if (insertError) throw insertError;
            }

            // Update existing products in cart (add 1kg to each)
            for (const existingProduct of existingProductsToUpdate) {
                const { error: updateError } = await supabase
                    .from("cart_items")
                    .update({ quantity: existingProduct.new_quantity })
                    .eq("cart_id", cartData.id)
                    .eq("product_id", existingProduct.product_id);

                if (updateError) throw updateError;
            }

            const outOfStockCount =
                filteredFavorites.length - availableProducts.length;
            const newItemsCount = newProducts.length;
            const updatedItemsCount = existingProductsToUpdate.length;

            let message = "";
            if (newItemsCount > 0 && updatedItemsCount > 0) {
                message = `Added ${newItemsCount} new items and updated ${updatedItemsCount} existing items (+1kg each) in cart!`;
            } else if (newItemsCount > 0) {
                message = `Successfully added ${newItemsCount} new items to cart!`;
            } else if (updatedItemsCount > 0) {
                message = `Updated ${updatedItemsCount} existing items in cart (+1kg each)!`;
            }

            if (outOfStockCount > 0) {
                message += ` (${outOfStockCount} out-of-stock items were skipped)`;
            }

            setAddToCartResult({
                type: "success",
                message,
            });
            setIsModalOpen(false);
        } catch (error) {
            console.error("Error adding items to cart:", error);
            setAddToCartResult({
                type: "error",
                message: "Failed to add items to cart",
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
                        className="text-gray-600 hover:text-primary"
                    >
                        <Icon
                            icon="mingcute:truck-line"
                            width="24"
                            height="24"
                        />
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
                                    onClick={handleClearAllFavorites}
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
                        className={`fixed bottom-20 left-1/2 -translate-x-1/2 transform px-4 py-3 rounded-lg shadow-lg 
                            ${
                                addToCartResult.type === "success"
                                    ? "bg-primary text-white"
                                    : "bg-red-00 text-white"
                            } 
                            flex items-center gap-3 min-w-[320px] max-w-md mx-auto z-50
                            animate-[slide-up_0.3s_ease-out,fade-out_0.3s_ease-in_forwards_3s]`}
                        role="alert"
                    >
                        <Icon
                            icon={
                                addToCartResult.type === "success"
                                    ? "mingcute:check-circle-fill"
                                    : "mingcute:warning-fill"
                            }
                            width="24"
                            height="24"
                            className="flex-shrink-0"
                        />
                        <p className="text-sm font-medium flex-grow">
                            {addToCartResult.message}
                        </p>
                        {addToCartResult.type === "error" && (
                            <button
                                onClick={handleAddAllToCart}
                                className="text-sm font-medium text-white hover:text-red-100 underline underline-offset-2 mr-2"
                                disabled={isAddingToCart}
                            >
                                Retry
                            </button>
                        )}
                        <button
                            onClick={() => setAddToCartResult(null)}
                            className="text-white/80 hover:text-white"
                            aria-label="Close notification"
                        >
                            <Icon
                                icon="mingcute:close-line"
                                width="20"
                                height="20"
                            />
                        </button>
                    </div>
                )}
                {/* Add to Cart Modal */}
                {isModalOpen && (
                    <>
                        <div className="fixed inset-0 bg-black opacity-50 z-[9998] flex items-center justify-center p-4" />
                        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                            <div className="bg-white rounded-lg shadow-xl z-[9999] max-w-md w-full mx-auto ">
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
                                    onClick={handleClearAllFavorites}
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
