import { useParams, useNavigate, Link } from "react-router-dom";
import {
    useState,
    useMemo,
    useEffect,
    useContext,
    useCallback,
    useRef,
} from "react";
import { Icon } from "@iconify/react";
import NavigationBar from "../../components/NavigationBar";
import Modal from "../../components/Modal";
import StateView from "../../components/StateView";
import supabase from "../../SupabaseClient";
import { AuthContext } from "../../context/AuthContext.jsx";
import { CartCountContext } from "../../context/CartCountContext.jsx";
import { addToCart } from "../../utils/cartUtils.js";
import { uploadImage, deleteImageFromUrl } from "../../utils/imageUpload.js";
import { toast } from "react-hot-toast";

// Helper for review images
function ReviewImage({ src, alt, className }) {
    const [isLoading, setIsLoading] = useState(true);

    return (
        <div className={`relative overflow-hidden bg-slate-100 rounded-lg ${className}`}>
            {isLoading && (
                <div className="absolute inset-0 bg-slate-200 animate-pulse z-10" />
            )}
            <img
                src={src}
                alt={alt}
                className={`w-full h-full object-cover transition-opacity duration-300 ${
                    isLoading ? "opacity-0" : "opacity-100"
                }`}
                onLoad={() => setIsLoading(false)}
                onError={() => setIsLoading(false)}
            />
        </div>
    );
}

