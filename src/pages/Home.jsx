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
            .filter(product => selectedCategory === "All" || product.category === selectedCategory)
            .filter(product =>
                product.name.toLowerCase().includes(search.toLowerCase()) ||
                product.address.toLowerCase().includes(search.toLowerCase())
            );
    }, [selectedCategory, search]);

    return (
        <div className="min-h-screen w-full flex flex-col relative items-center scrollbar-hide bg-background overflow-x-hidden text-text">
            <ConsumerSearch value={search} onChange={(e) => setSearch(e.target.value)} />
            
            <div className="w-full sm:w-10/12 mt-[120px] flex flex-col items-center overflow-x-hidden">
                <div className="flex overflow-x-auto gap-6 px-4 py-2 scrollbar-hide w-full sm:w-auto md:max-w-4/5 bg-white rounded-xl">
                    {categories.map((category) => (
                        <div
                            key={category.name}
                            className={`flex flex-col items-center justify-center min-w-[80px] cursor-pointer text-center ${
                                selectedCategory === category.name ? "bg-primary/10 rounded-lg" : ""
                            }`}
                            onClick={() => setSelectedCategory(category.name)}
                        >
                            <Icon
                                icon={category.icon}
                                width="40"
                                height="40"
                                color={selectedCategory === category.name ? "#1976D2" : "#8A8A8A"}
                            />
                            <span className={`mt-2 text-sm font-medium truncate max-w-[80px] ${
                                selectedCategory === category.name ? "text-primary" : "text-text"
                            }`}>
                                {category.name}
                            </span>
                        </div>
                    ))}
                </div>
                
                <div className="w-full flex sm:justify-center my-1 mt-6">
                    <h2 className="text-xl font-bold text-gray-600 self-start px-4 sm:px-0">
                        {selectedCategory} Products
                    </h2>
                </div>
                
                <div className="md:w-11/12 px-2 pb-24 sm:px-0 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 w-full my-4 overflow-x-hidden overflow-y-auto scrollbar-hide">
                    {filteredProducts.length === 0 ? (
                        <div className="col-span-full text-center text-gray-400 py-8">
                            No products found.
                        </div>
                    ) : (
                        filteredProducts.map((product) => (
                            <Link
                                to={`/product/${product.id}`}
                                key={product.id}
                                className="bg-white rounded-lg shadow-md flex flex-col items-center h-full cursor-pointer"
                            >
                                <img
                                    src={product.image}
                                    alt={product.name}
                                    className="w-full h-48 object-cover rounded-md mb-2 rounded-b-none"
                                    loading="lazy"
                                />
                                <div className="w-full flex flex-col p-3 pt-0 flex-grow">
                                    <h3 className="font-medium text-text line-clamp-2 sm:line-clamp-1">
                                        {product.name}
                                    </h3>
                                    <div className="w-full flex justify-between items-center mb-2">
                                        <p className="text-primary font-semibold mt-2">
                                            ₱{product.price.toFixed(2)}
                                        </p>
                                        <p className="text-sm mt-2.5 text-gray-500">100 sold</p>
                                    </div>
                                    <div className="mt-auto">
                                        <div className="flex items-center text-gray-600">
                                            <Icon
                                                icon="mdi:map-marker"
                                                width="14"
                                                height="14"
                                                className="mr-2 min-w-[14px]"
                                            />
                                            <span className="text-sm line-clamp-1">
                                                {product.address}
                                            </span>
                                        </div>
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
