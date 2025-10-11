import React, { useState, useRef, useEffect } from "react";
import { Icon } from "@iconify/react";
import {
    uploadImage,
    compressImage,
    validateImageFile,
} from "../utils/imageUpload";

const ImageUpload = ({
    currentImage,
    onImageChange,
    userId,
    bucket = "products",
    className = "",
    type = "product", // 'product' or 'avatar' or 'valid_id'
    disabled = false,
    customText = null,
}) => {
    const [uploading, setUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState(currentImage || "");
    const [error, setError] = useState("");
    const fileInputRef = useRef(null);

    // Update preview when currentImage prop changes
    useEffect(() => {
        setPreviewUrl(currentImage || "");
    }, [currentImage]);

    const handleFileSelect = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Reset error state
        setError("");

        // Validate file
        const validation = validateImageFile(file);
        if (!validation.valid) {
            setError(validation.error);
            return;
        }

        try {
            setUploading(true);

            // Create preview
            const previewUrl = URL.createObjectURL(file);
            setPreviewUrl(previewUrl);

            // Compress image based on type
            let processedFile = file;
            if (type === "avatar") {
                processedFile = await compressImage(file, 400, 0.8); // Smaller for avatars
            } else {
                processedFile = await compressImage(file, 800, 0.85); // Larger for products
            }

            // Upload image
            const result = await uploadImage(
                processedFile,
                bucket,
                userId,
                currentImage
            );

            if (result.success) {
                onImageChange(result.url);
                setPreviewUrl(result.url);
            } else {
                setError(result.error);
                setPreviewUrl(currentImage || "");
            }
        } catch (error) {
            console.error("Upload error:", error);
            setError("Upload failed. Please try again.");
            setPreviewUrl(currentImage || "");
        } finally {
            setUploading(false);
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const handleRemoveImage = () => {
        setPreviewUrl("");
        onImageChange("");
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const triggerFileSelect = () => {
        if (!disabled && fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const isAvatar = type === "avatar";
    const containerClass = isAvatar
        ? "w-32 h-32 rounded-full"
        : "w-full h-64 rounded-lg";

    return (
        <div className={`relative ${className}`}>
            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleFileSelect}
                className="hidden"
                disabled={disabled || uploading}
            />

            {/* Upload area */}
            <div
                className={`${containerClass} border-2 border-dashed border-gray-300 hover:border-primary transition-colors cursor-pointer overflow-hidden bg-gray-50 flex items-center justify-center relative ${
                    disabled || uploading ? "cursor-not-allowed opacity-50" : ""
                }`}
                onClick={triggerFileSelect}
            >
                {previewUrl ? (
                    <>
                        <img
                            src={previewUrl}
                            alt={
                                isAvatar ? "Avatar preview" : "Product preview"
                            }
                            className={`w-full h-full object-cover ${
                                isAvatar ? "rounded-full" : "rounded-lg"
                            }`}
                        />

                        {/* Overlay on hover */}
                        <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                            <div className="text-white text-center">
                                <Icon
                                    icon="mingcute:camera-line"
                                    width="24"
                                    height="24"
                                    className="mx-auto mb-1"
                                />
                                <p className="text-sm">Change Image</p>
                            </div>
                        </div>

                        {/* Remove button */}
                        {!disabled && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveImage();
                                }}
                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                            >
                                <Icon
                                    icon="mingcute:close-line"
                                    width="16"
                                    height="16"
                                />
                            </button>
                        )}
                    </>
                ) : (
                    <div className="text-center text-gray-500">
                        {uploading ? (
                            <>
                                <Icon
                                    icon="mingcute:loading-line"
                                    width="32"
                                    height="32"
                                    className="mx-auto mb-2 animate-spin text-primary"
                                />
                                <p className="text-sm">Uploading...</p>
                            </>
                        ) : (
                            <>
                                <Icon
                                    icon="mingcute:camera-line"
                                    width="32"
                                    height="32"
                                    className="mx-auto mb-2"
                                />
                                <p className="text-sm font-medium">
                                    {customText?.uploadTitle || (isAvatar
                                        ? "Upload Avatar"
                                        : "Upload Product Image")}
                                </p>
                                <p className="text-xs mt-1">
                                    {customText?.uploadSubtext || "JPEG, PNG, WebP up to 5MB"}
                                </p>
                            </>
                        )}
                    </div>
                )}

                {/* Loading spinner overlay */}
                {uploading && (
                    <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
                        <Icon
                            icon="mingcute:loading-line"
                            width="32"
                            height="32"
                            className="text-primary animate-spin"
                        />
                    </div>
                )}
            </div>

            {/* Error message */}
            {error && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                    <div className="flex items-center">
                        <Icon
                            icon="mingcute:alert-circle-line"
                            width="16"
                            height="16"
                            className="text-red-500 mr-2"
                        />
                        <p className="text-sm text-red-700">{error}</p>
                    </div>
                </div>
            )}

            {/* Help text */}
            {!error && (
                <p className="mt-2 text-xs text-gray-500">
                    {customText?.recommendedText || (isAvatar
                        ? "Recommended: Square image, at least 200x200 pixels"
                        : "Recommended: High-quality product image, at least 800x600 pixels")}
                </p>
            )}
        </div>
    );
};

export default ImageUpload;
