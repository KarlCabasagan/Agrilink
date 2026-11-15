import { useContext } from "react";
import { Outlet } from "react-router-dom";
import { AuthContext } from "../context/AuthContext.jsx";
import { NavigationLayoutContext } from "../context/NavigationLayoutContext.jsx";
import NavigationBar from "./NavigationBar.jsx";
import ProducerNavigationBar from "./ProducerNavigationBar.jsx";
import AdminNavigationBar from "./AdminNavigationBar.jsx";

function PersistentLayout({ children, roleOverride }) {
    const { userRole } = useContext(AuthContext);
    const activeRole = roleOverride ?? userRole;

    return (
        <NavigationLayoutContext.Provider value={{ isPersistentLayoutActive: true }}>
            {activeRole === 1 && <NavigationBar isRootPersistent={true} />}
            {activeRole === 2 && <ProducerNavigationBar isRootPersistent={true} />}
            {activeRole === 3 && <AdminNavigationBar isRootPersistent={true} />}
            <div className="min-h-screen w-full flex flex-col">
                {children || <Outlet />}
            </div>
        </NavigationLayoutContext.Provider>
    );
}

export default PersistentLayout;
