import { Icon } from "@iconify/react";
import { Link, useNavigate } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../context/AuthContext.jsx";
import ImageUpload from "../../components/ImageUpload";
import supabase from "../../SupabaseClient.jsx";
import ProducerNavigationBar from "../../components/ProducerNavigationBar";
import { getProfileAvatarUrl } from "../../utils/avatarUtils.js";

function ProducerProfile() {
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
    const [stats, setStats] = useState({
        totalProducts: 0,
        totalOrders: 0,
        totalRevenue: 0,
    });

    useEffect(() => {
        const fetchProfile = async () => {
            if (!user) return;
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from("profiles")
                    .select("name, address, contact, avatar_url")
                    .eq("id", user.id)
                    .single();

                if (data) {
                    setProfile({
                        name: data.name || "",
                        email: user.email || "",
                        address: data.address || "",
                        contact: data.contact || "",
                        avatar_url: data.avatar_url || "",
                    });
                } else if (error && error.code === "PGRST116") {
                    // No profile found, use user data
                    setProfile({
                        name: "",
                        email: user.email || "",
                        address: "",
                        contact: "",
                        avatar_url: "",
                    });
                }

                // Fetch real stats from database
                const fetchStats = async () => {
                    // Get total products
                    const { data: productsData } = await supabase
                        .from("products")
                        .select("id", { count: "exact" })
                        .eq("user_id", user.id)
                        .eq("status_id", 1); // Active products only

                    // Get completed orders count
                    const { data: ordersData } = await supabase
                        .from("orders")
                        .select("id", { count: "exact" })
                        .eq("seller_id", user.id)
                        .eq("status_id", 7); // Completed orders

                    // Calculate total revenue from completed orders
                    const { data: revenueData } = await supabase
                        .from("orders")
                        .select(
                            `
                            id,
                            order_items (
                                quantity,
                                price_at_purchase
                            )
                        `
                        )
                        .eq("seller_id", user.id)
                        .eq("status_id", 7); // Completed orders

                    const totalRevenue =
                        revenueData?.reduce((sum, order) => {
                            const orderTotal =
                                order.order_items?.reduce((orderSum, item) => {
                                    return (
                                        orderSum +
                                        item.quantity * item.price_at_purchase
                                    );
                                }, 0) || 0;
                            return sum + orderTotal;
                        }, 0) || 0;

                    setStats({
                        totalProducts: productsData?.length || 0,
                        totalOrders: ordersData?.length || 0,
                        totalRevenue: totalRevenue,
                    });
                };

                await fetchStats();
            } catch (error) {
                console.error("Unexpected error:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [user]);

    const handleLogout = async () => {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) {
                console.error("Error logging out:", error);
            } else {
                setUser(null);
                navigate("/login");
            }
        } catch (error) {
            console.error("Unexpected error during logout:", error);
        }
    };

    // Format phone number for display
    const displayPhoneNumber = (phoneNumber) => {
        if (!phoneNumber) return "";
        const digits = phoneNumber.replace(/\D/g, "");
        if (digits.length >= 11 && digits.startsWith("63")) {
            return phoneNumber; // Already formatted
        }
        return phoneNumber;
    };

    return (
        <div className="min-h-screen w-full flex flex-col relative items-center bg-slate-50/50 text-slate-800 overflow-x-hidden">
            {/* Mobile Header */}
            <header className="md:hidden fixed top-0 left-0 w-full bg-white/95 backdrop-blur-md border-b border-slate-200 z-40 px-4 h-14 flex items-center gap-2">
                <Icon
                    icon="mingcute:user-3-fill"
                    width="20"
                    height="20"
                    className="text-emerald-700"
                />
                <h1 className="text-base font-bold text-slate-900 tracking-tight">
                    Producer Profile
                </h1>
            </header>

            <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 pt-16 md:pt-20 pb-24 md:pb-16">
                {/* Profile Card */}
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden mb-6">
                    <div className="relative h-28 sm:h-32 bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-700">
                        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2">
                            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-full p-1 shadow-md relative">
                                <img
                                    src={getProfileAvatarUrl(profile, user)}
                                    alt="profile"
                                    className="w-full h-full object-cover rounded-full"
                                    onError={(e) => {
                                        e.target.src =
                                            "https://ui-avatars.com/api/?name=Producer&background=random";
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-14 sm:pt-16 pb-6 px-6 text-center">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-[11px] font-semibold text-emerald-800 mb-2">
                            <Icon icon="mingcute:plant-fill" width="13" height="13" />
                            <span>Verified Producer</span>
                        </div>
                        <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight mb-1">
                            {profile.name || "Producer"}
                        </h2>
                        <p className="text-xs text-slate-500 mb-5">
                            {profile.email || user?.email || "No Email"}
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                            <div className="bg-slate-50/80 border border-slate-200/80 p-3 rounded-xl">
                                <div className="flex items-center gap-2 mb-1">
                                    <Icon
                                        icon="mingcute:location-line"
                                        width="15"
                                        height="15"
                                        className="text-emerald-700"
                                    />
                                    <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                                        Farm Address
                                    </span>
                                </div>
                                <p className="text-xs text-slate-600 line-clamp-2">
                                    {profile.address || "No Address Set"}
                                </p>
                            </div>
                            <div className="bg-slate-50/80 border border-slate-200/80 p-3 rounded-xl">
                                <div className="flex items-center gap-2 mb-1">
                                    <Icon
                                        icon="mingcute:phone-line"
                                        width="15"
                                        height="15"
                                        className="text-emerald-700"
                                    />
                                    <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                                        Contact Number
                                    </span>
                                </div>
                                <p className="text-xs text-slate-600 tabular-nums">
                                    {displayPhoneNumber(profile.contact) ||
                                        "No Contact Set"}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-3.5 sm:p-4 text-center hover:shadow-md transition-shadow">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200/80 flex items-center justify-center text-blue-700 mx-auto mb-2">
                            <Icon
                                icon="mingcute:box-line"
                                width="18"
                                height="18"
                            />
                        </div>
                        <p className="text-xl sm:text-2xl font-bold text-slate-900 tabular-nums">
                            {loading ? (
                                <span className="text-xs text-slate-400">
                                    …
                                </span>
                            ) : (
                                stats.totalProducts
                            )}
                        </p>
                        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">
                            Products
                        </p>
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-3.5 sm:p-4 text-center hover:shadow-md transition-shadow">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-700 mx-auto mb-2">
                            <Icon
                                icon="mingcute:box-2-line"
                                width="18"
                                height="18"
                            />
                        </div>
                        <p className="text-xl sm:text-2xl font-bold text-slate-900 tabular-nums">
                            {loading ? (
                                <span className="text-xs text-slate-400">
                                    …
                                </span>
                            ) : (
                                stats.totalOrders
                            )}
                        </p>
                        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">
                            Orders
                        </p>
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-3.5 sm:p-4 text-center hover:shadow-md transition-shadow">
                        <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-700 mx-auto mb-2">
                            <Icon
                                icon="mingcute:currency-dollar-line"
                                width="18"
                                height="18"
                            />
                        </div>
                        <p className="text-base sm:text-lg font-bold text-emerald-700 tabular-nums">
                            {loading ? (
                                <span className="text-xs text-slate-400">
                                    …
                                </span>
                            ) : (
                                `₱${stats.totalRevenue.toLocaleString()}`
                            )}
                        </p>
                        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">
                            Revenue
                        </p>
                    </div>
                </div>

                {/* Account Settings Menu */}
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden mb-5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-4 py-3 bg-slate-50/60 border-b border-slate-100">
                        Account Settings
                    </h3>
                    <div className="divide-y divide-slate-100">
                        <Link
                            to="/edit-profile"
                            className="flex items-center justify-between p-3.5 sm:p-4 hover:bg-slate-50 transition-colors active:scale-[0.99]"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-blue-50 border border-blue-200/80 rounded-xl flex items-center justify-center text-blue-700">
                                    <Icon
                                        icon="mingcute:edit-line"
                                        width="18"
                                        height="18"
                                    />
                                </div>
                                <span className="text-sm font-semibold text-slate-800">
                                    Edit Profile
                                </span>
                            </div>
                            <Icon
                                icon="mingcute:right-line"
                                width="16"
                                height="16"
                                className="text-slate-400"
                            />
                        </Link>

                        <Link
                            to="/farming-guides"
                            className="flex items-center justify-between p-3.5 sm:p-4 hover:bg-slate-50 transition-colors active:scale-[0.99]"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-emerald-50 border border-emerald-200/80 rounded-xl flex items-center justify-center text-emerald-700">
                                    <Icon
                                        icon="mingcute:book-line"
                                        width="18"
                                        height="18"
                                    />
                                </div>
                                <span className="text-sm font-semibold text-slate-800">
                                    Farming Guides
                                </span>
                            </div>
                            <Icon
                                icon="mingcute:right-line"
                                width="16"
                                height="16"
                                className="text-slate-400"
                            />
                        </Link>
                    </div>
                </div>

                {/* Support & Community */}
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden mb-5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-4 py-3 bg-slate-50/60 border-b border-slate-100">
                        Support & Community
                    </h3>
                    <div className="divide-y divide-slate-100">
                        <Link
                            to="/help"
                            className="flex items-center justify-between p-3.5 sm:p-4 hover:bg-slate-50 transition-colors active:scale-[0.99]"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-orange-50 border border-orange-200/80 rounded-xl flex items-center justify-center text-orange-700">
                                    <Icon
                                        icon="mingcute:question-line"
                                        width="18"
                                        height="18"
                                    />
                                </div>
                                <span className="text-sm font-semibold text-slate-800">
                                    Help & Documentation
                                </span>
                            </div>
                            <Icon
                                icon="mingcute:right-line"
                                width="16"
                                height="16"
                                className="text-slate-400"
                            />
                        </Link>

                        <a
                            href="https://www.facebook.com/groups/552845989323006/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-3.5 sm:p-4 hover:bg-slate-50 transition-colors active:scale-[0.99]"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-indigo-50 border border-indigo-200/80 rounded-xl flex items-center justify-center text-indigo-700">
                                    <Icon
                                        icon="mingcute:group-line"
                                        width="18"
                                        height="18"
                                    />
                                </div>
                                <span className="text-sm font-semibold text-slate-800">
                                    Farmer Community Network
                                </span>
                            </div>
                            <Icon
                                icon="mingcute:external-link-line"
                                width="16"
                                height="16"
                                className="text-slate-400"
                            />
                        </a>
                    </div>
                </div>

                {/* Logout Button */}
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                    <button
                        onClick={handleLogout}
                        className="w-full min-h-[44px] flex items-center justify-center gap-2 py-3.5 text-rose-600 hover:bg-rose-50/80 transition-colors text-xs font-bold active:scale-[0.98] cursor-pointer"
                    >
                        <Icon
                            icon="mingcute:exit-line"
                            width="18"
                            height="18"
                        />
                        <span>Sign Out of Producer Portal</span>
                    </button>
                </div>
            </div>
            <ProducerNavigationBar />
        </div>
    );
}

export default ProducerProfile;
