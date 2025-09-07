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
                            profiles!products_user_id_fkey(name, address)
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
                            rating: 4.5, // We'll implement real ratings later
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

    return (
        <div className="min-h-screen w-full flex flex-col relative items-center scrollbar-hide bg-background overflow-x-hidden text-text pb-20">
            {/* Header with Back button and Title */}
            <div className="fixed top-0 left-0 w-full bg-white shadow-md z-50 px-4 py-3 flex justify-between items-center">
                <Link to="/" className="text-gray-600 hover:text-primary">
                    <Icon icon="mingcute:left-line" width="24" height="24" />
                </Link>
                <h1 className="text-lg font-semibold">My Favorites</h1>
                <Link to="/cart" className="text-gray-600 hover:text-primary">
                    <Icon
                        icon="mingcute:shopping-cart-1-line"
                        width="24"
                        height="24"
                    />
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

                {/* Section Header */}
                <div className="mb-6 px-2">
                    <div className="flex items-center gap-3 mb-2">
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

                {/* Quick Actions */}
                {filteredFavorites.length > 0 && (
                    <div className="mt-8 px-2">
                        <div className="bg-white rounded-lg shadow-md p-4">
                            <h3 className="font-semibold text-gray-800 mb-3">
                                Quick Actions
                            </h3>
                            <div className="flex flex-wrap gap-3">
                                <button className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors">
                                    <Icon
                                        icon="mingcute:shopping-cart-1-line"
                                        width="16"
                                        height="16"
                                    />
                                    Add All to Cart
                                </button>
                                <button className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors">
                                    <Icon
                                        icon="mingcute:share-2-line"
                                        width="16"
                                        height="16"
                                    />
                                    Share Favorites
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
