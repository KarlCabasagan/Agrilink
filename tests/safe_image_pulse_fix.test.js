import { describe, it } from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";

describe("reproduction & verification: image skeleton pulsing fix", () => {
    it("SafeImage skeleton must not pulse infinitely and must disable animation when loaded", () => {
        const filePath = path.resolve("src/components/SafeImage.jsx");
        const source = fs.readFileSync(filePath, "utf8");

        // Skeleton must NOT contain unqualified infinite animate-pulse class that persists when loaded
        const hasUnconditionalInfinitePulseClass = /className=\{[^}]*animate-pulse[^}]*\$\{/i.test(source);
        assert.strictEqual(
            hasUnconditionalInfinitePulseClass,
            false,
            "SafeImage skeleton must not retain infinite animate-pulse class on loaded state"
        );

        // Skeleton must configure single-pass pulse (iteration 1) when loading and 'none' when loaded
        const hasOneTimePulseControl = /animation:\s*loaded\s*\?\s*["']none["']\s*:\s*["'][^"']*1\s+forwards["']/i.test(source) ||
            /animationIterationCount:\s*loaded\s*\?\s*["']none["']\s*:\s*1/i.test(source);
        assert.strictEqual(
            hasOneTimePulseControl,
            true,
            "SafeImage skeleton animation must execute at most 1 time during load and disable on loaded"
        );

        // Skeleton must transition out cleanly
        assert.strictEqual(
            /pointer-events-none/i.test(source),
            true,
            "SafeImage skeleton must be pointer-events-none to prevent intercepting clicks"
        );

        // Image must fade in one time with Emil Kowalski cubic bezier
        assert.strictEqual(
            /transition:\s*["']opacity 300ms cubic-bezier\(0\.16,\s*1,\s*0\.3,\s*1\)["']/i.test(source),
            true,
            "SafeImage must fade in one time using smooth 300ms cubic-bezier curve"
        );
    });
});
