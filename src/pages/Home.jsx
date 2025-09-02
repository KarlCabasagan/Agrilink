import { useState, useMemo } from "react";
import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";
import NavigationBar from "../components/NavigationBar";
import ConsumerSearch from "../components/ConsumerSearch.jsx";
import { products } from "../data/products.js";

const categories = [
    { name: "All", icon: "mdi:apps-box" },
    { name: "Vegetables", icon: "twemoji:carrot" },
    { name: "Fruits", icon: "twemoji:red-apple" },
    { name: "Grains", icon: "twemoji:cooked-rice" },
    { name: "Spices", icon: "twemoji:onion" },
    { name: "Root and Tuber", icon: "twemoji:potato" },
    { name: "Legumes", icon: "twemoji:beans" },
];

function Home() {
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [search, setSearch] = useState("");

    const filteredProducts = useMemo(() => {
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
    }, [selectedCategory, search]);

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
                <Link to="/cart" className="text-gray-600 hover:text-primary">
                    <Icon icon="mingcute:shopping-cart-1-line" width="24" height="24" />
                </Link>
            </div>

            <div className="w-full max-w-6xl mx-4 sm:mx-auto mt-16">
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
                                onClick={() => setSelectedCategory(category.name)}
                            >
                                <Icon
                                    icon={category.icon}
                                    width="32"
                                    height="32"
                                    className={selectedCategory === category.name ? "text-white" : "text-gray-600"}
                                />
                                <span className={`mt-1 text-xs font-medium truncate max-w-[70px] ${
                                    selectedCategory === category.name ? "text-white" : "text-gray-700"
                                }`}>
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
                    {filteredProducts.length === 0 ? (
                        <div className="col-span-full flex flex-col items-center justify-center py-16">
                            <Icon icon="mingcute:search-line" width="64" height="64" className="text-gray-300 mb-4" />
                            <p className="text-gray-400 text-lg">No products found</p>
                            <p className="text-gray-400 text-sm">Try adjusting your search or filters</p>
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
                                    />
                                    <div className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md">
                                        <Icon icon="mingcute:heart-line" width="16" height="16" className="text-gray-400" />
                                    </div>
                                </div>

                                <div className="p-3">
                                    <h3 className="font-semibold text-gray-800 line-clamp-2 mb-1 text-sm">
                                        {product.name}
                                    </h3>

                                    <div className="flex items-center gap-1 mb-2">
                                        <div className="flex">{renderStars(product.rating || 4.5)}</div>
                                        <span className="text-xs text-gray-500">({product.rating || 4.5})</span>
                                    </div>

                                    <div className="flex items-center gap-1 mb-2">
                                        <Icon icon="mingcute:location-line" width="12" height="12" className="text-gray-400" />
                                        <span className="text-xs text-gray-500 line-clamp-1">
                                            {product.address}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <p className="text-primary font-bold text-lg">
                                            ₱{product.price.toFixed(2)}
                                        </p>
                                        <span className="text-xs text-gray-500">
                                            {product.stock || 0} left
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            </div>
            <NavigationBar />
        </div>
    );
}

export default Home;
