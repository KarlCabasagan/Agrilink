import { useState, useEffect, useContext } from "react";
import { Icon } from "@iconify/react";
import { AuthContext } from "../App.jsx";
import ProducerNavigationBar from "../components/ProducerNavigationBar";

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

    const categories = [
        "All",
        "Vegetables",
        "Root and Tuber",
        "Spices",
        "Grains",
    ];

    const filteredCrops = cropData
        .filter(
            (crop) =>
                selectedCategory === "All" || crop.category === selectedCategory
        )
        .sort((a, b) => {
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
                <div className="mb-6 flex flex-col sm:flex-row gap-4">
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

                {/* Legend */}
                <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-2 text-center">
                        <Icon
                            icon="mingcute:star-fill"
                            width="20"
                            height="20"
                            className="mx-auto text-green-600 mb-1"
                        />
                        <p className="text-xs font-medium text-green-800">
                            Highly Recommended
                        </p>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 text-center">
                        <Icon
                            icon="mingcute:thumb-up-fill"
                            width="20"
                            height="20"
                            className="mx-auto text-blue-600 mb-1"
                        />
                        <p className="text-xs font-medium text-blue-800">
                            Recommended
                        </p>
                    </div>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 text-center">
                        <Icon
                            icon="mingcute:question-fill"
                            width="20"
                            height="20"
                            className="mx-auto text-yellow-600 mb-1"
                        />
                        <p className="text-xs font-medium text-yellow-800">
                            Consider Carefully
                        </p>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-center">
                        <Icon
                            icon="mingcute:alert-fill"
                            width="20"
                            height="20"
                            className="mx-auto text-red-600 mb-1"
                        />
                        <p className="text-xs font-medium text-red-800">
                            Caution Advised
                        </p>
                    </div>
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
                                <div>
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
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <ProducerNavigationBar />
        </div>
    );
}

export default CropRecommendation;
