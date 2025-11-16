import { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import full_logo from "../assets/full_logo.png";
import supabase from "../SupabaseClient.jsx";
import { AuthContext } from "../App.jsx";

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
                                <button
                                    type="button"
                                    className="text-primary hover:underline text-base font-medium cursor-pointer"
                                >
                                    Forgot Password?
                                </button>
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
                <span className="text-gray-300">@2025 Agrilink</span>
            </div>
        </>
    );
}

export default Login;
