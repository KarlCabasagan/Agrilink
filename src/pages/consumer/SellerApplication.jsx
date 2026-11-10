import { useState, useEffect, useContext } from "react";
import { Icon } from "@iconify/react";
import { useNavigate, Link } from "react-router-dom";
import NavigationBar from "../../components/NavigationBar";
import supabase from "../../SupabaseClient";
import ValidIdUpload from "../../components/ValidIdUpload";
import { AuthContext } from "../../context/AuthContext.jsx";
import { uploadImage } from "../../utils/imageUpload";

function SellerApplication() {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    // Form and validation states
    const [formData, setFormData] = useState({
        crops: [],
        experience: "",
    });
    const [errors, setErrors] = useState({});
    // Store file and preview for valid ID (no URL until submission)
    const [validId, setValidId] = useState({
        file: null,
        preview: "",
    });

    // UI states
    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [showAllCrops, setShowAllCrops] = useState(false);

    // Data states
    const [userData, setUserData] = useState(null);
    const [cropsData, setCropsData] = useState([]);
    const [loadingCrops, setLoadingCrops] = useState(true);
    const [existingApplication, setExistingApplication] = useState(null);

    // Helper function to format phone numbers (e.g., +63 912 345 6789)
    const formatPhoneNumber = (phoneNumber) => {
        if (!phoneNumber) return "";
        const cleaned = phoneNumber.replace(/\D/g, "");
        const parts = [
            "+63",
            cleaned.slice(0, 3),
            cleaned.slice(3, 6),
            cleaned.slice(6, 10),
        ].filter(Boolean);
        return parts.join(" ");
    };

    // Handle toggling crop selection
    const handleCropToggle = (cropId) => {
        setFormData((prev) => ({
            ...prev,
            crops: prev.crops.includes(cropId)
                ? prev.crops.filter((c) => c !== cropId)
                : [...prev.crops, cropId],
        }));
        setErrors((prev) => ({ ...prev, crops: undefined }));
    };

    const validateForm = () => {
        const newErrors = {};

        // Required field validation
        if (!formData.experience.trim()) {
            newErrors.experience = "Experience is required";
        }
        if (formData.crops.length === 0) {
            newErrors.crops = "Please select at least one crop";
        }

        // Valid ID required only for first-time submissions (no existing application)
        // For rejected applications, allow using previously stored ID unless user uploads new file
        if (!existingApplication && !validId?.file) {
            newErrors.validId = "Please upload a valid ID";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        // Clear error when user starts typing
        setErrors((prev) => ({ ...prev, [name]: undefined }));
    };

    useEffect(() => {
        // Fetch all initial data on mount
        const fetchInitialData = async () => {
            try {
                // Check for existing seller application
                const { data: application, error: applicationError } =
                    await supabase
                        .from("seller_applications")
                        .select("*")
                        .eq("user_id", user.id)
                        .maybeSingle();

                if (applicationError) {
                    console.error(
                        "Error checking existing application:",
                        applicationError
                    );
                }

                setExistingApplication(application || null);

                // Fetch user profile
                const { data: profile, error: profileError } = await supabase
                    .from("profiles")
                    .select("*")
                    .eq("id", user.id)
                    .single();

                if (profileError) throw profileError;
                setUserData(profile);

                // Branch on rejection_reason
                if (application && application.rejection_reason !== null) {
                    // Rejected application: fetch crops and prefill form
                    const { data: crops, error: cropsError } = await supabase
                        .from("crops")
                        .select("*");

                    if (cropsError) throw cropsError;
                    setCropsData(crops || []);

                    // Fetch application_crops to prefill selected crops
                    const { data: appCrops, error: appCropsError } =
                        await supabase
                            .from("application_crops")
                            .select("crop_id")
                            .eq("application_id", application.id);

                    if (appCropsError) throw appCropsError;

                    // Prefill form data
                    setFormData({
                        experience: application.farming_experience || "",
                        crops: appCrops.map((ac) => ac.crop_id) || [],
                    });

                    // Set valid ID preview from URL
                    setValidId({
                        file: null,
                        preview: application.valid_id_url || "",
                    });
                } else if (!application) {
                    // New applicant: fetch crops only
                    const { data: crops, error: cropsError } = await supabase
                        .from("crops")
                        .select("*");

                    if (cropsError) throw cropsError;
                    setCropsData(crops || []);
                }
                // If application exists but rejection_reason is null (under review),
                // do not fetch crops to keep form disabled
            } catch (err) {
                console.error("Error fetching initial data:", err);
                setErrors((prev) => ({
                    ...prev,
                    submit: "Failed to load application data",
                }));
            } finally {
                setLoadingCrops(false);
            }
        };

        fetchInitialData();
    }, []); // ✅ Run only once on mount

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setLoading(true);
        setErrors({}); // Clear any previous errors

        try {
            // Branch on whether this is a resubmission of a rejected application
            const isResubmission =
                existingApplication &&
                existingApplication.rejection_reason !== null;

            let validIdUrl = validId.preview; // Default to existing URL for resubmission

            // Upload new valid ID if provided (for both new and rejected applications)
            if (validId.file) {
                const uploadResult = await uploadImage(
                    validId.file,
                    "valid_ids",
                    user.id
                );
                if (!uploadResult.success) {
                    setErrors({
                        submit:
                            uploadResult.error || "Failed to upload valid ID",
                    });
                    setLoading(false);
                    return;
                }
                validIdUrl = uploadResult.url;
            } else if (!isResubmission && !validId.file) {
                // First-time submission must have a file
                setErrors({ submit: "Valid ID image is required" });
                setLoading(false);
                return;
            }

            if (isResubmission) {
                // RESUBMISSION: Update existing application
                const { data: updatedApp, error: updateError } = await supabase
                    .from("seller_applications")
                    .update({
                        valid_id_url: validIdUrl,
                        farming_experience: formData.experience,
                        rejection_reason: null, // Clear rejection reason
                    })
                    .eq("id", existingApplication.id)
                    .select()
                    .single();

                if (updateError) {
                    throw new Error(updateError.message);
                }

                // Replace application_crops with newly selected crops
                const { error: deleteError } = await supabase
                    .from("application_crops")
                    .delete()
                    .eq("application_id", existingApplication.id);

                if (deleteError) {
                    throw new Error(deleteError.message);
                }

                const { error: insertCropError } = await supabase
                    .from("application_crops")
                    .insert(
                        formData.crops.map((cropId) => ({
                            application_id: existingApplication.id,
                            crop_id: cropId,
                        }))
                    );

                if (insertCropError) {
                    throw new Error(insertCropError.message);
                }

                // Update state so form becomes read-only again
                setExistingApplication(updatedApp);
            } else {
                // NEW SUBMISSION: Insert new application
                const { data: appData, error: appError } = await supabase
                    .from("seller_applications")
                    .insert([
                        {
                            user_id: user.id,
                            valid_id_url: validIdUrl,
                            farming_experience: formData.experience,
                            rejection_reason: null,
                        },
                    ])
                    .select()
                    .single();

                if (appError) {
                    throw new Error(appError.message);
                }

                // Insert selected crops into application_crops
                const { error: cropError } = await supabase
                    .from("application_crops")
                    .insert(
                        formData.crops.map((cropId) => ({
                            application_id: appData.id,
                            crop_id: cropId,
                        }))
                    );

                if (cropError) {
                    throw new Error(cropError.message);
                }
            }

            // Success! Show success message and redirect
            setShowSuccess(true);
            setTimeout(() => navigate("/profile"), 3000);
        } catch (error) {
            console.error("Error submitting application:", error);
            setErrors({
                submit:
                    error.message ||
                    "Failed to submit application. Please try again.",
            });
        } finally {
            setLoading(false);
        }
    };

    if (showSuccess) {
        return (
            <div className="min-h-screen w-full max-w-full overflow-x-hidden flex flex-col bg-slate-50/50 text-slate-900 pb-24 md:pb-12 md:pt-16">
                <header className="md:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 text-center">
                    <h1 className="text-base font-bold text-slate-900">
                        Application Submitted
                    </h1>
                </header>

                <main className="flex-1 w-full max-w-2xl mx-auto px-4 sm:px-6 my-auto py-12 flex items-center justify-center">
                    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-8 sm:p-10 text-center w-full">
                        <div className="w-16 h-16 bg-emerald-50 border border-emerald-200/80 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Icon
                                icon="mingcute:check-circle-fill"
                                width="36"
                                height="36"
                                className="text-emerald-700"
                            />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 mb-2">
                            Application Submitted Successfully!
                        </h2>
                        <p className="text-sm text-slate-600 mb-6 max-w-md mx-auto">
                            Your seller application has been submitted for review. Our team will verify your personal details, valid ID, and farming background.
                        </p>
                        <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-4 text-xs text-slate-600 space-y-1.5 max-w-md mx-auto text-left mb-6">
                            <p className="font-semibold text-slate-800">Verification Steps:</p>
                            <div className="flex items-center gap-2 text-slate-700">
                                <Icon icon="mingcute:check-line" className="text-emerald-700 shrink-0" width="16" height="16" />
                                <span>Personal Information review</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-700">
                                <Icon icon="mingcute:check-line" className="text-emerald-700 shrink-0" width="16" height="16" />
                                <span>Government Valid ID check</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-700">
                                <Icon icon="mingcute:check-line" className="text-emerald-700 shrink-0" width="16" height="16" />
                                <span>Farming experience & crop selection</span>
                            </div>
                        </div>
                        <p className="text-xs text-slate-400">
                            Redirecting you to your profile shortly...
                        </p>
                    </div>
                </main>

                <NavigationBar />
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full max-w-full overflow-x-hidden flex flex-col bg-slate-50/50 text-slate-900 pb-24 md:pb-12 md:pt-16">
            {/* Mobile Top Header */}
            <header className="md:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 flex items-center justify-between">
                <button
                    onClick={() => navigate(-1)}
                    className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center text-slate-600 hover:text-emerald-700 rounded-xl hover:bg-slate-100 active:scale-[0.97] transition-all"
                    aria-label="Back"
                >
                    <Icon
                        icon="mingcute:left-line"
                        width="22"
                        height="22"
                    />
                </button>
                <h1 className="text-base font-semibold text-slate-900">
                    Apply to be a Seller
                </h1>
                <div className="w-11" aria-hidden="true" />
            </header>

            <main className="flex-1 w-full max-w-2xl mx-auto px-4 sm:px-6 mt-4 md:mt-6">
                {/* Desktop Breadcrumbs */}
                <nav className="hidden md:flex items-center gap-2 text-xs font-medium text-slate-500 mb-6" aria-label="Breadcrumb">
                    <Link to="/" className="hover:text-emerald-700 transition-colors">Home</Link>
                    <span>/</span>
                    <Link to="/profile" className="hover:text-emerald-700 transition-colors">Profile</Link>
                    <span>/</span>
                    <span className="text-slate-900 font-semibold">Seller Application</span>
                </nav>

                <div className="hidden md:block mb-6">
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Apply to be a Seller</h1>
                    <p className="text-xs text-slate-500 mt-1">Join Agrilink and sell your farm harvest directly to local buyers</p>
                </div>

                {/* Rejected Application Banner */}
                {existingApplication &&
                    existingApplication.rejection_reason !== null && (
                        <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-800 p-4 sm:p-5 rounded-2xl shadow-2xs">
                            <div className="flex items-start gap-3">
                                <Icon
                                    icon="mingcute:close-circle-line"
                                    width="22"
                                    height="22"
                                    className="text-rose-600 shrink-0 mt-0.5"
                                />
                                <div>
                                    <h3 className="font-bold text-sm text-rose-900 mb-1">
                                        Application Rejected
                                    </h3>
                                    <p className="text-xs text-rose-700 mb-2 leading-relaxed">
                                        {existingApplication.rejection_reason}
                                    </p>
                                    <p className="text-[11px] text-rose-600">
                                        Please review the comments above and update your application accordingly.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                {/* Under Review Banner */}
                {existingApplication &&
                    existingApplication.rejection_reason === null && (
                        <div className="mb-6 bg-amber-50 border border-amber-200 text-amber-800 p-4 sm:p-5 rounded-2xl shadow-2xs">
                            <div className="flex items-start gap-3">
                                <Icon
                                    icon="mingcute:time-line"
                                    width="22"
                                    height="22"
                                    className="text-amber-600 shrink-0 mt-0.5"
                                />
                                <div>
                                    <h3 className="font-bold text-sm text-amber-900 mb-1">
                                        Application Under Review
                                    </h3>
                                    <p className="text-xs text-amber-700 leading-relaxed mb-3">
                                        Your seller application is currently being reviewed by our admin team. You will see automatic updates once the verification is complete.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => navigate("/profile")}
                                        className="text-xs font-semibold text-amber-900 hover:text-amber-950 flex items-center gap-1.5 active:scale-95 transition-transform"
                                    >
                                        <Icon
                                            icon="mingcute:user-4-line"
                                            width="15"
                                            height="15"
                                        />
                                        Go to Profile
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                {/* Info Banner */}
                <div className="mb-6 bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs">
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200/70 flex items-center justify-center shrink-0 text-emerald-700">
                            <Icon
                                icon="mingcute:information-line"
                                width="18"
                                height="18"
                            />
                        </div>
                        <div>
                            <h3 className="font-bold text-xs sm:text-sm text-slate-900 mb-0.5">
                                Seller Application Requirements
                            </h3>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                Please ensure your personal information and contact details are accurate. Applications are verified within 2-3 business days.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Application Form */}
                <form
                    onSubmit={handleSubmit}
                    className="space-y-6"
                    style={{
                        pointerEvents:
                            existingApplication &&
                            existingApplication.rejection_reason === null
                                ? "none"
                                : "auto",
                        opacity:
                            existingApplication &&
                            existingApplication.rejection_reason === null
                                ? 0.6
                                : 1,
                    }}
                >
                    {/* Personal Information */}
                    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                        <div className="px-6 py-4.5 border-b border-slate-100 bg-slate-50/50">
                            <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                                <Icon icon="mingcute:user-3-line" className="text-emerald-700" width="18" height="18" />
                                Personal Information
                            </h2>
                            <p className="text-xs text-slate-500 mt-0.5">Review your registered profile details below</p>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                    Full Name
                                </label>
                                <div className="w-full h-11 px-3.5 border rounded-xl bg-slate-50/70 border-slate-200 text-slate-700 text-sm flex items-center">
                                    {userData?.name || "Loading..."}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                    Email Address
                                </label>
                                <div className="w-full h-11 px-3.5 border rounded-xl bg-slate-50/70 border-slate-200 text-slate-700 text-sm flex items-center">
                                    {userData?.email || "Loading..."}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                    Contact Number
                                </label>
                                <div className="w-full h-11 px-3.5 border rounded-xl bg-slate-50/70 border-slate-200 text-slate-700 text-sm flex items-center tabular-nums">
                                    {userData?.contact
                                        ? formatPhoneNumber(userData.contact)
                                        : "Loading..."}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                    Complete Address
                                </label>
                                <div className="w-full h-11 px-3.5 border rounded-xl bg-slate-50/70 border-slate-200 text-slate-700 text-sm flex items-center">
                                    {userData?.address || "Loading..."}
                                </div>
                            </div>

                            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center justify-between text-xs text-slate-600">
                                <span>Need to change your profile information?</span>
                                <Link
                                    to="/edit-profile"
                                    className="text-emerald-700 hover:text-emerald-800 font-semibold inline-flex items-center gap-1 active:scale-95 transition-transform"
                                >
                                    Edit Profile
                                    <Icon icon="mingcute:right-line" width="14" height="14" />
                                </Link>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                    Valid ID *
                                </label>
                                <ValidIdUpload
                                    currentImage={validId?.preview || ""}
                                    onImageChange={(file, preview) =>
                                        setValidId({ file, preview })
                                    }
                                    disableAutoUpload={true}
                                    userId={user?.id}
                                    className="w-full"
                                    disabled={loading}
                                />
                                {errors.validId && (
                                    <p className="text-rose-600 text-xs mt-1.5">
                                        {errors.validId}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Farm Information */}
                    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                        <div className="px-6 py-4.5 border-b border-slate-100 bg-slate-50/50">
                            <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                                <Icon icon="mingcute:plant-line" className="text-emerald-700" width="18" height="18" />
                                Farm & Harvest Information
                            </h2>
                            <p className="text-xs text-slate-500 mt-0.5">Specify your farming experience and crops</p>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                    Farming Experience *
                                </label>
                                <input
                                    type="text"
                                    name="experience"
                                    value={formData.experience}
                                    onChange={handleInputChange}
                                    className={`w-full h-11 px-3.5 border rounded-xl text-sm outline-none transition-all duration-150 ${
                                        errors.experience
                                            ? "border-rose-300 bg-rose-50/40 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 text-slate-900"
                                            : "border-slate-200 bg-slate-50/50 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 text-slate-900"
                                    }`}
                                    placeholder="e.g., 5 years, 10 years"
                                />
                                {errors.experience && (
                                    <p className="text-rose-600 text-xs mt-1.5">
                                        {errors.experience}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Crops You Grow *
                                </label>
                                <p className="text-xs text-slate-500 mb-3">
                                    Select all crops that you currently grow or plan to sell:
                                </p>

                                {/* Search Bar */}
                                <div className="mb-4">
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) =>
                                                setSearchQuery(e.target.value)
                                            }
                                            placeholder="Search crops..."
                                            className="w-full h-10 pl-9 pr-3.5 border rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-emerald-600/15 focus:border-emerald-600 border-slate-200 bg-slate-50 outline-none text-slate-900"
                                        />
                                        <Icon
                                            icon="mingcute:search-line"
                                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                            width="18"
                                            height="18"
                                        />
                                    </div>
                                </div>

                                {/* Crops Grid */}
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                                    {loadingCrops ? (
                                        <div className="col-span-full text-center py-6">
                                            <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-emerald-700 mx-auto"></div>
                                            <p className="text-xs text-slate-500 mt-2">
                                                Loading crops...
                                            </p>
                                        </div>
                                    ) : (
                                        cropsData
                                            .filter((crop) =>
                                                crop.name
                                                    .toLowerCase()
                                                    .includes(
                                                        searchQuery.toLowerCase()
                                                    )
                                            )
                                            .slice(
                                                0,
                                                showAllCrops ? undefined : 6
                                            )
                                            .map((crop) => (
                                                <label
                                                    key={crop.id}
                                                    className={`flex items-center p-3 rounded-xl border cursor-pointer transition-all active:scale-[0.98] ${
                                                        formData.crops.includes(
                                                            crop.id
                                                        )
                                                            ? "border-emerald-600 bg-emerald-50/40 text-emerald-950 ring-1 ring-emerald-600/20"
                                                            : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/60 text-slate-800"
                                                    }`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.crops.includes(
                                                            crop.id
                                                        )}
                                                        onChange={() =>
                                                            handleCropToggle(
                                                                crop.id
                                                            )
                                                        }
                                                        className="mr-2.5 h-4 w-4 rounded text-emerald-700 focus:ring-emerald-600"
                                                    />
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="text-xs sm:text-sm font-semibold truncate">
                                                            {crop.name}
                                                        </span>
                                                        <span className="text-[11px] text-slate-500">
                                                            Demand:{" "}
                                                            {crop.market_demand}
                                                        </span>
                                                    </div>
                                                </label>
                                            ))
                                    )}
                                </div>

                                {/* Show More/Less Button */}
                                {!loadingCrops &&
                                    cropsData.filter((crop) =>
                                        crop.name
                                            .toLowerCase()
                                            .includes(searchQuery.toLowerCase())
                                    ).length > 6 && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowAllCrops(!showAllCrops)
                                            }
                                            className="mt-3 text-emerald-700 hover:text-emerald-800 text-xs font-semibold inline-flex items-center gap-1 active:scale-95 transition-transform"
                                        >
                                            <Icon
                                                icon={
                                                    showAllCrops
                                                        ? "mingcute:up-line"
                                                        : "mingcute:down-line"
                                                }
                                                width="15"
                                                height="15"
                                            />
                                            {showAllCrops
                                                ? "Show Less"
                                                : "Show More Crops"}
                                        </button>
                                    )}

                                {errors.crops && (
                                    <p className="text-rose-600 text-xs mt-1.5">
                                        {errors.crops}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6">
                        {errors.submit && (
                            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl">
                                <p className="text-xs text-rose-700">
                                    {errors.submit}
                                </p>
                            </div>
                        )}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full min-h-[48px] bg-emerald-700 text-white py-3 px-6 rounded-xl hover:bg-emerald-800 transition-all font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-xs active:scale-[0.98]"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    Submitting Application...
                                </>
                            ) : (
                                <>
                                    <Icon
                                        icon="mingcute:paper-line"
                                        width="18"
                                        height="18"
                                    />
                                    Submit Application for Verification
                                </>
                            )}
                        </button>
                        <p className="text-[11px] text-slate-500 text-center mt-3 max-w-prose mx-auto">
                            By submitting this application, you agree to our terms and conditions for sellers on the Agrilink platform. Your application will be reviewed by our admin team.
                        </p>
                    </div>
                </form>
            </main>

            <NavigationBar />
        </div>
    );
}

export default SellerApplication;
