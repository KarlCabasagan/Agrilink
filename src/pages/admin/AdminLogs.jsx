import { useState } from "react";
import { Icon } from "@iconify/react";
import AdminNavigationBar from "../../components/AdminNavigationBar";

function AdminLogs() {
    const [activeTab, setActiveTab] = useState("transactions");
    const [filterDate, setFilterDate] = useState("");
    const [filterType, setFilterType] = useState("");

    const transactions = [
        {
            id: 1,
            type: "purchase",
            amount: 2500,
            customer: "Pedro Santos",
            producer: "John Farmer",
            product: "Organic Tomatoes - 5kg",
            status: "completed",
            timestamp: "2024-08-02 14:30:15",
            paymentMethod: "GCash",
        },
        {
            id: 2,
            type: "purchase",
            amount: 1800,
            customer: "Maria Garcia",
            producer: "Ana Cruz",
            product: "Fresh Lettuce - 12 heads",
            status: "completed",
            timestamp: "2024-09-01 13:45:22",
            paymentMethod: "Cash on Delivery",
        },
        {
            id: 3,
            type: "refund",
            amount: 450,
            customer: "Carlos Mendoza",
            producer: "Pedro Santos",
            product: "Sweet Corn - 3kg",
            status: "processed",
            timestamp: "2024-08-22 11:20:08",
            paymentMethod: "Bank Transfer",
        },
        {
            id: 4,
            type: "purchase",
            amount: 3200,
            customer: "Lisa Rodriguez",
            producer: "Maria Cruz",
            product: "Premium Rice - 10kg",
            status: "pending",
            timestamp: "2024-09-02 10:15:35",
            paymentMethod: "PayMaya",
        },
    ];

    const activityLogs = [
        {
            id: 1,
            type: "user_registration",
            user: "John Doe",
            action: "Registered as Consumer",
            details: "Email: john.doe@email.com",
            timestamp: "2024-09-02 15:22:10",
            ip: "192.168.1.100",
        },
        {
            id: 2,
            type: "producer_application",
            user: "Maria Farmer",
            action: "Submitted Producer Application",
            details: "Farm size: 3 hectares, Location: Bulacan",
            timestamp: "2024-09-02 14:55:33",
            ip: "192.168.1.101",
        },
        {
            id: 3,
            type: "product_submission",
            user: "Carlos Producer",
            action: "Submitted new product for approval",
            details: "Product: Fresh Carrots, Price: ₱60/kg",
            timestamp: "2024-09-02 14:30:15",
            ip: "192.168.1.102",
        },
        {
            id: 4,
            type: "admin_action",
            user: "Admin User",
            action: "Approved producer application",
            details: "Approved: John Farmer application",
            timestamp: "2024-09-02 13:45:20",
            ip: "192.168.1.10",
        },
        {
            id: 5,
            type: "product_approval",
            user: "Admin User",
            action: "Approved product listing",
            details: "Product: Organic Tomatoes by John Farmer",
            timestamp: "2024-09-02 13:20:45",
            ip: "192.168.1.10",
        },
        {
            id: 6,
            type: "user_login",
            user: "Pedro Santos",
            action: "User logged in",
            details: "Consumer account login",
            timestamp: "2024-09-02 12:30:22",
            ip: "192.168.1.105",
        },
    ];

    const getActivityIcon = (type) => {
        switch (type) {
            case "user_registration":
                return "mingcute:user-add-line";
            case "producer_application":
                return "mingcute:clipboard-line";
            case "product_submission":
                return "mingcute:box-2-line";
            case "admin_action":
                return "mingcute:shield-line";
            case "product_approval":
                return "mingcute:check-circle-line";
            case "user_login":
                return "mingcute:login-line";
            default:
                return "mingcute:history-anticlockwise-line";
        }
    };

    const getActivityColor = (type) => {
        switch (type) {
            case "user_registration":
                return "text-blue-600";
            case "producer_application":
                return "text-yellow-600";
            case "product_submission":
                return "text-purple-600";
            case "admin_action":
                return "text-red-600";
            case "product_approval":
                return "text-green-600";
            case "user_login":
                return "text-gray-600";
            default:
                return "text-gray-600";
        }
    };

    const getTransactionIcon = (type) => {
        switch (type) {
            case "purchase":
                return "mingcute:shopping-bag-line";
            case "refund":
                return "mingcute:refund-line";
            case "fee":
                return "mingcute:currency-line";
            default:
                return "mingcute:currency-line";
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "completed":
                return "bg-green-100 text-green-800";
            case "pending":
                return "bg-yellow-100 text-yellow-800";
            case "processed":
                return "bg-blue-100 text-blue-800";
            case "failed":
                return "bg-red-100 text-red-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    const filteredTransactions = transactions.filter((transaction) => {
        const dateMatch =
            !filterDate || transaction.timestamp.includes(filterDate);
        const typeMatch = !filterType || transaction.type === filterType;
        return dateMatch && typeMatch;
    });

    const filteredLogs = activityLogs.filter((log) => {
        const dateMatch = !filterDate || log.timestamp.includes(filterDate);
        const typeMatch = !filterType || log.type === filterType;
        return dateMatch && typeMatch;
    });

    return (
        <div className="min-h-screen w-full flex flex-col relative items-center scrollbar-hide bg-background overflow-x-hidden text-text pb-20">
            {/* Header */}
            <div className="fixed top-0 left-0 w-full bg-white shadow-md z-50 px-4 py-3">
                <h1 className="text-lg font-semibold text-primary text-center">
                    Transaction & Activity Logs
                </h1>
            </div>

            <div className="w-full max-w-6xl mx-4 sm:mx-auto my-16">
                {/* Tabs */}
                <div className="bg-white rounded-lg shadow-md mb-6 mt-4">
                    <div className="flex border-b border-gray-200">
                        <button
                            onClick={() => setActiveTab("transactions")}
                            className={`flex-1 py-3 px-4 text-center font-medium transition-colors ${
                                activeTab === "transactions"
                                    ? "text-primary border-b-2 border-primary"
                                    : "text-gray-600 hover:text-gray-800"
                            }`}
                        >
                            Transaction Logs
                        </button>
                        <button
                            onClick={() => setActiveTab("activities")}
                            className={`flex-1 py-3 px-4 text-center font-medium transition-colors ${
                                activeTab === "activities"
                                    ? "text-primary border-b-2 border-primary"
                                    : "text-gray-600 hover:text-gray-800"
                            }`}
                        >
                            Activity Logs
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Filter by Date
                            </label>
                            <input
                                type="date"
                                value={filterDate}
                                onChange={(e) => setFilterDate(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Filter by Type
                            </label>
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            >
                                <option value="">All Types</option>
                                {activeTab === "transactions" ? (
                                    <>
                                        <option value="purchase">
                                            Purchase
                                        </option>
                                        <option value="refund">Refund</option>
                                        <option value="fee">
                                            Platform Fee
                                        </option>
                                    </>
                                ) : (
                                    <>
                                        <option value="user_registration">
                                            User Registration
                                        </option>
                                        <option value="producer_application">
                                            Producer Application
                                        </option>
                                        <option value="product_submission">
                                            Product Submission
                                        </option>
                                        <option value="admin_action">
                                            Admin Action
                                        </option>
                                        <option value="product_approval">
                                            Product Approval
                                        </option>
                                        <option value="user_login">
                                            User Login
                                        </option>
                                    </>
                                )}
                            </select>
                        </div>
                        <div className="flex items-end">
                            <button
                                onClick={() => {
                                    setFilterDate("");
                                    setFilterType("");
                                }}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                            >
                                Clear Filters
                            </button>
                        </div>
                    </div>
                </div>

                {/* Transaction Logs Tab */}
                {activeTab === "transactions" && (
                    <div className="bg-white rounded-lg shadow-md overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Transaction
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Amount
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Parties
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Payment Method
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Date & Time
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredTransactions.map((transaction) => (
                                        <tr
                                            key={transaction.id}
                                            className="hover:bg-gray-50"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <Icon
                                                        icon={getTransactionIcon(
                                                            transaction.type
                                                        )}
                                                        width="20"
                                                        height="20"
                                                        className="text-gray-500 mr-3"
                                                    />
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {
                                                                transaction.product
                                                            }
                                                        </div>
                                                        <div className="text-sm text-gray-500 capitalize">
                                                            {transaction.type}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                                                ₱
                                                {transaction.amount.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                <div>
                                                    <div>
                                                        Customer:{" "}
                                                        {transaction.customer}
                                                    </div>
                                                    <div>
                                                        Producer:{" "}
                                                        {transaction.producer}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {transaction.paymentMethod}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span
                                                    className={`px-2 py-1 text-xs rounded-full ${getStatusColor(
                                                        transaction.status
                                                    )}`}
                                                >
                                                    {transaction.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {new Date(
                                                    transaction.timestamp
                                                ).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Activity Logs Tab */}
                {activeTab === "activities" && (
                    <div className="space-y-3">
                        {filteredLogs.map((log) => (
                            <div
                                key={log.id}
                                className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow"
                            >
                                <div className="flex items-start gap-3">
                                    <div
                                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                            log.type === "user_registration"
                                                ? "bg-blue-100"
                                                : log.type ===
                                                  "producer_application"
                                                ? "bg-yellow-100"
                                                : log.type ===
                                                  "product_submission"
                                                ? "bg-purple-100"
                                                : log.type === "admin_action"
                                                ? "bg-red-100"
                                                : log.type ===
                                                  "product_approval"
                                                ? "bg-green-100"
                                                : "bg-gray-100"
                                        }`}
                                    >
                                        <Icon
                                            icon={getActivityIcon(log.type)}
                                            width="20"
                                            height="20"
                                            className={getActivityColor(
                                                log.type
                                            )}
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h3 className="font-medium text-gray-800">
                                                    {log.action}
                                                </h3>
                                                <p className="text-sm text-gray-600 mt-1">
                                                    User: {log.user}
                                                </p>
                                                <p className="text-sm text-gray-500 mt-1">
                                                    {log.details}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-gray-500">
                                                    {new Date(
                                                        log.timestamp
                                                    ).toLocaleString()}
                                                </p>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    IP: {log.ip}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <AdminNavigationBar />
        </div>
    );
}

export default AdminLogs;
