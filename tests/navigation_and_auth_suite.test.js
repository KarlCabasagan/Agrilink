import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

test("suite(navigation): all portal navigation bars meet Emil Kowalski standards and persistence invariants", () => {
    const consumerNav = fs.readFileSync(path.resolve("src/components/NavigationBar.jsx"), "utf-8");
    const producerNav = fs.readFileSync(path.resolve("src/components/ProducerNavigationBar.jsx"), "utf-8");
    const adminNav = fs.readFileSync(path.resolve("src/components/AdminNavigationBar.jsx"), "utf-8");
    const persistentLayout = fs.readFileSync(path.resolve("src/components/PersistentLayout.jsx"), "utf-8");
    const gitignore = fs.readFileSync(path.resolve(".gitignore"), "utf-8");
    const agents = fs.readFileSync(path.resolve("AGENTS.md"), "utf-8");

    // 1. Graphify exclusion check
    assert.match(gitignore, /graphify-out\//, ".gitignore must exclude graphify-out/");
    assert.match(agents, /Never track, stage, commit, or push/, "AGENTS.md must document strict graphify exclusion policy");

    // 2. Persistent Layout check
    assert.match(persistentLayout, /NavigationLayoutContext\.Provider/, "Must provide persistent layout context");
    assert.match(persistentLayout, /window\.scrollTo\(0,\s*0\)/, "Must reset scroll position on route transitions");

    // 3. Tabular numerals on badges across all portals
    assert.match(consumerNav, /tabular-nums/, "Consumer count badges must apply tabular-nums");
    assert.match(producerNav, /tabular-nums/, "Producer count badges must apply tabular-nums");
    assert.match(adminNav, /tabular-nums/, "Admin count badges must apply tabular-nums");

    // 4. Hit targets (minimum 44px) across all portals
    assert.match(consumerNav, /min-h-\[44px\]/, "Consumer mobile navigation buttons must satisfy 44px tap targets");
    assert.match(producerNav, /min-h-\[44px\]/, "Producer mobile navigation buttons must satisfy 44px tap targets");
    assert.match(adminNav, /min-h-\[44px\]/, "Admin mobile navigation buttons must satisfy 44px tap targets");

    // 5. Tactile active compression across all portals
    assert.match(consumerNav, /active:scale-95/, "Consumer navigation must provide tactile active compression");
    assert.match(producerNav, /active:scale-95/, "Producer navigation must provide tactile active compression");
    assert.match(adminNav, /active:scale-95/, "Admin navigation must provide tactile active compression");
});
