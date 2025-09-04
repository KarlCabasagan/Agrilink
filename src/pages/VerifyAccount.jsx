import { useContext, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Icon } from "@iconify/react";
import { AuthContext } from "../App.jsx";
import supabase from "../SupabaseClient.jsx";

function VerifyAccount() {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        async function checkVerification() {
            if (user) {
                if (user.email_confirmed_at || user.confirmed_at) {
                    navigate("/", { replace: true });
                    return;
                }
                const { data, error } = await supabase.auth.getUser?.();
                const freshUser = data?.user;
                if (
                    freshUser &&
                    (freshUser.email_confirmed_at || freshUser.confirmed_at)
                ) {
                    navigate("/", { replace: true });
                }
            } else {
                const session = supabase.auth.getSession
                    ? null
                    : supabase.auth.session && supabase.auth.session();
                if (session && session.user) {
                    navigate("/", { replace: true });
                }
            }
        }
        checkVerification();
        const interval = setInterval(checkVerification, 4000);
        return () => clearInterval(interval);
    }, [user, navigate]);

    return (
        <div className="min-h-screen w-full flex flex-col relative items-center scrollbar-hide bg-background overflow-x-hidden text-text">
            {/* Header */}
            <div className="fixed top-0 left-0 w-full bg-white shadow-md z-50 px-4 py-3 flex justify-between items-center">
                <Link to="/" className="text-gray-600 hover:text-primary">
                    <Icon icon="mingcute:left-line" width="24" height="24" />
                </Link>
                <h1 className="text-lg font-semibold">Email Verification</h1>
                <div className="w-6"></div> {/* Spacer for center alignment */}
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

                    <div className="mt-6 pt-6 border-t border-gray-200">
                        <p className="text-gray-500 text-xs mb-4">
                            Having trouble with verification?
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <button className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg text-sm transition-colors">
                                Resend Email
                            </button>
                            <Link
                                to="/login"
                                className="flex-1 bg-primary hover:bg-primary-dark text-white py-2 px-4 rounded-lg text-sm transition-colors text-center"
                            >
                                Back to Login
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default VerifyAccount;
