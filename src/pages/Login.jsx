import { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import full_logo from "../assets/full_logo.png";
import supabase from "../SupabaseClient.jsx";
import { AuthContext } from "../context/AuthContext.jsx";

function Login() {
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { setUser } = useContext(AuthContext);

    const togglePasswordVisibility = () => {
        setPasswordVisible(!passwordVisible);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        if (!email || !password) {
            setError("Email and password are required.");
            return;
        }
        setLoading(true);
        try {
            const { data, error: loginError } =
                await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
            if (loginError) {
                setError(loginError.message);
                setLoading(false);
                return;
            }
            setUser(data.user || null);
            setLoading(false);
            // Remove manual navigation - let App.jsx handle routing based on verification status
        } catch (err) {
            setError("Login failed. Try again.");
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setError("");
        setLoading(true);
        try {
            const { error: loginError } = await supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                    redirectTo: `${window.location.origin}/account-verified`,
                },
            });
            if (loginError) {
                setError(loginError.message);
                setLoading(false);
                return;
            }
            // Supabase will redirect the browser - no manual navigate needed
        } catch (err) {
            setError("Google login failed. Try again.");
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
                        Direct Farm Marketplace
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                        Connecting Iligan growers with consumers for guaranteed fresh produce with zero middleman markups.
                    </p>
                    <div className="hidden sm:flex items-center gap-2 mt-4 text-[11px] font-medium text-emerald-800">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200/60">
                            <Icon icon="mingcute:check-circle-line" width="13" height="13" className="text-emerald-700" />
                            100% Local Produce
                        </span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200/60">
                            <Icon icon="mingcute:shield-check-line" width="13" height="13" className="text-emerald-700" />
                            Verified Sellers
                        </span>
                    </div>
                </div>
                {/* Form Card */}
                <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 sm:p-8">
                    <div className="mb-6">
                        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                            Welcome back
                        </h2>
                        <p className="text-xs text-slate-500 mt-1">
                            Sign in to your account to continue
                        </p>
                    </div>
                    <form
                        className="w-full flex flex-col"
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
                            <div className="w-full max-w-sm rounded-md mb-4 relative">
                                <input
                                    type={passwordVisible ? "text" : "password"}
                                    className="bg-white w-full max-w-sm p-3 rounded-md text-base outline-none focus:outline-none focus:ring-0 shadow-sm"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                    autoComplete="current-password"
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
                                {loading ? "Logging in..." : "Login"}
                            </button>
                        </form>
                        <div className="flex items-center w-4/5 max-w-md my-4">
                            <div className="flex-grow h-px bg-[#A4A4A4]"></div>
                            <span className="mx-4 text-text translate-">
                                OR
                            </span>
                            <div className="flex-grow h-px bg-[#A4A4A4]"></div>
                        </div>
                        <div className="flex flex-col w-full max-w-sm gap-3">
                            <button
                                type="button"
                                onClick={handleGoogleLogin}
                                disabled={loading}
                                className="flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 p-3 rounded-md hover:bg-gray-100 transition-colors font-medium text-base cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Icon
                                    icon="flat-color-icons:google"
                                    width="24"
                                    height="24"
                                />
                                {loading
                                    ? "Logging in..."
                                    : "Login with Google"}
                            </button>
                            <div className="flex justify-center">
                                <Link
                                    to="/forgot-password"
                                    className="text-primary hover:underline text-base font-medium"
                                >
                                    Forgot Password?
                                </Link>
                            </div>
                        </div>
                        <div className="mt-10 text-center gap-2 flex items-center">
                            <span className="text-text font-light">
                                Don't have an account?
                            </span>
                            <Link
                                to="/register"
                                className="text-primary hover:underline font-medium"
                            >
                                Sign up
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
            <footer className="mt-8 text-center text-xs text-slate-400">© 2026 Agrilink • Farm-to-Table Marketplace</footer>
        </div>
    );
}

export default Login;
