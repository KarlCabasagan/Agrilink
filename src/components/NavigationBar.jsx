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

        checkOrderStatus();

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
                () => checkOrderStatus()
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

        checkSellerRejection();

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
                () => checkSellerRejection()
            )
            .subscribe();

        return () => {
            channel.unsubscribe();
        };
    }, [user?.id]);

    const showProfileBadge = hasOrdersWithStatus6 || hasSellerRejection;
    const isActive = (path) => location.pathname === path;

    const navLinks = [
        { path: "/", label: "Home", icon: "mingcute:home-2-line", activeIcon: "mingcute:home-2-fill" },
        { path: "/favorites", label: "Favorites", icon: "mingcute:heart-line", activeIcon: "mingcute:heart-fill" },
        { path: "/orders", label: "Orders", icon: "mingcute:truck-line", activeIcon: "mingcute:truck-fill", badge: hasOrdersWithStatus6 },
        { path: "/messages", label: "Messages", icon: "mingcute:message-3-line", activeIcon: "mingcute:message-3-fill", count: unreadConversationCount },
    ];

    return (
        <>
            {/* DESKTOP HEADER (>= 768px) */}
            <header className="hidden md:block fixed top-0 left-0 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 z-50 shadow-xs">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    {/* Brand */}
                    <Link to="/" className="flex items-center gap-2.5 group">
                        <img
                            src="/components/icon_logo.png"
                            alt="AgriLink"
                            className="w-8 h-8 object-contain transition-transform duration-150 group-hover:scale-105"
                        />
                        <div className="flex flex-col">
                            <span className="font-bold text-lg text-emerald-800 leading-tight tracking-tight">
                                AgriLink
                            </span>
                            <span className="text-[10px] uppercase tracking-wider text-emerald-700 font-medium">
                                Direct From Farms
                            </span>
                        </div>
                    </Link>

                    {/* Nav Items */}
                    <nav className="flex items-center gap-1">
                        {navLinks.map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`relative flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                                    isActive(item.path)
                                        ? "bg-emerald-50 text-emerald-800 shadow-xs"
                                        : "text-slate-600 hover:text-emerald-800 hover:bg-slate-50"
                                }`}
                            >
                                <Icon
                                    icon={isActive(item.path) ? item.activeIcon : item.icon}
                                    width="18"
                                    height="18"
                                />
                                <span>{item.label}</span>
                                {item.badge && (
                                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                                )}
                                {item.count > 0 && (
                                    <span className="bg-emerald-800 text-white text-[10px] font-bold tabular-nums min-w-[16px] h-[16px] px-1 flex items-center justify-center rounded-full">
                                        {item.count}
                                    </span>
                                )}
                            </Link>
                        ))}
                    </nav>

                    {/* Right Actions: Cart + Profile */}
                    <div className="flex items-center gap-2">
                        <Link
                            to="/cart"
                            className={`relative min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg transition-all duration-150 ${
                                isActive("/cart")
                                    ? "bg-emerald-50 text-emerald-800"
                                    : "text-slate-700 hover:text-emerald-800 hover:bg-slate-50"
                            }`}
                            aria-label={`Cart with ${cartCount} items`}
                        >
                            <Icon
                                icon={isActive("/cart") ? "mingcute:shopping-cart-1-fill" : "mingcute:shopping-cart-1-line"}
                                width="22"
                                height="22"
                            />
                            {cartCount > 0 && (
                                <span className="absolute top-1 right-1 bg-emerald-800 text-white text-[10px] font-bold tabular-nums min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full shadow-xs">
                                    {cartCount}
                                </span>
                            )}
                        </Link>

                        <Link
                            to="/profile"
                            className={`relative min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg transition-all duration-150 ${
                                isActive("/profile")
                                    ? "bg-emerald-50 text-emerald-800"
                                    : "text-slate-700 hover:text-emerald-800 hover:bg-slate-50"
                            }`}
                            aria-label="User Profile"
                        >
                            <Icon
                                icon={isActive("/profile") ? "mingcute:user-3-fill" : "mingcute:user-3-line"}
                                width="22"
                                height="22"
                            />
                            {showProfileBadge && (
                                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-500" />
                            )}
                        </Link>
                    </div>
                </div>
            </header>

            {/* MOBILE BOTTOM NAVIGATION (< 768px) */}
            <nav
                className="md:hidden fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-md shadow-[0_-4px_20px_rgba(0,0,0,0.04)] border-t border-slate-200 z-50"
                aria-label="Mobile Navigation"
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
                            icon={isActive("/") ? "mingcute:home-2-fill" : "mingcute:home-2-line"}
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
                            icon={isActive("/favorites") ? "mingcute:heart-fill" : "mingcute:heart-line"}
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
                            icon={isActive("/cart") ? "mingcute:shopping-cart-1-fill" : "mingcute:shopping-cart-1-line"}
                            width="22"
                            height="22"
                        />
                        <span className="text-[11px] mt-0.5 font-medium">Cart</span>
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
                            icon={isActive("/messages") ? "mingcute:message-3-fill" : "mingcute:message-3-line"}
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
                            icon={isActive("/profile") ? "mingcute:user-3-fill" : "mingcute:user-3-line"}
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
        </>
    );
}

export default NavigationBar;
