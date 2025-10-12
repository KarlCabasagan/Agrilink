import React from "react";
import ImageUpload from "./ImageUpload";

const ValidIdUpload = ({
    currentImage,
    onImageChange,
    userId,
    className = "",
    disabled = false,
    disableAutoUpload = false,
}) => {
    const handleChange = async (file) => {
        if (disableAutoUpload) {
            // For delayed upload - just create a preview
            const preview = URL.createObjectURL(file);
            onImageChange(file, preview);
        } else {
            // Legacy behavior - upload immediately
            onImageChange(file);
        }
    };

    return (
        <ImageUpload
            currentImage={currentImage}
            onImageChange={handleChange}
            userId={userId}
            bucket="valid_ids"
            type="valid_id"
            className={className}
            disabled={disabled}
            disableAutoUpload={disableAutoUpload}
            customText={{
                uploadTitle: "Upload Valid ID",
                uploadSubtext:
                    "Valid government IDs only (e.g., Driver's License, National ID, Passport)",
                recommendedText:
                    "Minimum size: 1000x1000 pixels. Must be clearly readable.",
            }}
        />
    );
};

export default ValidIdUpload;
