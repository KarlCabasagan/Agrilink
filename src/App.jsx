import { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import full_logo from "./assets/full_logo.png";
import { Icon } from "@iconify/react";

function Login() {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
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
            <form className="w-full max-w-md flex flex-col items-center">
              <input
                type="email"
                className="bg-white w-full max-w-sm p-3 rounded-md mb-4 text-base outline-none focus:outline-none focus:ring-0 shadow-sm"
                placeholder="Email"
              />
              <div className="w-full max-w-sm rounded-md mb-4 relative">
                <input
                  type={passwordVisible ? "text" : "password"}
                  className="bg-white w-full max-w-sm p-3 rounded-md text-base outline-none focus:outline-none focus:ring-0 shadow-sm"
                  placeholder="Password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer"
                  aria-label="Show password"
                  onClick={togglePasswordVisibility}
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
              <button
                type="submit"
                className="bg-primary text-white w-full max-w-sm p-3 rounded-md mb-4 text-base hover:bg-primary-light transition-colors cursor-pointer font-medium"
              >
                Login
              </button>
            </form>
            <div className="flex items-center w-4/5 max-w-md my-4">
              <div className="flex-grow h-px bg-[#A4A4A4]"></div>
              <span className="mx-4 text-text translate-">OR</span>
              <div className="flex-grow h-px bg-[#A4A4A4]"></div>
            </div>
            <div className="flex flex-col w-full max-w-sm gap-3">
              <button
                type="button"
                className="flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 p-3 rounded-md hover:bg-gray-100 transition-colors font-medium text-base cursor-pointer"
              >
                <Icon icon="flat-color-icons:google" width="24" height="24" />
                Login with Google
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

function Register() {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };
  const toggleConfirmPasswordVisibility = () => {
    setConfirmPasswordVisible(!confirmPasswordVisible);
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
            <form className="w-full max-w-md flex flex-col items-center">
              <input
                type="email"
                className="bg-white w-full max-w-sm p-3 rounded-md mb-4 text-base outline-none focus:outline-none focus:ring-0 shadow-sm"
                placeholder="Email"
              />
              <input
                type="text"
                className="bg-white w-full max-w-sm p-3 rounded-md mb-4 text-base outline-none focus:outline-none focus:ring-0 shadow-sm"
                placeholder="Username"
              />
              <div className="w-full max-w-sm rounded-md mb-4 relative">
                <input
                  type={passwordVisible ? "text" : "password"}
                  className="bg-white w-full max-w-sm p-3 rounded-md text-base outline-none focus:outline-none focus:ring-0 shadow-sm"
                  placeholder="Password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer"
                  aria-label="Show password"
                  onClick={togglePasswordVisibility}
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
                  type={confirmPasswordVisible ? "text" : "password"}
                  className="bg-white w-full max-w-sm p-3 rounded-md text-base outline-none focus:outline-none focus:ring-0 shadow-sm"
                  placeholder="Confirm Password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer"
                  aria-label="Show password"
                  onClick={toggleConfirmPasswordVisibility}
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
              <button
                type="submit"
                className="bg-primary text-white w-full max-w-sm p-3 rounded-md mb-4 text-base hover:bg-primary-light transition-colors cursor-pointer font-medium"
              >
                Register
              </button>
            </form>
            <div className="mt-10 text-center gap-2 flex items-center">
              <span className="text-text font-light">
                Already have an account?
              </span>
              <Link to="/" className="text-primary hover:underline font-medium">
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

function Home() {
  return <h2>Home Page</h2>;
}

function App() {
  const [user, setUser] = useState(false);

  return (
    <Router>
      <Routes>
        <Route path="/" element={user ? <Home /> : <Login />} />
        <Route path="/register" element={user ? <Home /> : <Register />} />
      </Routes>
    </Router>
  );
}

export default App;
