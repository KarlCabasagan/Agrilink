import { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AccountVerified from "./pages/AccountVerified";
import Favorites from "./pages/Favorites";
import Profile from "./pages/Profile";
import Product from "./pages/Product";
import supabase from "./SupabaseClient.jsx";

function App() {
  const [user, setUser] = useState(true);

  return (
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
  );
}

export default App;
