import { useParams } from "react-router-dom";
import { useState, useMemo } from "react";
import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";
import NavigationBar from "../../components/NavigationBar";
import { findProductById } from "../../data/products.js";

function Product() {
    const { id } = useParams();
    const [quantity, setQuantity] = useState(1);

    const product = useMemo(() => findProductById(id), [id]);

    const handleAddToCart = () => {
        alert(`Added ${quantity} ${product.name}(s) to cart!`);
    };

    const handleMessageFarmer = () => {
        alert(`Messaging ${product.farmerName} about ${product.name}`);
    };

    const increaseQuantity = () => {
        if (quantity < product.stock) {
            setQuantity(quantity + 1);
        }
    };

    const decreaseQuantity = () => {
        if (quantity > 1) {
            setQuantity(quantity - 1);
        }
    };

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
                        width="16"
                        height="16"
                    />
                ))}
                {hasHalfStar && (
                    <Icon
                        key="half"
                        icon="mingcute:star-half-fill"
                        className="text-yellow-400"
                        width="16"
                        height="16"
                    />
                )}
                {[...Array(emptyStars)].map((_, i) => (
                    <Icon
                        key={`empty-${i}`}
                        icon="mingcute:star-line"
                        className="text-gray-300"
                        width="16"
                        height="16"
                    />
                ))}
            </>
        );
    };

    return (
        <div className="min-h-screen w-full flex flex-col relative items-center scrollbar-hide bg-background overflow-x-hidden text-text pb-20">
            {/* Header with Cart and Back buttons */}
            <div className="fixed top-0 left-0 w-full bg-white shadow-md z-50 px-4 py-3 flex justify-between items-center">
                <Link to="/" className="text-gray-600 hover:text-primary">
                    <Icon icon="mingcute:left-line" width="24" height="24" />
                </Link>
                <h1 className="text-lg font-semibold">Product Details</h1>
                <Link to="/cart" className="text-gray-600 hover:text-primary">
                    <Icon
                        icon="mingcute:shopping-cart-1-line"
                        width="24"
                        height="24"
                    />
                </Link>
            </div>

            {product ? (
                <div className="w-full max-w-2xl bg-white shadow-md mt-16 mx-4 sm:mx-0">
                    <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-64 sm:h-80 object-cover"
                        loading="lazy"
                    />

                    <div className="p-4 sm:p-6">
                        <h1 className="text-2xl sm:text-3xl font-bold mb-2">
                            {product.name}
                        </h1>

                        <div className="bg-green-50 p-3 rounded-lg mb-4">
                            <div className="flex items-center gap-2 mb-1">
                                <Icon
                                    icon="mingcute:user-3-line"
                                    width="20"
                                    height="20"
                                    className="text-green-600"
                                />
                                <span className="font-semibold text-green-800">
                                    Farmer: {product.farmerName}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Icon
                                    icon="mingcute:location-line"
                                    width="16"
                                    height="16"
                                    className="text-green-600"
                                />
                                <span className="text-green-700 text-sm">
                                    {product.address}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 mb-4">
                            <div className="flex">
                                {renderStars(product.rating)}
                            </div>
                            <span className="text-gray-600 text-sm">
                                ({product.rating}/5)
                            </span>
                            <span className="text-gray-500 text-sm">
                                • {product.reviews.length} reviews
                            </span>
                        </div>

                        <p className="text-3xl sm:text-4xl font-bold text-primary mb-3">
                            ₱{product.price.toFixed(2)}
                        </p>

                        <p className="text-gray-600 mb-4">
                            Stock:{" "}
                            <span
                                className={
                                    product.stock > 10
                                        ? "text-green-600"
                                        : "text-red-600"
                                }
                            >
                                {product.stock} available
                            </span>
                        </p>

                        <div className="mb-4">
                            <span className="bg-gray-100 px-3 py-1 rounded-full text-sm text-gray-700">
                                {product.category}
                            </span>
                        </div>

                        <div className="mb-6">
                            <h3 className="font-semibold mb-2 text-lg">
                                Description
                            </h3>
                            <p className="text-gray-700 leading-relaxed">
                                {product.description}
                            </p>
                        </div>

                        <div className="flex items-center gap-4 mb-6">
                            <span className="font-semibold">Quantity:</span>
                            <div className="flex items-center border rounded-lg">
                                <button
                                    onClick={decreaseQuantity}
                                    className="px-4 py-2 hover:bg-gray-100 rounded-l-lg"
                                    disabled={quantity <= 1}
                                >
                                    -
                                </button>
                                <span className="px-4 py-2 border-l border-r bg-gray-50">
                                    {quantity}
                                </span>
                                <button
                                    onClick={increaseQuantity}
                                    className="px-4 py-2 hover:bg-gray-100 rounded-r-lg"
                                    disabled={quantity >= product.stock}
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 mb-6">
                            <button
                                onClick={handleAddToCart}
                                disabled={product.stock === 0}
                                className={`flex-1 py-3 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 ${
                                    product.stock === 0
                                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                        : "bg-primary text-white hover:bg-primary-dark"
                                }`}
                            >
                                <Icon
                                    icon="mingcute:shopping-cart-1-line"
                                    width="20"
                                    height="20"
                                />
                                {product.stock === 0
                                    ? "Out of Stock"
                                    : "Add to Cart"}
                            </button>
                            <button
                                onClick={handleMessageFarmer}
                                className="flex-1 py-3 px-4 rounded-lg font-semibold border-2 border-primary text-primary hover:bg-primary hover:text-white transition-colors flex items-center justify-center gap-2"
                            >
                                <Icon
                                    icon="mingcute:message-3-line"
                                    width="20"
                                    height="20"
                                />
                                Message Farmer
                            </button>
                        </div>

                        {product.reviews.length > 0 && (
                            <div className="mt-8">
                                <h3 className="font-semibold mb-4 text-lg">
                                    Customer Reviews
                                </h3>
                                <div className="space-y-4">
                                    {product.reviews.map((review, index) => (
                                        <div
                                            key={index}
                                            className="border-b pb-4 last:border-b-0"
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="font-medium">
                                                    {review.user}
                                                </span>
                                                <span className="text-gray-500 text-sm">
                                                    {review.date}
                                                </span>
                                            </div>
                                            <div className="flex mb-2">
                                                {renderStars(review.rating)}
                                            </div>
                                            <p className="text-gray-700">
                                                {review.comment}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="w-full h-[calc(100vh-64px)] flex items-center justify-center">
                    <p className="text-gray-400 text-lg">Product not found.</p>
                </div>
            )}
            <NavigationBar />
        </div>
    );
}

export default Product;
