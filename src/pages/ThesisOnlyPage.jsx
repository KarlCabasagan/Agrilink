import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";

function ThesisOnlyPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen w-full flex flex-col relative items-center scrollbar-hide bg-background overflow-x-hidden text-text">
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
                        Feature Notice
                    </h1>
                </div>
            </div>

            <div className="w-full max-w-2xl mx-4 sm:mx-auto my-16 px-4 sm:px-0">
                {/* Main Content */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden mt-4">
                    {/* Icon Section */}
                    <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-8 text-center">
                        <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Icon
                                icon="mingcute:file-text-line"
                                width="48"
                                height="48"
                                className="text-primary"
                            />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">
                            Thesis Recommendation Feature
                        </h2>
                        <p className="text-gray-600">
                            Academic Research Implementation
                        </p>
                    </div>

                    {/* Content Section */}
                    <div className="p-8">
                        <div className="text-center mb-8">
                            <h3 className="text-xl font-semibold text-gray-800 mb-4">
                                This Functionality is Only for Our Thesis
                                Recommendation
                            </h3>
                            <p className="text-gray-600 leading-relaxed mb-6">
                                This feature is currently implemented as part of
                                our academic research and thesis project. It
                                serves as a demonstration of potential
                                functionality that could be developed for future
                                versions of the platform.
                            </p>
                        </div>

                        {/* Feature Info */}
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                            <div className="flex items-start gap-3">
                                <Icon
                                    icon="mingcute:information-line"
                                    width="20"
                                    height="20"
                                    className="text-amber-600 mt-0.5"
                                />
                                <div>
                                    <h4 className="font-semibold text-amber-800 mb-1">
                                        Research Purpose
                                    </h4>
                                    <p className="text-amber-700 text-sm">
                                        This functionality is designed to
                                        showcase potential features and user
                                        interface concepts as part of our
                                        academic thesis on agricultural platform
                                        development.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Future Development */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                            <div className="flex items-start gap-3">
                                <Icon
                                    icon="mingcute:rocket-line"
                                    width="20"
                                    height="20"
                                    className="text-blue-600 mt-0.5"
                                />
                                <div>
                                    <h4 className="font-semibold text-blue-800 mb-1">
                                        Future Development
                                    </h4>
                                    <p className="text-blue-700 text-sm">
                                        Features demonstrated here may be
                                        considered for implementation in future
                                        updates based on research findings and
                                        user feedback collection.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Available Features */}
                        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-8">
                            <div className="flex items-start gap-3">
                                <Icon
                                    icon="mingcute:check-circle-line"
                                    width="20"
                                    height="20"
                                    className="text-emerald-600 mt-0.5"
                                />
                                <div>
                                    <h4 className="font-semibold text-emerald-800 mb-1">
                                        Currently Available
                                    </h4>
                                    <p className="text-emerald-700 text-sm">
                                        Please explore the fully functional
                                        features available in other sections of
                                        the platform, including crop
                                        recommendations, product management, and
                                        farmer networking.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={() => navigate(-1)}
                                className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-200 transition-colors font-medium flex items-center justify-center gap-2"
                            >
                                <Icon
                                    icon="mingcute:left-line"
                                    width="16"
                                    height="16"
                                />
                                Go Back
                            </button>
                            <button
                                onClick={() => navigate("/")}
                                className="flex-1 bg-primary text-white py-3 px-6 rounded-lg hover:bg-primary-dark transition-colors font-medium flex items-center justify-center gap-2"
                            >
                                <Icon
                                    icon="mingcute:home-line"
                                    width="16"
                                    height="16"
                                />
                                Go to Home
                            </button>
                        </div>
                    </div>
                </div>

                {/* Additional Info */}
                <div className="mt-6 text-center">
                    <p className="text-gray-500 text-sm">
                        Thank you for your understanding and participation in
                        our research.
                    </p>
                </div>
            </div>
        </div>
    );
}

export default ThesisOnlyPage;
