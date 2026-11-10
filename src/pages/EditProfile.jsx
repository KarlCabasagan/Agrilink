import { Icon } from "@iconify/react/dist/iconify.js";
import { useState, useEffect, useContext, useCallback } from "react";
import supabase from "../SupabaseClient.jsx";
import { AuthContext } from "../context/AuthContext.jsx";
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
        <div className="min-h-screen w-full max-w-full overflow-x-hidden flex flex-col bg-slate-50/50 text-slate-900 pb-24 md:pb-12 md:pt-16">
            {/* Modal */}
            {modalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
                    <div className="bg-white rounded-2xl shadow-xl border border-slate-200/90 p-6 max-w-sm w-full text-center scale-100 transition-all">
                        <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center bg-slate-50 border border-slate-200/80">
                            <Icon
                                icon={
                                    modalMessage.includes("successfully")
                                        ? "mingcute:check-circle-fill"
                                        : "mingcute:alert-circle-fill"
                                }
                                width="28"
                                height="28"
                                className={
                                    modalMessage.includes("successfully")
                                        ? "text-emerald-600"
                                        : "text-rose-600"
                                }
                            />
                        </div>
                        <p className="text-sm font-medium text-slate-800 leading-relaxed mb-5">{modalMessage}</p>
                        <button
                            type="button"
                            className="w-full min-h-[44px] px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold rounded-xl shadow-xs active:scale-[0.98] transition-all"
                            onClick={() => setModalOpen(false)}
                        >
                            OK
                        </button>
                    </div>
                </div>
            )}

            {/* Mobile Top Header */}
            <header className="md:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 flex items-center justify-between">
                <Link
                    to="/profile"
                    className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center text-slate-600 hover:text-emerald-700 rounded-xl hover:bg-slate-100 active:scale-[0.97] transition-all"
                    aria-label="Back to Profile"
                >
                    <Icon icon="mingcute:left-line" width="22" height="22" />
                </Link>
                <h1 className="text-base font-semibold text-slate-900">Edit Profile</h1>
                <div className="w-11" aria-hidden="true" />
            </header>

            {/* Main Content */}
            <main className="flex-1 w-full max-w-2xl mx-auto px-4 sm:px-6 mt-4 md:mt-6">
                {/* Desktop Breadcrumb */}
                <nav className="hidden md:flex items-center gap-2 text-xs font-medium text-slate-500 mb-6" aria-label="Breadcrumb">
                    <Link to="/" className="hover:text-emerald-700 transition-colors">Home</Link>
                    <span>/</span>
                    <Link to="/profile" className="hover:text-emerald-700 transition-colors">Profile</Link>
                    <span>/</span>
                    <span className="text-slate-900 font-semibold">Edit Profile</span>
                </nav>

                {/* Profile Header Card */}
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 sm:p-7 mb-6 text-center">
                    <div className="w-28 h-28 mx-auto mb-4 relative">
                        <img
                            src={resolvedAvatarPreview}
                            alt="profile"
                            className="w-full h-full object-cover rounded-full border-2 border-slate-100 shadow-sm"
                        />
                        {/* Hidden file input */}
                        <input
                            type="file"
                            id="avatar-file-input"
                            accept="image/*"
                            onChange={handleAvatarFileSelect}
                            className="hidden"
                        />
                        {/* Camera button */}
                        <label
                            htmlFor="avatar-file-input"
                            className="absolute bottom-0 right-0 w-9 h-9 bg-emerald-700 text-white rounded-full shadow-md hover:bg-emerald-800 transition-colors cursor-pointer flex items-center justify-center active:scale-95"
                            title="Change photo"
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
                                    className="absolute top-0 right-0 w-8 h-8 bg-rose-600 text-white rounded-full shadow-md hover:bg-rose-700 transition-colors flex items-center justify-center active:scale-95"
                                    title="Remove avatar"
                                >
                                    <Icon
                                        icon="mingcute:close-line"
                                        width="16"
                                        height="16"
                                    />
                                </button>
                            )}
                    </div>
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-1">
                        {formData.name || "Complete Your Profile"}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 max-w-prose mx-auto">
                        Keep your contact and address up to date for smooth local deliveries
                    </p>
                </div>

                {/* Form Card */}
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden mb-6">
                    <form onSubmit={handleSubmit}>
                        {/* Form Header */}
                        <div className="border-b border-slate-100 px-6 py-4.5 bg-slate-50/50">
                            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                                <Icon
                                    icon="mingcute:edit-3-line"
                                    width="18"
                                    height="18"
                                    className="text-emerald-700"
                                />
                                Personal Information
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Update your delivery details and contact number
                            </p>
                        </div>

                        <div className="p-6 space-y-5">
                            {/* Full Name */}
                            <div className="space-y-1.5">
                                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                                    <Icon
                                        icon="mingcute:user-3-line"
                                        width="15"
                                        height="15"
                                        className="text-emerald-700"
                                    />
                                    Full Name
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Enter your full name"
                                        className={`w-full h-11 px-3.5 pr-10 border rounded-xl text-sm outline-none transition-all duration-150 ${
                                            nameError
                                                ? "border-rose-300 bg-rose-50/40 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 text-slate-900"
                                                : "border-slate-200 bg-slate-50/60 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 text-slate-900"
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
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                        <Icon
                                            icon="mingcute:user-3-line"
                                            width="18"
                                            height="18"
                                            className="text-slate-400"
                                        />
                                    </div>
                                </div>
                                {nameError && (
                                    <div className="flex items-center gap-2 text-rose-600 text-xs bg-rose-50 border border-rose-200/70 p-2.5 rounded-xl">
                                        <Icon
                                            icon="mingcute:alert-circle-fill"
                                            width="15"
                                            height="15"
                                        />
                                        {nameError}
                                    </div>
                                )}
                            </div>

                            {/* Address */}
                            <div className="space-y-1.5">
                                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                                    <Icon
                                        icon="mingcute:location-line"
                                        width="15"
                                        height="15"
                                        className="text-emerald-700"
                                    />
                                    Address
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Search for your barangay in Iligan City..."
                                        className={`w-full h-11 px-3.5 pr-10 border rounded-xl text-sm outline-none transition-all duration-150 ${
                                            addressError
                                                ? "border-rose-300 bg-rose-50/40 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 text-slate-900"
                                                : "border-slate-200 bg-slate-50/60 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 text-slate-900"
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
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                        <Icon
                                            icon="mingcute:search-line"
                                            width="18"
                                            height="18"
                                            className="text-slate-400"
                                        />
                                    </div>

                                    {/* Autocomplete Suggestions */}
                                    {showSuggestions &&
                                        filteredBarangays.length > 0 && (
                                            <div className="absolute z-20 w-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto divide-y divide-slate-100">
                                                {filteredBarangays
                                                    .slice(0, 8)
                                                    .map(
                                                        (
                                                            barangay,
                                                            index
                                                        ) => (
                                                            <div
                                                                key={index}
                                                                className="px-4 py-2.5 hover:bg-emerald-50/60 cursor-pointer transition-colors"
                                                                onClick={() =>
                                                                    handleSuggestionClick(
                                                                        barangay
                                                                    )
                                                                }
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-7 h-7 bg-emerald-50 rounded-lg flex items-center justify-center shrink-0">
                                                                        <Icon
                                                                            icon="mingcute:location-line"
                                                                            width="15"
                                                                            height="15"
                                                                            className="text-emerald-700"
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <div className="font-medium text-xs sm:text-sm text-slate-800">
                                                                            {
                                                                                barangay
                                                                            }
                                                                        </div>
                                                                        <div className="text-[11px] text-slate-500">
                                                                            Iligan City, Lanao del Norte
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
                                    <div className="flex items-center gap-2 text-rose-600 text-xs bg-rose-50 border border-rose-200/70 p-2.5 rounded-xl">
                                        <Icon
                                            icon="mingcute:alert-circle-fill"
                                            width="15"
                                            height="15"
                                        />
                                        {addressError}
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-slate-500 text-xs bg-slate-50 border border-slate-200/60 p-2.5 rounded-xl">
                                        <Icon
                                            icon="mingcute:information-line"
                                            width="15"
                                            height="15"
                                            className="text-emerald-700"
                                        />
                                        Start typing to search for barangays in Iligan City
                                    </div>
                                )}
                            </div>

                            {/* Contact Number */}
                            <div className="space-y-1.5">
                                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                                    <Icon
                                        icon="mingcute:phone-line"
                                        width="15"
                                        height="15"
                                        className="text-emerald-700"
                                    />
                                    Contact Number
                                </label>
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                                        <div className="flex items-center gap-1.5 text-slate-700 font-semibold bg-slate-100 border border-slate-200/70 px-2.5 py-1 rounded-lg text-xs">
                                            <Icon
                                                icon="emojione:flag-for-philippines"
                                                width="14"
                                                height="14"
                                            />
                                            +63
                                        </div>
                                    </div>
                                    <input
                                        type="tel"
                                        placeholder="912 345 6789"
                                        className="w-full h-11 pl-20 pr-4 border border-slate-200 bg-slate-50/60 rounded-xl text-sm tabular-nums outline-none focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 transition-all text-slate-900"
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
                                    <div className="flex items-center gap-2 text-rose-600 text-xs bg-rose-50 border border-rose-200/70 p-2.5 rounded-xl">
                                        <Icon
                                            icon="mingcute:alert-circle-fill"
                                            width="15"
                                            height="15"
                                        />
                                        {contactError}
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-slate-500 text-xs bg-slate-50 border border-slate-200/60 p-2.5 rounded-xl">
                                        <Icon
                                            icon="mingcute:information-line"
                                            width="15"
                                            height="15"
                                            className="text-slate-400"
                                        />
                                        Enter your 10-digit mobile number starting with 9 (without +63)
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Security Section */}
                        <div className="border-t border-slate-100 p-6 bg-slate-50/30">
                            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2 mb-4">
                                <Icon
                                    icon="mingcute:shield-line"
                                    width="18"
                                    height="18"
                                    className="text-emerald-700"
                                />
                                Security Settings
                            </h3>

                            {/* Password Change Sub-Card */}
                            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                                <div className="border-b border-slate-100 px-5 py-3.5 flex items-center gap-3 bg-slate-50/50">
                                    <div className="w-8 h-8 bg-amber-50 border border-amber-200/70 rounded-lg flex items-center justify-center shrink-0">
                                        <Icon
                                            icon="mingcute:lock-line"
                                            width="16"
                                            height="16"
                                            className="text-amber-700"
                                        />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-slate-900 text-xs sm:text-sm">
                                            Change Password
                                        </h4>
                                        <p className="text-slate-500 text-[11px]">
                                            Update your password to keep your account secure
                                        </p>
                                    </div>
                                </div>

                                <div className="p-5 space-y-4">
                                    {/* New Password Field */}
                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-medium text-slate-700">
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
                                                className="w-full h-10 px-3.5 pr-10 border border-slate-200 bg-slate-50/50 rounded-lg text-sm outline-none focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 transition-all text-slate-900"
                                            />
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setPasswordVisible(
                                                        !passwordVisible
                                                    )
                                                }
                                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 transition-colors"
                                                tabIndex="-1"
                                                aria-label={passwordVisible ? "Hide password" : "Show password"}
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
                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-medium text-slate-700">
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
                                                className="w-full h-10 px-3.5 pr-10 border border-slate-200 bg-slate-50/50 rounded-lg text-sm outline-none focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 transition-all text-slate-900"
                                            />
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setPasswordVisible(
                                                        !passwordVisible
                                                    )
                                                }
                                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 transition-colors"
                                                tabIndex="-1"
                                                aria-label={passwordVisible ? "Hide password" : "Show password"}
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
                                        <p className="text-[11px] text-slate-500">
                                            Password must be at least 6 characters long
                                        </p>
                                    </div>

                                    <div className="flex justify-end pt-1">
                                        <button
                                            type="button"
                                            onClick={handlePasswordChange}
                                            disabled={
                                                passwordChangeLoading ||
                                                loading
                                            }
                                            className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 active:scale-[0.98] ${
                                                passwordChangeLoading ||
                                                loading
                                                    ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                                                    : "bg-slate-900 hover:bg-slate-800 text-white shadow-xs"
                                            }`}
                                        >
                                            {passwordChangeLoading ? (
                                                <>
                                                    <Icon
                                                        icon="mingcute:loading-line"
                                                        width="14"
                                                        height="14"
                                                        className="animate-spin"
                                                    />
                                                    Updating...
                                                </>
                                            ) : (
                                                <>
                                                    <Icon
                                                        icon="mingcute:key-line"
                                                        width="14"
                                                        height="14"
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
                        <div className="border-t border-slate-100 p-6 bg-slate-50/50">
                            <div className="flex flex-col sm:flex-row gap-3">
                                <Link
                                    to="/profile"
                                    className="min-h-[44px] flex-1 text-center bg-white border border-slate-200 text-slate-700 px-5 py-2.5 rounded-xl hover:bg-slate-50 transition-colors font-medium text-sm flex items-center justify-center gap-2 active:scale-[0.98]"
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
                                    className={`min-h-[44px] flex-1 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-150 flex items-center justify-center gap-2 active:scale-[0.98] ${
                                        loading || !hasUnsavedChanges
                                            ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                                            : "bg-emerald-700 text-white hover:bg-emerald-800 shadow-xs hover:shadow"
                                    }`}
                                >
                                    {loading ? (
                                        <>
                                            <Icon
                                                icon="mingcute:loading-line"
                                                width="16"
                                                height="16"
                                                className="animate-spin"
                                            />
                                            Saving Changes...
                                        </>
                                    ) : (
                                        <>
                                            <Icon
                                                icon="mingcute:check-line"
                                                width="16"
                                                height="16"
                                            />
                                            Save Changes
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}

export default EditProfile;
