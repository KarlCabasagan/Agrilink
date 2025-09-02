import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";
import AdminNavigationBar from "../components/AdminNavigationBar";

function AdminDashboard() {
    const stats = {
        totalUsers: 1245,
        pendingApplications: 5,
        totalProducts: 892,
        pendingProducts: 3,
        totalTransactions: 3421,
        activeCrops: 24,
    };

    const recentActivities = [
        {
            id: 1,
            type: "user_application",
            message: "New producer application from John Farmer",
            timestamp: "5 minutes ago",
            icon: "mingcute:user-add-line",
            color: "text-blue-600",
        },
        {
            id: 2,
            type: "product_approval",
            message: "Product 'Organic Tomatoes' approved",
            timestamp: "15 minutes ago",
            icon: "mingcute:check-circle-line",
            color: "text-green-600",
        },
        {
            id: 3,
            type: "transaction",
            message: "New transaction completed: ₱2,500",
            timestamp: "1 hour ago",
            icon: "mingcute:currency-dollar-line",
            color: "text-yellow-600",
        },
        {
            id: 4,
            type: "crop_update",
            message: "Rice crop data updated",
            timestamp: "2 hours ago",
            icon: "mingcute:leaf-line",
            color: "text-emerald-600",
        },
    ];

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
                        <p className="text-2xl font-bold text-gray-800">
                            {stats.totalUsers}
                        </p>
                        <p className="text-sm text-gray-600">Total Users</p>
                        {stats.pendingApplications > 0 && (
                            <p className="text-xs text-red-600 mt-1">
                                {stats.pendingApplications} pending
                            </p>
                        )}
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-4 text-center">
                        <Icon
                            icon="mingcute:box-2-line"
                            width="32"
                            height="32"
                            className="mx-auto mb-2 text-green-600"
                        />
                        <p className="text-2xl font-bold text-gray-800">
                            {stats.totalProducts}
                        </p>
                        <p className="text-sm text-gray-600">Products</p>
                        {stats.pendingProducts > 0 && (
                            <p className="text-xs text-red-600 mt-1">
                                {stats.pendingProducts} pending
                            </p>
                        )}
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-4 text-center">
                        <Icon
                            icon="mingcute:currency-dollar-line"
                            width="32"
                            height="32"
                            className="mx-auto mb-2 text-yellow-600"
                        />
                        <p className="text-2xl font-bold text-gray-800">
                            {stats.totalTransactions}
                        </p>
                        <p className="text-sm text-gray-600">Transactions</p>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-4 text-center">
                        <Icon
                            icon="mingcute:leaf-line"
                            width="32"
                            height="32"
                            className="mx-auto mb-2 text-emerald-600"
                        />
                        <p className="text-2xl font-bold text-gray-800">
                            {stats.activeCrops}
                        </p>
                        <p className="text-sm text-gray-600">Active Crops</p>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-4 text-center">
                        <Icon
                            icon="mingcute:chart-line-line"
                            width="32"
                            height="32"
                            className="mx-auto mb-2 text-purple-600"
                        />
                        <p className="text-2xl font-bold text-gray-800">
                            ₱{(stats.totalTransactions * 127).toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-600">Total Revenue</p>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-4 text-center">
                        <Icon
                            icon="mingcute:time-line"
                            width="32"
                            height="32"
                            className="mx-auto mb-2 text-indigo-600"
                        />
                        <p className="text-2xl font-bold text-gray-800">
                            {stats.pendingApplications + stats.pendingProducts}
                        </p>
                        <p className="text-sm text-gray-600">Pending Reviews</p>
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
                            to="/admin/logs"
                            className="flex flex-col items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                        >
                            <Icon
                                icon="mingcute:history-anticlockwise-line"
                                width="24"
                                height="24"
                                className="text-purple-600 mb-2"
                            />
                            <span className="text-sm font-medium text-purple-700">
                                View Logs
                            </span>
                        </Link>
                    </div>
                </div>

                {/* Recent Activities */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">
                        Recent Activities
                    </h2>
                    <div className="space-y-3">
                        {recentActivities.map((activity) => (
                            <div
                                key={activity.id}
                                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                            >
                                <Icon
                                    icon={activity.icon}
                                    width="20"
                                    height="20"
                                    className={activity.color}
                                />
                                <div className="flex-1">
                                    <p className="text-sm text-gray-800">
                                        {activity.message}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {activity.timestamp}
                                    </p>
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
