import { useEffect } from "react";
import supabase from "../SupabaseClient";

/**
 * Hook to update user's last_login timestamp when component mounts
 * @param {string} userId - The authenticated user's ID
 * @returns {void}
 */
const useUpdateLastLogin = (userId) => {
    useEffect(() => {
        const updateLastLogin = async () => {
            if (!userId) return;

            try {
                const timestamp = new Date().toISOString();
                const { error } = await supabase
                    .from("profiles")
                    .update({
                        last_login: timestamp,
                        updated_at: timestamp,
                    })
                    .eq("id", userId);

                if (error) {
                    console.error("Failed to update last login:", error);
                }
            } catch (err) {
                console.error("Error updating last login:", err);
            }
        };

        updateLastLogin();
    }, [userId]); // Only run when userId changes
};

export default useUpdateLastLogin;
