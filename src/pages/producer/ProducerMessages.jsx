import React, { useState, useEffect, useContext } from "react";
import { Icon } from "@iconify/react";
import { Link, useSearchParams } from "react-router-dom";
import ProducerNavigationBar from "../../components/ProducerNavigationBar";
import supabase from "../../SupabaseClient";
import { AuthContext } from "../../App.jsx";

function ProducerMessages() {
    const { user } = useContext(AuthContext);
    const [searchParams] = useSearchParams();
    const [searchTerm, setSearchTerm] = useState("");
    const [showSearch, setShowSearch] = useState(false);
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [newMessage, setNewMessage] = useState("");
    const [conversationMessages, setConversationMessages] = useState([]);
    const [loadingMessages, setLoadingMessages] = useState(false);

    // Handle conversation parameter from URL
    useEffect(() => {
        const conversationId = searchParams.get("conversation");
        if (conversationId) {
            setSelectedConversation(parseInt(conversationId));
        }
    }, [searchParams]);

    // Fetch conversations when component mounts
    useEffect(() => {
        if (user) {
            fetchConversations();
        }
    }, [user]);

    const fetchConversations = async () => {
        try {
            setLoading(true);

            // Get all conversations where the user is the producer
            const { data: conversationsData, error: conversationsError } =
                await supabase
                    .from("conversations")
                    .select(
                        `
                    *,
                    consumer:profiles!conversations_consumer_id_fkey (
                        id,
                        name,
                        avatar_url
                    ),
                    messages (
                        id,
                        body,
                        created_at,
                        sender_id
                    )
                `
                    )
                    .eq("producer_id", user.id)
                    .order("created_at", { ascending: false });

            if (conversationsError) throw conversationsError;

            // Format conversations with the latest message
            const formattedConversations = conversationsData.map((conv) => {
                const consumer = conv.consumer;

                // Get the latest message
                const latestMessage =
                    conv.messages.length > 0
                        ? conv.messages.sort(
                              (a, b) =>
                                  new Date(b.created_at) -
                                  new Date(a.created_at)
                          )[0]
                        : null;

                return {
                    id: conv.id,
                    customerName: consumer.name || "Unknown Customer",
                    customerAvatar:
                        consumer.avatar_url || "/assets/blank-profile.jpg",
                    lastMessage: latestMessage
                        ? latestMessage.body
                        : "No messages yet",
                    timestamp: latestMessage
                        ? formatTimestamp(latestMessage.created_at)
                        : formatTimestamp(conv.created_at),
                    unread: 0, // We'll implement this later
                    online: false, // We'll implement this later
                };
            });

            setConversations(formattedConversations);
        } catch (error) {
            console.error("Error fetching conversations:", error);
            setError("Failed to load conversations");
        } finally {
            setLoading(false);
        }
    };

    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInMs = now - date;
        const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
        const diffInHours = Math.floor(diffInMinutes / 60);
        const diffInDays = Math.floor(diffInHours / 24);

        if (diffInMinutes < 1) {
            return "Just now";
        } else if (diffInMinutes < 60) {
            return `${diffInMinutes} min ago`;
        } else if (diffInHours < 24) {
            return `${diffInHours} hour${diffInHours === 1 ? "" : "s"} ago`;
        } else {
            return `${diffInDays} day${diffInDays === 1 ? "" : "s"} ago`;
        }
    };

    // Filter conversations based on search term
    const filteredConversations = conversations.filter(
        (conversation) =>
            conversation.customerName
                .toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
            conversation.lastMessage
                .toLowerCase()
                .includes(searchTerm.toLowerCase())
    );

    const fetchMessages = async (conversationId) => {
        try {
            setLoadingMessages(true);

            const { data: messagesData, error: messagesError } = await supabase
                .from("messages")
                .select(
                    `
                    *,
                    sender:profiles!messages_sender_id_fkey (
                        name,
                        avatar_url
                    )
                `
                )
                .eq("conversation_id", conversationId)
                .order("created_at", { ascending: true });

            if (messagesError) throw messagesError;

            const transformedMessages = messagesData.map((message) => ({
                id: message.id,
                text: message.body,
                sender: message.sender_id === user.id ? "me" : "customer",
                timestamp: new Date(message.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                }),
                senderName: message.sender.name,
                senderAvatar: message.sender.avatar_url,
            }));

            setConversationMessages(transformedMessages);
        } catch (error) {
            console.error("Error fetching messages:", error);
            setError("Failed to load messages");
        } finally {
            setLoadingMessages(false);
        }
    };

    // Effect to fetch messages when a conversation is selected
    useEffect(() => {
        if (selectedConversation) {
            fetchMessages(selectedConversation);
        }
    }, [selectedConversation]);

    const handleSendMessage = async () => {
        if (newMessage.trim() && selectedConversation) {
            try {
                const { error } = await supabase.from("messages").insert({
                    conversation_id: selectedConversation,
                    sender_id: user.id,
                    body: newMessage.trim(),
                });

                if (error) throw error;

                // Add the new message to the conversation
                const newMsg = {
                    id: Date.now(), // Temporary ID
                    text: newMessage.trim(),
                    sender: "me",
                    timestamp: new Date().toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                    }),
                };

                setConversationMessages((prev) => [...prev, newMsg]);
                setNewMessage("");

                // Update the conversations list to show the latest message
                fetchConversations();
            } catch (error) {
                console.error("Error sending message:", error);
                setError("Failed to send message");
            }
        }
    };

    if (selectedConversation) {
        const customer = conversations.find(
            (c) => c.id === selectedConversation
        );
        return (
            <div className="min-h-screen w-full flex flex-col relative bg-background text-text">
                {/* Chat Header */}
                <div className="fixed top-0 left-0 w-full bg-white shadow-md z-50 px-4 py-3 flex items-center gap-3">
                    <button
                        onClick={() => setSelectedConversation(null)}
                        className="text-gray-600 hover:text-primary"
                    >
                        <Icon
                            icon="mingcute:left-line"
                            width="24"
                            height="24"
                        />
                    </button>
                    <img
                        src={
                            customer.customerAvatar ||
                            "/assets/blank-profile.jpg"
                        }
                        alt={customer.customerName}
                        className="w-10 h-10 rounded-full object-cover"
                        onError={(e) => {
                            e.target.src = "/assets/blank-profile.jpg";
                        }}
                    />
                    <div className="flex-1">
                        <h2 className="font-semibold text-gray-800">
                            {customer.customerName}
                        </h2>
                        <p className="text-xs text-green-600">
                            {customer.online ? "Online" : "Offline"}
                        </p>
                    </div>
                    <button className="text-gray-600 hover:text-primary">
                        <Icon
                            icon="mingcute:phone-line"
                            width="20"
                            height="20"
                        />
                    </button>
                </div>

                {/* Messages */}
                <div className="flex-1 mt-16 mb-16 px-4 py-4 overflow-y-auto">
                    <div className="space-y-4">
                        {loadingMessages ? (
                            <div className="text-center py-8">
                                <Icon
                                    icon="mingcute:loading-line"
                                    width="24"
                                    height="24"
                                    className="text-gray-400 mx-auto mb-2 animate-spin"
                                />
                                <p className="text-gray-500 text-sm">
                                    Loading messages...
                                </p>
                            </div>
                        ) : conversationMessages.length === 0 ? (
                            <div className="text-center py-8">
                                <Icon
                                    icon="mingcute:message-3-line"
                                    width="48"
                                    height="48"
                                    className="text-gray-300 mx-auto mb-2"
                                />
                                <p className="text-gray-500 text-sm">
                                    No messages yet
                                </p>
                                <p className="text-gray-400 text-xs">
                                    Start the conversation!
                                </p>
                            </div>
                        ) : (
                            conversationMessages.map((message) => (
                                <div
                                    key={message.id}
                                    className={`flex ${
                                        message.sender === "me"
                                            ? "justify-end"
                                            : "justify-start"
                                    }`}
                                >
                                    <div
                                        className={`max-w-xs px-4 py-2 rounded-2xl ${
                                            message.sender === "me"
                                                ? "bg-primary text-white"
                                                : "bg-white shadow-sm"
                                        }`}
                                    >
                                        <p className="text-sm">
                                            {message.text}
                                        </p>
                                        <p
                                            className={`text-xs mt-1 ${
                                                message.sender === "me"
                                                    ? "text-primary-light"
                                                    : "text-gray-500"
                                            }`}
                                        >
                                            {message.timestamp}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Message Input */}
                <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 px-4 py-3">
                    <div className="flex items-center gap-3">
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                placeholder="Type a message..."
                                className="w-full px-4 py-2 border border-gray-300 rounded-full outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyPress={(e) =>
                                    e.key === "Enter" && handleSendMessage()
                                }
                            />
                        </div>
                        <button
                            onClick={handleSendMessage}
                            className="bg-primary text-white p-2 rounded-full hover:bg-primary-dark transition-colors"
                            disabled={!newMessage.trim()}
                        >
                            <Icon
                                icon="mingcute:send-line"
                                width="20"
                                height="20"
                            />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full flex flex-col relative items-center scrollbar-hide bg-background overflow-x-hidden text-text pb-20">
            {/* Header */}
            <div className="fixed top-0 left-0 w-full bg-white shadow-md z-50 px-4 py-3">
                {showSearch ? (
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => {
                                setShowSearch(false);
                                setSearchTerm("");
                            }}
                            className="text-gray-600 hover:text-primary"
                        >
                            <Icon
                                icon="mingcute:left-line"
                                width="24"
                                height="24"
                            />
                        </button>
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                placeholder="Search customer conversations..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary outline-none"
                                autoFocus
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm("")}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    <Icon
                                        icon="mingcute:close-line"
                                        width="16"
                                        height="16"
                                    />
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-between">
                        <div className="w-6"></div> {/* Spacer for centering */}
                        <h1 className="text-lg font-semibold text-primary">
                            Customer Messages
                        </h1>
                        <button
                            onClick={() => setShowSearch(true)}
                            className="text-gray-600 hover:text-primary"
                        >
                            <Icon
                                icon="mingcute:search-line"
                                width="24"
                                height="24"
                            />
                        </button>
                    </div>
                )}
            </div>

            <div className="w-full max-w-2xl mx-4 sm:mx-auto my-16">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <Icon
                            icon="mingcute:loading-line"
                            width="40"
                            height="40"
                            className="text-primary mb-4 animate-spin"
                        />
                        <p className="text-gray-600">
                            Loading conversations...
                        </p>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <Icon
                            icon="mingcute:alert-triangle-line"
                            width="60"
                            height="60"
                            className="text-red-500 mb-4"
                        />
                        <h2 className="text-xl font-bold text-gray-700 mb-2">
                            Error Loading Messages
                        </h2>
                        <p className="text-gray-500 text-center mb-6">
                            {error}
                        </p>
                        <button
                            onClick={fetchConversations}
                            className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-dark transition-colors font-medium"
                        >
                            Try Again
                        </button>
                    </div>
                ) : conversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <Icon
                            icon="mingcute:message-3-line"
                            width="80"
                            height="80"
                            className="text-gray-300 mb-4"
                        />
                        <h2 className="text-xl font-bold text-gray-600 mb-2">
                            No messages yet
                        </h2>
                        <p className="text-gray-500 text-center mb-6">
                            Customers will reach out to you about your products
                            here!
                        </p>
                        <Link
                            to="/"
                            className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-dark transition-colors font-medium"
                        >
                            Manage Products
                        </Link>
                    </div>
                ) : filteredConversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <Icon
                            icon="mingcute:search-line"
                            width="80"
                            height="80"
                            className="text-gray-300 mb-4"
                        />
                        <h2 className="text-xl font-bold text-gray-600 mb-2">
                            No conversations found
                        </h2>
                        <p className="text-gray-500 text-center mb-6">
                            Try adjusting your search terms
                        </p>
                        <button
                            onClick={() => setSearchTerm("")}
                            className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-dark transition-colors font-medium"
                        >
                            Clear Search
                        </button>
                    </div>
                ) : (
                    <div className="space-y-2 mt-4">
                        {searchTerm && (
                            <div className="px-4 py-2 text-sm text-gray-600 bg-gray-50 rounded-lg">
                                Showing {filteredConversations.length} of{" "}
                                {conversations.length} conversations
                            </div>
                        )}
                        {filteredConversations.map((conversation) => (
                            <button
                                key={conversation.id}
                                onClick={() =>
                                    setSelectedConversation(conversation.id)
                                }
                                className="w-full bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow text-left"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <img
                                            src={
                                                conversation.customerAvatar ||
                                                "/assets/blank-profile.jpg"
                                            }
                                            alt={conversation.customerName}
                                            className="w-12 h-12 rounded-full object-cover"
                                            onError={(e) => {
                                                e.target.src =
                                                    "/assets/blank-profile.jpg";
                                            }}
                                        />
                                        {conversation.online && (
                                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <h3 className="font-semibold text-gray-800 truncate">
                                                {conversation.customerName}
                                            </h3>
                                            <span className="text-xs text-gray-500">
                                                {conversation.timestamp}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600 truncate">
                                            {conversation.lastMessage}
                                        </p>
                                    </div>
                                    {conversation.unread > 0 && (
                                        <div className="bg-primary text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                                            {conversation.unread}
                                        </div>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
            <ProducerNavigationBar />
        </div>
    );
}

export default ProducerMessages;
