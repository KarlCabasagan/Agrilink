// Test Supabase Storage Setup
// Run this in your browser console to test storage access

import supabase from "./src/SupabaseClient.jsx";

// Test function to check storage setup
const testStorageSetup = async () => {
    try {
        console.log("Testing Supabase Storage setup...");

        // Test 1: Check if buckets exist
        const { data: buckets, error: bucketsError } =
            await supabase.storage.listBuckets();

        if (bucketsError) {
            console.error("Error listing buckets:", bucketsError);
            return;
        }

        console.log(
            "Available buckets:",
            buckets.map((b) => b.name)
        );

        const hasProducts = buckets.some((b) => b.name === "products");
        const hasAvatars = buckets.some((b) => b.name === "avatars");

        if (!hasProducts) console.error('❌ Missing "products" bucket');
        else console.log('✅ "products" bucket exists');

        if (!hasAvatars) console.error('❌ Missing "avatars" bucket');
        else console.log('✅ "avatars" bucket exists');

        // Test 2: Check user authentication
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (user) {
            console.log("✅ User is authenticated:", user.email);
        } else {
            console.log("❌ User is not authenticated - please log in first");
            return;
        }

        // Test 3: Try to list files in products bucket (should work even if empty)
        if (hasProducts) {
            const { data, error } = await supabase.storage
                .from("products")
                .list("", { limit: 1 });

            if (error) {
                console.error(
                    "❌ Cannot access products bucket:",
                    error.message
                );
            } else {
                console.log("✅ Can access products bucket");
            }
        }

        console.log("Storage setup test complete!");
    } catch (error) {
        console.error("Test failed:", error);
    }
};

// Uncomment to run the test:
// testStorageSetup();
