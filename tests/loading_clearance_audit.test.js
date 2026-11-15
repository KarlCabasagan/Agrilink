import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const CONSUMER_PRODUCT = path.resolve("src/pages/consumer/Product.jsx");
const FARMING_GUIDES = path.resolve("src/pages/producer/FarmingGuides.jsx");
const PRODUCER_PRODUCT = path.resolve("src/pages/producer/ProducerProduct.jsx");
const ADMIN_REVIEWS = path.resolve("src/pages/admin/AdminProductReviews.jsx");

test("audit(clearance): pages preserve navigation bar and container clearance in loading state", () => {
    const consumerProduct = fs.readFileSync(CONSUMER_PRODUCT, "utf-8");
    const guides = fs.readFileSync(FARMING_GUIDES, "utf-8");
    const producerProduct = fs.readFileSync(PRODUCER_PRODUCT, "utf-8");
    const adminReviews = fs.readFileSync(ADMIN_REVIEWS, "utf-8");

    // Product.jsx loading branch
    assert.match(consumerProduct, /if\s*\(loading\)[\s\S]*?<NavigationBar\s*\/>/, "Product.jsx loading state must include NavigationBar");
    assert.match(consumerProduct, /if\s*\(loading\)[\s\S]*?pb-24\s+md:pb-16/, "Product.jsx loading state must preserve bottom bar clearance");

    // FarmingGuides.jsx loading branch
    assert.match(guides, /if\s*\(loading\)[\s\S]*?<ProducerNavigationBar\s*\/>/, "FarmingGuides.jsx loading state must include ProducerNavigationBar");
    assert.match(guides, /if\s*\(loading\)[\s\S]*?pb-24\s+md:pb-16/, "FarmingGuides.jsx loading state must preserve bottom bar clearance");

    // ProducerProduct.jsx loading branch
    assert.match(producerProduct, /if\s*\(loading\)[\s\S]*?<ProducerNavigationBar\s*\/>/, "ProducerProduct.jsx loading state must include ProducerNavigationBar");
    assert.match(producerProduct, /if\s*\(loading\)[\s\S]*?pb-24\s+md:pb-16/, "ProducerProduct.jsx loading state must preserve bottom bar clearance");

    // AdminProductReviews.jsx loading branch
    assert.match(adminReviews, /if\s*\(isLoading\)[\s\S]*?<AdminNavigationBar\s*\/>/, "AdminProductReviews.jsx loading state must include AdminNavigationBar");
    assert.match(adminReviews, /if\s*\(isLoading\)[\s\S]*?pb-24\s+md:pb-16/, "AdminProductReviews.jsx loading state must preserve bottom bar clearance");
});
