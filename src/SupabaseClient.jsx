import { createClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "./utils/supabaseConfig.js";

const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        // Allow unverified users to sign in
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        site_url: "https://agrilink-iligan.netlify.app",
    },
});

export default supabase;
