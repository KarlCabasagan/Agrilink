import { useState, useEffect, useContext } from "react";
import { Icon } from "@iconify/react";
import AdminNavigationBar from "../../components/AdminNavigationBar";
import ConfirmModal from "../../components/ConfirmModal";
import supabase from "../../SupabaseClient";
import { AuthContext } from "../../App";

function AdminCropManagement() {
    const { user } = useContext(AuthContext);
    // Initialize activeTab from localStorage or default to "crops"
    const [activeTab, setActiveTab] = useState(() => {
        return localStorage.getItem("adminCropManagementTab") || "crops";
    });
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showAddGuideModal, setShowAddGuideModal] = useState(false);
    const [showEditGuideModal, setShowEditGuideModal] = useState(false);
    const [showDeleteGuideModal, setShowDeleteGuideModal] = useState(false);
    const [selectedCrop, setSelectedCrop] = useState(null);
    const [selectedGuide, setSelectedGuide] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [originalCropData, setOriginalCropData] = useState(null);
    const [formErrors, setFormErrors] = useState({});
    const [showErrorToast, setShowErrorToast] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [isFormValid, setIsFormValid] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        category_id: "",
        icon: "",
        growing_season: "",
        harvest_time: "",
        market_demand: "",
        description: "",
        min_price: 0,
        max_price: 0,
    });

    // Effect to validate form on data changes
    useEffect(() => {
        if (showAddModal || showEditModal) {
            const isValid = validateForm();
            setIsFormValid(isValid);
        }
    }, [formData, showAddModal, showEditModal]);

    const [crops, setCrops] = useState([]);
    const [categories, setCategories] = useState([]);
    const [farmingGuides, setFarmingGuides] = useState([]);

    useEffect(() => {
        fetchCrops();
        fetchCategories();
        fetchFarmingGuides();
    }, []);

    const fetchFarmingGuides = async () => {
        const { data, error } = await supabase
            .from("farming_guides")
            .select("*, crop:crops(name)");

        if (error) {
            console.error("Error fetching farming guides:", error);
        } else {
            const formattedGuides = data.map((guide) => ({
                id: guide.id,
                name: guide.name,
                summary: guide.description,
                videoUrl: guide.url,
                crop_name: guide.crop ? guide.crop.name : "General",
                crop_id: guide.crop_id,
                addedDate: guide.created_at,
            }));
            setFarmingGuides(formattedGuides);
        }
    };

    const fetchCrops = async () => {
        // 1. Get total number of producers
        const { count: totalProducers, error: producersError } = await supabase
            .from("profiles")
            .select("id", { count: "exact", head: true })
            .eq("role_id", 2)
            .neq("id", user?.id);

        if (producersError) {
            console.error("Error fetching total producers:", producersError);
            return;
        }

        // 2. Get active plantings
        const { data: plantings, error: plantingsError } = await supabase
            .from("planted_crops")
            .select("crop_id")
            .eq("is_harvested", false);

        if (plantingsError) {
            console.error("Error fetching plantings:", plantingsError);
            return;
        }

        // Create a map of crop_id to planting count
        const plantingCounts = plantings.reduce((acc, { crop_id }) => {
            acc[crop_id] = (acc[crop_id] || 0) + 1;
            return acc;
        }, {});

        // 3. Fetch all crops
        const { data, error } = await supabase
            .from("crops")
            .select("*, category:categories(name)");

        if (error) {
            console.error("Error fetching crops:", error);
        } else {
            const formattedCrops = data.map((crop) => {
                const count = plantingCounts[crop.id] || 0;
                const percentage =
                    totalProducers > 0
                        ? Math.round((count / totalProducers) * 100)
                        : 0;
                return {
                    ...crop,
                    category: crop.category.name,
                    plantingPercentage: percentage, // Calculated percentage
                    lastUpdated: crop.updated_at,
                    demandLevel: crop.market_demand,
                    description: crop.description || "N/A",
                };
            });
            setCrops(formattedCrops);
        }
    };

    const fetchCategories = async () => {
        const { data, error } = await supabase.from("categories").select("*");
        if (error) {
            console.error("Error fetching categories:", error);
        } else {
            setCategories(data);
        }
    };

    const [guideFormData, setGuideFormData] = useState({
        name: "",
        description: "",
        url: "",
        crop_id: "",
    });
    const [guideFormErrors, setGuideFormErrors] = useState({});

    // Save active tab to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem("adminCropManagementTab", activeTab);
    }, [activeTab]);

    const resetForm = () => {
        setFormData({
            name: "",
            category_id: "",
            icon: "",
            growing_season: "",
            harvest_time: "",
            market_demand: "",
            description: "",
            min_price: 0,
            max_price: 0,
        });
        setFormErrors({});
        setShowErrorToast(false);
        setErrorMessage("");
    };

    const resetGuideForm = () => {
        setGuideFormData({
            name: "",
            description: "",
            url: "",
            crop_id: "",
        });
    };

    const handleAdd = () => {
        setShowAddModal(true);
        resetForm();
        setOriginalCropData(null);
    };

    const handleEdit = (crop) => {
        setSelectedCrop(crop);
        const initialData = {
            name: crop.name,
            category_id: crop.category_id,
            icon: crop.icon,
            growing_season: crop.growing_season,
            harvest_time: crop.harvest_time,
            market_demand: crop.market_demand,
            description: crop.description || "",
            min_price: crop.min_price || 0,
            max_price: crop.max_price || 0,
        };
        setFormData(initialData);
        setOriginalCropData(initialData);
        setShowEditModal(true);
    };

    const handleDelete = (crop) => {
        setSelectedCrop(crop);
        setShowDeleteModal(true);
    };

    const saveCrop = async () => {
        if (isSaving || !isFormValid) return;
        setIsSaving(true);

        try {
            const cropData = {
                name: formData.name,
                category_id: formData.category_id,
                icon: formData.icon,
                growing_season: formData.growing_season,
                harvest_time: formData.harvest_time,
                market_demand: formData.market_demand,
                description: formData.description,
                min_price: parseFloat(formData.min_price),
                max_price: parseFloat(formData.max_price),
                updated_at: new Date().toISOString(),
            };

            let error;
            if (selectedCrop) {
                const { error: updateError } = await supabase
                    .from("crops")
                    .update(cropData)
                    .eq("id", selectedCrop.id);
                error = updateError;
            } else {
                const { error: insertError } = await supabase
                    .from("crops")
                    .insert(cropData);
                error = insertError;
            }

            if (error) throw error;

            await fetchCrops();
            setShowAddModal(false);
            setShowEditModal(false);
            resetForm();
            setSelectedCrop(null);
        } catch (error) {
            console.error("Error saving crop:", error);
            setFormErrors({ submit: error.message });
        } finally {
            setIsSaving(false);
        }
    };

    const deleteCrop = async () => {
        if (!selectedCrop) return;
        const { error } = await supabase
            .from("crops")
            .delete()
            .eq("id", selectedCrop.id);

        if (error) {
            console.error("Error deleting crop:", error);
        } else {
            await fetchCrops();
            setShowDeleteModal(false);
            setSelectedCrop(null);
        }
    };

    // Farming Guide Handlers
    const handleAddGuide = () => {
        setShowAddGuideModal(true);
        resetGuideForm();
    };

    const handleEditGuide = (guide) => {
        setSelectedGuide(guide);
        setGuideFormData({
            name: guide.name,
            description: guide.summary,
            url: guide.videoUrl,
            crop_id: guide.crop_id,
        });
        setShowEditGuideModal(true);
    };

    const handleDeleteGuide = (guide) => {
        setSelectedGuide(guide);
        setShowDeleteGuideModal(true);
    };

    const saveGuide = async () => {
        const errors = {};
        if (!guideFormData.name) errors.name = "Guide name is required.";
        if (!guideFormData.url) {
            errors.url = "Video URL is required.";
        } else {
            try {
                new URL(guideFormData.url);
            } catch (_) {
                errors.url = "Please enter a valid URL.";
            }
        }
        if (!guideFormData.description)
            errors.description = "Summary is required.";
        if (guideFormData.crop_id === "")
            errors.crop_id = "Please select a crop or 'General'.";

        if (Object.keys(errors).length > 0) {
            setGuideFormErrors(errors);
            return;
        }
        setGuideFormErrors({});

        let error;
        const guideData = {
            name: guideFormData.name,
            description: guideFormData.description,
            url: guideFormData.url,
            crop_id:
                guideFormData.crop_id === "null" ? null : guideFormData.crop_id,
        };

        if (selectedGuide) {
            // Update
            const { error: updateError } = await supabase
                .from("farming_guides")
                .update(guideData)
                .eq("id", selectedGuide.id);
            error = updateError;
        } else {
            // Insert
            const { error: insertError } = await supabase
                .from("farming_guides")
                .insert(guideData);
            error = insertError;
        }

        if (error) {
            console.error("Error saving guide:", error);
        } else {
            await fetchFarmingGuides();
            setShowAddGuideModal(false);
            setShowEditGuideModal(false);
            resetGuideForm();
            setSelectedGuide(null);
        }
    };

    const confirmDeleteGuide = async () => {
        if (!selectedGuide) return;
        const { error } = await supabase
            .from("farming_guides")
            .delete()
            .eq("id", selectedGuide.id);

        if (error) {
            console.error("Error deleting guide:", error);
        } else {
            await fetchFarmingGuides();
            setShowDeleteGuideModal(false);
            setSelectedGuide(null);
        }
    };

    // Helper function to extract video ID from YouTube URL
    const getYouTubeVideoId = (url) => {
        const regExp =
            /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return match && match[2].length === 11 ? match[2] : null;
    };

    const getDemandColor = (demand) => {
        switch (demand) {
            case "Very High":
                return "bg-green-100 text-green-800";
            case "High":
                return "bg-blue-100 text-blue-800";
            case "Medium":
                return "bg-yellow-100 text-yellow-800";
            case "Low":
                return "bg-red-100 text-red-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    const getDifficultyColor = (difficulty) => {
        switch (difficulty) {
            case "Easy":
                return "bg-green-100 text-green-800";
            case "Medium":
                return "bg-yellow-100 text-yellow-800";
            case "Hard":
                return "bg-red-100 text-red-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    const getCompetitionColor = (competition) => {
        switch (competition) {
            case "Low":
                return "bg-green-100 text-green-800";
            case "Medium":
                return "bg-yellow-100 text-yellow-800";
            case "High":
                return "bg-red-100 text-red-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    const filteredCrops = crops.filter(
        (crop) =>
            crop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            crop.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getWaterRequirementColor = (requirement) => {
        switch (requirement.toLowerCase()) {
            case "low":
                return "bg-yellow-100 text-yellow-800 border-yellow-200";
            case "moderate":
                return "bg-blue-100 text-blue-800 border-blue-200";
            case "high":
                return "bg-green-100 text-green-800 border-green-200";
            default:
                return "bg-gray-100 text-gray-800 border-gray-200";
        }
    };

    const hasFormChanges = () => {
        if (!originalCropData && showAddModal) return true;
        if (!originalCropData) return false;

        return Object.keys(formData).some((key) => {
            if (key === "min_price" || key === "max_price") {
                return (
                    parseFloat(formData[key]) !==
                    parseFloat(originalCropData[key])
                );
            }
            return formData[key] !== originalCropData[key];
        });
    };

    const validatePrices = () => {
        const errors = {};
        const minPrice = parseFloat(formData.min_price);
        const maxPrice = parseFloat(formData.max_price);

        if (isNaN(minPrice)) {
            errors.min_price = "Please enter a valid number";
        } else if (minPrice < 0) {
            errors.min_price = "Price cannot be negative";
        }

        if (isNaN(maxPrice)) {
            errors.max_price = "Please enter a valid number";
        } else if (maxPrice < 0) {
            errors.max_price = "Price cannot be negative";
        }

        if (!errors.min_price && !errors.max_price && maxPrice < minPrice) {
            errors.max_price =
                "Maximum price must be greater than minimum price";
        }

        return errors;
    };

    const showError = (message) => {
        setErrorMessage(message);
        setShowErrorToast(true);
        setTimeout(() => setShowErrorToast(false), 5000);
    };

    const validateForm = () => {
        // Required fields except icon
        const requiredFields = [
            'name',
            'category_id',
            'growing_season',
            'harvest_time',
            'market_demand',
            'description'
        ];
        
        // Check if any required field is empty
        const hasEmptyFields = requiredFields.some(field => !formData[field]);
        if (hasEmptyFields) return false;

        // Validate price ranges
        const minPrice = parseFloat(formData.min_price);
        const maxPrice = parseFloat(formData.max_price);
        
        if (isNaN(minPrice) || isNaN(maxPrice) || 
            minPrice < 0 || maxPrice < 0 || 
            maxPrice < minPrice) {
            return false;
        }

        return true;
    };
    const renderCropCard = (crop) => (
        <div
            key={crop.id}
            className={`bg-white rounded-lg shadow-md overflow-hidden`}
        >
            <div className="p-6">
                {/* Header with Edit/Delete Buttons and Recommendation */}
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center">
                        <Icon icon={crop.icon} className="w-8 h-8 mr-3" />
                        <div>
                            <h3 className="text-xl font-semibold text-gray-900">
                                {crop.name}
                            </h3>
                            <div className="flex items-center gap-2">
                                <p className="text-sm text-gray-500">
                                    {crop.category}
                                </p>
                                {/* <span
                                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${crop.color}`}
                                >
                                    {crop.recommendation}
                                </span> */}
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleEdit(crop)}
                            className="inline-flex items-center p-1 text-blue-600 hover:text-blue-800 transition-colors"
                        >
                            <Icon
                                icon="mingcute:edit-line"
                                className="w-5 h-5"
                            />
                        </button>
                        <button
                            onClick={() => handleDelete(crop)}
                            className="inline-flex items-center p-1 text-red-600 hover:text-red-800 transition-colors"
                        >
                            <Icon
                                icon="mingcute:delete-line"
                                className="w-5 h-5"
                            />
                        </button>
                    </div>
                </div>

                {/* Description */}
                <div className="mb-4">
                    <p className="text-sm font-medium text-gray-500 mb-1">
                        Description
                    </p>
                    <p className="text-sm text-gray-600">{crop.description}</p>
                </div>

                {/* Market Information */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">
                            Market Demand
                        </p>
                        <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDemandColor(
                                crop.demandLevel
                            )}`}
                        >
                            {crop.demandLevel}
                        </span>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">
                            Competition Level
                        </p>
                        <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCompetitionColor(
                                crop.plantingPercentage
                            )}`}
                        >
                            {crop.plantingPercentage}% of farmers
                        </span>
                    </div>
                </div>

                {/* Crop Details Grid */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">
                            Growing Season
                        </p>
                        <div className="flex items-center">
                            <Icon
                                icon="mingcute:sun-line"
                                className="w-4 h-4 mr-1 text-gray-400"
                            />
                            <span className="text-sm text-gray-900">
                                {crop.growing_season}
                            </span>
                        </div>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">
                            Harvest Time
                        </p>
                        <div className="flex items-center">
                            <Icon
                                icon="mingcute:time-line"
                                className="w-4 h-4 mr-1 text-gray-400"
                            />
                            <span className="text-sm text-gray-900">
                                {crop.harvest_time}
                            </span>
                        </div>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">
                            Price Range
                        </p>
                        <div className="flex items-center">
                            <Icon
                                icon="mingcute:money-peso-line"
                                className="w-4 h-4 mr-1 text-gray-400"
                            />
                            <span className="text-sm text-gray-900">
                                ₱{crop.min_price.toFixed(2)} - ₱
                                {crop.max_price.toFixed(2)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Tips */}
                {/* <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">
                        Key Benefits
                    </p>
                    <p className="text-sm text-gray-600">{crop.tips}</p>
                </div> */}

                {/* Competition Bar */}
                <div className="mb-4">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Competition Level</span>
                        <span>{crop.plantingPercentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className={`h-2 rounded-full ${
                                crop.plantingPercentage <= 20
                                    ? "bg-primary"
                                    : crop.plantingPercentage <= 40
                                    ? "bg-yellow-500"
                                    : "bg-red-500"
                            }`}
                            style={{
                                width: `${crop.plantingPercentage}%`,
                            }}
                        ></div>
                    </div>
                </div>

                {/* Last Updated */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                        Last updated:{" "}
                        {new Date(crop.lastUpdated).toLocaleDateString()}
                    </p>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen w-full flex flex-col relative items-center scrollbar-hide bg-background overflow-x-hidden text-text pb-20">
            {/* Header */}
            <div className="fixed top-0 left-0 w-full bg-white shadow-md z-50 px-4 py-3">
                <h1 className="text-lg font-semibold text-primary text-center">
                    Crop Management
                </h1>
            </div>

            <div className="w-full max-w-6xl mx-4 sm:mx-auto my-16">
                {/* Tabs */}
                <div className="bg-white rounded-lg shadow-md mb-6 mt-4">
                    <div className="flex border-b border-gray-200">
                        <button
                            onClick={() => setActiveTab("crops")}
                            className={`flex-1 py-3 px-4 text-center font-medium transition-colors ${
                                activeTab === "crops"
                                    ? "text-primary border-b-2 border-primary"
                                    : "text-gray-600 hover:text-gray-800"
                            }`}
                        >
                            Crop Management
                        </button>
                        <button
                            onClick={() => setActiveTab("guides")}
                            className={`flex-1 py-3 px-4 text-center font-medium transition-colors ${
                                activeTab === "guides"
                                    ? "text-primary border-b-2 border-primary"
                                    : "text-gray-600 hover:text-gray-800"
                            }`}
                        >
                            Farming Guides
                        </button>
                    </div>
                </div>

                {/* Crops Tab */}
                {activeTab === "crops" && (
                    <>
                        {/* Search and Add Button */}
                        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                            <div className="flex flex-col sm:flex-row gap-4 items-center">
                                <div className="flex-1 relative">
                                    <Icon
                                        icon="mingcute:search-line"
                                        width="20"
                                        height="20"
                                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Search crops..."
                                        value={searchTerm}
                                        onChange={(e) =>
                                            setSearchTerm(e.target.value)
                                        }
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                    />
                                </div>
                                <button
                                    onClick={handleAdd}
                                    className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark transition-colors font-medium flex items-center gap-2"
                                >
                                    <Icon
                                        icon="mingcute:add-line"
                                        width="20"
                                        height="20"
                                    />
                                    Add New Crop
                                </button>
                            </div>
                        </div>

                        {/* Crops Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {filteredCrops.map(renderCropCard)}
                        </div>

                        {filteredCrops.length === 0 && (
                            <div className="bg-white rounded-lg shadow-md p-8 text-center">
                                <Icon
                                    icon="mingcute:leaf-line"
                                    width="64"
                                    height="64"
                                    className="mx-auto text-gray-300 mb-4"
                                />
                                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                                    No crops found
                                </h3>
                                <p className="text-gray-500">
                                    {searchTerm
                                        ? "Try adjusting your search terms"
                                        : "Start by adding your first crop"}
                                </p>
                            </div>
                        )}
                    </>
                )}

                {/* Farming Guides Tab */}
                {activeTab === "guides" && (
                    <>
                        {/* Search and Add Guide Button */}
                        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                            <div className="flex flex-col sm:flex-row gap-4 items-center">
                                <div className="relative flex-1">
                                    <Icon
                                        icon="mingcute:search-line"
                                        width="20"
                                        height="20"
                                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Search farming guides..."
                                        value={searchTerm}
                                        onChange={(e) =>
                                            setSearchTerm(e.target.value)
                                        }
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                                    />
                                </div>
                                <button
                                    onClick={handleAddGuide}
                                    className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-2"
                                >
                                    <Icon
                                        icon="mingcute:add-line"
                                        width="20"
                                        height="20"
                                    />
                                    Add New Guide
                                </button>
                            </div>
                        </div>

                        {/* Farming Guides Grid */}
                        {farmingGuides.filter(
                            (guide) =>
                                guide.name
                                    .toLowerCase()
                                    .includes(searchTerm.toLowerCase()) ||
                                guide.summary
                                    .toLowerCase()
                                    .includes(searchTerm.toLowerCase()) ||
                                guide.crop_name
                                    .toLowerCase()
                                    .includes(searchTerm.toLowerCase())
                        ).length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {farmingGuides
                                    .filter(
                                        (guide) =>
                                            guide.name
                                                .toLowerCase()
                                                .includes(
                                                    searchTerm.toLowerCase()
                                                ) ||
                                            guide.summary
                                                .toLowerCase()
                                                .includes(
                                                    searchTerm.toLowerCase()
                                                ) ||
                                            guide.crop_name
                                                .toLowerCase()
                                                .includes(
                                                    searchTerm.toLowerCase()
                                                )
                                    )
                                    .map((guide) => {
                                        const videoId = getYouTubeVideoId(
                                            guide.videoUrl
                                        );
                                        return (
                                            <div
                                                key={guide.id}
                                                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                                            >
                                                {/* Video Thumbnail */}
                                                <div className="relative h-48 bg-gray-200">
                                                    {videoId ? (
                                                        <iframe
                                                            src={`https://www.youtube.com/embed/${videoId}`}
                                                            title={guide.name}
                                                            className="w-full h-full"
                                                            frameBorder="0"
                                                            allowFullScreen
                                                        ></iframe>
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <Icon
                                                                icon="mingcute:video-line"
                                                                width="48"
                                                                height="48"
                                                                className="text-gray-400"
                                                            />
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Guide Info */}
                                                <div className="p-4">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <h3 className="text-lg font-semibold text-gray-800 leading-tight">
                                                            {guide.name}
                                                        </h3>
                                                    </div>

                                                    <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                                                        {guide.summary}
                                                    </p>

                                                    <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                                                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                                                            {guide.crop_name}
                                                        </span>
                                                        <span>
                                                            Added:{" "}
                                                            {new Date(
                                                                guide.addedDate
                                                            ).toLocaleDateString()}
                                                        </span>
                                                    </div>

                                                    {/* Action Buttons */}
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() =>
                                                                handleEditGuide(
                                                                    guide
                                                                )
                                                            }
                                                            className="flex-1 bg-blue-600 text-white py-2 px-3 rounded text-sm hover:bg-blue-700 transition-colors"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() =>
                                                                handleDeleteGuide(
                                                                    guide
                                                                )
                                                            }
                                                            className="flex-1 bg-red-600 text-white py-2 px-3 rounded text-sm hover:bg-red-700 transition-colors"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        ) : (
                            <div className="bg-white rounded-lg shadow-md p-12 text-center">
                                <Icon
                                    icon="mingcute:video-line"
                                    width="64"
                                    height="64"
                                    className="mx-auto text-gray-300 mb-4"
                                />
                                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                                    No Farming Guides Found
                                </h3>
                                <p className="text-gray-500">
                                    {searchTerm
                                        ? "Try adjusting your search terms"
                                        : "Start by adding your first farming guide"}
                                </p>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Add/Edit Modal */}
            {(showAddModal || showEditModal) && (
                <>
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black opacity-50"></div>
                    <div className="bg-white rounded-lg shadow-xl p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto fixed top-1/12 left-1/2 transform -translate-x-1/2 -translate-y-1 z-[10000]">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-semibold text-gray-800">
                                {showAddModal ? "Add New Crop" : "Edit Crop"}
                            </h2>
                            <button
                                onClick={() => {
                                    setShowAddModal(false);
                                    setShowEditModal(false);
                                    resetForm();
                                }}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <Icon
                                    icon="mingcute:close-line"
                                    width="24"
                                    height="24"
                                />
                            </button>
                        </div>

                        {Object.keys(formErrors).length > 0 && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg">
                                <div className="flex items-center text-red-600 text-sm">
                                    <Icon
                                        icon="mingcute:warning-fill"
                                        className="w-5 h-5 mr-2"
                                    />
                                    <span>
                                        Please correct the following errors:
                                    </span>
                                </div>
                                <ul className="mt-2 list-disc list-inside text-sm text-red-600">
                                    {Object.values(formErrors).map(
                                        (error, index) => (
                                            <li key={index}>{error}</li>
                                        )
                                    )}
                                </ul>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Crop Name *
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            name: e.target.value,
                                        })
                                    }
                                    className="w-full px-3 py-3 border border-gray-300 rounded-lg text-base outline-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Category *
                                </label>
                                <select
                                    value={formData.category_id}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            category_id: e.target.value,
                                        })
                                    }
                                    className="w-full px-3 py-3 border border-gray-300 rounded-lg text-base outline-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                    required
                                >
                                    <option value="">Select Category</option>
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Icon
                                    <button
                                        type="button"
                                        className="ml-2 text-gray-400 hover:text-gray-600"
                                        title="Enter an iconify icon name (e.g., twemoji:tomato). Visit https://icon-sets.iconify.design/twemoji/ to browse available icons."
                                    >
                                        <Icon
                                            icon="mingcute:question-line"
                                            width="16"
                                            height="16"
                                        />
                                    </button>
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={formData.icon}
                                        onChange={(e) => {
                                            setFormData({
                                                ...formData,
                                                icon: e.target.value,
                                            });
                                            if (formErrors.icon) {
                                                setFormErrors({
                                                    ...formErrors,
                                                    icon: null,
                                                });
                                            }
                                        }}
                                        placeholder="e.g., twemoji:tomato"
                                        className="w-full pl-3 pr-12 py-3 border border-gray-300 rounded-lg text-base outline-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                    />
                                    {formData.icon && (
                                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                            <Icon
                                                icon={formData.icon}
                                                className="w-6 h-6"
                                                onError={() => {
                                                    setFormErrors({
                                                        ...formErrors,
                                                        icon: "Invalid icon name",
                                                    });
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>
                                {formErrors.icon && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {formErrors.icon}
                                    </p>
                                )}
                                <p className="text-xs text-gray-500 mt-1">
                                    Browse icons at:{" "}
                                    <a
                                        href="https://icon-sets.iconify.design/twemoji/"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-800"
                                    >
                                        https://icon-sets.iconify.design/twemoji/
                                    </a>
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Growing Season *
                                </label>
                                <select
                                    value={formData.growing_season}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            growing_season: e.target.value,
                                        })
                                    }
                                    className="w-full px-3 py-3 border border-gray-300 rounded-lg text-base outline-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                    required
                                >
                                    <option value="">Select Season</option>
                                    <option value="Dry Season">
                                        Dry Season
                                    </option>
                                    <option value="Wet Season">
                                        Wet Season
                                    </option>
                                    <option value="Cool Season">
                                        Cool Season
                                    </option>
                                    <option value="Year Round">
                                        Year Round
                                    </option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Harvest Time *
                                </label>
                                <input
                                    type="text"
                                    value={formData.harvest_time}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            harvest_time: e.target.value,
                                        })
                                    }
                                    placeholder="e.g., 1-2 months"
                                    className="w-full px-3 py-3 border border-gray-300 rounded-lg text-base outline-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Market Demand *
                                </label>
                                <select
                                    value={formData.market_demand}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            market_demand: e.target.value,
                                        })
                                    }
                                    className="w-full px-3 py-3 border border-gray-300 rounded-lg text-base outline-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                    required
                                >
                                    <option value="">Select Demand</option>
                                    <option value="Low">Low</option>
                                    <option value="Medium">Medium</option>
                                    <option value="High">High</option>
                                    <option value="Very High">Very High</option>
                                </select>
                            </div>

                            {/* Price Range Fields */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Minimum Price (₱) *
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.min_price}
                                        onChange={(e) => {
                                            setFormData({
                                                ...formData,
                                                min_price: e.target.value,
                                            });
                                            // Clear error when user starts typing
                                            if (formErrors.min_price) {
                                                setFormErrors({
                                                    ...formErrors,
                                                    min_price: null,
                                                });
                                            }
                                        }}
                                        className={`w-full px-3 py-3 border rounded-lg text-base outline-none focus:outline-none focus:ring-2 transition-all ${
                                            formErrors.min_price
                                                ? "border-red-500 focus:border-red-500 focus:ring-red-200"
                                                : "border-gray-300 focus:ring-primary focus:border-primary"
                                        }`}
                                        required
                                    />
                                    {formErrors.min_price && (
                                        <p className="mt-1 text-sm text-red-600">
                                            {formErrors.min_price}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Maximum Price (₱) *
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.max_price}
                                        onChange={(e) => {
                                            setFormData({
                                                ...formData,
                                                max_price: e.target.value,
                                            });
                                            // Clear error when user starts typing
                                            if (formErrors.max_price) {
                                                setFormErrors({
                                                    ...formErrors,
                                                    max_price: null,
                                                });
                                            }
                                        }}
                                        className={`w-full px-3 py-3 border rounded-lg text-base outline-none focus:outline-none focus:ring-2 transition-all ${
                                            formErrors.max_price
                                                ? "border-red-500 focus:border-red-500 focus:ring-red-200"
                                                : "border-gray-300 focus:ring-primary focus:border-primary"
                                        }`}
                                        required
                                    />
                                    {formErrors.max_price && (
                                        <p className="mt-1 text-sm text-red-600">
                                            {formErrors.max_price}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Description *
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            description: e.target.value,
                                        })
                                    }
                                    rows="3"
                                    className="w-full px-3 py-3 border border-gray-300 rounded-lg text-base outline-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 mt-6">
                            <button
                                onClick={() => {
                                    setShowAddModal(false);
                                    setShowEditModal(false);
                                    resetForm();
                                }}
                                className="flex-1 text-center bg-gray-100 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={saveCrop}
                                disabled={
                                    isSaving ||
                                    (showAddModal && !isFormValid) ||
                                    (!showAddModal && !hasFormChanges())
                                }
                                className={`flex-1 px-4 py-3 rounded-lg transition-all font-medium flex items-center justify-center ${
                                    isSaving ||
                                    (showAddModal && !isFormValid) ||
                                    (!showAddModal && !hasFormChanges())
                                        ? 'bg-gray-300 cursor-not-allowed'
                                        : 'bg-primary text-white hover:bg-primary-dark'
                                }`}
                            >
                                {isSaving ? (
                                    <>
                                        <Icon
                                            icon="mingcute:loading-line"
                                            className="animate-spin w-5 h-5 mr-2"
                                        />
                                        {showAddModal ? "Adding..." : "Saving..."}
                                    </>
                                ) : (
                                    <>
                                        <Icon
                                            icon={
                                                showAddModal
                                                    ? "mingcute:add-line"
                                                    : "mingcute:save-line"
                                            }
                                            className="w-5 h-5 mr-2"
                                        />
                                        {showAddModal
                                            ? "Add Crop"
                                            : "Save Changes"}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <ConfirmModal
                    open={showDeleteModal}
                    onClose={() => setShowDeleteModal(false)}
                    onConfirm={deleteCrop}
                    title="Delete Crop"
                    message={`Are you sure you want to delete "${selectedCrop?.name}"? This action cannot be undone.`}
                    confirmText="Delete"
                    confirmButtonClass="bg-red-600 hover:bg-red-700"
                />
            )}

            {/* Add/Edit Guide Modal */}
            {(showAddGuideModal || showEditGuideModal) && (
                <>
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black opacity-50"></div>
                    <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto fixed top-1/12 left-1/2 transform -translate-x-1/2 -translate-y-1 z-[10000]">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-semibold text-gray-800">
                                {showAddGuideModal
                                    ? "Add New Farming Guide"
                                    : "Edit Farming Guide"}
                            </h2>
                            <button
                                onClick={() => {
                                    setShowAddGuideModal(false);
                                    setShowEditGuideModal(false);
                                    resetGuideForm();
                                }}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <Icon
                                    icon="mingcute:close-line"
                                    width="24"
                                    height="24"
                                />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Guide Name *
                                </label>
                                <input
                                    type="text"
                                    value={guideFormData.name}
                                    onChange={(e) =>
                                        setGuideFormData({
                                            ...guideFormData,
                                            name: e.target.value,
                                        })
                                    }
                                    className={`w-full px-3 py-3 border rounded-lg text-base outline-none focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                                        guideFormErrors.name
                                            ? "border-red-500 ring-red-500"
                                            : "border-gray-300 focus:ring-primary"
                                    }`}
                                    required
                                />
                                {guideFormErrors.name && (
                                    <p className="text-red-500 text-xs mt-1">
                                        {guideFormErrors.name}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Crop *
                                </label>
                                <select
                                    value={guideFormData.crop_id}
                                    onChange={(e) =>
                                        setGuideFormData({
                                            ...guideFormData,
                                            crop_id: e.target.value,
                                        })
                                    }
                                    className={`w-full px-3 py-3 border rounded-lg text-base outline-none focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                                        guideFormErrors.crop_id
                                            ? "border-red-500 ring-red-500"
                                            : "border-gray-300 focus:ring-primary"
                                    }`}
                                    required
                                >
                                    <option value="">Select Crop</option>
                                    <option value="null">General</option>
                                    {crops.map((crop) => (
                                        <option key={crop.id} value={crop.id}>
                                            {crop.name}
                                        </option>
                                    ))}
                                </select>
                                {guideFormErrors.crop_id && (
                                    <p className="text-red-500 text-xs mt-1">
                                        {guideFormErrors.crop_id}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Video URL *
                                </label>
                                <input
                                    type="url"
                                    value={guideFormData.url}
                                    onChange={(e) =>
                                        setGuideFormData({
                                            ...guideFormData,
                                            url: e.target.value,
                                        })
                                    }
                                    placeholder="https://www.youtube.com/watch?v=..."
                                    className={`w-full px-3 py-3 border rounded-lg text-base outline-none focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                                        guideFormErrors.url
                                            ? "border-red-500 ring-red-500"
                                            : "border-gray-300 focus:ring-primary"
                                    }`}
                                    required
                                />
                                {guideFormErrors.url && (
                                    <p className="text-red-500 text-xs mt-1">
                                        {guideFormErrors.url}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Summary *
                                </label>
                                <textarea
                                    value={guideFormData.description}
                                    onChange={(e) =>
                                        setGuideFormData({
                                            ...guideFormData,
                                            description: e.target.value,
                                        })
                                    }
                                    rows="4"
                                    className={`w-full px-3 py-3 border rounded-lg text-base outline-none focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                                        guideFormErrors.description
                                            ? "border-red-500 ring-red-500"
                                            : "border-gray-300 focus:ring-primary"
                                    }`}
                                    required
                                />
                                {guideFormErrors.description && (
                                    <p className="text-red-500 text-xs mt-1">
                                        {guideFormErrors.description}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 mt-6">
                            <button
                                onClick={() => {
                                    setShowAddGuideModal(false);
                                    setShowEditGuideModal(false);
                                    resetGuideForm();
                                }}
                                className="flex-1 text-center bg-gray-100 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={saveGuide}
                                className="flex-1 px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium"
                            >
                                {showAddGuideModal
                                    ? "Add Guide"
                                    : "Save Changes"}
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* Delete Guide Confirmation Modal */}
            {showDeleteGuideModal && (
                <ConfirmModal
                    open={showDeleteGuideModal}
                    onClose={() => setShowDeleteGuideModal(false)}
                    onConfirm={confirmDeleteGuide}
                    title="Delete Farming Guide"
                    message={`Are you sure you want to delete "${selectedGuide?.name}"? This action cannot be undone.`}
                    confirmText="Delete"
                    confirmButtonClass="bg-red-600 hover:bg-red-700"
                />
            )}

            <AdminNavigationBar />

            {/* Error Toast */}
            {showErrorToast && (
                <div className="fixed bottom-4 right-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg shadow-lg transition-all duration-500 ease-in-out transform translate-y-0 opacity-100">
                    <div className="flex items-center">
                        <Icon
                            icon="mingcute:warning-fill"
                            className="w-5 h-5 mr-2"
                        />
                        <p>{errorMessage}</p>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminCropManagement;
