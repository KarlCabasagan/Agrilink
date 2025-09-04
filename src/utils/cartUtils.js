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
        // First check if item already exists in cart
        const { data: existingItem, error: fetchError } = await supabase
            .from("cart_items")
            .select("*")
            .eq("user_id", userId)
            .eq("product_id", productId)
            .single();

        if (fetchError && fetchError.code !== "PGRST116") {
            // PGRST116 means no rows found, which is fine
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
                    user_id: userId,
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
 * @returns {Promise<number>} - Total quantity in cart
 */
export const getCartCount = async (userId) => {
    if (!userId) return 0;

    try {
        const { data, error } = await supabase
            .from("cart_items")
            .select("quantity")
            .eq("user_id", userId);

        if (error) {
            console.error("Error fetching cart count:", error);
            return 0;
        }

        return data.reduce(
            (total, item) => total + parseFloat(item.quantity),
            0
        );
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
        const { error } = await supabase
            .from("cart_items")
            .delete()
            .eq("user_id", userId);

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
