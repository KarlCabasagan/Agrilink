import test from "node:test";
import assert from "node:assert/strict";
import { validateCartInput, validateImageFile } from "../src/utils/validators.js";

test("validateCartInput rejects missing or invalid userId", () => {
    assert.deepEqual(validateCartInput(null, 1, 1), {
        valid: false,
        error: "Missing or invalid user ID",
    });
    assert.deepEqual(validateCartInput("", 1, 1), {
        valid: false,
        error: "Missing or invalid user ID",
    });
});

test("validateCartInput rejects invalid productId", () => {
    assert.deepEqual(validateCartInput("user-123", null, 1), {
        valid: false,
        error: "Invalid product ID",
    });
    assert.deepEqual(validateCartInput("user-123", -5, 1), {
        valid: false,
        error: "Invalid product ID",
    });
    assert.deepEqual(validateCartInput("user-123", "abc", 1), {
        valid: false,
        error: "Invalid product ID",
    });
});

test("validateCartInput rejects non-positive or NaN quantities", () => {
    assert.deepEqual(validateCartInput("user-123", 1, 0), {
        valid: false,
        error: "Quantity must be greater than zero",
    });
    assert.deepEqual(validateCartInput("user-123", 1, -2), {
        valid: false,
        error: "Quantity must be greater than zero",
    });
    assert.deepEqual(validateCartInput("user-123", 1, NaN), {
        valid: false,
        error: "Quantity must be greater than zero",
    });
    assert.deepEqual(validateCartInput("user-123", 1, "invalid"), {
        valid: false,
        error: "Quantity must be greater than zero",
    });
});

test("validateCartInput accepts valid positive inputs", () => {
    assert.deepEqual(validateCartInput("user-123", 1, 2.5), {
        valid: true,
        sanitizedQuantity: 2.5,
    });
    assert.deepEqual(validateCartInput("user-123", "42", "3"), {
        valid: true,
        sanitizedQuantity: 3,
    });
});

test("validateImageFile rejects dangerous or invalid files", () => {
    assert.equal(validateImageFile(null).valid, false);
    assert.equal(validateImageFile({ type: "application/x-sh", size: 100 }).valid, false);
    assert.equal(validateImageFile({ type: "image/svg+xml", size: 100 }).valid, false);
    assert.equal(validateImageFile({ type: "image/png", size: 10 * 1024 * 1024 }).valid, false);
    assert.equal(validateImageFile({ type: "image/png", size: 2 * 1024 * 1024 }).valid, true);
});
