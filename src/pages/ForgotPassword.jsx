import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import full_logo from "../assets/full_logo.png";
import supabase from "../SupabaseClient.jsx";

function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        // Validate email is not empty
        if (!email.trim()) {
            setError("Email is required.");
            return;
        }

        setLoading(true);

        try {
            const { error: resetError } =
                await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: `${window.location.origin}/reset-password`,
                });

            if (resetError) {
                setError(resetError.message);
                setLoading(false);
                return;
            }

            // Success - show message
            setSuccess("Check your email for a reset link");
            setEmail(""); // Clear the email field
            setLoading(false);

            // Optionally redirect to login after a delay
            setTimeout(() => {
                navigate("/login");
            }, 3000);
        } catch (err) {
            setError("Password reset failed. Try again.");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full max-w-full overflow-x-hidden flex items-center justify-center flex-col bg-slate-50/50 text-slate-900 px-4 py-8 sm:py-12">
            <div className="w-full max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-center md:justify-between gap-8 lg:gap-14 my-auto">
                {/* Hero / Brand Section */}
                <div className="flex flex-col items-center md:items-start text-center md:text-left max-w-md">
                    <img
                        src={full_logo}
                        alt="Agrilink"
                        className="w-full max-w-[240px] sm:max-w-[280px] mb-3 object-contain"
                        draggable={false}
                    />
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                        Account Recovery
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                        Recover access to your Agrilink account and continue managing your fresh produce orders.
                    </p>
                    <div className="hidden sm:flex items-center gap-2 mt-4 text-[11px] font-medium text-emerald-800">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200/60">
                            <Icon icon="mingcute:shield-check-line" width="13" height="13" className="text-emerald-700" />
                            Secure Recovery Link
                        </span>
                    </div>
                </div>

                {/* Form Card */}
                <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 sm:p-8">
                    {/* Header */}
                    <div className="mb-6 text-center">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center mx-auto mb-3 shadow-2xs">
                            <Icon icon="mingcute:key-2-line" width="28" height="28" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                            Reset Password
                        </h2>
                        <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
                            Enter your email address and we'll send you a secure link to reset your account password.
                        </p>
                    </div>

                    <form
                        className="w-full flex flex-col"
                        onSubmit={handleSubmit}
                    >
                        <div className="mb-4">
                            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                                Account Email
                            </label>
                            <input
                                type="email"
                                className="w-full h-11 px-3.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 transition-all"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    setError("");
                                    setSuccess("");
                                }}
                                autoComplete="email"
                                required
                                disabled={loading}
                            />
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="mb-4 flex items-center gap-2 text-rose-700 text-xs bg-rose-50 border border-rose-200/80 p-3 rounded-xl">
                                <Icon
                                    icon="mingcute:alert-circle-fill"
                                    width="16"
                                    height="16"
                                    className="shrink-0"
                                />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Success Message */}
                        {success && (
                            <div className="mb-4 flex items-center gap-2 text-emerald-800 text-xs bg-emerald-50 border border-emerald-200/80 p-3 rounded-xl">
                                <Icon
                                    icon="mingcute:check-circle-fill"
                                    width="16"
                                    height="16"
                                    className="shrink-0 text-emerald-700"
                                />
                                <span>{success}</span>
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            className="w-full h-11 bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98] text-white font-medium text-sm rounded-xl transition duration-150 flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Icon
                                        icon="mingcute:loading-line"
                                        width="16"
                                        height="16"
                                        className="animate-spin"
                                    />
                                    <span>Sending Link...</span>
                                </>
                            ) : (
                                <>
                                    <Icon
                                        icon="mingcute:send-plane-fill"
                                        width="16"
                                        height="16"
                                    />
                                    <span>Send Reset Link</span>
                                </>
                            )}
                        </button>
                    </form>

                    {/* Back to Login Link */}
                    <div className="mt-6 pt-5 border-t border-slate-100 text-center flex flex-col items-center gap-1.5">
                        <span className="text-xs text-slate-500">
                            Remember your password?
                        </span>
                        <Link
                            to="/login"
                            className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 hover:text-emerald-800 transition-colors min-h-[44px] px-2 py-1"
                        >
                            <Icon
                                icon="mingcute:arrow-left-line"
                                width="15"
                                height="15"
                            />
                            <span>Back to Sign In</span>
                        </Link>
                    </div>
                </div>
            </div>
            <footer className="mt-8 text-center text-xs text-slate-400">© 2026 Agrilink • Farm-to-Table Marketplace</footer>
        </div>
    );
}

export default ForgotPassword;
