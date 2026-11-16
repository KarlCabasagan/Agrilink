import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const NETLIFY_CONFIG_PATH = path.resolve("netlify.toml");
const REDIRECTS_PATH = path.resolve("public/_redirects");

test("audit(netlify): netlify.toml defines correct build command, publish dir, and env vars", () => {
    assert.ok(fs.existsSync(NETLIFY_CONFIG_PATH), "netlify.toml must exist in repo root");
    const content = fs.readFileSync(NETLIFY_CONFIG_PATH, "utf-8");

    // Build configuration
    assert.match(content, /command\s*=\s*"npm run build"/, "Build command must be npm run build");
    assert.match(content, /publish\s*=\s*"dist"/, "Publish directory must be dist");

    // Supabase build environment fallbacks
    assert.match(content, /VITE_SUPABASE_URL\s*=\s*"https:\/\/.*\.supabase\.co"/, "netlify.toml must define VITE_SUPABASE_URL");
    assert.match(content, /VITE_SUPABASE_ANON_KEY\s*=\s*"eyJ[A-Za-z0-9._-]+"/, "netlify.toml must define VITE_SUPABASE_ANON_KEY");

    // SPA Redirects
    assert.match(content, /from\s*=\s*"\/\*"\s*\n\s*to\s*=\s*"\/index\.html"\s*\n\s*status\s*=\s*200/, "netlify.toml must route all SPA paths to /index.html with status 200");

    // Security headers
    assert.match(content, /X-Frame-Options\s*=\s*"DENY"/, "netlify.toml must specify X-Frame-Options");
    assert.match(content, /X-Content-Type-Options\s*=\s*"nosniff"/, "netlify.toml must specify nosniff");
});

test("audit(netlify): public/_redirects ensures SPA client-side routing fallback", () => {
    assert.ok(fs.existsSync(REDIRECTS_PATH), "public/_redirects must exist for Netlify routing");
    const content = fs.readFileSync(REDIRECTS_PATH, "utf-8");
    assert.match(content, /\/\*\s+\/index\.html\s+200/, "public/_redirects must route /* to /index.html with status 200");
});
