import supabase from "../SupabaseClient.jsx";

/**
 * Add item to cart or update quantity if already exists
 * @param {string} userId - The user's ID
 * @param {number} productId - The product ID to add
 * @param {number} quantity - The quantity to add
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const addToCart = async (userId, productId, quantity = 1.0) => {
    if (!userId || !productId) {
        return { success: false, message: "Missing required information" };
    }

    try {
        // First ensure user has a cart
        let { data: userCart, error: cartError } = await supabase
            .from("carts")
            .select("id")
            .eq("user_id", userId)
            .single();

        if (cartError && cartError.code === "PGRST116") {
            // No cart exists, create one
            const { data: newCart, error: createError } = await supabase
                .from("carts")
                .insert({ user_id: userId, status_id: 1 })
                .select()
                .single();

            if (createError) {
                console.error("Error creating cart:", createError);
                return { success: false, message: "Error creating cart" };
            }
            userCart = newCart;
        } else if (cartError) {
            console.error("Error fetching cart:", cartError);
            return { success: false, message: "Error checking cart" };
        }

        // Check if item already exists in cart
        const { data: existingItem, error: fetchError } = await supabase
            .from("cart_items")
            .select("*")
            .eq("cart_id", userCart.id)
            .eq("product_id", productId)
            .single();

        if (fetchError && fetchError.code !== "PGRST116") {
            console.error("Error checking existing cart item:", fetchError);
            return { success: false, message: "Error checking cart" };
        }

        if (existingItem) {
            // Update existing item quantity
            const newQuantity =
                parseFloat(existingItem.quantity) + parseFloat(quantity);

            const { error: updateError } = await supabase
                .from("cart_items")
                .update({ quantity: newQuantity })
                .eq("id", existingItem.id);

            if (updateError) {
                console.error("Error updating cart item:", updateError);
                return { success: false, message: "Error updating cart" };
            }

            return { success: true, message: "Cart updated successfully" };
        } else {
            // Insert new item
            const { error: insertError } = await supabase
                .from("cart_items")
                .insert({
                    cart_id: userCart.id,
                    product_id: productId,
                    quantity: parseFloat(quantity),
                });

            if (insertError) {
                console.error("Error adding to cart:", insertError);
                return { success: false, message: "Error adding to cart" };
            }

            return { success: true, message: "Added to cart successfully" };
        }
    } catch (error) {
        console.error("Unexpected error:", error);
        return { success: false, message: "Unexpected error occurred" };
    }
};

/**
 * Get cart items count for a user
 * @param {string} userId - The user's ID
 * @returns {Promise<number>} - Number of distinct items in cart
 */
export const getCartCount = async (userId) => {
    if (!userId) return 0;

    try {
        // Get user's cart first
        const { data: userCart, error: cartError } = await supabase
            .from("carts")
            .select("id")
            .eq("user_id", userId)
            .single();

        if (cartError || !userCart) {
            return 0; // No cart means no items
        }

        const { data, error } = await supabase
            .from("cart_items")
            .select("id")
            .eq("cart_id", userCart.id);

        if (error) {
            console.error("Error fetching cart count:", error);
            return 0;
        }

        return data.length; // Count number of distinct items, not quantity
    } catch (error) {
        console.error("Error calculating cart count:", error);
        return 0;
    }
};

/**
 * Clear entire cart for a user
 * @param {string} userId - The user's ID
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const clearCart = async (userId) => {
    if (!userId) {
        return { success: false, message: "User ID required" };
    }

    try {
        // Get user's cart first
        const { data: userCart, error: cartError } = await supabase
            .from("carts")
            .select("id")
            .eq("user_id", userId)
            .single();

        if (cartError || !userCart) {
            return { success: true, message: "No cart to clear" }; // Already empty
        }

        const { error } = await supabase
            .from("cart_items")
            .delete()
            .eq("cart_id", userCart.id);

        if (error) {
            console.error("Error clearing cart:", error);
            return { success: false, message: "Error clearing cart" };
        }

        return { success: true, message: "Cart cleared successfully" };
    } catch (error) {
        console.error("Unexpected error:", error);
        return { success: false, message: "Unexpected error occurred" };
    }
};
