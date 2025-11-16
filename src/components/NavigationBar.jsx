import { Link, useLocation } from "react-router-dom";
import { Icon } from "@iconify/react";
import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../App.jsx";
import { CartCountContext } from "../context/CartCountContext.jsx";
import { UnreadConversationsContext } from "../context/UnreadConversationsContext.jsx";
import supabase from "../SupabaseClient.jsx";

function NavigationBar() {
    const location = useLocation();
    const { user } = useContext(AuthContext);
    const { cartCount } = useContext(CartCountContext);
    const { unreadConversationCount } = useContext(UnreadConversationsContext);
    const [hasOrdersWithStatus6, setHasOrdersWithStatus6] = useState(false);
    const [hasSellerRejection, setHasSellerRejection] = useState(false);

    // Check for orders with status_id 6 and subscribe to real-time changes
    useEffect(() => {
        if (!user?.id) return;

        const checkOrderStatus = async () => {
            try {
                const { data, error } = await supabase
                    .from("orders")
                    .select("id")
                    .eq("user_id", user.id)
                    .eq("status_id", 6)
                    .limit(1);

                if (!error && data && data.length > 0) {
                    setHasOrdersWithStatus6(true);
                } else {
                    setHasOrdersWithStatus6(false);
                }
            } catch (error) {
                console.error("Error checking order status:", error);
            }
        };

        // Initial check
        checkOrderStatus();

        // Subscribe to real-time changes
        const channel = supabase
            .channel(`orders-status-navbar-${user.id}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "orders",
                    filter: `user_id=eq.${user.id}`,
                },
                () => {
                    checkOrderStatus();
                }
            )
            .subscribe();

        return () => {
            channel.unsubscribe();
        };
    }, [user?.id]);

    // Check for seller application rejection and subscribe to real-time changes
    useEffect(() => {
        if (!user?.id) return;

        const checkSellerRejection = async () => {
            try {
                const { data, error } = await supabase
                    .from("seller_applications")
                    .select("rejection_reason")
                    .eq("user_id", user.id)
                    .not("rejection_reason", "is", null)
                    .limit(1);

                if (!error && data && data.length > 0) {
                    setHasSellerRejection(true);
                } else {
                    setHasSellerRejection(false);
                }
            } catch (error) {
                console.error("Error checking seller rejection:", error);
            }
        };

        // Initial check
        checkSellerRejection();

        // Subscribe to real-time changes
        const channel = supabase
            .channel(`seller-apps-navbar-${user.id}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "seller_applications",
                    filter: `user_id=eq.${user.id}`,
                },
                () => {
                    checkSellerRejection();
                }
            )
            .subscribe();

        return () => {
            channel.unsubscribe();
        };
    }, [user?.id]);

    const showProfileBadge = hasOrdersWithStatus6 || hasSellerRejection;

    const isActive = (path) => location.pathname === path;

    return (
        <div className="fixed bottom-0 left-0 w-full bg-white shadow-lg border-t border-gray-200 z-[1000]">
            <div className="flex justify-around items-center py-3 px-4 max-w-lg mx-auto">
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
                    {cartCount > 0 && (
                        <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                            {cartCount}
                        </div>
                    )}
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
                    {/* Message badge - only shown when unreadConversationCount > 0 */}
                    {unreadConversationCount > 0 && (
                        <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full animate-pulse">
                            {unreadConversationCount}
                        </div>
                    )}
                </Link>

                <Link
                    to="/profile"
                    className={`flex flex-col items-center min-w-[60px] py-2 px-3 rounded-lg transition-all duration-200 relative ${
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
                    {/* Profile badge - shows when order or seller rejection badge conditions are met */}
                    {showProfileBadge && (
                        <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full"></span>
                    )}
                </Link>
            </div>
        </div>
    );
}

export default NavigationBar;
