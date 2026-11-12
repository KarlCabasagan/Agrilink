import { Icon } from "@iconify/react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext.jsx";
import { AdminPendingCountsContext } from "../context/AdminPendingCountsContext.jsx";
import supabase from "../SupabaseClient.jsx";
import full_logo from "../assets/full_logo.png";

function AdminNavigationBar() {
    const location = useLocation();
    const navigate = useNavigate();
    const { setUser } = useContext(AuthContext);
    const { pendingApplicationsCount, pendingProductsCount } = useContext(
        AdminPendingCountsContext
    );

    const isActive = (path) => {
        if (path === "/") {
            return location.pathname === "/" || location.pathname === "/admin" || location.pathname === "/admin/dashboard";
        }
        return location.pathname.startsWith(path);
    };

    const handleLogout = async () => {
        try {
            await supabase.auth.signOut();
            setUser(null);
            navigate("/login");
        } catch (error) {
            console.error("Error logging out:", error);
        }
    };

    const navItems = [
        {
            path: "/",
            icon: "mingcute:home-1-line",
            activeIcon: "mingcute:home-1-fill",
            label: "Dashboard",
        },
        {
            path: "/admin/users",
            icon: "mingcute:group-line",
            activeIcon: "mingcute:group-fill",
            label: "Users",
            badge: pendingApplicationsCount,
        },
        {
            path: "/admin/products",
            icon: "mingcute:box-2-line",
            activeIcon: "mingcute:box-2-fill",
            label: "Products",
            badge: pendingProductsCount,
        },
        {
            path: "/admin/transactions",
            icon: "mingcute:history-anticlockwise-line",
            activeIcon: "mingcute:history-anticlockwise-fill",
            label: "Transactions",
        },
        {
            path: "/admin/crops",
            icon: "mingcute:leaf-line",
            activeIcon: "mingcute:leaf-fill",
            label: "Crops",
        },
    ];

    return (
        <>
            {/* DESKTOP TOP HEADER (>= 768px) */}
            <header className="hidden md:block fixed top-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/90 z-50 shadow-2xs">
                <div className="max-w-6xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between">
                    {/* Logo & Admin Portal Badge */}
                    <div className="flex items-center gap-3">
                        <Link
                            to="/"
                            className="flex items-center gap-2 active:scale-95 transition-transform"
                        >
                            <img
                                src={full_logo}
                                alt="Agrilink"
                                className="h-8 w-auto object-contain"
                            />
                        </Link>
                        <span className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-[11px] font-semibold text-emerald-800">
                            <Icon
                                icon="mingcute:shield-check-fill"
                                width="13"
                                height="13"
                            />
                            <span>Admin Portal</span>
                        </span>
                    </div>

                    {/* Desktop Navigation Links */}
                    <nav className="flex items-center gap-1">
                        {navItems.map((item) => {
                            const active = isActive(item.path);
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`relative inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 min-h-[40px] ${
                                        active
                                            ? "bg-emerald-50 text-emerald-800"
                                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                                    }`}
                                >
                                    <Icon
                                        icon={
                                            active
                                                ? item.activeIcon
                                                : item.icon
                                        }
                                        width="18"
                                        height="18"
                                    />
                                    <span>{item.label}</span>
                                    {item.badge > 0 && (
                                        <span className="bg-emerald-800 text-white text-[10px] font-bold tabular-nums min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full shadow-2xs">
                                            {item.badge > 99
                                                ? "99+"
                                                : item.badge}
                                        </span>
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Right Action: Logout */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleLogout}
                            className="relative min-h-[40px] px-3 py-2 flex items-center gap-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50/80 border border-transparent hover:border-rose-200/70 transition-all duration-150 cursor-pointer active:scale-[0.98]"
                            aria-label="Admin Logout"
                        >
                            <Icon
                                icon="mingcute:exit-line"
                                width="17"
                                height="17"
                            />
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* MOBILE BOTTOM NAVIGATION (< 768px) */}
            <nav
                className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md shadow-[0_-4px_20px_rgba(0,0,0,0.04)] border-t border-slate-200 z-50"
                aria-label="Admin Mobile Navigation"
            >
                <div className="flex justify-around items-center h-full px-2 max-w-lg mx-auto">
                    {navItems.map((item) => {
                        const active = isActive(item.path);
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`relative flex flex-col items-center justify-center min-w-[48px] min-h-[44px] py-1 px-1.5 rounded-xl transition-all duration-150 active:scale-95 ${
                                    active
                                        ? "bg-emerald-700 text-white shadow-xs"
                                        : "text-slate-600 hover:text-emerald-800 hover:bg-slate-100/70"
                                }`}
                            >
                                <Icon
                                    icon={active ? item.activeIcon : item.icon}
                                    width="20"
                                    height="20"
                                />
                                <span className="text-[10px] mt-0.5 font-medium leading-none">
                                    {item.label}
                                </span>
                                {item.badge > 0 && (
                                    <span
                                        className={`absolute top-1 right-1.5 text-[10px] font-bold tabular-nums min-w-[16px] h-[16px] px-0.5 flex items-center justify-center rounded-full shadow-2xs ${
                                            active
                                                ? "bg-white text-emerald-800"
                                                : "bg-emerald-700 text-white"
                                        }`}
                                    >
                                        {item.badge > 9 ? "9+" : item.badge}
                                    </span>
                                )}
                            </Link>
                        );
                    })}

                    {/* Mobile Logout Button */}
                    <button
                        onClick={handleLogout}
                        className="relative flex flex-col items-center justify-center min-w-[48px] min-h-[44px] py-1 px-1.5 rounded-xl transition-all duration-150 text-rose-600 hover:text-rose-700 hover:bg-rose-50 active:scale-95 cursor-pointer"
                        aria-label="Admin Logout"
                    >
                        <Icon
                            icon="mingcute:exit-line"
                            width="20"
                            height="20"
                        />
                        <span className="text-[10px] mt-0.5 font-medium leading-none">
                            Logout
                        </span>
                    </button>
                </div>
            </nav>
        </>
    );
}

export default AdminNavigationBar;
