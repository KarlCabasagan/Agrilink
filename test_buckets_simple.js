// Simple test to check if storage buckets exist
// Copy and paste this into your browser console while on your Agrilink site

async function testBuckets() {
    try {
        console.log("🔍 Checking Supabase Storage buckets...");

        // Get the supabase client (adjust import if needed)
        const { createClient } = supabaseJs || window.supabaseJs;
        const supabaseUrl = "YOUR_SUPABASE_URL"; // Replace with your actual URL
        const supabaseKey = "YOUR_SUPABASE_ANON_KEY"; // Replace with your actual key
        const supabase = createClient(supabaseUrl, supabaseKey);

        // List all buckets
        const { data: buckets, error } = await supabase.storage.listBuckets();

        if (error) {
            console.error("❌ Error listing buckets:", error);
            return;
        }

        console.log(
            "📦 Available buckets:",
            buckets.map((b) => `${b.name} (public: ${b.public})`)
        );

        // Check for our required buckets
        const productsExists = buckets.find((b) => b.name === "products");
        const avatarsExists = buckets.find((b) => b.name === "avatars");

        if (productsExists) {
            console.log(
                "✅ Products bucket exists and is " +
                    (productsExists.public ? "public" : "private")
            );
        } else {
            console.log("❌ Products bucket missing");
        }

        if (avatarsExists) {
            console.log(
                "✅ Avatars bucket exists and is " +
                    (avatarsExists.public ? "public" : "private")
            );
        } else {
            console.log("❌ Avatars bucket missing");
        }

        // Test authentication
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (user) {
            console.log("✅ User authenticated:", user.email);
        } else {
            console.log("⚠️ User not authenticated");
        }
    } catch (error) {
        console.error("❌ Test failed:", error);
    }
}

// Run the test
testBuckets();
