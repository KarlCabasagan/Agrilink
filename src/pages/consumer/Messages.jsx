import React, { useState, useEffect, useContext, useRef } from "react";
import { Icon } from "@iconify/react";
import { Link, useSearchParams } from "react-router-dom";
import NavigationBar from "../../components/NavigationBar";
import supabase from "../../SupabaseClient";
import { AuthContext } from "../../App.jsx";
import { UnreadConversationsContext } from "../../context/UnreadConversationsContext.jsx";
import { getProfileAvatarUrl } from "../../utils/avatarUtils.js";

const ReplacementRequestCard = ({ replacementData }) => {
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);

    return (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 max-w-xs mt-2">
            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
                <Icon
                    icon="mingcute:refresh-2-line"
                    width="18"
                    height="18"
                    className="text-orange-600"
                />
                <h3 className="font-bold text-orange-700">
                    Replacement Request
                </h3>
            </div>

            {/* Item Name */}
            <div className="mb-1">
                <p className="font-bold text-lg text-gray-800">
                    {replacementData.itemName}
                </p>
            </div>

            {/* Reason */}
            <div className="mb-3">
                <p className="text-xs font-bold text-gray-600 mb-1">Reason:</p>
                <p className="text-sm text-gray-700">
                    {replacementData.reason}
                </p>
            </div>

            {/* Order ID */}
            <div className="mb-3">
                <p className="text-xs text-gray-500">
                    Order ID: {replacementData.orderId}
                </p>
            </div>

            {/* Proof Image with Loading State */}
            {replacementData.proofUrl && (
                <div className="mt-3 relative w-full">
                    {!imageLoaded && !imageError && (
                        <div className="w-full h-48 bg-gray-200 animate-pulse rounded-lg flex items-center justify-center border border-orange-100">
                            <Icon
                                icon="mingcute:loading-line"
                                className="animate-spin text-orange-400"
                                width="24"
                                height="24"
                            />
                        </div>
                    )}
                    <img
                        src={replacementData.proofUrl}
                        alt="Replacement proof"
                        className={`w-full rounded-lg border border-orange-200 object-cover max-h-48 ${
                            !imageLoaded ? "hidden" : "block"
                        }`}
                        onLoad={() => setImageLoaded(true)}
                        onError={(e) => {
                            setImageError(true);
                            setImageLoaded(true);
                            e.target.src = "/assets/resolved-stamp.png";
                        }}
                    />
                </div>
            )}
        </div>
    );
};

// Helper function to render structured message content
const renderMessageContent = (text, isMe) => {
    // Check if this is a replacement request message
    if (text && text.startsWith(":::REPLACEMENT_REQUEST_V1:::")) {
        try {
            // Extract and parse the JSON
            const jsonString = text.slice(
                ":::REPLACEMENT_REQUEST_V1:::".length
            );
            const replacementData = JSON.parse(jsonString);

            // Return the new component instead of inline JSX
            return <ReplacementRequestCard replacementData={replacementData} />;
        } catch (error) {
            console.error("Failed to parse replacement request data:", error);
            // Fallback
            return (
                <p
                    className={`text-sm ${
                        isMe ? "text-white" : "text-gray-700"
                    }`}
                >
                    {text}
                </p>
            );
        }
    }

    // Standard message - return plain text
    return (
        <p className={`text-sm ${isMe ? "text-white" : "text-gray-700"}`}>
            {text}
        </p>
    );
};

