import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
        "❌ Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file"
    );
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createAvatarsBucket() {
    try {
        console.log("Creating avatars bucket...");

        // Create the bucket
        const { data, error } = await supabase.storage.createBucket("avatars", {
            public: true,
            allowedMimeTypes: [
                "image/png",
                "image/jpeg",
                "image/jpg",
                "image/webp",
            ],
            fileSizeLimit: 5242880, // 5MB
        });

        if (error) {
            if (error.message.includes("already exists")) {
                console.log("✅ Avatars bucket already exists");
                return true;
            }
            console.error("❌ Error creating bucket:", error);
            return false;
        }

        console.log("✅ Avatars bucket created successfully:", data);
        return true;
    } catch (error) {
        console.error("❌ Error:", error);
        return false;
    }
}

// Test upload function
async function testAvatarUpload() {
    try {
        // Test if we can access the bucket
        const { data, error } = await supabase.storage.from("avatars").list();

        if (error) {
            console.error("❌ Cannot access avatars bucket:", error);
            return false;
        }

        console.log("✅ Avatars bucket is accessible");
        return true;
    } catch (error) {
        console.error("❌ Error testing bucket:", error);
        return false;
    }
}

async function main() {
    console.log("🚀 Setting up avatars bucket...\n");

    const bucketCreated = await createAvatarsBucket();
    if (bucketCreated) {
        const bucketAccessible = await testAvatarUpload();
        if (bucketAccessible) {
            console.log("\n✅ All set! Your avatars bucket is ready to use.");
        }
    } else {
        console.log(
            "\n❌ Failed to set up avatars bucket. Please check your Supabase configuration."
        );
    }
}

main();
