import test from "node:test";
import assert from "node:assert/strict";

test("getSupabaseConfig: resolves fallback credentials when env vars are missing or empty", async () => {
    // Import the config resolver module
    const { getSupabaseConfig } = await import("../src/utils/supabaseConfig.js");

    // Case 1: When both env vars are undefined
    const configFromEmpty = getSupabaseConfig({
        VITE_SUPABASE_URL: undefined,
        VITE_SUPABASE_ANON_KEY: undefined,
    });

    assert.ok(configFromEmpty.supabaseUrl, "supabaseUrl must never be undefined");
    assert.match(
        configFromEmpty.supabaseUrl,
        /^https:\/\/.*\.supabase\.co$/,
        "supabaseUrl must be a valid Supabase project URL"
    );
    assert.ok(configFromEmpty.supabaseAnonKey, "supabaseAnonKey must never be undefined");
    assert.ok(
        configFromEmpty.supabaseAnonKey.length > 20,
        "supabaseAnonKey must be a non-trivial JWT key string"
    );

    // Case 2: When custom env vars are explicitly provided, they must be respected
    const customConfig = getSupabaseConfig({
        VITE_SUPABASE_URL: "https://custom-project.supabase.co",
        VITE_SUPABASE_ANON_KEY: "custom-anon-key-12345",
    });

    assert.equal(customConfig.supabaseUrl, "https://custom-project.supabase.co");
    assert.equal(customConfig.supabaseAnonKey, "custom-anon-key-12345");
});
