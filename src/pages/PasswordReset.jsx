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
        <div className="min-h-screen min-w-screen flex items-center justify-center flex-col bg-background text-text">
            {/* Modal */}
            {modalOpen && (
                <>
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black opacity-50"></div>
                    <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full text-center fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[10000]">
                        <div className="mb-4">
                            <Icon
                                icon={
                                    isSuccess
                                        ? "mingcute:check-circle-fill"
                                        : "mingcute:alert-circle-fill"
                                }
                                width="48"
                                height="48"
                                className={`mx-auto mb-3 ${
                                    isSuccess
                                        ? "text-green-500"
                                        : "text-red-500"
                                }`}
                            />
                            <p className="text-gray-700">{modalMessage}</p>
                        </div>
                        <button
                            className="inline-block w-full mt-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors cursor-pointer"
                            onClick={() => {
                                setModalOpen(false);
                                if (isSuccess) {
                                    navigate("/login");
                                }
                            }}
                        >
                            OK
                        </button>
                    </div>
                </>
            )}

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
                    {/* Card */}
                    <div className="w-full bg-white rounded-lg shadow-md overflow-hidden">
                        {/* Card Header */}
                        <div className="bg-primary p-6 text-white text-center">
                            <Icon
                                icon="mingcute:lock-line"
                                width="48"
                                height="48"
                                className="mx-auto mb-3"
                            />
                            <h2 className="text-xl font-bold">
                                Create New Password
                            </h2>
                            <p className="text-primary-light text-sm mt-1">
                                Enter your new password below
                            </p>
                        </div>

                        {/* Card Content */}
                        <form className="p-6" onSubmit={handleSubmit}>
                            <div className="space-y-4">
                                {/* New Password Field */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        New Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={
                                                passwordVisible
                                                    ? "text"
                                                    : "password"
                                            }
                                            placeholder="Enter new password"
                                            className="w-full px-3 py-3 pr-10 border border-gray-300 rounded-lg text-base outline-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
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
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                            tabIndex={-1}
                                        >
                                            <Icon
                                                icon={
                                                    passwordVisible
                                                        ? "mingcute:eye-line"
                                                        : "mingcute:eye-close-line"
                                                }
                                                width="20"
                                                height="20"
                                            />
                                        </button>
                                    </div>
                                </div>

                                {/* Confirm Password Field */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Confirm Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={
                                                confirmPasswordVisible
                                                    ? "text"
                                                    : "password"
                                            }
                                            placeholder="Confirm new password"
                                            className="w-full px-3 py-3 pr-10 border border-gray-300 rounded-lg text-base outline-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
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
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                            tabIndex={-1}
                                        >
                                            <Icon
                                                icon={
                                                    confirmPasswordVisible
                                                        ? "mingcute:eye-line"
                                                        : "mingcute:eye-close-line"
                                                }
                                                width="20"
                                                height="20"
                                            />
                                        </button>
                                    </div>
                                </div>

                                {/* Password Requirements Box */}
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                    <div className="flex items-start gap-2">
                                        <Icon
                                            icon="mingcute:information-line"
                                            width="16"
                                            height="16"
                                            className="text-blue-600 mt-0.5"
                                        />
                                        <div className="text-blue-800 text-xs">
                                            <p className="font-medium mb-1">
                                                Password Requirements:
                                            </p>
                                            <ul className="space-y-0.5">
                                                <li>
                                                    • At least 6 characters long
                                                </li>
                                                <li>
                                                    • Use a mix of letters and
                                                    numbers
                                                </li>
                                                <li>
                                                    • Avoid common passwords
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row gap-3 mt-6">
                                <Link
                                    to="/login"
                                    className="flex-1 text-center bg-gray-100 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                                >
                                    Back to Login
                                </Link>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
                                        isLoading
                                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                            : "bg-primary text-white hover:bg-primary-dark"
                                    }`}
                                >
                                    {isLoading ? (
                                        <div className="flex items-center justify-center gap-2">
                                            <Icon
                                                icon="mingcute:loading-line"
                                                width="16"
                                                height="16"
                                                className="animate-spin"
                                            />
                                            Updating...
                                        </div>
                                    ) : (
                                        "Update Password"
                                    )}
                                </button>
                            </div>

                            {/* Back to Login Link */}
                            <div className="mt-6 text-center">
                                <span className="text-text font-light text-sm">
                                    Remember your password?
                                </span>
                                <div>
                                    <Link
                                        to="/login"
                                        className="text-primary hover:underline font-medium text-sm"
                                    >
                                        Back to Login
                                    </Link>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            <span className="text-gray-300">@2025 Agrilink</span>
        </div>
    );
}

export default PasswordReset;
