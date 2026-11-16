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

test("isValidSupabaseUrl: validates protocol and Supabase hostname structure", async () => {
    const { isValidSupabaseUrl } = await import("../src/utils/supabaseConfig.js");

    // Valid URLs
    assert.equal(isValidSupabaseUrl("https://bybfwdsuftlwsqflmhng.supabase.co"), true);
    assert.equal(isValidSupabaseUrl("https://my-project-123.supabase.co"), true);

    // Invalid URLs
    assert.equal(isValidSupabaseUrl(""), false);
    assert.equal(isValidSupabaseUrl(null), false);
    assert.equal(isValidSupabaseUrl(undefined), false);
    assert.equal(isValidSupabaseUrl("http://insecure.supabase.co"), false);
    assert.equal(isValidSupabaseUrl("not-a-url"), false);
    assert.equal(isValidSupabaseUrl("https://evil.com"), false);
});

test("validateSupabaseConfig: checks completeness and reports descriptive status", async () => {
    const { validateSupabaseConfig } = await import("../src/utils/supabaseConfig.js");

    const valid = validateSupabaseConfig({
        supabaseUrl: "https://bybfwdsuftlwsqflmhng.supabase.co",
        supabaseAnonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.12345678901234567890",
    });
    assert.equal(valid.valid, true);
    assert.equal(valid.errors.length, 0);

    const invalid = validateSupabaseConfig({
        supabaseUrl: "invalid-url",
        supabaseAnonKey: "short",
    });
    assert.equal(invalid.valid, false);
    assert.ok(invalid.errors.length >= 2);
});

test("safeCreateSupabaseClient: creates client with fallback and catches missing params safely", async () => {
    const { safeCreateSupabaseClient } = await import("../src/utils/supabaseConfig.js");

    // Even if empty object is provided, safeCreateSupabaseClient returns a valid Supabase client instance
    const client = safeCreateSupabaseClient({});
    assert.ok(client, "Must return an initialized Supabase client");
    assert.ok(typeof client.from === "function", "Client must expose .from query builder");
    assert.ok(typeof client.auth === "function" || typeof client.auth === "object", "Client must expose auth");
});


