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
        <div className="min-h-screen w-full flex flex-col relative items-center bg-slate-50/50 text-slate-800 overflow-x-hidden">
            {/* Mobile Header */}
            <header className="md:hidden fixed top-0 left-0 w-full bg-white/95 backdrop-blur-md border-b border-slate-200 z-40 px-4 h-14 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => navigate(-1)}
                        className="text-slate-600 hover:text-emerald-700 min-w-[36px] min-h-[36px] flex items-center justify-center transition-colors cursor-pointer"
                        aria-label="Back"
                    >
                        <Icon
                            icon="mingcute:left-line"
                            width="22"
                            height="22"
                        />
                    </button>
                    <h1 className="text-base font-bold text-slate-900 tracking-tight">
                        Farming Guides
                    </h1>
                </div>
            </header>

            <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 pt-16 md:pt-20 pb-24 md:pb-16">
                {/* Info Banner */}
                <div className="mb-6 bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-4 sm:p-5 text-emerald-900 shadow-2xs mt-2">
                    <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-white/80 border border-emerald-200/80 flex items-center justify-center text-emerald-700 shrink-0">
                            <Icon
                                icon="mingcute:book-line"
                                width="18"
                                height="18"
                            />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900 text-sm mb-1 tracking-tight">
                                Learn From Agricultural Experts
                            </h3>
                            <p className="text-slate-600 text-xs leading-relaxed">
                                Access video tutorials and guides curated for local farming conditions. Improve cultivation methods, pest management, and post-harvest handling.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Search and Filters */}
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 mb-6">
                    <div className="flex flex-col sm:flex-row gap-3">
                        {/* Search */}
                        <div className="flex-1 relative">
                            <Icon
                                icon="mingcute:search-line"
                                width="18"
                                height="18"
                                className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400"
                            />
                            <input
                                type="text"
                                placeholder="Search farming guides by crop or technique..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full h-11 pl-10 pr-4 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 transition-all"
                            />
                        </div>

                        {/* Category Filter */}
                        <div className="sm:w-52">
                            <select
                                value={selectedCrop}
                                onChange={(e) =>
                                    setSelectedCrop(e.target.value)
                                }
                                className="w-full h-11 px-3 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-900 outline-none focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 cursor-pointer transition-all"
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
                        {selectedCrop !== "All" && ` in ${selectedCrop}`}
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
                                    className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all duration-200 overflow-hidden"
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
                                            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-2.5 py-0.5 rounded-full text-[11px] font-semibold">
                                                {guide.crop_name}
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
                <div className="mt-8 bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs">
                    <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-700 shrink-0">
                            <Icon
                                icon="mingcute:question-line"
                                width="18"
                                height="18"
                            />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900 text-sm mb-1 tracking-tight">
                                Need Specialized Advice?
                            </h3>
                            <p className="text-slate-600 text-xs leading-relaxed">
                                Can't find the guide you're looking for? Reach out via our Help Center or join our local farmer community network for peer tips and crop consultation.
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
