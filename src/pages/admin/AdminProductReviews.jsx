import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import AdminNavigationBar from "../../components/AdminNavigationBar";
import ConfirmModal from "../../components/ConfirmModal";

function AdminProductReviews() {
    const { productId } = useParams();
    const navigate = useNavigate();
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortConfig, setSortConfig] = useState({
        key: "date",
        direction: "desc",
    });
    const [filterRating, setFilterRating] = useState("all");

    // Sample product data
    const [product] = useState({
        id: parseInt(productId),
        name: "Sweet Corn",
        producer: "Ana Garcia",
        image: "/assets/adel.jpg",
        averageRating: 4.5,
        totalReviews: 23,
        ratingDistribution: {
            5: 12,
            4: 7,
            3: 3,
            2: 1,
            1: 0,
        },
    });

    const [reviews, setReviews] = useState([
        {
            id: 1,
            customerName: "Maria Santos",
            customerEmail: "maria@email.com",
            rating: 5,
            title: "Excellent quality corn!",
            comment:
                "The corn was fresh, sweet, and perfectly sized. Delivery was quick and the packaging was excellent. Will definitely order again!",
            date: "2024-09-01",
            verified: true,
            status: "approved",
            helpful: 12,
            reported: 0,
        },
        {
            id: 2,
            customerName: "Pedro Reyes",
            customerEmail: "pedro@email.com",
            rating: 4,
            title: "Good product",
            comment:
                "Good quality corn, though slightly smaller than expected. Still tasty and fresh.",
            date: "2024-08-28",
            verified: true,
            status: "approved",
            helpful: 8,
            reported: 0,
        },
        {
            id: 3,
            customerName: "Anna Cruz",
            customerEmail: "anna@email.com",
            rating: 5,
            title: "Amazing freshness",
            comment:
                "Super fresh and sweet! Perfect for grilling. The producer really knows their craft.",
            date: "2024-08-25",
            verified: false,
            status: "approved",
            helpful: 15,
            reported: 0,
        },
        {
            id: 4,
            customerName: "Carlos Mendoza",
            customerEmail: "carlos@email.com",
            rating: 3,
            title: "Average quality",
            comment:
                "The corn was okay but not as sweet as advertised. Delivery was delayed.",
            date: "2024-08-20",
            verified: true,
            status: "flagged",
            helpful: 3,
            reported: 2,
        },
        {
            id: 5,
            customerName: "Lisa Garcia",
            customerEmail: "lisa@email.com",
            rating: 2,
            title: "Disappointing purchase",
            comment:
                "The corn arrived overripe and some pieces were damaged. Very poor packaging.",
            date: "2024-08-18",
            verified: true,
            status: "pending",
            helpful: 1,
            reported: 1,
        },
    ]);

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

    const handleReviewAction = (reviewId, action) => {
        setConfirmAction({ id: reviewId, type: action });
        setShowConfirmModal(true);
    };

    const confirmReviewAction = () => {
        if (confirmAction) {
            setReviews((prev) =>
                prev.map((review) =>
                    review.id === confirmAction.id
                        ? {
                              ...review,
                              status:
                                  confirmAction.type === "approve"
                                      ? "approved"
                                      : confirmAction.type === "hide"
                                      ? "hidden"
                                      : confirmAction.type === "delete"
                                      ? "deleted"
                                      : review.status,
                          }
                        : review
                )
            );
            setShowConfirmModal(false);
            setConfirmAction(null);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "approved":
                return "bg-green-100 text-green-800";
            case "pending":
                return "bg-yellow-100 text-yellow-800";
            case "flagged":
                return "bg-red-100 text-red-800";
            case "hidden":
                return "bg-gray-100 text-gray-800";
            default:
                return "bg-gray-100 text-gray-800";
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

    return (
        <div className="min-h-screen w-full flex flex-col relative items-center scrollbar-hide bg-background overflow-x-hidden text-text pb-20">
            {/* Header */}
            <div className="fixed top-0 left-0 w-full bg-white shadow-md z-50 px-4 py-3">
                <div className="flex items-center justify-between max-w-4xl mx-auto">
                    <button
                        onClick={() => navigate(-1)}
                        className="text-gray-600 hover:text-gray-800 transition-colors"
                    >
                        <Icon
                            icon="mingcute:arrow-left-line"
                            width="24"
                            height="24"
                        />
                    </button>
                    <h1 className="text-lg font-semibold text-primary text-center">
                        Product Reviews
                    </h1>
                    <div className="w-6"></div>
                </div>
            </div>

            <div className="w-full max-w-4xl mx-4 sm:mx-auto my-16">
                {/* Product Info */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6 mt-4">
                    <div className="flex items-center gap-4 mb-4">
                        <img
                            src={product.image}
                            alt={product.name}
                            className="w-20 h-20 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                            <h2 className="text-xl font-semibold text-gray-800">
                                {product.name}
                            </h2>
                            <p className="text-gray-600">
                                by {product.producer}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                                <div className="flex">
                                    {renderStars(
                                        Math.floor(product.averageRating)
                                    )}
                                </div>
                                <span className="font-medium">
                                    {product.averageRating}
                                </span>
                                <span className="text-gray-500">
                                    ({product.totalReviews} reviews)
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Rating Distribution */}
                    <div className="grid grid-cols-5 gap-2 text-center">
                        {[5, 4, 3, 2, 1].map((rating) => (
                            <div key={rating} className="text-sm">
                                <div className="flex items-center justify-center gap-1">
                                    <span>{rating}</span>
                                    <Icon
                                        icon="mingcute:star-fill"
                                        className="text-yellow-400"
                                        width="12"
                                        height="12"
                                    />
                                </div>
                                <div className="text-lg font-semibold text-gray-800">
                                    {product.ratingDistribution[rating]}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Filters and Search */}
                <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        {/* Search */}
                        <div className="flex-1 relative">
                            <Icon
                                icon="mingcute:search-line"
                                width="20"
                                height="20"
                                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                            />
                            <input
                                type="text"
                                placeholder="Search reviews..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                            />
                        </div>

                        {/* Rating Filter */}
                        <select
                            value={filterRating}
                            onChange={(e) => setFilterRating(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                        >
                            <option value="all">All Ratings</option>
                            <option value="5">5 Stars</option>
                            <option value="4">4 Stars</option>
                            <option value="3">3 Stars</option>
                            <option value="2">2 Stars</option>
                            <option value="1">1 Star</option>
                        </select>

                        {/* Sort */}
                        <select
                            value={`${sortConfig.key}-${sortConfig.direction}`}
                            onChange={(e) => {
                                const [key, direction] =
                                    e.target.value.split("-");
                                setSortConfig({ key, direction });
                            }}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                        >
                            <option value="date-desc">Newest First</option>
                            <option value="date-asc">Oldest First</option>
                            <option value="rating-desc">Highest Rating</option>
                            <option value="rating-asc">Lowest Rating</option>
                            <option value="helpful-desc">Most Helpful</option>
                        </select>
                    </div>
                </div>

                {/* Reviews List */}
                <div className="space-y-4">
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
                                className="bg-white rounded-lg shadow-md p-6"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h3 className="font-medium text-gray-800">
                                                {review.customerName}
                                            </h3>
                                            {review.verified && (
                                                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                                                    Verified Purchase
                                                </span>
                                            )}
                                            <span
                                                className={`text-xs px-2 py-1 rounded ${getStatusColor(
                                                    review.status
                                                )}`}
                                            >
                                                {review.status}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="flex">
                                                {renderStars(review.rating)}
                                            </div>
                                            <span className="text-sm text-gray-500">
                                                {new Date(
                                                    review.date
                                                ).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <h4 className="font-medium text-gray-800 mb-2">
                                            {review.title}
                                        </h4>
                                        <p className="text-gray-600 mb-3">
                                            {review.comment}
                                        </p>
                                        <div className="flex items-center gap-4 text-sm text-gray-500">
                                            <span>
                                                👍 {review.helpful} helpful
                                            </span>
                                            {review.reported > 0 && (
                                                <span className="text-red-600">
                                                    🚩 {review.reported}{" "}
                                                    reported
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-2 pt-4 border-t border-gray-200">
                                    {review.status === "pending" && (
                                        <button
                                            onClick={() =>
                                                handleReviewAction(
                                                    review.id,
                                                    "approve"
                                                )
                                            }
                                            className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                                        >
                                            <Icon
                                                icon="mingcute:check-line"
                                                className="inline mr-1"
                                            />
                                            Approve
                                        </button>
                                    )}
                                    {review.status === "approved" && (
                                        <button
                                            onClick={() =>
                                                handleReviewAction(
                                                    review.id,
                                                    "hide"
                                                )
                                            }
                                            className="px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700"
                                        >
                                            <Icon
                                                icon="mingcute:eye-close-line"
                                                className="inline mr-1"
                                            />
                                            Hide
                                        </button>
                                    )}
                                    {review.status !== "deleted" && (
                                        <button
                                            onClick={() =>
                                                handleReviewAction(
                                                    review.id,
                                                    "delete"
                                                )
                                            }
                                            className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                                        >
                                            <Icon
                                                icon="mingcute:delete-line"
                                                className="inline mr-1"
                                            />
                                            Delete
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Confirmation Modal */}
            {showConfirmModal && (
                <ConfirmModal
                    isOpen={showConfirmModal}
                    onClose={() => setShowConfirmModal(false)}
                    onConfirm={confirmReviewAction}
                    title={`${
                        confirmAction?.type === "approve"
                            ? "Approve"
                            : confirmAction?.type === "hide"
                            ? "Hide"
                            : "Delete"
                    } Review`}
                    message={`Are you sure you want to ${
                        confirmAction?.type === "approve"
                            ? "approve"
                            : confirmAction?.type === "hide"
                            ? "hide"
                            : "delete"
                    } this review?`}
                    confirmText={
                        confirmAction?.type === "approve"
                            ? "Approve"
                            : confirmAction?.type === "hide"
                            ? "Hide"
                            : "Delete"
                    }
                    confirmButtonClass={
                        confirmAction?.type === "approve"
                            ? "bg-green-600 hover:bg-green-700"
                            : confirmAction?.type === "hide"
                            ? "bg-yellow-600 hover:bg-yellow-700"
                            : "bg-red-600 hover:bg-red-700"
                    }
                />
            )}

            <AdminNavigationBar />
        </div>
    );
}

export default AdminProductReviews;
