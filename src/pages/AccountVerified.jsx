import { Link, useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import { useContext, useEffect } from "react";
import { AuthContext } from "../App.jsx";
import supabase from "../SupabaseClient.jsx";

function AccountVerified() {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        const updateEmailVerificationStatus = async () => {
            if (user && user.id) {
                try {
                    // Update the profiles table to set email_verified to true
                    const { error } = await supabase
                        .from("profiles")
                        .update({ email_verified: true })
                        .eq("id", user.id);

                    if (error) {
                        console.error(
                            "Error updating email verification status:",
                            error
                        );
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
        // Navigate to home, which will redirect appropriately based on user authentication
        navigate("/");
    };
    return (
        <div className="min-h-screen w-full flex flex-col relative items-center scrollbar-hide bg-background overflow-x-hidden text-text">
            {/* Header */}
            <div className="fixed top-0 left-0 w-full bg-white shadow-md z-50 px-4 py-3 flex justify-between items-center">
                <Link to="/" className="text-gray-600 hover:text-primary">
                    <Icon icon="mingcute:left-line" width="24" height="24" />
                </Link>
                <h1 className="text-lg font-semibold">Account Verification</h1>
                <div className="w-6"></div> {/* Spacer for center alignment */}
            </div>

            {/* Content */}
            <div className="flex-1 flex items-center justify-center px-4 mt-16">
                <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8 text-center">
                    <div className="mb-6">
                        <Icon
                            icon="mingcute:check-circle-fill"
                            width="80"
                            height="80"
                            className="text-green-500 mx-auto mb-4"
                        />
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">
                            Account Verified!
                        </h2>
                        <p className="text-gray-600 text-sm leading-relaxed">
                            Congratulations! Your account has been successfully
                            verified. You can now access all features of
                            AgriLink.
                        </p>
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                        <div className="flex items-center gap-2 text-green-800">
                            <Icon
                                icon="mingcute:trophy-line"
                                width="20"
                                height="20"
                            />
                            <span className="text-sm font-medium">
                                Welcome to AgriLink!
                            </span>
                        </div>
                        <p className="text-green-700 text-xs mt-1">
                            Start exploring fresh products from local farmers in
                            your area.
                        </p>
                    </div>

                    <div className="space-y-3">
                        <button
                            onClick={handleStartShopping}
                            className="w-full bg-primary hover:bg-primary-dark text-white py-3 px-6 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                        >
                            <Icon
                                icon="mingcute:home-2-line"
                                width="20"
                                height="20"
                            />
                            Start Shopping
                        </button>

                        <Link
                            to="/profile"
                            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                        >
                            <Icon
                                icon="mingcute:user-3-line"
                                width="20"
                                height="20"
                            />
                            Complete Profile
                        </Link>
                    </div>

                    <div className="mt-6 pt-6 border-t border-gray-200">
                        <p className="text-gray-500 text-xs">
                            Need help getting started? Check out our guide or
                            contact support.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AccountVerified;
