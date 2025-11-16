import { createContext, useState, useCallback, useEffect } from "react";
import supabase from "../SupabaseClient";

export const AdminPendingCountsContext = createContext({
    pendingApplicationsCount: 0,
    pendingProductsCount: 0,
    updatePendingApplicationsCount: () => {},
    updatePendingProductsCount: () => {},
});

export function AdminPendingCountsProvider({ children, user }) {
    const [pendingApplicationsCount, setPendingApplicationsCount] = useState(0);
    const [pendingProductsCount, setPendingProductsCount] = useState(0);

    // Update pending applications count
    const updatePendingApplicationsCount = useCallback(async () => {
        if (!user) return;

        try {
            const { count, error } = await supabase
                .from("seller_applications")
                .select("id", { head: true, count: "exact" })
                .is("rejection_reason", null);

            if (error) {
                console.error("Error fetching pending applications:", error);
                return;
            }

            setPendingApplicationsCount(count || 0);
        } catch (error) {
            console.error("Error updating pending applications count:", error);
        }
    }, [user]);

    // Update pending products count
    const updatePendingProductsCount = useCallback(async () => {
        if (!user) return;

        try {
            const { count, error } = await supabase
                .from("products")
                .select("id", { head: true, count: "exact" })
                .is("approval_date", null)
                .is("rejection_reason", null);

            if (error) {
                console.error("Error fetching pending products:", error);
                return;
            }

            setPendingProductsCount(count || 0);
        } catch (error) {
            console.error("Error updating pending products count:", error);
        }
    }, [user]);

    // Initialize counts and set up realtime subscriptions
    useEffect(() => {
        if (!user) {
            setPendingApplicationsCount(0);
            setPendingProductsCount(0);
            return;
        }

        // Initial load
        updatePendingApplicationsCount();
        updatePendingProductsCount();

        // Set up realtime channel
        const realtimeChannel = supabase.channel("admin_pending_counts");

        // Listen for seller_applications changes
        realtimeChannel
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "seller_applications",
                },
                (payload) => {
                    // Recompute only when the pending predicate changes
                    // A record is pending if rejection_reason is null
                    const oldIsPending =
                        payload.old?.rejection_reason === null ||
                        payload.old?.rejection_reason === "";
                    const newIsPending =
                        payload.new?.rejection_reason === null ||
                        payload.new?.rejection_reason === "";

                    // Only update if the pending status changed
                    if (oldIsPending !== newIsPending) {
                        updatePendingApplicationsCount();
                    }
                }
            )
            // Listen for products changes
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "products",
                },
                (payload) => {
                    // Recompute only when the pending predicate changes
                    // A product is pending if approval_date is null AND rejection_reason is null
                    const oldIsPending =
                        payload.old?.approval_date === null &&
                        (payload.old?.rejection_reason === null ||
                            payload.old?.rejection_reason === "");
                    const newIsPending =
                        payload.new?.approval_date === null &&
                        (payload.new?.rejection_reason === null ||
                            payload.new?.rejection_reason === "");

                    // Only update if the pending status changed
                    if (oldIsPending !== newIsPending) {
                        updatePendingProductsCount();
                    }
                }
            )
            .subscribe();

        // Fallback interval to refresh counts (every 3 seconds)
        const intervalId = setInterval(() => {
            updatePendingApplicationsCount();
            updatePendingProductsCount();
        }, 3000);

        // Cleanup
        return () => {
            realtimeChannel.unsubscribe();
            clearInterval(intervalId);
        };
    }, [user, updatePendingApplicationsCount, updatePendingProductsCount]);

    const value = {
        pendingApplicationsCount,
        pendingProductsCount,
        updatePendingApplicationsCount,
        updatePendingProductsCount,
    };

    return (
        <AdminPendingCountsContext.Provider value={value}>
            {children}
        </AdminPendingCountsContext.Provider>
    );
}

export default AdminPendingCountsProvider;
