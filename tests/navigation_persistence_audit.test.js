import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const CONSUMER_NAV = path.resolve("src/components/NavigationBar.jsx");
const PRODUCER_NAV = path.resolve("src/components/ProducerNavigationBar.jsx");
const ADMIN_NAV = path.resolve("src/components/AdminNavigationBar.jsx");
const PERSISTENT_LAYOUT = path.resolve("src/components/PersistentLayout.jsx");

test("audit(nav): PersistentLayout provides persistent shell and delegates by role", () => {
    const layoutContent = fs.readFileSync(PERSISTENT_LAYOUT, "utf-8");

    assert.match(layoutContent, /isPersistentLayoutActive:\s*true/, "PersistentLayout must activate persistent layout context");
    assert.match(layoutContent, /<NavigationBar\s+isRootPersistent=\{true\}\s*\/>/, "Must mount root persistent Consumer navigation bar");
    assert.match(layoutContent, /<ProducerNavigationBar\s+isRootPersistent=\{true\}\s*\/>/, "Must mount root persistent Producer navigation bar");
    assert.match(layoutContent, /<AdminNavigationBar\s+isRootPersistent=\{true\}\s*\/>/, "Must mount root persistent Admin navigation bar");
    assert.match(layoutContent, /<Outlet\s*\/>/, "Must render child routes via Outlet");
});

test("audit(nav): NavigationBar components support persistent layout and instant active mark transitions", () => {
    const consumerContent = fs.readFileSync(CONSUMER_NAV, "utf-8");
    const producerContent = fs.readFileSync(PRODUCER_NAV, "utf-8");
    const adminContent = fs.readFileSync(ADMIN_NAV, "utf-8");

    // All navigation bars must check isPersistentLayoutActive and skip duplicate render inside child pages
    assert.match(consumerContent, /if\s*\(isPersistentLayoutActive\s*&&\s*!isRootPersistent\)\s*\{\s*return null;\s*\}/, "Consumer navbar must prevent duplicate rendering");
    assert.match(producerContent, /if\s*\(isPersistentLayoutActive\s*&&\s*!isRootPersistent\)\s*\{\s*return null;\s*\}/, "Producer navbar must prevent duplicate rendering");
    assert.match(adminContent, /if\s*\(isPersistentLayoutActive\s*&&\s*!isRootPersistent\)\s*\{\s*return null;\s*\}/, "Admin navbar must prevent duplicate rendering");

    // Consumer navbar must maintain active mark across /product/, /checkout, /edit-profile
    assert.match(consumerContent, /\/product\//, "Consumer navbar must keep Home active on product detail pages");
    assert.match(consumerContent, /\/checkout/, "Consumer navbar must keep Cart active on checkout flow");
    assert.match(consumerContent, /\/edit-profile/, "Consumer navbar must keep Profile active on profile edit pages");

    // Producer navbar must maintain active mark across subroutes
    assert.match(producerContent, /\/producer\/product\//, "Producer navbar must keep Home active on producer product details");

    // Admin navbar must maintain active mark on product reviews subroutes
    assert.match(adminContent, /\/admin\/product\//, "Admin navbar must keep Products active on product review pages");
});
