import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import full_logo from "../assets/full_logo.png";

import { AuthContext } from "../context/AuthContext.jsx";
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
        if (!name.trim()) {
            setError("Please enter a valid name.");
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
                    data: { 
                        display_name: name.trim(),
                        full_name: name.trim() // Store name in user metadata
                    },
                    emailRedirectTo: `${window.location.origin}/account-verified`,
                },
            });
            if (signUpError) {
                setError(signUpError.message);
                setLoading(false);
                return;
            }
            
            // Don't try to update profiles table here since user is unverified
            // The name will be saved to the profile when they verify their email
            
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
        <div className="min-h-screen w-full max-w-full overflow-x-hidden flex items-center justify-center flex-col bg-slate-50/50 text-slate-900 px-4 py-8 sm:py-12">
            <div className="w-full max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-center md:justify-between gap-8 lg:gap-14 my-auto">
                {/* Hero / Brand Section */}
                <div className="flex flex-col items-center md:items-start text-center md:text-left max-w-md">
                    <img
                        src={full_logo}
                        alt="Agrilink"
                        className="w-full max-w-[240px] sm:max-w-[280px] mb-3 object-contain"
                        draggable={false}
                    />
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                        Join Our Local Food Network
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                        Create your account to order farm-fresh produce directly from local growers in Iligan City.
                    </p>
                    <div className="hidden sm:flex items-center gap-2 mt-4 text-[11px] font-medium text-emerald-800">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200/60">
                            <Icon icon="mingcute:check-circle-line" width="13" height="13" className="text-emerald-700" />
                            Direct Farm Access
                        </span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200/60">
                            <Icon icon="mingcute:truck-line" width="13" height="13" className="text-emerald-700" />
                            Fresh Local Delivery
                        </span>
                    </div>
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
                                placeholder="Full Name"
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
            </div>
            <footer className="mt-8 text-center text-xs text-slate-400">© 2026 Agrilink • Farm-to-Table Marketplace</footer>
        </div>
    );
}

export default Register;
