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

                {/* Password Reset Card */}
                <div className="flex flex-col items-center w-full max-w-md">
                    {/* Header */}
                    <div className="mb-6 text-center">
                        <h1 className="text-2xl font-bold mb-2">
                            Reset Password
                        </h1>
                        <p className="text-gray-600 text-sm">
                            Enter your email address and we'll send you a link
                            to reset your password.
                        </p>
                    </div>

                    <form
                        className="w-full max-w-md flex flex-col items-center"
                        onSubmit={handleSubmit}
                    >
                        {/* Email Input */}
                        <input
                            type="email"
                            className="bg-white w-full max-w-sm p-3 rounded-md mb-4 text-base outline-none focus:outline-none focus:ring-0 shadow-sm"
                            placeholder="Enter your email"
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

                        {/* Error Message */}
                        {error && (
                            <div className="w-full max-w-sm mb-4 flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
                                <Icon
                                    icon="mingcute:alert-circle-fill"
                                    width="16"
                                    height="16"
                                />
                                {error}
                            </div>
                        )}

                        {/* Success Message */}
                        {success && (
                            <div className="w-full max-w-sm mb-4 flex items-center gap-2 text-green-600 text-sm bg-green-50 p-3 rounded-lg border border-green-200">
                                <Icon
                                    icon="mingcute:check-circle-fill"
                                    width="16"
                                    height="16"
                                />
                                {success}
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            className="bg-primary text-white w-full max-w-sm p-3 rounded-md mb-4 text-base hover:bg-primary-light transition-colors cursor-pointer font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={loading}
                        >
                            {loading ? (
                                <div className="flex items-center justify-center gap-2">
                                    <Icon
                                        icon="mingcute:loading-line"
                                        width="16"
                                        height="16"
                                        className="animate-spin"
                                    />
                                    Sending...
                                </div>
                            ) : (
                                "Send Reset Link"
                            )}
                        </button>
                    </form>

                    {/* Back to Login Link */}
                    <div className="mt-6 text-center gap-2 flex items-center flex-col">
                        <span className="text-text font-light">
                            Remember your password?
                        </span>
                        <Link
                            to="/login"
                            className="text-primary hover:underline font-medium"
                        >
                            Back to Login
                        </Link>
                    </div>
                </div>
            </div>
            <footer className="mt-8 text-center text-xs text-slate-400">© 2026 Agrilink • Farm-to-Table Marketplace</footer>
        </div>
    );
}

export default ForgotPassword;
