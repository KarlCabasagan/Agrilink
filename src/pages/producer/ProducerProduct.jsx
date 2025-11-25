import { useState, useEffect, useContext, useCallback, useRef } from "react";
import { Icon } from "@iconify/react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../../App.jsx";
import ProducerNavigationBar from "../../components/ProducerNavigationBar";
import ConfirmModal from "../../components/ConfirmModal";
import { deleteImageFromUrl, uploadImage } from "../../utils/imageUpload";
import supabase from "../../SupabaseClient.jsx";
import { getReviewerAvatarUrl } from "../../utils/avatarUtils.js";

// Helper component for lazy-loading review images with smooth transition
function ReviewImage({ src, alt, className }) {
    const [isLoading, setIsLoading] = useState(true);
    const imgRef = useRef(null);

    useEffect(() => {
        // If the image is already loaded from cache, cancel loading state immediately
        if (imgRef.current && imgRef.current.complete) {
            setIsLoading(false);
        }
    }, []);

    return (
        <div className={`relative overflow-hidden bg-gray-100 ${className}`}>
            {isLoading && (
                <div className="absolute inset-0 bg-gray-200 animate-pulse z-10" />
            )}
            <img
                ref={imgRef}
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

// Helper to fetch crops with specific columns ordered by name
const fetchCropsHelper = async () => {
    const { data, error } = await supabase
        .from("crops")
        .select("id, name, category_id, min_price, max_price")
        .order("name", { ascending: true });

    if (error) {
        console.error("Error fetching crops:", error);
        return [];
    }
    return data || [];
};

function ProducerProduct() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [reviewSortBy, setReviewSortBy] = useState("newest");
    const [reviewStates, setReviewStates] = useState(new Map()); // Map<reviewId, { reported: boolean, isUpdating: boolean }>

    const [crops, setCrops] = useState([]);
    const [cropSearchTerm, setCropSearchTerm] = useState("");
    const [showCropDropdown, setShowCropDropdown] = useState(false);

    const updateReviewState = useCallback((reviewId, updates) => {
        setReviewStates((prevStates) => {
            const newStates = new Map(prevStates);
            newStates.set(reviewId, {
                ...(prevStates.get(reviewId) || {}),
                ...updates,
            });
            return newStates;
        });
    }, []);

    // Fetch available crops when component mounts
    useEffect(() => {
        const initCrops = async () => {
            try {
                const data = await fetchCropsHelper();
                setCrops(data);
            } catch (error) {
                console.error("Unexpected error fetching crops:", error);
            }
        };

        initCrops();
    }, []);

    // Realtime crops subscription: listen for INSERT/UPDATE/DELETE and update crop options live
    useEffect(() => {
        const channel = supabase
            .channel("realtime-crops")
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "crops",
                },
                (payload) => {
                    const newCrop = payload.new;
                    setCrops((prevCrops) => {
                        // Append and resort by name
                        const updated = [...prevCrops, newCrop];
                        return updated.sort((a, b) =>
                            a.name.localeCompare(b.name)
                        );
                    });
                }
            )
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "crops",
                },
                (payload) => {
                    const updatedCrop = payload.new;
                    setCrops((prevCrops) => {
                        // Map/replace and resort by name
                        const updated = prevCrops.map((crop) =>
                            crop.id === updatedCrop.id ? updatedCrop : crop
                        );
                        return updated.sort((a, b) =>
                            a.name.localeCompare(b.name)
                        );
                    });
                }
            )
            .on(
                "postgres_changes",
                {
                    event: "DELETE",
                    schema: "public",
                    table: "crops",
                },
                (payload) => {
                    const deletedCropId = payload.old.id;
                    setCrops((prevCrops) => {
                        // Filter out and resort by name
                        const updated = prevCrops.filter(
                            (crop) => crop.id !== deletedCropId
                        );
                        return updated.sort((a, b) =>
                            a.name.localeCompare(b.name)
                        );
                    });
                }
            )
            .subscribe();

        return () => {
            channel.unsubscribe();
        };
    }, []);

    // Filter and sort crops based on search term (case-insensitive)
    const filteredCrops = crops
        .map((crop) => ({
            name: crop.name,
            exactMatch:
                crop.name.toLowerCase() ===
                (cropSearchTerm || "").toLowerCase(),
            startsWithMatch: crop.name
                .toLowerCase()
                .startsWith((cropSearchTerm || "").toLowerCase()),
        }))
        .filter(
            ({ name, exactMatch, startsWithMatch }) =>
                exactMatch ||
                startsWithMatch ||
                name
                    .toLowerCase()
                    .includes((cropSearchTerm || "").toLowerCase())
        )
        .sort((a, b) => {
            if (a.exactMatch && !b.exactMatch) return -1;
            if (!a.exactMatch && b.exactMatch) return 1;
            if (a.startsWithMatch && !b.startsWithMatch) return -1;
            if (!a.startsWithMatch && b.startsWithMatch) return 1;
            return a.name.localeCompare(b.name);
        })
        .map(({ name }) => name);

    const [editForm, setEditForm] = useState({
        name: "",
        price: "",
        description: "",
        stock: "",
        image_url: "",
        imageFile: null,
        imagePreview: "",
        cropType: "",
    });

    // Sort reviews function
    const sortReviews = (reviews) => {
        if (!reviews || reviews.length === 0) return reviews;

        return [...reviews].sort((a, b) => {
            switch (reviewSortBy) {
                case "newest":
                    return new Date(b.date) - new Date(a.date);
                case "oldest":
                    return new Date(a.date) - new Date(b.date);
                case "highest":
                    return b.rating - a.rating;
                case "lowest":
                    return a.rating - b.rating;
                case "helpful":
                    // Convert helpfulCount to integer and handle undefined values
                    const aCount = parseInt(a.helpfulCount) || 0;
                    const bCount = parseInt(b.helpfulCount) || 0;
                    return bCount - aCount;
                default:
                    return new Date(b.date) - new Date(a.date);
            }
        });
    };

    useEffect(() => {
        if (product) {
            setEditForm({
                name: product.name,
                price: product.price.toString(),
                cropType: product.cropType || "",
                description: product.description,
                stock: product.stock.toString(),
                image_url: product.image_url || "",
                imageFile: null,
                imagePreview: product.image_url || "",
            });
        }
    }, [product]);

    useEffect(() => {
        const fetchProduct = async () => {
            if (!id || !user) return;

            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from("products")
                    .select(
                        `
                        *,
                        categories(name),
                        crops(name),
                        reviews(
                            *,
                            profiles:user_id (
                                name,
                                avatar_url
                            ),
                            helpful_reviews(count)
                        )
                    `
                    )
                    .eq("id", parseInt(id))
                    .eq("user_id", user.id)
                    .single();
                if (error) {
                    console.error("Error fetching product:", error);
                    navigate("/");
                } else {
                    // First, fetch reviews with basic info
                    const { data: reviewsData, error: reviewsError } =
                        await supabase
                            .from("reviews")
                            .select(
                                `
                            id,
                            rating,
                            review,
                            image_url,
                            created_at,
                            profiles:user_id (
                                name,
                                avatar_url
                            )
                        `
                            )
                            .eq("product_id", data.id)
                            .order("created_at", { ascending: false });

                    if (reviewsError) {
                        console.error("Error fetching reviews:", reviewsError);
                    }

                    // Then fetch helpful review counts separately
                    const reviewIds = (reviewsData || []).map(
                        (review) => review.id
                    );
                    const {
                        data: helpfulReviewsData,
                        error: helpfulReviewsError,
                    } = await supabase
                        .from("helpful_reviews")
                        .select("review_id")
                        .in("review_id", reviewIds);

                    if (helpfulReviewsError) {
                        console.error(
                            "Error fetching helpful reviews:",
                            helpfulReviewsError
                        );
                    }

                    // Count helpful reviews per review
                    const helpfulCounts = (helpfulReviewsData || []).reduce(
                        (acc, hr) => {
                            acc[hr.review_id] = (acc[hr.review_id] || 0) + 1;
                            return acc;
                        },
                        {}
                    );

                    // Fetch reported reviews for the current user
                    const { data: reportedReviews, error: reportedError } =
                        await supabase
                            .from("reported_reviews")
                            .select("review_id")
                            .eq("user_id", user.id);

                    if (reportedError) {
                        console.error(
                            "Error fetching reported reviews:",
                            reportedError
                        );
                    }

                    // Create set of reported review IDs
                    const reportedReviewIds = new Set(
                        (reportedReviews || []).map((r) => r.review_id)
                    );

                    // Initialize review states
                    const initialReviewStates = new Map();
                    reviewsData?.forEach((review) => {
                        initialReviewStates.set(review.id, {
                            reported: reportedReviewIds.has(review.id),
                            isUpdating: false,
                        });
                    });
                    setReviewStates(initialReviewStates);

                    // Transform reviews data with correct helpful count per review
                    const reviews = (reviewsData || []).map((review) => ({
                        id: review.id,
                        rating: review.rating,
                        comment: review.review,
                        image: review.image_url || null,
                        date: review.created_at,
                        userName: review.profiles.name,
                        userImage: getReviewerAvatarUrl(review.profiles),
                        helpfulCount: helpfulCounts[review.id] || 0, // Now using the correctly counted helpful reviews
                    }));

                    // Calculate average rating
                    const totalRating = reviews.reduce(
                        (acc, curr) => acc + curr.rating,
                        0
                    );
                    const averageRating =
                        reviews.length > 0
                            ? (totalRating / reviews.length).toFixed(1)
                            : "No ratings";

                    const productData = {
                        id: data.id,
                        name: data.name,
                        price: parseFloat(data.price),
                        category: data.categories?.name || "Other",
                        description: data.description,
                        stock: parseFloat(data.stock),
                        image_url: data.image_url || "",
                        cropType: data.crops?.name || "",
                        status_id: data.status_id,
                        rejection_reason: data.rejection_reason,
                        approval_date: data.approval_date,
                        created_at: data.created_at,
                        updated_at: data.updated_at,
                        rating: averageRating,
                        reviewCount: reviews.length,
                        reviews,
                    };
                    setProduct(productData);
                }
            } catch (error) {
                console.error("Unexpected error:", error);
                navigate("/");
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
    }, [id, user, navigate]);

    // Real-time subscription to product updates
    // Depends only on [id, user?.id] to avoid unnecessary reruns
    useEffect(() => {
        if (!id || !user?.id) return;

        const channel = supabase
            .channel(`product-${id}-${user.id}`)
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "products",
                    filter: `id=eq.${id}`,
                },
                async (payload) => {
                    const newRow = payload.new;
                    const oldRow = payload.old;

                    // Patch only scalar fields that come from the products row
                    setProduct((prev) => {
                        if (!prev || prev.id !== newRow.id) return prev;

                        // Detect if category_id or crop_id changed
                        const categoryIdChanged =
                            oldRow.category_id !== newRow.category_id;
                        const cropIdChanged = oldRow.crop_id !== newRow.crop_id;

                        // If either category or crop changed, fetch the names
                        if (categoryIdChanged || cropIdChanged) {
                            (async () => {
                                const updates = {};

                                if (categoryIdChanged) {
                                    const { data: catData } = await supabase
                                        .from("categories")
                                        .select("name")
                                        .eq("id", newRow.category_id)
                                        .single();
                                    if (catData)
                                        updates.category = catData.name;
                                }

                                if (cropIdChanged) {
                                    const { data: cropData } = await supabase
                                        .from("crops")
                                        .select("name")
                                        .eq("id", newRow.crop_id)
                                        .single();
                                    if (cropData)
                                        updates.cropType = cropData.name;
                                }

                                if (Object.keys(updates).length > 0) {
                                    setProduct((innerPrev) => ({
                                        ...innerPrev,
                                        ...updates,
                                    }));
                                }
                            })();
                        }

                        return {
                            ...prev,
                            name: newRow.name,
                            price: parseFloat(newRow.price),
                            stock: parseFloat(newRow.stock),
                            description: newRow.description,
                            image_url: newRow.image_url ?? prev.image_url,
                            status_id: newRow.status_id ?? prev.status_id,
                            rejection_reason: newRow.rejection_reason,
                            approval_date: newRow.approval_date,
                            updated_at: newRow.updated_at,
                        };
                    });
                }
            )
            .on(
                "postgres_changes",
                {
                    event: "DELETE",
                    schema: "public",
                    table: "products",
                    filter: `id=eq.${id}`,
                },
                () => {
                    navigate("/");
                }
            )
            .subscribe();

        return () => {
            channel.unsubscribe();
        };
    }, [id, user?.id, navigate]);

    // Realtime reviews subscription: listen for INSERT/UPDATE/DELETE and update review list live
    // Runs once when id and user are available
    useEffect(() => {
        if (!id || !user?.id) return;

        const channel = supabase
            .channel(`reviews-${id}-${user.id}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "reviews",
                    filter: `product_id=eq.${id}`,
                },
                async (payload) => {
                    const newReview = payload.new;

                    // Fetch the review with profile and helpful count
                    const { data: reviewData } = await supabase
                        .from("reviews")
                        .select(
                            `
                            id,
                            rating,
                            review,
                            image_url,
                            created_at,
                            profiles:user_id (
                                name,
                                avatar_url
                            )
                        `
                        )
                        .eq("id", newReview.id)
                        .single();

                    if (reviewData) {
                        // Fetch helpful count for this review
                        const { data: helpfulData } = await supabase
                            .from("helpful_reviews")
                            .select("count")
                            .eq("review_id", newReview.id);

                        const helpfulCount =
                            helpfulData && helpfulData.length > 0
                                ? helpfulData[0].count || 0
                                : 0;

                        const transformedReview = {
                            id: reviewData.id,
                            rating: reviewData.rating,
                            comment: reviewData.review,
                            image: reviewData.image_url || null,
                            date: reviewData.created_at,
                            userName: reviewData.profiles.name,
                            userImage: getReviewerAvatarUrl(
                                reviewData.profiles
                            ),
                            helpfulCount: helpfulCount,
                        };

                        setProduct((prev) => {
                            if (!prev) return prev;

                            const updatedReviews = [
                                ...prev.reviews,
                                transformedReview,
                            ];

                            // Recalculate rating and reviewCount
                            const totalRating = updatedReviews.reduce(
                                (acc, curr) => acc + curr.rating,
                                0
                            );
                            const averageRating =
                                updatedReviews.length > 0
                                    ? (
                                          totalRating / updatedReviews.length
                                      ).toFixed(1)
                                    : "No ratings";

                            return {
                                ...prev,
                                reviews: updatedReviews,
                                rating: averageRating,
                                reviewCount: updatedReviews.length,
                            };
                        });

                        // Initialize review state
                        updateReviewState(newReview.id, {
                            reported: false,
                            isUpdating: false,
                        });
                    }
                }
            )
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "reviews",
                    filter: `product_id=eq.${id}`,
                },
                async (payload) => {
                    const updatedReview = payload.new;

                    // Fetch the updated review with profile and helpful count
                    const { data: reviewData } = await supabase
                        .from("reviews")
                        .select(
                            `
                            id,
                            rating,
                            review,
                            created_at,
                            profiles:user_id (
                                name,
                                avatar_url
                            )
                        `
                        )
                        .eq("id", updatedReview.id)
                        .single();

                    if (reviewData) {
                        // Fetch helpful count for this review
                        const { data: helpfulData } = await supabase
                            .from("helpful_reviews")
                            .select("count")
                            .eq("review_id", updatedReview.id);

                        const helpfulCount =
                            helpfulData && helpfulData.length > 0
                                ? helpfulData[0].count || 0
                                : 0;

                        const transformedReview = {
                            id: reviewData.id,
                            rating: reviewData.rating,
                            comment: reviewData.review,
                            date: reviewData.created_at,
                            userName: reviewData.profiles.name,
                            userImage: getReviewerAvatarUrl(
                                reviewData.profiles
                            ),
                            helpfulCount: helpfulCount,
                        };

                        setProduct((prev) => {
                            if (!prev) return prev;

                            // Replace the review in the array
                            const updatedReviews = prev.reviews.map((review) =>
                                review.id === transformedReview.id
                                    ? transformedReview
                                    : review
                            );

                            // Recalculate rating and reviewCount
                            const totalRating = updatedReviews.reduce(
                                (acc, curr) => acc + curr.rating,
                                0
                            );
                            const averageRating =
                                updatedReviews.length > 0
                                    ? (
                                          totalRating / updatedReviews.length
                                      ).toFixed(1)
                                    : "No ratings";

                            return {
                                ...prev,
                                reviews: updatedReviews,
                                rating: averageRating,
                                reviewCount: updatedReviews.length,
                            };
                        });
                    }
                }
            )
            .on(
                "postgres_changes",
                {
                    event: "DELETE",
                    schema: "public",
                    table: "reviews",
                    filter: `product_id=eq.${id}`,
                },
                (payload) => {
                    const deletedReviewId = payload.old.id;

                    setProduct((prev) => {
                        if (!prev) return prev;

                        // Remove the review from the array
                        const updatedReviews = prev.reviews.filter(
                            (review) => review.id !== deletedReviewId
                        );

                        // Recalculate rating and reviewCount
                        const totalRating = updatedReviews.reduce(
                            (acc, curr) => acc + curr.rating,
                            0
                        );
                        const averageRating =
                            updatedReviews.length > 0
                                ? (totalRating / updatedReviews.length).toFixed(
                                      1
                                  )
                                : "No ratings";

                        return {
                            ...prev,
                            reviews: updatedReviews,
                            rating: averageRating,
                            reviewCount: updatedReviews.length,
                        };
                    });

                    // Remove from reviewStates map
                    setReviewStates((prev) => {
                        const newStates = new Map(prev);
                        newStates.delete(deletedReviewId);
                        return newStates;
                    });
                }
            )
            .subscribe();

        return () => {
            channel.unsubscribe();
        };
    }, [id, user?.id, updateReviewState]);

    // Realtime helpful_reviews subscription: update helpful counts live
    // Listen without filters and check if the review belongs to this product
    useEffect(() => {
        if (!id || !user?.id) return;

        const channel = supabase
            .channel(`helpful-reviews-${id}-${user.id}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "helpful_reviews",
                },
                (payload) => {
                    const newHelpfulReview = payload.new;

                    // Check if this review exists in product.reviews
                    setProduct((prev) => {
                        if (!prev) return prev;

                        const reviewExists = prev.reviews.some(
                            (r) => r.id === newHelpfulReview.review_id
                        );

                        if (!reviewExists) return prev;

                        // Bump helpful count for this review
                        return {
                            ...prev,
                            reviews: prev.reviews.map((review) =>
                                review.id === newHelpfulReview.review_id
                                    ? {
                                          ...review,
                                          helpfulCount:
                                              (review.helpfulCount || 0) + 1,
                                      }
                                    : review
                            ),
                        };
                    });
                }
            )
            .on(
                "postgres_changes",
                {
                    event: "DELETE",
                    schema: "public",
                    table: "helpful_reviews",
                },
                (payload) => {
                    const deletedHelpfulReview = payload.old;

                    // Check if this review exists in product.reviews
                    setProduct((prev) => {
                        if (!prev) return prev;

                        const reviewExists = prev.reviews.some(
                            (r) => r.id === deletedHelpfulReview.review_id
                        );

                        if (!reviewExists) return prev;

                        // Decrement helpful count for this review
                        return {
                            ...prev,
                            reviews: prev.reviews.map((review) =>
                                review.id === deletedHelpfulReview.review_id
                                    ? {
                                          ...review,
                                          helpfulCount: Math.max(
                                              0,
                                              (review.helpfulCount || 0) - 1
                                          ),
                                      }
                                    : review
                            ),
                        };
                    });
                }
            )
            .subscribe();

        return () => {
            channel.unsubscribe();
        };
    }, [id, user?.id]);

    // Get selected crop's price range (case-insensitive)
    const getSelectedCrop = () => {
        if (!editForm.cropType) return null;
        // Try exact match first (case-insensitive)
        const exactMatch = crops.find(
            (crop) =>
                crop.name.toLowerCase() === editForm.cropType.toLowerCase()
        );
        if (exactMatch) return exactMatch;

        // Try partial match if no exact match found
        return crops.find((crop) =>
            crop.name.toLowerCase().startsWith(editForm.cropType.toLowerCase())
        );
    };

    // Check if the price is within the valid range
    const isPriceValid = () => {
        const selectedCrop = getSelectedCrop();
        if (!selectedCrop) return false;

        const price = parseFloat(editForm.price);
        return (
            price >= selectedCrop.min_price && price <= selectedCrop.max_price
        );
    };

    // Validate individual form fields
    const isStockValid = () => {
        const stockValue = parseFloat(editForm.stock);
        return !isNaN(stockValue) && stockValue > 0;
    };

    const isCropTypeValid = () => {
        return crops.some(
            (crop) =>
                crop.name.toLowerCase() === editForm.cropType.toLowerCase()
        );
    };

    // Check if form data is valid
    const isFormValid = () => {
        return (
            editForm.name &&
            editForm.price &&
            parseFloat(editForm.price) >= 0 &&
            editForm.stock &&
            isStockValid() &&
            editForm.cropType &&
            isCropTypeValid() &&
            isPriceValid()
        );
    };

    const handleSave = async () => {
        if (!editForm.name || !editForm.price || !editForm.stock) {
            alert("Please fill in all required fields.");
            return;
        }

        // Validate crop type and ensure it's selected
        if (
            !editForm.cropType ||
            !crops.some((crop) => crop.name === editForm.cropType)
        ) {
            alert(
                "Please select a valid crop type from the available options."
            );
            return;
        }

        try {
            // Get crop and its associated category
            const { data: cropData, error: cropError } = await supabase
                .from("crops")
                .select("id, category_id")
                .eq("name", editForm.cropType)
                .single();

            if (cropError) {
                console.error("Error fetching crop data:", cropError);
                alert("Error validating crop type. Please try again.");
                return;
            }

            if (!cropData) {
                alert("Selected crop type not found. Please try again.");
                return;
            }

            // Note: We already have cropData with both id and category_id from above

            // Handle image upload and deletion
            let image_url = product.image_url; // Keep existing image by default
            const userDeletedImage =
                !editForm.imagePreview && !editForm.image_url;

            if (userDeletedImage && product.image_url) {
                await deleteImageFromUrl(product.image_url, "products");
                image_url = null;
            } else if (editForm.imageFile) {
                const uploadResult = await uploadImage(
                    editForm.imageFile,
                    "products",
                    user.id,
                    product.image_url // Pass old image URL for deletion
                );
                if (uploadResult.success) {
                    image_url = uploadResult.url;
                } else {
                    alert(`Image upload failed: ${uploadResult.error}`);
                    return;
                }
            }

            // 🔎 Determine whether changes are non-price/stock (i.e. require re-approval)
            const hasNonPriceStockChanges =
                editForm.name !== product.name ||
                editForm.description !== product.description ||
                editForm.cropType !== product.cropType ||
                editForm.imageFile !== null ||
                (!editForm.image_url && product.image_url) ||
                (editForm.image_url && !product.image_url);

            // Build update payload using crop data's category_id
            const updatePayload = {
                name: editForm.name,
                price: parseFloat(editForm.price),
                category_id: cropData.category_id,
                crop_id: cropData.id,
                description: editForm.description,
                stock: parseFloat(editForm.stock),
                image_url,
                status_id: 1, // Set status to active on update
            };

            // If non-price/stock fields changed, reset rejection reason and approval_date (always include null)
            if (hasNonPriceStockChanges) {
                updatePayload.approval_date = null;
                updatePayload.rejection_reason = null;
            }

            const { data, error } = await supabase
                .from("products")
                .update(updatePayload)
                .eq("id", product.id)
                .select(
                    `
                *,
                categories(name),
                crops(name)
            `
                )
                .single();

            if (error) {
                console.error("Error updating product:", error);
                alert("Error updating product. Please try again.");
            } else {
                // Update the local product state instantly for buttery-smooth UI
                const updatedProduct = {
                    ...product,
                    name: data.name,
                    price: parseFloat(data.price),
                    category: data.categories?.name,
                    description: data.description,
                    stock: parseFloat(data.stock),
                    image_url: data.image_url,
                    cropType: data.crops?.name || editForm.cropType,
                    updated_at: data.updated_at,
                    status_id: data.status_id ?? 1,
                    rejection_reason: null,
                    approval_date: hasNonPriceStockChanges
                        ? null
                        : product.approval_date,
                };

                setProduct(updatedProduct);

                // 🚫 Remove any suspension record since product was successfully updated
                const { error: suspendedDeleteError } = await supabase
                    .from("suspended_products")
                    .delete()
                    .eq("product_id", product.id);

                if (suspendedDeleteError) {
                    console.error(
                        "Error removing product from suspended_products:",
                        suspendedDeleteError
                    );
                }

                setIsEditing(false);
            }
        } catch (error) {
            console.error("Unexpected error:", error);
            alert("An unexpected error occurred. Please try again.");
        }
    };

    const handleDelete = async () => {
        if (!product) return;

        try {
            // First, delete the image from storage if it exists
            if (
                product.image_url &&
                !product.image_url.includes("placeholder") &&
                !product.image_url.includes("gray-apple.png")
            ) {
                await deleteImageFromUrl(product.image_url, "products");
            }

            // Then delete the product from database
            const { error } = await supabase
                .from("products")
                .delete()
                .eq("id", product.id);

            if (error) {
                console.error("Error deleting product:", error);
                alert("Error deleting product. Please try again.");
            } else {
                alert("Product deleted successfully!");
                navigate("/");
            }
        } catch (error) {
            console.error("Unexpected error:", error);
            alert("An unexpected error occurred. Please try again.");
        }
    };

    // Check if any changes have been made to the form
    const hasFormChanges = () => {
        return (
            editForm.name !== product.name ||
            editForm.price !== product.price.toString() ||
            editForm.cropType !== (product.cropType || "") ||
            editForm.description !== product.description ||
            editForm.stock !== product.stock.toString() ||
            editForm.imageFile !== null || // New image selected
            (!editForm.image_url && product.image_url) || // Image removed
            (editForm.image_url && !product.image_url) // Image added
        );
    };

    const handleCancel = () => {
        setEditForm({
            name: product.name,
            price: product.price.toString(),
            cropType: product.cropType || "",
            description: product.description,
            stock: product.stock.toString(),
            image_url: product.image_url || "",
            imageFile: null,
            imagePreview: product.image_url || "",
        });
        setCropSearchTerm("");
        setShowCropDropdown(false);
        setIsEditing(false);
    };

    const handleToggleReport = async (reviewId) => {
        // Get current review state
        const currentState = reviewStates.get(reviewId);
        const isReported = currentState?.reported ?? false;

        // If already updating, ignore
        if (currentState?.isUpdating) return;

        // Set updating state
        updateReviewState(reviewId, { isUpdating: true });

        try {
            if (!isReported) {
                // Add report
                const { error: insertError } = await supabase
                    .from("reported_reviews")
                    .insert([
                        {
                            review_id: reviewId,
                            user_id: user.id,
                        },
                    ]);

                if (insertError) throw insertError;
            } else {
                // Remove report
                const { error: deleteError } = await supabase
                    .from("reported_reviews")
                    .delete()
                    .eq("review_id", reviewId)
                    .eq("user_id", user.id);

                if (deleteError) throw deleteError;
            }

            // Update local state on success
            updateReviewState(reviewId, {
                reported: !isReported,
                isUpdating: false,
            });
        } catch (error) {
            console.error("Error toggling review report:", error);
            alert("Failed to report review. Please try again.");
            updateReviewState(reviewId, { isUpdating: false });
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen w-full flex flex-col relative items-center scrollbar-hide bg-background overflow-x-hidden text-text pb-20">
                <div className="fixed top-0 left-0 w-full bg-white shadow-md z-50 px-4 py-3">
                    <h1 className="text-lg font-semibold text-primary text-center">
                        Product Details
                    </h1>
                </div>
                <div className="flex justify-center items-center h-screen">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
                </div>
                <ProducerNavigationBar />
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen w-full flex flex-col relative items-center scrollbar-hide bg-background overflow-x-hidden text-text pb-20">
                <div className="fixed top-0 left-0 w-full bg-white shadow-md z-50 px-4 py-3">
                    <h1 className="text-lg font-semibold text-primary text-center">
                        Product Not Found
                    </h1>
                </div>
                <div className="flex flex-col justify-center items-center h-screen">
                    <Icon
                        icon="mingcute:box-line"
                        width="64"
                        height="64"
                        className="text-gray-300 mb-4"
                    />
                    <p className="text-gray-500 mb-4">Product not found</p>
                    <button
                        onClick={() => navigate("/")}
                        className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark transition-colors"
                    >
                        Back to Products
                    </button>
                </div>
                <ProducerNavigationBar />
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full flex flex-col relative items-center scrollbar-hide bg-background overflow-x-hidden text-text pb-20">
            {/* Header */}
            <div className="fixed top-0 left-0 w-full bg-white shadow-md z-50 px-4 py-3">
                <div className="flex justify-between items-center">
                    <button
                        onClick={() => navigate("/")}
                        className="text-primary hover:text-primary-dark transition-colors"
                    >
                        <Icon
                            icon="mingcute:arrow-left-line"
                            width="24"
                            height="24"
                        />
                    </button>
                    <h1 className="text-lg font-semibold text-primary">
                        Product Details
                    </h1>
                    <div className="flex gap-2">
                        {!isEditing ? (
                            <>
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="text-blue-600 hover:text-blue-800 transition-colors"
                                >
                                    <Icon
                                        icon="mingcute:edit-line"
                                        width="24"
                                        height="24"
                                    />
                                </button>
                                <button
                                    onClick={() => setShowDeleteModal(true)}
                                    className="text-red-600 hover:text-red-800 transition-colors"
                                >
                                    <Icon
                                        icon="mingcute:delete-line"
                                        width="24"
                                        height="24"
                                    />
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={handleCancel}
                                    className="text-gray-600 hover:text-gray-800 transition-colors"
                                >
                                    <Icon
                                        icon="mingcute:close-line"
                                        width="24"
                                        height="24"
                                    />
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={
                                        !hasFormChanges() || !isFormValid()
                                    }
                                    className={`transition-colors ${
                                        !hasFormChanges() || !isFormValid()
                                            ? "text-gray-400 cursor-not-allowed"
                                            : "text-green-600 hover:text-green-800"
                                    }`}
                                >
                                    <Icon
                                        icon="mingcute:check-line"
                                        width="24"
                                        height="24"
                                    />
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div className="w-full max-w-4xl mx-4 sm:mx-auto my-16">
                {/* Rejection/Suspension Alert */}
                {product.rejection_reason && (
                    <div
                        className={`mb-4 border rounded-lg p-4 ${
                            product.status_id === 2
                                ? "bg-red-50 border-red-200"
                                : "bg-orange-50 border-orange-200"
                        }`}
                    >
                        <div className="flex items-start gap-3">
                            <Icon
                                icon="mingcute:warning-line"
                                className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                                    product.status_id === 2
                                        ? "text-red-500"
                                        : "text-orange-500"
                                }`}
                            />
                            <div>
                                <h4
                                    className={`text-sm font-semibold mb-1 ${
                                        product.status_id === 2
                                            ? "text-red-800"
                                            : "text-orange-800"
                                    }`}
                                >
                                    {product.status_id === 2
                                        ? "Product Suspended"
                                        : "Product Rejected"}
                                </h4>
                                <p
                                    className={`text-sm ${
                                        product.status_id === 2
                                            ? "text-red-700"
                                            : "text-orange-700"
                                    }`}
                                >
                                    {product.rejection_reason}
                                </p>
                                <p
                                    className={`text-xs mt-2 ${
                                        product.status_id === 2
                                            ? "text-red-600"
                                            : "text-orange-600"
                                    }`}
                                >
                                    {product.status_id === 2
                                        ? "Update your product details to address the suspension reason. Product will be reviewed again after update."
                                        : "Update your product details to address the rejection reason. Product will be reviewed again after update."}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="bg-white rounded-lg shadow-md overflow-hidden mt-4">
                    {/* Product Image */}
                    <div className="relative">
                        {isEditing ? (
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Product Image
                                </label>
                                {/* Image Section - Full Width with Camera Icon */}
                                <div className="relative group">
                                    {editForm.imagePreview ||
                                    editForm.image_url ? (
                                        <div className="relative">
                                            <img
                                                src={
                                                    editForm.imagePreview ||
                                                    editForm.image_url
                                                }
                                                alt="Product preview"
                                                className="w-full h-64 object-cover rounded-lg bg-gray-100"
                                            />
                                            {/* Camera and Delete Icons - Bottom Right */}
                                            <div className="absolute bottom-3 right-3 flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setEditForm((prev) => ({
                                                            ...prev,
                                                            imageFile: null,
                                                            imagePreview: "",
                                                            image_url: "",
                                                        }));
                                                    }}
                                                    className="bg-red-500 hover:bg-red-600 text-white rounded-full p-2 shadow-lg transition-colors"
                                                >
                                                    <Icon
                                                        icon="mingcute:delete-line"
                                                        width="18"
                                                        height="18"
                                                    />
                                                </button>
                                                <label className="bg-primary hover:bg-primary-dark text-white rounded-full p-2 shadow-lg transition-colors cursor-pointer">
                                                    <Icon
                                                        icon="mingcute:camera-line"
                                                        width="18"
                                                        height="18"
                                                    />
                                                    <input
                                                        type="file"
                                                        className="hidden"
                                                        accept="image/*"
                                                        onChange={(e) => {
                                                            const file =
                                                                e.target
                                                                    .files[0];
                                                            if (file) {
                                                                // Validate file type
                                                                const allowedTypes =
                                                                    [
                                                                        "image/jpeg",
                                                                        "image/jpg",
                                                                        "image/png",
                                                                        "image/webp",
                                                                    ];
                                                                if (
                                                                    !allowedTypes.includes(
                                                                        file.type
                                                                    )
                                                                ) {
                                                                    alert(
                                                                        "Invalid file type. Please select a JPEG, PNG, or WebP image."
                                                                    );
                                                                    return;
                                                                }

                                                                // Validate file size (5MB)
                                                                if (
                                                                    file.size >
                                                                    5 *
                                                                        1024 *
                                                                        1024
                                                                ) {
                                                                    alert(
                                                                        "File size too large. Maximum size is 5MB."
                                                                    );
                                                                    return;
                                                                }

                                                                // Create preview
                                                                const reader =
                                                                    new FileReader();
                                                                reader.onload =
                                                                    (e) => {
                                                                        setEditForm(
                                                                            (
                                                                                prev
                                                                            ) => ({
                                                                                ...prev,
                                                                                imagePreview:
                                                                                    e
                                                                                        .target
                                                                                        .result,
                                                                            })
                                                                        );
                                                                    };
                                                                reader.readAsDataURL(
                                                                    file
                                                                );
                                                                setEditForm(
                                                                    (prev) => ({
                                                                        ...prev,
                                                                        imageFile:
                                                                            file,
                                                                    })
                                                                );
                                                            }
                                                        }}
                                                    />
                                                </label>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="relative bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg h-64 hover:border-primary hover:bg-gray-50 transition-colors cursor-pointer">
                                            <label className="absolute inset-0 flex items-center justify-center cursor-pointer">
                                                <div className="text-center">
                                                    <div className="mx-auto w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                                                        <Icon
                                                            icon="mingcute:camera-line"
                                                            width="24"
                                                            height="24"
                                                            className="text-primary"
                                                        />
                                                    </div>
                                                    <p className="text-gray-700 font-medium mb-1">
                                                        Add Product Image
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        Click anywhere to select
                                                        an image
                                                    </p>
                                                </div>
                                                <input
                                                    type="file"
                                                    className="hidden"
                                                    accept="image/*"
                                                    onChange={(e) => {
                                                        const file =
                                                            e.target.files[0];
                                                        if (file) {
                                                            // Validate file type
                                                            const allowedTypes =
                                                                [
                                                                    "image/jpeg",
                                                                    "image/jpg",
                                                                    "image/png",
                                                                    "image/webp",
                                                                ];
                                                            if (
                                                                !allowedTypes.includes(
                                                                    file.type
                                                                )
                                                            ) {
                                                                alert(
                                                                    "Invalid file type. Please select a JPEG, PNG, or WebP image."
                                                                );
                                                                return;
                                                            }

                                                            // Validate file size (5MB)
                                                            if (
                                                                file.size >
                                                                5 * 1024 * 1024
                                                            ) {
                                                                alert(
                                                                    "File size too large. Maximum size is 5MB."
                                                                );
                                                                return;
                                                            }

                                                            // Create preview
                                                            const reader =
                                                                new FileReader();
                                                            reader.onload = (
                                                                e
                                                            ) => {
                                                                setEditForm(
                                                                    (prev) => ({
                                                                        ...prev,
                                                                        imagePreview:
                                                                            e
                                                                                .target
                                                                                .result,
                                                                    })
                                                                );
                                                            };
                                                            reader.readAsDataURL(
                                                                file
                                                            );
                                                            setEditForm(
                                                                (prev) => ({
                                                                    ...prev,
                                                                    imageFile:
                                                                        file,
                                                                })
                                                            );
                                                        }
                                                    }}
                                                />
                                            </label>
                                        </div>
                                    )}
                                </div>
                                <div className="mt-2 text-center">
                                    <p className="text-xs text-gray-500">
                                        {editForm.imageFile
                                            ? "New image selected • PNG, JPG, or WebP (Max 5MB)"
                                            : editForm.image_url
                                            ? "Current product image"
                                            : "PNG, JPG, or WebP (Max 5MB)"}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="h-64 sm:h-80 bg-gray-200">
                                <img
                                    src={
                                        product.image_url ||
                                        "/assets/gray-apple.png"
                                    }
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        e.target.src = "/assets/gray-apple.png";
                                    }}
                                />
                            </div>
                        )}
                    </div>

                    {/* Product Details */}
                    <div className="p-6">
                        {isEditing ? (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Display Name *
                                        </label>
                                        <input
                                            type="text"
                                            value={editForm.name}
                                            onChange={(e) =>
                                                setEditForm((prev) => ({
                                                    ...prev,
                                                    name: e.target.value,
                                                }))
                                            }
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                                            required
                                        />
                                    </div>
                                    {/* Crop Type Field */}
                                    <div className="relative">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Crop Type
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={editForm.cropType}
                                                onChange={(e) => {
                                                    const value =
                                                        e.target.value;
                                                    const matchingCrop =
                                                        crops.find(
                                                            (crop) =>
                                                                crop.name.toLowerCase() ===
                                                                value.toLowerCase()
                                                        );
                                                    setEditForm((prev) => ({
                                                        ...prev,
                                                        cropType: matchingCrop
                                                            ? matchingCrop.name
                                                            : value,
                                                    }));
                                                    setCropSearchTerm(value);
                                                    setShowCropDropdown(
                                                        value.length > 0
                                                    );
                                                }}
                                                onBlur={() => {
                                                    setTimeout(() => {
                                                        setShowCropDropdown(
                                                            false
                                                        );
                                                        // Correct case on blur if there's a match
                                                        const matchingCrop =
                                                            crops.find(
                                                                (crop) =>
                                                                    crop.name.toLowerCase() ===
                                                                    editForm.cropType.toLowerCase()
                                                            );
                                                        if (matchingCrop) {
                                                            setEditForm(
                                                                (prev) => ({
                                                                    ...prev,
                                                                    cropType:
                                                                        matchingCrop.name,
                                                                })
                                                            );
                                                        }
                                                    }, 150);
                                                }}
                                                className={`w-full px-3 py-2 border rounded-lg focus:ring-primary focus:border-primary
        ${
            editForm.cropType && !isCropTypeValid()
                ? "border-red-300 bg-red-50/25"
                : getSelectedCrop()
                ? "border-green-300 bg-green-50/25"
                : "border-gray-300"
        }`}
                                                placeholder="Search for crop type..."
                                            />
                                            <Icon
                                                icon="material-symbols:search"
                                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"
                                            />

                                            {/* Dropdown */}
                                            {showCropDropdown &&
                                                filteredCrops.length > 0 && (
                                                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                                        {filteredCrops.map(
                                                            (crop) => (
                                                                <div
                                                                    key={crop}
                                                                    className="px-3 py-2 hover:bg-primary/10 cursor-pointer text-sm"
                                                                    onMouseDown={(
                                                                        e
                                                                    ) => {
                                                                        e.preventDefault();
                                                                        setEditForm(
                                                                            (
                                                                                prev
                                                                            ) => ({
                                                                                ...prev,
                                                                                cropType:
                                                                                    crop,
                                                                            })
                                                                        );
                                                                        setCropSearchTerm(
                                                                            crop
                                                                        );
                                                                        setShowCropDropdown(
                                                                            false
                                                                        );
                                                                    }}
                                                                >
                                                                    {crop}
                                                                </div>
                                                            )
                                                        )}
                                                    </div>
                                                )}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <div className="flex items-center justify-between mb-1">
                                            <label className="block text-sm font-medium text-gray-700">
                                                Price per kg *
                                            </label>
                                            {getSelectedCrop() && (
                                                <span className="text-sm font-medium text-primary">
                                                    Range: ₱
                                                    {getSelectedCrop().min_price.toFixed(
                                                        2
                                                    )}
                                                    – ₱
                                                    {getSelectedCrop().max_price.toFixed(
                                                        2
                                                    )}
                                                </span>
                                            )}
                                        </div>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                                                ₱
                                            </span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min={
                                                    getSelectedCrop()
                                                        ?.min_price || 0
                                                }
                                                max={
                                                    getSelectedCrop()
                                                        ?.max_price || 999999
                                                }
                                                value={editForm.price}
                                                onChange={(e) =>
                                                    setEditForm((prev) => ({
                                                        ...prev,
                                                        price: e.target.value,
                                                    }))
                                                }
                                                disabled={!editForm.cropType}
                                                className={`w-full pl-7 pr-3 py-2 border rounded-lg focus:ring-primary focus:border-primary
                                                    ${
                                                        !editForm.cropType
                                                            ? "bg-gray-100 cursor-not-allowed"
                                                            : editForm.price &&
                                                              !isPriceValid()
                                                            ? "border-red-300 bg-red-50/25"
                                                            : "border-gray-300 bg-white"
                                                    }
                                                `}
                                                required
                                            />
                                        </div>
                                        {editForm.price && !isPriceValid() && (
                                            <p className="mt-1 text-sm text-red-600">
                                                Price must be within the crop's
                                                valid range
                                            </p>
                                        )}
                                        {!editForm.cropType && (
                                            <p className="mt-1 text-sm text-gray-500">
                                                Select a crop type first to set
                                                the price
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Stock (kg) *
                                        </label>
                                        <input
                                            type="number"
                                            min="0.1"
                                            step="0.1"
                                            value={editForm.stock}
                                            onChange={(e) =>
                                                setEditForm((prev) => ({
                                                    ...prev,
                                                    stock: e.target.value,
                                                }))
                                            }
                                            className={`w-full px-3 py-2 border rounded-lg focus:ring-primary focus:border-primary
                                                ${
                                                    editForm.stock &&
                                                    !isStockValid()
                                                        ? "border-red-300 bg-red-50/25"
                                                        : "border-gray-300 bg-white"
                                                }`}
                                            required
                                        />
                                        {editForm.stock && !isStockValid() && (
                                            <p className="mt-1 text-sm text-red-600">
                                                Stock must be greater than 0 kg
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Description
                                    </label>
                                    <textarea
                                        value={editForm.description}
                                        onChange={(e) =>
                                            setEditForm((prev) => ({
                                                ...prev,
                                                description: e.target.value,
                                            }))
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                                        rows="4"
                                        placeholder="Describe your product..."
                                    />
                                </div>
                            </div>
                        ) : (
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800 mb-2">
                                    {product.name}
                                </h1>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                                    <div className="bg-gray-50 p-3 rounded-lg">
                                        <h3 className="text-sm font-medium text-gray-600 mb-1">
                                            Price per kg
                                        </h3>
                                        <p className="text-xl font-bold text-primary">
                                            ₱{product.price.toFixed(2)}
                                        </p>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded-lg">
                                        <h3 className="text-sm font-medium text-gray-600 mb-1">
                                            Stock
                                        </h3>
                                        <p className="text-lg font-semibold text-gray-800">
                                            {product.stock} kg
                                        </p>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded-lg">
                                        <h3 className="text-sm font-medium text-gray-600 mb-1">
                                            Category
                                        </h3>
                                        <p className="text-lg font-semibold text-gray-800">
                                            {product.category}
                                        </p>
                                    </div>
                                    {product.cropType && (
                                        <div className="bg-gray-50 p-3 rounded-lg">
                                            <h3 className="text-sm font-medium text-gray-600 mb-1">
                                                Crop Type
                                            </h3>
                                            <p className="text-lg font-semibold text-gray-800">
                                                {product.cropType}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {product.description && (
                                    <div className="mb-6">
                                        <h3 className="text-lg font-semibold text-gray-800 mb-2">
                                            Description
                                        </h3>
                                        <p className="text-gray-600 leading-relaxed">
                                            {product.description}
                                        </p>
                                    </div>
                                )}

                                {/* Rating and Reviews Summary */}
                                <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 mb-6">
                                    <h3 className="text-lg font-semibold text-gray-800 mb-6">
                                        Customer Reviews
                                    </h3>

                                    {/* Main Rating Display */}
                                    <div className="flex items-center justify-center mb-6 p-4 bg-gray-50 rounded-lg">
                                        <div className="text-center">
                                            <div className="text-4xl font-bold text-gray-800 mb-2">
                                                {product.ratingDisplay}
                                            </div>
                                            <div className="flex items-center justify-center gap-1 mb-2">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <Icon
                                                        key={star}
                                                        icon="mingcute:star-fill"
                                                        className={`w-6 h-6 ${
                                                            star <=
                                                            Math.floor(
                                                                product.rating
                                                            )
                                                                ? "text-yellow-400"
                                                                : star ===
                                                                      Math.ceil(
                                                                          product.rating
                                                                      ) &&
                                                                  product.rating %
                                                                      1 !==
                                                                      0
                                                                ? "text-yellow-200"
                                                                : "text-gray-300"
                                                        }`}
                                                    />
                                                ))}
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                Based on {product.reviewCount}{" "}
                                                reviews
                                            </div>
                                        </div>
                                    </div>

                                    {/* Rating Breakdown */}
                                    <div className="space-y-2">
                                        {[5, 4, 3, 2, 1].map((rating) => {
                                            // Count reviews for this rating
                                            const ratingCount =
                                                product.reviews?.filter(
                                                    (review) =>
                                                        Math.floor(
                                                            review.rating
                                                        ) === rating
                                                ).length || 0;

                                            // Calculate percentage for the bar width
                                            const percentage =
                                                product.reviewCount > 0
                                                    ? (
                                                          (ratingCount /
                                                              product.reviewCount) *
                                                          100
                                                      ).toFixed(1)
                                                    : 0;

                                            return (
                                                <div
                                                    key={rating}
                                                    className="flex items-center gap-2"
                                                >
                                                    <div className="flex items-center gap-1 w-16">
                                                        <span className="text-sm font-medium text-gray-700">
                                                            {rating}
                                                        </span>
                                                        <Icon
                                                            icon="mingcute:star-fill"
                                                            className="w-4 h-4 text-yellow-400"
                                                        />
                                                    </div>
                                                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-yellow-400 rounded-full transition-all duration-300 ease-in-out"
                                                            style={{
                                                                width: `${percentage}%`,
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="w-20 text-right">
                                                        <span className="text-sm text-gray-600">
                                                            {ratingCount} (
                                                            {percentage}%)
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Individual Reviews */}
                                {product.reviews &&
                                    product.reviews.length > 0 && (
                                        <div className="mb-6">
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="text-lg font-semibold text-gray-800">
                                                    Recent Reviews
                                                </h3>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm text-gray-600">
                                                        Sort by:
                                                    </span>
                                                    <select
                                                        value={reviewSortBy}
                                                        onChange={(e) =>
                                                            setReviewSortBy(
                                                                e.target.value
                                                            )
                                                        }
                                                        className="text-sm px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-white"
                                                    >
                                                        <option value="newest">
                                                            Newest First
                                                        </option>
                                                        <option value="oldest">
                                                            Oldest First
                                                        </option>
                                                        <option value="highest">
                                                            Highest Rating
                                                        </option>
                                                        <option value="lowest">
                                                            Lowest Rating
                                                        </option>
                                                        <option value="helpful">
                                                            Most Helpful
                                                        </option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                {sortReviews(product.reviews)
                                                    .slice(0, 3)
                                                    .map((review, index) => {
                                                        return (
                                                            <div
                                                                key={`${review.id}-${reviewSortBy}-${index}`}
                                                                className="bg-white border border-gray-200 rounded-lg shadow-sm p-6"
                                                            >
                                                                <div className="flex items-start justify-between mb-4">
                                                                    <div className="flex items-start gap-4 flex-1">
                                                                        <img
                                                                            src={
                                                                                review.userImage
                                                                            }
                                                                            alt={
                                                                                review.userName
                                                                            }
                                                                            className="w-12 h-12 rounded-full object-cover"
                                                                        />
                                                                        <div className="flex-1">
                                                                            <div className="flex items-center gap-2 mb-2">
                                                                                <h4 className="font-medium text-gray-800">
                                                                                    {
                                                                                        review.userName
                                                                                    }
                                                                                </h4>
                                                                                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                                                                                    Purchased
                                                                                </span>
                                                                            </div>
                                                                            <div className="flex items-center gap-2 mb-3">
                                                                                <div className="flex">
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
                                                                                            <Icon
                                                                                                key={
                                                                                                    star
                                                                                                }
                                                                                                icon="mingcute:star-fill"
                                                                                                className={`w-4 h-4 ${
                                                                                                    star <=
                                                                                                    review.rating
                                                                                                        ? "text-yellow-400"
                                                                                                        : "text-gray-300"
                                                                                                }`}
                                                                                            />
                                                                                        )
                                                                                    )}
                                                                                </div>
                                                                                <span className="text-sm text-gray-500">
                                                                                    {new Date(
                                                                                        review.date
                                                                                    ).toLocaleDateString(
                                                                                        "en-US",
                                                                                        {
                                                                                            year: "numeric",
                                                                                            month: "long",
                                                                                            day: "numeric",
                                                                                        }
                                                                                    )}
                                                                                </span>
                                                                            </div>
                                                                            <p className="text-gray-600 leading-relaxed mb-3">
                                                                                {
                                                                                    review.comment
                                                                                }
                                                                            </p>
                                                                            {review.image && (
                                                                                <ReviewImage
                                                                                    src={
                                                                                        review.image
                                                                                    }
                                                                                    alt="Review"
                                                                                    className="mt-3 mb-3 max-w-xs rounded-lg h-40 w-40"
                                                                                />
                                                                            )}
                                                                            <div className="flex items-center justify-between gap-4 text-sm text-gray-500">
                                                                                {review.helpfulCount >
                                                                                    0 && (
                                                                                    <span className="flex items-center gap-1">
                                                                                        <Icon
                                                                                            icon="mingcute:thumb-up-line"
                                                                                            width="14"
                                                                                            height="14"
                                                                                        />
                                                                                        {
                                                                                            review.helpfulCount
                                                                                        }{" "}
                                                                                        helpful
                                                                                    </span>
                                                                                )}

                                                                                <div />
                                                                                {/* Report Review Button */}
                                                                                <button
                                                                                    onClick={() =>
                                                                                        handleToggleReport(
                                                                                            review.id
                                                                                        )
                                                                                    }
                                                                                    disabled={
                                                                                        reviewStates.get(
                                                                                            review.id
                                                                                        )
                                                                                            ?.isUpdating
                                                                                    }
                                                                                    className={`flex items-center gap-1 hover:text-red-600 transition-colors
                                                                                        ${
                                                                                            reviewStates.get(
                                                                                                review.id
                                                                                            )
                                                                                                ?.reported
                                                                                                ? "text-red-600"
                                                                                                : ""
                                                                                        }`}
                                                                                >
                                                                                    <Icon
                                                                                        icon={
                                                                                            reviewStates.get(
                                                                                                review.id
                                                                                            )
                                                                                                ?.reported
                                                                                                ? "mingcute:flag-2-fill"
                                                                                                : "mingcute:flag-2-line"
                                                                                        }
                                                                                        width="14"
                                                                                        height="14"
                                                                                    />
                                                                                    {reviewStates.get(
                                                                                        review.id
                                                                                    )
                                                                                        ?.reported
                                                                                        ? "Reported"
                                                                                        : "Report"}
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                            </div>
                                            {product.reviews.length > 3 && (
                                                <div className="mt-6 text-center">
                                                    <button className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark transition-colors font-medium">
                                                        View all{" "}
                                                        {product.reviewCount}{" "}
                                                        reviews
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                open={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDelete}
                title="Delete Product"
                message={`Are you sure you want to delete "${product.name}"? This action cannot be undone.`}
                confirmText="Delete"
                confirmButtonClass="bg-red-600 hover:bg-red-700"
            />

            <ProducerNavigationBar />
        </div>
    );
}

export default ProducerProduct;
