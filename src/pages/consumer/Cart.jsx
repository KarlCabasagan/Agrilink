import { useState, useEffect, useContext } from "react";
import { Icon } from "@iconify/react";
import { Link, useNavigate } from "react-router-dom";
import NavigationBar from "../../components/NavigationBar";
import supabase from "../../SupabaseClient.jsx";
import { AuthContext } from "../../App.jsx";

function Cart() {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch cart items from database
    useEffect(() => {
        const fetchCartItems = async () => {
            if (!user) return;

            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from("cart_items")
                    .select(
                        `
                        *,
                        products(
                            *,
                            categories(name),
                            farmer_profile:profiles(name, address)
                        )
                    `
                    )
                    .eq("user_id", user.id)
                    .order("created_at", { ascending: false });

                if (error) {
                    console.error("Error fetching cart items:", error);
                    return;
                }

                console.log("Raw cart data:", data); // Debug log

                const formattedCartItems = data.map((item) => ({
                    id: item.product_id,
                    cartItemId: item.id,
                    name: item.products.name,
                    price: parseFloat(item.products.price),
                    quantity: parseFloat(item.quantity),
                    image:
                        item.products.image_url ||
                        "https://via.placeholder.com/300x200?text=No+Image",
                    farmerName:
                        item.products.farmer_profile?.name || "Unknown Farmer",
                    farmerId: item.products.farmer_id,
                    farmerAddress:
                        item.products.farmer_profile?.address ||
                        "Location not available",
                    stock: parseFloat(item.products.stock),
                    unit: item.products.unit || "kg",
                    minimumOrderQuantity:
                        parseFloat(item.products.minimum_order_quantity) || 1.0,
                    deliveryCost: parseFloat(item.products.delivery_cost) || 50,
                    category: item.products.categories?.name || "Other",
                }));

                console.log("Formatted cart items:", formattedCartItems); // Debug log
                setCartItems(formattedCartItems);
            } catch (error) {
                console.error("Error fetching cart items:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchCartItems();
    }, [user]);

    // Group cart items by farmer
    const groupedByFarmer = cartItems.reduce((groups, item) => {
        const farmerId = item.farmerId;
        if (!groups[farmerId]) {
            groups[farmerId] = {
                farmerName: item.farmerName,
                farmerId: farmerId,
                items: [],
                totalQuantity: 0,
                totalPrice: 0,
                minimumOrderQuantity: item.minimumOrderQuantity,
                deliveryCost: item.deliveryCost,
            };
        }
        groups[farmerId].items.push(item);
        groups[farmerId].totalQuantity += item.quantity;
        groups[farmerId].totalPrice += item.price * item.quantity;
        return groups;
    }, {});

    const farmerGroups = Object.values(groupedByFarmer);

    const updateQuantity = async (id, newQuantity) => {
        const roundedQuantity = Math.round(newQuantity * 10) / 10;
        if (roundedQuantity < 0.1) return;

        const item = cartItems.find((item) => item.id === id);
        if (!item) return;

        const finalQuantity = Math.min(roundedQuantity, item.stock);

        try {
            const { error } = await supabase
                .from("cart_items")
                .update({ quantity: finalQuantity })
                .eq("id", item.cartItemId);

            if (error) {
                console.error("Error updating quantity:", error);
                return;
            }

            setCartItems((items) =>
                items.map((cartItem) =>
                    cartItem.id === id
                        ? { ...cartItem, quantity: finalQuantity }
                        : cartItem
                )
            );
        } catch (error) {
            console.error("Error updating cart item:", error);
        }
    };

    const handleQuantityChange = (id, value) => {
        const numValue = parseFloat(value);
        if (!isNaN(numValue) && numValue >= 0.1) {
            const item = cartItems.find((item) => item.id === id);
            if (numValue <= item.stock) {
                updateQuantity(id, numValue);
            }
        } else if (value === "") {
            updateQuantity(id, 0.1);
        }
    };

    const removeItem = async (id) => {
        const item = cartItems.find((item) => item.id === id);
        if (!item) return;

        try {
            const { error } = await supabase
                .from("cart_items")
                .delete()
                .eq("id", item.cartItemId);

            if (error) {
                console.error("Error removing item:", error);
                return;
            }

            setCartItems((items) =>
                items.filter((cartItem) => cartItem.id !== id)
            );
        } catch (error) {
            console.error("Error removing cart item:", error);
        }
    };

    const getTotalPrice = () => {
        return cartItems.reduce(
            (total, item) => total + item.price * item.quantity,
            0
        );
    };

    const getTotalItems = () => {
        return cartItems.reduce((total, item) => total + item.quantity, 0);
    };

    // Helper function to check delivery eligibility per farmer
    const getDeliveryIneligibleFarmers = () => {
        return farmerGroups.filter(
            (group) => group.totalQuantity < group.minimumOrderQuantity
        );
    };

    const isDeliveryAvailable = () => {
        return getDeliveryIneligibleFarmers().length === 0;
    };

    const handleCheckout = () => {
        if (cartItems.length === 0) {
            alert("Your cart is empty!");
            return;
        }

        // Navigate to checkout page with cart data
        navigate("/checkout", {
            state: {
                cartItems: cartItems,
                totalAmount: getTotalPrice(),
                farmerGroups: farmerGroups,
            },
        });
    };

    return (
        <div className="min-h-screen w-full flex flex-col relative items-center scrollbar-hide bg-background overflow-x-hidden text-text pb-20">
            {/* Header */}
            <div className="fixed top-0 left-0 w-full bg-white shadow-md z-50 px-4 py-3 flex justify-between items-center">
                <Link to="/" className="text-gray-600 hover:text-primary">
                    <Icon icon="mingcute:left-line" width="24" height="24" />
                </Link>
                <h1 className="text-lg font-semibold">My Cart</h1>
                <div className="flex items-center gap-2">
                    <Icon
                        icon="mingcute:shopping-cart-1-line"
                        width="20"
                        height="20"
                        className="text-primary"
                    />
                    <span className="text-primary font-medium">
                        {getTotalItems().toFixed(1)} items
                    </span>
                </div>
            </div>

            <div className="w-full max-w-2xl mx-4 sm:mx-auto my-16">
                {loading ? (
                    // Loading skeleton
                    <div className="space-y-4">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div
                                key={i}
                                className="bg-white rounded-lg shadow-md p-4 animate-pulse"
                            >
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-4 h-4 bg-gray-300 rounded"></div>
                                    <div className="h-4 bg-gray-300 rounded w-32"></div>
                                </div>
                                <div className="flex gap-3">
                                    <div className="w-16 h-16 bg-gray-300 rounded-lg"></div>
                                    <div className="flex-1">
                                        <div className="h-4 bg-gray-300 rounded mb-2"></div>
                                        <div className="h-3 bg-gray-300 rounded w-3/4 mb-2"></div>
                                        <div className="h-4 bg-gray-300 rounded w-1/3"></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : cartItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <Icon
                            icon="mingcute:shopping-cart-1-line"
                            width="80"
                            height="80"
                            className="text-gray-300 mb-4"
                        />
                        <h2 className="text-xl font-bold text-gray-600 mb-2">
                            Your cart is empty
                        </h2>
                        <p className="text-gray-500 text-center mb-6">
                            Start shopping and add some fresh products from
                            local farmers!
                        </p>
                        <Link
                            to="/"
                            className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-dark transition-colors font-medium"
                        >
                            Start Shopping
                        </Link>
                    </div>
                ) : (
                    <>
                        {/* Delivery Eligibility Info */}
                        {!isDeliveryAvailable() && (
                            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                                <div className="flex items-start gap-3">
                                    <Icon
                                        icon="mingcute:truck-line"
                                        width="24"
                                        height="24"
                                        className="text-orange-600 mt-0.5"
                                    />
                                    <div>
                                        <h3 className="font-semibold text-orange-800 mb-1">
                                            Home Delivery Requirements
                                        </h3>
                                        <p className="text-orange-700 text-sm mb-2">
                                            Some farmers require minimum order
                                            quantities for delivery. Add more
                                            items or choose pickup during
                                            checkout.
                                        </p>
                                        <div className="text-orange-600 text-xs">
                                            {getDeliveryIneligibleFarmers().map(
                                                (farmer, index) => (
                                                    <p key={farmer.farmerId}>
                                                        •{" "}
                                                        <strong>
                                                            {farmer.farmerName}:
                                                        </strong>{" "}
                                                        Need{" "}
                                                        {(
                                                            farmer.minimumOrderQuantity -
                                                            farmer.totalQuantity
                                                        ).toFixed(1)}
                                                        kg more (currently{" "}
                                                        {farmer.totalQuantity.toFixed(
                                                            1
                                                        )}
                                                        kg, min:{" "}
                                                        {
                                                            farmer.minimumOrderQuantity
                                                        }
                                                        kg)
                                                    </p>
                                                )
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Cart Items Grouped by Farmer */}
                        <div className="space-y-6 mb-6">
                            {farmerGroups.map((group) => {
                                const isGroupEligible =
                                    group.totalQuantity >=
                                    group.minimumOrderQuantity;

                                return (
                                    <div
                                        key={group.farmerId}
                                        className={`bg-white rounded-lg shadow-md overflow-hidden ${
                                            !isGroupEligible
                                                ? "border-l-4 border-orange-400"
                                                : "border-l-4 border-green-400"
                                        }`}
                                    >
                                        {/* Farmer Header */}
                                        <div
                                            className={`p-4 ${
                                                isGroupEligible
                                                    ? "bg-green-50"
                                                    : "bg-orange-50"
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <Icon
                                                        icon="mingcute:user-3-line"
                                                        width="20"
                                                        height="20"
                                                        className={
                                                            isGroupEligible
                                                                ? "text-green-600"
                                                                : "text-orange-600"
                                                        }
                                                    />
                                                    <div>
                                                        <h3 className="font-semibold text-gray-800">
                                                            {group.farmerName}
                                                        </h3>
                                                        <p className="text-xs text-gray-600 flex items-center gap-1 mt-0.5">
                                                            <Icon
                                                                icon="mingcute:location-line"
                                                                width="12"
                                                                height="12"
                                                            />
                                                            {group.items[0]
                                                                ?.farmerAddress ||
                                                                "Location not available"}
                                                        </p>
                                                        <div className="bg-primary/10 px-2 py-1 rounded-md inline-block mt-1">
                                                            <p className="text-sm font-bold text-primary">
                                                                ₱
                                                                {group.totalPrice.toFixed(
                                                                    2
                                                                )}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div
                                                        className={`flex items-center gap-2 text-xs ${
                                                            isGroupEligible
                                                                ? "text-green-700"
                                                                : "text-orange-600"
                                                        }`}
                                                    >
                                                        <Icon
                                                            icon={
                                                                isGroupEligible
                                                                    ? "mingcute:check-circle-fill"
                                                                    : "mingcute:alert-triangle-fill"
                                                            }
                                                            width="14"
                                                            height="14"
                                                        />
                                                        <span>
                                                            {isGroupEligible
                                                                ? "Delivery available ✓"
                                                                : `${(
                                                                      group.minimumOrderQuantity -
                                                                      group.totalQuantity
                                                                  ).toFixed(
                                                                      1
                                                                  )}kg left for delivery`}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Farmer's Items */}
                                        <div className="divide-y divide-gray-100">
                                            {group.items.map((item) => (
                                                <div
                                                    key={item.id}
                                                    className="p-4"
                                                >
                                                    <div className="flex gap-4">
                                                        <img
                                                            src={item.image}
                                                            alt={item.name}
                                                            className="w-16 h-16 object-cover rounded-lg"
                                                        />
                                                        <div className="flex-1">
                                                            <h4 className="font-semibold text-gray-800 mb-1">
                                                                {item.name}
                                                            </h4>
                                                            <p className="text-primary font-bold text-lg">
                                                                ₱
                                                                {item.price.toFixed(
                                                                    2
                                                                )}
                                                                /{item.unit}
                                                            </p>
                                                        </div>
                                                        <button
                                                            onClick={() =>
                                                                removeItem(
                                                                    item.id
                                                                )
                                                            }
                                                            className="text-gray-400 hover:text-red-500 transition-colors"
                                                        >
                                                            <Icon
                                                                icon="mingcute:delete-2-line"
                                                                width="20"
                                                                height="20"
                                                            />
                                                        </button>
                                                    </div>

                                                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-sm font-medium text-gray-700">
                                                                Quantity (
                                                                {item.unit}):
                                                            </span>
                                                            <input
                                                                type="number"
                                                                value={
                                                                    item.quantity
                                                                }
                                                                onChange={(e) =>
                                                                    handleQuantityChange(
                                                                        item.id,
                                                                        e.target
                                                                            .value
                                                                    )
                                                                }
                                                                step="0.1"
                                                                min="0.1"
                                                                max={item.stock}
                                                                className="px-2 py-1 border border-gray-300 rounded-lg w-20 text-center focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                                                            />
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-sm text-gray-500">
                                                                Subtotal
                                                            </p>
                                                            <p className="font-bold text-gray-800">
                                                                ₱
                                                                {(
                                                                    item.price *
                                                                    item.quantity
                                                                ).toFixed(2)}
                                                            </p>
                                                            <p className="text-xs text-gray-500">
                                                                Stock:{" "}
                                                                {item.stock}{" "}
                                                                {item.unit}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Order Summary */}
                        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                            <h3 className="font-semibold text-gray-800 mb-4">
                                Order Summary
                            </h3>

                            {/* Delivery Status */}
                            <div
                                className={`mb-4 p-3 rounded-lg ${
                                    isDeliveryAvailable()
                                        ? "bg-green-50 border border-green-200"
                                        : "bg-orange-50 border border-orange-200"
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <Icon
                                        icon={
                                            isDeliveryAvailable()
                                                ? "mingcute:check-circle-fill"
                                                : "mingcute:alert-triangle-fill"
                                        }
                                        width="16"
                                        height="16"
                                        className={
                                            isDeliveryAvailable()
                                                ? "text-green-600"
                                                : "text-orange-600"
                                        }
                                    />
                                    <span
                                        className={`text-sm font-medium ${
                                            isDeliveryAvailable()
                                                ? "text-green-800"
                                                : "text-orange-800"
                                        }`}
                                    >
                                        {isDeliveryAvailable()
                                            ? "Home Delivery Available for All Farmers"
                                            : `${
                                                  getDeliveryIneligibleFarmers()
                                                      .length
                                              } Farmer(s) Need Minimum Order`}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-2 mb-4">
                                <div className="flex justify-between text-gray-600">
                                    <span>
                                        Total Items:{" "}
                                        {getTotalItems().toFixed(1)} kg
                                    </span>
                                    <span>₱{getTotalPrice().toFixed(2)}</span>
                                </div>

                                <div className="space-y-1">
                                    {farmerGroups.map((group) => (
                                        <div
                                            key={group.farmerId}
                                            className="flex justify-between text-gray-600 text-sm"
                                        >
                                            <span>
                                                {group.farmerName} delivery fee
                                            </span>
                                            <span
                                                className={
                                                    !isDeliveryAvailable()
                                                        ? "text-gray-400"
                                                        : ""
                                                }
                                            >
                                                {!isDeliveryAvailable()
                                                    ? "TBD"
                                                    : `₱${group.deliveryCost.toFixed(
                                                          2
                                                      )}`}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                <div className="border-t border-gray-200 pt-2">
                                    <div className="flex justify-between font-bold text-lg text-gray-800">
                                        <span>Total</span>
                                        <span>
                                            ₱
                                            {(
                                                getTotalPrice() +
                                                (isDeliveryAvailable()
                                                    ? farmerGroups.reduce(
                                                          (sum, g) =>
                                                              sum +
                                                              g.deliveryCost,
                                                          0
                                                      )
                                                    : 0)
                                            ).toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {!isDeliveryAvailable() && (
                                <div className="text-center text-orange-600 text-xs">
                                    * Delivery fees apply only when minimum
                                    quantities are met per farmer
                                </div>
                            )}
                        </div>

                        {/* Checkout Button */}
                        <div className="sticky bottom-20 bg-white rounded-lg shadow-lg p-4 border-t border-gray-200">
                            <button
                                onClick={handleCheckout}
                                className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary-dark transition-colors flex items-center justify-center gap-2"
                            >
                                <Icon
                                    icon="mingcute:wallet-3-line"
                                    width="20"
                                    height="20"
                                />
                                Proceed to Checkout
                            </button>
                            <p className="text-center text-gray-500 text-xs mt-2">
                                {isDeliveryAvailable()
                                    ? "Home delivery & farm pickup available for all items"
                                    : "Farm pickup available • Some deliveries need min. quantities"}
                            </p>
                        </div>
                    </>
                )}
            </div>
            <NavigationBar />
        </div>
    );
}

export default Cart;
