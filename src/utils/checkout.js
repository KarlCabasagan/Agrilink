/**
 * Pure helper utilities for cart grouping and checkout logic
 */

export function groupCartByFarmer(cartItems = []) {
    return cartItems.reduce((groups, item) => {
        const farmerId = item.farmerId || `farmer_${item.id}`;
        if (!groups[farmerId]) {
            groups[farmerId] = {
                farmerId,
                farmerName: item.farmerName || "Unknown Farmer",
                farmerAddress: item.farmerAddress || "Location not available",
                items: [],
                totalQuantity: 0,
                totalPrice: 0,
                minimumOrderQuantity: Number(item.minimumOrderQuantity) || 1.0,
                deliveryCost: Number(item.deliveryCost) || 50,
            };
        }
        groups[farmerId].items.push(item);
        groups[farmerId].totalQuantity += Number(item.quantity) || 0;
        groups[farmerId].totalPrice += (Number(item.price) || 0) * (Number(item.quantity) || 0);
        return groups;
    }, {});
}

export function checkDeliveryEligibility(farmerGroups = [], deliveryMethod = "pickup") {
    if (deliveryMethod !== "delivery") {
        return { isEligible: true, ineligibleFarmers: [] };
    }
    const ineligible = farmerGroups.filter(
        (farmer) => farmer.totalQuantity < farmer.minimumOrderQuantity
    );
    return {
        isEligible: ineligible.length === 0,
        ineligibleFarmers: ineligible,
    };
}

export function computeCheckoutSummary(currentCartItems = [], deliveryMethod = "pickup") {
    const grouped = groupCartByFarmer(currentCartItems);
    const farmerGroups = Object.values(grouped);
    const subtotal = currentCartItems.reduce(
        (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 0),
        0
    );
    const totalDeliveryFee = farmerGroups.reduce(
        (sum, f) => sum + (Number(f.deliveryCost) || 0),
        0
    );
    const deliveryFee = deliveryMethod === "delivery" ? totalDeliveryFee : 0;
    const finalTotal = subtotal + deliveryFee;
    const { isEligible, ineligibleFarmers } = checkDeliveryEligibility(farmerGroups, deliveryMethod);

    return {
        farmerGroups,
        subtotal,
        deliveryFee,
        finalTotal,
        isEligible,
        ineligibleFarmers,
    };
}
