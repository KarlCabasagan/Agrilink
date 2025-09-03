import { Icon } from "@iconify/react";
import NavigationBar from "../../components/NavigationBar";
import { Link, useNavigate } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../App.jsx";
import supabase from "../../SupabaseClient.jsx";

function Profile() {
    const { user, setUser } = useContext(AuthContext);
    const navigate = useNavigate();
    const [profile, setProfile] = useState({
        name: "",
        email: "",
        address: "",
        contact: "",
    });
    const [loading, setLoading] = useState(true);

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
            if (!user) return;
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from("profiles")
                    .select("name, email, address, contact")
                    .eq("id", user.id)
                    .single();

                if (data) {
                    setProfile({
                        name: data.name || "",
                        email: data.email || user.email || "",
                        address: data.address || "",
                        contact: data.contact || "",
                    });
                } else if (error && error.code === "PGRST116") {
                    // No profile found, create one with user's email
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
                        });
                    }
                }
            } catch (error) {
                console.error("Error fetching profile:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [user]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setUser(null);
        navigate("/", { replace: true });
    };

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
                            <div className="w-24 h-24 bg-white rounded-full p-1 shadow-lg">
                                <img
                                    src="/assets/adel.jpg"
                                    alt="Profile"
                                    className="w-full h-full rounded-full object-cover"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-16 pb-6 px-6 text-center">
                        <h2 className="text-xl font-bold text-gray-800 mb-2">
                            {profile.name || "Consumer"}
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
                            to="/seller-application"
                            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                    <Icon
                                        icon="mingcute:paper-line"
                                        width="20"
                                        height="20"
                                        className="text-purple-600"
                                    />
                                </div>
                                <span className="text-gray-800">
                                    Apply to be a Seller
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

                {/* Orders & Shopping */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 p-4 border-b border-gray-200">
                        My Shopping
                    </h3>
                    <div className="divide-y divide-gray-200">
                        <Link
                            to="/cart"
                            className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                    <Icon
                                        icon="mingcute:shopping-cart-1-line"
                                        width="20"
                                        height="20"
                                        className="text-purple-600"
                                    />
                                </div>
                                <span className="text-gray-800">My Cart</span>
                            </div>
                            <Icon
                                icon="mingcute:right-line"
                                width="16"
                                height="16"
                                className="text-gray-400"
                            />
                        </Link>

                        <Link
                            to="/favorites"
                            className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                                    <Icon
                                        icon="mingcute:heart-line"
                                        width="20"
                                        height="20"
                                        className="text-red-600"
                                    />
                                </div>
                                <span className="text-gray-800">
                                    Favorite Products
                                </span>
                            </div>
                            <Icon
                                icon="mingcute:right-line"
                                width="16"
                                height="16"
                                className="text-gray-400"
                            />
                        </Link>

                        <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                    <Icon
                                        icon="mingcute:truck-line"
                                        width="20"
                                        height="20"
                                        className="text-green-600"
                                    />
                                </div>
                                <span className="text-gray-800">My Orders</span>
                            </div>
                            <Icon
                                icon="mingcute:right-line"
                                width="16"
                                height="16"
                                className="text-gray-400"
                            />
                        </button>

                        <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                                    <Icon
                                        icon="mingcute:history-anticlockwise-line"
                                        width="20"
                                        height="20"
                                        className="text-yellow-600"
                                    />
                                </div>
                                <span className="text-gray-800">
                                    Order History
                                </span>
                            </div>
                            <Icon
                                icon="mingcute:right-line"
                                width="16"
                                height="16"
                                className="text-gray-400"
                            />
                        </button>
                    </div>
                </div>

                {/* Support & Info */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 p-4 border-b border-gray-200">
                        Support & Information
                    </h3>
                    <div className="divide-y divide-gray-200">
                        <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
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
                        </button>
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
            <NavigationBar />
        </div>
    );
}

export default Profile;
