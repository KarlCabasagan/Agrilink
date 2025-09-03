import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import AdminNavigationBar from "../../components/AdminNavigationBar";

function AdminLogs() {
    // Get initial tab from localStorage or default to "transactions"
    const [activeTab, setActiveTab] = useState(() => {
        return localStorage.getItem("adminLogsActiveTab") || "transactions";
    });

    // Save activeTab to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem("adminLogsActiveTab", activeTab);
    }, [activeTab]);
    const [filterDate, setFilterDate] = useState("");
    const [filterType, setFilterType] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [sortConfig, setSortConfig] = useState({
        key: null,
        direction: "asc",
    });

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
            user: "Pedro Santos",
            details: "New consumer account created",
            timestamp: "2024-09-01 09:15:22",
            ip: "192.168.1.100",
        },
        {
            id: 2,
            type: "producer_application",
            user: "John Farmer",
            details: "Producer application submitted",
            timestamp: "2024-08-30 14:30:45",
            ip: "192.168.1.101",
        },
        {
            id: 3,
            type: "product_listing",
            user: "Ana Cruz",
            details: "Listed 'Fresh Lettuce' for sale",
            timestamp: "2024-08-28 11:20:15",
            ip: "192.168.1.102",
        },
        {
            id: 4,
            type: "admin_action",
            user: "Admin",
            details: "Approved producer application for John Farmer",
            timestamp: "2024-08-30 16:45:10",
            ip: "192.168.1.1",
        },
        {
            id: 5,
            type: "user_login",
            user: "Maria Garcia",
            details: "Consumer account login",
            timestamp: "2024-09-02 12:30:22",
            ip: "192.168.1.105",
        },
    ];

    // Utility functions
    const handleSort = (key) => {
        let direction = "asc";
        if (sortConfig.key === key && sortConfig.direction === "asc") {
            direction = "desc";
        }
        setSortConfig({ key, direction });
    };

    const sortData = (data) => {
        if (!sortConfig.key) return data;

        return [...data].sort((a, b) => {
            if (a[sortConfig.key] < b[sortConfig.key]) {
                return sortConfig.direction === "asc" ? -1 : 1;
            }
            if (a[sortConfig.key] > b[sortConfig.key]) {
                return sortConfig.direction === "asc" ? 1 : -1;
            }
            return 0;
        });
    };

    const filterData = (data) => {
        let filtered = data;

        // Apply search filter
        if (searchTerm) {
            filtered = filtered.filter(
                (item) =>
                    (item.customer &&
                        item.customer
                            .toLowerCase()
                            .includes(searchTerm.toLowerCase())) ||
                    (item.producer &&
                        item.producer
                            .toLowerCase()
                            .includes(searchTerm.toLowerCase())) ||
                    (item.product &&
                        item.product
                            .toLowerCase()
                            .includes(searchTerm.toLowerCase())) ||
                    (item.user &&
                        item.user
                            .toLowerCase()
                            .includes(searchTerm.toLowerCase())) ||
                    (item.details &&
                        item.details
                            .toLowerCase()
                            .includes(searchTerm.toLowerCase())) ||
                    (item.type &&
                        item.type
                            .toLowerCase()
                            .includes(searchTerm.toLowerCase()))
            );
        }

        // Apply date filter
        if (filterDate) {
            filtered = filtered.filter((item) =>
                item.timestamp.startsWith(filterDate)
            );
        }

        // Apply type filter
        if (filterType) {
            filtered = filtered.filter((item) => item.type === filterType);
        }

        return filtered;
    };

    const getActivityIcon = (type) => {
        switch (type) {
            case "user_registration":
                return "mingcute:user-add-line";
            case "producer_application":
                return "mingcute:file-new-line";
            case "product_listing":
                return "mingcute:box-2-line";
            case "admin_action":
                return "mingcute:shield-check-line";
            case "user_login":
                return "mingcute:login-line";
            default:
                return "mingcute:information-line";
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

    return (
        <div className="min-h-screen w-full flex flex-col relative items-center scrollbar-hide bg-background overflow-x-hidden text-text pb-20">
            {/* Header */}
            <div className="fixed top-0 left-0 w-full bg-white shadow-md z-50 px-4 py-3">
                <h1 className="text-lg font-semibold text-primary text-center">
                    Activity Logs
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
                            onClick={() => setActiveTab("activity")}
                            className={`flex-1 py-3 px-4 text-center font-medium transition-colors ${
                                activeTab === "activity"
                                    ? "text-primary border-b-2 border-primary"
                                    : "text-gray-600 hover:text-gray-800"
                            }`}
                        >
                            Activity Logs
                        </button>
                    </div>
                </div>

                {/* Transaction Logs Tab */}
                {activeTab === "transactions" && (
                    <div className="space-y-4">
                        {/* Search and Filters */}
                        <div className="bg-white rounded-lg shadow-md p-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="relative">
                                    <Icon
                                        icon="mingcute:search-line"
                                        width="20"
                                        height="20"
                                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Search transactions..."
                                        value={searchTerm}
                                        onChange={(e) =>
                                            setSearchTerm(e.target.value)
                                        }
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                                    />
                                </div>
                                <input
                                    type="date"
                                    value={filterDate}
                                    onChange={(e) =>
                                        setFilterDate(e.target.value)
                                    }
                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                                />
                                <select
                                    value={filterType}
                                    onChange={(e) =>
                                        setFilterType(e.target.value)
                                    }
                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                                >
                                    <option value="">All Types</option>
                                    <option value="purchase">Purchase</option>
                                    <option value="refund">Refund</option>
                                    <option value="withdrawal">
                                        Withdrawal
                                    </option>
                                </select>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-md overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Transaction
                                            </th>
                                            <th
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                                onClick={() =>
                                                    handleSort("amount")
                                                }
                                            >
                                                Amount{" "}
                                                {sortConfig.key ===
                                                    "amount" && (
                                                    <Icon
                                                        icon={
                                                            sortConfig.direction ===
                                                            "asc"
                                                                ? "mingcute:up-line"
                                                                : "mingcute:down-line"
                                                        }
                                                        className="inline ml-1"
                                                    />
                                                )}
                                            </th>
                                            <th
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                                onClick={() =>
                                                    handleSort("customer")
                                                }
                                            >
                                                Customer{" "}
                                                {sortConfig.key ===
                                                    "customer" && (
                                                    <Icon
                                                        icon={
                                                            sortConfig.direction ===
                                                            "asc"
                                                                ? "mingcute:up-line"
                                                                : "mingcute:down-line"
                                                        }
                                                        className="inline ml-1"
                                                    />
                                                )}
                                            </th>
                                            <th
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                                onClick={() =>
                                                    handleSort("producer")
                                                }
                                            >
                                                Producer{" "}
                                                {sortConfig.key ===
                                                    "producer" && (
                                                    <Icon
                                                        icon={
                                                            sortConfig.direction ===
                                                            "asc"
                                                                ? "mingcute:up-line"
                                                                : "mingcute:down-line"
                                                        }
                                                        className="inline ml-1"
                                                    />
                                                )}
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                                onClick={() =>
                                                    handleSort("timestamp")
                                                }
                                            >
                                                Date{" "}
                                                {sortConfig.key ===
                                                    "timestamp" && (
                                                    <Icon
                                                        icon={
                                                            sortConfig.direction ===
                                                            "asc"
                                                                ? "mingcute:up-line"
                                                                : "mingcute:down-line"
                                                        }
                                                        className="inline ml-1"
                                                    />
                                                )}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {filterData(sortData(transactions)).map(
                                            (transaction) => (
                                                <tr
                                                    key={transaction.id}
                                                    className="hover:bg-gray-50"
                                                >
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {
                                                                    transaction.product
                                                                }
                                                            </div>
                                                            <div className="text-sm text-gray-500">
                                                                {
                                                                    transaction.paymentMethod
                                                                }
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        ₱
                                                        {transaction.amount.toLocaleString()}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {transaction.customer}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {transaction.producer}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span
                                                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                                                                transaction.status
                                                            )}`}
                                                        >
                                                            {transaction.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {new Date(
                                                            transaction.timestamp
                                                        ).toLocaleString()}
                                                    </td>
                                                </tr>
                                            )
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* Activity Logs Tab */}
                {activeTab === "activity" && (
                    <div className="space-y-4">
                        {/* Search and Filters */}
                        <div className="bg-white rounded-lg shadow-md p-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="relative">
                                    <Icon
                                        icon="mingcute:search-line"
                                        width="20"
                                        height="20"
                                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Search activities..."
                                        value={searchTerm}
                                        onChange={(e) =>
                                            setSearchTerm(e.target.value)
                                        }
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                                    />
                                </div>
                                <input
                                    type="date"
                                    value={filterDate}
                                    onChange={(e) =>
                                        setFilterDate(e.target.value)
                                    }
                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                                />
                                <select
                                    value={filterType}
                                    onChange={(e) =>
                                        setFilterType(e.target.value)
                                    }
                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                                >
                                    <option value="">All Types</option>
                                    <option value="user_registration">
                                        User Registration
                                    </option>
                                    <option value="producer_application">
                                        Producer Application
                                    </option>
                                    <option value="product_listing">
                                        Product Listing
                                    </option>
                                    <option value="admin_action">
                                        Admin Action
                                    </option>
                                    <option value="user_login">
                                        User Login
                                    </option>
                                </select>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-md overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Activity
                                            </th>
                                            <th
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                                onClick={() =>
                                                    handleSort("user")
                                                }
                                            >
                                                User{" "}
                                                {sortConfig.key === "user" && (
                                                    <Icon
                                                        icon={
                                                            sortConfig.direction ===
                                                            "asc"
                                                                ? "mingcute:up-line"
                                                                : "mingcute:down-line"
                                                        }
                                                        className="inline ml-1"
                                                    />
                                                )}
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Details
                                            </th>
                                            <th
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                                onClick={() =>
                                                    handleSort("timestamp")
                                                }
                                            >
                                                Date{" "}
                                                {sortConfig.key ===
                                                    "timestamp" && (
                                                    <Icon
                                                        icon={
                                                            sortConfig.direction ===
                                                            "asc"
                                                                ? "mingcute:up-line"
                                                                : "mingcute:down-line"
                                                        }
                                                        className="inline ml-1"
                                                    />
                                                )}
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                IP Address
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {filterData(sortData(activityLogs)).map(
                                            (log) => (
                                                <tr
                                                    key={log.id}
                                                    className="hover:bg-gray-50"
                                                >
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <Icon
                                                                icon={getActivityIcon(
                                                                    log.type
                                                                )}
                                                                width="20"
                                                                height="20"
                                                                className="mr-3 text-gray-400"
                                                            />
                                                            <div className="text-sm font-medium text-gray-900 capitalize">
                                                                {log.type.replace(
                                                                    "_",
                                                                    " "
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {log.user}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {log.details}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {new Date(
                                                            log.timestamp
                                                        ).toLocaleString()}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {log.ip}
                                                    </td>
                                                </tr>
                                            )
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <AdminNavigationBar />
        </div>
    );
}

export default AdminLogs;
