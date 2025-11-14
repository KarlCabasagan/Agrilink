import { createContext, useState, useCallback, useEffect } from "react";
import supabase from "../SupabaseClient.jsx";

export const CartCountContext = createContext({
    cartCount: 0,
    updateCartCount: async () => {},
    setCartCount: () => {},
});

export function CartCountProvider({ children, user }) {
    const [cartCount, setCartCount] = useState(0);

    // Initialize cart count when user changes
    useEffect(() => {
        const initializeCartCount = async () => {
            if (!user) {
                setCartCount(0);
                return;
            }

            try {
                // Get user's cart first
                const { data: userCart, error: cartError } = await supabase
                    .from("carts")
                    .select("id")
                    .eq("user_id", user.id)
                    .single();

                // Treat 406/401/403 as "no accessible cart" (non-consumer role)
                if (
                    cartError &&
                    [406, 401, 403, "PGRST116"].includes(cartError.code)
                ) {
                    setCartCount(0);
                    return;
                }

                if (cartError) {
                    console.error("Error fetching cart:", cartError);
                    setCartCount(0);
                    return;
                }

                if (!userCart) {
                    setCartCount(0);
                    return;
                }

                // Get cart items count
                const { data, error } = await supabase
                    .from("cart_items")
                    .select("id")
                    .eq("cart_id", userCart.id);

                if (error) {
                    console.error("Error fetching cart items:", error);
                    setCartCount(0);
                    return;
                }

                setCartCount(data?.length || 0);
            } catch (error) {
                console.error("Error initializing cart count:", error);
                setCartCount(0);
            }
        };

        initializeCartCount();
    }, [user]);

    // Update cart count by fetching fresh count from server
    const updateCartCount = useCallback(async (userId) => {
        if (!userId) {
            setCartCount(0);
            return;
        }

        try {
            // Get user's cart first
            const { data: userCart, error: cartError } = await supabase
                .from("carts")
                .select("id")
                .eq("user_id", userId)
                .single();

            // Treat 406/401/403 as "no accessible cart" (non-consumer role)
            if (
                cartError &&
                [406, 401, 403, "PGRST116"].includes(cartError.code)
            ) {
                setCartCount(0);
                return;
            }

            if (cartError) {
                console.error("Error fetching cart:", cartError);
                setCartCount(0);
                return;
            }

            if (!userCart) {
                setCartCount(0);
                return;
            }

            // Get cart items count
            const { data, error } = await supabase
                .from("cart_items")
                .select("id")
                .eq("cart_id", userCart.id);

            if (error) {
                console.error("Error fetching cart items:", error);
                setCartCount(0);
                return;
            }

            setCartCount(data?.length || 0);
        } catch (error) {
            console.error("Error updating cart count:", error);
            setCartCount(0);
        }
    }, []);

    // Set up background sync every 30 seconds
    useEffect(() => {
        if (!user) return;

        const interval = setInterval(() => {
            updateCartCount(user.id);
        }, 30000);

        return () => clearInterval(interval);
    }, [user, updateCartCount]);

    return (
        <CartCountContext.Provider
            value={{ cartCount, setCartCount, updateCartCount }}
        >
            {children}
        </CartCountContext.Provider>
    );
}
