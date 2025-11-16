import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import AdminNavigationBar from "../../components/AdminNavigationBar";
import supabase from "../../SupabaseClient";

import useUpdateLastLogin from "../../hooks/useUpdateLastLogin";
import { useContext } from "react";
import { AuthContext } from "../../App";

function AdminDashboard() {
    const { user } = useContext(AuthContext);
    useUpdateLastLogin(user?.id);

    const [stats, setStats] = useState({
        totalUsers: 0,
        pendingApplications: 0,
        totalProducts: 0,
        pendingProducts: 0,
        activeCrops: 0,
        totalReviews: 0,
    });
    const [topProducts, setTopProducts] = useState([]);
    const [selectedTimeRange, setSelectedTimeRange] = useState("all");
    const [isStatsLoading, setIsStatsLoading] = useState(true);
    const [isLoading, setIsLoading] = useState(true); // Now only for products

    // Backend time range filter with Supabase
    const fetchFilteredProducts = async (
        timeRange,
        options = { showLoading: false }
    ) => {
        try {
            if (options.showLoading) {
                setIsLoading(true);
            }
            // Add a small delay for smooth transition
            await new Promise((resolve) => setTimeout(resolve, 300));

            // Get all approved and active products with their orders and reviews
            const { data: productsData, error: productsError } = await supabase
                .from("products")
                .select(
                    `
                    id,
                    name,
                    image_url,
                    user_id,
                    producer:profiles!products_user_id_fkey(name),
                    reviews!reviews_product_id_fkey (
                        rating
                    ),
                    order_items!order_items_product_id_fkey (
                        quantity,
                        order:orders!order_items_order_id_fkey (
                            status_id,
                            created_at
                        )
                    )
                `
                )
                .not("approval_date", "is", null)
                .eq("status_id", 1);

            if (productsError) throw productsError;

            // Calculate time range cutoff
            const now = new Date();
            let cutoff = null;

            if (timeRange !== "all") {
                cutoff = new Date();
                switch (timeRange) {
                    case "today":
                        cutoff.setHours(0, 0, 0, 0);
                        break;
                    case "week":
                        cutoff.setDate(now.getDate() - 7);
                        break;
                    case "month":
                        cutoff.setMonth(now.getMonth() - 1);
                        break;
                    case "year":
                        cutoff.setFullYear(now.getFullYear() - 1);
                        break;
                }
            }

            // Process the data with client-side filtering
            const processedProducts = productsData.map((product) => {
                // Calculate average rating
                const ratings = product.reviews.map((r) => r.rating);
                const avgRating =
                    ratings.length > 0
                        ? ratings.reduce((a, b) => a + b, 0) / ratings.length
                        : 0;

                // Calculate total sales (only from completed orders within time range)
                const totalSales = product.order_items.reduce((sum, item) => {
                    if (item.order?.status_id === 7) {
                        if (
                            timeRange === "all" ||
                            (cutoff &&
                                new Date(item.order.created_at) >= cutoff)
                        ) {
                            return sum + (item.quantity || 0);
                        }
                    }
                    return sum;
                }, 0);

                return {
                    id: product.id,
                    name: product.name,
                    producer: product.producer?.name || "Unknown Producer",
                    rating: avgRating,
                    reviews: ratings.length,
                    sales: totalSales,
                    image: product.image_url || "/assets/blank-profile.jpg",
                };
            });

            // Sort by total sales and then by number of reviews
            const sortedProducts = processedProducts
                .filter((product) => product.sales > 0) // Only show products with sales
                .sort((a, b) => b.sales - a.sales || b.reviews - a.reviews)
                .slice(0, 10); // Limit to top 10 products

            setTopProducts(sortedProducts);
        } catch (error) {
            console.error("Error fetching filtered products:", error);
            setTopProducts([]); // Ensure empty state is shown on error
        } finally {
            if (options.showLoading) {
                setIsLoading(false);
            }
        }
    };

    useEffect(() => {
        const fetchDashboardStats = async (showLoading = false) => {
            try {
                if (showLoading) {
                    setIsStatsLoading(true);
                }

                // Get total users count
                const { count: usersCount } = await supabase
                    .from("profiles")
                    .select("*", { count: "exact", head: true });

                // Get pending seller applications count
                const { count: pendingApplicationsCount } = await supabase
                    .from("seller_applications")
                    .select("*", { count: "exact", head: true })
                    .is("rejection_reason", null);

                // Get total products count
                const { count: productsCount } = await supabase
                    .from("products")
                    .select("*", { count: "exact", head: true });

                // Get pending products count
                const { count: pendingProductsCount } = await supabase
                    .from("products")
                    .select("*", { count: "exact", head: true })
                    .is("approval_date", null);

                // Get active crops count
                const { count: activeCropsCount } = await supabase
                    .from("crops")
                    .select("*", { count: "exact", head: true });

                // Get total reviews count
                const { count: totalReviewsCount } = await supabase
                    .from("reviews")
                    .select("*", { count: "exact", head: true });

                setStats({
                    totalUsers: usersCount || 0,
                    pendingApplications: pendingApplicationsCount || 0,
                    totalProducts: productsCount || 0,
                    pendingProducts: pendingProductsCount || 0,
                    activeCrops: activeCropsCount || 0,
                    totalReviews: totalReviewsCount || 0,
                });
            } catch (error) {
                console.error("Error fetching dashboard stats:", error);
                // Reset stats on error
                setStats({
                    totalUsers: 0,
                    pendingApplications: 0,
                    totalProducts: 0,
                    pendingProducts: 0,
                    activeCrops: 0,
                    totalReviews: 0,
                });
            } finally {
                if (showLoading) {
                    setIsStatsLoading(false);
                }
            }
        };

        // Initial fetch with loading indicators
        fetchDashboardStats(true);
        fetchFilteredProducts(selectedTimeRange, { showLoading: true });

        // Set up Realtime subscriptions for live updates
        const realtimeChannel = supabase.channel("admin-dashboard-realtime");

        // Stats listeners - re-run fetchDashboardStats without loading indicators
        realtimeChannel
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "profiles",
                },
                () => {
                    fetchDashboardStats(false);
                }
            )
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "seller_applications",
                },
                () => {
                    fetchDashboardStats(false);
                }
            )
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "products",
                },
                () => {
                    fetchDashboardStats(false);
                }
            )
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "crops",
                },
                () => {
                    fetchDashboardStats(false);
                }
            )
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "reviews",
                },
                () => {
                    fetchDashboardStats(false);
                }
            );

        // Top products listeners - re-run fetchFilteredProducts without loading indicators
        realtimeChannel
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "products",
                },
                () => {
                    fetchFilteredProducts(selectedTimeRange, {
                        showLoading: false,
                    });
                }
            )
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "orders",
                },
                () => {
                    fetchFilteredProducts(selectedTimeRange, {
                        showLoading: false,
                    });
                }
            )
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "order_items",
                },
                () => {
                    fetchFilteredProducts(selectedTimeRange, {
                        showLoading: false,
                    });
                }
            )
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "reviews",
                },
                () => {
                    fetchFilteredProducts(selectedTimeRange, {
                        showLoading: false,
                    });
                }
            )
            .subscribe();

        // Cleanup: unsubscribe from channel when component unmounts or dependencies change
        return () => {
            realtimeChannel.unsubscribe();
        };
    }, [selectedTimeRange]);

    return (
        <div className="min-h-screen w-full flex flex-col relative items-center scrollbar-hide bg-background overflow-x-hidden text-text pb-20">
            {/* Header */}
            <div className="fixed top-0 left-0 w-full bg-white shadow-md z-50 px-4 py-3">
                <h1 className="text-lg font-semibold text-primary text-center">
                    Admin Dashboard
                </h1>
            </div>

            <div className="w-full max-w-4xl mx-4 sm:mx-auto my-16">
                {/* Quick Stats */}
                <div className="grid grid-cols-3 lg:grid-cols-3 gap-4 mb-6 mt-4 px-4 sm:px-0">
                    <div className="bg-white rounded-lg shadow-md p-4 text-center">
                        <Icon
                            icon="mingcute:group-line"
                            width="32"
                            height="32"
                            className="mx-auto mb-2 text-blue-600"
                        />
                        {isStatsLoading ? (
                            <div className="animate-pulse">
                                <div className="h-8 bg-gray-200 rounded w-24 mx-auto mb-2"></div>
                                <div className="h-4 bg-gray-200 rounded w-20 mx-auto"></div>
                            </div>
                        ) : (
                            <>
                                <p className="text-2xl font-bold text-gray-800">
                                    {stats.totalUsers.toLocaleString()}
                                </p>
                                <p className="text-sm text-gray-600">
                                    Total Users
                                </p>
                                {stats.pendingApplications > 0 && (
                                    <div className="flex items-center justify-center gap-1 mt-1">
                                        <Icon
                                            icon="mingcute:time-line"
                                            className="w-3 h-3 text-orange-500"
                                        />
                                        <p className="text-xs text-orange-600">
                                            {stats.pendingApplications} seller{" "}
                                            {stats.pendingApplications === 1
                                                ? "application"
                                                : "applications"}{" "}
                                            pending
                                        </p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-4 text-center">
                        <Icon
                            icon="mingcute:box-2-line"
                            width="32"
                            height="32"
                            className="mx-auto mb-2 text-green-600"
                        />
                        {isStatsLoading ? (
                            <div className="animate-pulse">
                                <div className="h-8 bg-gray-200 rounded w-24 mx-auto mb-2"></div>
                                <div className="h-4 bg-gray-200 rounded w-20 mx-auto"></div>
                            </div>
                        ) : (
                            <>
                                <p className="text-2xl font-bold text-gray-800">
                                    {stats.totalProducts.toLocaleString()}
                                </p>
                                <p className="text-sm text-gray-600">
                                    Products
                                </p>
                                {stats.pendingProducts > 0 && (
                                    <div className="flex items-center justify-center gap-1 mt-1">
                                        <Icon
                                            icon="mingcute:time-line"
                                            className="w-3 h-3 text-orange-500"
                                        />
                                        <p className="text-xs text-orange-600">
                                            {stats.pendingProducts} pending
                                            approval
                                        </p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-4 text-center">
                        <Icon
                            icon="mingcute:leaf-line"
                            width="32"
                            height="32"
                            className="mx-auto mb-2 text-emerald-600"
                        />
                        {isStatsLoading ? (
                            <div className="animate-pulse">
                                <div className="h-8 bg-gray-200 rounded w-24 mx-auto mb-2"></div>
                                <div className="h-4 bg-gray-200 rounded w-20 mx-auto"></div>
                            </div>
                        ) : (
                            <>
                                <p className="text-2xl font-bold text-gray-800">
                                    {stats.activeCrops.toLocaleString()}
                                </p>
                                <p className="text-sm text-gray-600">
                                    Active Crops
                                </p>
                            </>
                        )}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">
                        Quick Actions
                    </h2>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <Link
                            to="/admin/users"
                            className="flex flex-col items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                            <Icon
                                icon="mingcute:user-add-line"
                                width="24"
                                height="24"
                                className="text-blue-600 mb-2"
                            />
                            <span className="text-sm font-medium text-blue-700">
                                Review Applications
                            </span>
                        </Link>

                        <Link
                            to="/admin/products"
                            className="flex flex-col items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                        >
                            <Icon
                                icon="mingcute:check-circle-line"
                                width="24"
                                height="24"
                                className="text-green-600 mb-2"
                            />
                            <span className="text-sm font-medium text-green-700">
                                Approve Products
                            </span>
                        </Link>

                        <Link
                            to="/admin/crops"
                            className="flex flex-col items-center p-4 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
                        >
                            <Icon
                                icon="mingcute:leaf-line"
                                width="24"
                                height="24"
                                className="text-emerald-600 mb-2"
                            />
                            <span className="text-sm font-medium text-emerald-700">
                                Manage Crops
                            </span>
                        </Link>

                        <Link
                            to="/admin/transactions"
                            className="flex flex-col items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                        >
                            <Icon
                                icon="mingcute:history-anticlockwise-line"
                                width="24"
                                height="24"
                                className="text-purple-600 mb-2"
                            />
                            <span className="text-sm font-medium text-purple-700">
                                View Transactions
                            </span>
                        </Link>
                    </div>
                </div>

                {/* Top Approved Products */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <h2 className="text-lg font-semibold text-gray-800">
                            Top Approved Products
                        </h2>
                        <div className="flex items-center bg-gray-50 rounded-lg p-1 border border-gray-200">
                            {[
                                { value: "all", label: "All Time" },
                                { value: "today", label: "Today" },
                                { value: "week", label: "This Week" },
                                { value: "month", label: "This Month" },
                                { value: "year", label: "This Year" },
                            ].map((range) => (
                                <button
                                    key={range.value}
                                    onClick={() => {
                                        if (!isLoading) {
                                            setSelectedTimeRange(range.value);
                                        }
                                    }}
                                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                                        selectedTimeRange === range.value
                                            ? "bg-white text-primary shadow-sm"
                                            : "text-gray-600 hover:text-primary"
                                    } ${
                                        isLoading
                                            ? "opacity-50 cursor-not-allowed"
                                            : "hover:bg-gray-100"
                                    }`}
                                    disabled={isLoading}
                                >
                                    {range.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-4">
                        {isLoading ? (
                            // Loading skeleton
                            Array.from({ length: 2 }).map((_, index) => (
                                <div
                                    key={index}
                                    className="animate-pulse flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
                                >
                                    <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
                                    <div className="flex-1">
                                        <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
                                        <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                                        <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                                    </div>
                                    <div className="text-right">
                                        <div className="h-4 bg-gray-200 rounded w-16 mb-2"></div>
                                        <div className="h-3 bg-gray-200 rounded w-20"></div>
                                    </div>
                                </div>
                            ))
                        ) : topProducts.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                No products found for the selected time period
                            </div>
                        ) : (
                            topProducts.map((product) => (
                                <div
                                    key={product.id}
                                    className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
                                >
                                    <img
                                        src={product.image}
                                        alt={product.name}
                                        className="w-16 h-16 object-cover rounded-lg"
                                    />
                                    <div className="flex-1">
                                        <h3 className="font-medium text-gray-800">
                                            {product.name}
                                        </h3>
                                        <p className="text-sm text-gray-600">
                                            by {product.producer}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {product.sales} kg sold
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <div className="flex items-center gap-1 mb-1">
                                            <Icon
                                                icon="mingcute:star-fill"
                                                className="text-yellow-400"
                                                width="16"
                                                height="16"
                                            />
                                            <span className="text-sm font-medium">
                                                {product.rating.toFixed(1)}
                                            </span>
                                        </div>
                                        <Link
                                            to={`/admin/product/${product.id}`}
                                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                        >
                                            {product.reviews} review
                                            {product.reviews !== 1 ? "s" : ""} →
                                        </Link>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <AdminNavigationBar />
        </div>
    );
}

export default AdminDashboard;
