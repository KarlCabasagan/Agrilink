import React from 'react';
import ImageUpload from './ImageUpload';

const ValidIdUpload = ({ currentImage, onImageChange, userId, className = "" }) => {
    return (
        <ImageUpload
            currentImage={currentImage}
            onImageChange={onImageChange}
            userId={userId}
            bucket="valid_ids"
            type="valid_id"
            className={className}
            customText={{
                uploadTitle: "Upload Valid ID",
                uploadSubtext: "Valid government IDs only (e.g., Driver's License, National ID, Passport)",
                recommendedText: "Minimum size: 1000x1000 pixels. Must be clearly readable."
            }}
        />
    );
};

export default ValidIdUpload;
