import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const APP_PATH = path.resolve("src/App.jsx");

test("audit(routes): App.jsx nests protected routes inside PersistentLayout", () => {
    const appContent = fs.readFileSync(APP_PATH, "utf-8");

    // Must import PersistentLayout
    assert.match(appContent, /import\s+PersistentLayout\s+from\s+["']\.\/components\/PersistentLayout\.jsx["']/, "Must import PersistentLayout");

    // Must render <Route element={<PersistentLayout />}> wrapping routes
    assert.match(appContent, /<Route\s+element=\{<PersistentLayout\s*\/>\}>/, "Must enclose authenticated routes within PersistentLayout Route");

    // All primary routes must be nested inside the persistent shell
    assert.match(appContent, /<Route\s+path="\/"/, "Home route must be inside persistent shell");
    assert.match(appContent, /<Route\s+path="\/favorites"/, "Favorites route must be inside persistent shell");
    assert.match(appContent, /<Route\s+path="\/cart"/, "Cart route must be inside persistent shell");
    assert.match(appContent, /<Route\s+path="\/orders"/, "Orders route must be inside persistent shell");
    assert.match(appContent, /<Route\s+path="\/producer\/orders"/, "Producer orders must be inside persistent shell");
    assert.match(appContent, /<Route\s+path="\/admin\/dashboard"/, "Admin dashboard must be inside persistent shell");
});
