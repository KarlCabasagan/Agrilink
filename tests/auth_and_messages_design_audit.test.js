import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const MESSAGES_PATH = path.resolve("src/pages/consumer/Messages.jsx");
const LOGIN_PATH = path.resolve("src/pages/Login.jsx");
const REGISTER_PATH = path.resolve("src/pages/Register.jsx");
const FORGOT_PATH = path.resolve("src/pages/ForgotPassword.jsx");
const RESET_PATH = path.resolve("src/pages/PasswordReset.jsx");

test("audit: Messages page NavigationBar is mounted at root and has desktop padding", () => {
    const content = fs.readFileSync(MESSAGES_PATH, "utf-8");
    
    // NavigationBar must be mounted at the root level
    assert.match(content, /<NavigationBar\s*\/>/, "NavigationBar component must be rendered");
    
    // md:pt-16 prevents desktop header overlap
    assert.match(content, /md:pt-16/, "Outer container must include md:pt-16 to avoid navbar overlap");
    
    // Dead renderChatPanel must be absent
    assert.equal(content.includes("function renderChatPanel"), false, "Dead renderChatPanel helper should be removed");
    
    // 44px tap targets on interactive mobile headers
    assert.match(content, /min-h-\[44px\]/, "Mobile interactive elements must maintain 44px minimum tap targets");
});

test("audit: Login page matches consumer theme template and Emil Kowalski guidelines", () => {
    const content = fs.readFileSync(LOGIN_PATH, "utf-8");
    
    assert.match(content, /bg-slate-50\/50/, "Canvas should use template neutral background");
    assert.match(content, /full_logo/, "Brand hero section must render logo");
    assert.match(content, /focus:ring-emerald-600\/15/, "Inputs must feature emerald focus ring");
    assert.match(content, /aria-label=/, "Password visibility toggle must include aria-label");
    assert.match(content, /active:scale-\[0\.98\]/, "Submit button must incorporate tactile active compression");
});

test("audit: Register page matches consumer theme template and hit-target standards", () => {
    const content = fs.readFileSync(REGISTER_PATH, "utf-8");
    
    assert.match(content, /bg-slate-50\/50/, "Canvas should use template neutral background");
    assert.match(content, /rounded-2xl border border-slate-200\/90/, "Card must use rounded-2xl border elevation");
    assert.match(content, /focus:ring-emerald-600\/15/, "Inputs must feature emerald focus ring");
    assert.match(content, /aria-label=\{passwordVisible/, "Password toggle must have accessible label");
    assert.match(content, /aria-label=\{confirmPasswordVisible/, "Confirm password toggle must have accessible label");
    assert.match(content, /active:scale-\[0\.98\]/, "Submit button must have active compression");
});

test("audit: ForgotPassword page implements template design and clean navigation", () => {
    const content = fs.readFileSync(FORGOT_PATH, "utf-8");
    
    assert.match(content, /bg-slate-50\/50/, "Canvas should use template neutral background");
    assert.match(content, /rounded-2xl border border-slate-200\/90/, "Card must use rounded-2xl border elevation");
    assert.match(content, /focus:ring-emerald-600\/15/, "Email input must feature emerald focus ring");
    assert.match(content, /active:scale-\[0\.98\]/, "Send button must have active compression");
    assert.match(content, /mingcute:arrow-left-line/, "Back link must include directional arrow icon");
});

test("audit: PasswordReset page implements modern card, blur modal, and eliminates duplicate links", () => {
    const content = fs.readFileSync(RESET_PATH, "utf-8");
    
    assert.match(content, /bg-slate-50\/50/, "Canvas should use template neutral background");
    assert.match(content, /rounded-2xl border border-slate-200\/90/, "Card must use rounded-2xl border elevation");
    assert.match(content, /backdrop-blur/, "Feedback modal must feature modern backdrop blur");
    assert.match(content, /active:scale-\[0\.98\]/, "Update button must have active compression");
    
    // Verify no duplicated Back to Login buttons in button row
    assert.equal(content.includes('bg-gray-100 text-gray-700 px-4 py-3 rounded-lg'), false, "Older button-row back link must be removed");
    assert.match(content, /mingcute:arrow-left-line/, "Dedicated footer link with back arrow must be present");
});
