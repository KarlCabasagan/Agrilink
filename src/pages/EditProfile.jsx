import { Icon } from "@iconify/react/dist/iconify.js";
import { useState, useEffect, useContext, useCallback } from "react";
import supabase from "../SupabaseClient.jsx";
import { AuthContext } from "../App.jsx";
import { Link } from "react-router-dom";
import { ilignanBarangays } from "../data/barangays.js";

function EditProfile() {
    const { user } = useContext(AuthContext);
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        address: "",
        contact: "",
    });
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMessage, setModalMessage] = useState("");

    // Autocomplete state for address
    const [addressInput, setAddressInput] = useState("");
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [filteredBarangays, setFilteredBarangays] = useState([]);

    // Validation error states
    const [nameError, setNameError] = useState("");
    const [addressError, setAddressError] = useState("");

    const fetchProfile = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("profiles")
                .select("name, address, contact")
                .eq("id", user.id)
                .single();

            if (data) {
                // Extract just the digits from the formatted contact number
                const contactDigits = data.contact
                    ? data.contact.replace(/\D/g, "").slice(2)
                    : ""; // Remove +63
                setFormData({
                    name: data.name || "",
                    address: data.address || "",
                    contact: contactDigits,
                });
                setAddressInput(data.address || "");
            } else if (error && error.code === "PGRST116") {
                // No profile found, create one
                const { error: insertError } = await supabase
                    .from("profiles")
                    .insert({
                        id: user.id,
                        email: user.email,
                        name: "",
                        address: "",
                        contact: "",
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    });

                if (!insertError) {
                    setFormData({
                        name: "",
                        address: "",
                        contact: "",
                    });
                    setAddressInput("");
                }
            } else if (error) {
                console.error("Error fetching profile:", error);
            }
        } catch (error) {
            console.error("Unexpected error:", error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    const handleInputChange = useCallback((field, value) => {
        if (field === "contact") {
            // Remove all non-digits
            const cleanValue = value.replace(/\D/g, "");
            // Limit to 10 digits (excluding +63)
            const limitedValue = cleanValue.slice(0, 10);
            setFormData((prev) => ({
                ...prev,
                [field]: limitedValue,
            }));
        } else {
            setFormData((prev) => ({
                ...prev,
                [field]: value,
            }));

            // Clear errors when user starts typing
            if (field === "name") {
                setNameError("");
            }
        }
    }, []);

    // Handle address input change with autocomplete
    const handleAddressChange = useCallback((value) => {
        setAddressInput(value);
        setFormData((prev) => ({
            ...prev,
            address: value,
        }));

        // Clear address error when user starts typing
        setAddressError("");

        if (value.trim()) {
            const filtered = ilignanBarangays.filter((barangay) =>
                barangay.toLowerCase().includes(value.toLowerCase())
            );
            setFilteredBarangays(filtered);
            setShowSuggestions(filtered.length > 0);
        } else {
            setFilteredBarangays([]);
            setShowSuggestions(false);
        }
    }, []);

    // Handle suggestion selection
    const handleSuggestionClick = useCallback((barangay) => {
        const fullAddress = `${barangay}, Iligan City, Lanao del Norte`;
        setAddressInput(fullAddress);
        setFormData((prev) => ({
            ...prev,
            address: fullAddress,
        }));
        setShowSuggestions(false);
        setFilteredBarangays([]);
    }, []);

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

    // Validation function
    const validateForm = () => {
        const errors = [];

        // Reset error states
        setNameError("");
        setAddressError("");

        // Check if name is empty
        if (!formData.name.trim()) {
            setNameError("Full name is required");
            errors.push("Full name is required");
        }

        // Check if address is valid (must be from a valid barangay)
        if (formData.address.trim()) {
            const isValidAddress = ilignanBarangays.some((barangay) =>
                formData.address.toLowerCase().includes(barangay.toLowerCase())
            );
            if (!isValidAddress) {
                setAddressError(
                    "Please select a valid barangay from the dropdown options"
                );
                errors.push(
                    "Please select a valid barangay from the dropdown options"
                );
            }
        }

        return errors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) {
            setModalMessage("User not found.");
            setModalOpen(true);
            return;
        }

        // Validate form before submitting
        const validationErrors = validateForm();
        if (validationErrors.length > 0) {
            setModalMessage(validationErrors.join(". ") + ".");
            setModalOpen(true);
            return;
        }

        setLoading(true);
        try {
            // Format the contact number before saving
            const formattedContact = formData.contact
                ? formatPhoneNumber(formData.contact)
                : "";

            // Only update the profiles table - this is the single source of truth
            const { error: profileError } = await supabase
                .from("profiles")
                .upsert(
                    {
                        id: user.id,
                        name: formData.name,
                        address: formData.address,
                        contact: formattedContact,
                        email: user.email,
                        updated_at: new Date().toISOString(),
                    },
                    {
                        onConflict: "id",
                    }
                );

            if (profileError) {
                setModalMessage(
                    `Failed to update profile: ${profileError.message}`
                );
            } else {
                setModalMessage("Profile updated successfully!");
                // Update local state to reflect changes immediately
                setFormData({
                    name: formData.name,
                    address: formData.address,
                    contact: formData.contact,
                });
            }
        } catch (error) {
            setModalMessage(`An unexpected error occurred: ${error.message}`);
        } finally {
            setLoading(false);
            setModalOpen(true);
        }
    };

    const handlePasswordReset = async () => {
        if (!user?.email) {
            setModalMessage("User email not found.");
            setModalOpen(true);
            return;
        }

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(
                user.email,
                {
                    redirectTo: `${window.location.origin}/reset-password`,
                }
            );

            if (error) {
                setModalMessage(
                    `Failed to send password reset email: ${error.message}`
                );
            } else {
                setModalMessage(
                    "Password reset email sent! Please check your inbox."
                );
            }
        } catch (error) {
            setModalMessage(`An unexpected error occurred: ${error.message}`);
        }
        setModalOpen(true);
    };

    const handleProfilePictureChange = useCallback((e) => {
        const file = e.target.files?.[0];
        if (file) {
            // For now, just show a message since we don't have storage setup
            setModalMessage("Profile picture upload feature coming soon!");
            setModalOpen(true);
        }
    }, []);

    return (
        <div className="min-h-screen w-full flex flex-col relative items-center scrollbar-hide bg-background overflow-x-hidden text-text">
            {/* Modal */}
            {modalOpen && (
                <>
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black opacity-50"></div>
                    <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full text-center fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
                        <div className="mb-4">
                            <Icon
                                icon={
                                    modalMessage.includes("successfully")
                                        ? "mingcute:check-circle-fill"
                                        : "mingcute:alert-circle-fill"
                                }
                                width="48"
                                height="48"
                                className={`mx-auto mb-3 ${
                                    modalMessage.includes("successfully")
                                        ? "text-green-500"
                                        : "text-red-500"
                                }`}
                            />
                            <p className="text-gray-700">{modalMessage}</p>
                        </div>
                        <button
                            className="w-full mt-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                            onClick={() => setModalOpen(false)}
                        >
                            OK
                        </button>
                    </div>
                </>
            )}

            {/* Header */}
            <div className="fixed top-0 left-0 w-full bg-white shadow-md z-50 px-4 py-3 flex justify-between items-center">
                <Link
                    to="/profile"
                    className="text-gray-600 hover:text-primary"
                >
                    <Icon icon="mingcute:left-line" width="24" height="24" />
                </Link>
                <h1 className="text-lg font-semibold">Edit Profile</h1>
                <div className="w-6"></div> {/* Spacer for center alignment */}
            </div>

            {/* Content */}
            <div className="flex-1 flex items-center justify-center px-4 mt-16 w-full">
                <div className="w-full max-w-md bg-white rounded-lg shadow-md overflow-hidden">
                    {/* Profile Header */}
                    <div className="relative bg-gradient-to-br from-primary to-primary-dark p-6 text-white">
                        <div className="text-center">
                            <div className="w-24 h-24 mx-auto mb-4 relative">
                                <img
                                    src="/assets/adel.jpg"
                                    alt="profile"
                                    className="w-full h-full object-cover rounded-full border-4 border-white shadow-lg"
                                />
                                <label
                                    htmlFor="profilePicture"
                                    className="absolute bottom-0 right-0 bg-white text-primary p-2 rounded-full shadow-lg cursor-pointer hover:bg-gray-50 transition-colors"
                                >
                                    <Icon
                                        icon="mingcute:camera-line"
                                        width="16"
                                        height="16"
                                    />
                                </label>
                                <input
                                    type="file"
                                    id="profilePicture"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleProfilePictureChange}
                                />
                            </div>
                            <h2 className="text-xl font-bold">
                                Update Your Profile
                            </h2>
                            <p className="text-primary-light text-sm">
                                Keep your information up to date
                            </p>
                        </div>
                    </div>

                    {/* Form */}
                    <form className="p-6" onSubmit={handleSubmit}>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    placeholder="Enter your full name"
                                    className={`w-full px-3 py-3 border rounded-lg text-base outline-none focus:outline-none focus:ring-2 transition-all ${
                                        nameError
                                            ? "border-red-500 focus:ring-red-200 focus:border-red-500"
                                            : "border-gray-300 focus:ring-primary focus:border-transparent"
                                    }`}
                                    value={formData.name}
                                    onChange={(e) =>
                                        handleInputChange(
                                            "name",
                                            e.target.value
                                        )
                                    }
                                    disabled={loading}
                                />
                                {nameError && (
                                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                        <Icon
                                            icon="mingcute:alert-circle-fill"
                                            width="12"
                                            height="12"
                                        />
                                        {nameError}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Address
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Search for your barangay in Iligan City..."
                                        className={`w-full px-3 py-3 border rounded-lg text-base outline-none focus:outline-none focus:ring-2 transition-all ${
                                            addressError
                                                ? "border-red-500 focus:ring-red-200 focus:border-red-500"
                                                : "border-gray-300 focus:ring-primary focus:border-transparent"
                                        }`}
                                        value={addressInput}
                                        onChange={(e) =>
                                            handleAddressChange(e.target.value)
                                        }
                                        onFocus={() => {
                                            if (filteredBarangays.length > 0) {
                                                setShowSuggestions(true);
                                            }
                                        }}
                                        onBlur={() => {
                                            // Delay hiding suggestions to allow clicking
                                            setTimeout(
                                                () => setShowSuggestions(false),
                                                200
                                            );
                                        }}
                                        disabled={loading}
                                    />

                                    {/* Autocomplete Suggestions */}
                                    {showSuggestions &&
                                        filteredBarangays.length > 0 && (
                                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                                {filteredBarangays
                                                    .slice(0, 8)
                                                    .map((barangay, index) => (
                                                        <div
                                                            key={index}
                                                            className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                                                            onClick={() =>
                                                                handleSuggestionClick(
                                                                    barangay
                                                                )
                                                            }
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <Icon
                                                                    icon="mingcute:location-line"
                                                                    width="16"
                                                                    height="16"
                                                                    className="text-primary"
                                                                />
                                                                <div>
                                                                    <div className="font-medium text-gray-800">
                                                                        {
                                                                            barangay
                                                                        }
                                                                    </div>
                                                                    <div className="text-sm text-gray-500">
                                                                        Iligan
                                                                        City,
                                                                        Lanao
                                                                        del
                                                                        Norte
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                            </div>
                                        )}
                                </div>
                                {addressError ? (
                                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                        <Icon
                                            icon="mingcute:alert-circle-fill"
                                            width="12"
                                            height="12"
                                        />
                                        {addressError}
                                    </p>
                                ) : (
                                    <p className="text-xs text-gray-500 mt-1">
                                        Start typing to search for barangays in
                                        Iligan City
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Contact Number
                                </label>
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 font-medium bg-gray-100 px-2 py-1 rounded text-sm">
                                        +63
                                    </div>
                                    <input
                                        type="tel"
                                        placeholder="912 345 6789"
                                        className="w-full pl-16 pr-3 py-3 border border-gray-300 rounded-lg text-base outline-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                        value={displayPhoneNumber(
                                            formData.contact
                                        )}
                                        onChange={(e) =>
                                            handleInputChange(
                                                "contact",
                                                e.target.value
                                            )
                                        }
                                        disabled={loading}
                                        maxLength={13} // "912 345 6789"
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    Enter your 10-digit mobile number (without
                                    +63)
                                </p>
                            </div>
                        </div>

                        {/* Password Reset */}
                        <div className="mt-6 pt-6 border-t border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="font-medium text-gray-800">
                                        Password
                                    </h3>
                                    <p className="text-gray-500 text-xs">
                                        Change your account password
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={handlePasswordReset}
                                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                                >
                                    Reset Password
                                </button>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3 mt-6">
                            <Link
                                to="/profile"
                                className="flex-1 text-center bg-gray-100 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={loading}
                                className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
                                    loading
                                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                        : "bg-primary text-white hover:bg-primary-dark"
                                }`}
                            >
                                {loading ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <Icon
                                            icon="mingcute:loading-line"
                                            width="16"
                                            height="16"
                                            className="animate-spin"
                                        />
                                        Saving...
                                    </div>
                                ) : (
                                    "Save Changes"
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default EditProfile;
