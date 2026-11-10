import React, { useState, useEffect, useContext, useRef } from "react";
import { Icon } from "@iconify/react";
import { Link, useSearchParams } from "react-router-dom";
import NavigationBar from "../../components/NavigationBar";
import StateView from "../../components/StateView.jsx";
import supabase from "../../SupabaseClient";
import { AuthContext } from "../../context/AuthContext.jsx";
import { UnreadConversationsContext } from "../../context/UnreadConversationsContext.jsx";
import { getProfileAvatarUrl } from "../../utils/avatarUtils.js";

const ReplacementRequestCard = ({ replacementData }) => {
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);

    return (
        <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-4 max-w-xs mt-2 text-slate-900 shadow-2xs">
            {/* Header */}
            <div className="flex items-center gap-2 mb-2.5">
                <div className="w-6 h-6 rounded-md bg-amber-100 flex items-center justify-center text-amber-700">
                    <Icon
                        icon="mingcute:refresh-2-line"
                        width="15"
                        height="15"
                    />
                </div>
                <h3 className="font-bold text-xs uppercase tracking-wider text-amber-800">
                    Replacement Request
                </h3>
            </div>

            {/* Item Name */}
            <div className="mb-1.5">
                <p className="font-bold text-sm text-slate-900">
                    {replacementData.itemName}
                </p>
            </div>

            {/* Reason */}
            <div className="mb-2">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Reason:</p>
                <p className="text-xs text-slate-700 leading-relaxed">
                    {replacementData.reason}
                </p>
            </div>

            {/* Order ID */}
            <div className="mb-2 text-[11px] text-slate-500 font-mono tabular-nums">
                Order #{replacementData.orderId}
            </div>

            {/* Proof Image with Loading State */}
            {replacementData.proofUrl && (
                <div className="mt-2.5 relative w-full">
                    {!imageLoaded && !imageError && (
                        <div className="w-full h-44 bg-slate-100 animate-pulse rounded-xl flex items-center justify-center border border-amber-100">
                            <Icon
                                icon="mingcute:loading-line"
                                className="animate-spin text-amber-600"
                                width="22"
                                height="22"
                            />
                        </div>
                    )}
                    <img
                        src={replacementData.proofUrl}
                        alt="Replacement proof"
                        className={`w-full rounded-xl border border-amber-200/70 object-cover max-h-48 ${
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
            className={`w-full bg-white rounded-2xl border p-3.5 sm:p-4 transition-all duration-150 text-left flex items-center gap-3 active:scale-[0.99] ${
                selectedConversation === conversation.id
                    ? "border-emerald-600 bg-emerald-50/30 shadow-xs ring-1 ring-emerald-600/30"
                    : "border-slate-200/90 hover:border-slate-300 shadow-2xs hover:bg-slate-50/50"
            }`}
        >
            <div className="relative shrink-0">
                <img
                    src={
                        conversation.farmerAvatar ||
                        "/assets/blank-profile.jpg"
                    }
                    alt={conversation.farmerName}
                    className="w-11 h-11 sm:w-12 sm:h-12 rounded-full object-cover border border-slate-200/80"
                    onError={(e) => {
                        e.target.src = "/assets/blank-profile.jpg";
                    }}
                />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                    <h3 className="font-semibold text-slate-900 text-sm truncate">
                        {conversation.farmerName}
                    </h3>
                    <span className="text-[11px] text-slate-400 tabular-nums shrink-0 ml-2">
                        {conversation?.timestamp
                            ? formatTimestamp(conversation.timestamp)
                            : "Just now"}
                    </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-slate-500 truncate">
                        {conversation.lastMessage}
                    </p>
                    {conversation.unread > 0 && (
                        <div className="bg-emerald-700 text-white text-[11px] font-bold min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full shrink-0 tabular-nums">
                            {conversation.unread}
                        </div>
                    )}
                </div>
            </div>
        </button>
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
        <div className="min-h-screen w-full max-w-full overflow-x-hidden flex flex-col bg-slate-50/50 text-slate-900 md:pt-16">
            {/* ===== MOBILE LAYOUT (md:hidden) ===== */}
            {selectedConversation && farmer ? (
                <div className="md:hidden h-screen w-full flex flex-col relative overflow-hidden bg-slate-50/30">
                    {/* Fixed header for mobile chat */}
                    <header className="fixed top-0 left-0 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 z-50 px-4 py-3 flex items-center gap-3">
                        <button
                            onClick={() => setSelectedConversation(null)}
                            className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center text-slate-600 hover:text-emerald-700 rounded-xl hover:bg-slate-100 active:scale-[0.97] transition-all"
                            aria-label="Back to conversations"
                        >
                            <Icon
                                icon="mingcute:left-line"
                                width="22"
                                height="22"
                            />
                        </button>
                        <img
                            src={farmer.farmerAvatar || "/assets/adel.jpg"}
                            alt={farmer.farmerName || "Farmer"}
                            className="w-10 h-10 rounded-full object-cover border border-slate-200"
                        />
                        <div className="flex-1 min-w-0">
                            <h2 className="font-bold text-sm text-slate-900 truncate">
                                {farmer.farmerName || "Loading..."}
                            </h2>
                            <p className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                                Local Producer
                            </p>
                        </div>
                    </header>

                    {/* Messages Container */}
                    <div className="flex-1 mt-16 flex flex-col overflow-hidden">
                        <div
                            ref={containerRef}
                            className="flex-1 px-4 py-4 overflow-y-auto pb-24"
                        >
                            <div className="space-y-4">
                                {loadingMessages ? (
                                    <div className="text-center py-8">
                                        <StateView type="loading" message="Loading messages..." />
                                    </div>
                                ) : conversationMessages.length === 0 ? (
                                    <div className="text-center py-12">
                                        <div className="w-12 h-12 rounded-full mx-auto mb-3 bg-emerald-50 border border-emerald-200/70 flex items-center justify-center text-emerald-700">
                                            <Icon
                                                icon="mingcute:message-3-line"
                                                width="24"
                                                height="24"
                                            />
                                        </div>
                                        <p className="text-sm font-semibold text-slate-700">
                                            No messages yet
                                        </p>
                                        <p className="text-xs text-slate-400 mt-0.5">
                                            Say hello to start the conversation!
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
                                                    <div className="flex-1 h-px bg-slate-200/70"></div>
                                                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold px-2">
                                                        {group.label}
                                                    </span>
                                                    <div className="flex-1 h-px bg-slate-200/70"></div>
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
                                                                className={`max-w-[82%] sm:max-w-md px-4 py-2.5 rounded-2xl shadow-2xs text-sm ${
                                                                    message.sender ===
                                                                    "me"
                                                                        ? "bg-emerald-700 text-white rounded-br-xs"
                                                                        : "bg-white border border-slate-200/80 text-slate-800 rounded-bl-xs"
                                                                }`}
                                                            >
                                                                {renderMessageContent(
                                                                    message.text,
                                                                    message.sender ===
                                                                        "me"
                                                                )}
                                                                <p
                                                                    className={`text-[10px] mt-1 tabular-nums ${
                                                                        message.sender ===
                                                                        "me"
                                                                            ? "text-emerald-100 text-right"
                                                                            : "text-slate-400"
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
                    <div className="fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-4 py-3 z-50">
                        <div className="flex items-center gap-2">
                            <div className="flex-1 relative">
                                <input
                                    type="text"
                                    placeholder="Type a message..."
                                    className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-full text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 transition-all"
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
                                className="w-11 h-11 bg-emerald-700 text-white rounded-full flex items-center justify-center hover:bg-emerald-800 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none shadow-xs"
                                disabled={!newMessage.trim()}
                                aria-label="Send message"
                            >
                                <Icon
                                    icon="mingcute:send-line"
                                    width="18"
                                    height="18"
                                />
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="md:hidden min-h-screen w-full flex flex-col relative items-center scrollbar-hide bg-slate-50/50 overflow-x-hidden text-slate-900 pb-24">
                    {/* Header */}
                    <header className="fixed top-0 left-0 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 z-50 px-4 py-3">
                        {showSearch ? (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => {
                                        setShowSearch(false);
                                        setSearchTerm("");
                                    }}
                                    className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center text-slate-600 hover:text-emerald-700 rounded-xl hover:bg-slate-100 transition-colors"
                                    aria-label="Close search"
                                >
                                    <Icon
                                        icon="mingcute:left-line"
                                        width="22"
                                        height="22"
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
                                        className="w-full h-10 px-3.5 pr-8 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-emerald-600 outline-none text-slate-900"
                                        autoFocus
                                    />
                                    {searchTerm && (
                                        <button
                                            onClick={() => setSearchTerm("")}
                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
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
                                    className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center text-slate-600 hover:text-emerald-700 rounded-xl hover:bg-slate-100 transition-colors"
                                    aria-label="Back to Home"
                                >
                                    <Icon
                                        icon="mingcute:left-line"
                                        width="22"
                                        height="22"
                                    />
                                </Link>
                                <h1 className="text-base font-bold text-slate-900">
                                    Messages
                                </h1>
                                <button
                                    onClick={() => setShowSearch(true)}
                                    className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center text-slate-600 hover:text-emerald-700 rounded-xl hover:bg-slate-100 transition-colors"
                                    aria-label="Search conversations"
                                >
                                    <Icon
                                        icon="mingcute:search-line"
                                        width="20"
                                        height="20"
                                    />
                                </button>
                            </div>
                        )}
                    </header>

                    <div className="w-full max-w-2xl mx-auto px-4 mt-16">
                        {loading ? (
                            <div className="py-16 text-center">
                                <StateView type="loading" message="Loading conversations..." />
                            </div>
                        ) : error ? (
                            <div className="py-12 text-center bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 mt-4">
                                <StateView
                                    type="error"
                                    title="Error Loading Messages"
                                    message={error}
                                    action={{
                                        label: "Try Again",
                                        onClick: fetchConversations,
                                        icon: "mingcute:refresh-1-line",
                                    }}
                                />
                            </div>
                        ) : conversations.length === 0 ? (
                            <div className="py-12 text-center bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 mt-4">
                                <StateView
                                    type="empty"
                                    title="No messages yet"
                                    message="Start a conversation with local farmers about fresh harvests!"
                                    action={{
                                        label: "Browse Products",
                                        onClick: () => window.location.href = "/",
                                        icon: "mingcute:shopping-bag-1-line",
                                    }}
                                />
                            </div>
                        ) : filteredConversations.length === 0 ? (
                            <div className="py-12 text-center bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 mt-4">
                                <StateView
                                    type="empty"
                                    title="No conversations found"
                                    message="Try adjusting your search terms"
                                    action={{
                                        label: "Clear Search",
                                        onClick: () => setSearchTerm(""),
                                        icon: "mingcute:close-line",
                                    }}
                                />
                            </div>
                        ) : (
                            <div className="space-y-2.5 pt-2">
                                {searchTerm && (
                                    <div className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl tabular-nums">
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
                </div>
            )}

            {/* ===== DESKTOP LAYOUT (hidden md:flex) ===== */}
            <div className="hidden md:flex flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 md:mt-6 pb-6">
                <div className="w-full h-[calc(100vh-140px)] bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden flex">
                    {/* Left Column: Conversations List */}
                    <div className="w-80 lg:w-96 border-r border-slate-200 flex flex-col bg-white shrink-0">
                        {/* Header */}
                        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                            <div className="flex items-center justify-between">
                                <h2 className="text-base font-bold text-slate-900">
                                    Messages
                                </h2>
                                <button
                                    onClick={() => setShowSearch(!showSearch)}
                                    className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center text-slate-500 hover:text-emerald-700 rounded-xl hover:bg-slate-100 transition-colors"
                                    aria-label="Toggle search"
                                >
                                    <Icon
                                        icon="mingcute:search-line"
                                        width="18"
                                        height="18"
                                    />
                                </button>
                            </div>
                            {showSearch && (
                                <div className="mt-2.5 relative">
                                    <input
                                        type="text"
                                        placeholder="Search conversations..."
                                        value={searchTerm}
                                        onChange={(e) =>
                                            setSearchTerm(e.target.value)
                                        }
                                        className="w-full h-9 px-3 pr-8 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/20 text-slate-900"
                                        autoFocus
                                    />
                                    {searchTerm && (
                                        <button
                                            onClick={() => setSearchTerm("")}
                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                                        >
                                            <Icon
                                                icon="mingcute:close-line"
                                                width="14"
                                                height="14"
                                            />
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Conversations List */}
                        <div className="flex-1 overflow-y-auto p-3 space-y-2">
                            {loading ? (
                                <div className="py-16 text-center">
                                    <StateView type="loading" message="Loading conversations..." />
                                </div>
                            ) : error ? (
                                <div className="py-8 px-4 text-center">
                                    <p className="text-xs text-rose-600 font-medium">{error}</p>
                                </div>
                            ) : conversations.length === 0 ? (
                                <div className="py-12 px-4 text-center">
                                    <p className="text-xs text-slate-500">No conversations yet</p>
                                </div>
                            ) : filteredConversations.length === 0 ? (
                                <div className="py-12 px-4 text-center">
                                    <p className="text-xs text-slate-500">No conversations found</p>
                                </div>
                            ) : (
                                filteredConversations.map(renderConversationCard)
                            )}
                        </div>
                    </div>

                    {/* Right Column: Chat Panel */}
                    {selectedConversation && farmer ? (
                        <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/30">
                            {/* Chat Header */}
                            <div className="px-5 py-3.5 bg-white border-b border-slate-100 flex items-center gap-3">
                                <img
                                    src={
                                        farmer.farmerAvatar ||
                                        "/assets/adel.jpg"
                                    }
                                    alt={farmer.farmerName || "Farmer"}
                                    className="w-10 h-10 rounded-full object-cover border border-slate-200"
                                />
                                <div>
                                    <h2 className="font-bold text-sm text-slate-900">
                                        {farmer.farmerName || "Loading..."}
                                    </h2>
                                    <p className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                                        Local Producer
                                    </p>
                                </div>
                            </div>

                            {/* Messages Container */}
                            <div
                                ref={desktopContainerRef}
                                className="flex-1 px-5 py-5 overflow-y-auto"
                            >
                                <div className="space-y-4">
                                    {loadingMessages ? (
                                        <div className="text-center py-12">
                                            <StateView type="loading" message="Loading messages..." />
                                        </div>
                                    ) : conversationMessages.length === 0 ? (
                                        <div className="text-center py-16">
                                            <div className="w-12 h-12 rounded-full mx-auto mb-3 bg-emerald-50 border border-emerald-200/70 flex items-center justify-center text-emerald-700">
                                                <Icon
                                                    icon="mingcute:message-3-line"
                                                    width="24"
                                                    height="24"
                                                />
                                            </div>
                                            <p className="text-sm font-semibold text-slate-700">
                                                No messages yet
                                            </p>
                                            <p className="text-xs text-slate-400 mt-0.5">
                                                Say hello to start the conversation!
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
                                                        <div className="flex-1 h-px bg-slate-200/70"></div>
                                                        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold px-2">
                                                            {group.label}
                                                        </span>
                                                        <div className="flex-1 h-px bg-slate-200/70"></div>
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
                                                                    className={`max-w-[75%] px-4 py-2.5 rounded-2xl shadow-2xs text-sm ${
                                                                        message.sender ===
                                                                        "me"
                                                                            ? "bg-emerald-700 text-white rounded-br-xs"
                                                                            : "bg-white border border-slate-200/80 text-slate-800 rounded-bl-xs"
                                                                    }`}
                                                                >
                                                                    {renderMessageContent(
                                                                        message.text,
                                                                        message.sender ===
                                                                            "me"
                                                                    )}
                                                                    <p
                                                                        className={`text-[10px] mt-1 tabular-nums ${
                                                                            message.sender ===
                                                                            "me"
                                                                                ? "text-emerald-100 text-right"
                                                                                : "text-slate-400"
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
                            <div className="px-5 py-3.5 bg-white border-t border-slate-100">
                                <div className="flex items-center gap-2.5">
                                    <div className="flex-1 relative">
                                        <input
                                            type="text"
                                            placeholder="Type a message..."
                                            className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-full text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 transition-all"
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
                                        className="w-11 h-11 bg-emerald-700 text-white rounded-full flex items-center justify-center hover:bg-emerald-800 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none shadow-xs"
                                        disabled={!newMessage.trim()}
                                        aria-label="Send message"
                                    >
                                        <Icon
                                            icon="mingcute:send-line"
                                            width="18"
                                            height="18"
                                        />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center bg-slate-50/40 p-8">
                            <StateView
                                type="empty"
                                icon="mingcute:message-3-line"
                                title="No conversation selected"
                                message="Select a farmer from the sidebar to view your message history and chat in real time."
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Navigation Bar (visible on desktop always; on mobile only when not inside a conversation) */}
            <div className={selectedConversation ? "hidden md:block" : "block"}>
                <NavigationBar />
            </div>
        </div>
    );
}

export default Messages;
