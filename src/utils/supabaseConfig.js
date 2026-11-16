/**
 * Supabase Configuration & Fallback Resolver
 * 
 * Ensures the application always has valid Supabase credentials even if Netlify
 * or the deployment environment does not have VITE_* variables configured in its build dashboard.
 */

export const DEFAULT_SUPABASE_URL = "https://bybfwdsuftlwsqflmhng.supabase.co";
export const DEFAULT_SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5YmZ3ZHN1ZnRsd3NxZmxtaG5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2NTAyOTAsImV4cCI6MjA3MjIyNjI5MH0.JyiEkPl3_0kmTnpsLYn0gtcFLjRAkxzf-xTAbBEW0eg";

/**
 * Resolves Supabase URL and Anon Key with resilient fallbacks.
 *
 * @param {Record<string, string | undefined>} [customEnv] Optional override env object (useful for tests)
 * @returns {{ supabaseUrl: string, supabaseAnonKey: string }}
 */
export function getSupabaseConfig(customEnv) {
    let envUrl = customEnv?.VITE_SUPABASE_URL;
    let envAnonKey = customEnv?.VITE_SUPABASE_ANON_KEY;

    // Check import.meta.env if available and not overridden by customEnv
    if (typeof import.meta !== "undefined" && import.meta.env) {
        if (envUrl === undefined) {
            envUrl = import.meta.env.VITE_SUPABASE_URL;
        }
        if (envAnonKey === undefined) {
            envAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        }
    }

    const supabaseUrl = (envUrl && typeof envUrl === "string" && envUrl.trim().length > 0)
        ? envUrl.trim()
        : DEFAULT_SUPABASE_URL;

    const supabaseAnonKey = (envAnonKey && typeof envAnonKey === "string" && envAnonKey.trim().length > 0)
        ? envAnonKey.trim()
        : DEFAULT_SUPABASE_ANON_KEY;

    return {
        supabaseUrl,
        supabaseAnonKey,
    };
}
