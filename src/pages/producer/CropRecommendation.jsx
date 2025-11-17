import { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import ProducerNavigationBar from "../../components/ProducerNavigationBar";
import { AuthContext } from "../../App";
import supabase from "../../SupabaseClient";

function CropRecommendation() {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("recommendations");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [sortBy, setSortBy] = useState("recommendation");
    const [selectedRecommendation, setSelectedRecommendation] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [plantedCrops, setPlantedCrops] = useState([]);
    const [confirmingCrop, setConfirmingCrop] = useState(null);
    const [confirmingHarvest, setConfirmingHarvest] = useState(null);
    const [myCropsSubTab, setMyCropsSubTab] = useState("growing");
    const [crops, setCrops] = useState([]);
    const [categories, setCategories] = useState(["All"]);
    const [loading, setLoading] = useState(true);
    const [totalProducers, setTotalProducers] = useState(0);
    const [plantingCounts, setPlantingCounts] = useState({});
    const [
        displayedCompetitionPercentages,
        setDisplayedCompetitionPercentages,
    ] = useState({});

    const fetchInitialData = async () => {
        if (!user) return;
        setLoading(true);
        await Promise.all([
            fetchCropsAndCompetition(),
            fetchPlantedCrops(),
            fetchCategories(),
        ]);
        setLoading(false);
    };

    useEffect(() => {
        fetchInitialData();
    }, [user]);

    const fetchCropsAndCompetition = async () => {
        if (!user) return;

        // Get total number of producers excluding current user
        const { count: totalProducers, error: producersError } = await supabase
            .from("profiles")
            .select("id", { count: "exact", head: true })
            .eq("role_id", 2)
            .neq("id", user.id);

        if (producersError) {
            console.error("Error fetching total producers:", producersError);
            return;
        }

        // Get plantings excluding the current user's plantings
        const { data: plantings, error: plantingsError } = await supabase
            .from("planted_crops")
            .select("crop_id, user_id")
            .eq("is_harvested", false)
            .neq("user_id", user.id);

        if (plantingsError) {
            console.error("Error fetching plantings:", plantingsError);
            return;
        }

        // Count plantings by other farmers only
        const plantingCounts = plantings.reduce((acc, { crop_id }) => {
            acc[crop_id] = (acc[crop_id] || 0) + 1;
            return acc;
        }, {});

        // Store totalProducers and plantingCounts in state for reuse
        setTotalProducers(totalProducers);
        setPlantingCounts(plantingCounts);

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
                const demandLevel = crop.market_demand || "Medium";
                const { recommendation, color } =
                    getRecommendationFromPercentage(percentage, demandLevel);

                return {
                    ...crop,
                    category: crop.category.name,
                    plantingPercentage: percentage,
                    demandLevel: demandLevel,
                    season: crop.growing_season,
                    harvestTime: crop.harvest_time,
                    description: crop.description,
                    benefits: crop.benefits || [],
                    recommendation,
                    color,
                };
            });
            setCrops(formattedCrops);
        }
    };

    const fetchPlantedCrops = async () => {
        if (!user) return;
        const { data, error } = await supabase
            .from("planted_crops")
            .select("*, crop:crops(*, category:categories(name))")
            .eq("user_id", user.id);

        if (error) {
            console.error("Error fetching planted crops:", error);
        } else {
            const formatted = data.map((pc) => ({
                ...pc.crop,
                id: pc.id, // Use planted_crop id as the unique key
                planted_id: pc.id,
                plantedDate: pc.created_at,
                harvestDate: pc.is_harvested ? pc.updated_at : null,
                category: pc.crop.category.name,
            }));
            setPlantedCrops(formatted);
        }
    };

    const fetchCategories = async () => {
        const { data, error } = await supabase
            .from("categories")
            .select("name");
        if (error) {
            console.error("Error fetching categories:", error);
        } else {
            const categoryNames = data.map((c) => c.name);
            setCategories(["All", ...new Set(categoryNames)]);
        }
    };

    const handleRecommendationToggle = (recommendation) => {
        if (selectedRecommendation === recommendation) {
            // If clicking the same recommendation, toggle it off (show all)
            setSelectedRecommendation(null);
        } else {
            // Set the selected recommendation
            setSelectedRecommendation(recommendation);
        }
    };

    const handlePlantCrop = (crop) => {
        setConfirmingCrop(crop);
    };

    const isCropAlreadyPlanted = (cropName) => {
        return plantedCrops.some(
            (plantedCrop) =>
                plantedCrop.name === cropName && !plantedCrop.harvestDate
        );
    };

    const confirmPlantCrop = async () => {
        if (!confirmingCrop || !user) return;

        // Optimistic Update: Create a temporary representation with the same shape
        // as objects returned by fetchPlantedCrops
        const now = new Date().toISOString();
        const tempId = Date.now(); // Temporary unique ID for this optimistic update
        const newPlantedCrop = {
            ...confirmingCrop, // Spread all crop fields (name, icon, harvest_time, etc.)
            id: tempId, // Use temporary unique ID as the key
            planted_id: tempId, // Track the temporary planted_crop id
            plantedDate: now, // Set to current time
            harvestDate: null, // Not yet harvested
            // category is already included from confirmingCrop spread
        };

        // Immediately update the state and UI
        setPlantedCrops((prevPlantedCrops) => [
            ...prevPlantedCrops,
            newPlantedCrop,
        ]);
        setActiveTab("my-crops");
        setMyCropsSubTab("growing");
        setConfirmingCrop(null);

        // Send the actual request to the database
        const { error } = await supabase
            .from("planted_crops")
            .insert({ user_id: user.id, crop_id: confirmingCrop.id });

        if (error) {
            console.error("Error planting crop:", error);
            // If there's an error, revert the optimistic update
            setPlantedCrops((prevPlantedCrops) =>
                prevPlantedCrops.filter((p) => p.id !== tempId)
            );
        }

        // Silently refetch data from the server to sync the real ID and timestamp
        await fetchInitialData();
    };

    const cancelPlantCrop = () => {
        setConfirmingCrop(null);
    };

    // Helper function to calculate days planted with robust date handling
    const calculateDaysSincePlanted = (plantedDateStr) => {
        // Return 0 if plantedDate is missing or invalid
        if (!plantedDateStr) {
            return 0;
        }

        try {
            // Parse the planted date
            const plantedDate = new Date(plantedDateStr);

            // Check if date is valid
            if (isNaN(plantedDate.getTime())) {
                return 0;
            }

            // Normalize both dates to start of calendar day (00:00:00)
            const today = new Date();
            const normalizedPlanted = new Date(
                plantedDate.getFullYear(),
                plantedDate.getMonth(),
                plantedDate.getDate(),
                0,
                0,
                0,
                0
            );
            const normalizedToday = new Date(
                today.getFullYear(),
                today.getMonth(),
                today.getDate(),
                0,
                0,
                0,
                0
            );

            // Calculate difference in milliseconds and convert to days
            const diffInMs = normalizedToday - normalizedPlanted;
            const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

            // Clamp to 0 to handle timezone quirks or just-planted records
            return Math.max(0, diffInDays);
        } catch (error) {
            console.error("Error calculating days since planted:", error);
            return 0;
        }
    };

    const handleHarvestCrop = (plantedCropId) => {
        setConfirmingHarvest(plantedCropId);
    };

    const confirmHarvestCrop = async () => {
        if (!confirmingHarvest) return;

        // Resolve the harvested planted crop from plantedCrops by matching planted_id/id
        const harvestedCrop = plantedCrops.find(
            (pc) =>
                pc.planted_id === confirmingHarvest ||
                pc.id === confirmingHarvest
        );

        const { error } = await supabase
            .from("planted_crops")
            .update({
                is_harvested: true,
                updated_at: new Date().toISOString(),
            })
            .eq("id", confirmingHarvest);

        if (error) {
            console.error("Error harvesting crop:", error);
        } else {
            await fetchPlantedCrops();
            await fetchCropsAndCompetition(); // Refresh competition stats

            // Navigate to ProducerHome with modal flag and pre-fill data
            if (harvestedCrop) {
                navigate("/", {
                    state: {
                        openAddModal: true,
                        prefilledCropType: harvestedCrop.name,
                    },
                });
            }
        }
        setConfirmingHarvest(null);
    };

    const cancelHarvestCrop = () => {
        setConfirmingHarvest(null);
    };

    const searchCrops = (cropsToSearch) => {
        if (!searchTerm) return cropsToSearch;

        return cropsToSearch.filter(
            (crop) =>
                crop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                crop.category
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase()) ||
                (crop.description &&
                    crop.description
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase())) ||
                (crop.benefits &&
                    crop.benefits.some((benefit) =>
                        benefit.toLowerCase().includes(searchTerm.toLowerCase())
                    ))
        );
    };

    const filteredCrops = searchCrops(
        crops
            .filter(
                (crop) =>
                    selectedCategory === "All" ||
                    crop.category === selectedCategory
            )
            .filter(
                (crop) =>
                    !selectedRecommendation ||
                    crop.recommendation === selectedRecommendation
            )
    ).sort((a, b) => {
        if (sortBy === "recommendation") {
            const order = {
                "Highly Recommended": 1,
                Recommended: 2,
                "Consider Carefully": 3,
                "Caution Advised": 4,
            };
            // Primary sort: by recommendation level
            const recDiff = order[a.recommendation] - order[b.recommendation];
            if (recDiff !== 0) return recDiff;

            // Secondary sort: by opportunity score (descending, higher score first)
            // Calculate opportunity score using same weights as getRecommendationFromPercentage
            const demandMap = {
                "Very High": 1.0,
                High: 0.8,
                Medium: 0.5,
                Low: 0.2,
            };

            const getOpportunityScore = (crop) => {
                const demandScore = demandMap[crop.demandLevel] || 0.5;
                const competitionScore = 1 - crop.plantingPercentage / 100;
                return demandScore * 0.6 + competitionScore * 0.4;
            };

            const scoreA = getOpportunityScore(a);
            const scoreB = getOpportunityScore(b);
            const scoreDiff = scoreB - scoreA; // Descending order (higher score first)
            if (scoreDiff !== 0) return scoreDiff;

            // Tie-break: by crop name (stable sort)
            return a.name.localeCompare(b.name);
        }
        if (sortBy === "demand") {
            const order = { "Very High": 1, High: 2, Medium: 3, Low: 4 };
            return order[a.demandLevel] - order[b.demandLevel];
        }
        if (sortBy === "competition") {
            return a.plantingPercentage - b.plantingPercentage;
        }
        if (sortBy === "available") {
            const aPlanted = isCropAlreadyPlanted(a.name);
            const bPlanted = isCropAlreadyPlanted(b.name);
            if (aPlanted && !bPlanted) return 1;
            if (!aPlanted && bPlanted) return -1;
            return 0;
        }
        return 0;
    });

    const getRecommendationIcon = (recommendation) => {
        switch (recommendation) {
            case "Highly Recommended":
                return "mingcute:star-fill";
            case "Recommended":
                return "mingcute:thumb-up-fill";
            case "Consider Carefully":
                return "mingcute:question-fill";
            case "Caution Advised":
                return "mingcute:alert-fill";
            default:
                return "mingcute:question-fill";
        }
    };

    const getDemandColor = (level) => {
        switch (level) {
            case "Very High":
                return "text-green-600";
            case "High":
                return "text-blue-600";
            case "Medium":
                return "text-yellow-600";
            case "Low":
                return "text-red-600";
            default:
                return "text-gray-600";
        }
    };

    const getCompetitionColor = (percentage) => {
        if (percentage <= 20) return "text-green-600";
        if (percentage <= 40) return "text-blue-600";
        if (percentage <= 60) return "text-yellow-600";
        return "text-red-600";
    };

    // Enhanced helper function to compute recommendation from weighted demand and competition
    const getRecommendationFromPercentage = (
        plantingPercentage,
        demandLevel
    ) => {
        // Map demand level to score (0-1, where 1 is best)
        const demandMap = {
            "Very High": 1.0,
            High: 0.8,
            Medium: 0.5,
            Low: 0.2,
        };
        const demandScore = demandMap[demandLevel] || 0.5;

        // Map competition percentage to score (0-1, where 1 is best/low competition)
        const competitionScore = 1 - plantingPercentage / 100;

        // Weighted opportunity score: demand 60%, competition 40%
        const opportunityScore = demandScore * 0.6 + competitionScore * 0.4;

        let recommendation = "Consider Carefully";
        let color = "bg-yellow-100 text-yellow-800 border-yellow-200";

        // Determine recommendation based on combined opportunity score
        if (opportunityScore >= 0.75) {
            // High demand, low/medium competition
            recommendation = "Highly Recommended";
            color = "bg-green-100 text-green-800 border-green-200";
        } else if (opportunityScore >= 0.55) {
            // Good mix of demand and reasonable competition
            recommendation = "Recommended";
            color = "bg-blue-100 text-blue-800 border-blue-200";
        } else if (opportunityScore >= 0.35) {
            // Low demand with medium competition or low demand with low competition
            recommendation = "Consider Carefully";
            color = "bg-yellow-100 text-yellow-800 border-yellow-200";
        } else {
            // Low demand with high competition
            recommendation = "Caution Advised";
            color = "bg-red-100 text-red-800 border-red-200";
        }

        return { recommendation, color };
    };

    // Effect to update displayed competition percentages for animation
    useEffect(() => {
        setDisplayedCompetitionPercentages((prevDisplayed) => {
            const newDisplayed = { ...prevDisplayed };
            crops.forEach((crop) => {
                // Initialize or update to the current plantingPercentage
                if (newDisplayed[crop.id] === undefined) {
                    newDisplayed[crop.id] = crop.plantingPercentage;
                } else {
                    newDisplayed[crop.id] = crop.plantingPercentage;
                }
            });
            return newDisplayed;
        });
    }, [crops]);

    // Real-time subscription for crop competition updates
    useEffect(() => {
        if (!user?.id) return;

        const channel = supabase
            .channel(`crop-competition-${user.id}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "planted_crops",
                },
                (payload) => {
                    const eventUserId =
                        payload.new?.user_id ?? payload.old?.user_id;

                    if (!eventUserId || eventUserId === user.id) return;

                    fetchCropsAndCompetition();
                }
            )
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "crops",
                },
                (payload) => {
                    const eventType = payload.eventType;

                    setCrops((prevCrops) =>
                        prevCrops
                            .map((crop) => {
                                if (
                                    eventType === "DELETE" &&
                                    crop.id === payload.old?.id
                                ) {
                                    return null; // Mark for removal
                                }

                                if (eventType === "INSERT" && payload.new?.id) {
                                    // Handle new crop insertion if needed
                                    return crop;
                                }

                                if (
                                    eventType === "UPDATE" &&
                                    crop.id === payload.new?.id
                                ) {
                                    // Merge updated crop fields while preserving competition metrics
                                    return {
                                        ...crop,
                                        ...(payload.new?.name && {
                                            name: payload.new.name,
                                        }),
                                        ...(payload.new?.market_demand && {
                                            demandLevel:
                                                payload.new.market_demand,
                                        }),
                                        ...(payload.new?.growing_season && {
                                            season: payload.new.growing_season,
                                        }),
                                        ...(payload.new?.harvest_time && {
                                            harvestTime:
                                                payload.new.harvest_time,
                                        }),
                                        ...(payload.new?.description && {
                                            description:
                                                payload.new.description,
                                        }),
                                        ...(payload.new?.icon && {
                                            icon: payload.new.icon,
                                        }),
                                    };
                                }

                                return crop;
                            })
                            .filter((crop) => crop !== null)
                    );
                }
            )
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "profiles",
                },
                (payload) => {
                    // Ignore current user's profile changes
                    if (
                        payload.new?.id === user.id ||
                        payload.old?.id === user.id
                    )
                        return;

                    // For any other profile event, recompute all competition data
                    fetchCropsAndCompetition();
                }
            )
            .subscribe();

        return () => {
            channel.unsubscribe();
        };
    }, [user?.id]);

    const activePlantedCropsCount = plantedCrops.filter(
        (crop) => !crop.harvestDate
    ).length;

    const harvestedCropsCount = plantedCrops.filter(
        (crop) => crop.harvestDate
    ).length;

    return (
        <div className="min-h-screen w-full flex flex-col relative items-center scrollbar-hide bg-background overflow-x-hidden text-text pb-20">
            {/* Header */}
            <div className="fixed top-0 left-0 w-full bg-white shadow-md z-50 px-4 py-3">
                <h1 className="text-lg font-semibold text-primary text-center">
                    Crop Management
                </h1>
            </div>

            <div className="w-full max-w-6xl mx-4 sm:mx-auto my-16 px-4 sm:px-0">
                {/* Tab Navigation */}
                <div className="mb-6 mt-4">
                    <div className="bg-white rounded-lg border border-gray-200 p-1 flex">
                        <button
                            onClick={() => setActiveTab("recommendations")}
                            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                                activeTab === "recommendations"
                                    ? "bg-primary text-white shadow-sm"
                                    : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                            }`}
                        >
                            <Icon
                                icon="mingcute:lightbulb-line"
                                width="16"
                                height="16"
                            />
                            Recommendations
                        </button>
                        <button
                            onClick={() => setActiveTab("my-crops")}
                            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 relative ${
                                activeTab === "my-crops"
                                    ? "bg-primary text-white shadow-sm"
                                    : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                            }`}
                        >
                            <Icon
                                icon="mingcute:plant-line"
                                width="16"
                                height="16"
                            />
                            My Crops
                            {activePlantedCropsCount > 0 && (
                                <span
                                    className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${
                                        activeTab === "my-crops"
                                            ? "bg-white text-primary"
                                            : "bg-primary text-white"
                                    }`}
                                >
                                    {activePlantedCropsCount}
                                </span>
                            )}
                        </button>
                    </div>
                </div>
                {/* Tab Content */}
                {activeTab === "recommendations" && (
                    <>
                        {/* Info Banner */}
                        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <Icon
                                    icon="mingcute:lightbulb-line"
                                    width="24"
                                    height="24"
                                    className="text-blue-600 mt-0.5"
                                />
                                <div>
                                    <h3 className="font-semibold text-blue-800 mb-1">
                                        Smart Crop Selection
                                    </h3>
                                    <p className="text-blue-700 text-sm">
                                        Based on current market data and
                                        planting patterns from local farmers.
                                        Choose crops with low competition and
                                        high demand for better profitability.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="mb-6 space-y-4">
                            {/* Search */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Search Crops
                                </label>
                                <div className="relative">
                                    <Icon
                                        icon="mingcute:search-line"
                                        width="20"
                                        height="20"
                                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Search by crop name, category, or benefits..."
                                        value={searchTerm}
                                        onChange={(e) =>
                                            setSearchTerm(e.target.value)
                                        }
                                        className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                                    />
                                </div>
                            </div>

                            {/* Filters */}
                            <div className="flex flex-col sm:flex-row gap-4">
                                {/* Category Filter */}
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Category
                                    </label>
                                    <select
                                        value={selectedCategory}
                                        onChange={(e) =>
                                            setSelectedCategory(e.target.value)
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                                    >
                                        {categories.map((category) => (
                                            <option
                                                key={category}
                                                value={category}
                                            >
                                                {category}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Sort By */}
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Sort By
                                    </label>
                                    <select
                                        value={sortBy}
                                        onChange={(e) =>
                                            setSortBy(e.target.value)
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                                    >
                                        <option value="recommendation">
                                            Recommendation Level
                                        </option>
                                        <option value="available">
                                            Available to Plant
                                        </option>
                                        <option value="demand">
                                            Market Demand
                                        </option>
                                        <option value="competition">
                                            Competition Level
                                        </option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Legend */}
                        <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-2">
                            <button
                                onClick={() =>
                                    handleRecommendationToggle(
                                        "Highly Recommended"
                                    )
                                }
                                className={`transition-all duration-200 border rounded-lg p-2 text-center hover:shadow-md ${
                                    selectedRecommendation ===
                                    "Highly Recommended"
                                        ? "bg-green-100 border-green-300 shadow-md ring-2 ring-green-200"
                                        : "bg-green-50 border-green-200 hover:bg-green-100"
                                }`}
                            >
                                <Icon
                                    icon="mingcute:star-fill"
                                    width="20"
                                    height="20"
                                    className="mx-auto text-green-600 mb-1"
                                />
                                <p className="text-xs font-medium text-green-800">
                                    Highly Recommended
                                </p>
                            </button>
                            <button
                                onClick={() =>
                                    handleRecommendationToggle("Recommended")
                                }
                                className={`transition-all duration-200 border rounded-lg p-2 text-center hover:shadow-md ${
                                    selectedRecommendation === "Recommended"
                                        ? "bg-blue-100 border-blue-300 shadow-md ring-2 ring-blue-200"
                                        : "bg-blue-50 border-blue-200 hover:bg-blue-100"
                                }`}
                            >
                                <Icon
                                    icon="mingcute:thumb-up-fill"
                                    width="20"
                                    height="20"
                                    className="mx-auto text-blue-600 mb-1"
                                />
                                <p className="text-xs font-medium text-blue-800">
                                    Recommended
                                </p>
                            </button>
                            <button
                                onClick={() =>
                                    handleRecommendationToggle(
                                        "Consider Carefully"
                                    )
                                }
                                className={`transition-all duration-200 border rounded-lg p-2 text-center hover:shadow-md ${
                                    selectedRecommendation ===
                                    "Consider Carefully"
                                        ? "bg-yellow-100 border-yellow-300 shadow-md ring-2 ring-yellow-200"
                                        : "bg-yellow-50 border-yellow-200 hover:bg-yellow-100"
                                }`}
                            >
                                <Icon
                                    icon="mingcute:question-fill"
                                    width="20"
                                    height="20"
                                    className="mx-auto text-yellow-600 mb-1"
                                />
                                <p className="text-xs font-medium text-yellow-800">
                                    Consider Carefully
                                </p>
                            </button>
                            <button
                                onClick={() =>
                                    handleRecommendationToggle(
                                        "Caution Advised"
                                    )
                                }
                                className={`transition-all duration-200 border rounded-lg p-2 text-center hover:shadow-md ${
                                    selectedRecommendation === "Caution Advised"
                                        ? "bg-red-100 border-red-300 shadow-md ring-2 ring-red-200"
                                        : "bg-red-50 border-red-200 hover:bg-red-100"
                                }`}
                            >
                                <Icon
                                    icon="mingcute:alert-fill"
                                    width="20"
                                    height="20"
                                    className="mx-auto text-red-600 mb-1"
                                />
                                <p className="text-xs font-medium text-red-800">
                                    Caution Advised
                                </p>
                            </button>
                        </div>

                        {/* Crops Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {loading ? (
                                <p>Loading recommendations...</p>
                            ) : (
                                filteredCrops.map((crop) => (
                                    <div
                                        key={crop.id}
                                        className="bg-white rounded-lg shadow-md p-4"
                                    >
                                        {/* Header */}
                                        <div className="p-4 border-b border-gray-200">
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex items-center gap-3">
                                                    <Icon
                                                        icon={crop.icon}
                                                        width="40"
                                                        height="40"
                                                    />
                                                    <div>
                                                        <h3 className="font-semibold text-gray-800">
                                                            {crop.name}
                                                        </h3>
                                                        <p className="text-sm text-gray-600">
                                                            {crop.category}
                                                        </p>
                                                    </div>
                                                </div>
                                                <span
                                                    className={`px-3 py-1 rounded-full text-xs font-medium border ${crop.color}`}
                                                >
                                                    <Icon
                                                        icon={getRecommendationIcon(
                                                            crop.recommendation
                                                        )}
                                                        width="12"
                                                        height="12"
                                                        className="inline mr-1"
                                                    />
                                                    {crop.recommendation}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-700">
                                                {crop.description}
                                            </p>
                                        </div>

                                        {/* Stats */}
                                        <div className="p-4">
                                            <div className="grid grid-cols-2 gap-4 mb-4">
                                                <div>
                                                    <label className="text-xs text-gray-500 font-medium">
                                                        Market Demand
                                                    </label>
                                                    <p
                                                        className={`font-semibold ${getDemandColor(
                                                            crop.demandLevel
                                                        )}`}
                                                    >
                                                        {crop.demandLevel}
                                                    </p>
                                                </div>
                                                <div>
                                                    <label className="text-xs text-gray-500 font-medium">
                                                        Competition Level
                                                    </label>
                                                    <p
                                                        className={`font-semibold ${getCompetitionColor(
                                                            crop.plantingPercentage
                                                        )}`}
                                                    >
                                                        {
                                                            crop.plantingPercentage
                                                        }
                                                        % of farmers
                                                    </p>
                                                </div>
                                                <div>
                                                    <label className="text-xs text-gray-500 font-medium">
                                                        Growing Season
                                                    </label>
                                                    <p className="font-medium text-gray-800">
                                                        {crop.season}
                                                    </p>
                                                </div>
                                                <div>
                                                    <label className="text-xs text-gray-500 font-medium">
                                                        Estimated Harvest Time
                                                    </label>
                                                    <p className="font-medium text-gray-800">
                                                        {crop.harvestTime}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Competition Bar */}
                                            <div className="mb-4">
                                                <div className="flex justify-between text-xs text-gray-600 mb-1">
                                                    <span>
                                                        Competition Level
                                                    </span>
                                                    <span>
                                                        {displayedCompetitionPercentages[
                                                            crop.id
                                                        ] ??
                                                            crop.plantingPercentage}
                                                        %
                                                    </span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className={`h-2 rounded-full transition-all duration-500 ease-out ${
                                                            crop.plantingPercentage <=
                                                            20
                                                                ? "bg-primary"
                                                                : crop.plantingPercentage <=
                                                                  40
                                                                ? "bg-blue-600"
                                                                : crop.plantingPercentage <=
                                                                  60
                                                                ? "bg-yellow-500"
                                                                : "bg-red-500"
                                                        }`}
                                                        style={{
                                                            width: `${
                                                                displayedCompetitionPercentages[
                                                                    crop.id
                                                                ] ??
                                                                crop.plantingPercentage
                                                            }%`,
                                                        }}
                                                    ></div>
                                                </div>
                                            </div>

                                            {/* Benefits */}
                                            {/* <div className="mb-4">
                                            <label className="text-xs text-gray-500 font-medium mb-2 block">
                                                Key Benefits
                                            </label>
                                            <div className="flex flex-wrap gap-1">
                                                {crop.benefits.map(
                                                    (benefit, index) => (
                                                        <span
                                                            key={index}
                                                            className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                                                        >
                                                            {benefit}
                                                        </span>
                                                    )
                                                )}
                                            </div>
                                        </div> */}

                                            {/* Plant Crop Button */}
                                            <div className="pt-4 border-t border-gray-200">
                                                {isCropAlreadyPlanted(
                                                    crop.name
                                                ) ? (
                                                    <div className="w-full bg-gray-100 text-gray-500 py-2 px-4 rounded-lg text-center font-medium text-sm flex items-center justify-center gap-2">
                                                        <Icon
                                                            icon="mingcute:plant-fill"
                                                            width="16"
                                                            height="16"
                                                        />
                                                        Already Planted
                                                    </div>
                                                ) : confirmingCrop &&
                                                  confirmingCrop.id ===
                                                      crop.id ? (
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={
                                                                confirmPlantCrop
                                                            }
                                                            className="flex-1 bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary-dark transition-colors font-medium text-sm flex items-center justify-center gap-2"
                                                        >
                                                            <Icon
                                                                icon="mingcute:check-line"
                                                                width="16"
                                                                height="16"
                                                            />
                                                            Confirm
                                                        </button>
                                                        <button
                                                            onClick={
                                                                cancelPlantCrop
                                                            }
                                                            className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors font-medium text-sm flex items-center justify-center gap-2"
                                                        >
                                                            <Icon
                                                                icon="mingcute:close-line"
                                                                width="16"
                                                                height="16"
                                                            />
                                                            Cancel
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() =>
                                                            handlePlantCrop(
                                                                crop
                                                            )
                                                        }
                                                        className="w-full bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary-dark transition-colors font-medium text-sm flex items-center justify-center gap-2"
                                                    >
                                                        <Icon
                                                            icon="mingcute:plant-line"
                                                            width="16"
                                                            height="16"
                                                        />
                                                        Plant This Crop
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </>
                )}

                {/* My Crops Tab */}
                {activeTab === "my-crops" && (
                    <>
                        {/* My Crops Header */}
                        <div className="mb-6 bg-primary/10 border border-primary/20 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <Icon
                                    icon="mingcute:plant-line"
                                    width="24"
                                    height="24"
                                    className="text-primary mt-0.5"
                                />
                                <div>
                                    <h3 className="font-semibold text-primary mb-1">
                                        My Crop Portfolio
                                    </h3>
                                    <p className="text-primary/80 text-sm">
                                        Track your planted crops and manage your
                                        harvest schedule. You have{" "}
                                        {activePlantedCropsCount} crops
                                        currently growing and{" "}
                                        {harvestedCropsCount} completed
                                        harvests.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Sub-tabs for My Crops */}
                        {(activePlantedCropsCount > 0 ||
                            harvestedCropsCount > 0) && (
                            <div className="mb-6">
                                <div className="bg-white rounded-lg border border-gray-200 p-1 flex">
                                    <button
                                        onClick={() =>
                                            setMyCropsSubTab("growing")
                                        }
                                        className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                                            myCropsSubTab === "growing"
                                                ? "bg-primary text-white shadow-sm"
                                                : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                                        }`}
                                    >
                                        <Icon
                                            icon="mingcute:seedling-line"
                                            width="16"
                                            height="16"
                                        />
                                        Currently Growing
                                        {activePlantedCropsCount > 0 && (
                                            <span
                                                className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${
                                                    myCropsSubTab === "growing"
                                                        ? "bg-white text-primary"
                                                        : "bg-primary text-white"
                                                }`}
                                            >
                                                {activePlantedCropsCount}
                                            </span>
                                        )}
                                    </button>
                                    <button
                                        onClick={() =>
                                            setMyCropsSubTab("history")
                                        }
                                        className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                                            myCropsSubTab === "history"
                                                ? "bg-primary text-white shadow-sm"
                                                : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                                        }`}
                                    >
                                        <Icon
                                            icon="mingcute:check-circle-line"
                                            width="16"
                                            height="16"
                                        />
                                        Harvest History
                                        {harvestedCropsCount > 0 && (
                                            <span
                                                className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${
                                                    myCropsSubTab === "history"
                                                        ? "bg-white text-primary"
                                                        : "bg-primary text-white"
                                                }`}
                                            >
                                                {harvestedCropsCount}
                                            </span>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Currently Planted Crops */}
                        {myCropsSubTab === "growing" &&
                            activePlantedCropsCount > 0 && (
                                <div className="mb-8">
                                    <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                        <Icon
                                            icon="mingcute:seedling-line"
                                            width="24"
                                            height="24"
                                            className="text-primary"
                                        />
                                        Currently Growing (
                                        {activePlantedCropsCount})
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {plantedCrops
                                            .filter((crop) => !crop.harvestDate)
                                            .map((crop) => {
                                                // Use robust day calculation helper
                                                const daysSincePlanted =
                                                    calculateDaysSincePlanted(
                                                        crop.plantedDate
                                                    );

                                                const harvestTimeInDays =
                                                    crop.harvest_time
                                                        ? parseInt(
                                                              crop.harvest_time.split(
                                                                  "-"
                                                              )[0]
                                                          ) * 30
                                                        : 90;
                                                const progress = Math.min(
                                                    100,
                                                    Math.round(
                                                        (daysSincePlanted /
                                                            harvestTimeInDays) *
                                                            100
                                                    )
                                                );

                                                return (
                                                    <div
                                                        key={crop.id}
                                                        className="bg-white rounded-lg shadow-md p-4"
                                                    >
                                                        <div className="flex items-center gap-3 mb-3">
                                                            <Icon
                                                                icon={
                                                                    crop.icon ||
                                                                    "twemoji:seedling"
                                                                }
                                                                width="32"
                                                                height="32"
                                                            />
                                                            <div>
                                                                <h4 className="font-semibold text-gray-800">
                                                                    {crop.name}
                                                                </h4>
                                                                <p className="text-xs text-gray-500">
                                                                    Planted:{" "}
                                                                    {new Date(
                                                                        crop.plantedDate
                                                                    ).toLocaleDateString()}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="mb-3">
                                                            <div className="flex justify-between text-xs text-gray-600 mb-1">
                                                                <span>
                                                                    Growth
                                                                    Progress
                                                                </span>
                                                                <span>
                                                                    {progress}%
                                                                </span>
                                                            </div>
                                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                                <div
                                                                    className="bg-primary h-2 rounded-full"
                                                                    style={{
                                                                        width: `${progress}%`,
                                                                    }}
                                                                ></div>
                                                            </div>
                                                            <p className="text-xs text-gray-500 mt-1 text-center">
                                                                {
                                                                    daysSincePlanted
                                                                }{" "}
                                                                days planted
                                                            </p>
                                                        </div>

                                                        {confirmingHarvest ===
                                                        crop.id ? (
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={
                                                                        confirmHarvestCrop
                                                                    }
                                                                    className="flex-1 bg-green-600 text-white py-2 px-3 rounded-lg hover:bg-green-700 transition-colors font-medium text-sm flex items-center justify-center gap-1"
                                                                >
                                                                    <Icon
                                                                        icon="mingcute:check-line"
                                                                        width="16"
                                                                        height="16"
                                                                    />
                                                                    Confirm
                                                                </button>
                                                                <button
                                                                    onClick={
                                                                        cancelHarvestCrop
                                                                    }
                                                                    className="flex-1 bg-gray-500 text-white py-2 px-3 rounded-lg hover:bg-gray-600 transition-colors font-medium text-sm flex items-center justify-center gap-1"
                                                                >
                                                                    <Icon
                                                                        icon="mingcute:close-line"
                                                                        width="16"
                                                                        height="16"
                                                                    />
                                                                    Cancel
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                onClick={() =>
                                                                    handleHarvestCrop(
                                                                        crop.id
                                                                    )
                                                                }
                                                                className="w-full bg-green-600 text-white py-2 px-3 rounded-lg hover:bg-green-700 transition-colors font-medium text-sm flex items-center justify-center gap-2"
                                                            >
                                                                <Icon
                                                                    icon="mingcute:check-circle-line"
                                                                    width="16"
                                                                    height="16"
                                                                />
                                                                Mark as
                                                                Harvested
                                                            </button>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                    </div>
                                </div>
                            )}

                        {/* Harvest History */}
                        {myCropsSubTab === "history" &&
                            harvestedCropsCount > 0 && (
                                <div className="mb-8">
                                    <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                        <Icon
                                            icon="mingcute:check-circle-fill"
                                            width="24"
                                            height="24"
                                            className="text-primary"
                                        />
                                        Harvest History ({harvestedCropsCount})
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {plantedCrops
                                            .filter((crop) => crop.harvestDate)
                                            .map((crop) => (
                                                <div
                                                    key={crop.id}
                                                    className="bg-white rounded-lg shadow-md p-4 opacity-80"
                                                >
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <Icon
                                                            icon={
                                                                crop.icon ||
                                                                "twemoji:seedling"
                                                            }
                                                            width="32"
                                                            height="32"
                                                        />
                                                        <div>
                                                            <h4 className="font-semibold text-gray-800">
                                                                {crop.name}
                                                            </h4>
                                                            <p className="text-xs text-gray-500">
                                                                Harvested:{" "}
                                                                {new Date(
                                                                    crop.harvestDate
                                                                ).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="text-center bg-green-50 text-green-700 text-sm font-medium py-2 rounded-lg">
                                                        Harvest Complete
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            )}

                        {/* Empty State for No Crops */}
                        {plantedCrops.length === 0 && (
                            <div className="text-center py-12">
                                <Icon
                                    icon="mingcute:plant-line"
                                    width="80"
                                    height="80"
                                    className="mx-auto text-gray-300 mb-4"
                                />
                                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                                    No Crops Planted Yet
                                </h3>
                                <p className="text-gray-500 mb-6">
                                    Start your farming journey by exploring our
                                    crop recommendations.
                                </p>
                                <button
                                    onClick={() =>
                                        setActiveTab("recommendations")
                                    }
                                    className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-dark transition-colors font-medium flex items-center gap-2 mx-auto"
                                >
                                    <Icon
                                        icon="mingcute:lightbulb-line"
                                        width="20"
                                        height="20"
                                    />
                                    View Recommendations
                                </button>
                            </div>
                        )}

                        {/* Empty state for growing tab */}
                        {plantedCrops.length > 0 &&
                            myCropsSubTab === "growing" &&
                            activePlantedCropsCount === 0 && (
                                <div className="text-center py-12">
                                    <Icon
                                        icon="mingcute:seedling-line"
                                        width="80"
                                        height="80"
                                        className="mx-auto text-gray-300 mb-4"
                                    />
                                    <h3 className="text-xl font-semibold text-gray-600 mb-2">
                                        No Crops Currently Growing
                                    </h3>
                                    <p className="text-gray-500 mb-6">
                                        All your crops have been harvested.
                                        Plant new crops to start growing again.
                                    </p>
                                    <button
                                        onClick={() =>
                                            setActiveTab("recommendations")
                                        }
                                        className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-dark transition-colors font-medium flex items-center gap-2 mx-auto"
                                    >
                                        <Icon
                                            icon="mingcute:plant-line"
                                            width="20"
                                            height="20"
                                        />
                                        Plant New Crops
                                    </button>
                                </div>
                            )}

                        {/* Empty state for history tab */}
                        {plantedCrops.length > 0 &&
                            myCropsSubTab === "history" &&
                            harvestedCropsCount === 0 && (
                                <div className="text-center py-12">
                                    <Icon
                                        icon="mingcute:check-circle-line"
                                        width="80"
                                        height="80"
                                        className="mx-auto text-gray-300 mb-4"
                                    />
                                    <h3 className="text-xl font-semibold text-gray-600 mb-2">
                                        No Harvest History Yet
                                    </h3>
                                    <p className="text-gray-500 mb-6">
                                        Complete your first harvest to see your
                                        farming history here.
                                    </p>
                                    <button
                                        onClick={() =>
                                            setMyCropsSubTab("growing")
                                        }
                                        className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-dark transition-colors font-medium flex items-center gap-2 mx-auto"
                                    >
                                        <Icon
                                            icon="mingcute:seedling-line"
                                            width="20"
                                            height="20"
                                        />
                                        View Growing Crops
                                    </button>
                                </div>
                            )}
                    </>
                )}

                {/* Redundant Nav - Can be removed if not needed */}
                {/* <div className="mt-8 flex justify-center"> ... </div> */}
            </div>
            <ProducerNavigationBar />
        </div>
    );
}

export default CropRecommendation;
