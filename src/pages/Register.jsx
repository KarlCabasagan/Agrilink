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
                {/* Form Card */}
                <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 sm:p-8">
                    <div className="mb-6">
                        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                            Create your account
                        </h2>
                        <p className="text-xs text-slate-500 mt-1">
                            Start ordering fresh produce directly from local farms
                        </p>
                    </div>
                    <form
                        className="w-full flex flex-col"
                        onSubmit={handleSubmit}
                    >
                        <div className="mb-4">
                            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                                Email Address
                            </label>
                            <input
                                type="email"
                                className="w-full h-11 px-3.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 transition-all"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoComplete="email"
                                required
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                                Full Name
                            </label>
                            <input
                                type="text"
                                className="w-full h-11 px-3.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 transition-all"
                                placeholder="Juan Dela Cruz"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                autoComplete="name"
                                required
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                                Password
                            </label>
                            <div className="w-full relative">
                                <input
                                    type={passwordVisible ? "text" : "password"}
                                    className="w-full h-11 px-3.5 pr-11 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 transition-all"
                                    placeholder="Create password"
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                    autoComplete="new-password"
                                    required
                                />
                                <button
                                    type="button"
                                    className="absolute right-1 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] inline-flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
                                    aria-label={passwordVisible ? "Hide password" : "Show password"}
                                    onClick={togglePasswordVisibility}
                                >
                                    <Icon
                                        icon={
                                            passwordVisible
                                                ? "mingcute:eye-line"
                                                : "mingcute:eye-close-line"
                                        }
                                        width="20"
                                        height="20"
                                    />
                                </button>
                            </div>
                        </div>
                        <div className="mb-4">
                            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                                Confirm Password
                            </label>
                            <div className="w-full relative">
                                <input
                                    type={
                                        confirmPasswordVisible
                                            ? "text"
                                            : "password"
                                    }
                                    className="w-full h-11 px-3.5 pr-11 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 transition-all"
                                    placeholder="Confirm your password"
                                    value={confirmPassword}
                                    onChange={(e) =>
                                        setConfirmPassword(e.target.value)
                                    }
                                    autoComplete="new-password"
                                    required
                                />
                                <button
                                    type="button"
                                    className="absolute right-1 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] inline-flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
                                    aria-label={confirmPasswordVisible ? "Hide password" : "Show password"}
                                    onClick={toggleConfirmPasswordVisibility}
                                >
                                    <Icon
                                        icon={
                                            confirmPasswordVisible
                                                ? "mingcute:eye-line"
                                                : "mingcute:eye-close-line"
                                        }
                                        width="20"
                                        height="20"
                                    />
                                </button>
                            </div>
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
                    <div className="mt-6 pt-5 border-t border-slate-100 text-center flex items-center justify-center gap-1.5 text-xs text-slate-600">
                        <span>Already have an account?</span>
                        <Link
                            to="/login"
                            className="text-emerald-700 hover:text-emerald-800 font-semibold hover:underline"
                        >
                            Sign in
                        </Link>
                    </div>
                </div>
            </div>
            <footer className="mt-8 text-center text-xs text-slate-400">© 2026 Agrilink • Farm-to-Table Marketplace</footer>
        </div>
    );
}

export default Register;
