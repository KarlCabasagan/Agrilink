import React from "react";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";
import StateView from "../components/StateView.jsx";

function ThesisOnlyPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen w-full flex flex-col items-center bg-slate-50 text-slate-900 pb-16">
            <header className="sticky top-0 left-0 w-full bg-white/95 backdrop-blur-md shadow-xs border-b border-slate-200 z-40 px-4 py-3 flex items-center">
                <button
                    onClick={() => navigate(-1)}
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-700 hover:text-emerald-800 hover:bg-slate-100 rounded-lg transition-colors mr-2 focus-visible:ring-2 focus-visible:ring-emerald-700"
                    aria-label="Go back"
                >
                    <Icon icon="mingcute:left-line" width="22" height="22" />
                </button>
                <h1 className="text-base font-semibold text-slate-900">
                    Feature Notice
                </h1>
            </header>

            <main className="w-full max-w-lg px-4 my-auto py-12">
                <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-6 sm:p-8 text-center">
                    <StateView
                        type="empty"
                        icon="mingcute:flask-line"
                        title="Thesis Research Feature"
                        description="This functionality is reserved for academic research recommendations and is not available in the current production release."
                        actionLabel="Return to Dashboard"
                        onAction={() => navigate("/")}
                    />
                </div>
            </main>
        </div>
    );
}

export default ThesisOnlyPage;