function Messages() {
    // Helper: sort conversations by ISO timestamp `lastMessageAt` (newest first)
    const sortByLastMessageAt = (convs) =>
        [...convs].sort(
            (a, b) =>
                new Date(b.lastMessageAt || b.timestamp || 0) -
                new Date(a.lastMessageAt || a.timestamp || 0)
        );

    const { user } = useContext(AuthContext);
    const { setUnreadConversationCount } = useContext(
        UnreadConversationsContext
    );
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

    // Pure helper: compute unread conversation count (conversations with unread > 0)
    // Returns the count without mutating state
    const computeUnreadConversationCount = (convs) => {
        return convs.filter(
            (conv) => conv.unread !== undefined && conv.unread > 0
        ).length;
    };

    // Effect: update global context when local conversations change
    // This runs after render to avoid render-phase state mutations
    useEffect(() => {
        const unreadCount = computeUnreadConversationCount(conversations);
        setUnreadConversationCount(unreadCount);
    }, [conversations, setUnreadConversationCount]);

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
    const containerRef = useRef(null);
    const desktopContainerRef = useRef(null);

    // Auto-scroll to bottom of the visible scrollable container (smooth by default)
    // Detects which ref is actually rendered: desktop (md+) or mobile (< md)
    const scrollToBottom = (smooth = true) => {
        // Determine which container is visible based on display state
        let el = null;

        // Check if desktop container is visible (md+ screens, not hidden)
        if (
            desktopContainerRef.current &&
            desktopContainerRef.current.offsetParent !== null
        ) {
            el = desktopContainerRef.current;
        }
        // Otherwise use mobile container (visible on < md screens)
        else if (containerRef.current) {
            el = containerRef.current;
        }

        if (!el) return;

        try {
            if (typeof el.scrollTo === "function") {
                el.scrollTo({
                    top: el.scrollHeight,
                    behavior: smooth ? "smooth" : "auto",
                });
            } else {
                // Fallback for older browsers
                el.scrollTop = el.scrollHeight;
            }
        } catch (e) {
            // Last resort: set scrollTop
            el.scrollTop = el.scrollHeight;
        }
    };

    // Scroll to bottom when messages change
    useEffect(() => {
        if (conversationMessages.length > 0) {
            scrollToBottom(true);
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

                                // Scroll will be handled by conversationMessages effect

                                // If it's from the other person, mark as read
                                if (newMessage.sender_id !== user.id) {
                                    await supabase
                                        .from("messages")
                                        .update({ is_read: true })
                                        .eq("id", newMessage.id);
                                }
                            }

                            // Update conversations list without full reload and re-sort
                            setConversations((prev) => {
                                return sortByLastMessageAt(
                                    prev.map((conv) =>
                                        conv.id === newMessage.conversation_id
                                            ? {
                                                  ...conv,
                                                  lastMessage: newMessage.body,
                                                  timestamp:
                                                      newMessage.created_at,
                                                  lastMessageAt:
                                                      newMessage.created_at,
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
                            });
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

                    // Use ISO timestamps for sorting; fallback to conversation created_at
                    const isoTimestamp =
                        (latestMessage && latestMessage.created_at) ||
                        conv.created_at ||
                        new Date().toISOString();

                    return {
                        id: conv.id,
                        farmerName: conv.producer?.name || "Unknown Farmer",
                        farmerAvatar: getProfileAvatarUrl(conv.producer || {}),
                        lastMessage: latestMessage
                            ? latestMessage.body
                            : "No messages yet",
                        // Store ISO for display formatting and sorting
                        timestamp: isoTimestamp,
                        lastMessageAt: isoTimestamp,
                        unread: unreadCount,
                    };
                });
            // Sort conversations by lastMessageAt (ISO) before setting state
            setConversations(sortByLastMessageAt(formattedConversations));
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
                created_at: message.created_at,
                senderName: message.sender.name,
                senderAvatar: getProfileAvatarUrl(message.sender),
            }));

            setConversationMessages(transformedMessages);

            // Scroll to bottom with smooth animation after render
            requestAnimationFrame(() => {
                scrollToBottom(true);
            });
        } catch (error) {
            console.error("Error fetching messages:", error);
        } finally {
            setLoadingMessages(false);
        }
    };

    // Helper: Get relative date label for message grouping
    const getDateGroupLabel = (isoDateString) => {
        if (!isoDateString) return "";

        try {
            const msgDate = new Date(isoDateString);
            if (isNaN(msgDate.getTime())) return "";

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const msgDateOnly = new Date(msgDate);
            msgDateOnly.setHours(0, 0, 0, 0);

            const diffInMs = today - msgDateOnly;
            const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

            if (diffInDays === 0) {
                return "Today";
            } else if (diffInDays === 1) {
                return "Yesterday";
            } else if (diffInDays < 7) {
                return `${diffInDays} days ago`;
            } else if (diffInDays < 30) {
                const weeks = Math.floor(diffInDays / 7);
                return `${weeks} week${weeks > 1 ? "s" : ""} ago`;
            } else {
                const months = Math.floor(diffInDays / 30);
                return `${months} month${months > 1 ? "s" : ""} ago`;
            }
        } catch (error) {
            console.error("Error getting date group label:", error);
            return "";
        }
    };

    // Helper: Group messages by calendar date and sort ascending
    const groupMessagesByDate = (messages) => {
        const grouped = {};

        messages.forEach((message) => {
            if (!message.created_at) return;
            const dateKey = new Date(message.created_at).toDateString();
            if (!grouped[dateKey]) {
                grouped[dateKey] = {
                    label: getDateGroupLabel(message.created_at),
                    messages: [],
                };
            }
            grouped[dateKey].messages.push(message);
        });

        // Sort keys ascending (oldest first)
        const sortedKeys = Object.keys(grouped).sort(
            (a, b) => new Date(a) - new Date(b)
        );

        // Return object with sorted entries
        const sortedGrouped = {};
        sortedKeys.forEach((key) => {
            sortedGrouped[key] = grouped[key];
        });

        return sortedGrouped;
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

            // Optimistically update conversations list and re-sort
            setConversations((prev) =>
                sortByLastMessageAt(
                    prev.map((conv) =>
                        conv.id === selectedConversation
                            ? {
                                  ...conv,
                                  lastMessage: messageText,
                                  timestamp: timestamp.toISOString(),
                                  lastMessageAt: timestamp.toISOString(),
                              }
                            : conv
                    )
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

    // Helper: render conversation card (used in both mobile and desktop)
    const renderConversationCard = (conversation) => (
        <button
            key={conversation.id}
            onClick={() => setSelectedConversation(conversation.id)}
            className={`w-full bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow text-left ${
                selectedConversation === conversation.id
                    ? "ring-2 ring-primary"
                    : ""
            }`}
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
                            e.target.src = "/assets/blank-profile.jpg";
                        }}
                    />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-gray-800 truncate">
                            {conversation.farmerName}
                        </h3>
                    </div>
                    <p className="text-sm text-gray-600 truncate">
                        {conversation.lastMessage}
                    </p>
                </div>
                <span className="text-xs text-gray-500">
                    {conversation?.timestamp
                        ? formatTimestamp(conversation.timestamp)
                        : "Just now"}
                </span>
                {conversation.unread > 0 && (
                    <div className="bg-primary text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                        {conversation.unread}
                    </div>
                )}
            </div>
        </button>
    );

    // Helper: render chat panel (used in both mobile and desktop)
    const renderChatPanel = (farmer) => (
        <div className="flex flex-col h-full bg-background text-text">
            {/* Chat Header */}
            <div className="flex-shrink-0 bg-white shadow-md px-4 py-3 flex items-center gap-3 md:rounded-t-lg">
                <button
                    onClick={() => setSelectedConversation(null)}
                    className="md:hidden text-gray-600 hover:text-primary"
                >
                    <Icon icon="mingcute:left-line" width="24" height="24" />
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

            {/* Messages Container */}
            <div
                ref={containerRef}
                className="flex-1 px-4 py-4 overflow-y-auto pb-16"
            >
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
                            {conversationMessages.map((message) => (
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
                                        {/* 3. Pass the boolean check as the second argument */}
                                        {renderMessageContent(
                                            message.text,
                                            message.sender === "me"
                                        )}

                                        <p
                                            className={`text-xs mt-1 ${
                                                message.sender === "me"
                                                    ? "text-primary-light" // Ensure you have this color or use "text-white/70"
                                                    : "text-gray-500"
                                            }`}
                                        >
                                            {message.timestamp}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </>
                    )}
                </div>
            </div>

            {/* Message Input */}
            <div className="flex-shrink-0 bg-white border-t border-gray-200 px-4 py-3 md:rounded-b-lg">
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

    const farmer = conversations.find((c) => c.id === selectedConversation);

    // Show loading state if conversations haven't been loaded yet or farmer not found
    if (selectedConversation && (loading || !farmer)) {
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
            {/* ===== MOBILE LAYOUT (md:hidden) ===== */}
            {selectedConversation && farmer ? (
                <div className="md:hidden h-screen w-full flex flex-col relative overflow-hidden">
                    {/* Fixed header for mobile chat */}
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
                    <div className="flex-1 mt-16 flex flex-col overflow-hidden">
                        <div
                            ref={containerRef}
                            className="flex-1 px-4 py-4 overflow-y-auto pb-20"
                        >
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
                                        {Object.entries(
                                            groupMessagesByDate(
                                                conversationMessages
                                            )
                                        ).map(([dateKey, group]) => (
                                            <div key={dateKey}>
                                                {/* Date Separator */}
                                                <div className="flex items-center gap-3 my-4">
                                                    <div className="flex-1 h-px bg-gray-200"></div>
                                                    <span className="text-xs text-gray-400 px-2">
                                                        {group.label}
                                                    </span>
                                                    <div className="flex-1 h-px bg-gray-200"></div>
                                                </div>

                                                {/* Messages for this date */}
                                                {group.messages.map(
                                                    (message) => (
                                                        <div
                                                            key={message.id}
                                                            className={`flex mb-3 ${
                                                                message.sender ===
                                                                "me"
                                                                    ? "justify-end"
                                                                    : "justify-start"
                                                            }`}
                                                        >
                                                            <div
                                                                className={`max-w-xs px-4 py-2 rounded-2xl ${
                                                                    message.sender ===
                                                                    "me"
                                                                        ? "bg-primary text-white"
                                                                        : "bg-white shadow-sm"
                                                                }`}
                                                            >
                                                                {renderMessageContent(
                                                                    message.text,
                                                                    message.sender ===
                                                                        "me"
                                                                )}
                                                                <p
                                                                    className={`text-xs mt-1 ${
                                                                        message.sender ===
                                                                        "me"
                                                                            ? "text-primary-light"
                                                                            : "text-gray-500"
                                                                    }`}
                                                                >
                                                                    {
                                                                        message.timestamp
                                                                    }
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        ))}
                                    </>
                                )}
                            </div>
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
                                    onChange={(e) =>
                                        setNewMessage(e.target.value)
                                    }
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
            ) : (
                <div className="md:hidden min-h-screen w-full flex flex-col relative items-center scrollbar-hide bg-background overflow-x-hidden text-text pb-20">
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
                                        onChange={(e) =>
                                            setSearchTerm(e.target.value)
                                        }
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
                                <h1 className="text-lg font-semibold">
                                    Messages
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
                                    Start a conversation with farmers about
                                    their products!
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
                                        Showing {filteredConversations.length}{" "}
                                        of {conversations.length} conversations
                                    </div>
                                )}
                                {filteredConversations.map(
                                    renderConversationCard
                                )}
                            </div>
                        )}
                    </div>
                    <NavigationBar />
                </div>
            )}

            {/* ===== DESKTOP LAYOUT (hidden md:flex) ===== */}
            <div className="hidden md:flex h-[calc(100vh-80px)] w-full flex-col gap-0">
                <div className="flex-1 flex gap-0 overflow-hidden">
                    {/* Left Column: Conversations List */}
                    <div className="w-1/3 border-r border-gray-200 flex flex-col bg-white overflow-hidden">
                        {/* Header */}
                        <div className="flex-shrink-0 bg-white px-4 py-3 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h1 className="text-lg font-semibold">
                                    Messages
                                </h1>
                                <button
                                    onClick={() => setShowSearch(!showSearch)}
                                    className="text-gray-600 hover:text-primary"
                                >
                                    <Icon
                                        icon="mingcute:search-line"
                                        width="24"
                                        height="24"
                                    />
                                </button>
                            </div>
                            {showSearch && (
                                <div className="mt-3 relative">
                                    <input
                                        type="text"
                                        placeholder="Search conversations..."
                                        value={searchTerm}
                                        onChange={(e) =>
                                            setSearchTerm(e.target.value)
                                        }
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
                            )}
                        </div>

                        {/* Conversations List */}
                        <div className="flex-1 overflow-y-auto">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center h-full py-16">
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
                                <div className="flex flex-col items-center justify-center h-full py-16 px-4">
                                    <Icon
                                        icon="mingcute:alert-triangle-line"
                                        width="60"
                                        height="60"
                                        className="text-red-500 mb-4"
                                    />
                                    <p className="text-gray-500 text-center text-sm">
                                        {error}
                                    </p>
                                </div>
                            ) : conversations.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full py-16 px-4">
                                    <Icon
                                        icon="mingcute:message-3-line"
                                        width="60"
                                        height="60"
                                        className="text-gray-300 mb-4"
                                    />
                                    <p className="text-gray-500 text-center text-sm">
                                        No conversations yet
                                    </p>
                                </div>
                            ) : filteredConversations.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full py-16 px-4">
                                    <Icon
                                        icon="mingcute:search-line"
                                        width="60"
                                        height="60"
                                        className="text-gray-300 mb-4"
                                    />
                                    <p className="text-gray-500 text-center text-sm">
                                        No conversations found
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-1 p-2">
                                    {filteredConversations.map(
                                        (conversation) => (
                                            <button
                                                key={conversation.id}
                                                onClick={() =>
                                                    setSelectedConversation(
                                                        conversation.id
                                                    )
                                                }
                                                className={`w-full text-left px-3 py-3 rounded-lg transition-colors ${
                                                    selectedConversation ===
                                                    conversation.id
                                                        ? "bg-primary bg-opacity-10 border-l-4 border-primary"
                                                        : "hover:bg-gray-100"
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <img
                                                        src={
                                                            conversation.farmerAvatar ||
                                                            "/assets/blank-profile.jpg"
                                                        }
                                                        alt={
                                                            conversation.farmerName
                                                        }
                                                        className="w-10 h-10 rounded-full object-cover"
                                                        onError={(e) => {
                                                            e.target.src =
                                                                "/assets/blank-profile.jpg";
                                                        }}
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-semibold text-gray-800 text-sm truncate">
                                                            {
                                                                conversation.farmerName
                                                            }
                                                        </p>
                                                        <p className="text-xs text-gray-600 truncate">
                                                            {
                                                                conversation.lastMessage
                                                            }
                                                        </p>
                                                    </div>
                                                    <div className="flex flex-col items-end gap-1">
                                                        <span className="text-xs text-gray-500">
                                                            {conversation?.timestamp
                                                                ? formatTimestamp(
                                                                      conversation.timestamp
                                                                  )
                                                                : "Just now"}
                                                        </span>
                                                        {conversation.unread >
                                                            0 && (
                                                            <div className="bg-primary text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                                                                {
                                                                    conversation.unread
                                                                }
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </button>
                                        )
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Chat Panel */}
                    {selectedConversation && farmer ? (
                        <div className="flex-1 flex flex-col overflow-hidden bg-background">
                            {/* Chat Header */}
                            <div className="flex-shrink-0 bg-white shadow-sm px-4 py-3 flex items-center gap-3 border-b border-gray-200">
                                <img
                                    src={
                                        farmer.farmerAvatar ||
                                        "/assets/adel.jpg"
                                    }
                                    alt={farmer.farmerName || "Farmer"}
                                    className="w-10 h-10 rounded-full object-cover"
                                />
                                <div className="flex-1">
                                    <h2 className="font-semibold text-gray-800">
                                        {farmer.farmerName || "Loading..."}
                                    </h2>
                                </div>
                            </div>

                            {/* Messages Container */}
                            <div
                                ref={desktopContainerRef}
                                className="flex-1 px-4 py-4 overflow-y-auto"
                            >
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
                                            {Object.entries(
                                                groupMessagesByDate(
                                                    conversationMessages
                                                )
                                            ).map(([dateKey, group]) => (
                                                <div key={dateKey}>
                                                    {/* Date Separator */}
                                                    <div className="flex items-center gap-3 my-4">
                                                        <div className="flex-1 h-px bg-gray-200"></div>
                                                        <span className="text-xs text-gray-400 px-2">
                                                            {group.label}
                                                        </span>
                                                        <div className="flex-1 h-px bg-gray-200"></div>
                                                    </div>

                                                    {/* Messages for this date */}
                                                    {group.messages.map(
                                                        (message) => (
                                                            <div
                                                                key={message.id}
                                                                className={`flex mb-3 ${
                                                                    message.sender ===
                                                                    "me"
                                                                        ? "justify-end"
                                                                        : "justify-start"
                                                                }`}
                                                            >
                                                                <div
                                                                    className={`max-w-xs px-4 py-2 rounded-2xl ${
                                                                        message.sender ===
                                                                        "me"
                                                                            ? "bg-primary text-white"
                                                                            : "bg-white shadow-sm"
                                                                    }`}
                                                                >
                                                                    {renderMessageContent(
                                                                        message.text,
                                                                        message.sender ===
                                                                            "me"
                                                                    )}
                                                                    <p
                                                                        className={`text-xs mt-1 ${
                                                                            message.sender ===
                                                                            "me"
                                                                                ? "text-primary-light"
                                                                                : "text-gray-500"
                                                                        }`}
                                                                    >
                                                                        {
                                                                            message.timestamp
                                                                        }
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        )
                                                    )}
                                                </div>
                                            ))}
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Message Input */}
                            <div className="flex-shrink-0 bg-white border-t border-gray-200 px-4 py-3">
                                <div className="flex items-center gap-3">
                                    <div className="flex-1 relative">
                                        <input
                                            type="text"
                                            placeholder="Type a message..."
                                            className="w-full px-4 py-2 border border-gray-300 rounded-full outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                            value={newMessage}
                                            onChange={(e) =>
                                                setNewMessage(e.target.value)
                                            }
                                            onKeyPress={(e) =>
                                                e.key === "Enter" &&
                                                handleSendMessage()
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
                    ) : (
                        <div className="flex-1 flex items-center justify-center bg-gray-50">
                            <div className="text-center">
                                <Icon
                                    icon="mingcute:message-3-line"
                                    width="80"
                                    height="80"
                                    className="text-gray-300 mb-4 mx-auto"
                                />
                                <p className="text-gray-500">
                                    Select a conversation to start messaging
                                </p>
                            </div>
                        </div>
                    )}
                </div>
                <NavigationBar />
            </div>
        </div>
    );
}

export default Messages;
