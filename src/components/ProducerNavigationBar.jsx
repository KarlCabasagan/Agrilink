import { Icon } from "@iconify/react";
import { Link, useLocation } from "react-router-dom";

function ProducerNavigationBar() {
    const location = useLocation();

    const isActive = (path) => {
        return location.pathname === path;
    };

    const navItems = [
        {
            path: "/",
            icon: "mingcute:home-1-line",
            activeIcon: "mingcute:home-1-fill",
            label: "Products",
        },
        {
            path: "/producer/orders",
            icon: "mingcute:box-2-line",
            activeIcon: "mingcute:box-2-line",
            label: "Orders",
            badge: 3, // Mock notification count
        },
        {
            path: "/producer/crop-recommendation",
            icon: "mingcute:chart-line-line",
            activeIcon: "mingcute:chart-line-fill",
            label: "Crops",
        },
        {
            path: "/producer/messages",
            icon: "mingcute:message-3-line",
            activeIcon: "mingcute:message-3-fill",
            label: "Messages",
            badge: 2, // Mock notification count
        },
        {
            path: "/producer/profile",
            icon: "mingcute:user-3-line",
            activeIcon: "mingcute:user-3-fill",
            label: "Profile",
        },
    ];

    return (
        <div className="fixed bottom-0 left-0 w-full bg-white shadow-lg border-t border-gray-200 z-[1000]">
            <div className="flex justify-around items-center py-3 px-4 max-w-md mx-auto">
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

export default ProducerNavigationBar;
