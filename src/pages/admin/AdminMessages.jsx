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
        <div className="min-h-screen w-full flex flex-col relative items-center scrollbar-hide bg-slate-50/50 overflow-x-hidden text-slate-800 pb-24 md:pb-16">
            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white/95 backdrop-blur-md border-b border-slate-200/80 z-30 flex items-center justify-between px-4">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                        <Icon icon="mingcute:mail-line" className="w-4 h-4" />
                    </div>
                    <h1 className="text-sm font-bold text-slate-900 tracking-tight">
                        Support Messages
                    </h1>
                </div>
                <span className="text-[11px] font-semibold text-slate-500 tabular-nums">
                    {unreadCount} unread
                </span>
            </div>

            <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 pt-16 md:pt-20">
                {/* Desktop Header */}
                <div className="hidden md:flex items-center justify-between mb-6">
                    <div>
                        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                            <span>Admin Portal</span>
                            <Icon icon="mingcute:right-line" className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-emerald-700">Support Desk</span>
                        </div>
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                            Messages & Inquiries
                        </h1>
                        <p className="text-xs text-slate-500 mt-1 max-w-prose">
                            Manage user support inquiries, product review appeals, and platform communications.
                        </p>
                    </div>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
                    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                            <Icon
                                icon="mingcute:mail-line"
                                className="w-5 h-5"
                            />
                        </div>
                        <div>
                            <p className="text-lg sm:text-xl font-bold text-slate-900 tabular-nums">
                                {messages.length}
                            </p>
                            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                                Total Messages
                            </p>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                            <Icon
                                icon="mingcute:notification-line"
                                className="w-5 h-5"
                            />
                        </div>
                        <div>
                            <p className="text-lg sm:text-xl font-bold text-emerald-800 tabular-nums">
                                {unreadCount}
                            </p>
                            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                                Unread Inquiries
                            </p>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center shrink-0">
                            <Icon
                                icon="mingcute:alert-line"
                                className="w-5 h-5"
                            />
                        </div>
                        <div>
                            <p className="text-lg sm:text-xl font-bold text-rose-800 tabular-nums">
                                {
                                    messages.filter((m) => m.priority === "high")
                                        .length
                                }
                            </p>
                            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                                High Priority
                            </p>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center shrink-0">
                            <Icon
                                icon="mingcute:user-star-line"
                                className="w-5 h-5"
                            />
                        </div>
                        <div>
                            <p className="text-lg sm:text-xl font-bold text-sky-800 tabular-nums">
                                {
                                    messages.filter(
                                        (m) => m.senderType === "producer"
                                    ).length
                                }
                            </p>
                            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                                Producers
                            </p>
                        </div>
                    </div>
                </div>

                {/* Search and Filter Section */}
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 sm:p-5 mb-6">
                    {/* Search Bar */}
                    <div className="relative mb-3.5">
                        <Icon
                            icon="mingcute:search-line"
                            className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                        />
                        <input
                            type="text"
                            placeholder="Search messages by sender, subject, or content…"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full h-11 pl-10 pr-4 bg-slate-50/50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 transition-all"
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
                                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 cursor-pointer ${
                                    selectedFilter === filter.key
                                        ? "bg-emerald-600 text-white shadow-xs"
                                        : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
                                }`}
                            >
                                {filter.label} <span className="tabular-nums opacity-90">({filter.count})</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Messages List */}
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden mb-6">
                    <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
                        <div>
                            <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                                User Inquiries ({filteredMessages.length})
                            </h2>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Select any inquiry to inspect details or formulate responses
                            </p>
                        </div>
                    </div>
                    {filteredMessages.length === 0 ? (
                        <div className="p-8 text-center">
                            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                                <Icon
                                    icon="mingcute:mail-line"
                                    className="w-6 h-6"
                                />
                            </div>
                            <h3 className="text-sm font-bold text-slate-800 mb-1">
                                No messages found
                            </h3>
                            <p className="text-xs text-slate-500">
                                {searchTerm
                                    ? "Try adjusting your search terms"
                                    : "No inquiries match the selected filter category"}
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {filteredMessages.map((message) => (
                                <div
                                    key={message.id}
                                    onClick={() => handleMessageClick(message)}
                                    className={`p-4 sm:p-4.5 hover:bg-slate-50/80 cursor-pointer transition-colors active:scale-[0.99] ${
                                        message.status === "unread"
                                            ? "bg-emerald-50/30"
                                            : ""
                                    }`}
                                >
                                    <div className="flex items-start gap-3.5">
                                        <img
                                            className="h-10 w-10 rounded-full object-cover ring-2 ring-slate-100 shrink-0"
                                            src={message.avatar}
                                            alt={message.sender}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2 mb-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <p
                                                        className={`text-xs font-bold ${
                                                            message.status ===
                                                            "unread"
                                                                ? "text-slate-900"
                                                                : "text-slate-700"
                                                        }`}
                                                    >
                                                        {message.sender}
                                                    </p>
                                                    <span
                                                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                                                            message.senderType ===
                                                            "producer"
                                                                ? "bg-emerald-50 text-emerald-800 border border-emerald-200/60"
                                                                : "bg-sky-50 text-sky-800 border border-sky-200/60"
                                                        }`}
                                                    >
                                                        {message.senderType}
                                                    </span>
                                                    <span
                                                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${getPriorityColor(
                                                            message.priority
                                                        )}`}
                                                    >
                                                        {message.priority}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 tabular-nums shrink-0">
                                                    <Icon
                                                        icon={getCategoryIcon(
                                                            message.category
                                                        )}
                                                        className="w-3.5 h-3.5"
                                                    />
                                                    <span>
                                                        {formatTimestamp(
                                                            message.timestamp
                                                        )}
                                                    </span>
                                                    {message.status ===
                                                        "unread" && (
                                                        <div className="w-2 h-2 bg-emerald-600 rounded-full" />
                                                    )}
                                                </div>
                                            </div>
                                            <p
                                                className={`text-xs sm:text-sm mb-0.5 ${
                                                    message.status === "unread"
                                                        ? "font-bold text-slate-900"
                                                        : "font-semibold text-slate-700"
                                                }`}
                                            >
                                                {message.subject}
                                            </p>
                                            <p className="text-xs text-slate-500 truncate max-w-prose">
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
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
                        <div
                            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
                            onClick={() => setShowMessageDetails(false)}
                        />
                        <div className="relative bg-white rounded-2xl shadow-xl border border-slate-200/90 max-w-2xl w-full p-5 sm:p-6 z-10 animate-in fade-in zoom-in-95 duration-150">
                            <div>
                                <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-100">
                                    <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                                        Inquiry Details
                                    </h3>
                                    <button
                                        onClick={() =>
                                            setShowMessageDetails(false)
                                        }
                                        className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 active:scale-95 transition-all inline-flex items-center justify-center cursor-pointer"
                                        aria-label="Close"
                                    >
                                        <Icon
                                            icon="mingcute:close-line"
                                            className="w-4 h-4"
                                        />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <img
                                            className="h-11 w-11 rounded-full object-cover ring-2 ring-slate-100"
                                            src={selectedMessage.avatar}
                                            alt={selectedMessage.sender}
                                        />
                                        <div>
                                            <p className="text-xs font-bold text-slate-900">
                                                {selectedMessage.sender}
                                            </p>
                                            <p className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">
                                                {selectedMessage.senderType}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-100">
                                        <h4 className="text-sm font-bold text-slate-900 mb-1">
                                            {selectedMessage.subject}
                                        </h4>
                                        <p className="text-[11px] text-slate-400 tabular-nums">
                                            Received {formatTimestamp(
                                                selectedMessage.timestamp
                                            )}
                                        </p>
                                    </div>

                                    <div className="prose max-w-none text-xs sm:text-sm text-slate-700 leading-relaxed max-w-prose">
                                        <p>
                                            {selectedMessage.message}
                                        </p>
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                        <div className="flex items-center gap-2">
                                            <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-xs active:scale-95 transition-all cursor-pointer">
                                                Reply
                                            </button>
                                            <button className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-semibold active:scale-95 transition-all cursor-pointer">
                                                Mark as Read
                                            </button>
                                        </div>
                                        <button className="text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 px-3.5 py-2 rounded-xl text-xs font-semibold active:scale-95 transition-all cursor-pointer">
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
