import { useState, useEffect, createContext } from "react";
import {
    BrowserRouter as Router,
    Routes,
    Route,
    Navigate,
} from "react-router-dom";

import Home from "./pages/Home";
import ProducerHome from "./pages/ProducerHome";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AccountVerified from "./pages/AccountVerified";
import Favorites from "./pages/Favorites";
import Profile from "./pages/Profile";
import ProducerProfile from "./pages/ProducerProfile";
import Product from "./pages/Product";
import Cart from "./pages/Cart";
import Messages from "./pages/Messages";
import ProducerMessages from "./pages/ProducerMessages";
import Orders from "./pages/Orders";
import CropRecommendation from "./pages/CropRecommendation";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUserManagement from "./pages/AdminUserManagement";
import AdminProductManagement from "./pages/AdminProductManagement";
import AdminLogs from "./pages/AdminLogs";
import AdminCropManagement from "./pages/AdminCropManagement";
import supabase from "./SupabaseClient.jsx";
import VerifyAccount from "./pages/VerifyAccount.jsx";
import EditProfile from "./pages/EditProfile.jsx";
import PasswordReset from "./pages/PasswordReset.jsx";

export const AuthContext = createContext({
    user: null,
    setUser: () => {},
    userRole: null,
    setUserRole: () => {},
});

function App() {
    const [user, setUser] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [loading, setLoading] = useState(true);

    // Fetch user role from profiles table
    const fetchUserRole = async (userId) => {
        try {
            const { data, error } = await supabase
                .from("profiles")
                .select("role_id")
                .eq("id", userId)
                .single();

            if (data) {
                setUserRole(data.role_id);
            } else if (error && error.code === "PGRST116") {
                // No profile found, default to Consumer role
                setUserRole(1);
            }
        } catch (error) {
            console.error("Error fetching user role:", error);
            setUserRole(1); // Default to Consumer role
        }
    };

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            const sessionUser = session?.user || null;
            setUser(sessionUser);

            if (sessionUser) {
                fetchUserRole(sessionUser.id);
            } else {
                setLoading(false);
            }
        });

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
            const sessionUser = session?.user || null;
            setUser(sessionUser);

            if (sessionUser) {
                fetchUserRole(sessionUser.id);
            } else {
                setUserRole(null);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    // Set loading to false after role is fetched
    useEffect(() => {
        if (user && userRole !== null) {
            setLoading(false);
        } else if (!user) {
            setLoading(false);
        }
    }, [user, userRole]);

    if (loading) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-background">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
            </div>
        );
    }

    const isVerified = user && (user.email_confirmed_at || user.confirmed_at);

    const PrivateRoute = ({ children }) =>
        user && isVerified ? (
            children
        ) : user && !isVerified ? (
            <Navigate to="/verify-account" replace />
        ) : (
            <Navigate to="/login" replace />
        );

    const AuthRoute = ({ children, allowUnverified = false }) => {
        if (!user) return children;
        if (allowUnverified && !isVerified) return children;
        return <Navigate to="/" replace />;
    };

    // Role-based access control
    const RoleGuard = ({ children, allowedRoles }) => {
        if (!user || !isVerified) {
            return <Navigate to="/login" replace />;
        }

        if (!allowedRoles.includes(userRole)) {
            return <Navigate to="/" replace />;
        }

        return children;
    };

    // Role-based components
    const RoleBasedHome = () => {
        if (userRole === 3) {
            // Admin
            return <AdminDashboard />;
        } else if (userRole === 2) {
            // Producer
            return <ProducerHome />;
        }
        return <Home />; // Consumer (role 1) or default
    };

    const RoleBasedProfile = () => {
        if (userRole === 2) {
            // Producer
            return <ProducerProfile />;
        }
        return <Profile />; // Consumer (role 1) or Admin default
    };

    const RoleBasedMessages = () => {
        if (userRole === 2) {
            // Producer
            return <ProducerMessages />;
        }
        return <Messages />; // Consumer (role 1) or default
    };

    return (
        <AuthContext.Provider value={{ user, setUser, userRole, setUserRole }}>
            <Router>
                <Routes>
                    <Route
                        path="/login"
                        element={
                            <AuthRoute>
                                <Login />
                            </AuthRoute>
                        }
                    />
                    <Route
                        path="/register"
                        element={
                            <AuthRoute>
                                <Register />
                            </AuthRoute>
                        }
                    />
                    <Route
                        path="/verify-account"
                        element={
                            <AuthRoute allowUnverified={true}>
                                <VerifyAccount />
                            </AuthRoute>
                        }
                    />
                    <Route path="/reset-password" element={<PasswordReset />} />
                    <Route
                        path="/account-verified"
                        element={
                            <PrivateRoute>
                                <AccountVerified />
                            </PrivateRoute>
                        }
                    />

                    {/* Role-based routes */}
                    <Route
                        path="/"
                        element={
                            <PrivateRoute>
                                <RoleBasedHome />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/profile"
                        element={
                            <PrivateRoute>
                                <RoleBasedProfile />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/messages"
                        element={
                            <PrivateRoute>
                                <RoleBasedMessages />
                            </PrivateRoute>
                        }
                    />

                    {/* Consumer-only routes */}
                    <Route
                        path="/favorites"
                        element={
                            <RoleGuard allowedRoles={[1]}>
                                <Favorites />
                            </RoleGuard>
                        }
                    />
                    <Route
                        path="/cart"
                        element={
                            <RoleGuard allowedRoles={[1]}>
                                <Cart />
                            </RoleGuard>
                        }
                    />
                    <Route
                        path="/product/:id"
                        element={
                            <RoleGuard allowedRoles={[1]}>
                                <Product />
                            </RoleGuard>
                        }
                    />

                    {/* Producer-only routes */}
                    <Route
                        path="/orders"
                        element={
                            <RoleGuard allowedRoles={[2]}>
                                <Orders />
                            </RoleGuard>
                        }
                    />
                    <Route
                        path="/crop-recommendation"
                        element={
                            <RoleGuard allowedRoles={[2]}>
                                <CropRecommendation />
                            </RoleGuard>
                        }
                    />

                    {/* Admin-only routes */}
                    <Route
                        path="/admin"
                        element={
                            <RoleGuard allowedRoles={[3]}>
                                <AdminDashboard />
                            </RoleGuard>
                        }
                    />
                    <Route
                        path="/admin/users"
                        element={
                            <RoleGuard allowedRoles={[3]}>
                                <AdminUserManagement />
                            </RoleGuard>
                        }
                    />
                    <Route
                        path="/admin/products"
                        element={
                            <RoleGuard allowedRoles={[3]}>
                                <AdminProductManagement />
                            </RoleGuard>
                        }
                    />
                    <Route
                        path="/admin/logs"
                        element={
                            <RoleGuard allowedRoles={[3]}>
                                <AdminLogs />
                            </RoleGuard>
                        }
                    />
                    <Route
                        path="/admin/crops"
                        element={
                            <RoleGuard allowedRoles={[3]}>
                                <AdminCropManagement />
                            </RoleGuard>
                        }
                    />

                    {/* Shared routes */}
                    <Route
                        path="/edit-profile"
                        element={
                            <PrivateRoute>
                                <EditProfile />
                            </PrivateRoute>
                        }
                    />
                </Routes>
            </Router>
        </AuthContext.Provider>
    );
}

export default App;
