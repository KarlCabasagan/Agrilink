import { safeCreateSupabaseClient } from "./utils/supabaseConfig.js";

const supabase = safeCreateSupabaseClient();

export default supabase;
