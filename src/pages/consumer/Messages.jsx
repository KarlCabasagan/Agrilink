import React, { useState, useEffect, useContext, useRef } from "react";
import { Icon } from "@iconify/react";
import { Link, useSearchParams } from "react-router-dom";
import NavigationBar from "../../components/NavigationBar";
import supabase from "../../SupabaseClient";
import { AuthContext } from "../../App.jsx";

function Messages() {
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

    useEffect(() => {
        if (user) {
            fetchConversations();
        }
    }, [user]);

    // Create refs for subscription and auto-scroll
    const messagesSubscriptionRef = useRef(null);
    const messagesEndRef = useRef(null);

    // Auto-scroll to bottom when messages change
    const scrollToBottom = (smooth = true) => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({
                behavior: smooth ? "smooth" : "auto",
                block: "end",
            });
        }
    };

    // Scroll to bottom when messages change, but only if we're already near bottom
    // or if it's a new message from the current user
    useEffect(() => {
        if (conversationMessages.length === 0) return;

        const lastMessage =
            conversationMessages[conversationMessages.length - 1];
        const messageContainer = document.querySelector(".messages-container");

        if (messageContainer) {
            const { scrollHeight, scrollTop, clientHeight } = messageContainer;
            const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
            const isOwnMessage = lastMessage?.sender === "me";
            const isTemp = lastMessage?.temp;

            // Always scroll for own messages (including temp ones) or if near bottom
            if (isOwnMessage || isTemp || isNearBottom) {
                scrollToBottom(!isTemp); // Use instant scroll for temp messages
            }
        }
    }, [conversationMessages]);

    // Set up real-time updates for messages
    useEffect(() => {
        if (!user || !conversations.length) return;

        // Cleanup function to safely unsubscribe
        const cleanup = () => {
            if (messagesSubscriptionRef.current) {
                messagesSubscriptionRef.current.unsubscribe();
                messagesSubscriptionRef.current = null;
            }
        };

        // Create filter condition only if we have conversations
        const conversationIds = conversations
            .filter((c) => c && c.id)
            .map((c) => c.id)
            .join(",");

        if (!conversationIds) {
            cleanup();
            return;
        }

        try {
            // Subscribe to new messages
            messagesSubscriptionRef.current = supabase
                .channel("messages-channel")
                .on(
                    "postgres_changes",
                    {
                        event: "*",
                        schema: "public",
                        table: "messages",
                        filter: `conversation_id=in.(${conversationIds})`,
                    },
                    async (payload) => {
                        const newMessage = payload.new;
                        const event = payload.eventType;

                        // Handle new messages
                        if (event === "INSERT") {
                            // If message belongs to current conversation
                            if (
                                selectedConversation ===
                                newMessage?.conversation_id
                            ) {
                                // Transform the message for our UI format
                                const transformedMessage = {
                                    id: newMessage.id,
                                    text: newMessage.body,
                                    sender:
                                        newMessage.sender_id === user.id
                                            ? "me"
                                            : "farmer",
                                    timestamp: new Date(
                                        newMessage.created_at
                                    ).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    }),
                                    is_read: newMessage.is_read,
                                    sender_id: newMessage.sender_id,
                                    isReceived:
                                        newMessage.sender_id !== user.id,
                                    created_at: newMessage.created_at,
                                };

                                // Update messages with deduplication logic
                                setConversationMessages((prev) => {
                                    // If message with this ID already exists, don't add it
                                    if (
                                        prev.some(
                                            (m) =>
                                                String(m.id) ===
                                                String(transformedMessage.id)
                                        )
                                    ) {
                                        return prev;
                                    }

                                    // Check for temporary message to replace
                                    const tempIdx = prev.findIndex(
                                        (m) =>
                                            m.temp &&
                                            m.sender_id ===
                                                transformedMessage.sender_id &&
                                            m.text ===
                                                transformedMessage.text &&
                                            Math.abs(
                                                new Date(m.created_at) -
                                                    new Date(
                                                        transformedMessage.created_at
                                                    )
                                            ) < 5000
                                    );

                                    if (tempIdx > -1) {
                                        // Replace temp message with real one
                                        const newMessages = [...prev];
                                        newMessages[tempIdx] =
                                            transformedMessage;
                                        return newMessages;
                                    }

                                    // If no temp message found and not a duplicate, append
                                    return [...prev, transformedMessage];
                                });

                                scrollToBottom();

                                // If it's from the other person, mark as read
                                if (newMessage.sender_id !== user.id) {
                                    await supabase
                                        .from("messages")
                                        .update({ is_read: true })
                                        .eq("id", newMessage.id);
                                }
                            }

                            // Update conversations list without full reload
                            setConversations((prev) =>
                                prev.map((conv) =>
                                    conv.id === newMessage.conversation_id
                                        ? {
                                              ...conv,
                                              lastMessage: newMessage.body,
                                              timestamp: formatTimestamp(
                                                  newMessage.created_at
                                              ),
                                              unread:
                                                  newMessage.sender_id !==
                                                      user.id &&
                                                  selectedConversation !==
                                                      conv.id
                                                      ? conv.unread + 1
                                                      : conv.unread,
                                          }
                                        : conv
                                )
                            );
                        }

                        // Handle message updates (e.g., is_read status)
                        if (event === "UPDATE") {
                            if (
                                selectedConversation ===
                                newMessage?.conversation_id
                            ) {
                                setConversationMessages((prev) =>
                                    prev.map((msg) =>
                                        msg.id === newMessage.id
                                            ? {
                                                  ...msg,
                                                  is_read: newMessage.is_read,
                                              }
                                            : msg
                                    )
                                );
                            }
                        }
                    }
                )
                .subscribe();
        } catch (error) {
            console.error("Error setting up real-time subscriptions:", error);
            cleanup();
        }

        // Cleanup function for useEffect
        return cleanup;
    }, [user, conversations, selectedConversation]);

    // Fetch and mark messages as read when conversation is selected
    useEffect(() => {
        if (!selectedConversation || !user?.id) return;

        let mounted = true;

        const markConversationMessagesAsRead = async () => {
            if (!mounted) return;

            try {
                // Optimistically update UI first
                setConversationMessages((prev) =>
                    prev.map((m) => ({
                        ...m,
                        is_read: m.sender_id !== user.id ? true : m.is_read,
                    }))
                );

                setConversations((prev) =>
                    prev.map((conv) =>
                        conv.id === selectedConversation
                            ? { ...conv, unread: 0 }
                            : conv
                    )
                );

                // Then update in database
                const { error } = await supabase
                    .from("messages")
                    .update({ is_read: true })
                    .eq("conversation_id", selectedConversation)
                    .neq("sender_id", user.id)
                    .eq("is_read", false);

                if (error) {
                    console.error("Failed to mark messages as read:", error);
                }
            } catch (err) {
                console.error("Error marking messages as read:", err);
            }
        };

        // First fetch messages, then mark as read
        fetchMessages(selectedConversation);
        markConversationMessagesAsRead();

        return () => {
            mounted = false;
        };
    }, [selectedConversation, user?.id]);

    const fetchConversations = async () => {
        try {
            setLoading(true);

            // Get all conversations where the user is the consumer
            const { data: conversationsData, error: conversationsError } =
                await supabase
                    .from("conversations")
                    .select(
                        `
                    *,
                    producer:profiles!conversations_producer_id_fkey (
                        id,
                        name,
                        avatar_url
                    ),
                    messages (
                        id,
                        body,
                        created_at,
                        sender_id,
                        is_read
                    )
                `
                    )
                    .eq("consumer_id", user.id)
                    .order("created_at", { ascending: false });

            if (conversationsError) throw conversationsError;

            // Format conversations with the latest message
            const formattedConversations = conversationsData
                .filter((conv) => conv && conv.producer) // Filter out invalid conversations
                .map((conv) => {
                    // Get the latest message with null checks
                    const validMessages = Array.isArray(conv.messages)
                        ? conv.messages
                        : [];
                    const latestMessage =
                        validMessages.length > 0
                            ? validMessages.sort((a, b) => {
                                  const dateA = new Date(a.created_at || 0);
                                  const dateB = new Date(b.created_at || 0);
                                  return dateB - dateA;
                              })[0]
                            : null;

                    // Calculate unread count
                    const unreadCount = validMessages.filter(
                        (msg) =>
                            msg && msg.sender_id !== user.id && !msg.is_read
                    ).length;

                    // Get valid timestamp
                    let timestamp;
                    try {
                        timestamp =
                            latestMessage?.created_at || conv.created_at;
                        // Validate the timestamp
                        const testDate = new Date(timestamp);
                        if (isNaN(testDate.getTime())) {
                            timestamp = new Date().toISOString();
                        }
                    } catch (e) {
                        timestamp = new Date().toISOString();
                    }

                    return {
                        id: conv.id,
                        farmerName: conv.producer?.name || "Unknown Farmer",
                        farmerAvatar:
                            conv.producer?.avatar_url ||
                            "/assets/blank-profile.jpg",
                        lastMessage: latestMessage
                            ? latestMessage.body
                            : "No messages yet",
                        timestamp: timestamp,
                        unread: unreadCount,
                        lastMessageTime: new Date(timestamp),
                    };
                });

            // Sort conversations by the latest message time
            const sortedConversations = formattedConversations.sort(
                (a, b) =>
                    new Date(b.lastMessageTime) - new Date(a.lastMessageTime)
            );

            setConversations(sortedConversations);
        } catch (error) {
            console.error("Error fetching conversations:", error);
            setError("Failed to load conversations");
        } finally {
            setLoading(false);
        }
    };

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
                sender: message.sender_id === user.id ? "me" : "farmer",
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
        } finally {
            setLoadingMessages(false);
        }
    };

    const formatTimestamp = (timestamp) => {
        if (!timestamp) return "Just now";

        try {
            const date = new Date(timestamp);
            if (isNaN(date.getTime())) return "Just now";

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
            } else if (diffInDays < 7) {
                return `${diffInDays} day${diffInDays === 1 ? "" : "s"} ago`;
            } else {
                // Format as date if more than a week old
                return date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                });
            }
        } catch (error) {
            console.error("Error formatting timestamp:", error);
            return "Just now";
        }
    };

    // Filter conversations based on search term
    const filteredConversations = conversations.filter(
        (conversation) =>
            conversation.farmerName
                .toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
            conversation.lastMessage
                .toLowerCase()
                .includes(searchTerm.toLowerCase())
    );

    const handleSendMessage = async () => {
        if (newMessage.trim() && selectedConversation) {
            const messageText = newMessage.trim();
            const tempId = `temp-${Date.now()}`;
            const timestamp = new Date();

            // Create temporary message object for optimistic UI
            const tempMsg = {
                id: tempId,
                text: messageText,
                sender: "me",
                timestamp: timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                }),
                is_read: false,
                sender_id: user.id,
                created_at: timestamp.toISOString(),
                temp: true, // Flag to identify temporary messages
            };

            // Clear input immediately for better UX
            setNewMessage("");

            // Optimistically add to UI
            setConversationMessages((prev) => [...prev, tempMsg]);

            // Optimistically update conversations list
            setConversations((prev) =>
                prev.map((conv) =>
                    conv.id === selectedConversation
                        ? {
                              ...conv,
                              lastMessage: messageText,
                              timestamp: timestamp.toISOString(),
                              lastMessageTime: timestamp,
                          }
                        : conv
                )
            );

            try {
                // Send to Supabase
                const { data, error } = await supabase
                    .from("messages")
                    .insert({
                        conversation_id: selectedConversation,
                        sender_id: user.id,
                        body: messageText,
                        is_read: false,
                    })
                    .select()
                    .single();

                if (error) throw error;

                // Replace temporary message with real one when we get the response
                // This prevents duplicates as the subscription will update this message
                setConversationMessages((prev) =>
                    prev.map((msg) =>
                        msg.id === tempId
                            ? {
                                  ...msg,
                                  id: data.id,
                                  temp: false,
                              }
                            : msg
                    )
                );
            } catch (error) {
                console.error("Error sending message:", error);
                // Remove temporary message if send failed
                setConversationMessages((prev) =>
                    prev.filter((msg) => msg.id !== tempId)
                );
                setError("Failed to send message");
            }
        }
    };

    if (selectedConversation) {
        const farmer = conversations.find((c) => c.id === selectedConversation);

        // Show loading state if conversations haven't been loaded yet or farmer not found
        if (loading || !farmer) {
            return (
                <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background">
                    <Icon
                        icon="mingcute:loading-line"
                        width="40"
                        height="40"
                        className="text-primary mb-4 animate-spin"
                    />
                    <p className="text-gray-600">Loading conversation...</p>
                </div>
            );
        }

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
                        src={farmer.farmerAvatar || "/assets/adel.jpg"}
                        alt={farmer.farmerName || "Farmer"}
                        className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="flex-1">
                        <h2 className="font-semibold text-gray-800">
                            {farmer.farmerName || "Loading..."}
                        </h2>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 mt-16 mb-16 px-4 py-4 overflow-y-auto messages-container">
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
                            <>
                                {Array.isArray(conversationMessages) &&
                                    conversationMessages.map((message) =>
                                        message?.id ? (
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
                                                            message.sender ===
                                                            "me"
                                                                ? "text-primary-light"
                                                                : "text-gray-500"
                                                        }`}
                                                    >
                                                        {message.timestamp}
                                                    </p>
                                                </div>
                                            </div>
                                        ) : null
                                    )}
                                <div ref={messagesEndRef} />
                            </>
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
                                placeholder="Search conversations..."
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
                    <div className="flex justify-between items-center">
                        <Link
                            to="/"
                            className="text-gray-600 hover:text-primary"
                        >
                            <Icon
                                icon="mingcute:left-line"
                                width="24"
                                height="24"
                            />
                        </Link>
                        <h1 className="text-lg font-semibold">Messages</h1>
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
                            Start a conversation with farmers about their
                            products!
                        </p>
                        <Link
                            to="/"
                            className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-dark transition-colors font-medium"
                        >
                            Browse Products
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
                    <div className="space-y-2">
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
                                                conversation.farmerAvatar ||
                                                "/assets/blank-profile.jpg"
                                            }
                                            alt={conversation.farmerName}
                                            className="w-12 h-12 rounded-full object-cover"
                                            onError={(e) => {
                                                e.target.src =
                                                    "/assets/blank-profile.jpg";
                                            }}
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <h3 className="font-semibold text-gray-800 truncate">
                                                {conversation.farmerName}
                                            </h3>
                                            <span className="text-xs text-gray-500">
                                                {conversation?.timestamp
                                                    ? formatTimestamp(
                                                          conversation.timestamp
                                                      )
                                                    : "Just now"}
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
            <NavigationBar />
        </div>
    );
}

export default Messages;
