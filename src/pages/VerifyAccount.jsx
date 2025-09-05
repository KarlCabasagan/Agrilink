import { useContext, useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Icon } from "@iconify/react";
import { AuthContext } from "../App.jsx";
import supabase from "../SupabaseClient.jsx";

function VerifyAccount() {
    const { user, setUser } = useContext(AuthContext);
    const navigate = useNavigate();
    const [resendLoading, setResendLoading] = useState(false);
    const [resendMessage, setResendMessage] = useState("");
    const [logoutLoading, setLogoutLoading] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(60); // 60 seconds cooldown
    const [canResend, setCanResend] = useState(false);

    // Start cooldown timer when component mounts
    useEffect(() => {
        const timer = setInterval(() => {
            setResendCooldown((prev) => {
                if (prev <= 1) {
                    setCanResend(true);
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        // Check if user is already verified and redirect
        if (user && (user.email_confirmed_at || user.confirmed_at)) {
            navigate("/account-verified", { replace: true });
        }
    }, [user, navigate]);

    const handleResendEmail = async () => {
        if (!canResend) return; // Prevent resend during cooldown

        if (!user?.email) {
            setResendMessage("No email found. Please try logging in again.");
            return;
        }

        setResendLoading(true);
        setResendMessage("");

        try {
            const { error } = await supabase.auth.resend({
                type: "signup",
                email: user.email,
                options: {
                    emailRedirectTo: `${window.location.origin}/account-verified`,
                },
            });

            if (error) {
                setResendMessage(
                    "Error sending verification email. Please try again."
                );
                console.error("Resend error:", error);
            } else {
                setResendMessage(
                    "Verification email sent! Please check your inbox."
                );
                // Reset cooldown timer
                setCanResend(false);
                setResendCooldown(60);

                // Start new timer
                const timer = setInterval(() => {
                    setResendCooldown((prev) => {
                        if (prev <= 1) {
                            setCanResend(true);
                            clearInterval(timer);
                            return 0;
                        }
                        return prev - 1;
                    });
                }, 1000);
            }
        } catch (error) {
            setResendMessage(
                "Error sending verification email. Please try again."
            );
            console.error("Resend error:", error);
        } finally {
            setResendLoading(false);
        }
    };

    const handleLogout = async () => {
        setLogoutLoading(true);
        try {
            const { error } = await supabase.auth.signOut();
            if (error) {
                console.error("Logout error:", error);
            } else {
                setUser(null);
                navigate("/login", { replace: true });
            }
        } catch (error) {
            console.error("Logout error:", error);
        } finally {
            setLogoutLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex flex-col relative items-center scrollbar-hide bg-background overflow-x-hidden text-text">
            {/* Header */}
            <div className="fixed top-0 left-0 w-full bg-white shadow-md z-50 px-4 py-3 flex justify-between items-center">
                <div className="w-6"></div> {/* Spacer for center alignment */}
                <h1 className="text-lg font-semibold">Email Verification</h1>
                <button
                    onClick={handleLogout}
                    disabled={logoutLoading}
                    className="text-gray-600 hover:text-red-600 transition-colors disabled:opacity-50"
                    title="Logout"
                >
                    {logoutLoading ? (
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-current"></div>
                    ) : (
                        <Icon
                            icon="mingcute:exit-line"
                            width="24"
                            height="24"
                        />
                    )}
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 flex items-center justify-center px-4 mt-16">
                <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8 text-center">
                    <div className="mb-6">
                        <Icon
                            icon="mingcute:mail-line"
                            width="80"
                            height="80"
                            className="text-primary mx-auto mb-4"
                        />
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">
                            Check Your Email
                        </h2>
                        <p className="text-gray-600 text-sm leading-relaxed">
                            We've sent a verification link to your email
                            address. Please check your inbox and click the link
                            to verify your account.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-center gap-2 text-blue-800">
                                <Icon
                                    icon="mingcute:information-line"
                                    width="20"
                                    height="20"
                                />
                                <span className="text-sm font-medium">
                                    What's next?
                                </span>
                            </div>
                            <p className="text-blue-700 text-xs mt-1">
                                This page will automatically redirect you once
                                your email is verified.
                            </p>
                        </div>

                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <div className="flex items-center gap-2 text-yellow-800">
                                <Icon
                                    icon="mingcute:time-line"
                                    width="20"
                                    height="20"
                                />
                                <span className="text-sm font-medium">
                                    Didn't receive the email?
                                </span>
                            </div>
                            <p className="text-yellow-700 text-xs mt-1">
                                Check your spam folder or contact support if you
                                don't receive it within 10 minutes.
                            </p>
                        </div>
                    </div>

                    {/* Resend message display */}
                    {resendMessage && (
                        <div
                            className={`mt-4 p-3 rounded-lg text-sm ${
                                resendMessage.includes("sent")
                                    ? "bg-green-50 border border-green-200 text-green-800"
                                    : "bg-red-50 border border-red-200 text-red-800"
                            }`}
                        >
                            <div className="flex items-center gap-2">
                                <Icon
                                    icon={
                                        resendMessage.includes("sent")
                                            ? "mingcute:check-circle-line"
                                            : "mingcute:alert-circle-line"
                                    }
                                    width="16"
                                    height="16"
                                />
                                {resendMessage}
                            </div>
                        </div>
                    )}

                    <div className="mt-6 pt-6 border-t border-gray-200">
                        <p className="text-gray-500 text-xs mb-4">
                            Having trouble with verification?
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={handleResendEmail}
                                disabled={resendLoading || !canResend}
                                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {resendLoading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                                        Sending...
                                    </>
                                ) : !canResend ? (
                                    <>
                                        <Icon
                                            icon="mingcute:time-line"
                                            width="16"
                                            height="16"
                                        />
                                        Resend in {resendCooldown}s
                                    </>
                                ) : (
                                    <>
                                        <Icon
                                            icon="mingcute:mail-send-line"
                                            width="16"
                                            height="16"
                                        />
                                        Resend Email
                                    </>
                                )}
                            </button>
                            <button
                                onClick={handleLogout}
                                disabled={logoutLoading}
                                className="flex-1 bg-primary hover:bg-primary-dark text-white py-2 px-4 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {logoutLoading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                                        Logging out...
                                    </>
                                ) : (
                                    <>
                                        <Icon
                                            icon="mingcute:exit-line"
                                            width="16"
                                            height="16"
                                        />
                                        Logout
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default VerifyAccount;
