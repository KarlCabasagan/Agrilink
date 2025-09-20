import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";
import ProducerNavigationBar from "../../components/ProducerNavigationBar";
import supabase from "../../SupabaseClient";

function FarmingGuides() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCrop, setSelectedCrop] = useState("All");
    const [loading, setLoading] = useState(true);
    const [farmingGuides, setFarmingGuides] = useState([]);
    const [crops, setCrops] = useState(["All"]);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        await Promise.all([fetchFarmingGuides(), fetchCropsForFilter()]);
        setLoading(false);
    };

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
                addedDate: guide.created_at,
                views: guide.views || 0, // Assuming a 'views' column exists or defaulting to 0
            }));
            setFarmingGuides(formattedGuides);
        }
    };

    const fetchCropsForFilter = async () => {
        const { data, error } = await supabase.from("crops").select("name");
        if (error) {
            console.error("Error fetching crops:", error);
        } else {
            const cropNames = data.map((c) => c.name);
            setCrops(["All", "General", ...new Set(cropNames)]);
        }
    };

    // Helper function to extract video ID from YouTube URL
    const getYouTubeVideoId = (url) => {
        const regExp =
            /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return match && match[2].length === 11 ? match[2] : null;
    };

    // Filter guides based on search and category
    const filteredGuides = farmingGuides.filter((guide) => {
        const matchesSearch =
            guide.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            guide.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
            guide.crop_name.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesCrop =
            selectedCrop === "All" || guide.crop_name === selectedCrop;

        return matchesSearch && matchesCrop;
    });

    const formatViews = (views) => {
        if (views >= 1000) {
            return `${(views / 1000).toFixed(1)}k views`;
        }
        return `${views} views`;
    };

    if (loading) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center bg-background">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading farming guides...</p>
                </div>
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
                        Farming Guides
                    </h1>
                </div>
            </div>

            <div className="w-full max-w-6xl mx-4 sm:mx-auto my-16 px-4 sm:px-0">
                {/* Info Banner */}
                <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-lg p-4 mt-4">
                    <div className="flex items-start gap-3">
                        <Icon
                            icon="mingcute:book-line"
                            width="24"
                            height="24"
                            className="text-emerald-600 mt-0.5"
                        />
                        <div>
                            <h3 className="font-semibold text-emerald-800 mb-1">
                                Learn From Expert Farmers
                            </h3>
                            <p className="text-emerald-700 text-sm">
                                Access video tutorials and guides curated by
                                agricultural experts. Improve your farming
                                techniques and increase your crop yields.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Search and Filters */}
                <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        {/* Search */}
                        <div className="flex-1 relative">
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
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                        </div>

                        {/* Category Filter */}
                        <div className="sm:w-48">
                            <select
                                value={selectedCrop}
                                onChange={(e) =>
                                    setSelectedCrop(e.target.value)
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            >
                                {crops.map((crop) => (
                                    <option key={crop} value={crop}>
                                        {crop}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Results Count */}
                <div className="mb-4">
                    <p className="text-gray-600 text-sm">
                        Showing {filteredGuides.length} of{" "}
                        {farmingGuides.length} guides
                        {selectedCrop !== "All" &&
                            ` in ${selectedCrop}`}
                        {searchTerm && ` matching "${searchTerm}"`}
                    </p>
                </div>

                {/* Guides Grid */}
                {filteredGuides.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredGuides.map((guide) => {
                            const videoId = getYouTubeVideoId(guide.videoUrl);
                            return (
                                <div
                                    key={guide.id}
                                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
                                >
                                    {/* Video Player */}
                                    <div className="relative bg-gray-200 h-48">
                                        {videoId ? (
                                            <iframe
                                                src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1&origin=${window.location.origin}`}
                                                title={guide.name}
                                                className="w-full h-full"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                                allowFullScreen
                                            />
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
                                            <span className="bg-primary/10 text-primary px-2 py-1 rounded text-xs font-medium">
                                                {guide.crop_name}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                {formatViews(guide.views)}
                                            </span>
                                        </div>

                                        <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2">
                                            {guide.name}
                                        </h3>

                                        <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                                            {guide.summary}
                                        </p>

                                        <div className="flex items-center text-sm text-gray-500">
                                            <div className="flex items-center gap-1">
                                                <Icon
                                                    icon="mingcute:calendar-line"
                                                    width="14"
                                                    height="14"
                                                />
                                                <span>
                                                    {new Date(
                                                        guide.addedDate
                                                    ).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow-md p-12 text-center">
                        <Icon
                            icon="mingcute:search-line"
                            width="64"
                            height="64"
                            className="mx-auto text-gray-300 mb-4"
                        />
                        <h3 className="text-lg font-semibold text-gray-600 mb-2">
                            No Guides Found
                        </h3>
                        <p className="text-gray-500 mb-4">
                            {searchTerm
                                ? `No guides match your search "${searchTerm}"`
                                : selectedCrop !== "All"
                                ? `No guides available in ${selectedCrop} category`
                                : "No farming guides available at the moment"}
                        </p>
                        {(searchTerm || selectedCrop !== "All") && (
                            <button
                                onClick={() => {
                                    setSearchTerm("");
                                    setSelectedCrop("All");
                                }}
                                className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
                            >
                                Clear Filters
                            </button>
                        )}
                    </div>
                )}

                {/* Help Section */}
                <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                        <Icon
                            icon="mingcute:question-line"
                            width="24"
                            height="24"
                            className="text-blue-600 mt-0.5"
                        />
                        <div>
                            <h3 className="font-semibold text-blue-800 mb-1">
                                Need Help?
                            </h3>
                            <p className="text-blue-700 text-sm">
                                Can't find the guide you're looking for? Contact
                                our agricultural experts for personalized
                                farming advice and support.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <ProducerNavigationBar />
        </div>
    );
}

export default FarmingGuides;
