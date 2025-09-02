import { useState } from "react";
import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";
import NavigationBar from "../components/NavigationBar";

function Cart() {
    const [cartItems, setCartItems] = useState([
        {
            id: 1,
            name: "Fresh Tomatoes",
            price: 25.0,
            quantity: 2,
            image: "https://images.unsplash.com/photo-1546470427-e8357872b6d8",
            farmerName: "Juan Santos",
            stock: 50,
        },
        {
            id: 2,
            name: "Green Lettuce",
            price: 15.0,
            quantity: 1,
            image: "https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1",
            farmerName: "Maria Cruz",
            stock: 30,
        },
        {
            id: 3,
            name: "Sweet Corn",
            price: 18.5,
            quantity: 3,
            image: "https://images.unsplash.com/photo-1586313168876-870e85adc4d6",
            farmerName: "Pedro Reyes",
            stock: 25,
        },
    ]);

    const updateQuantity = (id, newQuantity) => {
        if (newQuantity < 1) return;
        setCartItems((items) =>
            items.map((item) =>
                item.id === id
                    ? { ...item, quantity: Math.min(newQuantity, item.stock) }
                    : item
            )
        );
    };

    const removeItem = (id) => {
        setCartItems((items) => items.filter((item) => item.id !== id));
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

    const handleCheckout = () => {
        alert("Checkout functionality coming soon!");
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
                        {getTotalItems()}
                    </span>
                </div>
            </div>

            <div className="w-full max-w-2xl mx-4 sm:mx-auto mt-16">
                {cartItems.length === 0 ? (
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
                        {/* Cart Items */}
                        <div className="space-y-4 mb-6">
                            {cartItems.map((item) => (
                                <div
                                    key={item.id}
                                    className="bg-white rounded-lg shadow-md p-4"
                                >
                                    <div className="flex gap-4">
                                        <img
                                            src={item.image}
                                            alt={item.name}
                                            className="w-20 h-20 object-cover rounded-lg"
                                        />
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-800 mb-1">
                                                {item.name}
                                            </h3>
                                            <div className="flex items-center gap-2 mb-2">
                                                <Icon
                                                    icon="mingcute:user-3-line"
                                                    width="14"
                                                    height="14"
                                                    className="text-green-600"
                                                />
                                                <span className="text-green-700 text-sm">
                                                    {item.farmerName}
                                                </span>
                                            </div>
                                            <p className="text-primary font-bold text-lg">
                                                ₱{item.price.toFixed(2)}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => removeItem(item.id)}
                                            className="text-gray-400 hover:text-red-500 transition-colors"
                                        >
                                            <Icon
                                                icon="mingcute:delete-2-line"
                                                width="20"
                                                height="20"
                                            />
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm font-medium text-gray-700">
                                                Quantity:
                                            </span>
                                            <div className="flex items-center border rounded-lg">
                                                <button
                                                    onClick={() =>
                                                        updateQuantity(
                                                            item.id,
                                                            item.quantity - 1
                                                        )
                                                    }
                                                    className="px-3 py-1 hover:bg-gray-100 rounded-l-lg"
                                                    disabled={
                                                        item.quantity <= 1
                                                    }
                                                >
                                                    -
                                                </button>
                                                <span className="px-3 py-1 border-l border-r bg-gray-50 min-w-[40px] text-center">
                                                    {item.quantity}
                                                </span>
                                                <button
                                                    onClick={() =>
                                                        updateQuantity(
                                                            item.id,
                                                            item.quantity + 1
                                                        )
                                                    }
                                                    className="px-3 py-1 hover:bg-gray-100 rounded-r-lg"
                                                    disabled={
                                                        item.quantity >=
                                                        item.stock
                                                    }
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm text-gray-500">
                                                Subtotal
                                            </p>
                                            <p className="font-bold text-gray-800">
                                                ₱
                                                {(
                                                    item.price * item.quantity
                                                ).toFixed(2)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Order Summary */}
                        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                            <h3 className="font-semibold text-gray-800 mb-4">
                                Order Summary
                            </h3>
                            <div className="space-y-2 mb-4">
                                <div className="flex justify-between text-gray-600">
                                    <span>Items ({getTotalItems()})</span>
                                    <span>₱{getTotalPrice().toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>Delivery Fee</span>
                                    <span>₱50.00</span>
                                </div>
                                <div className="border-t border-gray-200 pt-2">
                                    <div className="flex justify-between font-bold text-lg text-gray-800">
                                        <span>Total</span>
                                        <span>
                                            ₱{(getTotalPrice() + 50).toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>
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
                                Secure checkout • Free cancellation
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
