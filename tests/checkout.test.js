import test from "node:test";
import assert from "node:assert/strict";
import {
    groupCartByFarmer,
    checkDeliveryEligibility,
    computeCheckoutSummary,
} from "../src/utils/checkout.js";

test("groupCartByFarmer aggregates items under common farmerId", () => {
    const items = [
        {
            id: 1,
            farmerId: "farmer-a",
            farmerName: "Green Acres",
            farmerAddress: "Barangay Maria Cristina",
            price: 50,
            quantity: 2,
            minimumOrderQuantity: 3,
            deliveryCost: 40,
        },
        {
            id: 2,
            farmerId: "farmer-a",
            farmerName: "Green Acres",
            farmerAddress: "Barangay Maria Cristina",
            price: 100,
            quantity: 1,
            minimumOrderQuantity: 3,
            deliveryCost: 40,
        },
        {
            id: 3,
            farmerId: "farmer-b",
            farmerName: "Sunrise Farm",
            farmerAddress: "Barangay Buru-un",
            price: 60,
            quantity: 4,
            minimumOrderQuantity: 2,
            deliveryCost: 50,
        },
    ];

    const grouped = groupCartByFarmer(items);
    assert.equal(Object.keys(grouped).length, 2);
    assert.equal(grouped["farmer-a"].totalQuantity, 3);
    assert.equal(grouped["farmer-a"].totalPrice, 200);
    assert.equal(grouped["farmer-b"].totalQuantity, 4);
    assert.equal(grouped["farmer-b"].totalPrice, 240);
});

test("checkDeliveryEligibility handles delivery requirements accurately", () => {
    const farmerGroups = [
        { farmerId: "f1", totalQuantity: 2, minimumOrderQuantity: 3 },
        { farmerId: "f2", totalQuantity: 5, minimumOrderQuantity: 2 },
    ];

    // Pickup should always be eligible
    const pickupResult = checkDeliveryEligibility(farmerGroups, "pickup");
    assert.equal(pickupResult.isEligible, true);
    assert.equal(pickupResult.ineligibleFarmers.length, 0);

    // Delivery checks minimum quantity
    const deliveryResult = checkDeliveryEligibility(farmerGroups, "delivery");
    assert.equal(deliveryResult.isEligible, false);
    assert.equal(deliveryResult.ineligibleFarmers.length, 1);
    assert.equal(deliveryResult.ineligibleFarmers[0].farmerId, "f1");
});

test("computeCheckoutSummary calculates accurate totals and delivery fees", () => {
    const items = [
        {
            id: 10,
            farmerId: "f1",
            price: 80,
            quantity: 2,
            minimumOrderQuantity: 2,
            deliveryCost: 45,
        },
        {
            id: 20,
            farmerId: "f2",
            price: 50,
            quantity: 3,
            minimumOrderQuantity: 1,
            deliveryCost: 55,
        },
    ];

    // Subtotal: 80*2 + 50*3 = 160 + 150 = 310
    const pickupSummary = computeCheckoutSummary(items, "pickup");
    assert.equal(pickupSummary.subtotal, 310);
    assert.equal(pickupSummary.deliveryFee, 0);
    assert.equal(pickupSummary.finalTotal, 310);
    assert.equal(pickupSummary.isEligible, true);

    const deliverySummary = computeCheckoutSummary(items, "delivery");
    assert.equal(deliverySummary.subtotal, 310);
    assert.equal(deliverySummary.deliveryFee, 100); // 45 + 55
    assert.equal(deliverySummary.finalTotal, 410);
    assert.equal(deliverySummary.isEligible, true);
});
