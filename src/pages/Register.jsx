import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import full_logo from "../assets/full_logo.png";

import { AuthContext } from "../App.jsx";
import supabase from "../SupabaseClient.jsx";

function Register() {
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { setUser } = useContext(AuthContext);

    const togglePasswordVisibility = () => {
        setPasswordVisible(!passwordVisible);
    };
    const toggleConfirmPasswordVisibility = () => {
        setConfirmPasswordVisible(!confirmPasswordVisible);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        if (!email || !name || !password || !confirmPassword) {
            setError("All fields are required.");
            return;
        }
        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        setLoading(true);
        const options = {
            emailRedirectTo: `${window.location.origin}/account-verified`,
        };
        try {
            const { data, error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: { display_name: name },
                    emailRedirectTo: `${window.location.origin}/account-verified`,
                },
            });
            if (signUpError) {
                setError(signUpError.message);
                setLoading(false);
                return;
            }
            const userId = data.user?.id;
            if (userId) {
                // Update the profile with the user's name (profile is created automatically by trigger)
                const { error: updateError } = await supabase
                    .from("profiles")
                    .update({ name: name })
                    .eq("id", userId);

                if (updateError) {
                    console.log("Profile update error:", updateError);
                    // Don't fail registration if profile update fails
                }
            }
            setUser(data.user || null);
            setLoading(false);
            navigate("/verify-account");
        } catch (err) {
            setError("Registration failed. Try again.");
            console.log(err);
            setLoading(false);
        }
    };

    return (
        <>
            <div className="min-h-screen min-w-screen flex items-center justify-center flex-col bg-background text-text">
                <div className="w-10/12 max-w-6xl h-[90vh] flex flex-col items-center md:flex-row md:justify-between p-4">
                    <div className="">
                        <img
                            src={full_logo}
                            alt="Full Logo"
                            className="w-full mb-4 max-w-sm"
                            draggable={false}
                        />
                    </div>
                    <div className="flex flex-col items-center w-full max-w-md">
                        <form
                            className="w-full max-w-md flex flex-col items-center"
                            onSubmit={handleSubmit}
                        >
                            <input
                                type="email"
                                className="bg-white w-full max-w-sm p-3 rounded-md mb-4 text-base outline-none focus:outline-none focus:ring-0 shadow-sm"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoComplete="email"
                                required
                            />
                            <input
                                type="text"
                                className="bg-white w-full max-w-sm p-3 rounded-md mb-4 text-base outline-none focus:outline-none focus:ring-0 shadow-sm"
                                placeholder="Name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                autoComplete="name"
                                required
                            />
                            <div className="w-full max-w-sm rounded-md mb-4 relative">
                                <input
                                    type={passwordVisible ? "text" : "password"}
                                    className="bg-white w-full max-w-sm p-3 rounded-md text-base outline-none focus:outline-none focus:ring-0 shadow-sm"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                    autoComplete="new-password"
                                    required
                                />
                                <button
                                    type="button"
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer"
                                    aria-label="Show password"
                                    onClick={togglePasswordVisibility}
                                    tabIndex={-1}
                                >
                                    <Icon
                                        icon={
                                            passwordVisible
                                                ? "mingcute:eye-line"
                                                : "mingcute:eye-close-line"
                                        }
                                        width="24"
                                        height="24"
                                        color="var(--color-text)"
                                    />
                                </button>
                            </div>
                            <div className="w-full max-w-sm rounded-md mb-4 relative">
                                <input
                                    type={
                                        confirmPasswordVisible
                                            ? "text"
                                            : "password"
                                    }
                                    className="bg-white w-full max-w-sm p-3 rounded-md text-base outline-none focus:outline-none focus:ring-0 shadow-sm"
                                    placeholder="Confirm Password"
                                    value={confirmPassword}
                                    onChange={(e) =>
                                        setConfirmPassword(e.target.value)
                                    }
                                    autoComplete="new-password"
                                    required
                                />
                                <button
                                    type="button"
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer"
                                    aria-label="Show password"
                                    onClick={toggleConfirmPasswordVisibility}
                                    tabIndex={-1}
                                >
                                    <Icon
                                        icon={
                                            confirmPasswordVisible
                                                ? "mingcute:eye-line"
                                                : "mingcute:eye-close-line"
                                        }
                                        width="24"
                                        height="24"
                                        color="var(--color-text)"
                                    />
                                </button>
                            </div>
                            {error && (
                                <div className="text-red-500 mb-2 text-sm">
                                    {error}
                                </div>
                            )}
                            <button
                                type="submit"
                                className="bg-primary text-white w-full max-w-sm p-3 rounded-md mb-4 text-base hover:bg-primary-light transition-colors cursor-pointer font-medium"
                                disabled={loading}
                            >
                                {loading ? "Registering..." : "Register"}
                            </button>
                        </form>
                        <div className="mt-10 text-center gap-2 flex items-center">
                            <span className="text-text font-light">
                                Already have an account?
                            </span>
                            <Link
                                to="/"
                                className="text-primary hover:underline font-medium"
                            >
                                Sign in
                            </Link>
                        </div>
                    </div>
                </div>
                <span className="text-gray-300">@2025 Agrilink</span>
            </div>
        </>
    );
}

export default Register;
