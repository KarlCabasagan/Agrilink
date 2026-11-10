import { Icon } from "@iconify/react/dist/iconify.js";
import { useState } from "react";
import supabase from "../SupabaseClient.jsx";
import { Link, useNavigate } from "react-router-dom";
import full_logo from "../assets/full_logo.png";

function PasswordReset() {
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMessage, setModalMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!password || !confirmPassword) {
            setModalMessage("Please fill in both password fields.");
            setIsSuccess(false);
            setModalOpen(true);
            return;
        }
        if (password !== confirmPassword) {
            setModalMessage("Passwords do not match.");
            setIsSuccess(false);
            setModalOpen(true);
            return;
        }
        if (password.length < 6) {
            setModalMessage("Password must be at least 6 characters long.");
            setIsSuccess(false);
            setModalOpen(true);
            return;
        }

        setIsLoading(true);
        const { error } = await supabase.auth.updateUser({ password });
        setIsLoading(false);

        if (error) {
            setModalMessage("Failed to reset password: " + error.message);
            setIsSuccess(false);
        } else {
            setModalMessage("Password has been reset successfully!");
            setIsSuccess(true);
        }
        setModalOpen(true);
    };

    return (
        <div className="min-h-screen w-full max-w-full overflow-x-hidden flex items-center justify-center flex-col bg-slate-50/50 text-slate-800 p-4 md:p-8">
            {/* Modal */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl border border-slate-200/90 p-6 max-w-sm w-full text-center flex flex-col items-center">
                        <div
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 ${
                                isSuccess
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80"
                                    : "bg-rose-50 text-rose-700 border border-rose-200/80"
                            }`}
                        >
                            <Icon
                                icon={
                                    isSuccess
                                        ? "mingcute:check-circle-fill"
                                        : "mingcute:alert-circle-fill"
                                }
                                width="28"
                                height="28"
                            />
                        </div>
                        <h3 className="text-base font-bold text-slate-900 mb-1">
                            {isSuccess ? "Password Updated" : "Reset Failed"}
                        </h3>
                        <p className="text-xs text-slate-600 mb-5 leading-relaxed">
                            {modalMessage}
                        </p>
                        <button
                            type="button"
                            className="w-full h-10 bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98] text-white font-medium text-xs rounded-xl transition duration-150 flex items-center justify-center cursor-pointer shadow-xs"
                            onClick={() => {
                                setModalOpen(false);
                                if (isSuccess) {
                                    navigate("/login");
                                }
                            }}
                        >
                            {isSuccess ? "Go to Sign In" : "Try Again"}
                        </button>
                    </div>
                </div>
            )}

            <div className="w-full max-w-5xl flex flex-col md:flex-row items-center justify-between gap-8 md:gap-16 py-6 md:py-12">
                {/* Brand Hero Section */}
                <div className="w-full md:w-1/2 flex flex-col items-center md:items-start text-center md:text-left">
                    <Link
                        to="/home"
                        className="inline-block transition-transform active:scale-95"
                    >
                        <img
                            src={full_logo}
                            alt="Agrilink Logo"
                            className="w-48 sm:w-56 md:w-64 mb-6 object-contain"
                            draggable={false}
                        />
                    </Link>
                    <div className="hidden md:flex flex-col gap-3">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-semibold w-fit">
                            <Icon
                                icon="mingcute:shield-check-fill"
                                width="14"
                                height="14"
                            />
                            <span>Secure Credentials</span>
                        </div>
                        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-slate-900">
                            Set up your new password.
                        </h1>
                        <p className="text-sm text-slate-600 max-w-md leading-relaxed">
                            Ensure your Agrilink account stays protected. Enter and confirm your new password below.
                        </p>
                    </div>
                </div>

                {/* Password Reset Card */}
                <div className="w-full md:w-1/2 max-w-md">
                    <div className="w-full bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 sm:p-8 flex flex-col">
                        {/* Card Header */}
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-700 shrink-0">
                                <Icon
                                    icon="mingcute:lock-line"
                                    width="20"
                                    height="20"
                                />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                                    Create New Password
                                </h2>
                                <p className="text-xs text-slate-500">
                                    Choose a secure password for your account
                                </p>
                            </div>
                        </div>

                        {/* Card Content */}
                        <form className="w-full flex flex-col" onSubmit={handleSubmit}>
                            <div className="space-y-4">
                                {/* New Password Field */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                                        New Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={
                                                passwordVisible
                                                    ? "text"
                                                    : "password"
                                            }
                                            placeholder="Enter at least 6 characters"
                                            className="w-full h-11 px-3.5 pr-11 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 transition-all"
                                            value={password}
                                            onChange={(e) =>
                                                setPassword(e.target.value)
                                            }
                                            disabled={isLoading}
                                        />
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setPasswordVisible(
                                                    !passwordVisible
                                                )
                                            }
                                            className="absolute right-0 top-0 bottom-0 w-11 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
                                            aria-label={
                                                passwordVisible
                                                    ? "Hide password"
                                                    : "Show password"
                                            }
                                            tabIndex={-1}
                                        >
                                            <Icon
                                                icon={
                                                    passwordVisible
                                                        ? "mingcute:eye-line"
                                                        : "mingcute:eye-close-line"
                                                }
                                                width="18"
                                                height="18"
                                            />
                                        </button>
                                    </div>
                                </div>

                                {/* Confirm Password Field */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                                        Confirm Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={
                                                confirmPasswordVisible
                                                    ? "text"
                                                    : "password"
                                            }
                                            placeholder="Re-enter your new password"
                                            className="w-full h-11 px-3.5 pr-11 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 transition-all"
                                            value={confirmPassword}
                                            onChange={(e) =>
                                                setConfirmPassword(
                                                    e.target.value
                                                )
                                            }
                                            disabled={isLoading}
                                        />
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setConfirmPasswordVisible(
                                                    !confirmPasswordVisible
                                                )
                                            }
                                            className="absolute right-0 top-0 bottom-0 w-11 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
                                            aria-label={
                                                confirmPasswordVisible
                                                    ? "Hide confirm password"
                                                    : "Show confirm password"
                                            }
                                            tabIndex={-1}
                                        >
                                            <Icon
                                                icon={
                                                    confirmPasswordVisible
                                                        ? "mingcute:eye-line"
                                                        : "mingcute:eye-close-line"
                                                }
                                                width="18"
                                                height="18"
                                            />
                                        </button>
                                    </div>
                                </div>

                                {/* Password Requirements Box */}
                                <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3">
                                    <div className="flex items-start gap-2.5">
                                        <Icon
                                            icon="mingcute:information-line"
                                            width="16"
                                            height="16"
                                            className="text-emerald-700 shrink-0 mt-0.5"
                                        />
                                        <div className="text-slate-600 text-xs">
                                            <p className="font-semibold text-slate-800 mb-1">
                                                Password Recommendations
                                            </p>
                                            <ul className="space-y-0.5 text-slate-600">
                                                <li>• At least 6 characters long</li>
                                                <li>• Use a mix of letters and numbers</li>
                                                <li>• Avoid repeating past passwords</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full h-11 mt-5 bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98] text-white font-medium text-sm rounded-xl transition duration-150 flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
                            >
                                {isLoading ? (
                                    <>
                                        <Icon
                                            icon="mingcute:loading-line"
                                            width="16"
                                            height="16"
                                            className="animate-spin"
                                        />
                                        <span>Updating Password...</span>
                                    </>
                                ) : (
                                    <>
                                        <Icon
                                            icon="mingcute:check-fill"
                                            width="16"
                                            height="16"
                                        />
                                        <span>Update Password</span>
                                    </>
                                )}
                            </button>

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
                        </form>
                    </div>
                </div>
            </div>
            <footer className="mt-8 text-center text-xs text-slate-400">© 2026 Agrilink • Farm-to-Table Marketplace</footer>
        </div>
    );
}

export default PasswordReset;
