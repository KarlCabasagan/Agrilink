import { createContext, useState, useCallback, useEffect } from "react";
import { getCartCount } from "../utils/cartUtils.js";

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
            if (user) {
                const count = await getCartCount(user.id);
                setCartCount(count);
            } else {
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
            const count = await getCartCount(userId);
            setCartCount(count);
        } catch (error) {
            console.error("Error updating cart count:", error);
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
        <CartCountContext.Provider value={{ cartCount, setCartCount, updateCartCount }}>
            {children}
        </CartCountContext.Provider>
    );
}
