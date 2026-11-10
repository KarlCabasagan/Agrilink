import { useContext, useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Icon } from "@iconify/react";
import { AuthContext } from "../context/AuthContext.jsx";
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
        <div className="min-h-screen w-full max-w-full overflow-x-hidden flex flex-col bg-slate-50/50 text-slate-900 pb-16">
            {/* Header */}
            <header className="sticky top-0 left-0 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 z-40 px-4 py-3 flex items-center justify-between">
                <Link
                    to="/login"
                    className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-xl text-slate-700 hover:bg-slate-100 active:scale-95 transition"
                    aria-label="Back to login"
                >
                    <Icon icon="mingcute:left-line" width="22" height="22" />
                </Link>
                <h1 className="text-base font-semibold text-slate-900 tracking-tight">
                    Verify Your Account
                </h1>
                <button
                    onClick={handleLogout}
                    disabled={logoutLoading}
                    type="button"
                    className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 active:scale-95 transition disabled:opacity-50"
                    title="Sign Out"
                    aria-label="Sign out"
                >
                    {logoutLoading ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-slate-400 border-t-transparent"></div>
                    ) : (
                        <Icon icon="mingcute:exit-line" width="22" height="22" />
                    )}
                </button>
            </header>

            {/* Content Card */}
            <main className="flex-1 w-full max-w-md mx-auto px-4 flex items-center justify-center py-8">
                <div className="w-full bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 sm:p-8 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center mx-auto mb-4 shadow-2xs">
                        <Icon icon="mingcute:mail-line" width="34" height="34" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-2">
                        Check Your Inbox
                    </h2>
                    <p className="text-sm text-slate-600 leading-relaxed mb-6 max-w-prose mx-auto">
                        We sent a verification link to{" "}
                        <strong className="text-slate-900 break-all">{user?.email || "your email address"}</strong>.
                        Please tap the link to activate your account.
                    </p>

                    <div className="space-y-3 mb-6 text-left">
                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                            <div className="flex items-center gap-2 text-slate-900 font-semibold text-xs mb-1">
                                <Icon icon="mingcute:information-line" width="16" height="16" className="text-emerald-700" />
                                <span>What happens next?</span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Once you click the link in your email, this screen will automatically refresh and welcome you into the Agrilink marketplace.
                            </p>
                        </div>

                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                            <div className="flex items-center gap-2 text-slate-900 font-semibold text-xs mb-1">
                                <Icon icon="mingcute:time-line" width="16" height="16" className="text-amber-600" />
                                <span>Didn't receive an email?</span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Check your spam folder or wait a moment. Verification links typically arrive within 1–2 minutes.
                            </p>
                        </div>
                    </div>

                    {/* Resend status alert */}
                    {resendMessage && (
                        <div
                            className={`p-3 rounded-xl text-xs font-medium mb-5 flex items-center gap-2 text-left ${
                                resendMessage.includes("sent")
                                    ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                                    : "bg-rose-50 border border-rose-200 text-rose-800"
                            }`}
                        >
                            <Icon
                                icon={
                                    resendMessage.includes("sent")
                                        ? "mingcute:check-circle-line"
                                        : "mingcute:alert-circle-line"
                                }
                                width="18"
                                height="18"
                                className="shrink-0"
                            />
                            <span>{resendMessage}</span>
                        </div>
                    )}

                    <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
                        <button
                            type="button"
                            onClick={handleResendEmail}
                            disabled={resendLoading || !canResend}
                            className="flex-1 min-h-[44px] py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {resendLoading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-slate-600 border-t-transparent"></div>
                                    <span>Sending…</span>
                                </>
                            ) : !canResend ? (
                                <>
                                    <Icon icon="mingcute:time-line" width="16" height="16" />
                                    <span>Resend in <span className="tabular-nums font-bold">{resendCooldown}s</span></span>
                                </>
                            ) : (
                                <>
                                    <Icon icon="mingcute:mail-send-line" width="16" height="16" />
                                    <span>Resend Email</span>
                                </>
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={handleLogout}
                            disabled={logoutLoading}
                            className="flex-1 min-h-[44px] py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs transition active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {logoutLoading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                    <span>Signing out…</span>
                                </>
                            ) : (
                                <>
                                    <Icon icon="mingcute:exit-line" width="16" height="16" />
                                    <span>Sign Out</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default VerifyAccount;
