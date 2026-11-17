import { describe, it } from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";

describe("audit: image preload and loading state protection", () => {
    it("index.html preloads branding icon to prevent late render pop-in", () => {
        const indexHtml = fs.readFileSync(path.resolve("index.html"), "utf8");
        const links = indexHtml.match(/<link\s+[^>]+>/gi) || [];
        const hasPreload = links.some(
            (l) => /rel=["']preload["']/i.test(l) && /as=["']image["']/i.test(l) && /icon_logo\.png/i.test(l)
        );

        assert.strictEqual(
            hasPreload,
            true,
            "index.html must contain a <link rel='preload' as='image' href='/components/icon_logo.png' />"
        );
    });

    it("App.jsx loading screen implements smooth image reveal and high priority fetch", () => {
        const appSource = fs.readFileSync(path.resolve("src/App.jsx"), "utf8");
        
        // Assert fetch priority and graceful visibility handling
        const hasHighPriority = /fetchPriority=["']high["']/i.test(appSource);
        const hasLoadGuard = /logoLoaded/i.test(appSource);

        assert.strictEqual(
            hasHighPriority,
            true,
            "App.jsx loading image must have fetchPriority='high'"
        );
        assert.strictEqual(
            hasLoadGuard,
            true,
            "App.jsx loading screen must track logoLoaded to prevent ugly partial render"
        );
    });
});
