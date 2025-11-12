import { Icon } from "@iconify/react";
import { Link, useNavigate } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../App.jsx";
import ImageUpload from "../../components/ImageUpload";
import supabase from "../../SupabaseClient.jsx";
import ProducerNavigationBar from "../../components/ProducerNavigationBar";

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

    if (loading) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center bg-background">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full flex flex-col relative items-center scrollbar-hide bg-background overflow-x-hidden text-text pb-20">
            {/* Header */}
            <div className="fixed top-0 left-0 w-full bg-white shadow-md z-50 px-4 py-3">
                <h1 className="text-lg font-semibold text-primary text-center">
                    Profile
                </h1>
            </div>

            <div className="w-full max-w-2xl mx-4 sm:mx-auto my-16">
                {/* Profile Card */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
                    <div className="relative h-32 bg-gradient-to-br from-primary to-primary-dark">
                        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2">
                            <div className="w-24 h-24 bg-white rounded-full p-1 shadow-lg relative">
                                <img
                                    src={
                                        profile.avatar_url || "/assets/adel.jpg"
                                    }
                                    alt="profile"
                                    className="w-full h-full object-cover rounded-full"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-16 pb-6 px-6 text-center">
                        <h2 className="text-xl font-bold text-gray-800 mb-2">
                            {profile.name || "Producer"}
                        </h2>
                        <p className="text-gray-600 mb-4">
                            {profile.email || user?.email || "No Email"}
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                            <div className="bg-gray-50 p-3 rounded-lg">
                                <div className="flex items-center gap-2 mb-1">
                                    <Icon
                                        icon="mingcute:location-line"
                                        width="16"
                                        height="16"
                                        className="text-gray-500"
                                    />
                                    <span className="text-gray-500 font-medium">
                                        Address
                                    </span>
                                </div>
                                <p className="text-gray-700">
                                    {profile.address || "No Address"}
                                </p>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg">
                                <div className="flex items-center gap-2 mb-1">
                                    <Icon
                                        icon="mingcute:phone-line"
                                        width="16"
                                        height="16"
                                        className="text-gray-500"
                                    />
                                    <span className="text-gray-500 font-medium">
                                        Contact
                                    </span>
                                </div>
                                <p className="text-gray-700">
                                    {displayPhoneNumber(profile.contact) ||
                                        "No Contact"}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-white rounded-lg shadow-md p-4 text-center">
                        <Icon
                            icon="mingcute:box-line"
                            width="24"
                            height="24"
                            className="mx-auto mb-2 text-blue-600"
                        />
                        <p className="text-2xl font-bold text-gray-800">
                            {stats.totalProducts}
                        </p>
                        <p className="text-xs text-gray-600">Products</p>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-4 text-center">
                        <Icon
                            icon="mingcute:box-2-line"
                            width="24"
                            height="24"
                            className="mx-auto mb-2 text-green-600"
                        />
                        <p className="text-2xl font-bold text-gray-800">
                            {stats.totalOrders}
                        </p>
                        <p className="text-xs text-gray-600">Orders</p>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-4 text-center">
                        <Icon
                            icon="mingcute:currency-dollar-line"
                            width="24"
                            height="24"
                            className="mx-auto mb-2 text-yellow-600"
                        />
                        <p className="text-lg font-bold text-gray-800">
                            ₱{stats.totalRevenue.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-600">Revenue</p>
                    </div>
                </div>

                {/* Menu Items */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 p-4 border-b border-gray-200">
                        Account Settings
                    </h3>
                    <div className="divide-y divide-gray-200">
                        <Link
                            to="/edit-profile"
                            className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <Icon
                                        icon="mingcute:edit-line"
                                        width="20"
                                        height="20"
                                        className="text-blue-600"
                                    />
                                </div>
                                <span className="text-gray-800">
                                    Edit Profile
                                </span>
                            </div>
                            <Icon
                                icon="mingcute:right-line"
                                width="16"
                                height="16"
                                className="text-gray-400"
                            />
                        </Link>

                        <Link
                            to="/business-settings"
                            className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                    <Icon
                                        icon="mingcute:store-line"
                                        width="20"
                                        height="20"
                                        className="text-purple-600"
                                    />
                                </div>
                                <span className="text-gray-800">
                                    Business Settings
                                </span>
                            </div>
                            <Icon
                                icon="mingcute:right-line"
                                width="16"
                                height="16"
                                className="text-gray-400"
                            />
                        </Link>

                        <Link
                            to="/sales-analytics"
                            className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                    <Icon
                                        icon="mingcute:chart-bar-line"
                                        width="20"
                                        height="20"
                                        className="text-green-600"
                                    />
                                </div>
                                <span className="text-gray-800">
                                    Sales Analytics
                                </span>
                            </div>
                            <Icon
                                icon="mingcute:right-line"
                                width="16"
                                height="16"
                                className="text-gray-400"
                            />
                        </Link>
                    </div>
                </div>

                {/* Support & Info */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 p-4 border-b border-gray-200">
                        Support & Information
                    </h3>
                    <div className="divide-y divide-gray-200">
                        <Link
                            to="/help"
                            className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                                    <Icon
                                        icon="mingcute:question-line"
                                        width="20"
                                        height="20"
                                        className="text-orange-600"
                                    />
                                </div>
                                <span className="text-gray-800">
                                    Help & Support
                                </span>
                            </div>
                            <Icon
                                icon="mingcute:right-line"
                                width="16"
                                height="16"
                                className="text-gray-400"
                            />
                        </Link>

                        <Link
                            to="/farming-guides"
                            className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                                    <Icon
                                        icon="mingcute:book-line"
                                        width="20"
                                        height="20"
                                        className="text-emerald-600"
                                    />
                                </div>
                                <span className="text-gray-800">
                                    Farming Guides
                                </span>
                            </div>
                            <Icon
                                icon="mingcute:right-line"
                                width="16"
                                height="16"
                                className="text-gray-400"
                            />
                        </Link>

                        <a
                            href="https://www.facebook.com/groups/552845989323006/"
                            className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                                    <Icon
                                        icon="mingcute:group-line"
                                        width="20"
                                        height="20"
                                        className="text-indigo-600"
                                    />
                                </div>
                                <span className="text-gray-800">
                                    Farmer Community
                                </span>
                            </div>
                            <Icon
                                icon="mingcute:right-line"
                                width="16"
                                height="16"
                                className="text-gray-400"
                            />
                        </a>
                    </div>
                </div>

                {/* Logout */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-3 p-4 text-red-600 hover:bg-red-50 transition-colors"
                    >
                        <Icon
                            icon="mingcute:exit-line"
                            width="20"
                            height="20"
                        />
                        <span className="font-medium">Log Out</span>
                    </button>
                </div>
            </div>
            <ProducerNavigationBar />
        </div>
    );
}

export default ProducerProfile;
