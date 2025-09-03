import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";
import NavigationBar from "../../components/NavigationBar";
import ConsumerSearch from "../../components/ConsumerSearch.jsx";
import { useState } from "react";

function Favorites() {
    const [search, setSearch] = useState("");
    const favoriteProducts = [
        {
            id: 4,
            name: "Monggo",
            price: 12.0,
            image: "https://images.yummy.ph/yummy/uploads/2021/02/monggo.jpg",
            address: "Seaside Market, Zone 2",
            category: "Legumes",
            rating: 4.3,
            stock: 25,
            farmerName: "Juan Santos",
        },
        {
            id: 2,
            name: "Apple",
            price: 8.0,
            image: "https://assets.clevelandclinic.org/transform/LargeFeatureImage/cd71f4bd-81d4-45d8-a450-74df78e4477a/Apples-184940975-770x533-1_jpg",
            address: "Zone 4, Barangay 5",
            category: "Fruits",
            rating: 4.8,
            stock: 15,
            farmerName: "Maria Cruz",
        },
    ];

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

    const handleRemoveFromFavorites = (productId, e) => {
        e.preventDefault();
        e.stopPropagation();
        // This would normally remove from favorites in state/database
        alert(`Removed from favorites! (Product ID: ${productId})`);
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
                    {filteredFavorites.length === 0 ? (
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
                                            ₱{product.price.toFixed(2)}
                                        </p>
                                        <span className="text-xs text-gray-500">
                                            {product.stock} left
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
                                <button className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors">
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