// Single Review Item Component
function ReviewItem({
    review,
    state,
    user,
    highlighted,
    onMarkHelpful,
    onToggleReport,
    onEdit,
    onCancelEdit,
    onSaveEdit,
    onDelete,
    onEditImageSelect,
    onRemoveEditImage,
    onUpdateState,
    itemRef,
}) {
    const isOwner = user?.id === review.user_id;

    return (
        <div
            ref={itemRef}
            className={`p-4 rounded-2xl border border-slate-100 transition-all duration-300 ${
                highlighted ? "bg-emerald-50/70 border-emerald-300" : "bg-white hover:border-slate-200"
            }`}
        >
            <div className="flex items-start gap-3">
                {/* Avatar */}
                {review.avatar ? (
                    <img
                        src={review.avatar}
                        alt={review.user}
                        className="w-10 h-10 rounded-full object-cover shrink-0 border border-slate-200"
                    />
                ) : (
                    <div className="w-10 h-10 rounded-full bg-emerald-100/70 text-emerald-800 flex items-center justify-center shrink-0 font-bold text-sm">
                        {review.user?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                )}

                <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                        <span className="font-semibold text-sm text-slate-900 truncate">
                            {review.user}
                        </span>
                        <span className="text-xs text-slate-600 tabular-nums shrink-0">
                            {review.date}
                        </span>
                    </div>

                    {/* Star rating */}
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <div className="flex items-center text-amber-400">
                            {[1, 2, 3, 4, 5].map((s) => (
                                <Icon
                                    key={s}
                                    icon={s <= review.rating ? "mingcute:star-fill" : "mingcute:star-line"}
                                    className="w-3.5 h-3.5 text-amber-400"
                                />
                            ))}
                        </div>
                        <span className="text-xs font-semibold text-slate-700 tabular-nums">
                            {review.rating.toFixed(1)}
                        </span>
                    </div>

                    {/* Comment */}
                    {review.comment && (
                        <p className="mt-2 text-sm text-slate-700 leading-relaxed measure-prose">
                            {review.comment}
                        </p>
                    )}

                    {/* Image Attachment */}
                    {review.image && (
                        <ReviewImage
                            src={review.image}
                            alt="Review photo"
                            className="mt-3 w-28 h-28 border border-slate-200"
                        />
                    )}

                    {/* Action Bar (Helpful / Report / Edit / Delete) */}
                    <div className="mt-3 flex items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                        {/* Helpful Counter */}
                        <div className="flex items-center gap-1 text-slate-600 tabular-nums">
                            {state.helpfulCount > 0 && (
                                <span className="inline-flex items-center gap-1 text-emerald-800 font-medium">
                                    <Icon icon="mingcute:thumb-up-fill" className="w-3.5 h-3.5" />
                                    <span>{state.helpfulCount} helpful</span>
                                </span>
                            )}
                        </div>

                        {/* Buttons */}
                        <div className="flex items-center gap-1.5">
                            {isOwner ? (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => onEdit(review.id)}
                                        disabled={state.isUpdating}
                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-slate-600 hover:text-emerald-800 hover:bg-slate-100 transition-colors"
                                    >
                                        <Icon icon="mingcute:edit-line" width="14" height="14" />
                                        <span>Edit</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => onDelete(review.id)}
                                        disabled={state.isUpdating}
                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                                        aria-label="Delete review"
                                    >
                                        <Icon icon="mingcute:delete-line" width="14" height="14" />
                                        <span>Delete</span>
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => onMarkHelpful(review.id)}
                                        disabled={!user || state.isUpdating}
                                        aria-pressed={state.helpful}
                                        className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-colors min-h-[32px] ${
                                            state.helpful
                                                ? "bg-emerald-100 text-emerald-800 font-semibold"
                                                : "text-slate-600 hover:bg-slate-100"
                                        } ${!user ? "opacity-50 cursor-not-allowed" : ""}`}
                                    >
                                        <Icon
                                            icon={state.helpful ? "mingcute:thumb-up-fill" : "mingcute:thumb-up-line"}
                                            width="14"
                                            height="14"
                                        />
                                        <span>Helpful</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => onToggleReport(review.id)}
                                        disabled={!user || state.isUpdating}
                                        aria-pressed={state.reported}
                                        className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-colors min-h-[32px] ${
                                            state.reported
                                                ? "bg-rose-100 text-rose-700 font-semibold"
                                                : "text-slate-600 hover:bg-slate-100"
                                        } ${!user ? "opacity-50 cursor-not-allowed" : ""}`}
                                    >
                                        <Icon
                                            icon={state.reported ? "mingcute:flag-2-fill" : "mingcute:flag-2-line"}
                                            width="14"
                                            height="14"
                                        />
                                        <span>{state.reported ? "Reported" : "Report"}</span>
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Edit Form */}
                    {isOwner && state.isEditing && (
                        <div className="mt-4 p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-slate-700">Your Rating:</span>
                                <div className="flex gap-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => onUpdateState(review.id, { editRating: star })}
                                            className="p-1 hover:scale-110 transition-transform"
                                        >
                                            <Icon
                                                icon={star <= state.editRating ? "mingcute:star-fill" : "mingcute:star-line"}
                                                className="text-amber-400 w-5 h-5"
                                            />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <textarea
                                value={state.editComment}
                                onChange={(e) => onUpdateState(review.id, { editComment: e.target.value })}
                                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700 resize-none"
                                rows="3"
                                placeholder="Edit your review..."
                            />

                            <div className="flex items-center justify-between pt-1">
                                <div>
                                    <input
                                        type="file"
                                        accept="image/jpeg,image/jpg,image/png,image/webp"
                                        onChange={(e) => onEditImageSelect(review.id, e.target.files?.[0])}
                                        className="hidden"
                                        id={`edit-img-${review.id}`}
                                    />
                                    {!state.editImagePreview ? (
                                        <button
                                            type="button"
                                            onClick={() => document.getElementById(`edit-img-${review.id}`)?.click()}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-slate-300 text-xs text-slate-600 hover:border-emerald-700 hover:text-emerald-800"
                                        >
                                            <Icon icon="mingcute:camera-line" width="14" height="14" />
                                            <span>Add Photo</span>
                                        </button>
                                    ) : (
                                        <div className="relative inline-block">
                                            <img
                                                src={state.editImagePreview}
                                                alt="Preview"
                                                className="w-16 h-16 rounded-lg object-cover border border-slate-200"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => onRemoveEditImage(review.id)}
                                                className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white rounded-full p-0.5"
                                            >
                                                <Icon icon="mingcute:close-line" width="12" height="12" />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => onCancelEdit(review.id)}
                                        className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => onSaveEdit(review.id)}
                                        disabled={!state.editRating || state.isUpdating}
                                        className="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg shadow-xs transition-colors disabled:opacity-50"
                                    >
                                        {state.isUpdating ? "Saving..." : "Save"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function Product() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const { updateCartCount } = useContext(CartCountContext);

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(0.1);
    const [quantityError, setQuantityError] = useState("");
    const [addingToCart, setAddingToCart] = useState(false);
    const [currentCartQty, setCurrentCartQty] = useState(0);
    const [reviewSort, setReviewSort] = useState("newest");
    const [highlightedReviewId, setHighlightedReviewId] = useState(null);
    const [reviewStates, setReviewStates] = useState(new Map());
    const [modal, setModal] = useState({
        open: false,
        type: "",
        title: "",
        message: "",
        onConfirm: null,
    });

    const reviewRefs = useRef(new Map());
    const searchParams = new URLSearchParams(window.location.search);

    const showModal = (type, title, message, onConfirm = null) => {
        setModal({ open: true, type, title, message, onConfirm });
    };

    const updateReviewState = useCallback((reviewId, updates) => {
        setReviewStates((prev) => {
            const current = prev.get(reviewId) || {
                helpful: false,
                reported: false,
                helpfulCount: 0,
                isUpdating: false,
                isEditing: false,
                editRating: 0,
                editComment: "",
                editImageFile: null,
                editImagePreview: null,
                hasDeletedImage: false,
            };
            const next = { ...current, ...updates };
            const newMap = new Map(prev);
            newMap.set(reviewId, next);
            return newMap;
        });
    }, []);

    // Review Handlers
    const handleMarkHelpful = async (reviewId) => {
        if (!user) return;
        const currentState = reviewStates.get(reviewId);
        if (!currentState || currentState.isUpdating) return;

        const isHelpful = currentState.helpful;
        const delta = isHelpful ? -1 : 1;

        updateReviewState(reviewId, {
            helpful: !isHelpful,
            helpfulCount: Math.max(0, currentState.helpfulCount + delta),
            isUpdating: true,
        });

        try {
            if (isHelpful) {
                await supabase
                    .from("helpful_reviews")
                    .delete()
                    .eq("user_id", user.id)
                    .eq("review_id", reviewId);
            } else {
                await supabase
                    .from("helpful_reviews")
                    .insert({ user_id: user.id, review_id: reviewId });
            }
        } catch (error) {
            console.error("Error toggling helpful review:", error);
            updateReviewState(reviewId, {
                helpful: isHelpful,
                helpfulCount: currentState.helpfulCount,
            });
            toast.error("Could not update helpful status.");
        } finally {
            updateReviewState(reviewId, { isUpdating: false });
        }
    };

    const handleToggleReport = async (reviewId) => {
        if (!user) return;
        const currentState = reviewStates.get(reviewId);
        if (!currentState || currentState.isUpdating) return;

        const isReported = currentState.reported;
        updateReviewState(reviewId, {
            reported: !isReported,
            isUpdating: true,
        });

        try {
            if (isReported) {
                await supabase
                    .from("reported_reviews")
                    .delete()
                    .eq("user_id", user.id)
                    .eq("review_id", reviewId);
            } else {
                await supabase
                    .from("reported_reviews")
                    .insert({ user_id: user.id, review_id: reviewId });
            }
        } catch (error) {
            console.error("Error toggling review report:", error);
            updateReviewState(reviewId, { reported: isReported });
            toast.error("Could not update report status.");
        } finally {
            updateReviewState(reviewId, { isUpdating: false });
        }
    };

    const handleEditReview = (reviewId) => {
        const review = product?.reviews.find((r) => r.id === reviewId);
        if (!review) return;
        updateReviewState(reviewId, {
            isEditing: true,
            editRating: review.rating,
            editComment: review.comment || "",
            editImagePreview: review.image || null,
            editImageFile: null,
            hasDeletedImage: false,
        });
    };

    const handleCancelEdit = (reviewId) => {
        updateReviewState(reviewId, {
            isEditing: false,
            editRating: 0,
            editComment: "",
            editImageFile: null,
            editImagePreview: null,
            hasDeletedImage: false,
        });
    };

    const handleDeleteReview = async (reviewId) => {
        if (!user) return;
        const review = product?.reviews.find((r) => r.id === reviewId);
        if (!review || review.user_id !== user.id) return;

        updateReviewState(reviewId, { isUpdating: true });
        setProduct((prev) => ({
            ...prev,
            reviews: prev.reviews.filter((r) => r.id !== reviewId),
        }));

        try {
            if (review.image) {
                const imagePath = review.image.split("product_review_images/").pop();
                if (imagePath) {
                    await supabase.storage.from("product_review_images").remove([imagePath]);
                }
            }
            await supabase.from("reviews").delete().eq("id", reviewId).eq("user_id", user.id);
            toast.success("Review deleted.");
        } catch (error) {
            console.error("Error deleting review:", error);
            setProduct((prev) => ({ ...prev, reviews: [...prev.reviews, review] }));
            toast.error("Failed to delete review.");
        } finally {
            updateReviewState(reviewId, { isUpdating: false });
        }
    };

    const handleSaveEdit = async (reviewId) => {
        if (!user) return;
        const state = reviewStates.get(reviewId);
        if (!state || state.isUpdating) return;

        const review = product?.reviews.find((r) => r.id === reviewId);
        if (!review) return;

        let finalImageUrl = review.image;
        updateReviewState(reviewId, { isUpdating: true });

        try {
            if (state.editImageFile) {
                if (review.image) {
                    await deleteImageFromUrl(review.image, "product_review_images");
                }
                const uploadResult = await uploadImage(state.editImageFile, "product_review_images", user.id);
                if (!uploadResult.success) throw new Error(uploadResult.error || "Upload failed");
                finalImageUrl = uploadResult.url;
            } else if (state.hasDeletedImage && review.image) {
                await deleteImageFromUrl(review.image, "product_review_images");
                finalImageUrl = null;
            }

            await supabase
                .from("reviews")
                .update({
                    rating: state.editRating,
                    review: state.editComment,
                    image_url: finalImageUrl,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", reviewId)
                .eq("user_id", user.id);

            setProduct((prev) => ({
                ...prev,
                reviews: prev.reviews.map((r) =>
                    r.id === reviewId
                        ? { ...r, rating: state.editRating, comment: state.editComment, image: finalImageUrl }
                        : r
                ),
            }));

            updateReviewState(reviewId, {
                isEditing: false,
                isUpdating: false,
                hasDeletedImage: false,
            });
            toast.success("Review updated.");
        } catch (error) {
            console.error("Error updating review:", error);
            toast.error("Failed to update review.");
            updateReviewState(reviewId, { isUpdating: false });
        }
    };

    const handleEditImageSelect = (reviewId, file) => {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            updateReviewState(reviewId, {
                editImageFile: file,
                editImagePreview: e.target?.result,
                hasDeletedImage: false,
            });
        };
        reader.readAsDataURL(file);
    };

    const handleRemoveEditImage = (reviewId) => {
        updateReviewState(reviewId, {
            editImageFile: null,
            editImagePreview: null,
            hasDeletedImage: true,
        });
    };

    // Sort Reviews
    const sortedReviews = useMemo(() => {
        if (!product?.reviews) return [];
        const reviews = [...product.reviews];

        const ownerReview = user && reviews.find((r) => r.user_id === user.id);
        const others = ownerReview ? reviews.filter((r) => r.user_id !== user.id) : reviews;

        others.sort((a, b) => {
            if (reviewSort === "highest") return b.rating - a.rating;
            if (reviewSort === "lowest") return a.rating - b.rating;
            if (reviewSort === "oldest") return new Date(a.rawDate) - new Date(b.rawDate);
            return new Date(b.rawDate) - new Date(a.rawDate);
        });

        return ownerReview ? [ownerReview, ...others] : others;
    }, [product?.reviews, reviewSort, user]);

    // Fetch Product & Reviews
    useEffect(() => {
        const fetchProduct = async () => {
            setLoading(true);
            try {
                const [productResult, reviewsResult, helpfulResult, reportedResult] = await Promise.all([
                    supabase
                        .from("products")
                        .select(
                            `
                            *,
                            categories(name),
                            profiles!user_id(name, address, delivery_cost, minimum_order_quantity),
                            statuses(name)
                            `
                        )
                        .eq("id", id)
                        .neq("status_id", 2)
                        .not("approval_date", "is", null)
                        .neq("approval_date", "1970-01-01 00:00:00+00")
                        .eq("statuses.name", "active")
                        .single(),

                    supabase
                        .from("reviews")
                        .select(
                            `
                            *,
                            profiles:user_id(name, avatar_url),
                            helpful_count:helpful_reviews(count),
                            reported_count:reported_reviews(count)
                            `
                        )
                        .eq("product_id", id),

                    user
                        ? supabase.from("helpful_reviews").select("review_id").eq("user_id", user.id)
                        : Promise.resolve({ data: [] }),

                    user
                        ? supabase.from("reported_reviews").select("review_id").eq("user_id", user.id)
                        : Promise.resolve({ data: [] }),
                ]);

                if (productResult.error || !productResult.data) {
                    setProduct(null);
                    return;
                }

                const productData = productResult.data;
                const reviewsData = reviewsResult.data || [];

                const userHelpful = new Set((helpfulResult.data || []).map((hr) => hr.review_id));
                const userReported = new Set((reportedResult.data || []).map((rr) => rr.review_id));

                const initialReviewStates = new Map();
                reviewsData.forEach((rev) => {
                    initialReviewStates.set(rev.id, {
                        helpful: userHelpful.has(rev.id),
                        reported: userReported.has(rev.id),
                        helpfulCount: rev.helpful_count?.[0]?.count || 0,
                        isUpdating: false,
                        isEditing: false,
                        editRating: 0,
                        editComment: "",
                        editImageFile: null,
                        editImagePreview: null,
                        hasDeletedImage: false,
                    });
                });
                setReviewStates(initialReviewStates);

                const reviews = reviewsData.map((rev) => ({
                    id: rev.id,
                    user: rev.profiles?.name || "Verified Customer",
                    user_id: rev.user_id,
                    avatar: rev.profiles?.avatar_url || null,
                    rating: parseFloat(rev.rating) || 0,
                    comment: rev.review || "",
                    image: rev.image_url || null,
                    rawDate: rev.updated_at,
                    date: new Date(rev.updated_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                    }),
                    helpfulCount: rev.helpful_count?.[0]?.count || 0,
                }));

                const avgRating =
                    reviews.length > 0
                        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
                        : 0;

                const formatted = {
                    id: productData.id,
                    name: productData.name,
                    price: parseFloat(productData.price) || 0,
                    image:
                        productData.image_url ||
                        "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600",
                    address: productData.profiles?.address || "Iligan City",
                    category: productData.categories?.name || "Produce",
                    farmerName: productData.profiles?.name || "Local Farmer",
                    description: productData.description || "Fresh local agricultural produce from verified growers.",
                    stock: parseFloat(productData.stock) || 0,
                    rating: avgRating,
                    minimumOrderQuantity:
                        parseFloat(productData.profiles?.minimum_order_quantity) || 1,
                    deliveryCost: parseFloat(productData.profiles?.delivery_cost) || 50,
                    pickupLocation: productData.profiles?.address || "Farm Location",
                    farmerId: productData.user_id,
                    reviews,
                };

                setProduct(formatted);
                setQuantity(Math.max(0.1, formatted.minimumOrderQuantity));
            } catch (error) {
                console.error("Error loading product:", error);
                setProduct(null);
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchProduct();
    }, [id, user]);

    // Refresh Cart Qty
    const refreshCartQty = useCallback(async () => {
        if (!user || !product) {
            setCurrentCartQty(0);
            return;
        }
        try {
            const { data: cartData } = await supabase
                .from("carts")
                .select("id")
                .eq("user_id", user.id)
                .single();

            if (!cartData) {
                setCurrentCartQty(0);
                return;
            }

            const { data: cartItem } = await supabase
                .from("cart_items")
                .select("quantity")
                .eq("cart_id", cartData.id)
                .eq("product_id", product.id)
                .single();

            const qty = cartItem ? Math.round(parseFloat(cartItem.quantity) * 10) / 10 : 0;
            setCurrentCartQty(isNaN(qty) ? 0 : qty);
        } catch {
            setCurrentCartQty(0);
        }
    }, [user, product]);

    useEffect(() => {
        refreshCartQty();
    }, [refreshCartQty]);

    // Quantity Steppers
    const increaseQuantity = () => {
        if (!product) return;
        const next = Math.round((parseFloat(quantity || 0) + 0.1) * 10) / 10;
        if (next <= product.stock) {
            setQuantity(next);
            setQuantityError("");
        }
    };

    const decreaseQuantity = () => {
        if (!product) return;
        const min = Math.max(0.1, product.minimumOrderQuantity);
        const next = Math.round((parseFloat(quantity || 0) - 0.1) * 10) / 10;
        if (next >= min) {
            setQuantity(next);
            setQuantityError("");
        }
    };

    const handleQuantityBlur = () => {
        if (!product) return;
        const num = parseFloat(quantity);
        const min = Math.max(0.1, product.minimumOrderQuantity);
        if (isNaN(num) || num < min) {
            setQuantity(min);
            setQuantityError("");
        } else if (num > product.stock) {
            setQuantity(product.stock);
            setQuantityError("");
        } else {
            setQuantity(Math.round(num * 10) / 10);
            setQuantityError("");
        }
    };

    // Add to Cart
    const handleAddToCart = async () => {
        if (!user) {
            showModal(
                "warning",
                "Login Required",
                "Please sign in to add produce to your cart and checkout.",
                () => navigate("/login")
            );
            return;
        }
        if (!product) return;

        setAddingToCart(true);
        try {
            const requested = Math.round(parseFloat(quantity) * 10) / 10;
            const stock = Math.round(parseFloat(product.stock) * 10) / 10;

            if (isNaN(requested) || requested <= 0) {
                toast.error("Please enter a valid quantity.");
                return;
            }

            const { data: cartData } = await supabase
                .from("carts")
                .select("id")
                .eq("user_id", user.id)
                .single();

            let addDelta = requested;
            if (cartData) {
                const { data: existingItem } = await supabase
                    .from("cart_items")
                    .select("quantity")
                    .eq("cart_id", cartData.id)
                    .eq("product_id", product.id)
                    .single();

                if (existingItem) {
                    const current = Math.round(parseFloat(existingItem.quantity) * 10) / 10;
                    const cappedTotal = Math.round(Math.min(stock, current + requested) * 10) / 10;
                    addDelta = Math.round(Math.max(0, cappedTotal - current) * 10) / 10;

                    if (addDelta <= 0) {
                        toast("Cart already has maximum available stock for this crop.");
                        return;
                    }
                }
            }

            const result = await addToCart(user.id, product.id, addDelta);
            if (result.success) {
                toast.success(`Added ${addDelta} kg of ${product.name} to cart.`);
                await updateCartCount(user.id);
                await refreshCartQty();
            } else {
                toast.error(result.message || "Failed to add to cart.");
            }
        } catch (error) {
            console.error("Cart error:", error);
            toast.error("Failed to add to cart. Try again.");
        } finally {
            setAddingToCart(false);
        }
    };

    // Direct Message Farmer
    const handleMessageFarmer = async () => {
        if (!user) {
            showModal(
                "warning",
                "Login Required",
                "Please sign in to message local producers.",
                () => navigate("/login")
            );
            return;
        }
        if (!product) return;

        try {
            const { data: existing } = await supabase
                .from("conversations")
                .select("id")
                .eq("consumer_id", user.id)
                .eq("producer_id", product.farmerId)
                .single();

            if (existing) {
                navigate(`/messages?conversation=${existing.id}`);
                return;
            }

            const { data: newConv, error } = await supabase
                .from("conversations")
                .insert({ consumer_id: user.id, producer_id: product.farmerId })
                .select("id")
                .single();

            if (error) throw error;
            navigate(`/messages?conversation=${newConv.id}`);
        } catch (error) {
            console.error("Conversation error:", error);
            toast.error("Unable to start chat with farmer.");
        }
    };

    // Review focus scroll effect
    useEffect(() => {
        const shouldFocus = searchParams.get("reviewFocus") === "user";
        if (!shouldFocus || !user || !product?.reviews || loading) return;

        const userReview = product.reviews.find((r) => r.user_id === user.id);
        if (!userReview) return;

        const ref = reviewRefs.current.get(userReview.id);
        if (ref) {
            const t = setTimeout(() => {
                ref.scrollIntoView({ behavior: "smooth", block: "center" });
                setHighlightedReviewId(userReview.id);
                setTimeout(() => setHighlightedReviewId(null), 2000);
            }, 150);
            return () => clearTimeout(t);
        }
    }, [product?.reviews, user, loading, searchParams]);

    if (loading) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center bg-slate-50">
                <div className="w-12 h-12 rounded-full border-3 border-emerald-800 border-t-transparent animate-spin" />
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50 px-4">
                <StateView
                    type="empty"
                    title="Product Not Found"
                    description="This crop listing might have been removed or is temporarily unavailable."
                    actionText="Back to Marketplace"
                    onAction={() => navigate("/")}
                />
            </div>
        );
    }

    const subtotal = Math.round(parseFloat(quantity || 0) * product.price * 100) / 100;
    const isOutOfStock = product.stock <= 0;

    return (
        <div className="min-h-screen w-full flex flex-col bg-slate-50/50 text-slate-900 pb-28 lg:pb-16 md:pt-16">
            {/* MOBILE TOP BAR (< 768px) */}
            <header className="md:hidden sticky top-0 left-0 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 z-40 px-4 py-3 flex items-center justify-between shadow-xs">
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center -ml-2 text-slate-700 hover:text-emerald-800 active:scale-95"
                    aria-label="Go back"
                >
                    <Icon icon="mingcute:left-line" width="22" height="22" />
                </button>
                <span className="font-semibold text-sm text-slate-900 truncate max-w-[200px]">
                    {product.name}
                </span>
                <Link
                    to="/cart"
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center -mr-2 text-slate-700 hover:text-emerald-800"
                    aria-label="View Cart"
                >
                    <Icon icon="mingcute:shopping-cart-1-line" width="22" height="22" />
                </Link>
            </header>

            {/* MAIN 2-COLUMN CONTAINER */}
            <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 md:mt-8">
                {/* Desktop Breadcrumb */}
                <nav className="hidden md:flex items-center gap-2 text-xs text-slate-600 mb-6" aria-label="Breadcrumb">
                    <Link to="/" className="hover:text-emerald-800 transition-colors">Marketplace</Link>
                    <span>/</span>
                    <span className="text-slate-700">{product.category}</span>
                    <span>/</span>
                    <span className="text-slate-900 font-semibold truncate max-w-xs">{product.name}</span>
                </nav>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
                    {/* LEFT COLUMN: Media Gallery + Reviews (Desktop) */}
                    <div className="lg:col-span-7 space-y-8">
                        {/* Hero Image Container with Aspect Ratio Lock */}
                        <div className="relative aspect-4/3 w-full bg-slate-100 rounded-3xl overflow-hidden border border-slate-200/80 shadow-xs">
                            <img
                                src={product.image}
                                alt={product.name}
                                className="w-full h-full object-cover"
                            />
                            {/* Category Badge */}
                            <span className="absolute top-4 left-4 bg-white/95 backdrop-blur-md text-emerald-800 text-xs font-semibold px-3 py-1 rounded-full border border-emerald-100 shadow-xs">
                                {product.category}
                            </span>
                        </div>

                        {/* Customer Reviews Section */}
                        <section className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900">
                                        Customer Reviews
                                    </h2>
                                    <p className="text-xs text-slate-600 mt-0.5 tabular-nums">
                                        {product.reviews.length} verified ratings
                                    </p>
                                </div>

                                {product.reviews.length > 0 && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-slate-600">Sort:</span>
                                        <select
                                            value={reviewSort}
                                            onChange={(e) => setReviewSort(e.target.value)}
                                            className="text-xs font-medium border border-slate-200 rounded-lg px-3 py-1.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                                        >
                                            <option value="newest">Newest First</option>
                                            <option value="oldest">Oldest First</option>
                                            <option value="highest">Highest Rating</option>
                                            <option value="lowest">Lowest Rating</option>
                                        </select>
                                    </div>
                                )}
                            </div>

                            {/* Review List */}
                            {product.reviews.length > 0 ? (
                                <div className="space-y-4">
                                    {sortedReviews.map((rev) => (
                                        <ReviewItem
                                            key={rev.id}
                                            review={rev}
                                            state={
                                                reviewStates.get(rev.id) || {
                                                    helpful: false,
                                                    reported: false,
                                                    helpfulCount: 0,
                                                    isUpdating: false,
                                                    isEditing: false,
                                                    editRating: rev.rating,
                                                    editComment: rev.comment,
                                                    editImageFile: null,
                                                    editImagePreview: null,
                                                    hasDeletedImage: false,
                                                }
                                            }
                                            user={user}
                                            highlighted={highlightedReviewId === rev.id}
                                            onMarkHelpful={handleMarkHelpful}
                                            onToggleReport={handleToggleReport}
                                            onEdit={handleEditReview}
                                            onCancelEdit={handleCancelEdit}
                                            onSaveEdit={handleSaveEdit}
                                            onDelete={handleDeleteReview}
                                            onEditImageSelect={handleEditImageSelect}
                                            onRemoveEditImage={handleRemoveEditImage}
                                            onUpdateState={updateReviewState}
                                            itemRef={(el) => reviewRefs.current.set(rev.id, el)}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-slate-600">
                                    <Icon icon="mingcute:message-3-line" className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                                    <p className="text-sm font-medium">No reviews yet for this listing.</p>
                                    <p className="text-xs text-slate-600 mt-1">Be the first to order and review this crop.</p>
                                </div>
                            )}
                        </section>
                    </div>

                    {/* RIGHT COLUMN: Sticky Purchase & Produce Details */}
                    <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
                        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
                            {/* Title & Rating */}
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 leading-snug">
                                    {product.name}
                                </h1>
                                <div className="flex items-center gap-2 mt-2">
                                    <div className="flex items-center text-amber-400">
                                        <Icon icon="mingcute:star-fill" className="w-4 h-4 text-amber-400" />
                                        <span className="text-sm font-bold text-slate-800 ml-1 tabular-nums">
                                            {product.rating ? product.rating.toFixed(1) : "0.0"}
                                        </span>
                                    </div>
                                    <span className="text-slate-300">•</span>
                                    <span className="text-xs text-slate-600 tabular-nums">
                                        {product.reviews.length} {product.reviews.length === 1 ? "review" : "reviews"}
                                    </span>
                                </div>
                            </div>

                            {/* Price & Stock Banner */}
                            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100/80 flex items-baseline justify-between gap-4">
                                <div>
                                    <span className="text-3xl font-extrabold text-emerald-800 tabular-nums">
                                        ₱{product.price.toFixed(2)}
                                    </span>
                                    <span className="text-xs font-medium text-emerald-700 ml-1">/ kilogram</span>
                                </div>
                                <span
                                    className={`text-xs font-semibold px-2.5 py-1 rounded-full tabular-nums ${
                                        product.stock > 10
                                            ? "bg-emerald-100 text-emerald-800"
                                            : product.stock > 0
                                            ? "bg-amber-100 text-amber-800"
                                            : "bg-rose-100 text-rose-800"
                                    }`}
                                >
                                    {product.stock > 0 ? `${product.stock} kg in stock` : "Out of stock"}
                                </span>
                            </div>

                            {/* Producer / Farmer Profile Card */}
                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-sm">
                                            {product.farmerName?.charAt(0)?.toUpperCase() || "F"}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-1.5">
                                                <span className="font-semibold text-sm text-slate-900">
                                                    {product.farmerName}
                                                </span>
                                                <Icon
                                                    icon="mingcute:check-circle-fill"
                                                    className="w-4 h-4 text-emerald-700"
                                                    title="Verified Farmer"
                                                />
                                            </div>
                                            <p className="text-xs text-slate-600 flex items-center gap-1 mt-0.5">
                                                <Icon icon="mingcute:location-line" className="w-3.5 h-3.5" />
                                                <span className="truncate max-w-[200px]">{product.address}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleMessageFarmer}
                                        className="min-h-[44px] px-3 py-1.5 rounded-xl border border-emerald-700 text-emerald-800 hover:bg-emerald-700 hover:text-white transition-colors text-xs font-semibold inline-flex items-center gap-1.5"
                                    >
                                        <Icon icon="mingcute:message-3-line" width="16" height="16" />
                                        <span>Chat</span>
                                    </button>
                                </div>

                                <div className="pt-2 border-t border-slate-200/60 grid grid-cols-2 gap-2 text-xs text-slate-600">
                                    <div>
                                        <span className="text-slate-600 block">Min. Order:</span>
                                        <span className="font-semibold text-slate-800 tabular-nums">
                                            {product.minimumOrderQuantity} kg
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-slate-600 block">Delivery Fee:</span>
                                        <span className="font-semibold text-slate-800 tabular-nums">
                                            ₱{product.deliveryCost.toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Description */}
                            <div className="space-y-2">
                                <h3 className="text-sm font-semibold text-slate-900">Crop Details</h3>
                                <p className="text-sm text-slate-600 leading-relaxed measure-prose">
                                    {product.description}
                                </p>
                            </div>

                            {/* Quantity Stepper & Subtotal (Desktop) */}
                            <div className="space-y-4 pt-2">
                                <div className="flex items-center justify-between">
                                    <label htmlFor="quantity-input" className="text-sm font-semibold text-slate-900">
                                        Quantity (kg):
                                    </label>
                                    <div className="flex items-center gap-2">
                                        {/* Minus */}
                                        <button
                                            type="button"
                                            onClick={decreaseQuantity}
                                            disabled={quantity <= Math.max(0.1, product.minimumOrderQuantity) || isOutOfStock}
                                            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50 active:scale-95 text-slate-700 disabled:opacity-40 transition-all"
                                            aria-label="Decrease quantity"
                                        >
                                            <Icon icon="mingcute:minus-line" width="16" height="16" />
                                        </button>
                                        {/* Input */}
                                        <input
                                            id="quantity-input"
                                            type="number"
                                            value={quantity}
                                            onChange={(e) => setQuantity(e.target.value)}
                                            onBlur={handleQuantityBlur}
                                            step="0.1"
                                            disabled={isOutOfStock}
                                            className="w-20 text-center font-bold text-base tabular-nums border border-slate-200 rounded-xl py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                                        />
                                        {/* Plus */}
                                        <button
                                            type="button"
                                            onClick={increaseQuantity}
                                            disabled={quantity >= product.stock || isOutOfStock}
                                            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50 active:scale-95 text-slate-700 disabled:opacity-40 transition-all"
                                            aria-label="Increase quantity"
                                        >
                                            <Icon icon="mingcute:add-line" width="16" height="16" />
                                        </button>
                                    </div>
                                </div>

                                {quantityError && (
                                    <p className="text-xs text-rose-600 font-medium">{quantityError}</p>
                                )}

                                {/* Subtotal preview */}
                                <div className="flex items-center justify-between text-sm py-2 px-3 bg-slate-50 rounded-xl">
                                    <span className="text-slate-600 font-medium">Estimated Subtotal:</span>
                                    <span className="font-bold text-slate-900 tabular-nums text-base">
                                        ₱{subtotal.toFixed(2)}
                                    </span>
                                </div>

                                {/* Desktop Add to Cart Button */}
                                <button
                                    type="button"
                                    onClick={handleAddToCart}
                                    disabled={isOutOfStock || addingToCart}
                                    className="hidden lg:flex w-full min-h-[48px] items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-sm shadow-xs active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Icon icon="mingcute:shopping-cart-1-fill" width="18" height="18" />
                                    <span>
                                        {isOutOfStock
                                            ? "Out of Stock"
                                            : addingToCart
                                            ? "Adding to Cart..."
                                            : `Add ${quantity} kg to Cart`}
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* MOBILE STICKY PURCHASE BAR (< 1024px) */}
            <div className="lg:hidden fixed bottom-14 left-0 w-full bg-white/95 backdrop-blur-md border-t border-slate-200 z-40 px-4 py-2.5 flex items-center justify-between shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
                <div>
                    <span className="text-xs text-slate-600 block">Total Price:</span>
                    <span className="font-extrabold text-lg text-emerald-800 tabular-nums">
                        ₱{subtotal.toFixed(2)}
                    </span>
                </div>
                <button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={isOutOfStock || addingToCart}
                    className="min-h-[44px] px-6 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 active:scale-95 text-white font-semibold text-sm shadow-xs flex items-center gap-2 disabled:opacity-50"
                >
                    <Icon icon="mingcute:shopping-cart-1-fill" width="16" height="16" />
                    <span>{isOutOfStock ? "Out of Stock" : addingToCart ? "Adding..." : "Add to Cart"}</span>
                </button>
            </div>

            {/* SHARED NAVIGATION */}
            <NavigationBar />

            {/* CONFIRMATION / ALERT MODAL */}
            <Modal
                open={modal.open}
                type={modal.type}
                title={modal.title}
                message={modal.message}
                onConfirm={modal.onConfirm}
                onClose={() => setModal((prev) => ({ ...prev, open: false }))}
            />
        </div>
    );
}

export default Product;
