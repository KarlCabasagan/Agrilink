import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import AdminNavigationBar from "../../components/AdminNavigationBar";
import supabase from "../../SupabaseClient";
import { getReviewerAvatarUrl } from "../../utils/avatarUtils.js";

// Helper component for lazy-loading review images with smooth transition
function ReviewImage({ src, alt, className }) {
    const [isLoading, setIsLoading] = useState(true);

    return (
        <div className={`relative overflow-hidden bg-gray-100 ${className}`}>
            {isLoading && (
                <div className="absolute inset-0 bg-gray-200 animate-pulse z-10" />
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

function AdminProductReviews() {
    const { productId } = useParams();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");
    const [sortConfig, setSortConfig] = useState({
        key: "date",
        direction: "desc",
    });
    const [filterRating, setFilterRating] = useState("all");
    const [deletingReviews, setDeletingReviews] = useState(new Set());

    // Sample product data
    const [product, setProduct] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch product and its reviews
    useEffect(() => {
        const fetchProductAndReviews = async () => {
            try {
                setIsLoading(true);
                setError(null);

                // Fetch product details
                const { data: productData, error: productError } =
                    await supabase
                        .from("products")
                        .select(
                            `
                        id,
                        name,
                        description,
                        price,
                        stock,
                        image_url,
                        category: categories (
                            name
                        ),
                        crop: crops (
                            name
                        ),
                        producer: profiles (
                            name,
                            avatar_url
                        )
                    `
                        )
                        .eq("id", productId)
                        .single();

                if (productError) throw productError;

                // Fetch all reviews for this product
                const { data: reviewsData, error: reviewsError } =
                    await supabase
                        .from("reviews")
                        .select(
                            `
                        id,
                        review,
                        rating,
                        image_url,
                        created_at,
                        product: products!reviews_product_id_fkey (
                            id,
                            user_id
                        ),
                        reviewer: profiles!reviews_user_id_fkey (
                            id,
                            name,
                            email,
                            avatar_url
                        )
                    `
                        )
                        .eq("product_id", productId);

                if (reviewsError) throw reviewsError;

                // Get all review IDs for helpful/reported counts
                const reviewIds = reviewsData.map((review) => review.id);

                // Fetch helpful votes
                const { data: helpfulVotes, error: helpfulError } =
                    await supabase
                        .from("helpful_reviews")
                        .select("review_id")
                        .in("review_id", reviewIds);

                if (helpfulError) throw helpfulError;

                // Fetch reported flags
                const { data: reportedFlags, error: reportedError } =
                    await supabase
                        .from("reported_reviews")
                        .select("review_id")
                        .in("review_id", reviewIds);

                if (reportedError) throw reportedError;

                // Aggregate counts client-side
                const helpfulCounts = helpfulVotes.reduce((acc, vote) => {
                    acc[vote.review_id] = (acc[vote.review_id] || 0) + 1;
                    return acc;
                }, {});

                const reportedCounts = reportedFlags.reduce((acc, flag) => {
                    acc[flag.review_id] = (acc[flag.review_id] || 0) + 1;
                    return acc;
                }, {});

                // Transform reviews data to match UI expectations
                const processedReviews = reviewsData.map((review) => {
                    return {
                        id: review.id,
                        customerName: review.reviewer.name,
                        customerEmail: review.reviewer.email,
                        customerAvatar: getReviewerAvatarUrl(review.reviewer),
                        rating: review.rating,
                        comment: review.review,
                        reviewImage: review.image_url || null,
                        date: review.created_at,
                        verified: review.reviewer.id === review.product.user_id, // Verified if reviewer is the product owner
                        helpful: helpfulCounts[review.id] || 0,
                        reported: reportedCounts[review.id] || 0,
                    };
                });

                // Set states
                setProduct({
                    ...productData,
                    id: parseInt(productId),
                    name: productData.name,
                    producer: productData.producer.name,
                    image: productData.image_url,
                    // Rating calculations handled by useMemo below
                });

                setReviews(processedReviews);
            } catch (err) {
                setError(err.message);
                console.error("Error fetching data:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProductAndReviews();
    }, [productId]);

    // Calculate review statistics using useMemo
    const reviewStats = useMemo(() => {
        if (!reviews?.length) {
            return {
                averageRating: 0,
                totalReviews: 0,
                ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
            };
        }

        const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        let totalRating = 0;

        reviews.forEach((review) => {
            distribution[review.rating] =
                (distribution[review.rating] || 0) + 1;
            totalRating += review.rating;
        });

        return {
            averageRating: totalRating / reviews.length,
            totalReviews: reviews.length,
            ratingDistribution: distribution,
        };
    }, [reviews]);

    // Utility functions
    const handleSort = (key) => {
        let direction = "asc";
        if (sortConfig.key === key && sortConfig.direction === "asc") {
            direction = "desc";
        }
        setSortConfig({ key, direction });
    };

    const sortReviews = (reviews) => {
        if (!sortConfig.key) return reviews;

        return [...reviews].sort((a, b) => {
            let aValue = a[sortConfig.key];
            let bValue = b[sortConfig.key];

            if (sortConfig.key === "date") {
                aValue = new Date(aValue);
                bValue = new Date(bValue);
            } else if (
                sortConfig.key === "reported" ||
                sortConfig.key === "helpful"
            ) {
                aValue = Number(aValue) || 0;
                bValue = Number(bValue) || 0;
            }

            if (aValue < bValue) {
                return sortConfig.direction === "asc" ? -1 : 1;
            }
            if (aValue > bValue) {
                return sortConfig.direction === "asc" ? 1 : -1;
            }
            return 0;
        });
    };

    const filterReviews = (reviews) => {
        let filtered = reviews;

        // Filter by search term
        if (searchTerm) {
            filtered = filtered.filter(
                (review) =>
                    review.customerName
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase()) ||
                    review.title
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase()) ||
                    review.comment
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase())
            );
        }

        // Filter by rating
        if (filterRating !== "all") {
            filtered = filtered.filter(
                (review) => review.rating === parseInt(filterRating)
            );
        }

        return filtered;
    };

    const handleDeleteReview = async (reviewId) => {
        // Optimistically update UI
        setDeletingReviews((prev) => new Set(prev).add(reviewId));
        const reviewToDelete = reviews.find((r) => r.id === reviewId);
        setReviews((prev) => prev.filter((review) => review.id !== reviewId));

        try {
            const { error } = await supabase
                .from("reviews")
                .delete()
                .eq("id", reviewId);

            if (error) throw error;
        } catch (err) {
            // Revert the optimistic update on error
            setReviews((prev) =>
                [...prev, reviewToDelete].sort(
                    (a, b) => new Date(b.created_at) - new Date(a.created_at)
                )
            );
            setError("Failed to delete review. Please try again.");
            console.error("Error deleting review:", err);
        } finally {
            setDeletingReviews((prev) => {
                const next = new Set(prev);
                next.delete(reviewId);
                return next;
            });
        }
    };

    const renderStars = (rating) => {
        return Array.from({ length: 5 }, (_, index) => (
            <Icon
                key={index}
                icon="mingcute:star-fill"
                className={index < rating ? "text-yellow-400" : "text-gray-300"}
                width="16"
                height="16"
            />
        ));
    };

    const filteredAndSortedReviews = sortReviews(filterReviews(reviews));

    if (isLoading) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center bg-slate-50/50">
                <div className="text-center p-6">
                    <Icon
                        icon="mingcute:loading-fill"
                        className="animate-spin text-emerald-600 mx-auto mb-3"
                        width="40"
                        height="40"
                    />
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Loading product reviews…
                    </p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center bg-slate-50/50 p-4">
                <div className="text-center max-w-md w-full bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 sm:p-8">
                    <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4">
                        <Icon
                            icon="mingcute:alert-line"
                            width="26"
                            height="26"
                        />
                    </div>
                    <h2 className="text-base font-bold text-slate-900 mb-1.5">
                        Error Loading Reviews
                    </h2>
                    <p className="text-xs text-slate-500 mb-5 leading-relaxed max-w-prose">
                        {error}
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="inline-flex items-center justify-center px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs active:scale-95 transition-all cursor-pointer"
                    >
                        <Icon icon="mingcute:refresh-line" className="w-4 h-4 mr-1.5" />
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full flex flex-col relative items-center scrollbar-hide bg-slate-50/50 overflow-x-hidden text-slate-800 pb-24 md:pb-16">
            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white/95 backdrop-blur-md border-b border-slate-200/80 z-30 flex items-center justify-between px-4">
                <button
                    onClick={() => navigate(-1)}
                    className="inline-flex items-center justify-center w-9 h-9 rounded-xl text-slate-500 hover:text-emerald-700 hover:bg-slate-100 active:scale-95 transition-all cursor-pointer"
                    aria-label="Back"
                >
                    <Icon
                        icon="mingcute:arrow-left-line"
                        width="20"
                        height="20"
                    />
                </button>
                <h1 className="text-sm font-bold text-slate-900 tracking-tight">
                    Product Reviews
                </h1>
                <div className="w-9" />
            </div>

            <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 pt-16 md:pt-20">
                {/* Desktop Header */}
                <div className="hidden md:flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate(-1)}
                            className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white border border-slate-200/90 text-slate-600 hover:text-emerald-700 hover:border-emerald-300 shadow-2xs active:scale-95 transition-all cursor-pointer"
                            aria-label="Back to Product Management"
                        >
                            <Icon
                                icon="mingcute:arrow-left-line"
                                width="20"
                                height="20"
                            />
                        </button>
                        <div>
                            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                                <span>Catalog</span>
                                <Icon icon="mingcute:right-line" className="w-3.5 h-3.5 text-slate-400" />
                                <span className="text-emerald-700">Reviews Moderation</span>
                            </div>
                            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                                Product Reviews
                            </h1>
                        </div>
                    </div>
                </div>
                {/* Product Info */}
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 sm:p-6 mb-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                        <div className="relative shrink-0">
                            <img
                                src={
                                    product?.image ||
                                    "/assets/blank-profile.jpg"
                                }
                                alt={product?.name}
                                className="w-24 h-24 sm:w-28 sm:h-28 object-cover rounded-2xl border border-slate-200/80 shadow-2xs"
                            />
                            <div className="absolute -bottom-2 -right-2 bg-emerald-600 text-white text-xs font-bold px-2.5 py-0.5 rounded-full shadow-xs flex items-center gap-1 tabular-nums">
                                <Icon icon="mingcute:star-fill" className="w-3 h-3 text-amber-300" />
                                {reviewStats.averageRating.toFixed(1)}
                            </div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight mb-1 truncate">
                                {product?.name}
                            </h2>
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                                <span className="text-xs font-medium text-slate-500">
                                    Producer:{" "}
                                    <span className="font-semibold text-emerald-800">
                                        {product?.producer || "Agrilink Farmer"}
                                    </span>
                                </span>
                                {product?.category?.name && (
                                    <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full font-medium">
                                        {product.category.name}
                                    </span>
                                )}
                                {product?.stock > 0 && (
                                    <span className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-2.5 py-0.5 rounded-full font-semibold tabular-nums">
                                        {product.stock} kg in stock
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-0.5">
                                    {renderStars(
                                        Math.floor(reviewStats.averageRating)
                                    )}
                                </div>
                                <span className="text-xs font-semibold text-slate-500 tabular-nums">
                                    {reviewStats.totalReviews} total reviews
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Rating Distribution */}
                    <div className="mt-5 border-t border-slate-100 pt-5">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                                Rating Breakdown
                            </h3>
                            {filterRating !== "all" && (
                                <button
                                    onClick={() => setFilterRating("all")}
                                    className="text-[11px] font-semibold text-emerald-700 hover:underline cursor-pointer"
                                >
                                    Reset filter
                                </button>
                            )}
                        </div>
                        <div className="grid grid-cols-5 gap-2 sm:gap-3">
                            {[5, 4, 3, 2, 1].map((rating) => (
                                <div
                                    key={rating}
                                    className={`rounded-xl p-2.5 text-center transition-all cursor-pointer border ${
                                        filterRating === rating.toString()
                                            ? "bg-emerald-50 border-emerald-300 ring-2 ring-emerald-500/20"
                                            : "bg-slate-50/70 border-slate-200/70 hover:bg-slate-100/70 active:scale-95"
                                    }`}
                                    onClick={() =>
                                        setFilterRating(
                                            filterRating === rating.toString()
                                                ? "all"
                                                : rating.toString()
                                        )
                                    }
                                >
                                    <div className="flex items-center justify-center gap-1 mb-1">
                                        <span className="text-xs font-bold text-slate-700 tabular-nums">
                                            {rating}
                                        </span>
                                        <Icon
                                            icon="mingcute:star-fill"
                                            className="text-amber-400 w-3.5 h-3.5"
                                        />
                                    </div>
                                    <div className="text-base sm:text-lg font-bold text-slate-900 tabular-nums">
                                        {reviewStats.ratingDistribution[rating]}
                                    </div>
                                    <div className="text-[10px] uppercase font-semibold text-slate-400">
                                        reviews
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Filters and Search */}
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 sm:p-5 mb-6">
                    <div className="flex flex-col sm:flex-row gap-3">
                        {/* Search */}
                        <div className="flex-1 relative">
                            <Icon
                                icon="mingcute:search-line"
                                className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                            />
                            <input
                                type="text"
                                placeholder="Search reviews by customer name or keywords…"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full h-11 pl-10 pr-4 bg-slate-50/50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 transition-all"
                            />
                        </div>

                        {/* Rating Filter */}
                        <select
                            value={filterRating}
                            onChange={(e) => setFilterRating(e.target.value)}
                            className="h-11 px-3.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-700 outline-none focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 cursor-pointer transition-all"
                        >
                            <option value="all">All Ratings</option>
                            <option value="5">5 Stars Only</option>
                            <option value="4">4 Stars Only</option>
                            <option value="3">3 Stars Only</option>
                            <option value="2">2 Stars Only</option>
                            <option value="1">1 Star Only</option>
                        </select>

                        {/* Sort */}
                        <select
                            value={`${sortConfig.key}-${sortConfig.direction}`}
                            onChange={(e) => {
                                const [key, direction] =
                                    e.target.value.split("-");
                                setSortConfig({ key, direction });
                            }}
                            className="h-11 px-3.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-700 outline-none focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 cursor-pointer transition-all"
                        >
                            <option value="date-desc">Newest Reviews</option>
                            <option value="date-asc">Oldest Reviews</option>
                            <option value="rating-desc">Highest Rated</option>
                            <option value="rating-asc">Lowest Rated</option>
                            <option value="helpful-desc">Most Helpful</option>
                            <option value="reported-desc">Most Reported</option>
                        </select>
                    </div>
                </div>

                {/* Reviews List */}
                <div className="space-y-4">
                    {filteredAndSortedReviews.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-8 text-center">
                            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                                <Icon
                                    icon="mingcute:comment-line"
                                    width="24"
                                    height="24"
                                />
                            </div>
                            <h3 className="text-sm font-bold text-slate-800 mb-1">
                                No Reviews Found
                            </h3>
                            <p className="text-xs text-slate-500">
                                No reviews match your current filters.
                            </p>
                        </div>
                    ) : (
                        filteredAndSortedReviews.map((review) => (
                            <div
                                key={review.id}
                                className={`bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 sm:p-6 hover:border-slate-300 transition-all ${
                                    deletingReviews.has(review.id)
                                        ? "opacity-0 scale-95 -translate-y-2"
                                        : "opacity-100 scale-100 translate-y-0"
                                }`}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-2.5 mb-2.5">
                                            <div className="flex items-center gap-2.5">
                                                <img
                                                    src={review.customerAvatar}
                                                    alt={review.customerName}
                                                    className="w-8 h-8 rounded-full object-cover ring-2 ring-slate-100"
                                                />
                                                <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                                                    {review.customerName}
                                                </h3>
                                            </div>
                                            {review.verified && (
                                                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 text-[11px] font-semibold px-2 py-0.5 rounded-full border border-emerald-200/70">
                                                    <Icon
                                                        icon="mingcute:check-fill"
                                                        className="w-3 h-3 text-emerald-600"
                                                    />
                                                    Verified Customer
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="flex items-center gap-0.5 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200/60">
                                                {renderStars(review.rating)}
                                            </div>
                                            <span className="text-xs font-medium text-slate-500 tabular-nums">
                                                {new Date(
                                                    review.date
                                                ).toLocaleDateString("en-US", {
                                                    year: "numeric",
                                                    month: "short",
                                                    day: "numeric",
                                                })}
                                            </span>
                                        </div>
                                        <p className="text-xs sm:text-sm text-slate-600 mb-3.5 leading-relaxed max-w-prose">
                                            {review.comment ?? ""}
                                        </p>
                                        {review.reviewImage && (
                                            <ReviewImage
                                                src={review.reviewImage}
                                                alt="Review"
                                                className="mb-3 max-w-xs rounded-xl border border-slate-200/80 h-36 w-36"
                                            />
                                        )}
                                    </div>
                                </div>

                                {/* Delete action */}
                                <div className="flex items-center justify-between pt-3.5 border-t border-slate-100">
                                    <div className="flex items-center gap-4 text-xs">
                                        <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                                            <Icon
                                                icon="mingcute:thumb-up-line"
                                                className={`w-4 h-4 ${
                                                    review.helpful > 0
                                                        ? "text-emerald-600"
                                                        : "text-slate-400"
                                                }`}
                                            />
                                            <span className="tabular-nums font-semibold">{review.helpful}</span> helpful
                                        </span>
                                        <span
                                            className={`flex items-center gap-1.5 font-medium ${
                                                review.reported > 0
                                                    ? "text-rose-600"
                                                    : "text-slate-400"
                                            }`}
                                        >
                                            <Icon
                                                icon="mingcute:flag-2-line"
                                                className="w-4 h-4"
                                            />
                                            <span className="tabular-nums font-semibold">{review.reported}</span> reported
                                        </span>
                                    </div>
                                    <button
                                        onClick={() =>
                                            handleDeleteReview(review.id)
                                        }
                                        disabled={deletingReviews.has(
                                            review.id
                                        )}
                                        className={`inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all active:scale-95 cursor-pointer ${
                                            deletingReviews.has(review.id)
                                                ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                                                : "bg-rose-50 text-rose-700 border-rose-200/80 hover:bg-rose-100"
                                        }`}
                                    >
                                        <Icon
                                            icon="mingcute:delete-line"
                                            className="mr-1.5 w-3.5 h-3.5"
                                        />
                                        Delete Review
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Removed confirmation modal since status management is not supported */}

            <AdminNavigationBar />
        </div>
    );
}

export default AdminProductReviews;
