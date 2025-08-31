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
import VerifyAccount from "./pages/VerifyAccount.jsx";
import LoadingScreen from "./components/LoadingScreen.jsx";

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
          <Route path="/verify-account" element={<VerifyAccount />} />
        </Routes>
      </Router>
    </AuthContext.Provider>
  );
}

export default App;
