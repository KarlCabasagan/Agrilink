import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

test("audit(deployment): end-to-end Netlify Supabase configuration resilience", async () => {
    // 1. Verify safe resolution under zero-env conditions
    const { getSupabaseConfig, safeCreateSupabaseClient } = await import(
        "../src/utils/supabaseConfig.js"
    );

    const emptyEnvConfig = getSupabaseConfig({
        VITE_SUPABASE_URL: undefined,
        VITE_SUPABASE_ANON_KEY: undefined,
    });

    assert.ok(emptyEnvConfig.supabaseUrl, "Fallback URL must be present when env is undefined");
    assert.match(emptyEnvConfig.supabaseUrl, /^https:\/\//, "Fallback URL must be HTTPS");
    assert.ok(emptyEnvConfig.supabaseAnonKey, "Fallback anon key must be present when env is undefined");

    // 2. Verify safe client creation without throwing
    let clientCreated = false;
    try {
        const client = safeCreateSupabaseClient({
            VITE_SUPABASE_URL: undefined,
            VITE_SUPABASE_ANON_KEY: undefined,
        });
        clientCreated = Boolean(client && client.from);
    } catch (err) {
        clientCreated = false;
    }
    assert.equal(clientCreated, true, "safeCreateSupabaseClient must not throw under undefined env");

    // 3. Verify netlify.toml and public/_redirects exist and match SPA rules
    const netlifyPath = path.resolve("netlify.toml");
    const redirectsPath = path.resolve("public/_redirects");

    assert.ok(fs.existsSync(netlifyPath), "netlify.toml must exist");
    assert.ok(fs.existsSync(redirectsPath), "public/_redirects must exist");

    const netlifyToml = fs.readFileSync(netlifyPath, "utf-8");
    const redirects = fs.readFileSync(redirectsPath, "utf-8");

    assert.match(netlifyToml, /VITE_SUPABASE_URL/, "netlify.toml must provide VITE_SUPABASE_URL");
    assert.match(redirects, /\/\*\s+\/index\.html\s+200/, "public/_redirects must route to /index.html 200");
});
