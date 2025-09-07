import supabase from "../SupabaseClient";

/**
 * Uploads an image to Supabase Storage
 * @param {File} file - The image file to upload
 * @param {string} bucket - The storage bucket name ('products' or 'avatars')
 * @param {string} userId - The user's ID for organizing files
 * @param {string} oldImageUrl - Optional: URL of old image to delete
 * @returns {Promise<{success: boolean, url?: string, error?: string}>}
 */
export const uploadImage = async (file, bucket, userId, oldImageUrl = null) => {
    try {
        // Validate file
        if (!file) {
            return { success: false, error: "No file provided" };
        }

        // Validate userId
        if (!userId) {
            return { success: false, error: "User ID is required for upload" };
        }

        // Validate file type
        const allowedTypes = [
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/webp",
        ];
        if (!allowedTypes.includes(file.type)) {
            return {
                success: false,
                error: "Invalid file type. Only JPEG, PNG, and WebP images are allowed.",
            };
        }

        // Validate file size (5MB limit)
        const maxSize = 5 * 1024 * 1024; // 5MB in bytes
        if (file.size > maxSize) {
            return {
                success: false,
                error: "File size too large. Maximum size is 5MB.",
            };
        }

        // Delete old image if provided
        if (oldImageUrl) {
            await deleteImageFromUrl(oldImageUrl, bucket);
        }

        // Generate unique filename (simplified for RLS compatibility)
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random()
            .toString(36)
            .substr(2, 9)}.${fileExt}`;

        // Upload file
        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(fileName, file, {
                cacheControl: "3600",
                upsert: false,
            });

        if (error) {
            console.error("Upload error:", error);
            return { success: false, error: `Upload failed: ${error.message}` };
        }

        // Get public URL
        const {
            data: { publicUrl },
        } = supabase.storage.from(bucket).getPublicUrl(data.path);

        return { success: true, url: publicUrl };
    } catch (error) {
        console.error("Image upload error:", error);
        return { success: false, error: "Upload failed. Please try again." };
    }
};

/**
 * Deletes an image from Supabase Storage using its URL
 * @param {string} imageUrl - The full URL of the image
 * @param {string} bucket - The storage bucket name
 * @returns {Promise<boolean>} - Success status
 */
export const deleteImageFromUrl = async (imageUrl, bucket) => {
    try {
        if (!imageUrl) return true;

        // Extract file path from URL
        const urlParts = imageUrl.split("/");
        const bucketIndex = urlParts.findIndex((part) => part === bucket);

        if (bucketIndex === -1) return true; // URL doesn't contain bucket name

        const filePath = urlParts.slice(bucketIndex + 1).join("/");

        if (!filePath) return true;

        // Delete file
        const { error } = await supabase.storage
            .from(bucket)
            .remove([filePath]);

        if (error) {
            console.error("Delete error:", error);
            return false;
        }

        return true;
    } catch (error) {
        console.error("Error deleting image:", error);
        return false;
    }
};

/**
 * Compresses an image file before upload
 * @param {File} file - The image file to compress
 * @param {number} maxWidth - Maximum width in pixels
 * @param {number} quality - Compression quality (0.1 to 1.0)
 * @returns {Promise<File>} - Compressed file
 */
export const compressImage = (file, maxWidth = 800, quality = 0.8) => {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();

        img.onload = () => {
            try {
                // Calculate new dimensions
                const ratio = Math.min(
                    maxWidth / img.width,
                    maxWidth / img.height
                );
                const width = img.width * ratio;
                const height = img.height * ratio;

                // Set canvas dimensions
                canvas.width = width;
                canvas.height = height;

                // Draw and compress
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        if (!blob || blob.size === 0) {
                            console.warn(
                                "Compression resulted in empty blob, using original file"
                            );
                            resolve(file);
                            return;
                        }

                        const compressedFile = new File([blob], file.name, {
                            type: file.type,
                            lastModified: Date.now(),
                        });

                        console.log("Compression successful:", {
                            original: file.size,
                            compressed: compressedFile.size,
                            ratio:
                                (
                                    (compressedFile.size / file.size) *
                                    100
                                ).toFixed(2) + "%",
                        });

                        resolve(compressedFile);
                    },
                    file.type,
                    quality
                );
            } catch (error) {
                console.error("Error during compression:", error);
                resolve(file); // Return original file if compression fails
            }
        };

        img.onerror = () => {
            console.error("Failed to load image for compression");
            resolve(file); // Return original file if image load fails
        };

        img.src = URL.createObjectURL(file);
    });
};

/**
 * Validates image file
 * @param {File} file - The file to validate
 * @returns {{valid: boolean, error?: string}}
 */
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
