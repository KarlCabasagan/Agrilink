import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@iconify/react";
import supabase from "../SupabaseClient";
import { toast } from "react-hot-toast";
import { uploadImage, validateImageFile } from "../utils/imageUpload";

export default function ReviewModal({
    isOpen,
    onClose,
    productId,
    userId,
    productName,
    onReviewSubmitted,
}) {
    const [rating, setRating] = useState(0);
    const [hoveredRating, setHoveredRating] = useState(0);
    const [review, setReview] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);

    const modalRef = useRef(null);
    const previousFocusRef = useRef(null);
    const closeButtonRef = useRef(null);
    const submitButtonRef = useRef(null);
    const fileInputRef = useRef(null);

    const handleEscape = useCallback(
        (e) => {
            if (e.key === "Escape") {
                onClose();
            }
        },
        [onClose]
    );

    useEffect(() => {
        if (isOpen) {
            // Store the current focused element
            previousFocusRef.current = document.activeElement;

            // Lock scroll
            document.body.style.overflow = "hidden";

            // Focus the close button when modal opens
            closeButtonRef.current?.focus();

            // Add escape key listener
            document.addEventListener("keydown", handleEscape);
        }

        return () => {
            if (isOpen) {
                // Restore scroll and focus when modal closes
                document.body.style.overflow = "";
                previousFocusRef.current?.focus();
                document.removeEventListener("keydown", handleEscape);
            }
        };
    }, [isOpen, handleEscape]);

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const handleImageSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate image file
        const validation = validateImageFile(file);
        if (!validation.valid) {
            toast.error(validation.error);
            return;
        }

        setImageFile(file);

        // Create preview
        const reader = new FileReader();
        reader.onload = (event) => {
            setImagePreview(event.target?.result);
        };
        reader.readAsDataURL(file);
    };

    const handleRemoveImage = () => {
        setImageFile(null);
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (rating === 0) {
            toast.error("Please select a rating");
            return;
        }

        setIsSubmitting(true);
        try {
            let imageUrl = null;

            // Upload image if selected
            if (imageFile) {
                const uploadResult = await uploadImage(
                    imageFile,
                    "product_review_images",
                    userId
                );

                if (!uploadResult.success) {
                    toast.error(uploadResult.error || "Failed to upload image");
                    setIsSubmitting(false);
                    return;
                }

                imageUrl = uploadResult.url;
            }

            // Insert review with image URL if available
            const { error } = await supabase.from("reviews").insert({
                user_id: userId,
                product_id: productId,
                review: review.trim() || null,
                rating,
                image_url: imageUrl,
            });

            if (error) throw error;

            toast.success("Review submitted successfully");
            onReviewSubmitted();
            onClose();
        } catch (error) {
            console.error("Error submitting review:", error);
            toast.error(
                error.message || "Failed to submit review. Please try again."
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRatingClick = (value) => {
        setRating(value);
    };

    const handleRatingHover = (value) => {
        setHoveredRating(value);
    };

    if (!isOpen) return null;

    return createPortal(
        <div
            className="fixed inset-0 z-[9999] overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-labelledby="review-modal-title"
            onClick={handleBackdropClick}
        >
            {/* Backdrop with improved transition */}
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-150 ease-out" />

            {/* Modal Panel */}
            <div className="flex min-h-screen items-center justify-center p-4">
                <div
                    ref={modalRef}
                    className="relative w-full max-w-lg rounded-2xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-200/90 transform transition-all duration-180 ease-[cubic-bezier(0.16,1,0.3,1)] opacity-100 scale-100"
                    role="document"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-5">
                        <h2
                            id="review-modal-title"
                            className="text-xl font-bold text-slate-900 tracking-tight"
                        >
                            Rate & Review
                        </h2>
                        <button
                            ref={closeButtonRef}
                            onClick={onClose}
                            className="text-slate-400 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 rounded-xl p-2 transition-colors cursor-pointer active:scale-95"
                            aria-label="Close"
                        >
                            <Icon
                                icon="mingcute:close-line"
                                width="22"
                                height="22"
                            />
                        </button>
                    </div>

                    <div className="space-y-5">
                        <div>
                            <h3
                                id="review-modal-product"
                                className="text-sm font-semibold text-slate-800 mb-2.5"
                            >
                                {productName}
                            </h3>
                            <div className="space-y-3">
                                <div
                                    className={`inline-flex items-center gap-2 p-3 rounded-xl transition-colors ${
                                        !rating
                                            ? "bg-emerald-50/50 border border-emerald-200/60"
                                            : ""
                                    }`}
                                    onMouseLeave={() => handleRatingHover(0)}
                                    role="radiogroup"
                                    aria-label="Product rating"
                                >
                                    {[1, 2, 3, 4, 5].map((value) => (
                                        <button
                                            key={value}
                                            type="button"
                                            onClick={() =>
                                                handleRatingClick(value)
                                            }
                                            onMouseEnter={() =>
                                                handleRatingHover(value)
                                            }
                                            className={`p-1.5 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 rounded-xl cursor-pointer ${
                                                !rating
                                                    ? "hover:scale-110 active:scale-95"
                                                    : ""
                                            }`}
                                            role="radio"
                                            aria-checked={rating === value}
                                            aria-label={`${value} star${
                                                value !== 1 ? "s" : ""
                                            }`}
                                        >
                                            <Icon
                                                icon={
                                                    (hoveredRating || rating) >=
                                                    value
                                                        ? "mingcute:star-fill"
                                                        : "mingcute:star-line"
                                                }
                                                width="30"
                                                height="30"
                                                className={`transition-colors duration-150 ${
                                                    (hoveredRating || rating) >=
                                                    value
                                                        ? "text-amber-400"
                                                        : rating === 0
                                                        ? "text-emerald-700/30"
                                                        : "text-slate-200"
                                                }`}
                                            />
                                        </button>
                                    ))}
                                </div>
                                <div
                                    className={`text-xs font-semibold uppercase tracking-wider transition-colors duration-150 ${
                                        rating
                                            ? "text-slate-600 tabular-nums"
                                            : "text-emerald-700 font-medium"
                                    }`}
                                >
                                    {rating
                                        ? `You've selected ${rating} star${
                                              rating !== 1 ? "s" : ""
                                          }`
                                        : "Please select a rating"}
                                </div>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                        <div>
                            <label
                                htmlFor="review"
                                className="block text-[11px] font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
                            >
                                Your Review (Optional)
                            </label>
                            <textarea
                                id="review"
                                name="review"
                                rows="4"
                                placeholder="Share your experience with this product…"
                                value={review}
                                onChange={(e) => setReview(e.target.value)}
                                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600/15 focus:border-emerald-600 bg-slate-50/50 focus:bg-white transition-all resize-none placeholder:text-slate-400 text-sm"
                                disabled={isSubmitting}
                            />
                        </div>

                        {/* Image Upload Section */}
                        <div>
                            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                                Add Photo (Optional)
                            </label>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/jpg,image/png,image/webp"
                                onChange={handleImageSelect}
                                className="hidden"
                                disabled={isSubmitting}
                            />
                            {!imagePreview ? (
                                <button
                                    type="button"
                                    onClick={() =>
                                        fileInputRef.current?.click()
                                    }
                                    disabled={isSubmitting}
                                    className="w-full px-4 py-3 border-2 border-dashed border-slate-200 rounded-xl hover:border-emerald-600 hover:bg-emerald-50/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-slate-500 hover:text-emerald-700 cursor-pointer"
                                >
                                    <Icon
                                        icon="mingcute:camera-line"
                                        width="18"
                                        height="18"
                                    />
                                    <span className="text-xs font-semibold">
                                        Click to upload image (JPG, PNG, WebP)
                                    </span>
                                </button>
                            ) : (
                                <div className="relative inline-block">
                                    <img
                                        src={imagePreview}
                                        alt="Review preview"
                                        className="h-28 w-28 object-cover rounded-xl border border-slate-200 shadow-2xs"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleRemoveImage}
                                        disabled={isSubmitting}
                                        className="absolute -top-2 -right-2 bg-rose-600 hover:bg-rose-700 text-white rounded-full p-1 shadow-xs transition-colors cursor-pointer disabled:opacity-50 active:scale-95"
                                        aria-label="Remove image"
                                    >
                                        <Icon
                                            icon="mingcute:close-line"
                                            width="14"
                                            height="14"
                                        />
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 pt-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="min-h-[44px] min-w-[90px] px-4 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 border border-slate-200/80 transition-all focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:opacity-50 cursor-pointer active:scale-[0.98]"
                                disabled={isSubmitting}
                            >
                                Cancel
                            </button>
                            <button
                                ref={submitButtonRef}
                                type="submit"
                                className="min-h-[44px] min-w-[120px] px-5 py-2.5 text-xs font-semibold text-white bg-emerald-700 rounded-xl hover:bg-emerald-800 transition-all shadow-xs focus:outline-none focus:ring-2 focus:ring-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98]"
                                disabled={isSubmitting || rating === 0}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Icon
                                            icon="mingcute:loading-line"
                                            className="animate-spin"
                                            width="16"
                                            height="16"
                                        />
                                        <span>Submitting…</span>
                                    </>
                                ) : (
                                    "Submit Review"
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>,
        document.body
    );
}
