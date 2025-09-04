// Quick test script - run this in your browser console
// Make sure you're on your Agrilink site and logged in

(async function testStorageQuick() {
    try {
        // Try to access the global supabase client
        const supabaseClient =
            window.supabase ||
            (await import("./src/SupabaseClient.jsx")).default;

        console.log("🔍 Testing storage access...");

        // Test 1: List buckets
        const { data: buckets, error: bucketsError } =
            await supabaseClient.storage.listBuckets();

        if (bucketsError) {
            console.error("❌ Cannot list buckets:", bucketsError);
            return;
        }

        console.log(
            "📦 Available buckets:",
            buckets.map((b) => `${b.name} (public: ${b.public})`)
        );

        // Test 2: Check specific buckets
        const productsExists = buckets.find((b) => b.name === "products");
        const avatarsExists = buckets.find((b) => b.name === "avatars");

        console.log(
            "✅ Products bucket:",
            productsExists
                ? `exists (public: ${productsExists.public})`
                : "missing"
        );
        console.log(
            "✅ Avatars bucket:",
            avatarsExists
                ? `exists (public: ${avatarsExists.public})`
                : "missing"
        );

        // Test 3: Check authentication
        const {
            data: { user },
            error: userError,
        } = await supabaseClient.auth.getUser();
        console.log(
            "👤 Current user:",
            user ? user.email : "not authenticated"
        );

        // Test 4: Try to list files in products bucket (should work even if empty)
        if (productsExists) {
            const { data: files, error: listError } =
                await supabaseClient.storage
                    .from("products")
                    .list("", { limit: 1 });

            if (listError) {
                console.error(
                    "❌ Cannot list files in products bucket:",
                    listError
                );
            } else {
                console.log("✅ Can list files in products bucket");
            }
        }
    } catch (error) {
        console.error("❌ Test failed:", error);
        console.log("💡 Make sure you are logged in and on the Agrilink site");
    }
})();
