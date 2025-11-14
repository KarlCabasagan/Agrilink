import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";
import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../App.jsx";
import { CartCountContext } from "../context/CartCountContext.jsx";

function ConsumerSearch({
    value,
    onChange,
    placeholder = "Search products...",
}) {
    const { user } = useContext(AuthContext);
    const { cartCount } = useContext(CartCountContext);
    return (
        <div className="w-full bg-white shadow-md border-b border-gray-200">
            <div className="flex items-center gap-3 px-4 py-3 max-w-6xl mx-auto">
                {/* Search Input */}
                <div className="relative flex-1">
                    <Icon
                        icon="mingcute:search-line"
                        width="20"
                        height="20"
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    />
                    <input
                        type="text"
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-base outline-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        placeholder={placeholder}
                        value={value}
                        onChange={onChange}
                    />
                </div>

                {/* Cart Button */}
                <Link
                    to="/cart"
                    className="relative p-2.5 text-gray-600 hover:text-primary hover:bg-gray-50 rounded-lg transition-all"
                    aria-label="Cart"
                >
                    <Icon
                        icon="mingcute:shopping-cart-1-line"
                        width="24"
                        height="24"
                    />
                    {cartCount > 0 && (
                        <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                            {cartCount}
                        </div>
                    )}
                </Link>

                {/* Messages Button */}
                <Link
                    to="/messages"
                    className="relative p-2.5 text-gray-600 hover:text-primary hover:bg-gray-50 rounded-lg transition-all"
                    aria-label="Messages"
                >
                    <Icon
                        icon="mingcute:message-3-line"
                        width="24"
                        height="24"
                    />
                    <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                        0
                    </div>
                </Link>
            </div>
        </div>
    );
}

export default ConsumerSearch;
