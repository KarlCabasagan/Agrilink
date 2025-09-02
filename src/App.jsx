import { useState, useEffect, createContext } from "react";
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
import EditProfile from "./pages/EditProfile.jsx";
import PasswordReset from "./pages/PasswordReset.jsx";

export const AuthContext = createContext({ user: null, setUser: () => {} });

function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user || null);
            setLoading(false);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event, session) => {
                setUser(session?.user || null);
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    if (loading) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-background">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
            </div>
        );
    }

    const isVerified = user && (user.email_confirmed_at || user.confirmed_at);
    
    const PrivateRoute = ({ children }) =>
        user && isVerified ? children : user && !isVerified ? (
            <Navigate to="/verify-account" replace />
        ) : (
            <Navigate to="/login" replace />
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
                    <Route path="/login" element={<AuthRoute><Login /></AuthRoute>} />
                    <Route path="/register" element={<AuthRoute><Register /></AuthRoute>} />
                    <Route path="/verify-account" element={<AuthRoute allowUnverified={true}><VerifyAccount /></AuthRoute>} />
                    <Route path="/reset-password" element={<PasswordReset />} />
                    <Route path="/account-verified" element={<PrivateRoute><AccountVerified /></PrivateRoute>} />
                    <Route path="/" element={<PrivateRoute><Home /></PrivateRoute>} />
                    <Route path="/favorites" element={<PrivateRoute><Favorites /></PrivateRoute>} />
                    <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
                    <Route path="/edit-profile" element={<PrivateRoute><EditProfile /></PrivateRoute>} />
                    <Route path="/product/:id" element={<PrivateRoute><Product /></PrivateRoute>} />
                </Routes>
            </Router>
        </AuthContext.Provider>
    );
}

export default App;
