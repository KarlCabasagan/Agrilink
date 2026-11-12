import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const USER_MGMT_PATH = path.resolve("src/pages/admin/AdminUserManagement.jsx");
const PRODUCT_MGMT_PATH = path.resolve("src/pages/admin/AdminProductManagement.jsx");

test("audit: AdminUserManagement implements neutral canvas, responsive clearance, and modern user tables", () => {
    const content = fs.readFileSync(USER_MGMT_PATH, "utf-8");

    // Canvas & responsive clearance
    assert.match(content, /bg-slate-50\/50/, "Canvas must use template neutral background");
    assert.match(content, /pt-16 md:pt-20 pb-24 md:pb-16/, "Container must include responsive clearance for desktop header and mobile bar");

    // Tab switcher
    assert.match(content, /bg-white rounded-2xl border border-slate-200\/90 shadow-2xs p-1\.5 mb-6/, "Tab navigation must use modern rounded-2xl container");

    // Search controls
    assert.match(content, /bg-slate-50\/50 border border-slate-200 rounded-xl/, "Search bar must use rounded-xl with emerald focus rings");
    assert.match(content, /focus:border-emerald-600/, "Search bar must focus emerald brand color");

    // Data tables & cards
    assert.match(content, /rounded-2xl border border-slate-200\/90 shadow-2xs/, "User tables and producer application cards must use rounded-2xl elevation");
    assert.match(content, /tabular-nums/, "Date and phone metrics must use tabular-nums");

    // Image preview modal
    assert.match(content, /backdrop-blur/, "ID image preview modal must use backdrop blur overlay");
    assert.match(content, /rounded-2xl/, "ID image preview modal must use rounded-2xl card");

    // Navigation bar mounted
    assert.match(content, /<AdminNavigationBar\s*\/>/, "AdminUserManagement must mount AdminNavigationBar");
});

test("audit: AdminProductManagement implements neutral canvas, category tabs, and action modals", () => {
    const content = fs.readFileSync(PRODUCT_MGMT_PATH, "utf-8");

    // Canvas & responsive clearance
    assert.match(content, /bg-slate-50\/50/, "Canvas must use template neutral background");
    assert.match(content, /pt-16 md:pt-20 pb-24 md:pb-16/, "Container must include responsive clearance for desktop header and mobile bar");

    // Tabs & search
    assert.match(content, /bg-white rounded-2xl border border-slate-200\/90 shadow-2xs p-1\.5 mb-6/, "Tab navigation must use modern rounded-2xl container");
    assert.match(content, /focus:border-emerald-600/, "Search inputs must feature emerald focus ring");

    // Tables & cards
    assert.match(content, /rounded-2xl border border-slate-200\/90 shadow-2xs/, "Catalog and category tables must use rounded-2xl elevation");
    assert.match(content, /tabular-nums/, "Product price and stock metrics must apply tabular-nums");

    // Tactile action compression
    assert.match(content, /active:scale-95/, "Action buttons must feature tactile active compression");

    // Product image modal
    assert.match(content, /backdrop-blur/, "Product image preview modal must use backdrop blur overlay");
    assert.match(content, /rounded-2xl/, "Product image modal must use rounded-2xl card");

    // Navigation bar mounted
    assert.match(content, /<AdminNavigationBar\s*\/>/, "AdminProductManagement must mount AdminNavigationBar");
});
