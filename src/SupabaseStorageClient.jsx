// Storage client that bypasses RLS using service role
// Add this to your .env file first:
// VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

// Create a client with service role for storage operations
let supabaseStorage = null;

if (supabaseServiceKey) {
    supabaseStorage = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
}

export { supabaseStorage };

// Note: Only use this for storage operations
// Never expose service role key to client-side in production!
