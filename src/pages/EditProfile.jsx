import { Icon } from "@iconify/react/dist/iconify.js";
import { useState, useEffect, useContext } from "react";
import supabase from "../SupabaseClient.jsx";
import { AuthContext } from "../App.jsx";
import { Link } from "react-router-dom";

function EditProfile() {
    const { user } = useContext(AuthContext);
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [name, setName] = useState("");
    const [address, setAddress] = useState("");
    const [contact, setContact] = useState("");
    const [loading, setLoading] = useState(true);
    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMessage, setModalMessage] = useState("");

    useEffect(() => {
        const fetchProfile = async () => {
            if (!user) return;
            setLoading(true);
            const { data, error } = await supabase
                .from("profiles")
                .select("name, address, contact")
                .eq("id", user.id)
                .single();
            if (data) {
                setName(data.name || "");
                setAddress(data.address || "");
                setContact(data.contact || "");
            }
            setLoading(false);
            if (error) console.log("Error fetching profile:", error);
        };
        fetchProfile();
    }, [user]);

    const handleSubmit = (e) => {
        e.preventDefault();
        // Handle form submission
    };

    const handlePasswordReset = async () => {
        if (!user || !user.email) {
            setModalMessage("User email not found.");
            setModalOpen(true);
            return;
        }
        const { error } = await supabase.auth.resetPasswordForEmail(
            user.email,
            {
                redirectTo: window.location.origin + "/reset-password",
            }
        );
        if (error) {
            setModalMessage(
                "Failed to send password reset email: " + error.message
            );
        } else {
            setModalMessage(
                "Password reset email sent! Please check your inbox."
            );
        }
        setModalOpen(true);
    };

    return (
        <>
            {modalOpen && (
                <>
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black opacity-40"></div>
                    <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full text-center fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
                        <div className="mb-4 text-lg">{modalMessage}</div>
                        <button
                            className="mt-2 px-4 py-2 bg-primary text-white rounded hover:bg-primary-light cursor-pointer"
                            onClick={() => setModalOpen(false)}
                        >
                            OK
                        </button>
                    </div>
                </>
            )}
            <div className="min-h-screen w-full flex items-center flex-col text-text sm:justify-center sm:-translate-y-12">
                <div className="max-w-2xl w-full items-center text-text sm:shadow rounded-lg">
                    <div className="w-full h-36 bg-primary sm:rounded-t-lg p-4 mb-14">
                        <h1 className="text-2xl font-bold my-4 mb-[18px] text-white">
                            Edit Profile
                        </h1>
                        <div className="w-80 flex gap-4">
                            <div className="p-1 bg-white rounded-full shadow">
                                <img
                                    src="/assets/adel.jpg"
                                    alt="profile"
                                    className="h-28 w-28 object-cover rounded-full"
                                />
                            </div>
                            <div className="flex items-center">
                                <input
                                    type="file"
                                    id="profilePicture"
                                    className="hidden"
                                    onChange={(e) => handleProfileChange(e)}
                                />
                                <label
                                    htmlFor="profilePicture"
                                    className="cursor-pointer bg-white text-text shadow-lg px-4 py-2 rounded-lg hover:bg-primary-light hover:text-white hover:bg-secondary-dark"
                                >
                                    Change Picture
                                </label>
                            </div>
                        </div>
                    </div>
                    <form className="p-4" onSubmit={handleSubmit}>
                        <input
                            type="text"
                            placeholder="Name"
                            className="bg-white w-full p-3 rounded-md mb-4 text-base outline-none focus:outline-none focus:ring-0 shadow-sm"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            disabled={loading}
                        />
                        <input
                            type="text"
                            placeholder="Address"
                            className="bg-white w-full p-3 rounded-md mb-4 text-base outline-none focus:outline-none focus:ring-0 shadow-sm"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            disabled={loading}
                        />
                        <input
                            type="text"
                            placeholder="Contact"
                            className="bg-white w-full p-3 rounded-md mb-4 text-base outline-none focus:outline-none focus:ring-0 shadow-sm"
                            value={contact}
                            onChange={(e) => setContact(e.target.value)}
                            disabled={loading}
                        />
                        <div className="w-full flex justify-between mt-6">
                            <div>
                                <button
                                    type="button"
                                    onClick={handlePasswordReset}
                                    className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 cursor-pointer"
                                >
                                    Reset Password
                                </button>
                            </div>
                            <div className="flex gap-2">
                                <Link
                                    to="/profile"
                                    className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300"
                                >
                                    Cancel
                                </Link>
                                <button
                                    type="submit"
                                    className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-light cursor-pointer"
                                    disabled={loading}
                                >
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}

export default EditProfile;
