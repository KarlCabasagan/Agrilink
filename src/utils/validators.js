/**
 * Pure validation helpers for trust boundary inputs
 */

export const validateCartInput = (userId, productId, quantity) => {
    if (!userId || typeof userId !== "string" || userId.trim() === "") {
        return { valid: false, error: "Missing or invalid user ID" };
    }

    const parsedProductId = Number(productId);
    if (!productId || isNaN(parsedProductId) || parsedProductId <= 0 || !Number.isInteger(parsedProductId)) {
        return { valid: false, error: "Invalid product ID" };
    }

    const parsedQty = Number(quantity);
    if (isNaN(parsedQty) || parsedQty <= 0) {
        return { valid: false, error: "Quantity must be greater than zero" };
    }

    return { valid: true, sanitizedQuantity: parsedQty };
};

export const validateImageFile = (file) => {
    if (!file) {
        return { valid: false, error: "No file selected" };
    }

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
        return {
            valid: false,
            error: "Invalid file type. Only JPEG, PNG, and WebP images are allowed.",
        };
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
        return {
            valid: false,
            error: "File size too large. Maximum size is 5MB.",
        };
    }

    return { valid: true };
};
