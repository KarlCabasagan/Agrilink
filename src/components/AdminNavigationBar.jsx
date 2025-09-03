import { Icon } from "@iconify/react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../App.jsx";
import supabase from "../SupabaseClient.jsx";

function AdminNavigationBar() {
    const location = useLocation();

    const isActive = (path) => {
        return location.pathname === path;
    };

    const navItems = [
        {
            path: "/admin",
            icon: "mingcute:home-1-line",
            activeIcon: "mingcute:home-1-fill",
            label: "Dashboard",
        },
        {
            path: "/admin/users",
            icon: "mingcute:group-line",
            activeIcon: "mingcute:group-fill",
            label: "Users",
            badge: 5, // Mock pending applications
        },
        {
            path: "/admin/products",
            icon: "mingcute:box-2-line",
            activeIcon: "mingcute:box-2-fill",
            label: "Products",
            badge: 3, // Mock pending products
        },
        {
            path: "/admin/logs",
            icon: "mingcute:history-anticlockwise-line",
            activeIcon: "mingcute:history-anticlockwise-fill",
            label: "Logs",
        },
        {
            path: "/admin/crops",
            icon: "mingcute:leaf-line",
            activeIcon: "mingcute:leaf-fill",
            label: "Crops",
        },
    ];

    return (
        <div className="fixed bottom-0 left-0 w-full bg-white shadow-lg border-t border-gray-200 z-[1000]">
            <div className="flex justify-around items-center py-3 px-4 max-w-lg mx-auto">
                {navItems.map((item) => (
                    <Link
                        key={item.path}
                        to={item.path}
                        className={`flex flex-col items-center min-w-[60px] py-2 px-3 rounded-lg transition-all duration-200 relative ${
                            isActive(item.path)
                                ? "bg-primary text-white shadow-md"
                                : "text-gray-600 hover:text-primary hover:bg-gray-50"
                        }`}
                    >
                        <Icon
                            icon={
                                isActive(item.path)
                                    ? item.activeIcon
                                    : item.icon
                            }
                            width="24"
                            height="24"
                        />
                        <span className="text-xs mt-1 font-medium">
                            {item.label}
                        </span>
                        {/* Notification badge */}
                        {item.badge && item.badge > 0 && (
                            <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                                {item.badge > 9 ? "9+" : item.badge}
                            </div>
                        )}
                    </Link>
                ))}
            </div>
        </div>
    );
}

export default AdminNavigationBar;
