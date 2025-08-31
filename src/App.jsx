import { useState, useEffect, createContext, useContext } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AccountVerified from "./pages/AccountVerified";
import Favorites from "./pages/Favorites";
import Profile from "./pages/Profile";
import Product from "./pages/Product";
import supabase from "./SupabaseClient.jsx";

// Create AuthContext
export const AuthContext = createContext({ user: null, setUser: () => {} });

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check for existing session on mount
    const session = supabase.auth.getSession
      ? null // v2 API: getSession is async, so skip for now
      : supabase.auth.session && supabase.auth.session();
    if (session && session.user) {
      setUser(session.user);
    }
    // Listen for auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange?.(
      (event, session) => {
        setUser(session?.user || null);
      }
    ) || { data: {} };
    return () => {
      if (listener && listener.subscription)
        listener.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      <Router>
        <Routes>
          <Route path="/" element={user ? <Home /> : <Login />} />
          <Route path="/register" element={user ? <Home /> : <Register />} />
          <Route path="/account-verified" element={<AccountVerified />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/product/:id" element={<Product />} />
        </Routes>
      </Router>
    </AuthContext.Provider>
  );
}

export default App;
