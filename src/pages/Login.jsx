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
                                Password
                            </label>
                            <div className="w-full rounded-xl relative">
                                <input
                                    type={passwordVisible ? "text" : "password"}
                                    className="w-full h-11 px-3.5 pr-11 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 transition-all"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                    autoComplete="current-password"
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
                        {error && (
                            <div className="mb-4 flex items-center gap-2 text-rose-700 text-xs bg-rose-50 border border-rose-200/80 p-3 rounded-xl">
                                <Icon
                                    icon="mingcute:alert-circle-fill"
                                    width="16"
                                    height="16"
                                    className="shrink-0"
                                />
                                <span>{error}</span>
                            </div>
                        )}
                        <button
                            type="submit"
                            className="w-full min-h-[44px] h-11 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-sm rounded-xl shadow-xs transition active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                                    <span>Signing in…</span>
                                </>
                            ) : (
                                <span>Sign In</span>
                            )}
                        </button>
                    </form>
                    <div className="flex items-center my-5">
                        <div className="flex-1 h-px bg-slate-200" />
                        <span className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                            or continue with
                        </span>
                        <div className="flex-1 h-px bg-slate-200" />
                    </div>
                    <div className="flex flex-col w-full gap-3">
                        <button
                            type="button"
                            onClick={handleGoogleLogin}
                            disabled={loading}
                            className="w-full min-h-[44px] h-11 flex items-center justify-center gap-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-sm rounded-xl shadow-2xs transition active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Icon
                                icon="flat-color-icons:google"
                                width="20"
                                height="20"
                            />
                            <span>{loading ? "Connecting…" : "Continue with Google"}</span>
                        </button>
                        <div className="flex justify-center mt-1">
                            <Link
                                to="/forgot-password"
                                className="text-emerald-700 hover:text-emerald-800 text-xs font-semibold hover:underline"
                            >
                                Forgot password?
                            </Link>
                        </div>
                    </div>
                    <div className="mt-6 pt-5 border-t border-slate-100 text-center flex items-center justify-center gap-1.5 text-xs text-slate-600">
                        <span>Don't have an account?</span>
                        <Link
                            to="/register"
                            className="text-emerald-700 hover:text-emerald-800 font-semibold hover:underline"
                        >
                            Sign up
                        </Link>
                    </div>
                </div>
            </div>
            <footer className="mt-8 text-center text-xs text-slate-400">© 2026 Agrilink • Farm-to-Table Marketplace</footer>
        </div>
    );
}

export default Login;
