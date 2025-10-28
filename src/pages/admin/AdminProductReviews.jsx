import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import AdminNavigationBar from "../../components/AdminNavigationBar";
import supabase from "../../SupabaseClient";

function AdminProductReviews() {
    const { productId } = useParams();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");
    const [sortConfig, setSortConfig] = useState({
        key: "date",
        direction: "desc",
    });
    const [filterRating, setFilterRating] = useState("all");

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
                        customerAvatar:
                            review.reviewer.avatar_url ||
                            "/assets/blank-profile.jpg",
                        rating: review.rating,
                        comment: review.review,
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

    // Removed review action handlers since status management is not supported

    const handleReviewAction = (reviewId, action) => {
        // Removed status management functionality since it's not in schema
        return;
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
            <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <Icon
                        icon="mingcute:loading-fill"
                        className="animate-spin text-primary mx-auto mb-4"
                        width="48"
                        height="48"
                    />
                    <p className="text-gray-600">Loading reviews...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
                <div className="text-center max-w-md mx-4">
                    <Icon
                        icon="mingcute:error-fill"
                        className="text-red-500 mx-auto mb-4"
                        width="48"
                        height="48"
                    />
                    <h2 className="text-lg font-semibold text-gray-800 mb-2">
                        Error Loading Reviews
                    </h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full flex flex-col relative items-center scrollbar-hide bg-gray-50 overflow-x-hidden text-text pb-20">
            {/* Header */}
            <div className="fixed top-0 left-0 w-full bg-white shadow-sm z-50">
                <div className="max-w-4xl mx-auto px-4">
                    <div className="flex items-center justify-between h-16">
                        <button
                            onClick={() => navigate(-1)}
                            className="inline-flex items-center justify-center w-10 h-10 rounded-lg text-gray-500 hover:text-primary hover:bg-gray-50 transition-colors"
                        >
                            <Icon
                                icon="mingcute:arrow-left-line"
                                width="24"
                                height="24"
                            />
                        </button>
                        <h1 className="text-xl font-bold text-gray-800">
                            Product Reviews
                        </h1>
                        <div className="w-10"></div>
                    </div>
                </div>
            </div>

            <div className="w-full max-w-4xl mx-4 sm:mx-auto my-16">
                {/* Product Info */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-8 mt-4 border border-gray-100">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                        <div className="relative">
                            <img
                                src={
                                    product?.image ||
                                    "/assets/blank-profile.jpg"
                                }
                                alt={product?.name}
                                className="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded-xl shadow-md"
                            />
                            <div className="absolute -bottom-2 -right-2 bg-primary text-white text-sm px-3 py-1 rounded-full shadow-md">
                                {reviewStats.averageRating.toFixed(1)}
                            </div>
                        </div>
                        <div className="flex-1">
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">
                                {product?.name}
                            </h2>
                            <div className="flex flex-wrap gap-2 mb-3">
                                <p className="text-primary font-medium text-lg">
                                    by {product?.producer}
                                </p>
                                {product?.category?.name && (
                                    <span className="text-sm bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
                                        {product.category.name}
                                    </span>
                                )}
                                {product?.stock > 0 && (
                                    <span className="text-sm bg-green-50 text-green-700 px-3 py-1 rounded-full">
                                        {product.stock} kg in stock
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex">
                                    {renderStars(
                                        Math.floor(reviewStats.averageRating)
                                    )}
                                </div>
                                <span className="text-gray-500 font-medium">
                                    {reviewStats.totalReviews} reviews
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Rating Distribution */}
                    <div className="mt-8 border-t border-gray-100 pt-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">
                            Rating Distribution
                        </h3>
                        <div className="grid grid-cols-5 gap-4">
                            {[5, 4, 3, 2, 1].map((rating) => (
                                <div
                                    key={rating}
                                    className={`bg-gray-50 rounded-lg p-3 text-center transition-colors cursor-pointer ${
                                        filterRating === rating.toString()
                                            ? "ring-2 ring-primary bg-primary-50"
                                            : "hover:bg-gray-100"
                                    }`}
                                    onClick={() =>
                                        setFilterRating(
                                            filterRating === rating.toString()
                                                ? "all"
                                                : rating.toString()
                                        )
                                    }
                                >
                                    <div className="flex items-center justify-center gap-1 mb-2">
                                        <span className="font-medium">
                                            {rating}
                                        </span>
                                        <Icon
                                            icon="mingcute:star-fill"
                                            className="text-yellow-400"
                                            width="16"
                                            height="16"
                                        />
                                    </div>
                                    <div className="text-xl font-bold text-primary">
                                        {reviewStats.ratingDistribution[rating]}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        reviews
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Filters and Search */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-100">
                    <div className="flex flex-col sm:flex-row gap-6">
                        {/* Search */}
                        <div className="flex-1 relative">
                            <Icon
                                icon="mingcute:search-line"
                                width="20"
                                height="20"
                                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
                            />
                            <input
                                type="text"
                                placeholder="Search reviews by keyword or customer name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary text-gray-700 bg-gray-50 placeholder-gray-400"
                            />
                        </div>

                        {/* Rating Filter */}
                        <select
                            value={filterRating}
                            onChange={(e) => setFilterRating(e.target.value)}
                            className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary bg-gray-50 text-gray-700 cursor-pointer"
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
                            className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary bg-gray-50 text-gray-700 cursor-pointer"
                        >
                            <option value="date-desc">Newest Reviews</option>
                            <option value="date-asc">Oldest Reviews</option>
                            <option value="rating-desc">Highest Rated</option>
                            <option value="rating-asc">Lowest Rated</option>
                            <option value="helpful-desc">Most Helpful</option>
                        </select>
                    </div>
                </div>

                {/* Reviews List */}
                <div className="space-y-6">
                    {filteredAndSortedReviews.length === 0 ? (
                        <div className="bg-white rounded-lg shadow-md p-8 text-center">
                            <Icon
                                icon="mingcute:comment-line"
                                width="64"
                                height="64"
                                className="mx-auto text-gray-300 mb-4"
                            />
                            <h3 className="text-lg font-semibold text-gray-600 mb-2">
                                No Reviews Found
                            </h3>
                            <p className="text-gray-500">
                                No reviews match your current filters.
                            </p>
                        </div>
                    ) : (
                        filteredAndSortedReviews.map((review) => (
                            <div
                                key={review.id}
                                className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:border-primary transition-colors"
                            >
                                <div className="flex items-start justify-between mb-6">
                                    <div className="flex-1">
                                        <div className="flex flex-wrap items-center gap-3 mb-4">
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={review.customerAvatar}
                                                    alt={review.customerName}
                                                    className="w-8 h-8 rounded-full object-cover"
                                                />
                                                <h3 className="text-lg font-semibold text-gray-800">
                                                    {review.customerName}
                                                </h3>
                                            </div>
                                            {review.verified && (
                                                <span className="bg-blue-50 text-blue-700 text-sm px-3 py-1 rounded-full border border-blue-100 font-medium">
                                                    <Icon
                                                        icon="mingcute:check-fill"
                                                        className="inline-block mr-1"
                                                        width="14"
                                                    />
                                                    Verified
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="flex bg-gray-50 px-3 py-1.5 rounded-lg">
                                                {renderStars(review.rating)}
                                            </div>
                                            <span className="text-sm text-gray-500 font-medium">
                                                {new Date(
                                                    review.date
                                                ).toLocaleDateString("en-US", {
                                                    year: "numeric",
                                                    month: "long",
                                                    day: "numeric",
                                                })}
                                            </span>
                                        </div>
                                        <p className="text-gray-600 mb-4 leading-relaxed">
                                            {review.comment ?? ""}
                                        </p>
                                        <div className="flex items-center gap-6 text-sm">
                                            <span className="flex items-center gap-2 text-gray-600 font-medium">
                                                <Icon
                                                    icon="mingcute:thumb-up-fill"
                                                    width="18"
                                                    className="text-primary"
                                                />
                                                {review.helpful} helpful
                                            </span>
                                            <span
                                                className={`flex items-center gap-2 font-medium ${
                                                    review.reported > 0
                                                        ? "text-red-600"
                                                        : "text-gray-400"
                                                }`}
                                            >
                                                <Icon
                                                    icon="mingcute:flag-2-fill"
                                                    width="18"
                                                />
                                                {review.reported} reported
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Removed action buttons since status management is not supported */}
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
