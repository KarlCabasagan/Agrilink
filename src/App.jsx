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

function AccountVerified() {
  return (
    <>
      <div className="min-h-screen min-w-screen flex items-center justify-center flex-col">
        <Icon
          icon="ph:seal-check"
          width="200"
          height="200"
          color="var(--color-primary)"
        />
        <h2 className="text-2xl font-bold mt-4">Account Verified</h2>
        <p className="text-gray-600 mt-2">
          Your account was successfully verified.
        </p>
        <Link
          to="/"
          className="w-xs mt-8 bg-primary text-white px-6 py-3 rounded-md hover:bg-primary-light transition-colors cursor-pointer font-medium flex justify-center"
        >
          Continue
        </Link>
      </div>
    </>
  );
}

function Home() {
  return (
    <>
      <div className="min-h-screen w-screen flex flex-col relative items-center scrollbar-hide bg-background overflow-x-hidden text-text">
        <div className="fixed top-0 left-0 w-full pt-8 bg-primary z-[1000] flex items-center justify-center py-4">
          <div className="relative w-3/4 max-w-lg ml-4">
            <button
              type="button"
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              aria-label="Search"
            >
              <Icon
                icon="streamline-sharp:magnifying-glass-solid"
                width="24"
                height="24"
              />
            </button>
            <input
              type="text"
              className="bg-white w-full p-3 pl-12 rounded-md text-base outline-none focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
              placeholder="Search..."
            />
          </div>
          <div className="relative">
            <button
              type="button"
              className="ml-2 text-white px-4 py-3 rounded-md hover:bg-primary-light transition-colors cursor-pointer font-medium"
              aria-label="Cart"
            >
              <Icon icon="ic:baseline-shopping-cart" width="28" height="28" />
            </button>
            <div className="absolute top-1 right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full cursor-pointer select-none">
              31
            </div>
          </div>
          <div className="relative">
            <button
              type="button"
              className="ml-2 text-white px-4 py-3 rounded-md hover:bg-primary-light transition-colors cursor-pointer font-medium"
              aria-label="Messages"
            >
              <Icon icon="ic:baseline-message" width="28" height="28" />
            </button>
            <div className="absolute top-1 right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full cursor-pointer select-none">
              5
            </div>
          </div>
        </div>
        <div className="w-full mt-[120px] flex flex-col items-center overflow-x-hidden">
          <div className="flex overflow-x-auto gap-6 px-4 py-2 scrollbar-hide w-full sm:w-auto">
            {[
              { name: "Vegetables", icon: "twemoji:carrot" },
              { name: "Meat", icon: "twemoji:cut-of-meat" },
              { name: "Grains", icon: "twemoji:bread" },
              { name: "Seafood", icon: "twemoji:fish" },
              { name: "Beverages", icon: "twemoji:beverage-box" },
              { name: "Snacks", icon: "twemoji:popcorn" },
            ].map((category, index) => (
              <div
                key={index}
                className="flex flex-col items-center justify-center min-w-[80px] cursor-pointer"
              >
                <Icon icon={category.icon} width="40" height="40" />
                <span className="mt-2 text-sm font-medium text-text">
                  {category.name}
                </span>
              </div>
            ))}
          </div>
          <div className="md:max-w-4/5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 w-full px-4 my-4 overflow-x-hidden overflow-y-auto scrollbar-hide">
            {[
              {
                name: "Carrots",
                price: "$2.50",
                image: "https://www.hhs1.com/hubfs/carrots%20on%20wood-1.jpg",
              },
              {
                name: "Chicken",
                price: "$8.00",
                image: "https://www.hhs1.com/hubfs/carrots%20on%20wood-1.jpg",
              },
              {
                name: "Rice",
                price: "$1.20",
                image: "https://www.hhs1.com/hubfs/carrots%20on%20wood-1.jpg",
              },
              {
                name: "Salmon",
                price: "$12.00",
                image: "https://www.hhs1.com/hubfs/carrots%20on%20wood-1.jpg",
              },
              {
                name: "Juice",
                price: "$3.00",
                image: "https://www.hhs1.com/hubfs/carrots%20on%20wood-1.jpg",
              },
              {
                name: "Chips",
                price: "$1.50",
                image: "https://www.hhs1.com/hubfs/carrots%20on%20wood-1.jpg",
              },
              {
                name: "Chips",
                price: "$1.50",
                image: "https://www.hhs1.com/hubfs/carrots%20on%20wood-1.jpg",
              },
              {
                name: "Chips",
                price: "$1.50",
                image: "https://www.hhs1.com/hubfs/carrots%20on%20wood-1.jpg",
              },
              {
                name: "Chips",
                price: "$1.50",
                image: "https://www.hhs1.com/hubfs/carrots%20on%20wood-1.jpg",
              },
            ].map((product, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow-md p-4 flex flex-col items-center"
              >
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-40 object-cover rounded-md mb-4"
                />
                <h3 className="text-lg font-medium text-text">
                  {product.name}
                </h3>
                <p className="text-primary font-semibold mt-2">
                  {product.price}
                </p>
                <button className="mt-4 bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-light transition-colors font-medium cursor-pointer">
                  Add to Cart
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function App() {
  const [user, setUser] = useState(true);

  return (
    <Router>
      <Routes>
        <Route path="/" element={user ? <Home /> : <Login />} />
        <Route path="/register" element={user ? <Home /> : <Register />} />
        <Route path="/account-verified" element={<AccountVerified />} />
      </Routes>
    </Router>
  );
}

export default App;
