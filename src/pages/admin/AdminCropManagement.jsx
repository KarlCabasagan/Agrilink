import { useState } from "react";
import { Icon } from "@iconify/react";
import AdminNavigationBar from "../../components/AdminNavigationBar";
import ConfirmModal from "../../components/ConfirmModal";

function AdminCropManagement() {
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedCrop, setSelectedCrop] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");

    const [crops, setCrops] = useState([
        {
            id: 1,
            name: "Tomatoes",
            category: "Vegetables",
            icon: "twemoji:tomato",
            plantingSeason: "Dry Season",
            harvestTime: "60-80 days",
            avgPrice: 80,
            marketDemand: "High",
            difficulty: "Easy",
            waterRequirement: "Moderate",
            description:
                "Popular vegetable crop with high market demand year-round",
            tips: "Plant during cooler months, provide support for vines",
            profitability: 85,
            competition: "Medium",
            lastUpdated: "2024-09-01",
        },
        {
            id: 2,
            name: "Rice",
            category: "Grains",
            icon: "twemoji:sheaf-of-rice",
            plantingSeason: "Wet Season",
            harvestTime: "120-150 days",
            avgPrice: 45,
            marketDemand: "Very High",
            difficulty: "Medium",
            waterRequirement: "High",
            description:
                "Staple crop with consistent demand and government support",
            tips: "Requires flooded fields, timing is crucial for wet season",
            profitability: 90,
            competition: "High",
            lastUpdated: "2024-08-28",
        },
        {
            id: 3,
            name: "Lettuce",
            category: "Vegetables",
            icon: "twemoji:leafy-greens",
            plantingSeason: "Cool Season",
            harvestTime: "45-60 days",
            avgPrice: 35,
            marketDemand: "Medium",
            difficulty: "Easy",
            waterRequirement: "Moderate",
            description:
                "Fast-growing leafy vegetable with good profit margins",
            tips: "Grows best in cooler weather, harvest in early morning",
            profitability: 70,
            competition: "Low",
            lastUpdated: "2024-08-25",
        },
    ]);

    const [formData, setFormData] = useState({
        name: "",
        category: "",
        icon: "",
        plantingSeason: "",
        harvestTime: "",
        avgPrice: "",
        marketDemand: "",
        difficulty: "",
        waterRequirement: "",
        description: "",
        tips: "",
        profitability: "",
        competition: "",
    });

    const resetForm = () => {
        setFormData({
            name: "",
            category: "",
            icon: "",
            plantingSeason: "",
            harvestTime: "",
            avgPrice: "",
            marketDemand: "",
            difficulty: "",
            waterRequirement: "",
            description: "",
            tips: "",
            profitability: "",
            competition: "",
        });
    };

    const handleAdd = () => {
        setShowAddModal(true);
        resetForm();
    };

    const handleEdit = (crop) => {
        setSelectedCrop(crop);
        setFormData(crop);
        setShowEditModal(true);
    };

    const handleDelete = (crop) => {
        setSelectedCrop(crop);
        setShowDeleteModal(true);
    };

    const saveCrop = () => {
        const newCrop = {
            ...formData,
            id: selectedCrop?.id || Date.now(),
            avgPrice: parseFloat(formData.avgPrice),
            profitability: parseFloat(formData.profitability),
            lastUpdated: new Date().toISOString().split("T")[0],
        };

        if (selectedCrop) {
            setCrops((prev) =>
                prev.map((crop) =>
                    crop.id === selectedCrop.id ? newCrop : crop
                )
            );
        } else {
            setCrops((prev) => [...prev, newCrop]);
        }

        setShowAddModal(false);
        setShowEditModal(false);
        resetForm();
        setSelectedCrop(null);
    };

    const deleteCrop = () => {
        setCrops((prev) => prev.filter((crop) => crop.id !== selectedCrop.id));
        setShowDeleteModal(false);
        setSelectedCrop(null);
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

    return (
        <div className="min-h-screen w-full flex flex-col relative items-center scrollbar-hide bg-background overflow-x-hidden text-text pb-20">
            {/* Header */}
            <div className="fixed top-0 left-0 w-full bg-white shadow-md z-50 px-4 py-3">
                <h1 className="text-lg font-semibold text-primary text-center">
                    Crop Management
                </h1>
            </div>

            <div className="w-full max-w-6xl mx-4 sm:mx-auto my-16">
                {/* Search and Add Button */}
                <div className="bg-white rounded-lg shadow-md p-4 mb-6 mt-4">
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
                                onChange={(e) => setSearchTerm(e.target.value)}
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
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {filteredCrops.map((crop) => (
                        <div
                            key={crop.id}
                            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h3 className="text-xl font-semibold text-gray-800">
                                        {crop.name}
                                    </h3>
                                    <p className="text-sm text-gray-600">
                                        {crop.category}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleEdit(crop)}
                                        className="text-blue-600 hover:text-blue-800"
                                    >
                                        <Icon
                                            icon="mingcute:edit-line"
                                            width="20"
                                            height="20"
                                        />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(crop)}
                                        className="text-red-600 hover:text-red-800"
                                    >
                                        <Icon
                                            icon="mingcute:delete-line"
                                            width="20"
                                            height="20"
                                        />
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <h4 className="font-medium text-gray-700 mb-1">
                                        Planting Season
                                    </h4>
                                    <p className="text-sm text-gray-600">
                                        {crop.plantingSeason}
                                    </p>
                                </div>
                                <div>
                                    <h4 className="font-medium text-gray-700 mb-1">
                                        Harvest Time
                                    </h4>
                                    <p className="text-sm text-gray-600">
                                        {crop.harvestTime}
                                    </p>
                                </div>
                                <div>
                                    <h4 className="font-medium text-gray-700 mb-1">
                                        Average Price
                                    </h4>
                                    <p className="text-sm font-semibold text-green-600">
                                        ₱{crop.avgPrice}/kg
                                    </p>
                                </div>
                                <div>
                                    <h4 className="font-medium text-gray-700 mb-1">
                                        Profitability
                                    </h4>
                                    <p className="text-sm font-semibold text-blue-600">
                                        {crop.profitability}%
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2 mb-4">
                                <span
                                    className={`px-2 py-1 text-xs rounded-full ${getDemandColor(
                                        crop.marketDemand
                                    )}`}
                                >
                                    {crop.marketDemand} Demand
                                </span>
                                <span
                                    className={`px-2 py-1 text-xs rounded-full ${getDifficultyColor(
                                        crop.difficulty
                                    )}`}
                                >
                                    {crop.difficulty}
                                </span>
                                <span
                                    className={`px-2 py-1 text-xs rounded-full ${getCompetitionColor(
                                        crop.competition
                                    )}`}
                                >
                                    {crop.competition} Competition
                                </span>
                                <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                                    {crop.waterRequirement} Water
                                </span>
                            </div>

                            <p className="text-sm text-gray-600 mb-3">
                                {crop.description}
                            </p>

                            <div className="border-t pt-3">
                                <h4 className="font-medium text-gray-700 mb-1">
                                    Growing Tips:
                                </h4>
                                <p className="text-sm text-gray-600">
                                    {crop.tips}
                                </p>
                            </div>

                            <p className="text-xs text-gray-400 mt-3">
                                Last updated:{" "}
                                {new Date(
                                    crop.lastUpdated
                                ).toLocaleDateString()}
                            </p>
                        </div>
                    ))}
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
            </div>

            {/* Add/Edit Modal */}
            {(showAddModal || showEditModal) && (
                <>
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black opacity-50"></div>
                    <div className="bg-white rounded-lg shadow-xl p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto fixed top-1/12 left-1/2 transform -translate-x-1/2 -translate-y-1 z-50">
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
                                    value={formData.category}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            category: e.target.value,
                                        })
                                    }
                                    className="w-full px-3 py-3 border border-gray-300 rounded-lg text-base outline-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                    required
                                >
                                    <option value="">Select Category</option>
                                    <option value="Vegetables">
                                        Vegetables
                                    </option>
                                    <option value="Fruits">Fruits</option>
                                    <option value="Grains">Grains</option>
                                    <option value="Legumes">Legumes</option>
                                    <option value="Herbs">Herbs</option>
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
                                <input
                                    type="text"
                                    value={formData.icon}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            icon: e.target.value,
                                        })
                                    }
                                    placeholder="e.g., twemoji:tomato"
                                    className="w-full px-3 py-3 border border-gray-300 rounded-lg text-base outline-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                />
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
                                {formData.icon && (
                                    <div className="mt-2 flex items-center gap-2">
                                        <span className="text-sm text-gray-600">
                                            Preview:
                                        </span>
                                        <Icon
                                            icon={formData.icon}
                                            width="24"
                                            height="24"
                                        />
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Planting Season *
                                </label>
                                <select
                                    value={formData.plantingSeason}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            plantingSeason: e.target.value,
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
                                    value={formData.harvestTime}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            harvestTime: e.target.value,
                                        })
                                    }
                                    placeholder="e.g., 60-80 days"
                                    className="w-full px-3 py-3 border border-gray-300 rounded-lg text-base outline-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Average Price (₱/kg) *
                                </label>
                                <input
                                    type="number"
                                    value={formData.avgPrice}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            avgPrice: e.target.value,
                                        })
                                    }
                                    className="w-full px-3 py-3 border border-gray-300 rounded-lg text-base outline-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Market Demand *
                                </label>
                                <select
                                    value={formData.marketDemand}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            marketDemand: e.target.value,
                                        })
                                    }
                                    className="w-full px-3 py-3 border border-gray-300 rounded-lg text-base outline-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                    required
                                >
                                    <option value="">Select Demand</option>
                                    <option value="Very High">Very High</option>
                                    <option value="High">High</option>
                                    <option value="Medium">Medium</option>
                                    <option value="Low">Low</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Difficulty Level *
                                </label>
                                <select
                                    value={formData.difficulty}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            difficulty: e.target.value,
                                        })
                                    }
                                    className="w-full px-3 py-3 border border-gray-300 rounded-lg text-base outline-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                    required
                                >
                                    <option value="">Select Difficulty</option>
                                    <option value="Easy">Easy</option>
                                    <option value="Medium">Medium</option>
                                    <option value="Hard">Hard</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Water Requirement *
                                </label>
                                <select
                                    value={formData.waterRequirement}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            waterRequirement: e.target.value,
                                        })
                                    }
                                    className="w-full px-3 py-3 border border-gray-300 rounded-lg text-base outline-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                    required
                                >
                                    <option value="">Select Water Need</option>
                                    <option value="Low">Low</option>
                                    <option value="Moderate">Moderate</option>
                                    <option value="High">High</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Profitability (%) *
                                </label>
                                <input
                                    type="number"
                                    value={formData.profitability}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            profitability: e.target.value,
                                        })
                                    }
                                    min="0"
                                    max="100"
                                    className="w-full px-3 py-3 border border-gray-300 rounded-lg text-base outline-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Competition Level *
                                </label>
                                <select
                                    value={formData.competition}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            competition: e.target.value,
                                        })
                                    }
                                    className="w-full px-3 py-3 border border-gray-300 rounded-lg text-base outline-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                    required
                                >
                                    <option value="">Select Competition</option>
                                    <option value="Low">Low</option>
                                    <option value="Medium">Medium</option>
                                    <option value="High">High</option>
                                </select>
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

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Growing Tips *
                                </label>
                                <textarea
                                    value={formData.tips}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            tips: e.target.value,
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
                                className="flex-1 px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium"
                            >
                                {showAddModal ? "Add Crop" : "Save Changes"}
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <ConfirmModal
                    isOpen={showDeleteModal}
                    onClose={() => setShowDeleteModal(false)}
                    onConfirm={deleteCrop}
                    title="Delete Crop"
                    message={`Are you sure you want to delete "${selectedCrop?.name}"? This action cannot be undone.`}
                    confirmText="Delete"
                    confirmButtonClass="bg-red-600 hover:bg-red-700"
                />
            )}

            <AdminNavigationBar />
        </div>
    );
}

export default AdminCropManagement;
