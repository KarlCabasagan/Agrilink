import { useParams, useNavigate } from "react-router-dom";
import {
    useState,
    useMemo,
    useEffect,
    useContext,
    useCallback,
    useRef,
} from "react";
import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";
import NavigationBar from "../../components/NavigationBar";
import Modal from "../../components/Modal";
import supabase from "../../SupabaseClient";
import { AuthContext } from "../../App.jsx";
import { addToCart } from "../../utils/cartUtils.js";
import { toast } from "react-hot-toast";

function Product() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const [quantity, setQuantity] = useState(0.1);
    const [quantityError, setQuantityError] = useState("");
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [addingToCart, setAddingToCart] = useState(false);
    // Track the user's current cart quantity for this product (in kg, 1-decimal)
    const [currentCartQty, setCurrentCartQty] = useState(0);
    const [loadingCartQty, setLoadingCartQty] = useState(false);
    const [modal, setModal] = useState({
        open: false,
        type: "",
        title: "",
        message: "",
        onConfirm: null,
    });
    const [reviewSort, setReviewSort] = useState("newest");
    const [highlightedReviewId, setHighlightedReviewId] = useState(null);
    const reviewRefs = useRef(new Map());
    const searchParams = new URLSearchParams(window.location.search);
    const [reviewStates, setReviewStates] = useState(new Map()); // Map<reviewId, { helpful: boolean, reported: boolean, helpfulCount: number, isUpdating: boolean }>

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
            };
            const next = { ...current, ...updates };
            const newMap = new Map(prev);
            newMap.set(reviewId, next);
            return newMap;
        });
    }, []);

    const handleMarkHelpful = async (reviewId) => {
        if (!user) return;

        const currentState = reviewStates.get(reviewId) || {
            helpful: false,
            reported: false,
            helpfulCount: 0,
            isUpdating: false,
            isEditing: false,
            editRating: 0,
            editComment: "",
        };

        if (currentState.isUpdating) return;

        const isCurrentlyHelpful = currentState.helpful;
        const helpfulDelta = isCurrentlyHelpful ? -1 : 1;

        // Optimistic update
        updateReviewState(reviewId, {
            helpful: !isCurrentlyHelpful,
            helpfulCount: currentState.helpfulCount + helpfulDelta,
            isUpdating: true,
        });

        // If currently reported, remove the report first
        if (currentState.reported) {
            updateReviewState(reviewId, { reported: false });
            try {
                const { error: reportError } = await supabase
                    .from("reported_reviews")
                    .delete()
                    .eq("user_id", user.id)
                    .eq("review_id", reviewId);

                if (reportError) throw reportError;
            } catch (error) {
                console.error("Error removing report:", error);
                // Report removal failed, revert reported state
                updateReviewState(reviewId, { reported: true });
            }
        }

        try {
            let error;
            if (isCurrentlyHelpful) {
                ({ error } = await supabase
                    .from("helpful_reviews")
                    .delete()
                    .eq("user_id", user.id)
                    .eq("review_id", reviewId));
            } else {
                ({ error } = await supabase
                    .from("helpful_reviews")
                    .insert({
                        user_id: user.id,
                        review_id: reviewId,
                    })
                    .single());

                if (error?.code === "23505") {
                    error = null; // Already exists - treat as success
                }
            }

            if (error) throw error;
        } catch (error) {
            console.error("Error toggling helpful review:", error);
            // Roll back optimistic update
            updateReviewState(reviewId, {
                helpful: isCurrentlyHelpful,
                helpfulCount: currentState.helpfulCount,
                isUpdating: false,
            });
            toast.error("Failed to update review status. Please try again.");
        } finally {
            updateReviewState(reviewId, { isUpdating: false });
        }
    };

    const handleEditReview = (reviewId) => {
        const review = product.reviews.find((r) => r.id === reviewId);
        if (!review) return;

        updateReviewState(reviewId, {
            isEditing: true,
            editRating: review.rating,
            editComment: review.comment || "",
        });
    };

    const handleCancelEdit = (reviewId) => {
        updateReviewState(reviewId, {
            isEditing: false,
            editRating: 0,
            editComment: "",
        });
    };

    const handleDeleteReview = async (reviewId) => {
        if (!user) return;

        const review = product.reviews.find((r) => r.id === reviewId);
        if (!review || review.user_id !== user.id) return;

        // Calculate new rating stats for optimistic update
        const remainingReviews = product.reviews.filter(
            (r) => r.id !== reviewId
        );
        const newAvgRating =
            remainingReviews.length > 0
                ? remainingReviews.reduce((sum, r) => sum + r.rating, 0) /
                  remainingReviews.length
                : 0;

        // Optimistic update
        updateReviewState(reviewId, { isUpdating: true });
        setProduct((prev) => ({
            ...prev,
            rating: newAvgRating,
            reviews: prev.reviews.filter((r) => r.id !== reviewId),
        }));

        try {
            const { error } = await supabase
                .from("reviews")
                .delete()
                .eq("id", reviewId)
                .eq("user_id", user.id)
                .single();

            if (error) throw error;

            toast.success("Review deleted successfully");
        } catch (error) {
            console.error("Error deleting review:", error);
            // Roll back optimistic update
            setProduct((prev) => ({
                ...prev,
                rating: review.rating,
                reviews: [...prev.reviews, review].sort(
                    (a, b) => new Date(b.created_at) - new Date(a.created_at)
                ),
            }));
            toast.error("Failed to delete review. Please try again.");
        } finally {
            updateReviewState(reviewId, { isUpdating: false });
        }
    };

    const handleSaveEdit = async (reviewId) => {
        if (!user) return;

        const currentState = reviewStates.get(reviewId) || {
            isEditing: false,
            editRating: 0,
            editComment: "",
            isUpdating: false,
        };

        if (currentState.isUpdating) return;

        const review = product.reviews.find((r) => r.id === reviewId);
        if (!review) return;

        // Save current values for rollback
        const originalRating = review.rating;
        const originalComment = review.comment;

        // Optimistic update
        updateReviewState(reviewId, { isUpdating: true });
        setProduct((prev) => ({
            ...prev,
            reviews: prev.reviews.map((r) =>
                r.id === reviewId
                    ? {
                          ...r,
                          rating: currentState.editRating,
                          comment: currentState.editComment,
                      }
                    : r
            ),
        }));

        try {
            const { error } = await supabase
                .from("reviews")
                .update({
                    rating: currentState.editRating,
                    review: currentState.editComment,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", reviewId)
                .eq("user_id", user.id)
                .single();

            if (error) throw error;

            // Success - exit edit mode
            updateReviewState(reviewId, {
                isEditing: false,
                isUpdating: false,
                editRating: 0,
                editComment: "",
            });
        } catch (error) {
            console.error("Error updating review:", error);
            // Roll back optimistic update
            setProduct((prev) => ({
                ...prev,
                reviews: prev.reviews.map((r) =>
                    r.id === reviewId
                        ? {
                              ...r,
                              rating: originalRating,
                              comment: originalComment,
                          }
                        : r
                ),
            }));
            updateReviewState(reviewId, {
                isUpdating: false,
                editRating: originalRating,
                editComment: originalComment,
            });
            toast.error("Failed to update review. Please try again.");
        }
    };

    const handleToggleReport = async (reviewId) => {
        if (!user) return;

        const currentState = reviewStates.get(reviewId) || {
            helpful: false,
            reported: false,
            helpfulCount: 0,
            isUpdating: false,
            isEditing: false,
            editRating: 0,
            editComment: "",
        };

        if (currentState.isUpdating) return;

        const isCurrentlyReported = currentState.reported;

        // Optimistic update
        updateReviewState(reviewId, {
            reported: !isCurrentlyReported,
            isUpdating: true,
        });

        // If currently helpful, remove the helpful mark first
        if (currentState.helpful) {
            const helpfulDelta = -1;
            updateReviewState(reviewId, {
                helpful: false,
                helpfulCount: currentState.helpfulCount + helpfulDelta,
            });

            try {
                const { error: helpfulError } = await supabase
                    .from("helpful_reviews")
                    .delete()
                    .eq("user_id", user.id)
                    .eq("review_id", reviewId);

                if (helpfulError) throw helpfulError;
            } catch (error) {
                console.error("Error removing helpful mark:", error);
                // Helpful removal failed, revert helpful state
                updateReviewState(reviewId, {
                    helpful: true,
                    helpfulCount: currentState.helpfulCount,
                });
            }
        }

        try {
            let error;
            if (isCurrentlyReported) {
                ({ error } = await supabase
                    .from("reported_reviews")
                    .delete()
                    .eq("user_id", user.id)
                    .eq("review_id", reviewId));
            } else {
                ({ error } = await supabase
                    .from("reported_reviews")
                    .insert({
                        user_id: user.id,
                        review_id: reviewId,
                    })
                    .single());

                if (error?.code === "23505") {
                    error = null; // Already exists - treat as success
                }
            }

            if (error) throw error;
        } catch (error) {
            console.error("Error toggling review report:", error);
            // Roll back optimistic update
            updateReviewState(reviewId, {
                reported: isCurrentlyReported,
                isUpdating: false,
            });
            toast.error("Failed to update report status. Please try again.");
        } finally {
            updateReviewState(reviewId, { isUpdating: false });
        }
    };

    const showModal = (type, title, message, onConfirm = null) => {
        setModal({ open: true, type, title, message, onConfirm });
    };

    const sortOptions = [
        { id: "newest", label: "Newest First", icon: "mingcute:time-line" },
        { id: "oldest", label: "Oldest First", icon: "mingcute:time-fill" },
        { id: "highest", label: "Highest Rating", icon: "mingcute:star-fill" },
        { id: "lowest", label: "Lowest Rating", icon: "mingcute:star-line" },
    ];

    const sortReviews = (reviews, sortType) => {
        const sorted = [...reviews];
        switch (sortType) {
            case "oldest":
                return sorted.sort(
                    (a, b) => new Date(a.rawDate) - new Date(b.rawDate)
                );
            case "highest":
                return sorted.sort((a, b) => b.rating - a.rating);
            case "lowest":
                return sorted.sort((a, b) => a.rating - b.rating);
            case "newest":
            default:
                return sorted.sort(
                    (a, b) => new Date(b.rawDate) - new Date(a.rawDate)
                );
        }
    };

    // Create a memoized array of reviews with owner's review first
    const sortedReviews = useMemo(() => {
        if (!product?.reviews) return [];

        // Find owner's review if user is authenticated
        const ownerReview =
            user && product.reviews.find((r) => r.user_id === user.id);

        // Get non-owner reviews
        const otherReviews = ownerReview
            ? product.reviews.filter((r) => r.user_id !== user.id)
            : product.reviews;

        // Sort non-owner reviews using existing sort function
        const sortedOtherReviews = sortReviews(otherReviews, reviewSort);

        // Combine owner review (if exists) with sorted other reviews
        return ownerReview
            ? [ownerReview, ...sortedOtherReviews]
            : sortedOtherReviews;
    }, [product?.reviews, reviewSort, user?.id]);

    // Fetch product details
    useEffect(() => {
        const fetchProduct = async () => {
            setLoading(true);
            try {
                // Fetch product details and reviews in parallel
                const [
                    productResult,
                    reviewsResult,
                    helpfulResult,
                    reportedResult,
                ] = await Promise.all([
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
                            profiles:user_id(
                                name,
                                avatar_url
                            ),
                            helpful_count:helpful_reviews(count),
                            reported_count:reported_reviews(count)
                        `
                        )
                        .eq("product_id", id),

                    user
                        ? supabase
                              .from("helpful_reviews")
                              .select("review_id")
                              .eq("user_id", user.id)
                        : Promise.resolve({ data: [] }),

                    user
                        ? supabase
                              .from("reported_reviews")
                              .select("review_id")
                              .eq("user_id", user.id)
                        : Promise.resolve({ data: [] }),
                ]);

                const { data: productData, error: productError } =
                    productResult;
                const { data: reviewsData, error: reviewsError } =
                    reviewsResult;

                if (productError || !productData) {
                    console.error("Error fetching product:", productError);
                    setProduct(null);
                    return;
                }

                if (reviewsError) {
                    console.error("Error fetching reviews:", reviewsError);
                    // Continue without reviews rather than failing completely
                }

                // Process reviews
                // Initialize review states
                const userHelpfulReviews = new Set(
                    (helpfulResult.data || []).map((hr) => hr.review_id)
                );
                const userReportedReviews = new Set(
                    (reportedResult.data || []).map((rr) => rr.review_id)
                );

                // Initialize review states Map
                const initialReviewStates = new Map();
                (reviewsData || []).forEach((review) => {
                    initialReviewStates.set(review.id, {
                        helpful: userHelpfulReviews.has(review.id),
                        reported: userReportedReviews.has(review.id),
                        helpfulCount: review.helpful_count?.[0]?.count || 0,
                        isUpdating: false,
                        isEditing: false,
                        editRating: 0,
                        editComment: "",
                    });
                });
                setReviewStates(initialReviewStates);

                const reviews = (reviewsData || []).map((review) => ({
                    id: review.id,
                    user: review.profiles?.name || "Anonymous User",
                    user_id: review.user_id,
                    avatar: review.profiles?.avatar_url || null,
                    rating: parseFloat(review.rating),
                    comment: review.review || "",
                    rawDate: review.updated_at,
                    date: new Date(review.updated_at).toLocaleDateString(
                        "en-US",
                        {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                        }
                    ),
                    helpfulCount: review.helpful_count?.[0]?.count || 0,
                    reportedCount: review.reported_count?.[0]?.count || 0,
                }));

                // Calculate average rating
                const avgRating =
                    reviews.length > 0
                        ? reviews.reduce((sum, r) => sum + r.rating, 0) /
                          reviews.length
                        : 0;

                const formattedProduct = {
                    id: productData.id,
                    name: productData.name,
                    price: parseFloat(productData.price),
                    image:
                        productData.image_url ||
                        "https://via.placeholder.com/300x200?text=No+Image",
                    address:
                        productData.profiles?.address ||
                        "Location not available",
                    category: productData.categories?.name || "Other",
                    farmerName: productData.profiles?.name || "Unknown Farmer",
                    description: productData.description,
                    stock: parseFloat(productData.stock) || 0,
                    rating: avgRating,
                    minimumOrderQuantity:
                        parseFloat(
                            productData.profiles?.minimum_order_quantity
                        ) || 1,
                    deliveryCost:
                        parseFloat(productData.profiles?.delivery_cost) || 50,
                    pickupLocation:
                        productData.profiles?.address || "Farm location",
                    farmerId: productData.user_id,
                    reviews: reviews,
                };

                setProduct(formattedProduct);
                setQuantity(
                    Math.max(0.1, formattedProduct.minimumOrderQuantity)
                );
            } catch (error) {
                console.error("Unexpected error fetching product:", error);
                setProduct(null); // show "Product not found"
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchProduct();
        }
    }, [id]);

    // Helper to refresh current cart quantity for this product (can be called after add/cap)
    const refreshCartQty = async () => {
        if (!user || !product) {
            setCurrentCartQty(0);
            return;
        }

        setLoadingCartQty(true);
        try {
            const { data: cartData, error: cartError } = await supabase
                .from("carts")
                .select("id")
                .eq("user_id", user.id)
                .single();

            if (cartError && cartError.code && cartError.code !== "PGRST116") {
                throw cartError;
            }

            if (!cartData) {
                setCurrentCartQty(0);
                return;
            }

            const { data: cartItem, error: itemError } = await supabase
                .from("cart_items")
                .select("quantity")
                .eq("cart_id", cartData.id)
                .eq("product_id", product.id)
                .single();

            if (itemError && itemError.code && itemError.code !== "PGRST116") {
                throw itemError;
            }

            const qty = cartItem
                ? Math.round(parseFloat(cartItem.quantity) * 10) / 10
                : 0;
            setCurrentCartQty(isNaN(qty) ? 0 : qty);
        } catch (error) {
            console.error("Error refreshing cart quantity:", error);
            setCurrentCartQty(0);
        } finally {
            setLoadingCartQty(false);
        }
    };

    // Refresh cart qty when user or product changes
    useEffect(() => {
        refreshCartQty();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, product]);

    const handleAddToCart = async () => {
        if (!user || !product) return;

        setAddingToCart(true);
        try {
            // ensure numeric requested quantity (rounded to 1 decimal)
            const requested = Math.round(parseFloat(quantity) * 10) / 10;
            if (isNaN(requested) || requested <= 0) {
                showModal(
                    "error",
                    "Invalid Quantity",
                    "Please enter a valid quantity to add.",
                    () => setModal((prev) => ({ ...prev, open: false }))
                );
                return;
            }

            // Try to find existing cart for this user
            const { data: cartData, error: cartError } = await supabase
                .from("carts")
                .select("id")
                .eq("user_id", user.id)
                .single();

            if (cartError && cartError.code && cartError.code !== "PGRST116") {
                // unexpected error
                throw cartError;
            }

            // If no cart exists, fallback to existing addToCart flow (which will create a cart)
            if (!cartData) {
                const result = await addToCart(user.id, product.id, requested);
                if (result.success) {
                    showModal(
                        "success",
                        "Item Added to Cart!",
                        `Successfully added ${requested} kg of ${product.name} to your cart. You can continue shopping or go to cart to checkout.`,
                        () => setModal((prev) => ({ ...prev, open: false }))
                    );
                } else {
                    showModal(
                        "error",
                        "Error",
                        `Error: ${result.message}`,
                        () => setModal((prev) => ({ ...prev, open: false }))
                    );
                }
                return;
            }

            // Cart exists - check for existing cart item for this product
            const { data: existingCartItem, error: itemError } = await supabase
                .from("cart_items")
                .select("id, quantity")
                .eq("cart_id", cartData.id)
                .eq("product_id", product.id)
                .single();

            if (itemError && itemError.code && itemError.code !== "PGRST116") {
                throw itemError;
            }

            // product.stock already available on `product` from fetch
            const stock = Math.round(parseFloat(product.stock) * 10) / 10;

            if (existingCartItem) {
                const currentQty =
                    Math.round(parseFloat(existingCartItem.quantity) * 10) / 10;

                // If current cart quantity already exceeds stock, cap it and notify
                if (currentQty > stock) {
                    const { error: capError } = await supabase
                        .from("cart_items")
                        .update({ quantity: stock })
                        .eq("cart_id", cartData.id)
                        .eq("product_id", product.id);

                    if (capError) throw capError;

                    // Inform user the quantity was capped
                    toast.success(
                        `Quantity for ${product.name} was capped to available stock (${stock} kg).`
                    );
                    await refreshCartQty();
                    return;
                }

                // Compute capped total and addDelta
                const cappedTotal =
                    Math.round(Math.min(stock, currentQty + requested) * 10) /
                    10;
                const addDelta =
                    Math.round(Math.max(0, cappedTotal - currentQty) * 10) / 10;

                if (addDelta <= 0) {
                    // Nothing to add — already at or above requested cap
                    toast(
                        "Cart already contains the maximum available quantity for this product."
                    );
                    return;
                }

                // Proceed to add only the delta amount
                const result = await addToCart(user.id, product.id, addDelta);
                if (result.success) {
                    showModal(
                        "success",
                        "Item Added to Cart!",
                        `Successfully added ${addDelta} kg of ${product.name} to your cart (capped to stock where necessary).`,
                        () => setModal((prev) => ({ ...prev, open: false }))
                    );
                    await refreshCartQty();
                } else {
                    showModal(
                        "error",
                        "Error",
                        `Error: ${result.message}`,
                        () => setModal((prev) => ({ ...prev, open: false }))
                    );
                }
                return;
            }

            // No existing cart item - compute capped add amount
            const capped = Math.round(Math.min(stock, requested) * 10) / 10;
            const addDelta = Math.round(Math.max(0, capped) * 10) / 10; // currentQty is 0

            if (addDelta <= 0) {
                toast("Requested quantity exceeds available stock or is zero.");
                return;
            }

            const result = await addToCart(user.id, product.id, addDelta);
            if (result.success) {
                showModal(
                    "success",
                    "Item Added to Cart!",
                    `Successfully added ${addDelta} kg of ${product.name} to your cart.`,
                    () => setModal((prev) => ({ ...prev, open: false }))
                );
                await refreshCartQty();
            } else {
                showModal("error", "Error", `Error: ${result.message}`, () =>
                    setModal((prev) => ({ ...prev, open: false }))
                );
            }
        } catch (error) {
            console.error("Error adding to cart:", error);
            showModal(
                "error",
                "Error",
                "Error adding to cart. Please try again.",
                () => setModal((prev) => ({ ...prev, open: false }))
            );
        } finally {
            setAddingToCart(false);
        }
    };

    const handleMessageFarmer = async () => {
        if (!user || !product) return;

        try {
            // First, check if a conversation already exists
            const { data: existingConversation, error: fetchError } =
                await supabase
                    .from("conversations")
                    .select("id")
                    .eq("consumer_id", user.id)
                    .eq("producer_id", product.farmerId)
                    .single();

            if (fetchError && fetchError.code !== "PGRST116") {
                // PGRST116 means no rows returned
                console.error(
                    "Error checking existing conversation:",
                    fetchError
                );
                showModal(
                    "error",
                    "Error",
                    "Unable to start conversation. Please try again.",
                    () => setModal((prev) => ({ ...prev, open: false }))
                );
                return;
            }

            let conversationId;

            if (existingConversation) {
                // Use existing conversation
                conversationId = existingConversation.id;
            } else {
                // Create new conversation
                const { data: newConversation, error: insertError } =
                    await supabase
                        .from("conversations")
                        .insert({
                            consumer_id: user.id,
                            producer_id: product.farmerId,
                        })
                        .select("id")
                        .single();

                if (insertError) {
                    console.error("Error creating conversation:", insertError);
                    showModal(
                        "error",
                        "Error",
                        "Unable to start conversation. Please try again.",
                        () => setModal((prev) => ({ ...prev, open: false }))
                    );
                    return;
                }

                conversationId = newConversation.id;
            }

            // Redirect to messages page with the conversation ID
            navigate(`/messages?conversation=${conversationId}`);
        } catch (error) {
            console.error("Error handling message farmer:", error);
            showModal(
                "error",
                "Error",
                "An unexpected error occurred. Please try again.",
                () => setModal((prev) => ({ ...prev, open: false }))
            );
        }
    };

    const increaseQuantity = () => {
        if (!product) return;
        const newQuantity = Math.round((quantity + 0.1) * 10) / 10;
        if (newQuantity <= product.stock) {
            setQuantity(newQuantity);
        }
    };

    const decreaseQuantity = () => {
        if (!product) return;
        const newQuantity = Math.round((quantity - 0.1) * 10) / 10;
        if (newQuantity >= 0.1) {
            setQuantity(newQuantity);
        }
    };

    const validateQuantity = (value) => {
        if (!product) return "";
        if (isNaN(value) || value === "") return "Please enter a valid number";
        if (value <= 0) return "Quantity must be greater than 0";
        if (value < 0.1) return "Minimum quantity is 0.1 kg";
        if (value > product.stock)
            return `Maximum quantity available is ${product.stock} kg`;
        return "";
    };

    const handleQuantityChange = (e) => {
        if (!product) return;
        const inputValue = e.target.value;
        const numValue = parseFloat(inputValue);

        // Allow empty input for typing
        if (inputValue === "") {
            setQuantity(inputValue);
            setQuantityError("Please enter a valid number");
            return;
        }

        // Allow typing any number but show error if invalid
        setQuantity(inputValue);
        const error = validateQuantity(numValue);
        setQuantityError(error);
    };

    const handleQuantityBlur = () => {
        if (!product) return;
        const numValue = parseFloat(quantity);

        // On blur, enforce valid value
        if (isNaN(numValue) || numValue < 0.1) {
            setQuantity(0.1);
            setQuantityError("");
        } else if (numValue > product.stock) {
            setQuantity(product.stock);
            setQuantityError("");
        } else {
            // Round to 1 decimal place
            setQuantity(Math.round(numValue * 10) / 10);
            setQuantityError("");
        }
    };

    // Handle scrolling to user's review when ?reviewFocus=user is present
    useEffect(() => {
        const shouldFocusUserReview =
            searchParams.get("reviewFocus") === "user";
        if (!shouldFocusUserReview || !user || !product?.reviews || loading)
            return;

        // Find the user's review
        const userReview = product.reviews.find((r) => r.user_id === user.id);
        if (!userReview) return;

        // Get the ref for the review
        const reviewRef = reviewRefs.current.get(userReview.id);
        if (!reviewRef) return;

        // Short delay to ensure the DOM is ready
        const timer = setTimeout(() => {
            reviewRef.scrollIntoView({ behavior: "smooth", block: "center" });
            setHighlightedReviewId(userReview.id);

            // Remove highlight after animation
            setTimeout(() => setHighlightedReviewId(null), 2000);
        }, 100);

        return () => clearTimeout(timer);
    }, [product?.reviews, user?.id, loading, searchParams]);

    // Handle scrolling to user's review when ?reviewFocus=user is present
    useEffect(() => {
        const shouldFocusUserReview =
            searchParams.get("reviewFocus") === "user";
        if (!shouldFocusUserReview || !user || !product?.reviews || loading)
            return;

        // Find the user's review
        const userReview = product.reviews.find((r) => r.user_id === user.id);
        if (!userReview) return;

        // Get the ref for the review
        const reviewRef = reviewRefs.current.get(userReview.id);
        if (!reviewRef) return;

        // Short delay to ensure the DOM is ready
        const timer = setTimeout(() => {
            reviewRef.scrollIntoView({ behavior: "smooth", block: "center" });
            setHighlightedReviewId(userReview.id);

            // Remove highlight after animation
            setTimeout(() => setHighlightedReviewId(null), 2000);
        }, 100);

        return () => clearTimeout(timer);
    }, [product?.reviews, user?.id, loading, searchParams]);

    if (loading) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center bg-background">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background text-center">
                <Icon
                    icon="mingcute:sad-line"
                    width="80"
                    height="80"
                    className="text-gray-300 mb-4"
                />
                <h2 className="text-xl font-bold text-gray-600 mb-2">
                    Product not found
                </h2>
                <p className="text-gray-500 mb-6">
                    The product you're looking for doesn't exist or is no longer
                    available.
                </p>
                <Link
                    to="/"
                    className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-dark transition-colors font-medium"
                >
                    Back to Home
                </Link>
            </div>
        );
    }

    const renderStars = (rating) => {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;
        const emptyStars = 5 - Math.ceil(rating);

        return (
            <>
                {[...Array(fullStars)].map((_, i) => (
                    <Icon
                        key={i}
                        icon="mingcute:star-fill"
                        className="text-yellow-400"
                        width="16"
                        height="16"
                    />
                ))}
                {hasHalfStar && (
                    <Icon
                        key="half"
                        icon="mingcute:star-half-fill"
                        className="text-yellow-400"
                        width="16"
                        height="16"
                    />
                )}
                {[...Array(emptyStars)].map((_, i) => (
                    <Icon
                        key={`empty-${i}`}
                        icon="mingcute:star-line"
                        className="text-gray-300"
                        width="16"
                        height="16"
                    />
                ))}
            </>
        );
    };

    return (
        <div className="min-h-screen w-full flex flex-col relative items-center scrollbar-hide bg-background overflow-x-hidden text-text pb-20">
            {/* Header with Cart and Back buttons */}
            <div className="fixed top-0 left-0 w-full bg-white shadow-md z-50 px-4 py-3 flex justify-between items-center">
                <Link to="/" className="text-gray-600 hover:text-primary">
                    <Icon icon="mingcute:left-line" width="24" height="24" />
                </Link>
                <h1 className="text-lg font-semibold">Product Details</h1>
                <Link to="/orders" className="text-gray-600 hover:text-primary">
                    <Icon icon="mingcute:truck-line" width="24" height="24" />
                </Link>
            </div>

            {product ? (
                <div className="w-full max-w-2xl bg-white shadow-md mt-16 mx-4 sm:mx-0">
                    <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-64 sm:h-80 object-cover"
                        loading="lazy"
                    />

                    <div className="p-4 sm:p-6">
                        <h1 className="text-2xl sm:text-3xl font-bold mb-2">
                            {product.name}
                        </h1>

                        <div className="bg-green-50 p-3 rounded-lg mb-4">
                            <div className="flex items-center gap-2 mb-1">
                                <Icon
                                    icon="mingcute:user-3-line"
                                    width="20"
                                    height="20"
                                    className="text-green-600"
                                />
                                <span className="font-semibold text-green-800">
                                    Farmer: {product.farmerName}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Icon
                                    icon="mingcute:location-line"
                                    width="16"
                                    height="16"
                                    className="text-green-600"
                                />
                                <span className="text-green-700 text-sm">
                                    {product.address}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 mb-4">
                            <div className="flex">
                                {renderStars(product.rating)}
                            </div>
                            <span className="text-gray-600 text-sm">
                                (
                                {product.rating
                                    ? product.rating.toFixed(1)
                                    : "0"}
                                /5)
                            </span>
                            <span className="text-gray-500 text-sm">
                                • {product.reviews.length}{" "}
                                {product.reviews.length === 1
                                    ? "review"
                                    : "reviews"}
                            </span>
                        </div>

                        <p className="text-3xl sm:text-4xl font-bold text-primary mb-3">
                            ₱{product.price.toFixed(2)}/kg
                        </p>

                        <p className="text-gray-600 mb-4">
                            Stock:{" "}
                            <span
                                className={
                                    product.stock > 10
                                        ? "text-green-600"
                                        : "text-red-600"
                                }
                            >
                                {product.stock} kg available
                            </span>
                        </p>

                        <div className="mb-4">
                            <span className="bg-gray-100 px-3 py-1 rounded-full text-sm text-gray-700">
                                {product.category}
                            </span>
                        </div>

                        <div className="mb-6">
                            <h3 className="font-semibold mb-2 text-lg">
                                Description
                            </h3>
                            <p className="text-gray-700 leading-relaxed">
                                {product.description}
                            </p>
                        </div>

                        <div className="flex items-center gap-4 mb-6">
                            <span className="font-semibold">
                                Quantity (kg):
                            </span>
                            <div className="flex-1 max-w-[200px]">
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={quantity}
                                        onChange={handleQuantityChange}
                                        onBlur={handleQuantityBlur}
                                        step="0.1"
                                        className={`w-full px-4 py-2 border rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
                                            quantityError
                                                ? "border-red-300 bg-red-50"
                                                : "border-gray-300"
                                        }`}
                                    />
                                </div>
                            </div>

                            {quantityError ? (
                                <p className="left-0 top-full mt-1 text-sm text-red-500">
                                    {quantityError}
                                </p>
                            ) : (
                                <span className="text-sm text-gray-500 whitespace-nowrap">
                                    Max: {product.stock} kg
                                </span>
                            )}
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 mb-6">
                            {(() => {
                                const stockRounded =
                                    Math.round(
                                        (parseFloat(product.stock) || 0) * 10
                                    ) / 10;
                                const isMaxed =
                                    stockRounded > 0 &&
                                    currentCartQty >= stockRounded;
                                const disabled =
                                    stockRounded === 0 ||
                                    addingToCart ||
                                    isMaxed;

                                return (
                                    <>
                                        <button
                                            onClick={handleAddToCart}
                                            disabled={disabled}
                                            className={`flex-1 py-3 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 ${
                                                disabled
                                                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                                    : "bg-primary text-white hover:bg-primary-dark"
                                            }`}
                                        >
                                            <Icon
                                                icon="mingcute:shopping-cart-1-line"
                                                width="20"
                                                height="20"
                                            />
                                            {stockRounded === 0
                                                ? "Out of Stock"
                                                : addingToCart
                                                ? "Adding..."
                                                : isMaxed
                                                ? "Max stock reached"
                                                : "Add to Cart"}
                                        </button>
                                    </>
                                );
                            })()}
                            <button
                                onClick={handleMessageFarmer}
                                className="flex-1 py-3 px-4 rounded-lg font-semibold border-2 border-primary text-primary hover:bg-primary hover:text-white transition-colors flex items-center justify-center gap-2"
                            >
                                <Icon
                                    icon="mingcute:message-3-line"
                                    width="20"
                                    height="20"
                                />
                                Message Farmer
                            </button>
                        </div>
                        <hr className="my-6 border-gray-300" />
                        <div className="mt-8 mb-20">
                            <div className="space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex items-center justify-between sm:justify-start gap-3">
                                        <h3 className="font-semibold text-lg">
                                            Customer Reviews
                                        </h3>
                                        <div className="text-sm text-gray-500">
                                            {product.reviews.length}{" "}
                                            {product.reviews.length === 1
                                                ? "review"
                                                : "reviews"}
                                        </div>
                                    </div>

                                    {product.reviews.length > 0 && (
                                        <div className="flex items-center gap-2 self-end">
                                            <span className="text-sm text-gray-500">
                                                Sort by:
                                            </span>
                                            <select
                                                value={reviewSort}
                                                onChange={(e) =>
                                                    setReviewSort(
                                                        e.target.value
                                                    )
                                                }
                                                className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-primary focus:border-primary"
                                            >
                                                {sortOptions.map((option) => (
                                                    <option
                                                        key={option.id}
                                                        value={option.id}
                                                    >
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>

                                {product.reviews.length > 0 ? (
                                    <div className="space-y-6 divide-y divide-gray-100">
                                        {sortedReviews.map((review) => (
                                            <div
                                                key={review.id}
                                                ref={(el) =>
                                                    reviewRefs.current.set(
                                                        review.id,
                                                        el
                                                    )
                                                }
                                                className={`pt-6 first:pt-0 ${
                                                    highlightedReviewId ===
                                                    review.id
                                                        ? "bg-primary/5 -mx-4 px-4 transition-colors duration-1000"
                                                        : ""
                                                }`}
                                            >
                                                <div className="flex items-start gap-4">
                                                    <div className="flex-shrink-0">
                                                        {review.avatar ? (
                                                            <img
                                                                src={
                                                                    review.avatar
                                                                }
                                                                alt={
                                                                    review.user
                                                                }
                                                                className="w-10 h-10 rounded-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                                <Icon
                                                                    icon="mingcute:user-4-fill"
                                                                    className="w-6 h-6 text-primary/60"
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0 mb-4">
                                                        <div className="flex justify-between items-start">
                                                            <div className="space-y-1">
                                                                <span className="font-medium text-gray-900 block">
                                                                    {
                                                                        review.user
                                                                    }
                                                                </span>
                                                                <div className="flex items-center gap-2">
                                                                    <div className="flex">
                                                                        {renderStars(
                                                                            review.rating
                                                                        )}
                                                                    </div>
                                                                    <span className="text-sm text-gray-500">
                                                                        {review.rating.toFixed(
                                                                            1
                                                                        )}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <span className="text-sm text-gray-500 whitespace-nowrap">
                                                                {review.date}
                                                            </span>
                                                        </div>
                                                        {review.comment && (
                                                            <p className="mt-3 text-gray-700 text-sm object-contain text-wrap">
                                                                {review.comment}
                                                            </p>
                                                        )}
                                                        <div className="w-full mt-3 flex items-center justify-end gap-2">
                                                            {(() => {
                                                                const state =
                                                                    reviewStates.get(
                                                                        review.id
                                                                    ) || {
                                                                        helpful: false,
                                                                        reported: false,
                                                                        helpfulCount: 0,
                                                                        isUpdating: false,
                                                                        isEditing: false,
                                                                        editRating:
                                                                            review.rating,
                                                                        editComment:
                                                                            review.comment ||
                                                                            "",
                                                                    };

                                                                const isOwner =
                                                                    user?.id ===
                                                                    review.user_id;

                                                                if (isOwner) {
                                                                    return (
                                                                        <div className="w-full flex items-center just justify-between gap-2">
                                                                            {state.helpfulCount >
                                                                                0 && (
                                                                                <div
                                                                                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm transition-colors`}
                                                                                >
                                                                                    <Icon
                                                                                        icon={
                                                                                            "mingcute:thumb-up-line"
                                                                                        }
                                                                                        className="text-gray-500"
                                                                                        width="16"
                                                                                        height="16"
                                                                                    />
                                                                                    <span className="text-gray-500">
                                                                                        Helpful
                                                                                    </span>
                                                                                    {state.helpfulCount >
                                                                                        0 && (
                                                                                        <span className="text-xs text-gray-500">
                                                                                            (
                                                                                            {
                                                                                                state.helpfulCount
                                                                                            }

                                                                                            )
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                            )}
                                                                            <span></span>
                                                                            <div className="flex items-center justify-end gap-2">
                                                                                <button
                                                                                    onClick={() =>
                                                                                        handleEditReview(
                                                                                            review.id
                                                                                        )
                                                                                    }
                                                                                    disabled={
                                                                                        state.isUpdating
                                                                                    }
                                                                                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm transition-colors bg-gray-50 text-gray-600 hover:bg-gray-100"
                                                                                >
                                                                                    <Icon
                                                                                        icon="mingcute:edit-line"
                                                                                        width="16"
                                                                                        height="16"
                                                                                    />
                                                                                    <span className="hidden sm:block">
                                                                                        Edit
                                                                                        Review
                                                                                    </span>
                                                                                </button>
                                                                                <button
                                                                                    key={`delete-${review.id}`}
                                                                                    onClick={() =>
                                                                                        handleDeleteReview(
                                                                                            review.id
                                                                                        )
                                                                                    }
                                                                                    disabled={
                                                                                        state.isUpdating
                                                                                    }
                                                                                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm transition-colors bg-red-50 text-red-600 hover:bg-red-100"
                                                                                    aria-label="Delete review"
                                                                                >
                                                                                    <Icon
                                                                                        icon="mingcute:delete-line"
                                                                                        width="16"
                                                                                        height="16"
                                                                                        className={
                                                                                            state.isUpdating
                                                                                                ? "animate-pulse"
                                                                                                : ""
                                                                                        }
                                                                                    />
                                                                                    <span className="hidden sm:block">
                                                                                        Delete
                                                                                    </span>
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                }

                                                                return (
                                                                    <>
                                                                        <div className="w-full flex items-center justify-between gap-2">
                                                                            <div>
                                                                                {state.helpfulCount >
                                                                                    0 && (
                                                                                    <div
                                                                                        className={`sm:hidden inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm transition-colors`}
                                                                                    >
                                                                                        <Icon
                                                                                            icon={
                                                                                                "mingcute:thumb-up-line"
                                                                                            }
                                                                                            className="text-gray-500"
                                                                                            width="16"
                                                                                            height="16"
                                                                                        />
                                                                                        <span className="text-gray-500">
                                                                                            Helpful
                                                                                        </span>
                                                                                        {state.helpfulCount >
                                                                                            0 && (
                                                                                            <span className="text-xs text-gray-500">
                                                                                                (
                                                                                                {
                                                                                                    state.helpfulCount
                                                                                                }

                                                                                                )
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                            <div />
                                                                            <div className="flex items-center justify-end gap-2">
                                                                                <button
                                                                                    onClick={() =>
                                                                                        handleMarkHelpful(
                                                                                            review.id
                                                                                        )
                                                                                    }
                                                                                    disabled={
                                                                                        !user ||
                                                                                        state.isUpdating
                                                                                    }
                                                                                    aria-pressed={
                                                                                        state.helpful
                                                                                    }
                                                                                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm transition-colors ${
                                                                                        state.helpful
                                                                                            ? "bg-primary/10 text-primary"
                                                                                            : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                                                                                    } ${
                                                                                        !user
                                                                                            ? "cursor-not-allowed opacity-50"
                                                                                            : ""
                                                                                    }`}
                                                                                >
                                                                                    <Icon
                                                                                        icon={
                                                                                            state.helpful
                                                                                                ? "mingcute:thumb-up-fill"
                                                                                                : "mingcute:thumb-up-line"
                                                                                        }
                                                                                        className={
                                                                                            state.isUpdating
                                                                                                ? "animate-pulse"
                                                                                                : ""
                                                                                        }
                                                                                        width="16"
                                                                                        height="16"
                                                                                    />
                                                                                    <span className="hidden sm:block">
                                                                                        Helpful
                                                                                    </span>
                                                                                    {state.helpfulCount >
                                                                                        0 && (
                                                                                        <span className="text-xs ml-1 hidden sm:inline-block">
                                                                                            (
                                                                                            {
                                                                                                state.helpfulCount
                                                                                            }

                                                                                            )
                                                                                        </span>
                                                                                    )}
                                                                                </button>
                                                                                <button
                                                                                    onClick={() =>
                                                                                        handleToggleReport(
                                                                                            review.id
                                                                                        )
                                                                                    }
                                                                                    disabled={
                                                                                        !user ||
                                                                                        state.isUpdating
                                                                                    }
                                                                                    aria-pressed={
                                                                                        state.reported
                                                                                    }
                                                                                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm transition-colors ${
                                                                                        state.reported
                                                                                            ? "bg-red-50 text-red-600"
                                                                                            : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                                                                                    } ${
                                                                                        !user
                                                                                            ? "cursor-not-allowed opacity-50"
                                                                                            : ""
                                                                                    }`}
                                                                                >
                                                                                    <Icon
                                                                                        icon={
                                                                                            state.reported
                                                                                                ? "mingcute:flag-2-fill"
                                                                                                : "mingcute:flag-2-line"
                                                                                        }
                                                                                        className={
                                                                                            state.isUpdating
                                                                                                ? "animate-pulse"
                                                                                                : ""
                                                                                        }
                                                                                        width="16"
                                                                                        height="16"
                                                                                    />
                                                                                    <span className="hidden sm:block">
                                                                                        {state.reported
                                                                                            ? "Reported"
                                                                                            : "Report"}
                                                                                    </span>
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    </>
                                                                );
                                                            })()}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="w-full mt-3">
                                                    {(() => {
                                                        const state =
                                                            reviewStates.get(
                                                                review.id
                                                            ) || {
                                                                helpful: false,
                                                                reported: false,
                                                                helpfulCount: 0,
                                                                isUpdating: false,
                                                                isEditing: false,
                                                                editRating:
                                                                    review.rating,
                                                                editComment:
                                                                    review.comment ||
                                                                    "",
                                                            };

                                                        const isOwner =
                                                            user?.id ===
                                                            review.user_id;

                                                        if (isOwner) {
                                                            if (
                                                                state.isEditing
                                                            ) {
                                                                return (
                                                                    <div className="space-y-4">
                                                                        <div className="flex items-center gap-4">
                                                                            <label className="text-sm font-medium text-gray-700">
                                                                                Rating:
                                                                            </label>
                                                                            <div className="flex gap-1">
                                                                                {[
                                                                                    1,
                                                                                    2,
                                                                                    3,
                                                                                    4,
                                                                                    5,
                                                                                ].map(
                                                                                    (
                                                                                        star
                                                                                    ) => (
                                                                                        <button
                                                                                            key={
                                                                                                star
                                                                                            }
                                                                                            type="button"
                                                                                            onClick={() =>
                                                                                                updateReviewState(
                                                                                                    review.id,
                                                                                                    {
                                                                                                        editRating:
                                                                                                            star,
                                                                                                    }
                                                                                                )
                                                                                            }
                                                                                            className="focus:outline-none focus:ring-2 focus:ring-primary"
                                                                                        >
                                                                                            <Icon
                                                                                                icon={
                                                                                                    star <=
                                                                                                    state.editRating
                                                                                                        ? "mingcute:star-fill"
                                                                                                        : "mingcute:star-line"
                                                                                                }
                                                                                                className="text-yellow-400"
                                                                                                width="20"
                                                                                                height="20"
                                                                                            />
                                                                                        </button>
                                                                                    )
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                        <textarea
                                                                            value={
                                                                                state.editComment
                                                                            }
                                                                            onChange={(
                                                                                e
                                                                            ) =>
                                                                                updateReviewState(
                                                                                    review.id,
                                                                                    {
                                                                                        editComment:
                                                                                            e
                                                                                                .target
                                                                                                .value,
                                                                                    }
                                                                                )
                                                                            }
                                                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary resize-none"
                                                                            rows="3"
                                                                            placeholder="Write your review here..."
                                                                        />
                                                                        <div className="flex justify-end gap-2">
                                                                            <button
                                                                                onClick={() =>
                                                                                    handleCancelEdit(
                                                                                        review.id
                                                                                    )
                                                                                }
                                                                                disabled={
                                                                                    state.isUpdating
                                                                                }
                                                                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-primary"
                                                                            >
                                                                                Cancel
                                                                            </button>
                                                                            <button
                                                                                onClick={() =>
                                                                                    handleSaveEdit(
                                                                                        review.id
                                                                                    )
                                                                                }
                                                                                disabled={
                                                                                    !state.editRating ||
                                                                                    state.isUpdating
                                                                                }
                                                                                className={`px-4 py-2 text-sm font-medium text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                                                                                    !state.editRating ||
                                                                                    state.isUpdating
                                                                                        ? "bg-gray-400 cursor-not-allowed"
                                                                                        : "bg-primary hover:bg-primary-dark"
                                                                                }`}
                                                                            >
                                                                                {state.isUpdating
                                                                                    ? "Saving..."
                                                                                    : "Save"}
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            }
                                                        }
                                                    })()}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                                        <Icon
                                            icon="mingcute:comment-line"
                                            className="mx-auto mb-3 text-gray-300"
                                            width="32"
                                            height="32"
                                        />
                                        <p className="text-gray-500">
                                            No reviews yet. Be the first to
                                            review this product!
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="w-full h-[calc(100vh-64px)] flex items-center justify-center">
                    <p className="text-gray-400 text-lg">Product not found.</p>
                </div>
            )}
            <NavigationBar />
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
