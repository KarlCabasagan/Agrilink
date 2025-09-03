import { useState, useEffect, useContext } from "react";
import { Icon } from "@iconify/react";
import { AuthContext } from "../../App.jsx";
import ProducerNavigationBar from "../../components/ProducerNavigationBar";

const cropData = [
    {
        id: 1,
        name: "Sweet Potato",
        category: "Root and Tuber",
        plantingPercentage: 15,
        demandLevel: "High",
        season: "Year-round",
        growthPeriod: "3-4 months",
        description:
            "Low competition crop with high market demand. Perfect for small-scale farming.",
        benefits: [
            "High nutritional value",
            "Growing health trend",
            "Multiple uses",
        ],
        icon: "twemoji:potato",
        recommendation: "Highly Recommended",
        color: "bg-green-100 text-green-800 border-green-200",
    },
    {
        id: 2,
        name: "Lettuce",
        category: "Vegetables",
        plantingPercentage: 18,
        demandLevel: "High",
        season: "Cool season",
        growthPeriod: "2-3 months",
        description: "Fast-growing leafy green with consistent market demand.",
        benefits: [
            "Quick harvest",
            "Continuous planting",
            "Urban farming friendly",
        ],
        icon: "twemoji:leafy-greens",
        recommendation: "Highly Recommended",
        color: "bg-green-100 text-green-800 border-green-200",
    },
    {
        id: 3,
        name: "Herbs (Basil, Cilantro)",
        category: "Spices",
        plantingPercentage: 12,
        demandLevel: "Medium-High",
        season: "Year-round",
        growthPeriod: "1-2 months",
        description: "High-value herbs with premium market prices.",
        benefits: [
            "High profit margin",
            "Small space required",
            "Multiple harvests",
        ],
        icon: "twemoji:herb",
        recommendation: "Recommended",
        color: "bg-blue-100 text-blue-800 border-blue-200",
    },
    {
        id: 4,
        name: "Bell Peppers",
        category: "Vegetables",
        plantingPercentage: 22,
        demandLevel: "Medium-High",
        season: "Warm season",
        growthPeriod: "3-4 months",
        description:
            "Moderate competition but steady demand for fresh consumption.",
        benefits: [
            "Year-round demand",
            "Export potential",
            "Good storage life",
        ],
        icon: "twemoji:bell-pepper",
        recommendation: "Recommended",
        color: "bg-blue-100 text-blue-800 border-blue-200",
    },
    {
        id: 5,
        name: "Cabbage",
        category: "Vegetables",
        plantingPercentage: 35,
        demandLevel: "Medium",
        season: "Cool season",
        growthPeriod: "3-4 months",
        description:
            "Moderate competition level. Consider timing and market conditions.",
        benefits: [
            "Stable market",
            "Good storage",
            "Processing industry demand",
        ],
        icon: "twemoji:cabbage",
        recommendation: "Consider Carefully",
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    },
    {
        id: 6,
        name: "Tomatoes",
        category: "Vegetables",
        plantingPercentage: 45,
        demandLevel: "High",
        season: "Warm season",
        growthPeriod: "3-5 months",
        description:
            "High competition due to many growers. Consider specialty varieties.",
        benefits: [
            "High demand",
            "Processing opportunities",
            "Multiple varieties",
        ],
        icon: "twemoji:tomato",
        recommendation: "Consider Carefully",
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    },
    {
        id: 7,
        name: "Carrots",
        category: "Vegetables",
        plantingPercentage: 55,
        demandLevel: "Medium",
        season: "Cool season",
        growthPeriod: "3-4 months",
        description:
            "Market saturation concerns. Focus on quality and direct marketing.",
        benefits: ["Long shelf life", "Processing market", "Export potential"],
        icon: "twemoji:carrot",
        recommendation: "Caution Advised",
        color: "bg-red-100 text-red-800 border-red-200",
    },
    {
        id: 8,
        name: "Rice",
        category: "Grains",
        plantingPercentage: 65,
        demandLevel: "High",
        season: "Wet/Dry season",
        growthPeriod: "4-6 months",
        description:
            "Oversupply in some areas. Consider specialty rice varieties.",
        benefits: [
            "Staple crop demand",
            "Government support",
            "Established market",
        ],
        icon: "twemoji:cooked-rice",
        recommendation: "Caution Advised",
        color: "bg-red-100 text-red-800 border-red-200",
    },
];

