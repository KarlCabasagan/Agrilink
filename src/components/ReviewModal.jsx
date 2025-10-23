import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@iconify/react";
import supabase from "../SupabaseClient";
import { toast } from "react-hot-toast";

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

    const modalRef = useRef(null);
    const previousFocusRef = useRef(null);
    const closeButtonRef = useRef(null);
    const submitButtonRef = useRef(null);

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (rating === 0) {
            toast.error("Please select a rating");
            return;
        }

        setIsSubmitting(true);
        try {
            const { error } = await supabase.from("reviews").insert({
                user_id: userId,
                product_id: productId,
                review: review.trim() || null,
                rating,
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
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-all duration-300 ease-out" />

            {/* Modal Panel */}
            <div className="flex min-h-screen items-center justify-center p-4">
                <div
                    ref={modalRef}
                    className="relative w-full max-w-lg rounded-xl bg-white p-8 shadow-2xl ring-1 ring-black/5 transform transition-all duration-200 ease-out opacity-100 scale-100"
                    role="document"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <h2
                            id="review-modal-title"
                            className="text-2xl font-semibold text-gray-900"
                        >
                            Rate & Review
                        </h2>
                        <button
                            ref={closeButtonRef}
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg p-2 transition-colors"
                            aria-label="Close"
                        >
                            <Icon
                                icon="mingcute:close-line"
                                width="24"
                                height="24"
                            />
                        </button>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <h3
                                id="review-modal-product"
                                className="text-base font-medium text-gray-800 mb-3"
                            >
                                {productName}
                            </h3>
                            <div className="space-y-3">
                                <div
                                    className={`inline-flex items-center gap-2 p-3 rounded-lg transition-colors ${
                                        !rating
                                            ? "bg-primary/5 ring-2 ring-primary/10"
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
                                            className={`p-1.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg ${
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
                                                width="32"
                                                height="32"
                                                className={`transition-colors duration-200 ${
                                                    (hoveredRating || rating) >=
                                                    value
                                                        ? "text-yellow-400"
                                                        : rating === 0
                                                        ? "text-primary/40"
                                                        : "text-gray-300"
                                                }`}
                                            />
                                        </button>
                                    ))}
                                </div>
                                <div
                                    className={`text-sm transition-colors duration-200 ${
                                        rating
                                            ? "text-gray-600"
                                            : "text-primary/80 font-medium"
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

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label
                                htmlFor="review"
                                className="block text-sm font-medium text-gray-700 mb-2"
                            >
                                Your Review (Optional)
                            </label>
                            <textarea
                                id="review"
                                name="review"
                                rows="4"
                                placeholder="Share your experience with this product..."
                                value={review}
                                onChange={(e) => setReview(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none placeholder:text-gray-400"
                                disabled={isSubmitting}
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="min-w-[100px] px-5 py-2.5 text-sm font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50"
                                disabled={isSubmitting}
                            >
                                Cancel
                            </button>
                            <button
                                ref={submitButtonRef}
                                type="submit"
                                className="min-w-[100px] px-5 py-2.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary flex items-center justify-center gap-2"
                                disabled={isSubmitting || rating === 0}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Icon
                                            icon="mingcute:loading-line"
                                            className="animate-spin"
                                            width="20"
                                            height="20"
                                        />
                                        <span>Submitting...</span>
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
