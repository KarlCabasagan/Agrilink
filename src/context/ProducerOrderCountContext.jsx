import { createContext, useState, useCallback, useEffect } from "react";
import supabase from "../SupabaseClient.jsx";

export const ProducerOrderCountContext = createContext({
    pendingOrdersCount: 0,
    setPendingOrdersCount: () => {},
    updatePendingOrdersCount: async () => {},
});

export function ProducerOrderCountProvider({ children, user }) {
    const [pendingOrdersCount, setPendingOrdersCount] = useState(0);

    // Initialize pending orders count when user changes
    useEffect(() => {
        const initializePendingOrdersCount = async () => {
            if (user) {
                try {
                    const { data, error } = await supabase
                        .from("orders")
                        .select("id")
                        .eq("seller_id", user.id)
                        .eq("status_id", 3); // status_id 3 = 'pending'

                    if (error) throw error;

                    setPendingOrdersCount(data?.length || 0);
                } catch (error) {
                    console.error(
                        "Error initializing pending orders count:",
                        error
                    );
                    setPendingOrdersCount(0);
                }
            } else {
                setPendingOrdersCount(0);
            }
        };

        initializePendingOrdersCount();
    }, [user]);

    // Update pending orders count by fetching fresh data from server
    const updatePendingOrdersCount = useCallback(async (userId) => {
        if (!userId) {
            setPendingOrdersCount(0);
            return;
        }

        try {
            const { data, error } = await supabase
                .from("orders")
                .select("id")
                .eq("seller_id", userId)
                .eq("status_id", 3); // status_id 3 = 'pending'

            if (error) throw error;

            setPendingOrdersCount(data?.length || 0);
        } catch (error) {
            console.error("Error updating pending orders count:", error);
        }
    }, []);

    // Set up real-time subscription to order changes
    useEffect(() => {
        if (!user) return;

        const subscriptionRef = supabase
            .channel(`producer-orders-channel-${user.id}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "orders",
                    filter: `seller_id=eq.${user.id}`,
                },
                async () => {
                    // When any order changes (INSERT, UPDATE, DELETE),
                    // recalculate pending orders count
                    updatePendingOrdersCount(user.id);
                }
            )
            .subscribe();

        return () => {
            subscriptionRef.unsubscribe();
        };
    }, [user, updatePendingOrdersCount]);

    // Set up background sync every 5 seconds (fallback for missed real-time events)
    useEffect(() => {
        if (!user) return;

        const interval = setInterval(() => {
            updatePendingOrdersCount(user.id);
        }, 5000);

        return () => clearInterval(interval);
    }, [user, updatePendingOrdersCount]);

    return (
        <ProducerOrderCountContext.Provider
            value={{
                pendingOrdersCount,
                setPendingOrdersCount,
                updatePendingOrdersCount,
            }}
        >
            {children}
        </ProducerOrderCountContext.Provider>
    );
}
