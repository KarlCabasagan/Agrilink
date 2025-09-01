import { useState, useEffect, createContext, useContext } from "react";
import {
    BrowserRouter as Router,
    Routes,
    Route,
    Navigate,
} from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AccountVerified from "./pages/AccountVerified";
import Favorites from "./pages/Favorites";
import Profile from "./pages/Profile";
import Product from "./pages/Product";
import supabase from "./SupabaseClient.jsx";
import VerifyAccount from "./pages/VerifyAccount.jsx";
import LoadingScreen from "./components/LoadingScreen.jsx";
import EditProfile from "./pages/EditProfile.jsx";
import PasswordReset from "./pages/PasswordReset.jsx";

export const AuthContext = createContext({ user: null, setUser: () => {} });

function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const session = supabase.auth.getSession
            ? null
            : supabase.auth.session && supabase.auth.session();
        if (session && session.user) {
            setUser(session.user);
        }
        const { data: listener } = supabase.auth.onAuthStateChange?.(
            (event, session) => {
                setUser(session?.user || null);
            }
        ) || { data: {} };
        const timer = setTimeout(() => setLoading(false), 1000);
        return () => {
            if (listener && listener.subscription)
                listener.subscription.unsubscribe();
            clearTimeout(timer);
        };
    }, []);

    if (loading) {
        return <LoadingScreen />;
    }

    // Route guards
    const isVerified = user && (user.email_confirmed_at || user.confirmed_at);
    const PrivateRoute = ({ children }) =>
        user && isVerified ? (
            children
        ) : user && !isVerified ? (
            <Navigate to="/verify-account" replace />
        ) : (
            <Navigate to="/" replace />
        );

    const AuthRoute = ({ children, allowUnverified = false }) => {
        if (!user) return children;
        if (allowUnverified && !isVerified) return children;
        return <Navigate to="/" replace />;
    };

    return (
        <AuthContext.Provider value={{ user, setUser }}>
            <Router>
                <Routes>
                    <Route
                        path="/"
                        element={
                            user ? (
                                isVerified ? (
                                    <Home />
                                ) : (
                                    <Navigate to="/verify-account" replace />
                                )
                            ) : (
                                <Login />
                            )
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
                        path="/account-verified"
                        element={
                            <PrivateRoute>
                                <AccountVerified />
                            </PrivateRoute>
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
                    <Route
                        path="/favorites"
                        element={
                            <PrivateRoute>
                                <Favorites />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/profile"
                        element={
                            <PrivateRoute>
                                <Profile />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/product/:id"
                        element={
                            <PrivateRoute>
                                <Product />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/edit-profile"
                        element={
                            <PrivateRoute>
                                <EditProfile />
                            </PrivateRoute>
                        }
                    />
                    <Route path="/reset-password" element={<PasswordReset />} />
                </Routes>
            </Router>
        </AuthContext.Provider>
    );
}

export default App;
