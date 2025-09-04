import { useState, useContext, useEffect } from "react";
import { Icon } from "@iconify/react";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../../App";
import NavigationBar from "../../components/NavigationBar";
import supabase from "../../SupabaseClient";

function Checkout() {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();
    const { cartItems = [], totalAmount = 0 } = location.state || {};

    const [loading, setLoading] = useState(false);
    const [profileLoading, setProfileLoading] = useState(true);
    const [orderPlaced, setOrderPlaced] = useState(false);
    const [orderId, setOrderId] = useState("");

    const [formData, setFormData] = useState({
        fullName: "",
        email: user?.email || "",
        phone: "",
        address: "",
        city: "Iligan City",
        province: "Lanao del Norte",
        postalCode: "9200",
        deliveryMethod: "delivery", // "delivery" or "pickup"
        paymentMethod: "cod",
        notes: "",
    });

    const [errors, setErrors] = useState({});

    const deliveryFee = formData.deliveryMethod === "delivery" ? 50.0 : 0.0;
    const finalTotal = totalAmount + deliveryFee;

    // Fetch user profile data
    useEffect(() => {
        const fetchUserProfile = async () => {
            if (!user) {
                setProfileLoading(false);
                return;
            }

            try {
                const { data, error } = await supabase
                    .from("profiles")
                    .select("name, contact, address")
                    .eq("id", user.id)
                    .single();

                if (data) {
                    // Extract just the digits from the formatted contact number for editing
                    const contactDigits = data.contact
                        ? data.contact.replace(/\D/g, "").slice(2) // Remove +63 prefix
                        : "";

                    setFormData((prev) => ({
                        ...prev,
                        fullName: data.name || "",
                        phone: contactDigits,
                        address: data.address || "",
                    }));
                }
            } catch (error) {
                console.error("Error fetching profile:", error);
            } finally {
                setProfileLoading(false);
            }
        };

        fetchUserProfile();
    }, [user]);

    // Phone number formatting functions (universal format from EditProfile)
    const formatPhoneNumber = (phoneNumber) => {
        if (!phoneNumber) return "";
        // Remove all non-digits
        const cleaned = phoneNumber.replace(/\D/g, "");

        // Format as: +63 912 345 6789
        if (cleaned.length >= 10) {
            return `+63 ${cleaned.slice(0, 3)} ${cleaned.slice(
                3,
                6
            )} ${cleaned.slice(6, 10)}`;
        } else if (cleaned.length >= 6) {
            return `+63 ${cleaned.slice(0, 3)} ${cleaned.slice(
                3,
                6
            )} ${cleaned.slice(6)}`;
        } else if (cleaned.length >= 3) {
            return `+63 ${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
        } else if (cleaned.length > 0) {
            return `+63 ${cleaned}`;
        }
        return "+63 ";
    };

    const displayPhoneNumber = (phoneNumber) => {
        if (!phoneNumber) return "";
        const cleaned = phoneNumber.replace(/\D/g, "");

        if (cleaned.length >= 7) {
            return `${cleaned.slice(0, 3)} ${cleaned.slice(
                3,
                6
            )} ${cleaned.slice(6)}`;
        } else if (cleaned.length >= 3) {
            return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
        }
        return cleaned;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;

        if (name === "phone") {
            // Remove all non-digits
            const cleanValue = value.replace(/\D/g, "");
            // Limit to 10 digits (excluding +63)
            const limitedValue = cleanValue.slice(0, 10);
            setFormData((prev) => ({
                ...prev,
                [name]: limitedValue,
            }));
        } else {
            setFormData((prev) => ({
                ...prev,
                [name]: value,
            }));
        }

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors((prev) => ({
                ...prev,
                [name]: "",
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.fullName.trim())
            newErrors.fullName = "Full name is required";
        if (!formData.email.trim()) newErrors.email = "Email is required";
        if (!formData.phone.trim())
            newErrors.phone = "Phone number is required";

        if (formData.deliveryMethod === "delivery") {
            if (!formData.address.trim())
                newErrors.address = "Address is required for delivery";
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (formData.email && !emailRegex.test(formData.email)) {
            newErrors.email = "Please enter a valid email address";
        }

        // Phone validation (Philippine format) - check for 10 digits
        if (formData.phone) {
            const cleanedPhone = formData.phone.replace(/\D/g, "");
            if (cleanedPhone.length !== 10 || !cleanedPhone.startsWith("9")) {
                newErrors.phone =
                    "Please enter a valid 10-digit Philippine mobile number starting with 9";
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        if (!cartItems || cartItems.length === 0) {
            alert("No items to checkout");
            navigate("/cart");
            return;
        }

        setLoading(true);

        try {
            // Format contact number before submission
            const formattedContact = formatPhoneNumber(formData.phone);
            const submissionData = {
                ...formData,
                phone: formattedContact,
            };

            // Simulate order placement
            await new Promise((resolve) => setTimeout(resolve, 2000));

            // Generate order ID
            const newOrderId = `ORD-${Date.now()}`;
            setOrderId(newOrderId);
            setOrderPlaced(true);

            // Here you would typically:
            // 1. Create order in database
            // 2. Clear cart
            // 3. Send confirmation email
            // 4. Process payment if not COD
        } catch (error) {
            console.error("Error placing order:", error);
            alert("Failed to place order. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleContinueShopping = () => {
        navigate("/");
    };

    const handleViewOrders = () => {
        navigate("/orders");
    };

    // Order Success Screen
    if (orderPlaced) {
        return (
            <div className="min-h-screen w-full flex flex-col relative items-center scrollbar-hide bg-background overflow-x-hidden text-text pb-20">
                <div className="fixed top-0 left-0 w-full bg-white shadow-md z-50 px-4 py-3">
                    <h1 className="text-lg font-semibold text-primary text-center">
                        Order Placed
                    </h1>
                </div>

                <div className="w-full max-w-2xl mx-4 sm:mx-auto my-16 flex items-center justify-center min-h-[60vh]">
                    <div className="bg-white rounded-lg shadow-md p-8 text-center">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Icon
                                icon="mingcute:check-circle-fill"
                                width="40"
                                height="40"
                                className="text-green-600"
                            />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-3">
                            Order Placed Successfully!
                        </h2>
                        <p className="text-gray-600 mb-2">
                            Your order{" "}
                            <span className="font-semibold text-primary">
                                #{orderId}
                            </span>{" "}
                            has been placed.
                        </p>
                        <p className="text-gray-600 mb-6">
                            You will receive a confirmation email shortly with
                            tracking details.
                        </p>

                        <div className="bg-gray-50 rounded-lg p-4 mb-6">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">
                                    Order Total:
                                </span>
                                <span className="font-bold text-lg text-primary">
                                    ₱{finalTotal.toFixed(2)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-sm mt-1">
                                <span className="text-gray-600">
                                    Payment Method:
                                </span>
                                <span className="text-gray-800">
                                    {formData.paymentMethod === "cod"
                                        ? "Cash on Delivery"
                                        : "Online Payment"}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-sm mt-1">
                                <span className="text-gray-600">
                                    Delivery Method:
                                </span>
                                <span className="text-gray-800">
                                    {formData.deliveryMethod === "delivery"
                                        ? "Home Delivery"
                                        : "Farm Pickup"}
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={handleViewOrders}
                                className="flex-1 bg-primary text-white py-3 px-6 rounded-lg hover:bg-primary-dark transition-colors font-medium"
                            >
                                View My Orders
                            </button>
                            <button
                                onClick={handleContinueShopping}
                                className="flex-1 border border-primary text-primary py-3 px-6 rounded-lg hover:bg-primary/5 transition-colors font-medium"
                            >
                                Continue Shopping
                            </button>
                        </div>
                    </div>
                </div>

                <NavigationBar />
            </div>
        );
    }

    // Redirect if no cart items
    if (!cartItems || cartItems.length === 0) {
        return (
            <div className="min-h-screen w-full flex flex-col relative items-center scrollbar-hide bg-background overflow-x-hidden text-text pb-20">
                <div className="fixed top-0 left-0 w-full bg-white shadow-md z-50 px-4 py-3">
                    <h1 className="text-lg font-semibold text-primary text-center">
                        Checkout
                    </h1>
                </div>

                <div className="w-full max-w-2xl mx-4 sm:mx-auto my-16 flex items-center justify-center min-h-[60vh]">
                    <div className="bg-white rounded-lg shadow-md p-8 text-center">
                        <Icon
                            icon="mingcute:shopping-cart-1-line"
                            width="80"
                            height="80"
                            className="text-gray-300 mb-4 mx-auto"
                        />
                        <h2 className="text-xl font-bold text-gray-600 mb-2">
                            No items to checkout
                        </h2>
                        <p className="text-gray-500 mb-6">
                            Please add items to your cart before proceeding to
                            checkout.
                        </p>
                        <button
                            onClick={() => navigate("/cart")}
                            className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-dark transition-colors font-medium"
                        >
                            Back to Cart
                        </button>
                    </div>
                </div>

                <NavigationBar />
            </div>
        );
    }

    if (profileLoading) {
        return (
            <div className="min-h-screen w-full flex flex-col relative items-center scrollbar-hide bg-background overflow-x-hidden text-text pb-20">
                <div className="fixed top-0 left-0 w-full bg-white shadow-md z-50 px-4 py-3">
                    <h1 className="text-lg font-semibold text-primary text-center">
                        Checkout
                    </h1>
                </div>
                <div className="w-full max-w-2xl mx-4 sm:mx-auto my-16 flex items-center justify-center min-h-[60vh]">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
                </div>
                <NavigationBar />
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full flex flex-col relative items-center scrollbar-hide bg-background overflow-x-hidden text-text pb-20">
            {/* Header */}
            <div className="fixed top-0 left-0 w-full bg-white shadow-md z-50 px-4 py-3">
                <div className="flex items-center">
                    <button
                        onClick={() => navigate("/cart")}
                        className="text-primary hover:text-primary-dark mr-3"
                    >
                        <Icon
                            icon="mingcute:left-line"
                            width="24"
                            height="24"
                        />
                    </button>
                    <h1 className="text-lg font-semibold text-primary">
                        Checkout
                    </h1>
                </div>
            </div>

            <div className="w-full max-w-4xl mx-4 sm:mx-auto my-16">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Checkout Form */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Delivery Method */}
                            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                                <div className="p-6 border-b border-gray-200">
                                    <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                        <Icon
                                            icon="mingcute:truck-line"
                                            width="20"
                                            height="20"
                                            className="text-primary"
                                        />
                                        Delivery Method
                                    </h2>
                                </div>
                                <div className="p-6 space-y-3">
                                    <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                                        <input
                                            type="radio"
                                            name="deliveryMethod"
                                            value="delivery"
                                            checked={
                                                formData.deliveryMethod ===
                                                "delivery"
                                            }
                                            onChange={handleInputChange}
                                            className="mr-3 text-primary focus:ring-primary"
                                        />
                                        <div className="flex items-center gap-3 flex-1">
                                            <Icon
                                                icon="mingcute:home-line"
                                                width="24"
                                                height="24"
                                                className="text-blue-600"
                                            />
                                            <div>
                                                <span className="font-medium text-gray-800">
                                                    Home Delivery
                                                </span>
                                                <p className="text-sm text-gray-600">
                                                    Get your order delivered to
                                                    your doorstep
                                                </p>
                                                <p className="text-sm text-primary font-medium">
                                                    + ₱50.00 delivery fee
                                                </p>
                                            </div>
                                        </div>
                                    </label>

                                    <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                                        <input
                                            type="radio"
                                            name="deliveryMethod"
                                            value="pickup"
                                            checked={
                                                formData.deliveryMethod ===
                                                "pickup"
                                            }
                                            onChange={handleInputChange}
                                            className="mr-3 text-primary focus:ring-primary"
                                        />
                                        <div className="flex items-center gap-3 flex-1">
                                            <Icon
                                                icon="mingcute:location-line"
                                                width="24"
                                                height="24"
                                                className="text-green-600"
                                            />
                                            <div>
                                                <span className="font-medium text-gray-800">
                                                    Farm Pickup
                                                </span>
                                                <p className="text-sm text-gray-600">
                                                    Pick up your order directly
                                                    from the farm
                                                </p>
                                                <p className="text-sm text-green-600 font-medium">
                                                    Free pickup
                                                </p>
                                            </div>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            {/* Contact Information */}
                            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                                <div className="p-6 border-b border-gray-200">
                                    <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                        <Icon
                                            icon="mingcute:user-line"
                                            width="20"
                                            height="20"
                                            className="text-primary"
                                        />
                                        Contact Information
                                    </h2>
                                </div>
                                <div className="p-6 space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Full Name *
                                            </label>
                                            <input
                                                type="text"
                                                name="fullName"
                                                value={formData.fullName}
                                                onChange={handleInputChange}
                                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                                                    errors.fullName
                                                        ? "border-red-300"
                                                        : "border-gray-300"
                                                }`}
                                                placeholder="Enter your full name"
                                            />
                                            {errors.fullName && (
                                                <p className="text-red-600 text-sm mt-1">
                                                    {errors.fullName}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Email Address *
                                            </label>
                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-gray-100"
                                                placeholder="Enter your email"
                                                readOnly
                                            />
                                            <p className="text-xs text-gray-500 mt-1">
                                                Email cannot be changed during
                                                checkout
                                            </p>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Phone Number *
                                        </label>
                                        <div className="relative">
                                            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 font-medium bg-gray-100 px-2 py-1 rounded text-sm">
                                                +63
                                            </div>
                                            <input
                                                type="tel"
                                                name="phone"
                                                value={displayPhoneNumber(
                                                    formData.phone
                                                )}
                                                onChange={handleInputChange}
                                                className={`w-full pl-16 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                                                    errors.phone
                                                        ? "border-red-300"
                                                        : "border-gray-300"
                                                }`}
                                                placeholder="912 345 6789"
                                                maxLength={13} // "912 345 6789"
                                            />
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Enter your 10-digit mobile number
                                            (without +63)
                                        </p>
                                        {errors.phone && (
                                            <p className="text-red-600 text-sm mt-1">
                                                {errors.phone}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Address Information - Only show for delivery */}
                            {formData.deliveryMethod === "delivery" && (
                                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                                    <div className="p-6 border-b border-gray-200">
                                        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                            <Icon
                                                icon="mingcute:location-line"
                                                width="20"
                                                height="20"
                                                className="text-primary"
                                            />
                                            Delivery Address
                                        </h2>
                                    </div>
                                    <div className="p-6 space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Complete Address *
                                            </label>
                                            <textarea
                                                name="address"
                                                value={formData.address}
                                                onChange={handleInputChange}
                                                rows="3"
                                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                                                    errors.address
                                                        ? "border-red-300"
                                                        : "border-gray-300"
                                                }`}
                                                placeholder="Street, Building, Unit Number, Barangay"
                                            />
                                            {errors.address && (
                                                <p className="text-red-600 text-sm mt-1">
                                                    {errors.address}
                                                </p>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    City *
                                                </label>
                                                <input
                                                    type="text"
                                                    name="city"
                                                    value={formData.city}
                                                    onChange={handleInputChange}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-gray-100"
                                                    placeholder="City"
                                                    readOnly
                                                />
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Currently serving Iligan
                                                    City only
                                                </p>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Province *
                                                </label>
                                                <input
                                                    type="text"
                                                    name="province"
                                                    value={formData.province}
                                                    onChange={handleInputChange}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-gray-100"
                                                    placeholder="Province"
                                                    readOnly
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Postal Code
                                                </label>
                                                <input
                                                    type="text"
                                                    name="postalCode"
                                                    value={formData.postalCode}
                                                    onChange={handleInputChange}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-gray-100"
                                                    placeholder="Postal Code"
                                                    readOnly
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Pickup Information - Only show for pickup */}
                            {formData.deliveryMethod === "pickup" && (
                                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                                    <div className="p-6 border-b border-gray-200">
                                        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                            <Icon
                                                icon="mingcute:location-line"
                                                width="20"
                                                height="20"
                                                className="text-primary"
                                            />
                                            Pickup Information
                                        </h2>
                                    </div>
                                    <div className="p-6">
                                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                            <div className="flex items-start gap-3">
                                                <Icon
                                                    icon="mingcute:information-line"
                                                    width="24"
                                                    height="24"
                                                    className="text-green-600 mt-0.5"
                                                />
                                                <div>
                                                    <h3 className="font-semibold text-green-800 mb-1">
                                                        Farm Pickup Instructions
                                                    </h3>
                                                    <ul className="text-green-700 text-sm space-y-1">
                                                        <li>
                                                            • You will receive
                                                            specific farm
                                                            location details
                                                            after order
                                                            confirmation
                                                        </li>
                                                        <li>
                                                            • Pickup hours: 7:00
                                                            AM - 5:00 PM (Monday
                                                            to Saturday)
                                                        </li>
                                                        <li>
                                                            • Please bring a
                                                            valid ID and your
                                                            order confirmation
                                                        </li>
                                                        <li>
                                                            • Contact the farmer
                                                            directly for any
                                                            pickup arrangements
                                                        </li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Payment Method */}
                            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                                <div className="p-6 border-b border-gray-200">
                                    <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                        <Icon
                                            icon="mingcute:wallet-3-line"
                                            width="20"
                                            height="20"
                                            className="text-primary"
                                        />
                                        Payment Method
                                    </h2>
                                </div>
                                <div className="p-6 space-y-3">
                                    <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            value="cod"
                                            checked={
                                                formData.paymentMethod === "cod"
                                            }
                                            onChange={handleInputChange}
                                            className="mr-3 text-primary focus:ring-primary"
                                        />
                                        <div className="flex items-center gap-3">
                                            <Icon
                                                icon="mingcute:cash-line"
                                                width="24"
                                                height="24"
                                                className="text-green-600"
                                            />
                                            <div>
                                                <span className="font-medium text-gray-800">
                                                    Cash on{" "}
                                                    {formData.deliveryMethod ===
                                                    "delivery"
                                                        ? "Delivery"
                                                        : "Pickup"}
                                                </span>
                                                <p className="text-sm text-gray-600">
                                                    Pay when your order{" "}
                                                    {formData.deliveryMethod ===
                                                    "delivery"
                                                        ? "arrives"
                                                        : "is picked up"}
                                                </p>
                                            </div>
                                        </div>
                                    </label>

                                    <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors opacity-50">
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            value="online"
                                            disabled
                                            className="mr-3 text-primary focus:ring-primary"
                                        />
                                        <div className="flex items-center gap-3">
                                            <Icon
                                                icon="mingcute:credit-card-line"
                                                width="24"
                                                height="24"
                                                className="text-blue-600"
                                            />
                                            <div>
                                                <span className="font-medium text-gray-800">
                                                    Online Payment
                                                </span>
                                                <p className="text-sm text-gray-600">
                                                    Coming soon
                                                </p>
                                            </div>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            {/* Order Notes */}
                            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                                <div className="p-6 border-b border-gray-200">
                                    <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                        <Icon
                                            icon="mingcute:edit-line"
                                            width="20"
                                            height="20"
                                            className="text-primary"
                                        />
                                        Order Notes (Optional)
                                    </h2>
                                </div>
                                <div className="p-6">
                                    <textarea
                                        name="notes"
                                        value={formData.notes}
                                        onChange={handleInputChange}
                                        rows="3"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                        placeholder={`Any special instructions for your ${
                                            formData.deliveryMethod ===
                                            "delivery"
                                                ? "delivery"
                                                : "pickup"
                                        }...`}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Order Summary */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-lg shadow-md overflow-hidden sticky top-20">
                                <div className="p-6 border-b border-gray-200">
                                    <h2 className="text-lg font-semibold text-gray-800">
                                        Order Summary
                                    </h2>
                                </div>
                                <div className="p-6">
                                    {/* Items */}
                                    <div className="space-y-3 mb-4">
                                        {cartItems.map((item) => (
                                            <div
                                                key={item.id}
                                                className="flex items-center gap-3"
                                            >
                                                <img
                                                    src={item.image}
                                                    alt={item.name}
                                                    className="w-12 h-12 object-cover rounded-lg"
                                                />
                                                <div className="flex-1">
                                                    <h4 className="font-medium text-gray-800 text-sm line-clamp-1">
                                                        {item.name}
                                                    </h4>
                                                    <p className="text-xs text-gray-500">
                                                        ₱{item.price.toFixed(2)}
                                                        /kg × {item.quantity} kg
                                                    </p>
                                                </div>
                                                <p className="text-sm font-medium text-gray-800">
                                                    ₱
                                                    {(
                                                        item.price *
                                                        item.quantity
                                                    ).toFixed(2)}
                                                </p>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Pricing */}
                                    <div className="space-y-2 border-t border-gray-200 pt-4">
                                        <div className="flex justify-between text-gray-600">
                                            <span>Subtotal</span>
                                            <span>
                                                ₱{totalAmount.toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-gray-600">
                                            <span>
                                                {formData.deliveryMethod ===
                                                "delivery"
                                                    ? "Delivery Fee"
                                                    : "Pickup Fee"}
                                            </span>
                                            <span>
                                                {formData.deliveryMethod ===
                                                "delivery"
                                                    ? "₱50.00"
                                                    : "Free"}
                                            </span>
                                        </div>
                                        <div className="flex justify-between font-bold text-lg text-gray-800 border-t border-gray-200 pt-2">
                                            <span>Total</span>
                                            <span>
                                                ₱{finalTotal.toFixed(2)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Place Order Button */}
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary-dark transition-colors mt-6 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {loading ? (
                                            <>
                                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                                Placing Order...
                                            </>
                                        ) : (
                                            <>
                                                <Icon
                                                    icon="mingcute:check-circle-line"
                                                    width="20"
                                                    height="20"
                                                />
                                                Place Order
                                            </>
                                        )}
                                    </button>

                                    <p className="text-center text-gray-500 text-xs mt-3">
                                        By placing this order, you agree to our
                                        Terms & Conditions
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </div>

            <NavigationBar />
        </div>
    );
}

export default Checkout;
