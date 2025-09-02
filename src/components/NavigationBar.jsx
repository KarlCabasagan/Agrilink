import { Link, useLocation } from "react-router-dom";
import { Icon } from "@iconify/react";

function NavigationBar() {
    const location = useLocation();
    const isActive = (path) => location.pathname === path;

    return (
        <div className="fixed bottom-0 left-0 w-full bg-white shadow-lg border-t border-gray-200 z-[1000]">
            <div className="flex justify-around items-center py-3 px-4 max-w-md mx-auto">
                <Link
                    to="/"
                    className={`flex flex-col items-center min-w-[60px] py-2 px-3 rounded-lg transition-all duration-200 ${
                        isActive("/")
                            ? "bg-primary text-white shadow-md"
                            : "text-gray-600 hover:text-primary hover:bg-gray-50"
                    }`}
                >
                    <Icon
                        icon={
                            isActive("/")
                                ? "mingcute:home-2-fill"
                                : "mingcute:home-2-line"
                        }
                        width="24"
                        height="24"
                    />
                    <span className="text-xs mt-1 font-medium">Home</span>
                </Link>

                <Link
                    to="/favorites"
                    className={`flex flex-col items-center min-w-[60px] py-2 px-3 rounded-lg transition-all duration-200 ${
                        isActive("/favorites")
                            ? "bg-primary text-white shadow-md"
                            : "text-gray-600 hover:text-primary hover:bg-gray-50"
                    }`}
                >
                    <Icon
                        icon={
                            isActive("/favorites")
                                ? "mingcute:heart-fill"
                                : "mingcute:heart-line"
                        }
                        width="24"
                        height="24"
                    />
                    <span className="text-xs mt-1 font-medium">Favorites</span>
                </Link>

                <Link
                    to="/cart"
                    className={`flex flex-col items-center min-w-[60px] py-2 px-3 rounded-lg transition-all duration-200 relative ${
                        isActive("/cart")
                            ? "bg-primary text-white shadow-md"
                            : "text-gray-600 hover:text-primary hover:bg-gray-50"
                    }`}
                >
                    <Icon
                        icon={
                            isActive("/cart")
                                ? "mingcute:shopping-cart-1-fill"
                                : "mingcute:shopping-cart-1-line"
                        }
                        width="24"
                        height="24"
                    />
                    <span className="text-xs mt-1 font-medium">Cart</span>
                    {/* Cart badge */}
                    <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                        0
                    </div>
                </Link>

                <Link
                    to="/messages"
                    className={`flex flex-col items-center min-w-[60px] py-2 px-3 rounded-lg transition-all duration-200 relative ${
                        isActive("/messages")
                            ? "bg-primary text-white shadow-md"
                            : "text-gray-600 hover:text-primary hover:bg-gray-50"
                    }`}
                >
                    <Icon
                        icon={
                            isActive("/messages")
                                ? "mingcute:message-3-fill"
                                : "mingcute:message-3-line"
                        }
                        width="24"
                        height="24"
                    />
                    <span className="text-xs mt-1 font-medium">Messages</span>
                    {/* Message badge */}
                    <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                        0
                    </div>
                </Link>

                <Link
                    to="/profile"
                    className={`flex flex-col items-center min-w-[60px] py-2 px-3 rounded-lg transition-all duration-200 ${
                        isActive("/profile")
                            ? "bg-primary text-white shadow-md"
                            : "text-gray-600 hover:text-primary hover:bg-gray-50"
                    }`}
                >
                    <Icon
                        icon={
                            isActive("/profile")
                                ? "mingcute:user-3-fill"
                                : "mingcute:user-3-line"
                        }
                        width="24"
                        height="24"
                    />
                    <span className="text-xs mt-1 font-medium">Profile</span>
                </Link>
            </div>
        </div>
    );
}

export default NavigationBar;