function CropRecommendation() {
    const { user } = useContext(AuthContext);
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [sortBy, setSortBy] = useState("recommendation");
    const [selectedRecommendation, setSelectedRecommendation] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [plantedCrops, setPlantedCrops] = useState([]);

    const categories = [
        "All",
        "Vegetables",
        "Root and Tuber",
        "Spices",
        "Grains",
    ];

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
        const newPlantedCrop = {
            ...crop,
            plantedDate: new Date().toISOString(),
            harvestDate: null,
            id: `planted_${crop.id}_${Date.now()}`, // Unique ID for planted crop
        };
        setPlantedCrops((prev) => [...prev, newPlantedCrop]);
    };

    const handleHarvestCrop = (plantedCropId) => {
        setPlantedCrops((prev) =>
            prev.map((crop) =>
                crop.id === plantedCropId
                    ? { ...crop, harvestDate: new Date().toISOString() }
                    : crop
            )
        );
    };

    const searchCrops = (crops) => {
        if (!searchTerm) return crops;

        return crops.filter(
            (crop) =>
                crop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                crop.category
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase()) ||
                crop.description
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase()) ||
                crop.benefits.some((benefit) =>
                    benefit.toLowerCase().includes(searchTerm.toLowerCase())
                )
        );
    };

    const filteredCrops = searchCrops(
        cropData
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
            const recommendationOrder = {
                "Highly Recommended": 1,
                Recommended: 2,
                "Consider Carefully": 3,
                "Caution Advised": 4,
            };
            return (
                recommendationOrder[a.recommendation] -
                recommendationOrder[b.recommendation]
            );
        } else if (sortBy === "demand") {
            const demandOrder = {
                High: 1,
                "Medium-High": 2,
                Medium: 3,
                Low: 4,
            };
            return demandOrder[a.demandLevel] - demandOrder[b.demandLevel];
        } else if (sortBy === "competition") {
            return a.plantingPercentage - b.plantingPercentage;
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
                return "mingcute:information-fill";
        }
    };

    const getDemandColor = (level) => {
        switch (level) {
            case "High":
                return "text-green-600";
            case "Medium-High":
                return "text-blue-600";
            case "Medium":
                return "text-yellow-600";
            default:
                return "text-gray-600";
        }
    };

    const getCompetitionColor = (percentage) => {
        if (percentage <= 20) return "text-green-600";
        if (percentage <= 40) return "text-yellow-600";
        return "text-red-600";
    };

    return (
        <div className="min-h-screen w-full flex flex-col relative items-center scrollbar-hide bg-background overflow-x-hidden text-text pb-20">
            {/* Header */}
            <div className="fixed top-0 left-0 w-full bg-white shadow-md z-50 px-4 py-3">
                <h1 className="text-lg font-semibold text-primary text-center">
                    Crop Recommendations
                </h1>
            </div>

            <div className="w-full max-w-6xl mx-4 sm:mx-auto my-16 px-4 sm:px-0">
                {/* Info Banner */}
                <div className="mb-6 mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
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
                                Based on current market data and planting
                                patterns from local farmers. Choose crops with
                                low competition and high demand for better
                                profitability.
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
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
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
                                    <option key={category} value={category}>
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
                                onChange={(e) => setSortBy(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                            >
                                <option value="recommendation">
                                    Recommendation Level
                                </option>
                                <option value="demand">Market Demand</option>
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
                            handleRecommendationToggle("Highly Recommended")
                        }
                        className={`transition-all duration-200 border rounded-lg p-2 text-center hover:shadow-md ${
                            selectedRecommendation === "Highly Recommended"
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
                            handleRecommendationToggle("Consider Carefully")
                        }
                        className={`transition-all duration-200 border rounded-lg p-2 text-center hover:shadow-md ${
                            selectedRecommendation === "Consider Carefully"
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
                            handleRecommendationToggle("Caution Advised")
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
                    {filteredCrops.map((crop) => (
                        <div
                            key={crop.id}
                            className="bg-white rounded-lg shadow-md overflow-hidden"
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
                                            {crop.plantingPercentage}% of
                                            farmers
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
                                            Growth Period
                                        </label>
                                        <p className="font-medium text-gray-800">
                                            {crop.growthPeriod}
                                        </p>
                                    </div>
                                </div>

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
                                                    ? "bg-green-500"
                                                    : crop.plantingPercentage <=
                                                      40
                                                    ? "bg-yellow-500"
                                                    : "bg-red-500"
                                            }`}
                                            style={{
                                                width: `${crop.plantingPercentage}%`,
                                            }}
                                        ></div>
                                    </div>
                                </div>

                                {/* Benefits */}
                                <div className="mb-4">
                                    <label className="text-xs text-gray-500 font-medium mb-2 block">
                                        Key Benefits
                                    </label>
                                    <div className="flex flex-wrap gap-1">
                                        {crop.benefits.map((benefit, index) => (
                                            <span
                                                key={index}
                                                className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                                            >
                                                {benefit}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Plant Crop Button */}
                                <div className="pt-4 border-t border-gray-200">
                                    <button
                                        onClick={() => handlePlantCrop(crop)}
                                        className="w-full bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary-dark transition-colors font-medium text-sm flex items-center justify-center gap-2"
                                    >
                                        <Icon
                                            icon="mingcute:plant-line"
                                            width="16"
                                            height="16"
                                        />
                                        Plant This Crop
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Currently Planted Crops */}
                {plantedCrops.length > 0 && (
                    <div className="mt-8">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">
                            Currently Planted Crops
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {plantedCrops
                                .filter((crop) => !crop.harvestDate)
                                .map((crop) => (
                                    <div
                                        key={crop.id}
                                        className="bg-white border border-green-200 rounded-lg p-4 shadow-sm"
                                    >
                                        <div className="flex items-center gap-3 mb-3">
                                            <Icon
                                                icon={crop.icon}
                                                width="32"
                                                height="32"
                                            />
                                            <div>
                                                <h3 className="font-medium text-gray-800">
                                                    {crop.name}
                                                </h3>
                                                <p className="text-sm text-gray-600">
                                                    Planted:{" "}
                                                    {new Date(
                                                        crop.plantedDate
                                                    ).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="mb-3">
                                            <p className="text-xs text-gray-500 mb-1">
                                                Expected Growth Period
                                            </p>
                                            <p className="text-sm font-medium text-gray-700">
                                                {crop.growthPeriod}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() =>
                                                handleHarvestCrop(crop.id)
                                            }
                                            className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium text-sm flex items-center justify-center gap-2"
                                        >
                                            <Icon
                                                icon="mingcute:check-circle-line"
                                                width="16"
                                                height="16"
                                            />
                                            Mark as Harvested
                                        </button>
                                    </div>
                                ))}
                        </div>
                    </div>
                )}

                {/* Harvested Crops */}
                {plantedCrops.some((crop) => crop.harvestDate) && (
                    <div className="mt-8">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">
                            Harvested Crops
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {plantedCrops
                                .filter((crop) => crop.harvestDate)
                                .map((crop) => (
                                    <div
                                        key={crop.id}
                                        className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm opacity-75"
                                    >
                                        <div className="flex items-center gap-3 mb-3">
                                            <Icon
                                                icon={crop.icon}
                                                width="32"
                                                height="32"
                                            />
                                            <div>
                                                <h3 className="font-medium text-gray-800">
                                                    {crop.name}
                                                </h3>
                                                <p className="text-sm text-gray-600">
                                                    Harvested:{" "}
                                                    {new Date(
                                                        crop.harvestDate
                                                    ).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="bg-green-50 border border-green-200 rounded-lg p-2 text-center">
                                            <Icon
                                                icon="mingcute:check-circle-fill"
                                                width="20"
                                                height="20"
                                                className="mx-auto text-green-600 mb-1"
                                            />
                                            <p className="text-xs font-medium text-green-800">
                                                Successfully Harvested
                                            </p>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                )}
            </div>
            <ProducerNavigationBar />
        </div>
    );
}

export default CropRecommendation;
