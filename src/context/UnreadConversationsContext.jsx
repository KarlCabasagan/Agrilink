import { createContext, useState, useCallback, useEffect } from "react";
import supabase from "../SupabaseClient.jsx";

export const UnreadConversationsContext = createContext({
    unreadConversationCount: 0,
    setUnreadConversationCount: () => {},
    updateUnreadConversationCount: async () => {},
});

export function UnreadConversationsProvider({ children, user, role = 1 }) {
    const [unreadConversationCount, setUnreadConversationCount] = useState(0);

    // Initialize unread conversation count when user changes
    useEffect(() => {
        const initializeUnreadCount = async () => {
            if (user) {
                try {
                    // Determine if this is consumer (role 1) or producer (role 2) mode
                    const filterField =
                        role === 2 ? "producer_id" : "consumer_id";

                    const { data: conversationsData, error } = await supabase
                        .from("conversations")
                        .select(
                            `
                        id,
                        messages (
                            id,
                            sender_id,
                            is_read
                        )
                    `
                        )
                        .eq(filterField, user.id);

                    if (error) throw error;

                    // Count conversations with unread messages from the other party
                    const unreadCount = conversationsData.filter(
                        (conv) =>
                            Array.isArray(conv.messages) &&
                            conv.messages.some(
                                (msg) =>
                                    msg.sender_id !== user.id && !msg.is_read
                            )
                    ).length;

                    setUnreadConversationCount(unreadCount);
                } catch (error) {
                    console.error(
                        "Error initializing unread conversation count:",
                        error
                    );
                    setUnreadConversationCount(0);
                }
            } else {
                setUnreadConversationCount(0);
            }
        };

        initializeUnreadCount();
    }, [user, role]);

    // Update unread conversation count by fetching fresh data from server
    const updateUnreadConversationCount = useCallback(
        async (userId) => {
            if (!userId) {
                setUnreadConversationCount(0);
                return;
            }

            try {
                // Determine if this is consumer (role 1) or producer (role 2) mode
                const filterField = role === 2 ? "producer_id" : "consumer_id";

                const { data: conversationsData, error } = await supabase
                    .from("conversations")
                    .select(
                        `
                id,
                messages (
                    id,
                    sender_id,
                    is_read
                )
            `
                    )
                    .eq(filterField, userId);

                if (error) throw error;

                // Count conversations with unread messages from the other party
                const unreadCount = conversationsData.filter(
                    (conv) =>
                        Array.isArray(conv.messages) &&
                        conv.messages.some(
                            (msg) => msg.sender_id !== userId && !msg.is_read
                        )
                ).length;

                setUnreadConversationCount(unreadCount);
            } catch (error) {
                console.error(
                    "Error updating unread conversation count:",
                    error
                );
            }
        },
        [role]
    );

    // Set up real-time subscription to message changes
    useEffect(() => {
        if (!user) return;

        const subscriptionRef = supabase
            .channel("unread-messages-channel")
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "messages",
                },
                async () => {
                    // When any message changes (INSERT, UPDATE, DELETE),
                    // recalculate unread conversation count
                    updateUnreadConversationCount(user.id);
                }
            )
            .subscribe();

        return () => {
            subscriptionRef.unsubscribe();
        };
    }, [user, updateUnreadConversationCount]);

    // Set up background sync every 30 seconds (fallback for missed real-time events)
    useEffect(() => {
        if (!user) return;

        const interval = setInterval(() => {
            updateUnreadConversationCount(user.id);
        }, 5000);

        return () => clearInterval(interval);
    }, [user, updateUnreadConversationCount]);

    return (
        <UnreadConversationsContext.Provider
            value={{
                unreadConversationCount,
                setUnreadConversationCount,
                updateUnreadConversationCount,
            }}
        >
            {children}
        </UnreadConversationsContext.Provider>
    );
}
