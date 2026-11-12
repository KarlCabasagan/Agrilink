import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const REVIEWS_PATH = path.resolve("src/pages/admin/AdminProductReviews.jsx");
const TRANSACTIONS_PATH = path.resolve("src/pages/admin/AdminTransactions.jsx");
const CROPS_PATH = path.resolve("src/pages/admin/AdminCropManagement.jsx");
const MESSAGES_PATH = path.resolve("src/pages/admin/AdminMessages.jsx");

test("audit: AdminProductReviews implements template design, product summary tile, and customer review cards", () => {
    const content = fs.readFileSync(REVIEWS_PATH, "utf-8");

    // Canvas and responsive padding
    assert.match(content, /bg-slate-50\/50/, "Reviews canvas must use template neutral background");
    assert.match(content, /pt-16 md:pt-20/, "Reviews page must have desktop top clearance");
    assert.match(content, /pb-24 md:pb-16/, "Reviews page must have bottom clearance for mobile nav");

    // Summary tile and cards
    assert.match(content, /rounded-2xl border border-slate-200\/90 shadow-2xs/, "Product summary tile and review cards must use rounded-2xl elevation");
    assert.match(content, /tabular-nums/, "Rating distribution counts and review totals must use tabular-nums");

    // Tactile action buttons
    assert.match(content, /active:scale-95/, "Delete and retry buttons must feature tactile compression");

    // Navigation bar mounted
    assert.match(content, /<AdminNavigationBar\s*\/>/, "AdminProductReviews must mount AdminNavigationBar");
});

test("audit: AdminTransactions implements responsive header, status badges, and expandable drawer", () => {
    const content = fs.readFileSync(TRANSACTIONS_PATH, "utf-8");

    // Canvas and responsive clearance
    assert.match(content, /bg-slate-50\/50/, "Transactions canvas must use template neutral background");
    assert.match(content, /pt-16 md:pt-20/, "Transactions container must have desktop clearance");
    assert.match(content, /pb-24 md:pb-16/, "Transactions container must have bottom clearance for mobile nav");

    // Tables and status badges
    assert.match(content, /rounded-2xl border border-slate-200\/90 shadow-2xs/, "Transactions table and filter card must use rounded-2xl elevation");
    assert.match(content, /tabular-nums/, "Order pricing, currency, and timestamps must use tabular-nums");

    // Expandable receipt details
    assert.match(content, /colSpan="6"/, "Expanded receipt row must span all 6 table columns");
    assert.match(content, /Transaction Receipt/, "Expanded drawer must display receipt header");

    // Navigation bar mounted
    assert.match(content, /<AdminNavigationBar\s*\/>/, "AdminTransactions must mount AdminNavigationBar");
});

test("audit: AdminCropManagement and AdminMessages implement consistent admin theme and tactile actions", () => {
    const cropsContent = fs.readFileSync(CROPS_PATH, "utf-8");
    const messagesContent = fs.readFileSync(MESSAGES_PATH, "utf-8");

    // AdminCropManagement checks
    assert.match(cropsContent, /bg-slate-50\/50/, "Crops canvas must use template neutral background");
    assert.match(cropsContent, /pt-16 md:pt-20/, "Crops container must have desktop clearance");
    assert.match(cropsContent, /pb-24 md:pb-16/, "Crops container must have bottom clearance for mobile nav");
    assert.match(cropsContent, /rounded-2xl border border-slate-200\/90 shadow-2xs/, "Crop cards and search section must use rounded-2xl elevation");
    assert.match(cropsContent, /tabular-nums/, "Crop price ranges and saturation percentages must use tabular-nums");
    assert.match(cropsContent, /<AdminNavigationBar\s*\/>/, "AdminCropManagement must mount AdminNavigationBar");

    // AdminMessages checks
    assert.match(messagesContent, /bg-slate-50\/50/, "Messages canvas must use template neutral background");
    assert.match(messagesContent, /pt-16 md:pt-20/, "Messages container must have desktop clearance");
    assert.match(messagesContent, /pb-24 md:pb-16/, "Messages container must have bottom clearance for mobile nav");
    assert.match(messagesContent, /rounded-2xl border border-slate-200\/90 shadow-2xs/, "Messages quick stats and list cards must use rounded-2xl elevation");
    assert.match(messagesContent, /tabular-nums/, "Message counts and unread badges must use tabular-nums");
    assert.match(messagesContent, /<AdminNavigationBar\s*\/>/, "AdminMessages must mount AdminNavigationBar");
});
