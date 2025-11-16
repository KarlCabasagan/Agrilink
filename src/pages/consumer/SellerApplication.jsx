import { useState, useEffect, useContext } from "react";
import { Icon } from "@iconify/react";
import { useNavigate, Link } from "react-router-dom";
import NavigationBar from "../../components/NavigationBar";
import supabase from "../../SupabaseClient";
import ValidIdUpload from "../../components/ValidIdUpload";
import { AuthContext } from "../../App";
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
                        .single();

                if (applicationError && applicationError.code !== "PGRST116") {
                    // PGRST116 means no rows found, which is expected for new applicants
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
                        <h2 className="text-xl font-bold text-gray-800 mb-4">
                            Application Submitted Successfully!
                        </h2>
                        <div className="text-gray-600 space-y-4">
                            <p>
                                Your seller application has been submitted for
                                review. Our admin team will verify your:
                            </p>
                            <ul className="list-disc pl-5 text-left space-y-2">
                                <li>Personal Information</li>
                                <li>Valid ID</li>
                                <li>Farming Experience</li>
                            </ul>
                            <p>
                                You’ll see certain UI changes once your
                                application is approved or verified.
                            </p>
                        </div>
                        <p className="text-sm text-gray-500 mt-6">
                            Redirecting you to your profile...
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
                {/* Rejected Application Banner */}
                {existingApplication &&
                    existingApplication.rejection_reason !== null && (
                        <div className="mb-6 bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg">
                            <div className="flex items-start gap-3">
                                <Icon
                                    icon="mingcute:close-circle-line"
                                    width="24"
                                    height="24"
                                    className="mt-0.5"
                                />
                                <div>
                                    <h3 className="font-semibold mb-2">
                                        Application Rejected
                                    </h3>
                                    <p className="text-sm mb-3">
                                        {existingApplication.rejection_reason}
                                    </p>
                                    <p className="text-sm">
                                        Please review the comments above and
                                        update your application accordingly.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                {/* Under Review Banner */}
                {existingApplication &&
                    existingApplication.rejection_reason === null && (
                        <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-lg">
                            <div className="flex items-start gap-3">
                                <Icon
                                    icon="mingcute:time-line"
                                    width="24"
                                    height="24"
                                    className="mt-0.5"
                                />
                                <div>
                                    <h3 className="font-semibold mb-1">
                                        Application Under Review
                                    </h3>
                                    <p className="text-sm">
                                        Your seller application is currently
                                        being reviewed by our admin team. You
                                        will see automatic UI changes once the
                                        review is complete.
                                    </p>
                                    <button
                                        onClick={() => navigate("/profile")}
                                        className="mt-3 text-sm font-medium text-yellow-800 hover:text-yellow-900 flex items-center gap-1"
                                    >
                                        <Icon
                                            icon="mingcute:user-4-line"
                                            width="16"
                                            height="16"
                                        />
                                        Go to Profile
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
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
                    <div className="bg-white rounded-lg shadow-md overflow-hidden">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-800">
                                Personal Information
                            </h2>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Full Name
                                </label>
                                <div className="w-full px-3 py-2 border rounded-lg bg-gray-50 border-gray-300 text-gray-700">
                                    {userData?.name || "Loading..."}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Email Address
                                </label>
                                <div className="w-full px-3 py-2 border rounded-lg bg-gray-50 border-gray-300 text-gray-700">
                                    {userData?.email || "Loading..."}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Contact Number
                                </label>
                                <div className="w-full px-3 py-2 border rounded-lg bg-gray-50 border-gray-300 text-gray-700">
                                    {userData?.contact
                                        ? formatPhoneNumber(userData.contact)
                                        : "Loading..."}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Complete Address
                                </label>
                                <div className="w-full px-3 py-2 border rounded-lg bg-gray-50 border-gray-300 text-gray-700">
                                    {userData?.address || "Loading..."}
                                </div>
                            </div>

                            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <p className="text-sm text-gray-600">
                                    Want to update your personal information?{" "}
                                    <Link
                                        to="/edit-profile"
                                        className="text-primary hover:text-primary-dark font-medium"
                                    >
                                        Edit Profile
                                    </Link>
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                                    <p className="text-red-600 text-sm mt-1">
                                        {errors.validId}
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
                                            className="w-full px-3 py-2 pl-10 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent border-gray-300"
                                        />
                                        <Icon
                                            icon="mingcute:search-line"
                                            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                                            width="20"
                                            height="20"
                                        />
                                    </div>
                                </div>

                                {/* Crops Grid */}
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {loadingCrops ? (
                                        <div className="col-span-full text-center py-4">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                                            <p className="text-sm text-gray-500 mt-2">
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
                                                    className="flex items-center p-2 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
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
                                                        className="mr-2 text-primary focus:ring-primary"
                                                    />
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-medium">
                                                            {crop.name}
                                                        </span>
                                                        <span className="text-xs text-gray-500">
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
                                            className="mt-4 text-primary hover:text-primary-dark text-sm font-medium flex items-center gap-1"
                                        >
                                            <Icon
                                                icon={
                                                    showAllCrops
                                                        ? "mingcute:up-line"
                                                        : "mingcute:down-line"
                                                }
                                                width="16"
                                                height="16"
                                            />
                                            {showAllCrops
                                                ? "Show Less"
                                                : "Show More"}
                                        </button>
                                    )}

                                {errors.crops && (
                                    <p className="text-red-600 text-sm mt-1">
                                        {errors.crops}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        {errors.submit && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                                <p className="text-sm text-red-700">
                                    {errors.submit}
                                </p>
                            </div>
                        )}
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
                                    Submit Application for Verification
                                </>
                            )}
                        </button>
                        <p className="text-sm text-gray-600 text-center mt-3">
                            By submitting this application, you agree to our
                            terms and conditions for sellers on the Agrilink
                            platform. Your application will be reviewed by our
                            admin team.
                        </p>
                    </div>
                </form>
            </div>

            <NavigationBar />
        </div>
    );
}

export default SellerApplication;
