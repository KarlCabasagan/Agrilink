import { Icon } from "@iconify/react/dist/iconify.js";
import { useState } from "react";
import supabase from "../SupabaseClient.jsx";
import { Link } from "react-router-dom";

function PasswordReset() {
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMessage, setModalMessage] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!password || !confirmPassword) {
            setModalMessage("Please fill in both password fields.");
            setModalOpen(true);
            return;
        }
        if (password !== confirmPassword) {
            setModalMessage("Passwords do not match.");
            setModalOpen(true);
            return;
        }
        const { error } = await supabase.auth.updateUser({ password });
        if (error) {
            setModalMessage("Failed to reset password: " + error.message);
        } else {
            setModalMessage("Password has been reset successfully!");
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
                        <Link
                            to={"/edit-profile"}
                            className="mt-2 px-4 py-2 bg-primary text-white rounded hover:bg-primary-light cursor-pointer"
                            onClick={() => setModalOpen(false)}
                        >
                            OK
                        </Link>
                    </div>
                </>
            )}
            <div className="min-h-screen w-full flex items-center flex-col text-text sm:justify-center sm:-translate-y-12">
                <div className="max-w-2xl w-full items-center text-text sm:shadow rounded-lg">
                    <div className="w-full bg-primary sm:rounded-t-lg p-4 pt-8 sm:pt-4">
                        <h1 className="text-2xl font-bold my-4 text-white">
                            Password Reset
                        </h1>
                    </div>
                    <form className="p-4" onSubmit={handleSubmit}>
                        <div className="flex justify-between bg-white w-full p-3 rounded-md mb-4 shadow-sm">
                            <input
                                type={passwordVisible ? "text" : "password"}
                                placeholder="Password"
                                className="w-11/12 text-base outline-none focus:outline-none focus:ring-0"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <button
                                type="button"
                                onClick={() => setPasswordVisible((v) => !v)}
                                tabIndex={-1}
                                className="cursor-pointer"
                            >
                                <Icon
                                    icon={
                                        passwordVisible
                                            ? "mingcute:eye-line"
                                            : "mingcute:eye-close-line"
                                    }
                                    width="24"
                                    height="24"
                                />
                            </button>
                        </div>
                        <input
                            type="password"
                            placeholder="Confirm Password"
                            className="bg-white w-full p-3 rounded-md mb-4 text-base outline-none focus:outline-none focus:ring-0 shadow-sm"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                        <div className="w-full flex justify-end mt-6">
                            <div className="flex gap-2">
                                <Link
                                    to="/edit-profile"
                                    className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300"
                                >
                                    Cancel
                                </Link>
                                <button
                                    type="submit"
                                    className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-light cursor-pointer"
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

export default PasswordReset;
