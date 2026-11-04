import { Link, useLocation } from "react-router-dom";
import { Icon } from "@iconify/react";
import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext.jsx";
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
        <nav
            className="fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-md shadow-[0_-4px_20px_rgba(0,0,0,0.04)] border-t border-slate-200 z-50"
            aria-label="Main Navigation"
        >
            <div className="flex justify-around items-center py-2 px-3 max-w-lg mx-auto">
                <Link
                    to="/"
                    className={`flex flex-col items-center min-w-[54px] min-h-[44px] py-1.5 px-3 rounded-xl transition-colors duration-150 ${
                        isActive("/")
                            ? "bg-emerald-700 text-white shadow-xs"
                            : "text-slate-600 hover:text-emerald-800 hover:bg-slate-100/70"
                    }`}
                >
                    <Icon
                        icon={
                            isActive("/")
                                ? "mingcute:home-2-fill"
                                : "mingcute:home-2-line"
                        }
                        width="22"
                        height="22"
                    />
                    <span className="text-[11px] mt-0.5 font-medium">Home</span>
                </Link>

                <Link
                    to="/favorites"
                    className={`flex flex-col items-center min-w-[54px] min-h-[44px] py-1.5 px-3 rounded-xl transition-colors duration-150 ${
                        isActive("/favorites")
                            ? "bg-emerald-700 text-white shadow-xs"
                            : "text-slate-600 hover:text-emerald-800 hover:bg-slate-100/70"
                    }`}
                >
                    <Icon
                        icon={
                            isActive("/favorites")
                                ? "mingcute:heart-fill"
                                : "mingcute:heart-line"
                        }
                        width="22"
                        height="22"
                    />
                    <span className="text-[11px] mt-0.5 font-medium">Favorites</span>
                </Link>

                <Link
                    to="/cart"
                    className={`flex flex-col items-center min-w-[54px] min-h-[44px] py-1.5 px-3 rounded-xl transition-colors duration-150 relative ${
                        isActive("/cart")
                            ? "bg-emerald-700 text-white shadow-xs"
                            : "text-slate-600 hover:text-emerald-800 hover:bg-slate-100/70"
                    }`}
                >
                    <Icon
                        icon={
                            isActive("/cart")
                                ? "mingcute:shopping-cart-1-fill"
                                : "mingcute:shopping-cart-1-line"
                        }
                        width="22"
                        height="22"
                    />
                    <span className="text-[11px] mt-0.5 font-medium">Cart</span>
                    {/* Cart badge */}
                    {cartCount > 0 && (
                        <span className="absolute top-1 right-2 bg-emerald-800 text-white text-[10px] font-bold tabular-nums min-w-[16px] h-[16px] px-0.5 flex items-center justify-center rounded-full shadow-xs">
                            {cartCount}
                        </span>
                    )}
                </Link>

                <Link
                    to="/messages"
                    className={`flex flex-col items-center min-w-[54px] min-h-[44px] py-1.5 px-3 rounded-xl transition-colors duration-150 relative ${
                        isActive("/messages")
                            ? "bg-emerald-700 text-white shadow-xs"
                            : "text-slate-600 hover:text-emerald-800 hover:bg-slate-100/70"
                    }`}
                >
                    <Icon
                        icon={
                            isActive("/messages")
                                ? "mingcute:message-3-fill"
                                : "mingcute:message-3-line"
                        }
                        width="22"
                        height="22"
                    />
                    <span className="text-[11px] mt-0.5 font-medium">Messages</span>
                    {unreadConversationCount > 0 && (
                        <span className="absolute top-1 right-2 bg-emerald-800 text-white text-[10px] font-bold tabular-nums min-w-[16px] h-[16px] px-0.5 flex items-center justify-center rounded-full shadow-xs">
                            {unreadConversationCount}
                        </span>
                    )}
                </Link>

                <Link
                    to="/profile"
                    className={`flex flex-col items-center min-w-[54px] min-h-[44px] py-1.5 px-3 rounded-xl transition-colors duration-150 relative ${
                        isActive("/profile")
                            ? "bg-emerald-700 text-white shadow-xs"
                            : "text-slate-600 hover:text-emerald-800 hover:bg-slate-100/70"
                    }`}
                >
                    <Icon
                        icon={
                            isActive("/profile")
                                ? "mingcute:user-3-fill"
                                : "mingcute:user-3-line"
                        }
                        width="22"
                        height="22"
                    />
                    <span className="text-[11px] mt-0.5 font-medium">Profile</span>
                    {showProfileBadge && (
                        <span className="absolute top-1.5 right-3 w-2 h-2 bg-amber-500 rounded-full" title="Action needed in profile" />
                    )}
                </Link>
            </div>
        </nav>
    );
}

export default NavigationBar;
