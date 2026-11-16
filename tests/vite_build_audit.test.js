import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const VITE_CONFIG_PATH = path.resolve("vite.config.js");
const DIST_PATH = path.resolve("dist");

test("audit(vite): vite.config.js defines dedicated vendor chunks for modular caching", () => {
    assert.ok(fs.existsSync(VITE_CONFIG_PATH), "vite.config.js must exist");
    const content = fs.readFileSync(VITE_CONFIG_PATH, "utf-8");

    assert.match(
        content,
        /"supabase-vendor":\s*\["@supabase\/supabase-js"\]/,
        "Must isolate supabase-js into its own cacheable bundle chunk"
    );
    assert.match(
        content,
        /"react-vendor":\s*\["react",\s*"react-dom",\s*"react-router-dom"\]/,
        "Must isolate react ecosystem into a vendor chunk"
    );
    assert.match(
        content,
        /"icons":\s*\["@iconify\/react"\]/,
        "Must isolate iconify icons into an icons chunk"
    );
});

test("audit(dist): build output contains separated vendor chunk assets", () => {
    assert.ok(fs.existsSync(DIST_PATH), "dist/ output must exist after build");
    const assetsDir = path.join(DIST_PATH, "assets");
    assert.ok(fs.existsSync(assetsDir), "dist/assets must exist");

    const files = fs.readdirSync(assetsDir);
    const hasSupabaseChunk = files.some((f) => f.startsWith("supabase-vendor-") && f.endsWith(".js"));
    const hasReactChunk = files.some((f) => f.startsWith("react-vendor-") && f.endsWith(".js"));
    const hasIconsChunk = files.some((f) => f.startsWith("icons-") && f.endsWith(".js"));

    assert.ok(hasSupabaseChunk, "dist/assets must contain supabase-vendor chunk");
    assert.ok(hasReactChunk, "dist/assets must contain react-vendor chunk");
    assert.ok(hasIconsChunk, "dist/assets must contain icons chunk");
});
