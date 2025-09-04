import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import AdminNavigationBar from "../../components/AdminNavigationBar";

function AdminMessages() {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedFilter, setSelectedFilter] = useState("all");
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [showMessageDetails, setShowMessageDetails] = useState(false);

    // Sample messages data (replace with actual data fetching)
    const [messages] = useState([
        {
            id: 1,
            sender: "Juan Dela Cruz",
            senderType: "producer",
            subject: "Product Approval Request",
            message:
                "Hello admin, I would like to request approval for my new organic tomato listing. The product has been reviewed and meets all quality standards.",
            timestamp: "2024-09-04T10:30:00Z",
            status: "unread",
            priority: "high",
            category: "product_approval",
            avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face",
        },
        {
            id: 2,
            sender: "Maria Santos",
            senderType: "consumer",
            subject: "Report Inappropriate Content",
            message:
                "I want to report a product listing that seems to have false information about organic certification. Please review the listing for 'Premium Rice' by Producer123.",
            timestamp: "2024-09-04T09:15:00Z",
            status: "unread",
            priority: "medium",
            category: "report",
            avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face",
        },
        {
            id: 3,
            sender: "Roberto Silva",
            senderType: "producer",
            subject: "Account Verification Issue",
            message:
                "I'm having trouble with my account verification process. I submitted all required documents 3 days ago but haven't received any response. Please help me resolve this issue.",
            timestamp: "2024-09-04T08:45:00Z",
            status: "read",
            priority: "high",
            category: "account",
            avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=40&h=40&fit=crop&crop=face",
        },
        {
            id: 4,
            sender: "Ana Rodriguez",
            senderType: "consumer",
            subject: "Payment Issue",
            message:
                "I made a payment for Order #12345 but the payment is not reflecting in my order status. Can you please check and update the payment status?",
            timestamp: "2024-09-04T07:20:00Z",
            status: "read",
            priority: "medium",
            category: "payment",
            avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face",
        },
        {
            id: 5,
            sender: "Carlos Miguel",
            senderType: "producer",
            subject: "Feature Request",
            message:
                "It would be great if we could have a bulk upload feature for products. Currently, adding products one by one is time-consuming for producers with many items.",
            timestamp: "2024-09-03T16:30:00Z",
            status: "read",
            priority: "low",
            category: "feature_request",
            avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face",
        },
        {
            id: 6,
            sender: "Sofia Reyes",
            senderType: "consumer",
            subject: "Delivery Complaint",
            message:
                "My order was supposed to arrive yesterday but there's been no communication from the delivery team. This is affecting my business operations.",
            timestamp: "2024-09-03T14:15:00Z",
            status: "unread",
            priority: "high",
            category: "delivery",
            avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=40&h=40&fit=crop&crop=face",
        },
    ]);

    // Filter messages based on search term and selected filter
    const filteredMessages = messages.filter((message) => {
        const matchesSearch =
            message.sender.toLowerCase().includes(searchTerm.toLowerCase()) ||
            message.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
            message.message.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesFilter =
            selectedFilter === "all" ||
            message.status === selectedFilter ||
            message.priority === selectedFilter ||
            message.category === selectedFilter ||
            message.senderType === selectedFilter;

        return matchesSearch && matchesFilter;
    });

    const handleMessageClick = (message) => {
        setSelectedMessage(message);
        setShowMessageDetails(true);
    };

    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days === 1) return "Yesterday";
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString();
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case "high":
                return "text-red-600 bg-red-50";
            case "medium":
                return "text-yellow-600 bg-yellow-50";
            case "low":
                return "text-green-600 bg-green-50";
            default:
                return "text-gray-600 bg-gray-50";
        }
    };

    const getCategoryIcon = (category) => {
        switch (category) {
            case "product_approval":
                return "mingcute:box-2-line";
            case "report":
                return "mingcute:alert-line";
            case "account":
                return "mingcute:user-line";
            case "payment":
                return "mingcute:card-line";
            case "feature_request":
                return "mingcute:lightbulb-line";
            case "delivery":
                return "mingcute:truck-line";
            default:
                return "mingcute:mail-line";
        }
    };

    const unreadCount = messages.filter((m) => m.status === "unread").length;

    return (
        <div className="min-h-screen w-full flex flex-col relative items-center scrollbar-hide bg-background overflow-x-hidden text-text pb-20">
            {/* Header */}
            <div className="fixed top-0 left-0 w-full bg-white shadow-md z-50 px-4 py-3">
                <h1 className="text-lg font-semibold text-primary text-center">
                    Messages
                </h1>
            </div>

            <div className="w-full max-w-4xl mx-4 sm:mx-auto my-16">
                {/* Stats Overview */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 mt-4 px-4 sm:px-0">
                    <div className="bg-white rounded-lg shadow-md p-4 text-center">
                        <Icon
                            icon="mingcute:mail-line"
                            width="32"
                            height="32"
                            className="mx-auto mb-2 text-blue-600"
                        />
                        <p className="text-2xl font-bold text-gray-800">
                            {messages.length}
                        </p>
                        <p className="text-sm text-gray-600">Total Messages</p>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-4 text-center">
                        <Icon
                            icon="mingcute:notification-line"
                            width="32"
                            height="32"
                            className="mx-auto mb-2 text-red-600"
                        />
                        <p className="text-2xl font-bold text-gray-800">
                            {unreadCount}
                        </p>
                        <p className="text-sm text-gray-600">Unread</p>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-4 text-center">
                        <Icon
                            icon="mingcute:alert-line"
                            width="32"
                            height="32"
                            className="mx-auto mb-2 text-yellow-600"
                        />
                        <p className="text-2xl font-bold text-gray-800">
                            {
                                messages.filter((m) => m.priority === "high")
                                    .length
                            }
                        </p>
                        <p className="text-sm text-gray-600">High Priority</p>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-4 text-center">
                        <Icon
                            icon="mingcute:group-line"
                            width="32"
                            height="32"
                            className="mx-auto mb-2 text-green-600"
                        />
                        <p className="text-2xl font-bold text-gray-800">
                            {
                                messages.filter(
                                    (m) => m.senderType === "producer"
                                ).length
                            }
                        </p>
                        <p className="text-sm text-gray-600">From Producers</p>
                    </div>
                </div>

                {/* Search and Filter Section */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
                    <div className="p-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">
                            Search & Filter Messages
                        </h2>

                        {/* Search Bar */}
                        <div className="relative mb-4">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Icon
                                    icon="mingcute:search-line"
                                    className="h-5 w-5 text-gray-400"
                                />
                            </div>
                            <input
                                type="text"
                                placeholder="Search messages by sender, subject, or content..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-primary focus:border-primary"
                            />
                        </div>

                        {/* Filter Buttons */}
                        <div className="flex flex-wrap gap-2">
                            {[
                                {
                                    key: "all",
                                    label: "All Messages",
                                    count: messages.length,
                                },
                                {
                                    key: "unread",
                                    label: "Unread",
                                    count: messages.filter(
                                        (m) => m.status === "unread"
                                    ).length,
                                },
                                {
                                    key: "high",
                                    label: "High Priority",
                                    count: messages.filter(
                                        (m) => m.priority === "high"
                                    ).length,
                                },
                                {
                                    key: "producer",
                                    label: "Producers",
                                    count: messages.filter(
                                        (m) => m.senderType === "producer"
                                    ).length,
                                },
                                {
                                    key: "consumer",
                                    label: "Consumers",
                                    count: messages.filter(
                                        (m) => m.senderType === "consumer"
                                    ).length,
                                },
                            ].map((filter) => (
                                <button
                                    key={filter.key}
                                    onClick={() =>
                                        setSelectedFilter(filter.key)
                                    }
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                        selectedFilter === filter.key
                                            ? "bg-primary text-white"
                                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                    }`}
                                >
                                    {filter.label} ({filter.count})
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Messages List */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-800">
                            Messages
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                            Manage user inquiries and support requests
                        </p>
                    </div>
                    {filteredMessages.length === 0 ? (
                        <div className="p-8 text-center">
                            <Icon
                                icon="mingcute:mail-line"
                                className="mx-auto h-12 w-12 text-gray-400 mb-4"
                            />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                No messages found
                            </h3>
                            <p className="text-gray-500">
                                {searchTerm
                                    ? "Try adjusting your search terms"
                                    : "No messages match the selected filter"}
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-200">
                            {filteredMessages.map((message) => (
                                <div
                                    key={message.id}
                                    onClick={() => handleMessageClick(message)}
                                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                                        message.status === "unread"
                                            ? "bg-blue-50/50"
                                            : ""
                                    }`}
                                >
                                    <div className="flex items-start space-x-3">
                                        <img
                                            className="h-10 w-10 rounded-full"
                                            src={message.avatar}
                                            alt={message.sender}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-2">
                                                    <p
                                                        className={`text-sm font-medium ${
                                                            message.status ===
                                                            "unread"
                                                                ? "text-gray-900"
                                                                : "text-gray-600"
                                                        }`}
                                                    >
                                                        {message.sender}
                                                    </p>
                                                    <span
                                                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                                            message.senderType ===
                                                            "producer"
                                                                ? "bg-green-100 text-green-800"
                                                                : "bg-blue-100 text-blue-800"
                                                        }`}
                                                    >
                                                        {message.senderType}
                                                    </span>
                                                    <span
                                                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(
                                                            message.priority
                                                        )}`}
                                                    >
                                                        {message.priority}
                                                    </span>
                                                </div>
                                                <div className="flex items-center space-x-2 text-xs text-gray-500">
                                                    <Icon
                                                        icon={getCategoryIcon(
                                                            message.category
                                                        )}
                                                        className="h-4 w-4"
                                                    />
                                                    <span>
                                                        {formatTimestamp(
                                                            message.timestamp
                                                        )}
                                                    </span>
                                                    {message.status ===
                                                        "unread" && (
                                                        <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                                                    )}
                                                </div>
                                            </div>
                                            <p
                                                className={`text-sm mt-1 ${
                                                    message.status === "unread"
                                                        ? "font-medium text-gray-900"
                                                        : "text-gray-600"
                                                }`}
                                            >
                                                {message.subject}
                                            </p>
                                            <p className="text-sm text-gray-500 mt-1 truncate">
                                                {message.message}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Message Details Modal */}
                {showMessageDetails && selectedMessage && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]">
                        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        Message Details
                                    </h3>
                                    <button
                                        onClick={() =>
                                            setShowMessageDetails(false)
                                        }
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        <Icon
                                            icon="mingcute:close-line"
                                            className="h-6 w-6"
                                        />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center space-x-3">
                                        <img
                                            className="h-12 w-12 rounded-full"
                                            src={selectedMessage.avatar}
                                            alt={selectedMessage.sender}
                                        />
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">
                                                {selectedMessage.sender}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {selectedMessage.senderType}
                                            </p>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-lg font-medium text-gray-900">
                                            {selectedMessage.subject}
                                        </h4>
                                        <p className="text-sm text-gray-500 mt-1">
                                            {formatTimestamp(
                                                selectedMessage.timestamp
                                            )}
                                        </p>
                                    </div>

                                    <div className="prose max-w-none">
                                        <p className="text-gray-700 leading-relaxed">
                                            {selectedMessage.message}
                                        </p>
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                                        <div className="flex space-x-2">
                                            <button className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors">
                                                Reply
                                            </button>
                                            <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors">
                                                Mark as Read
                                            </button>
                                        </div>
                                        <button className="text-red-600 hover:text-red-700 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors">
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <AdminNavigationBar />
        </div>
    );
}

export default AdminMessages;
