import { useState } from "react";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";
import NavigationBar from "../../components/NavigationBar";

function SellerApplication() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        contact: "",
        address: "",
        farmSize: "",
        experience: "",
        crops: [],
        businessPermit: "",
    });

    const [errors, setErrors] = useState({});

    const cropOptions = [
        "Rice",
        "Corn",
        "Tomatoes",
        "Carrots",
        "Lettuce",
        "Cabbage",
        "Eggplant",
        "Onions",
        "Garlic",
        "Potatoes",
        "Sweet Potato",
        "Banana",
        "Mango",
        "Papaya",
        "Citrus",
        "Other Vegetables",
        "Other Fruits",
        "Herbs and Spices",
    ];

    const handleInputChange = (e) => {
        const { name, value } = e.target;

        if (name === "contact") {
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

    const handleCropToggle = (crop) => {
        setFormData((prev) => ({
            ...prev,
            crops: prev.crops.includes(crop)
                ? prev.crops.filter((c) => c !== crop)
                : [...prev.crops, crop],
        }));
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.name.trim()) newErrors.name = "Name is required";
        if (!formData.email.trim()) newErrors.email = "Email is required";
        if (!formData.contact.trim())
            newErrors.contact = "Contact number is required";
        if (!formData.address.trim()) newErrors.address = "Address is required";
        if (!formData.farmSize.trim())
            newErrors.farmSize = "Farm size is required";
        if (!formData.experience.trim())
            newErrors.experience = "Experience is required";
        if (formData.crops.length === 0)
            newErrors.crops = "Please select at least one crop";
        if (!formData.businessPermit)
            newErrors.businessPermit =
                "Please specify if you have a business permit";

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (formData.email && !emailRegex.test(formData.email)) {
            newErrors.email = "Please enter a valid email address";
        }

        // Contact validation
        const contactRegex = /^(\+63|0)[0-9]{10}$/;
        if (formData.contact && !contactRegex.test(formData.contact)) {
            newErrors.contact =
                "Please enter a valid Philippine contact number";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            // Format contact number before submission
            const formattedContact = formatPhoneNumber(formData.contactNumber);
            const submissionData = {
                ...formData,
                contactNumber: formattedContact,
            };

            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 2000));

            setShowSuccess(true);
            setTimeout(() => {
                navigate("/profile");
            }, 3000);
        } catch (error) {
            console.error("Error submitting application:", error);
        } finally {
            setLoading(false);
        }
    };

    if (showSuccess) {
        return (
            <div className="min-h-screen w-full flex flex-col relative items-center scrollbar-hide bg-background overflow-x-hidden text-text pb-20">
                <div className="fixed top-0 left-0 w-full bg-white shadow-md z-50 px-4 py-3">
                    <h1 className="text-lg font-semibold text-primary text-center">
                        Application Submitted
                    </h1>
                </div>

                <div className="w-full max-w-2xl mx-4 sm:mx-auto my-16 flex items-center justify-center min-h-[60vh]">
                    <div className="bg-white rounded-lg shadow-md p-8 text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Icon
                                icon="mingcute:check-circle-fill"
                                width="32"
                                height="32"
                                className="text-green-600"
                            />
                        </div>
                        <h2 className="text-xl font-bold text-gray-800 mb-2">
                            Application Submitted Successfully!
                        </h2>
                        <p className="text-gray-600 mb-4">
                            Your seller application has been submitted for
                            review. You will receive an email notification once
                            your application has been processed.
                        </p>
                        <p className="text-sm text-gray-500">
                            Redirecting you back to profile...
                        </p>
                    </div>
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
                        onClick={() => navigate(-1)}
                        className="text-primary hover:text-primary-dark mr-3"
                    >
                        <Icon
                            icon="mingcute:left-line"
                            width="24"
                            height="24"
                        />
                    </button>
                    <h1 className="text-lg font-semibold text-primary">
                        Apply to be a Seller
                    </h1>
                </div>
            </div>

            <div className="w-full max-w-2xl mx-4 sm:mx-auto my-16">
                {/* Info Banner */}
                <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                    <div className="flex items-start gap-3">
                        <Icon
                            icon="mingcute:information-line"
                            width="24"
                            height="24"
                            className="text-blue-600 mt-0.5"
                        />
                        <div>
                            <h3 className="font-semibold text-blue-800 mb-1">
                                Seller Application Requirements
                            </h3>
                            <p className="text-blue-700 text-sm">
                                Please fill out all required information
                                accurately. Your application will be reviewed by
                                our admin team within 2-3 business days.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Application Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Personal Information */}
                    <div className="bg-white rounded-lg shadow-md overflow-hidden">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-800">
                                Personal Information
                            </h2>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Full Name *
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                                        errors.name
                                            ? "border-red-300"
                                            : "border-gray-300"
                                    }`}
                                    placeholder="Enter your full name"
                                />
                                {errors.name && (
                                    <p className="text-red-600 text-sm mt-1">
                                        {errors.name}
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
                                    onChange={handleInputChange}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                                        errors.email
                                            ? "border-red-300"
                                            : "border-gray-300"
                                    }`}
                                    placeholder="Enter your email address"
                                />
                                {errors.email && (
                                    <p className="text-red-600 text-sm mt-1">
                                        {errors.email}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Contact Number *
                                </label>
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 font-medium bg-gray-100 px-2 py-1 rounded text-sm">
                                        +63
                                    </div>
                                    <input
                                        type="tel"
                                        name="contact"
                                        value={displayPhoneNumber(
                                            formData.contact
                                        )}
                                        onChange={handleInputChange}
                                        className={`w-full pl-16 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                                            errors.contact
                                                ? "border-red-300"
                                                : "border-gray-300"
                                        }`}
                                        placeholder="912 345 6789"
                                        maxLength={13} // "912 345 6789"
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    Enter your 10-digit mobile number (without
                                    +63)
                                </p>
                                {errors.contact && (
                                    <p className="text-red-600 text-sm mt-1">
                                        {errors.contact}
                                    </p>
                                )}
                            </div>

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
                                    placeholder="Enter your complete address including barangay, city/municipality, and province"
                                />
                                {errors.address && (
                                    <p className="text-red-600 text-sm mt-1">
                                        {errors.address}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Farm Information */}
                    <div className="bg-white rounded-lg shadow-md overflow-hidden">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-800">
                                Farm Information
                            </h2>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Farm Size *
                                </label>
                                <input
                                    type="text"
                                    name="farmSize"
                                    value={formData.farmSize}
                                    onChange={handleInputChange}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                                        errors.farmSize
                                            ? "border-red-300"
                                            : "border-gray-300"
                                    }`}
                                    placeholder="e.g., 2 hectares, 1000 square meters"
                                />
                                {errors.farmSize && (
                                    <p className="text-red-600 text-sm mt-1">
                                        {errors.farmSize}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Farming Experience *
                                </label>
                                <input
                                    type="text"
                                    name="experience"
                                    value={formData.experience}
                                    onChange={handleInputChange}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                                        errors.experience
                                            ? "border-red-300"
                                            : "border-gray-300"
                                    }`}
                                    placeholder="e.g., 5 years, 10 years"
                                />
                                {errors.experience && (
                                    <p className="text-red-600 text-sm mt-1">
                                        {errors.experience}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Crops You Grow *
                                </label>
                                <p className="text-sm text-gray-600 mb-3">
                                    Select all crops that you currently grow or
                                    plan to grow:
                                </p>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {cropOptions.map((crop) => (
                                        <label
                                            key={crop}
                                            className="flex items-center p-2 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={formData.crops.includes(
                                                    crop
                                                )}
                                                onChange={() =>
                                                    handleCropToggle(crop)
                                                }
                                                className="mr-2 text-primary focus:ring-primary"
                                            />
                                            <span className="text-sm">
                                                {crop}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                                {errors.crops && (
                                    <p className="text-red-600 text-sm mt-1">
                                        {errors.crops}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Business Permit *
                                </label>
                                <div className="space-y-2">
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="businessPermit"
                                            value="Yes"
                                            checked={
                                                formData.businessPermit ===
                                                "Yes"
                                            }
                                            onChange={handleInputChange}
                                            className="mr-2 text-primary focus:ring-primary"
                                        />
                                        <span className="text-sm">
                                            Yes, I have a valid business permit
                                        </span>
                                    </label>
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="businessPermit"
                                            value="No"
                                            checked={
                                                formData.businessPermit === "No"
                                            }
                                            onChange={handleInputChange}
                                            className="mr-2 text-primary focus:ring-primary"
                                        />
                                        <span className="text-sm">
                                            No, but I plan to obtain one
                                        </span>
                                    </label>
                                </div>
                                {errors.businessPermit && (
                                    <p className="text-red-600 text-sm mt-1">
                                        {errors.businessPermit}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary text-white py-3 px-6 rounded-lg hover:bg-primary-dark transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    Submitting Application...
                                </>
                            ) : (
                                <>
                                    <Icon
                                        icon="mingcute:paper-line"
                                        width="20"
                                        height="20"
                                    />
                                    Submit Application
                                </>
                            )}
                        </button>
                        <p className="text-sm text-gray-600 text-center mt-3">
                            By submitting this application, you agree to our
                            terms and conditions for sellers on the Agrilink
                            platform.
                        </p>
                    </div>
                </form>
            </div>

            <NavigationBar />
        </div>
    );
}

export default SellerApplication;
