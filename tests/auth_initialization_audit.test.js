import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const APP_PATH = path.resolve("src/App.jsx");

test("audit(auth): App.jsx implements authInitialized gate to eliminate login flash", () => {
    const content = fs.readFileSync(APP_PATH, "utf-8");

    // Must have authInitialized state
    assert.match(content, /const\s*\[authInitialized,\s*setAuthInitialized\]\s*=\s*useState\(false\)/, "Must define authInitialized state initialized to false");

    // Must await fetchUserRole during initial auth check
    assert.match(content, /await\s+fetchUserRole\(sessionUser\.id,\s*sessionUser\)/, "Initial auth check must await user role resolution");

    // Flawed premature loading termination effect must NOT exist
    assert.equal(
        content.includes("else if (!user) {\n            setLoading(false);"),
        false,
        "Flawed useEffect prematurely setting loading to false when !user must be removed"
    );

    // PrivateRoute and AuthRoute must check authInitialized
    assert.match(content, /if\s*\(!authInitialized\s*\|\|\s*loading\)\s*\{\s*return null;\s*\}/, "PrivateRoute/AuthRoute must gate on authInitialized to prevent redirect bounce");

    // Branded splash screen must render AgriLink logo and name
    assert.match(content, /icon_logo\.png/, "Cold start splash loader must render AgriLink brand logo");
    assert.match(content, /Loading your workspace…/, "Splash screen must show informative workspace loader");
});

test("audit(refresh): App.jsx caches role and prevents infinite loading lockup on cold reload", () => {
    const content = fs.readFileSync(APP_PATH, "utf-8");

    // Must initialize userRole from localStorage cache to prevent tab refresh freeze
    assert.match(content, /localStorage\.getItem\("agrilink_role"\)/, "App.jsx must check cached role for cold starts");

    // Must handle Supabase query error directly in fetchUserRole without dead catch blocks
    assert.match(content, /if\s*\(error\)\s*\{[\s\S]*?fallbackRole/, "fetchUserRole must safely resolve fallback role on query errors");

    // RoleGuard must not trap user in infinite loader
    assert.equal(
        content.includes('<div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>'),
        false,
        "RoleGuard must not render infinite unstyled spinner when userRole is resolving"
    );
});

test("audit(deadlock-prevention): onAuthStateChange does not contain async DB calls and initAuth has timeout race", () => {
    const content = fs.readFileSync(APP_PATH, "utf-8");

    // onAuthStateChange must be synchronous to avoid Supabase SDK internal lock deadlock
    assert.match(
        content,
        /supabase\.auth\.onAuthStateChange\(\s*\((?:event,\s*session)\)\s*=>/,
        "onAuthStateChange must NOT be an async callback that deadlocks client initialization"
    );

    // initAuth must use Promise.race with a timeout
    assert.match(
        content,
        /Promise\.race\(\[\s*supabase\.auth\.getSession\(\),\s*sessionTimeout,?\s*\]\)/,
        "initAuth must race getSession against a timeout to guarantee loading terminates"
    );
});
