import { Link, useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import { useContext, useEffect } from "react";
import { AuthContext } from "../context/AuthContext.jsx";
import supabase from "../SupabaseClient.jsx";

function AccountVerified() {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        const updateEmailVerificationStatus = async () => {
            if (user && user.id) {
                try {
                    // Get the name from user metadata
                    const userName =
                        user.user_metadata?.full_name ||
                        user.user_metadata?.display_name ||
                        "";

                    // Update the profiles table with email verification and name
                    const updateData = {
                        email_verified: true,
                        updated_at: new Date().toISOString(),
                    };

                    // Add name to update if it exists in metadata
                    if (userName && userName.trim()) {
                        updateData.name = userName.trim();
                    }

                    const { error } = await supabase.from("profiles").upsert(
                        {
                            id: user.id,
                            email: user.email,
                            ...updateData,
                            created_at: new Date().toISOString(),
                        },
                        {
                            onConflict: "id",
                        }
                    );

                    if (error) {
                        console.error("Error updating profile:", error);
                        // Try a simple update as fallback
                        const { error: fallbackError } = await supabase
                            .from("profiles")
                            .update(updateData)
                            .eq("id", user.id);

                        if (fallbackError) {
                            console.error(
                                "Fallback update error:",
                                fallbackError
                            );
                        }
                    }
                } catch (error) {
                    console.error(
                        "Error updating email verification status:",
                        error
                    );
                }
            }
        };

        updateEmailVerificationStatus();
    }, [user]);

    const handleStartShopping = () => {
        navigate("/");
    };

    return (
        <div className="min-h-screen w-full max-w-full overflow-x-hidden flex flex-col bg-slate-50/50 text-slate-900 pb-16">
            {/* Header */}
            <header className="sticky top-0 left-0 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 z-40 px-4 py-3 flex items-center justify-between">
                <Link
                    to="/"
                    className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-xl text-slate-700 hover:bg-slate-100 active:scale-95 transition"
                    aria-label="Back to home"
                >
                    <Icon icon="mingcute:left-line" width="22" height="22" />
                </Link>
                <h1 className="text-base font-semibold text-slate-900 tracking-tight">
                    Account Verification
                </h1>
                <div className="w-11"></div> {/* Spacer for center alignment */}
            </header>

            {/* Content Card */}
            <main className="flex-1 w-full max-w-md mx-auto px-4 flex items-center justify-center py-8">
                <div className="w-full bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 sm:p-8 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center mx-auto mb-4 shadow-2xs">
                        <Icon
                            icon="mingcute:check-circle-fill"
                            width="36"
                            height="36"
                        />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-2">
                        Account Verified!
                    </h2>
                    <p className="text-sm text-slate-600 leading-relaxed mb-6 max-w-prose mx-auto">
                        Your email has been successfully confirmed. You now have full access to browse and purchase fresh produce directly from local growers.
                    </p>

                    <div className="bg-emerald-50/70 border border-emerald-200/60 rounded-xl p-4 mb-6 text-left">
                        <div className="flex items-center gap-2 text-emerald-900">
                            <Icon
                                icon="mingcute:trophy-line"
                                width="18"
                                height="18"
                                className="text-emerald-700 shrink-0"
                            />
                            <span className="text-xs font-semibold uppercase tracking-wider">
                                Welcome to Agrilink
                            </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                            Support local agriculture with transparent pricing, guaranteed fresh harvest, and direct grower chat.
                        </p>
                    </div>

                    <div className="space-y-3">
                        <button
                            type="button"
                            onClick={handleStartShopping}
                            className="w-full min-h-[44px] py-3 px-5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-sm shadow-xs transition active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                            <Icon
                                icon="mingcute:shopping-bag-1-line"
                                width="18"
                                height="18"
                            />
                            <span>Start Shopping</span>
                        </button>

                        <Link
                            to="/edit-profile"
                            className="w-full min-h-[44px] py-3 px-5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                            <Icon
                                icon="mingcute:user-3-line"
                                width="18"
                                height="18"
                            />
                            <span>Complete Profile</span>
                        </Link>
                    </div>

                    <div className="mt-6 pt-5 border-t border-slate-100">
                        <p className="text-slate-500 text-xs">
                            Have questions? Visit our{" "}
                            <Link to="/help" className="text-emerald-700 font-medium hover:underline">
                                Help &amp; Guides
                            </Link>{" "}
                            to learn more.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default AccountVerified;
