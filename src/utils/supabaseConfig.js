import { createClient } from "@supabase/supabase-js";

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
 * Validates that a string is a valid HTTPS Supabase project URL.
 *
 * @param {any} url
 * @returns {boolean}
 */
export function isValidSupabaseUrl(url) {
    if (!url || typeof url !== "string") return false;
    const trimmed = url.trim();
    if (!trimmed.startsWith("https://")) return false;
    try {
        const parsed = new URL(trimmed);
        return parsed.hostname.endsWith(".supabase.co") && parsed.protocol === "https:";
    } catch {
        return false;
    }
}

/**
 * Validates a Supabase configuration object.
 *
 * @param {{ supabaseUrl?: any, supabaseAnonKey?: any }} config
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateSupabaseConfig(config) {
    const errors = [];
    if (!isValidSupabaseUrl(config?.supabaseUrl)) {
        errors.push("Invalid or missing supabaseUrl: must be an HTTPS .supabase.co URL.");
    }
    if (
        !config?.supabaseAnonKey ||
        typeof config.supabaseAnonKey !== "string" ||
        config.supabaseAnonKey.trim().length <= 20
    ) {
        errors.push("Invalid or missing supabaseAnonKey: must be a valid JWT anon key.");
    }
    return {
        valid: errors.length === 0,
        errors,
    };
}

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

    const supabaseUrl = isValidSupabaseUrl(envUrl)
        ? envUrl.trim()
        : DEFAULT_SUPABASE_URL;

    const supabaseAnonKey = (envAnonKey && typeof envAnonKey === "string" && envAnonKey.trim().length > 20)
        ? envAnonKey.trim()
        : DEFAULT_SUPABASE_ANON_KEY;

    return {
        supabaseUrl,
        supabaseAnonKey,
    };
}

/**
 * Safely creates a Supabase client ensuring valid credentials and avoiding module-level unhandled exceptions.
 *
 * @param {Record<string, string | undefined>} [customEnv]
 * @param {Record<string, any>} [options]
 * @returns {import("@supabase/supabase-js").SupabaseClient}
 */
export function safeCreateSupabaseClient(customEnv, options = {}) {
    const config = getSupabaseConfig(customEnv);
    const validation = validateSupabaseConfig(config);

    if (!validation.valid) {
        console.warn("[AgriLink Supabase Config Warning]", validation.errors);
    }

    return createClient(config.supabaseUrl, config.supabaseAnonKey, {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true,
            site_url: "https://agrilink-iligan.netlify.app",
            ...options.auth,
        },
        ...options,
    });
}

