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
