import { Icon } from "@iconify/react";
import NavigationBar from "../../components/NavigationBar";
import { Link, useNavigate } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../context/AuthContext.jsx";
import supabase from "../../SupabaseClient.jsx";
import { getProfileAvatarUrl } from "../../utils/avatarUtils.js";
import { StateView } from "../../components/StateView.jsx";

function Profile() {
    const { user, setUser } = useContext(AuthContext);
    const navigate = useNavigate();
    const [profile, setProfile] = useState({
        name: "",
        email: "",
        address: "",
        contact: "",
        avatar_url: "",
    });
    const [loading, setLoading] = useState(true);
    const [hasOrdersWithStatus6, setHasOrdersWithStatus6] = useState(false);
    const [hasSellerRejection, setHasSellerRejection] = useState(false);

    // Format phone number for display
    const displayPhoneNumber = (phoneNumber) => {
        if (!phoneNumber) return "";
        const digits = phoneNumber.replace(/\D/g, "");
        if (digits.length >= 11 && digits.startsWith("63")) {
            return phoneNumber; // Already formatted
        }
        return phoneNumber;
    };

    useEffect(() => {
        const fetchProfile = async () => {
            if (!user) {
                setLoading(false);
                return;
            }

            console.log("Fetching profile for user:", user.id); // Debug log
            setLoading(true);

            try {
                const { data, error } = await supabase
                    .from("profiles")
                    .select("name, email, address, contact, avatar_url")
                    .eq("id", user.id)
                    .single();

                console.log("Profile data received:", data); // Debug log
                console.log("Profile error:", error); // Debug log

                if (data) {
                    setProfile({
                        name: data.name || "",
                        email: data.email || user.email || "",
                        address: data.address || "",
                        contact: data.contact || "",
                        avatar_url: data.avatar_url || "",
                    });
                } else if (error && error.code === "PGRST116") {
                    // No profile found, create one with user's email
                    console.log("Creating new profile for user");
                    const { error: insertError } = await supabase
                        .from("profiles")
                        .insert({
                            id: user.id,
                            email: user.email,
                            name: "",
                            address: "",
                            contact: "",
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString(),
                        });

                    if (!insertError) {
                        setProfile({
                            name: "",
                            email: user.email || "",
                            address: "",
                            contact: "",
                            avatar_url: "",
                        });
                    } else {
                        console.error("Error creating profile:", insertError);
                    }
                } else if (error) {
                    console.error("Error fetching profile:", error);
                    // Set profile with user email even if there's an error
                    setProfile({
                        name: "",
                        email: user.email || "",
                        address: "",
                        contact: "",
                        avatar_url: "",
                    });
                }
            } catch (error) {
                console.error("Error fetching profile:", error);
                // Fallback to user email
                setProfile({
                    name: "",
                    email: user.email || "",
                    address: "",
                    contact: "",
                    avatar_url: "",
                });
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [user]);

    // Check for orders with status_id 6 and subscribe to real-time changes
    useEffect(() => {
        if (!user?.id) return;

        const checkOrderStatus = async () => {
            try {
                const { data, error } = await supabase
                    .from("orders")
                    .select("id")
                    .eq("user_id", user.id)
                    .eq("status_id", 6)
                    .limit(1);

                if (!error && data && data.length > 0) {
                    setHasOrdersWithStatus6(true);
                } else {
                    setHasOrdersWithStatus6(false);
                }
            } catch (error) {
                console.error("Error checking order status:", error);
            }
        };

        // Initial check
        checkOrderStatus();

        // Subscribe to real-time changes
        const channel = supabase
            .channel(`orders-status-profile-${user.id}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "orders",
                    filter: `user_id=eq.${user.id}`,
                },
                () => {
                    checkOrderStatus();
                }
            )
            .subscribe();

        return () => {
            channel.unsubscribe();
        };
    }, [user?.id]);

    // Check for seller application rejection and subscribe to real-time changes
    useEffect(() => {
        if (!user?.id) return;

        const checkSellerRejection = async () => {
            try {
                const { data, error } = await supabase
                    .from("seller_applications")
                    .select("rejection_reason")
                    .eq("user_id", user.id)
                    .not("rejection_reason", "is", null)
                    .limit(1);

                if (!error && data && data.length > 0) {
                    setHasSellerRejection(true);
                } else {
                    setHasSellerRejection(false);
                }
            } catch (error) {
                console.error("Error checking seller rejection:", error);
            }
        };

        // Initial check
        checkSellerRejection();

        // Subscribe to real-time changes
        const channel = supabase
            .channel(`seller-apps-profile-${user.id}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "seller_applications",
                    filter: `user_id=eq.${user.id}`,
                },
                () => {
                    checkSellerRejection();
                }
            )
            .subscribe();

        return () => {
            channel.unsubscribe();
        };
    }, [user?.id]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setUser(null);
        navigate("/", { replace: true });
    };

    return (
        <div className="min-h-screen w-full max-w-full overflow-x-hidden flex flex-col bg-slate-50/50 text-slate-900 pb-24 md:pb-12 md:pt-16">
            {/* MOBILE TOP BAR (< 768px) */}
            <header className="md:hidden sticky top-0 left-0 right-0 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 z-40 px-4 py-3 flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="min-w-[44px] min-h-[44px] flex items-center justify-center -ml-2 text-slate-700 hover:text-emerald-800 active:scale-95 transition-all"
                        aria-label="Go back"
                    >
                        <Icon icon="mingcute:left-line" width="22" height="22" />
                    </button>
                    <h1 className="font-bold text-base text-slate-900 tracking-tight">Account Profile</h1>
                </div>
                <button
                    type="button"
                    onClick={() => navigate("/edit-profile")}
                    className="min-h-[36px] px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 active:scale-95 transition-all flex items-center gap-1"
                >
                    <Icon icon="mingcute:edit-line" width="14" height="14" />
                    <span>Edit</span>
                </button>
            </header>

            {/* MAIN CONTENT CONTAINER */}
            <main className="w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 mt-3 md:mt-8 flex-1">
                {/* DESKTOP HEADER (>= 768px) */}
                <div className="hidden md:flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                            Customer Profile
                        </h1>
                        <p className="text-xs text-slate-600 mt-1 max-w-prose">
                            Manage your delivery coordinates, contact info, and account preferences.
                        </p>
                    </div>
                    <Link
                        to="/edit-profile"
                        className="min-h-[44px] px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-sm shadow-xs active:scale-[0.98] transition-all flex items-center gap-2"
                    >
                        <Icon icon="mingcute:edit-line" width="16" height="16" />
                        <span>Edit Profile</span>
                    </Link>
                </div>

                {loading ? (
                    <div className="py-16">
                        <StateView type="loading" title="Loading profile…" />
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* HERO PROFILE CARD */}
                        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-2xs relative overflow-hidden">
                            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
                                {/* Avatar */}
                                <div className="relative">
                                    <div className="w-24 h-24 rounded-2xl p-1 bg-white border border-slate-200/90 shadow-xs overflow-hidden">
                                        <img
                                            src={getProfileAvatarUrl(profile, user)}
                                            alt="Profile"
                                            className="w-full h-full rounded-xl object-cover"
                                            onError={(e) => {
                                                e.target.src = "https://ui-avatars.com/api/?name=User&background=047857&color=fff";
                                            }}
                                        />
                                    </div>
                                    <span className="absolute -bottom-1.5 -right-1.5 bg-emerald-600 text-white p-1 rounded-full shadow-xs" title="Verified Customer">
                                        <Icon icon="mingcute:check-fill" width="14" height="14" />
                                    </span>
                                </div>

                                {/* User Details */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                        <div>
                                            <h2 className="text-xl font-bold text-slate-900">
                                                {profile.name || user?.user_metadata?.full_name || "Valued Consumer"}
                                            </h2>
                                            <p className="text-xs text-slate-500 mt-0.5">
                                                {profile.email || user?.email || "No email linked"}
                                            </p>
                                        </div>
                                        <span className="inline-flex items-center gap-1.5 self-center sm:self-start px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-semibold border border-emerald-100">
                                            <Icon icon="mingcute:leaf-line" width="13" height="13" />
                                            <span>Consumer Account</span>
                                        </span>
                                    </div>

                                    {/* Location & Contact Grid */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-100 text-xs">
                                        <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100 text-left">
                                            <div className="flex items-center gap-1.5 text-slate-500 mb-1 font-medium">
                                                <Icon icon="mingcute:location-line" width="14" height="14" className="text-emerald-700" />
                                                <span>Delivery Address</span>
                                            </div>
                                            <p className="text-slate-800 font-medium line-clamp-2">
                                                {profile.address || "No address specified yet"}
                                            </p>
                                        </div>
                                        <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100 text-left">
                                            <div className="flex items-center gap-1.5 text-slate-500 mb-1 font-medium">
                                                <Icon icon="mingcute:phone-line" width="14" height="14" className="text-emerald-700" />
                                                <span>Contact Phone</span>
                                            </div>
                                            <p className="text-slate-800 font-medium tabular-nums">
                                                {displayPhoneNumber(profile.contact) || "No contact number set"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* MENU: ACCOUNT SETTINGS */}
                        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                            <div className="px-5 py-3.5 border-b border-slate-100">
                                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    Account Settings
                                </h3>
                            </div>
                            <div className="divide-y divide-slate-100">
                                <Link
                                    to="/edit-profile"
                                    className="flex items-center justify-between p-4 hover:bg-slate-50/80 transition-colors duration-150"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-100/80">
                                            <Icon icon="mingcute:edit-line" width="19" height="19" />
                                        </div>
                                        <div>
                                            <span className="font-semibold text-sm text-slate-900 block">Edit Profile</span>
                                            <span className="text-xs text-slate-500">Update name, phone number, and avatar</span>
                                        </div>
                                    </div>
                                    <Icon icon="mingcute:right-line" width="18" height="18" className="text-slate-400" />
                                </Link>

                                <Link
                                    to="/seller-application"
                                    className="flex items-center justify-between p-4 hover:bg-slate-50/80 transition-colors duration-150 relative"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-100/80 relative">
                                            <Icon icon="mingcute:store-2-line" width="19" height="19" />
                                            {hasSellerRejection && (
                                                <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full" />
                                            )}
                                        </div>
                                        <div>
                                            <span className="font-semibold text-sm text-slate-900 block">Apply to be a Producer</span>
                                            <span className="text-xs text-slate-500">Directly list your farm harvest on AgriLink</span>
                                        </div>
                                    </div>
                                    <Icon icon="mingcute:right-line" width="18" height="18" className="text-slate-400" />
                                </Link>
                            </div>
                        </div>

                        {/* MENU: MY SHOPPING */}
                        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                            <div className="px-5 py-3.5 border-b border-slate-100">
                                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    Shopping & Activity
                                </h3>
                            </div>
                            <div className="divide-y divide-slate-100">
                                <Link
                                    to="/orders"
                                    className="flex items-center justify-between p-4 hover:bg-slate-50/80 transition-colors duration-150"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center border border-emerald-100/80 relative">
                                            <Icon icon="mingcute:truck-line" width="19" height="19" />
                                            {hasOrdersWithStatus6 && (
                                                <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse" />
                                            )}
                                        </div>
                                        <div>
                                            <span className="font-semibold text-sm text-slate-900 block">My Orders</span>
                                            <span className="text-xs text-slate-500">Track delivery status and write product reviews</span>
                                        </div>
                                    </div>
                                    <Icon icon="mingcute:right-line" width="18" height="18" className="text-slate-400" />
                                </Link>

                                <Link
                                    to="/cart"
                                    className="flex items-center justify-between p-4 hover:bg-slate-50/80 transition-colors duration-150"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200">
                                            <Icon icon="mingcute:shopping-cart-1-line" width="19" height="19" />
                                        </div>
                                        <div>
                                            <span className="font-semibold text-sm text-slate-900 block">Shopping Cart</span>
                                            <span className="text-xs text-slate-500">View saved produce items ready for checkout</span>
                                        </div>
                                    </div>
                                    <Icon icon="mingcute:right-line" width="18" height="18" className="text-slate-400" />
                                </Link>

                                <Link
                                    to="/favorites"
                                    className="flex items-center justify-between p-4 hover:bg-slate-50/80 transition-colors duration-150"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center border border-red-100/80">
                                            <Icon icon="mingcute:heart-line" width="19" height="19" />
                                        </div>
                                        <div>
                                            <span className="font-semibold text-sm text-slate-900 block">Favorite Produce</span>
                                            <span className="text-xs text-slate-500">Your bookmarked farm products and crops</span>
                                        </div>
                                    </div>
                                    <Icon icon="mingcute:right-line" width="18" height="18" className="text-slate-400" />
                                </Link>
                            </div>
                        </div>

                        {/* MENU: SUPPORT & APP INFO */}
                        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                            <div className="px-5 py-3.5 border-b border-slate-100">
                                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    Support & Guide
                                </h3>
                            </div>
                            <div className="divide-y divide-slate-100">
                                <Link
                                    to="/help"
                                    className="flex items-center justify-between p-4 hover:bg-slate-50/80 transition-colors duration-150"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-100/80">
                                            <Icon icon="mingcute:question-line" width="19" height="19" />
                                        </div>
                                        <div>
                                            <span className="font-semibold text-sm text-slate-900 block">Help & Platform Guide</span>
                                            <span className="text-xs text-slate-500">Ordering rules, delivery minimums, and FAQs</span>
                                        </div>
                                    </div>
                                    <Icon icon="mingcute:right-line" width="18" height="18" className="text-slate-400" />
                                </Link>
                            </div>
                        </div>

                        {/* LOGOUT BUTTON */}
                        <div className="pt-2">
                            <button
                                type="button"
                                onClick={handleLogout}
                                className="w-full min-h-[48px] p-3.5 rounded-2xl bg-white border border-slate-200/90 text-red-600 hover:bg-red-50/60 font-semibold text-sm shadow-2xs active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2"
                            >
                                <Icon icon="mingcute:exit-line" width="18" height="18" />
                                <span>Sign Out of AgriLink</span>
                            </button>
                        </div>
                    </div>
                )}
            </main>

            {/* SHARED NAVIGATION */}
            <NavigationBar />
        </div>
    );
}

export default Profile;
