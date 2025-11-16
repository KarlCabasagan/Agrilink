import { Icon } from "@iconify/react/dist/iconify.js";
import { useState, useEffect, useContext, useCallback } from "react";
import supabase from "../SupabaseClient.jsx";
import { AuthContext } from "../App.jsx";
import { Link, useNavigate } from "react-router-dom";
import { ilignanBarangays } from "../data/barangays.js";
import {
    uploadImage,
    compressImage,
    validateImageFile,
} from "../utils/imageUpload.js";
import { getProfileAvatarUrl } from "../utils/avatarUtils.js";

function EditProfile() {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
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

    // Password change state
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordChangeLoading, setPasswordChangeLoading] = useState(false);
    const [passwordChangeError, setPasswordChangeError] = useState("");

    // Avatar preview state
    const [avatarPreview, setAvatarPreview] = useState("");
    const [selectedAvatarFile, setSelectedAvatarFile] = useState(null);
    const [avatarChanged, setAvatarChanged] = useState(false);

    // Autocomplete state for address
    const [addressInput, setAddressInput] = useState("");
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [filteredBarangays, setFilteredBarangays] = useState([]);

    // Validation error states
    const [nameError, setNameError] = useState("");
    const [addressError, setAddressError] = useState("");
    const [contactError, setContactError] = useState("");

    // Initial profile data for change detection
    const [initialProfileData, setInitialProfileData] = useState({
        name: "",
        address: "",
        contact: "",
        avatar_url: "",
    });

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
                const profileData = {
                    name: data.name || "",
                    address: data.address || "",
                    contact: contactDigits,
                    avatar_url: data.avatar_url || "",
                };
                setFormData(profileData);
                // Store initial profile data for change detection
                setInitialProfileData(profileData);
                // Set avatar preview to show current avatar or blank profile
                setAvatarPreview(getProfileAvatarUrl(data, user));
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
                    const emptyProfile = {
                        name: "",
                        address: "",
                        contact: "",
                        avatar_url: "",
                    };
                    setFormData(emptyProfile);
                    setInitialProfileData(emptyProfile);
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
            // Clear contact error when user starts typing
            setContactError("");
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
        setContactError("");

        // Check if name is empty (required)
        if (!formData.name.trim()) {
            setNameError("Full name is required");
            errors.push("Full name is required");
        }

        // Check if address is empty (required)
        if (!formData.address.trim()) {
            setAddressError("Address is required");
            errors.push("Address is required");
        } else {
            // Only validate barangay if address is non-empty
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

        // Check if contact is empty (required)
        if (!formData.contact.trim()) {
            setContactError("Contact number is required");
            errors.push("Contact number is required");
        } else if (formData.contact.length !== 10) {
            // Only validate length if contact is present
            setContactError("Contact number must be 10 digits long");
            errors.push("Contact number must be 10 digits long");
        } else if (formData.contact[0] !== "9") {
            // Validate that first digit is 9
            setContactError("Contact number must start with 9");
            errors.push("Contact number must start with 9");
        }

        return errors;
    };

    // Check if there are unsaved changes
    const hasUnsavedChanges =
        formData.name !== initialProfileData.name ||
        formData.address !== initialProfileData.address ||
        formData.contact !== initialProfileData.contact ||
        avatarChanged;

    // Resolve avatar preview: use custom preview if available, otherwise fall back to utility
    const resolvedAvatarPreview =
        avatarPreview ||
        getProfileAvatarUrl(
            {
                avatar_url: formData.avatar_url,
                name: formData.name,
                email: user?.email,
            },
            user
        );

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
            let avatarUrl = formData.avatar_url; // Keep existing avatar by default

            // Handle avatar upload if changed
            if (avatarChanged) {
                if (selectedAvatarFile) {
                    // Upload new avatar and delete old one
                    const uploadResult = await uploadImage(
                        selectedAvatarFile,
                        "avatars",
                        user.id,
                        formData.avatar_url // This will delete the old avatar
                    );

                    console.log("Upload result:", uploadResult);

                    if (uploadResult.success) {
                        avatarUrl = uploadResult.url;
                        console.log("Avatar uploaded successfully:", avatarUrl);
                    } else {
                        console.error(
                            "Avatar upload failed:",
                            uploadResult.error
                        );
                        alert(uploadResult.error || "Failed to upload avatar");
                        setIsSubmitting(false);
                        return;
                    }
                } else if (!selectedAvatarFile && !formData.avatar_url) {
                    // User removed their avatar - set to empty string
                    avatarUrl = "";
                }
            }

            // Format the contact number before saving
            const formattedContact = formData.contact
                ? formatPhoneNumber(formData.contact)
                : "";

            // Update the profiles table with all data including avatar
            const { error: profileError } = await supabase
                .from("profiles")
                .upsert(
                    {
                        id: user.id,
                        name: formData.name,
                        address: formData.address,
                        contact: formattedContact,
                        avatar_url: avatarUrl,
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
                setLoading(false);
                setModalOpen(true);
            } else {
                // Update local state
                setFormData({
                    name: formData.name,
                    address: formData.address,
                    contact: formData.contact,
                    avatar_url: avatarUrl,
                });
                setAvatarChanged(false);
                setSelectedAvatarFile(null);

                // Clean up preview URL if it was a blob
                if (avatarPreview && avatarPreview.startsWith("blob:")) {
                    URL.revokeObjectURL(avatarPreview);
                }

                setLoading(false);
                // Redirect to profile page
                navigate("/profile");
            }
        } catch (error) {
            setModalMessage(`An unexpected error occurred: ${error.message}`);
            setLoading(false);
            setModalOpen(true);
        }
    };

    const handlePasswordChange = async (e) => {
        // Handle both form submission and button click
        if (e?.preventDefault) {
            e.preventDefault();
        }
        setPasswordChangeError("");

        // Validation
        if (!newPassword.trim() || !confirmPassword.trim()) {
            setModalMessage("Both password fields are required.");
            setModalOpen(true);
            return;
        }

        if (newPassword !== confirmPassword) {
            setModalMessage("Passwords do not match. Please try again.");
            setModalOpen(true);
            return;
        }

        if (newPassword.length < 6) {
            setModalMessage("Password must be at least 6 characters long.");
            setModalOpen(true);
            return;
        }

        setPasswordChangeLoading(true);

        try {
            const { error } = await supabase.auth.updateUser({
                password: newPassword,
            });

            if (error) {
                setModalMessage(`Failed to update password: ${error.message}`);
                setModalOpen(true);
            } else {
                // Clear password fields on success
                setNewPassword("");
                setConfirmPassword("");
                setModalMessage("Password updated successfully.");
                setModalOpen(true);
            }
        } catch (error) {
            setModalMessage(`An unexpected error occurred: ${error.message}`);
            setModalOpen(true);
        } finally {
            setPasswordChangeLoading(false);
        }
    };

    // Handle file selection for avatar - only handles preview and compression
    const handleAvatarFileSelect = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file
        const validation = validateImageFile(file);
        if (!validation.valid) {
            setModalMessage(validation.error);
            setModalOpen(true);
            return;
        }

        try {
            // Clean up previous preview URL if it exists
            if (avatarPreview && avatarPreview.startsWith("blob:")) {
                URL.revokeObjectURL(avatarPreview);
            }

            // Create preview immediately using original file
            const previewUrl = URL.createObjectURL(file);
            setAvatarPreview(previewUrl);
            setAvatarChanged(true);

            // Compress the image in background for later upload
            console.log("Compressing image for upload...");
            const compressedFile = await compressImage(file, 400, 0.8);

            // Validate the compressed file has content
            if (compressedFile.size === 0) {
                console.warn("Compressed file is empty, using original file");
                setSelectedAvatarFile(file);
            } else {
                setSelectedAvatarFile(compressedFile);
            }
        } catch (error) {
            console.error("Error processing image:", error);
            // Still set preview even if compression fails
            const previewUrl = URL.createObjectURL(file);
            setAvatarPreview(previewUrl);
            setSelectedAvatarFile(file); // Use original file if compression fails
            setAvatarChanged(true);
        }
    };

    // Handle avatar removal (just preview change until form submission)
    const handleRemoveAvatar = () => {
        // Clean up the preview URL if it exists
        if (avatarPreview && avatarPreview.startsWith("blob:")) {
            URL.revokeObjectURL(avatarPreview);
        }
        // Clear preview and set avatarUrl to empty to trigger UI-Avatars fallback
        setAvatarPreview("");
        setSelectedAvatarFile(null);
        setAvatarChanged(true);
        // Update formData to clear stored avatar URL
        setFormData((prev) => ({
            ...prev,
            avatar_url: "",
        }));
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
                                <div className="w-32 h-32 mx-auto mb-4 relative">
                                    <img
                                        src={resolvedAvatarPreview}
                                        alt="profile"
                                        className="w-full h-full object-cover rounded-full border-4 border-white shadow-xl"
                                    />
                                    {/* Hidden file input */}
                                    <input
                                        type="file"
                                        id="avatar-file-input"
                                        accept="image/*"
                                        onChange={handleAvatarFileSelect}
                                        className="hidden"
                                    />
                                    {/* Camera button - opens file browser directly */}
                                    <label
                                        htmlFor="avatar-file-input"
                                        className="absolute bottom-0 right-0 bg-white text-primary p-2.5 rounded-full shadow-lg hover:bg-gray-50 transition-colors cursor-pointer"
                                    >
                                        <Icon
                                            icon="mingcute:camera-line"
                                            width="18"
                                            height="18"
                                        />
                                    </label>
                                    {/* Remove Avatar Button - only show when avatar exists */}
                                    {(avatarPreview || formData.avatar_url) &&
                                        !formData.avatar_url && (
                                            <button
                                                type="button"
                                                onClick={handleRemoveAvatar}
                                                className="absolute top-0 right-0 bg-red-500 text-white p-1.5 rounded-full shadow-lg hover:bg-red-600 transition-colors"
                                                title="Remove avatar"
                                            >
                                                <Icon
                                                    icon="mingcute:close-line"
                                                    width="14"
                                                    height="14"
                                                />
                                            </button>
                                        )}
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
                                    {contactError ? (
                                        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                                            <Icon
                                                icon="mingcute:alert-circle-fill"
                                                width="16"
                                                height="16"
                                            />
                                            {contactError}
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 text-gray-500 text-sm bg-gray-50 p-3 rounded-lg">
                                            <Icon
                                                icon="mingcute:information-line"
                                                width="16"
                                                height="16"
                                                className="text-gray-400"
                                            />
                                            Enter your 10-digit mobile number
                                            starting with 9 (without +63)
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Security Section */}
                            <div className="border-t border-gray-100">
                                <div className="p-6">
                                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-6">
                                        <Icon
                                            icon="mingcute:shield-line"
                                            width="20"
                                            height="20"
                                            className="text-primary"
                                        />
                                        Security Settings
                                    </h3>

                                    {/* Password Change Card */}
                                    <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-2xl overflow-hidden shadow-sm">
                                        {/* Card Header */}
                                        <div className="bg-white border-b border-red-100 px-6 py-4 flex flex-col items-center gap-3">
                                            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                                                <Icon
                                                    icon="mingcute:lock-line"
                                                    width="20"
                                                    height="20"
                                                    className="text-red-600"
                                                />
                                            </div>
                                            <div className="text-center">
                                                <h4 className="font-semibold text-gray-800 text-base">
                                                    Change Password
                                                </h4>
                                                <p className="text-gray-500 text-sm mt-1">
                                                    Update your password to keep
                                                    your account secure
                                                </p>
                                            </div>
                                        </div>

                                        {/* Card Content */}
                                        <div className="px-6 py-6 space-y-4">
                                            {/* New Password Field */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    New Password
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type={
                                                            passwordVisible
                                                                ? "text"
                                                                : "password"
                                                        }
                                                        placeholder="Enter new password"
                                                        value={newPassword}
                                                        onChange={(e) =>
                                                            setNewPassword(
                                                                e.target.value
                                                            )
                                                        }
                                                        disabled={
                                                            passwordChangeLoading ||
                                                            loading
                                                        }
                                                        className="w-full px-4 py-3 border border-red-200 bg-white rounded-lg text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setPasswordVisible(
                                                                !passwordVisible
                                                            )
                                                        }
                                                        className="absolute right-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                                        tabIndex="-1"
                                                    >
                                                        <Icon
                                                            icon={
                                                                passwordVisible
                                                                    ? "mingcute:eye-line"
                                                                    : "mingcute:eye-closed-line"
                                                            }
                                                            width="18"
                                                            height="18"
                                                        />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Confirm Password Field */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Confirm Password
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type={
                                                            passwordVisible
                                                                ? "text"
                                                                : "password"
                                                        }
                                                        placeholder="Confirm new password"
                                                        value={confirmPassword}
                                                        onChange={(e) =>
                                                            setConfirmPassword(
                                                                e.target.value
                                                            )
                                                        }
                                                        disabled={
                                                            passwordChangeLoading ||
                                                            loading
                                                        }
                                                        className="w-full px-4 py-3 border border-red-200 bg-white rounded-lg text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setPasswordVisible(
                                                                !passwordVisible
                                                            )
                                                        }
                                                        className="absolute right-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                                        tabIndex="-1"
                                                    >
                                                        <Icon
                                                            icon={
                                                                passwordVisible
                                                                    ? "mingcute:eye-line"
                                                                    : "mingcute:eye-closed-line"
                                                            }
                                                            width="18"
                                                            height="18"
                                                        />
                                                    </button>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-2">
                                                    Password must be at least 6
                                                    characters long
                                                </p>
                                            </div>
                                        </div>

                                        {/* Card Footer */}
                                        <div className="bg-white border-t border-red-100 px-6 py-4 flex justify-end">
                                            <button
                                                type="button"
                                                onClick={handlePasswordChange}
                                                disabled={
                                                    passwordChangeLoading ||
                                                    loading
                                                }
                                                className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                                                    passwordChangeLoading ||
                                                    loading
                                                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                                        : "bg-red-500 hover:bg-red-600 text-white"
                                                }`}
                                            >
                                                {passwordChangeLoading ? (
                                                    <>
                                                        <Icon
                                                            icon="mingcute:loading-line"
                                                            width="16"
                                                            height="16"
                                                            className="animate-spin"
                                                        />
                                                        Updating...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Icon
                                                            icon="mingcute:key-line"
                                                            width="16"
                                                            height="16"
                                                        />
                                                        Update Password
                                                    </>
                                                )}
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
                                            icon="mingcute:left-line"
                                            width="18"
                                            height="18"
                                        />
                                        Return to Profile
                                    </Link>
                                    <button
                                        type="submit"
                                        disabled={loading || !hasUnsavedChanges}
                                        className={`flex-1 px-6 py-3.5 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 transform ${
                                            loading || !hasUnsavedChanges
                                                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                                : "bg-primary text-white hover:bg-primary-dark hover:shadow-lg hover:-translate-y-0.5"
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
