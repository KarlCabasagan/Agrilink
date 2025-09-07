import { useParams } from "react-router-dom";
import { useState, useMemo, useEffect, useContext } from "react";
import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";
import NavigationBar from "../../components/NavigationBar";
import Modal from "../../components/Modal";
import supabase from "../../SupabaseClient.jsx";
import { AuthContext } from "../../App.jsx";
import { addToCart } from "../../utils/cartUtils.js";

function Product() {
    const { id } = useParams();
    const { user } = useContext(AuthContext);
    const [quantity, setQuantity] = useState(0.1);
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [addingToCart, setAddingToCart] = useState(false);
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

    // Fetch product details
    useEffect(() => {
        const fetchProduct = async () => {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from("products")
                    .select(
                        `
                        *,
                        categories(name),
                        profiles!user_id(name, address, delivery_cost, minimum_order_quantity),
                        statuses(name)
                    `
                    )
                    .eq("id", id)
                    .eq("statuses.name", "active")
                    .single();

                if (error) {
                    console.error("Error fetching product:", error);
                    return;
                }

                const formattedProduct = {
                    id: data.id,
                    name: data.name,
                    price: parseFloat(data.price),
                    image:
                        data.image_url ||
                        "https://via.placeholder.com/300x200?text=No+Image",
                    address: data.profiles?.address || "Location not available",
                    category: data.categories?.name || "Other",
                    farmerName: data.profiles?.name || "Unknown Farmer",
                    description: data.description,
                    stock: parseFloat(data.stock) || 0,
                    rating: 4.5, // We'll implement real ratings later
                    unit: "kg", // Default unit since not in new schema
                    minimumOrderQuantity:
                        parseFloat(data.profiles?.minimum_order_quantity) || 1,
                    deliveryCost:
                        parseFloat(data.profiles?.delivery_cost) || 50,
                    pickupLocation: data.profiles?.address || "Farm location",
                    farmerId: data.user_id, // Updated to use user_id
                    reviews: [], // We'll implement real reviews later
                };

                setProduct(formattedProduct);
                setQuantity(
                    Math.max(0.1, formattedProduct.minimumOrderQuantity)
                );
            } catch (error) {
                console.error("Error fetching product:", error);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchProduct();
        }
    }, [id]);

    const handleAddToCart = async () => {
        if (!user || !product) return;

        setAddingToCart(true);
        try {
            const result = await addToCart(user.id, product.id, quantity);

            if (result.success) {
                showModal(
                    "success",
                    "Item Added to Cart!",
                    `Successfully added ${quantity} kg of ${product.name} to your cart. You can continue shopping or go to cart to checkout.`,
                    () => setModal((prev) => ({ ...prev, open: false }))
                );
            } else {
                showModal("error", "Error", `Error: ${result.message}`, () =>
                    setModal((prev) => ({ ...prev, open: false }))
                );
            }
        } catch (error) {
            console.error("Error adding to cart:", error);
            showModal(
                "error",
                "Error",
                "Error adding to cart. Please try again.",
                () => setModal((prev) => ({ ...prev, open: false }))
            );
        } finally {
            setAddingToCart(false);
        }
    };

    const handleMessageFarmer = () => {
        showModal(
            "info",
            "Message Farmer",
            `Messaging ${product.farmerName} about ${product.name}`,
            () => setModal((prev) => ({ ...prev, open: false }))
        );
    };

    const increaseQuantity = () => {
        if (!product) return;
        const newQuantity = Math.round((quantity + 0.1) * 10) / 10;
        if (newQuantity <= product.stock) {
            setQuantity(newQuantity);
        }
    };

    const decreaseQuantity = () => {
        if (!product) return;
        const newQuantity = Math.round((quantity - 0.1) * 10) / 10;
        if (newQuantity >= 0.1) {
            setQuantity(newQuantity);
        }
    };

    const handleQuantityChange = (e) => {
        if (!product) return;
        const value = parseFloat(e.target.value);
        if (!isNaN(value) && value >= 0.1 && value <= product.stock) {
            setQuantity(Math.round(value * 10) / 10);
        } else if (e.target.value === "") {
            setQuantity(0.1);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center bg-background">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background text-center">
                <Icon
                    icon="mingcute:sad-line"
                    width="80"
                    height="80"
                    className="text-gray-300 mb-4"
                />
                <h2 className="text-xl font-bold text-gray-600 mb-2">
                    Product not found
                </h2>
                <p className="text-gray-500 mb-6">
                    The product you're looking for doesn't exist or is no longer
                    available.
                </p>
                <Link
                    to="/"
                    className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-dark transition-colors font-medium"
                >
                    Back to Home
                </Link>
            </div>
        );
    }

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
                            ₱{product.price.toFixed(2)}/kg
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
                                {product.stock} kg available
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
                            <span className="font-semibold">
                                Quantity (kg):
                            </span>
                            <div className="flex items-center">
                                <input
                                    type="number"
                                    value={quantity}
                                    onChange={handleQuantityChange}
                                    step="0.1"
                                    min="0.1"
                                    max={product.stock}
                                    className="px-4 py-2 border border-gray-300 rounded-lg w-24 text-center focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                                />
                            </div>
                            <span className="text-sm text-gray-500">
                                Max: {product.stock} kg
                            </span>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 mb-6">
                            <button
                                onClick={handleAddToCart}
                                disabled={product.stock === 0 || addingToCart}
                                className={`flex-1 py-3 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 ${
                                    product.stock === 0 || addingToCart
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
                                    : addingToCart
                                    ? "Adding..."
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
            <Modal
                open={modal.open}
                type={modal.type}
                title={modal.title}
                message={modal.message}
                onConfirm={modal.onConfirm}
                onClose={() => setModal((prev) => ({ ...prev, open: false }))}
            />
        </div>
    );
}

export default Product;
