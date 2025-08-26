import { Link, useLocation } from "react-router-dom";
import { Icon } from "@iconify/react";

function NavigationBar() {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;
  return (
    <div className="fixed bottom-0 left-0 w-full bg-white shadow-md z-[1000]">
      <div className="flex justify-around items-center py-2">
        <Link
          to="/"
          className={`flex flex-col items-center ${
            isActive("/") ? "text-primary" : "text-gray-600"
          } hover:text-primary transition-colors`}
        >
          <Icon icon="ic:baseline-home" width="28" height="28" />
          <span className="text-xs mt-1">Home</span>
        </Link>
        <Link
          to="/favorites"
          className={`flex flex-col items-center ${
            isActive("/favorites") ? "text-primary" : "text-gray-600"
          } hover:text-primary transition-colors`}
        >
          <Icon icon="ic:baseline-favorite-border" width="28" height="28" />
          <span className="text-xs mt-1">Favorites</span>
        </Link>
        <Link
          to="/profile"
          className={`flex flex-col items-center ${
            isActive("/profile") ? "text-primary" : "text-gray-600"
          } hover:text-primary transition-colors`}
        >
          <Icon icon="ic:baseline-person-outline" width="28" height="28" />
          <span className="text-xs mt-1">Profile</span>
        </Link>
      </div>
    </div>
  );
}

export default NavigationBar;
