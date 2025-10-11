import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { useNavigate, Link } from "react-router-dom";
import NavigationBar from "../../components/NavigationBar";
import supabase from "../../SupabaseClient";
import ValidIdUpload from "../../components/ValidIdUpload";

function SellerApplication() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [validId, setValidId] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [showAllCrops, setShowAllCrops] = useState(false);
    const [userData, setUserData] = useState(null);
    const [cropsData, setCropsData] = useState([]);
    const [loadingCrops, setLoadingCrops] = useState(true);

    const [formData, setFormData] = useState({
        crops: [],
        experience: "",
    });

    const [errors, setErrors] = useState({});

    useEffect(() => {
        const fetchCrops = async () => {
            const { data, error } = await supabase
                .from('crops')
                .select('id, name, category_id, market_demand')
                .order('name');
            
            if (error) {
                console.error('Error fetching crops:', error);
                return;
            }
            
            setCropsData(data);
            setLoadingCrops(false);
        };

        fetchCrops();
    }, []);

    useEffect(() => {
        const getUserData = async () => {
            const {
                data: { session },
            } = await supabase.auth.getSession();
            if (!session) {
                navigate("/login");
                return;
            }

            const { data, error } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", session.user.id)
                .single();

            if (error) {
                console.error("Error fetching user data:", error);
                return;
            }

            setUserData(data);
        };

        getUserData();
    }, [navigate]);

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

        if (!formData.experience.trim())
            newErrors.experience = "Experience is required";
        if (formData.crops.length === 0)
            newErrors.crops = "Please select at least one crop";
        if (!validId) newErrors.validId = "Please upload a valid ID";

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
            const {
                data: { session },
            } = await supabase.auth.getSession();
            if (!session) {
                throw new Error("Not authenticated");
            }

            // Create seller application record
            const { data: appData, error: appError } = await supabase
                .from("seller_applications")
                .insert([{
                    user_id: session.user.id,
                    experience: formData.experience,
                    valid_id_url: validId,
                    status: 'pending'
                }])
                .select()
                .single();

            if (appError) throw appError;

            // Insert crop associations
            if (formData.crops.length > 0) {
                const { error: cropError } = await supabase
                    .from("application_crops")
                    .insert(
                        formData.crops.map(cropId => ({
                            application_id: appData.id,
                            crop_id: cropId
                        }))
                    );

                if (cropError) throw cropError;
            }

            // Update user's role to producer (pending verification)
            const { error: updateError } = await supabase
                .from("profiles")
                .update({
                    role_id: 2, // Producer role
                    producer_verified: false,
                    valid_id_url: validId,
                })
                .eq("id", session.user.id);

            if (updateError) {
                throw updateError;
            }

            setShowSuccess(true);
            setTimeout(() => {
                navigate("/profile");
            }, 3000);
        } catch (error) {
            console.error("Error submitting application:", error);
            setErrors({
                submit: "Failed to submit application. Please try again.",
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
                                You will receive an email notification once your
                                application has been verified.
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
                                    currentImage={validId}
                                    onImageChange={setValidId}
                                    userId={userData?.id}
                                    className="w-full"
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
                                            <p className="text-sm text-gray-500 mt-2">Loading crops...</p>
                                        </div>
                                    ) : cropsData
                                        .filter((crop) =>
                                            crop.name
                                                .toLowerCase()
                                                .includes(
                                                    searchQuery.toLowerCase()
                                                )
                                        )
                                        .slice(0, showAllCrops ? undefined : 6)
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
                                                        handleCropToggle(crop.id)
                                                    }
                                                    className="mr-2 text-primary focus:ring-primary"
                                                />
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium">
                                                        {crop.name}
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        Demand: {crop.market_demand}
                                                    </span>
                                                </div>
                                            </label>
                                        ))}
                                </div>

                                {/* Show More/Less Button */}
                                {!loadingCrops && cropsData.filter((crop) =>
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
