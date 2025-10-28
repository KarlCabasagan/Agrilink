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
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardStats = async () => {
            try {
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

                // Get total reviews count (from future reviews table)
                // This will need to be updated once the reviews table is implemented
                const totalReviews = 0;

                setStats({
                    totalUsers: usersCount || 0,
                    pendingApplications: pendingApplicationsCount || 0,
                    totalProducts: productsCount || 0,
                    pendingProducts: pendingProductsCount || 0,
                    activeCrops: activeCropsCount || 0,
                    totalReviews: totalReviews,
                });
                setIsLoading(false);
            } catch (error) {
                console.error("Error fetching dashboard stats:", error);
                setIsLoading(false);
            }
        };

        fetchDashboardStats();
    }, []);

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
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6 mt-4 px-4 sm:px-0">
                    <div className="bg-white rounded-lg shadow-md p-4 text-center">
                        <Icon
                            icon="mingcute:group-line"
                            width="32"
                            height="32"
                            className="mx-auto mb-2 text-blue-600"
                        />
                        {isLoading ? (
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
                        {isLoading ? (
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
                        {isLoading ? (
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
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">
                        Top Approved Products
                    </h2>
                    <div className="space-y-4">
                        {[
                            {
                                id: 101,
                                name: "Sweet Corn",
                                producer: "Ana Garcia",
                                rating: 4.5,
                                reviews: 23,
                                sales: 45,
                                image: "/assets/adel.jpg",
                            },
                            {
                                id: 102,
                                name: "Fresh Lettuce",
                                producer: "Carlos Mendoza",
                                rating: 4.2,
                                reviews: 15,
                                sales: 32,
                                image: "/assets/adel.jpg",
                            },
                            {
                                id: 103,
                                name: "Organic Tomatoes",
                                producer: "John Farmer",
                                rating: 4.8,
                                reviews: 38,
                                sales: 67,
                                image: "/assets/adel.jpg",
                            },
                        ].map((product) => (
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
                                            {product.rating}
                                        </span>
                                    </div>
                                    <Link
                                        to={`/admin/product/${product.id}`}
                                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                    >
                                        {product.reviews} reviews →
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <AdminNavigationBar />
        </div>
    );
}

export default AdminDashboard;
