import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const NAVBAR_PATH = path.resolve("src/components/AdminNavigationBar.jsx");
const DASHBOARD_PATH = path.resolve("src/pages/admin/AdminDashboard.jsx");
const MODAL_PATH = path.resolve("src/components/Modal.jsx");
const CONFIRM_MODAL_PATH = path.resolve("src/components/ConfirmModal.jsx");
const REJECT_MODAL_PATH = path.resolve("src/components/RejectModal.jsx");
const SUSPEND_MODAL_PATH = path.resolve("src/components/SuspendUserModal.jsx");
const REVIEW_MODAL_PATH = path.resolve("src/components/ReviewModal.jsx");

test("audit: AdminNavigationBar renders responsive desktop top header and mobile bottom bar", () => {
    const content = fs.readFileSync(NAVBAR_PATH, "utf-8");

    // Desktop top header
    assert.match(content, /md:block fixed top-0 left-0 right-0 h-16/, "Desktop top header must be mounted at top-0");
    assert.match(content, /Agrilink/, "Header must include Agrilink brand title");
    assert.match(content, /Admin Portal/i, "Portal badge must clarify admin management context");

    // Mobile bottom navigation bar
    assert.match(content, /md:hidden fixed bottom-0 left-0 right-0 h-16/, "Mobile navigation must be pinned to bottom");
    assert.match(content, /min-h-\[44px\]/, "Mobile buttons must satisfy 44px tap target requirements");
    assert.match(content, /active:scale-95/, "Mobile navigation buttons must have tactile active compression");
    assert.match(content, /tabular-nums/, "Count badges must apply tabular-nums to prevent layout jitter");
});

test("audit: AdminDashboard implements neutral canvas, responsive clearance, and modern stats grid", () => {
    const content = fs.readFileSync(DASHBOARD_PATH, "utf-8");

    // Canvas & padding
    assert.match(content, /bg-slate-50\/50/, "Dashboard canvas must apply template neutral background");
    assert.match(content, /pt-16 md:pt-20 pb-24 md:pb-16/, "Main container must have responsive clearance for desktop header and mobile bar");

    // Quick stats and cards
    assert.match(content, /rounded-2xl border border-slate-200\/90 shadow-2xs/, "Stat cards must use rounded-2xl elevation");
    assert.match(content, /tabular-nums/, "Metrics, currency, and counts must use tabular-nums");

    // Time range chips and tactile actions
    assert.match(content, /active:scale-95/, "Filter chips and action cards must feature tactile active compression");
    assert.match(content, /<AdminNavigationBar\s*\/>/, "AdminDashboard must mount AdminNavigationBar");
});

test("audit: Shared Admin Modals implement rounded-2xl elevation, backdrop blur, and tactile buttons", () => {
    const modalContent = fs.readFileSync(MODAL_PATH, "utf-8");
    const confirmContent = fs.readFileSync(CONFIRM_MODAL_PATH, "utf-8");
    const rejectContent = fs.readFileSync(REJECT_MODAL_PATH, "utf-8");
    const suspendContent = fs.readFileSync(SUSPEND_MODAL_PATH, "utf-8");
    const reviewContent = fs.readFileSync(REVIEW_MODAL_PATH, "utf-8");

    // Modal and ConfirmModal checks
    assert.match(modalContent, /rounded-2xl/, "Modal base card must use rounded-2xl elevation");
    assert.match(modalContent, /backdrop-blur/, "Modal base must apply backdrop blur overlay");
    assert.match(confirmContent, /<Modal/, "ConfirmModal must delegate to Modal component");

    // RejectModal and SuspendUserModal delegation
    assert.match(rejectContent, /<Modal/, "RejectModal must delegate to Modal component");
    assert.match(rejectContent, /rounded-xl/, "RejectModal textarea must use rounded-xl inputs");
    assert.match(suspendContent, /<Modal/, "SuspendUserModal must delegate to Modal component");
    assert.match(suspendContent, /rounded-xl/, "SuspendUserModal textarea must use rounded-xl inputs");

    // ReviewModal checks
    assert.match(reviewContent, /rounded-2xl/, "ReviewModal must use rounded-2xl card");
    assert.match(reviewContent, /backdrop-blur/, "ReviewModal must apply backdrop blur overlay");
    assert.match(reviewContent, /min-h-\[44px\]/, "ReviewModal actions must satisfy 44px hit bounds");
});
