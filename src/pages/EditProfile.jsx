import { Icon } from "@iconify/react/dist/iconify.js";
import { useState, useEffect, useContext, useCallback } from "react";
import supabase from "../SupabaseClient.jsx";
import { AuthContext } from "../App.jsx";
import { Link } from "react-router-dom";
import { ilignanBarangays } from "../data/barangays.js";
import ImageUpload from "../components/ImageUpload.jsx";

function EditProfile() {
    const { user } = useContext(AuthContext);
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        address: "",
        contact: "",
        avatar_url: "",
    });
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMessage, setModalMessage] = useState("");
    const [showAvatarUpload, setShowAvatarUpload] = useState(false);

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
                .select("name, address, contact, avatar_url")
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
                    avatar_url: data.avatar_url || "",
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
                        avatar_url: "",
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

    const handleAvatarChange = async (newAvatarUrl) => {
        try {
            const { error } = await supabase
                .from("profiles")
                .update({ avatar_url: newAvatarUrl })
                .eq("id", user.id);

            if (error) throw error;

            setFormData((prev) => ({ ...prev, avatar_url: newAvatarUrl }));
            setShowAvatarUpload(false);
            setModalMessage("Profile picture updated successfully!");
            setModalOpen(true);
        } catch (error) {
            console.error("Error updating avatar:", error);
            setModalMessage(
                "Failed to update profile picture. Please try again."
            );
            setModalOpen(true);
        }
    };

    return (
        <div className="min-h-screen w-full flex flex-col relative items-center scrollbar-hide bg-background overflow-x-hidden text-text">
            {/* Modal */}
            {modalOpen && (
                <>
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black opacity-50"></div>
                    <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full text-center fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[10000]">
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
            <div className="flex-1 w-full px-4 mt-16 pb-8">
                <div className="max-w-2xl mx-auto">
                    {/* Profile Header Card */}
                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
                        <div className="relative bg-gradient-to-br from-primary via-primary-dark to-purple-600 p-8 text-white">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
                            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>

                            <div className="relative z-10 text-center">
                                <div className="w-24 h-24 mx-auto mb-4 relative">
                                    <img
                                        src={
                                            formData.avatar_url ||
                                            "/assets/blank-profile.jpg"
                                        }
                                        alt="profile"
                                        className="w-full h-full object-cover rounded-full border-4 border-white shadow-xl"
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowAvatarUpload(
                                                !showAvatarUpload
                                            )
                                        }
                                        className="absolute bottom-0 right-0 bg-white text-primary p-2.5 rounded-full shadow-lg hover:bg-gray-50 transition-colors"
                                    >
                                        <Icon
                                            icon="mingcute:camera-line"
                                            width="18"
                                            height="18"
                                        />
                                    </button>
                                </div>
                                <h2 className="text-2xl font-bold mb-2">
                                    {formData.name || "Complete Your Profile"}
                                </h2>
                                <p className="text-white/90 text-sm">
                                    Keep your information up to date for the
                                    best experience
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Avatar Upload Section */}
                    {showAvatarUpload && (
                        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
                            <div className="p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                        <Icon
                                            icon="mingcute:camera-line"
                                            width="20"
                                            height="20"
                                            className="text-primary"
                                        />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-800">
                                            Update Profile Picture
                                        </h3>
                                        <p className="text-gray-600 text-sm">
                                            Choose a new profile picture
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-gray-50 rounded-xl p-4">
                                    <ImageUpload
                                        currentImage={formData.avatar_url}
                                        onImageChange={handleAvatarChange}
                                        userId={user?.id}
                                        bucket="avatars"
                                        type="avatar"
                                    />
                                </div>

                                <div className="flex gap-3 mt-4">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowAvatarUpload(false)
                                        }
                                        className="flex-1 bg-gray-100 text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Form Card */}
                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                        <form onSubmit={handleSubmit}>
                            {/* Form Header */}
                            <div className="border-b border-gray-100 p-6">
                                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                    <Icon
                                        icon="mingcute:edit-3-line"
                                        width="20"
                                        height="20"
                                        className="text-primary"
                                    />
                                    Personal Information
                                </h3>
                                <p className="text-gray-600 text-sm mt-1">
                                    Update your personal details below
                                </p>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Full Name */}
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                        <Icon
                                            icon="mingcute:user-3-line"
                                            width="16"
                                            height="16"
                                            className="text-primary"
                                        />
                                        Full Name
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Enter your full name"
                                            className={`w-full px-4 py-3.5 border rounded-xl text-base outline-none transition-all duration-200 ${
                                                nameError
                                                    ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-4 focus:ring-red-100"
                                                    : "border-gray-200 bg-gray-50 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10"
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
                                        <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                                            <Icon
                                                icon="mingcute:user-3-line"
                                                width="18"
                                                height="18"
                                                className="text-gray-400"
                                            />
                                        </div>
                                    </div>
                                    {nameError && (
                                        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                                            <Icon
                                                icon="mingcute:alert-circle-fill"
                                                width="16"
                                                height="16"
                                            />
                                            {nameError}
                                        </div>
                                    )}
                                </div>

                                {/* Address */}
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                        <Icon
                                            icon="mingcute:location-line"
                                            width="16"
                                            height="16"
                                            className="text-primary"
                                        />
                                        Address
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Search for your barangay in Iligan City..."
                                            className={`w-full px-4 py-3.5 pr-12 border rounded-xl text-base outline-none transition-all duration-200 ${
                                                addressError
                                                    ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-4 focus:ring-red-100"
                                                    : "border-gray-200 bg-gray-50 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10"
                                            }`}
                                            value={addressInput}
                                            onChange={(e) =>
                                                handleAddressChange(
                                                    e.target.value
                                                )
                                            }
                                            onFocus={() => {
                                                if (
                                                    filteredBarangays.length > 0
                                                ) {
                                                    setShowSuggestions(true);
                                                }
                                            }}
                                            onBlur={() => {
                                                setTimeout(
                                                    () =>
                                                        setShowSuggestions(
                                                            false
                                                        ),
                                                    200
                                                );
                                            }}
                                            disabled={loading}
                                        />
                                        <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                                            <Icon
                                                icon="mingcute:search-line"
                                                width="18"
                                                height="18"
                                                className="text-gray-400"
                                            />
                                        </div>

                                        {/* Autocomplete Suggestions */}
                                        {showSuggestions &&
                                            filteredBarangays.length > 0 && (
                                                <div className="absolute z-20 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                                                    {filteredBarangays
                                                        .slice(0, 8)
                                                        .map(
                                                            (
                                                                barangay,
                                                                index
                                                            ) => (
                                                                <div
                                                                    key={index}
                                                                    className="px-4 py-3 hover:bg-primary/5 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                                                                    onClick={() =>
                                                                        handleSuggestionClick(
                                                                            barangay
                                                                        )
                                                                    }
                                                                >
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                                                                            <Icon
                                                                                icon="mingcute:location-line"
                                                                                width="16"
                                                                                height="16"
                                                                                className="text-primary"
                                                                            />
                                                                        </div>
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
                                                            )
                                                        )}
                                                </div>
                                            )}
                                    </div>
                                    {addressError ? (
                                        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                                            <Icon
                                                icon="mingcute:alert-circle-fill"
                                                width="16"
                                                height="16"
                                            />
                                            {addressError}
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 text-gray-500 text-sm bg-blue-50 p-3 rounded-lg">
                                            <Icon
                                                icon="mingcute:information-line"
                                                width="16"
                                                height="16"
                                                className="text-blue-500"
                                            />
                                            Start typing to search for barangays
                                            in Iligan City
                                        </div>
                                    )}
                                </div>

                                {/* Contact Number */}
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                        <Icon
                                            icon="mingcute:phone-line"
                                            width="16"
                                            height="16"
                                            className="text-primary"
                                        />
                                        Contact Number
                                    </label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                                            <div className="flex items-center gap-1 text-gray-600 font-semibold bg-gray-100 px-3 py-1.5 rounded-lg text-sm">
                                                <Icon
                                                    icon="emojione:flag-for-philippines"
                                                    width="16"
                                                    height="16"
                                                />
                                                +63
                                            </div>
                                        </div>
                                        <input
                                            type="tel"
                                            placeholder="912 345 6789"
                                            className="w-full pl-24 pr-4 py-3.5 border border-gray-200 bg-gray-50 rounded-xl text-base outline-none focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-200"
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
                                            maxLength={13}
                                        />
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-500 text-sm bg-gray-50 p-3 rounded-lg">
                                        <Icon
                                            icon="mingcute:information-line"
                                            width="16"
                                            height="16"
                                            className="text-gray-400"
                                        />
                                        Enter your 10-digit mobile number
                                        (without +63)
                                    </div>
                                </div>
                            </div>

                            {/* Security Section */}
                            <div className="border-t border-gray-100">
                                <div className="p-6">
                                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
                                        <Icon
                                            icon="mingcute:shield-line"
                                            width="20"
                                            height="20"
                                            className="text-primary"
                                        />
                                        Security Settings
                                    </h3>

                                    <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-xl p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-start gap-3">
                                                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mt-1">
                                                    <Icon
                                                        icon="mingcute:lock-line"
                                                        width="18"
                                                        height="18"
                                                        className="text-red-600"
                                                    />
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-gray-800 mb-1">
                                                        Password Reset
                                                    </h4>
                                                    <p className="text-gray-600 text-sm">
                                                        Send a password reset
                                                        link to your email
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handlePasswordReset}
                                                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                                            >
                                                <Icon
                                                    icon="mingcute:mail-send-line"
                                                    width="16"
                                                    height="16"
                                                />
                                                Reset Password
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="border-t border-gray-100 p-6">
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <Link
                                        to="/profile"
                                        className="flex-1 text-center bg-gray-100 text-gray-700 px-6 py-3.5 rounded-xl hover:bg-gray-200 transition-colors font-medium flex items-center justify-center gap-2"
                                    >
                                        <Icon
                                            icon="mingcute:close-line"
                                            width="18"
                                            height="18"
                                        />
                                        Cancel
                                    </Link>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className={`flex-1 px-6 py-3.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 ${
                                            loading
                                                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                                : "bg-primary text-white hover:bg-primary-dark"
                                        }`}
                                    >
                                        {loading ? (
                                            <>
                                                <Icon
                                                    icon="mingcute:loading-line"
                                                    width="18"
                                                    height="18"
                                                    className="animate-spin"
                                                />
                                                Saving Changes...
                                            </>
                                        ) : (
                                            <>
                                                <Icon
                                                    icon="mingcute:check-line"
                                                    width="18"
                                                    height="18"
                                                />
                                                Save Changes
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default EditProfile;
