import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const NAVBAR_PATH = path.resolve("src/components/ProducerNavigationBar.jsx");
const HOME_PATH = path.resolve("src/pages/producer/ProducerHome.jsx");
const ORDERS_PATH = path.resolve("src/pages/producer/Orders.jsx");
const PROFILE_PATH = path.resolve("src/pages/producer/ProducerProfile.jsx");
const MESSAGES_PATH = path.resolve("src/pages/producer/ProducerMessages.jsx");
const CROP_REC_PATH = path.resolve("src/pages/producer/CropRecommendation.jsx");
const GUIDES_PATH = path.resolve("src/pages/producer/FarmingGuides.jsx");
const PRODUCT_PATH = path.resolve("src/pages/producer/ProducerProduct.jsx");

test("audit: ProducerNavigationBar renders responsive desktop top header and mobile bottom bar", () => {
    const content = fs.readFileSync(NAVBAR_PATH, "utf-8");

    // Desktop header presence
    assert.match(content, /md:block fixed top-0 left-0 right-0 h-16/, "Desktop top header must be mounted");
    assert.match(content, /Agrilink/, "Desktop header must include Agrilink brand title");
    assert.match(content, /Producer Portal/i, "Portal badge must clarify producer context");

    // Mobile bottom navigation bar presence
    assert.match(content, /md:hidden fixed bottom-0 left-0 right-0/, "Mobile bottom bar must be rendered");
    assert.match(content, /min-h-\[44px\]/, "Mobile buttons must satisfy 44px tap target requirements");
    assert.match(content, /active:scale-95/, "Mobile icon buttons must feature tactile active compression");

    // Tabular numerals for badges
    assert.match(content, /tabular-nums/, "Count badges must use tabular-nums to prevent jitter");
});

test("audit: ProducerHome implements neutral canvas, delivery controls, category chips, and modern cards", () => {
    const content = fs.readFileSync(HOME_PATH, "utf-8");

    assert.match(content, /bg-slate-50\/50/, "Home canvas should use template neutral background");
    assert.match(content, /rounded-2xl border border-slate-200\/90 shadow-2xs/, "Delivery and search sections must use rounded-2xl elevation");
    assert.match(content, /tabular-nums/, "Prices and metrics must apply tabular-nums");
    assert.match(content, /active:scale-\[0\.98\]/, "Product card action buttons must have tactile compression");
    assert.match(content, /<ProducerNavigationBar\s*\/>/, "Home page must mount ProducerNavigationBar");
});

test("audit: Orders page implements mobile header, status tabs, and tabular numeral totals", () => {
    const content = fs.readFileSync(ORDERS_PATH, "utf-8");

    assert.match(content, /bg-slate-50\/50/, "Canvas should use template neutral background");
    assert.match(content, /header className="md:hidden fixed top-0/, "Must include mobile-only sticky header");
    assert.match(content, /md:pt-20 pb-24 md:pb-16/, "Container padding must accommodate responsive navigation bars");
    assert.match(content, /tabular-nums/, "Order pricing and quantities must use tabular-nums");
    assert.match(content, /<ProducerNavigationBar\s*\/>/, "Orders page must mount ProducerNavigationBar");
});

test("audit: ProducerProfile implements verified producer badge, tabular statistics, and action cards", () => {
    const content = fs.readFileSync(PROFILE_PATH, "utf-8");

    assert.match(content, /bg-slate-50\/50/, "Canvas should use template neutral background");
    assert.match(content, /Verified Producer/i, "Profile header must feature verified producer badge");
    assert.match(content, /tabular-nums/, "Profile statistics counters must use tabular-nums");
    assert.match(content, /rounded-2xl border border-slate-200\/90 shadow-2xs/, "Account menu cards must use rounded-2xl card design");
    assert.match(content, /<ProducerNavigationBar\s*\/>/, "ProducerProfile must mount ProducerNavigationBar");
});

test("audit: ProducerMessages mounts NavigationBar at root, uses valid links, and eliminates header overlap", () => {
    const content = fs.readFileSync(MESSAGES_PATH, "utf-8");

    // Root mounted navigation bar
    assert.match(content, /<ProducerNavigationBar\s*\/>/, "ProducerNavigationBar must be mounted at root");
    assert.match(content, /selectedConversation\s*\?\s*"hidden md:block"\s*:\s*"block"/, "Navbar should adapt cleanly during active mobile conversations");
    
    // No broken /producer navigation
    assert.equal(content.includes('navigate("/producer")'), false, "Broken /producer routes must be replaced with /");
    
    // Desktop top padding to prevent header overlap
    assert.match(content, /md:pt-16/, "Outer container must feature md:pt-16 for desktop top header clearance");
    assert.match(content, /active:scale-\[0\.9[58]\]/, "Send button and interactive controls must have active compression");
});

test("audit: CropRecommendation applies template cards, demand indicators, and responsive layout", () => {
    const content = fs.readFileSync(CROP_REC_PATH, "utf-8");

    assert.match(content, /bg-slate-50\/50/, "Canvas should use template neutral background");
    assert.match(content, /rounded-2xl border border-slate-200\/90 shadow-2xs/, "Recommendation cards must use rounded-2xl elevation");
    assert.match(content, /tabular-nums/, "Market demand percentages and prices must use tabular-nums");
    assert.match(content, /<ProducerNavigationBar\s*\/>/, "CropRecommendation must mount ProducerNavigationBar");
});

test("audit: FarmingGuides implements responsive container, search controls, and video cards", () => {
    const content = fs.readFileSync(GUIDES_PATH, "utf-8");

    assert.match(content, /bg-slate-50\/50/, "Canvas should use template neutral background");
    assert.match(content, /header className="md:hidden fixed top-0/, "Must include mobile-only sticky header");
    assert.match(content, /w-full max-w-6xl mx-auto px-4 sm:px-6 pt-16 md:pt-20 pb-24 md:pb-16/, "Content container must use responsive padding");
    assert.match(content, /rounded-2xl border border-slate-200\/90 shadow-2xs/, "Search and video cards must use rounded-2xl elevation");
    assert.match(content, /<ProducerNavigationBar\s*\/>/, "FarmingGuides must mount ProducerNavigationBar");
});

test("audit: ProducerProduct details page implements metric cards, reviews, and active compression", () => {
    const content = fs.readFileSync(PRODUCT_PATH, "utf-8");

    assert.match(content, /bg-slate-50\/50/, "Canvas should use template neutral background");
    assert.match(content, /header className="md:hidden fixed top-0/, "Must include mobile-only sticky header");
    assert.match(content, /hidden md:flex items-center justify-between mb-6/, "Desktop top navigation bar with actions must be present");
    assert.match(content, /tabular-nums/, "Product price, stock, and review counts must use tabular-nums");
    assert.match(content, /max-w-prose/, "Description copy must obey max-w-prose line measure discipline");
    assert.match(content, /active:scale-\[0\.98\]/, "Action buttons must feature active compression");
    assert.match(content, /<ProducerNavigationBar\s*\/>/, "ProducerProduct must mount ProducerNavigationBar");
});
