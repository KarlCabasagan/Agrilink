import { describe, it } from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";

describe("audit: universal SafeImage loading and integration", () => {
    it("SafeImage component provides skeleton placeholder, decoding, and fallback handling", () => {
        const filePath = path.resolve("src/components/SafeImage.jsx");
        assert.strictEqual(
            fs.existsSync(filePath),
            true,
            "src/components/SafeImage.jsx must exist"
        );

        const source = fs.readFileSync(filePath, "utf8");
        assert.strictEqual(
            /safe-image-skeleton|animate-pulse/i.test(source),
            true,
            "SafeImage must render skeleton during image load"
        );
        assert.strictEqual(
            /transition-opacity/i.test(source),
            true,
            "SafeImage must implement smooth opacity fade-in transition"
        );
        assert.strictEqual(
            /cubic-bezier\(0\.16,\s*1,\s*0\.3,\s*1\)/i.test(source),
            true,
            "SafeImage must use Emil Kowalski smooth cubic-bezier curve"
        );
        assert.strictEqual(
            /decoding=["']async["']/i.test(source),
            true,
            "SafeImage must use asynchronous image decoding"
        );
        assert.strictEqual(
            /fallbackSrc/i.test(source),
            true,
            "SafeImage must handle fallbackSrc on error"
        );
    });

    it("product cards, orders, cart, and profile avatars integrate SafeImage to prevent pop-in", () => {
        const homeSource = fs.readFileSync(path.resolve("src/pages/consumer/Home.jsx"), "utf8");
        const favoritesSource = fs.readFileSync(path.resolve("src/pages/consumer/Favorites.jsx"), "utf8");
        const profileSource = fs.readFileSync(path.resolve("src/pages/consumer/Profile.jsx"), "utf8");
        const productSource = fs.readFileSync(path.resolve("src/pages/consumer/Product.jsx"), "utf8");
        const cartSource = fs.readFileSync(path.resolve("src/pages/consumer/Cart.jsx"), "utf8");
        const ordersSource = fs.readFileSync(path.resolve("src/pages/consumer/Orders.jsx"), "utf8");
        const producerHomeSource = fs.readFileSync(path.resolve("src/pages/producer/ProducerHome.jsx"), "utf8");
        const producerProductSource = fs.readFileSync(path.resolve("src/pages/producer/ProducerProduct.jsx"), "utf8");

        assert.strictEqual(
            /SafeImage/i.test(homeSource),
            true,
            "Home.jsx must use SafeImage for product cards"
        );
        assert.strictEqual(
            /SafeImage/i.test(favoritesSource),
            true,
            "Favorites.jsx must use SafeImage for favorite product cards"
        );
        assert.strictEqual(
            /SafeImage/i.test(profileSource),
            true,
            "Profile.jsx must use SafeImage for profile avatar"
        );
        assert.strictEqual(
            /SafeImage/i.test(productSource),
            true,
            "Product.jsx must use SafeImage for hero product image"
        );
        assert.strictEqual(
            /SafeImage/i.test(cartSource),
            true,
            "Cart.jsx must use SafeImage for produce item cards"
        );
        assert.strictEqual(
            /SafeImage/i.test(ordersSource),
            true,
            "Orders.jsx must use SafeImage for order item produce cards"
        );
        assert.strictEqual(
            /SafeImage/i.test(producerHomeSource),
            true,
            "ProducerHome.jsx must use SafeImage for producer product cards"
        );
        assert.strictEqual(
            /SafeImage/i.test(producerProductSource),
            true,
            "ProducerProduct.jsx must use SafeImage for producer product hero"
        );
    });
});
