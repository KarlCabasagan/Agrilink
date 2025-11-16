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
        <div className="min-h-screen min-w-screen flex items-center justify-center flex-col bg-background text-text">
            <div className="w-10/12 max-w-6xl h-[90vh] flex flex-col items-center md:flex-row md:justify-between p-4">
                {/* Logo Section */}
                <div className="">
                    <img
                        src={full_logo}
                        alt="Full Logo"
                        className="w-full mb-4 max-w-sm"
                        draggable={false}
                    />
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
            <span className="text-gray-300">@2025 Agrilink</span>
        </div>
    );
}

export default ForgotPassword;
