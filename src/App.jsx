import {
    useState,
    useEffect,
    createContext,
    useCallback,
    useMemo,
} from "react";
import {
    BrowserRouter as Router,
    Routes,
    Route,
    Navigate,
} from "react-router-dom";

import Home from "./pages/consumer/Home";
import ProducerHome from "./pages/producer/ProducerHome";
import ProducerProduct from "./pages/producer/ProducerProduct";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AccountVerified from "./pages/AccountVerified";
import Favorites from "./pages/consumer/Favorites";
import Profile from "./pages/consumer/Profile";
import SellerApplication from "./pages/consumer/SellerApplication";
import ProducerProfile from "./pages/producer/ProducerProfile";
import Product from "./pages/consumer/Product";
import Cart from "./pages/consumer/Cart";
import Messages from "./pages/consumer/Messages";
import ProducerMessages from "./pages/producer/ProducerMessages";
import Orders from "./pages/producer/Orders";
import CropRecommendation from "./pages/producer/CropRecommendation";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUserManagement from "./pages/admin/AdminUserManagement";
import AdminProductManagement from "./pages/admin/AdminProductManagement";
import AdminProductReviews from "./pages/admin/AdminProductReviews";
import AdminMessages from "./pages/admin/AdminMessages";
import AdminLogs from "./pages/admin/AdminLogs";
import AdminCropManagement from "./pages/admin/AdminCropManagement";
import FarmingGuides from "./pages/producer/FarmingGuides";
import ThesisOnlyPage from "./pages/ThesisOnlyPage";
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
    const fetchUserRole = useCallback(async (userId) => {
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
    }, []);

    useEffect(() => {
        let mounted = true;

        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!mounted) return;

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
            if (!mounted) return;

            const sessionUser = session?.user || null;
            setUser(sessionUser);

            if (sessionUser) {
                fetchUserRole(sessionUser.id);
            } else {
                setUserRole(null);
                setLoading(false);
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, [fetchUserRole]);

    // Prevent unnecessary re-renders on page visibility changes
    useEffect(() => {
        const handleVisibilityChange = () => {
            // Only log the visibility change, don't trigger any auth state updates
            if (document.visibilityState === "visible") {
                console.log(
                    "Page became visible - not triggering auth refresh"
                );
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            document.removeEventListener(
                "visibilitychange",
                handleVisibilityChange
            );
        };
    }, []);

    // Set loading to false after role is fetched
    useEffect(() => {
        if (user && userRole !== null) {
            setLoading(false);
        } else if (!user) {
            setLoading(false);
        }
    }, [user, userRole]);

    // Memoize auth context value to prevent unnecessary re-renders
    const authContextValue = useMemo(
        () => ({
            user,
            setUser,
            userRole,
            setUserRole,
        }),
        [user, userRole]
    );

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
        <AuthContext.Provider value={authContextValue}>
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
                        path="/seller-application"
                        element={
                            <RoleGuard allowedRoles={[1]}>
                                <SellerApplication />
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
                        path="/producer/product/:id"
                        element={
                            <RoleGuard allowedRoles={[2]}>
                                <ProducerProduct />
                            </RoleGuard>
                        }
                    />
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
                    <Route
                        path="/farming-guides"
                        element={
                            <RoleGuard allowedRoles={[2]}>
                                <FarmingGuides />
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
                        path="/admin/dashboard"
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
                        path="/admin/products/:productId/reviews"
                        element={
                            <RoleGuard allowedRoles={[3]}>
                                <AdminProductReviews />
                            </RoleGuard>
                        }
                    />
                    <Route
                        path="/admin/messages"
                        element={
                            <RoleGuard allowedRoles={[3]}>
                                <AdminMessages />
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
                    <Route
                        path="/business-settings"
                        element={
                            <PrivateRoute>
                                <ThesisOnlyPage />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/sales-analytics"
                        element={
                            <PrivateRoute>
                                <ThesisOnlyPage />
                            </PrivateRoute>
                        }
                    />
                </Routes>
            </Router>
        </AuthContext.Provider>
    );
}

export default App;
