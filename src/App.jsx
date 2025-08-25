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
  const categories = [
    { name: "All", icon: "mdi:apps-box" },
    { name: "Vegetables", icon: "twemoji:carrot" },
    { name: "Meat", icon: "twemoji:cut-of-meat" },
    { name: "Grains", icon: "twemoji:bread" },
    { name: "Seafood", icon: "twemoji:fish" },
    { name: "Beverages", icon: "twemoji:beverage-box" },
    { name: "Snacks", icon: "twemoji:popcorn" },
  ];
  const [selectedCategory, setSelectedCategory] = useState(categories[0].name);

  // Product data with category
  const products = [
    {
      name: "Carrots Fresh From Farm | Very Fresh Carrots | Buy Here Now SSSD",
      price: "$2.50",
      image: "https://www.hhs1.com/hubfs/carrots%20on%20wood-1.jpg",
      address: "Maria Cristina, Purok 9 Zone 3",
      category: "Vegetables",
    },
    {
      name: "Chicken",
      price: "$8.00",
      image: "https://www.hhs1.com/hubfs/carrots%20on%20wood-1.jpg",
      address: "Zone 4, Barangay 5",
      category: "Meat",
    },
    {
      name: "Rice",
      price: "$1.20",
      image: "https://www.hhs1.com/hubfs/carrots%20on%20wood-1.jpg",
      address: "Poblacion, City Center",
      category: "Grains",
    },
    {
      name: "Salmon",
      price: "$12.00",
      image: "https://www.hhs1.com/hubfs/carrots%20on%20wood-1.jpg",
      address: "Seaside Market, Zone 2",
      category: "Seafood",
    },
    {
      name: "Juice",
      price: "$3.00",
      image: "https://www.hhs1.com/hubfs/carrots%20on%20wood-1.jpg",
      address: "Green Valley, Zone 7",
      category: "Beverages",
    },
    {
      name: "Chips",
      price: "$1.50",
      image: "https://www.hhs1.com/hubfs/carrots%20on%20wood-1.jpg",
      address: "Hilltop, Zone 8",
      category: "Snacks",
    },
    {
      name: "Chips",
      price: "$1.50",
      image: "https://www.hhs1.com/hubfs/carrots%20on%20wood-1.jpg",
      address: "Hilltop, Zone 8",
      category: "Snacks",
    },
    {
      name: "Chips",
      price: "$1.50",
      image: "https://www.hhs1.com/hubfs/carrots%20on%20wood-1.jpg",
      address: "Hilltop, Zone 8",
      category: "Snacks",
    },
    {
      name: "Chips",
      price: "$1.50",
      image: "https://www.hhs1.com/hubfs/carrots%20on%20wood-1.jpg",
      address: "Hilltop, Zone 8",
      category: "Snacks",
    },
    {
      name: "Chips",
      price: "$1.50",
      image: "https://www.hhs1.com/hubfs/carrots%20on%20wood-1.jpg",
      address: "Hilltop, Zone 8",
      category: "Snacks",
    },
    {
      name: "Chips",
      price: "$1.50",
      image: "https://www.hhs1.com/hubfs/carrots%20on%20wood-1.jpg",
      address: "Hilltop, Zone 8",
      category: "Snacks",
    },
    // Add more products as needed, with appropriate category
  ];

  // Filter products by selectedCategory
  const filteredProducts =
    selectedCategory === "All"
      ? products
      : products.filter((product) => product.category === selectedCategory);

  return (
    <>
      <div className="min-h-screen w-full flex flex-col relative items-center scrollbar-hide bg-background overflow-x-hidden text-text">
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
              3
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
              9+
            </div>
          </div>
        </div>
        <div className="w-full sm:w-10/12 mt-[120px] flex flex-col items-center overflow-x-hidden">
          <div className="flex overflow-x-auto gap-6 px-4 py-2 scrollbar-hide w-full sm:w-auto md:max-w-4/5 bg-white rounded-xl">
            {categories.map((category, index) => (
              <div
                key={index}
                className={`flex flex-col items-center justify-center min-w-[80px] cursor-pointer ${
                  selectedCategory === category.name
                    ? "bg-primary/10 rounded-lg"
                    : ""
                }`}
                onClick={() => setSelectedCategory(category.name)}
              >
                <Icon
                  icon={category.icon}
                  width="40"
                  height="40"
                  color={
                    selectedCategory === category.name ? "#1976D2" : "#8A8A8A"
                  }
                />
                <span
                  className={`mt-2 text-sm font-medium ${
                    selectedCategory === category.name
                      ? "text-primary"
                      : "text-text"
                  }`}
                >
                  {category.name}
                </span>
              </div>
            ))}
          </div>
          <div className="w-full flex sm:justify-center my-1 mt-6">
            <h2 className="text-xl font-bold text-gray-600 self-start px-4 sm:px-0">
              {selectedCategory} Products
            </h2>
          </div>
          <div className="md:w-11/12 px-2 sm:px-0 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 w-full my-4 pb-16 overflow-x-hidden overflow-y-auto scrollbar-hide">
            {filteredProducts.length === 0 ? (
              <div className="col-span-full text-center text-gray-400 py-8">
                No products found.
              </div>
            ) : (
              filteredProducts.map((product, index) => (
                <div
                  key={index}
                  className="bg-white rounded-lg shadow-md flex flex-col items-center h-full"
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-48 object-cover rounded-md mb-2 rounded-b-none"
                  />
                  <div className="w-full flex flex-col p-3 pt-0 flex-grow">
                    <h3 className="font-medium text-text line-clamp-2 sm:line-clamp-1">
                      {product.name}
                    </h3>
                    <div className="w-full flex justify-between items-center mb-2">
                      <p className="text-primary font-semibold mt-2">
                        {product.price}
                      </p>
                      <p className="text-sm mt-2.5 text-gray-500">100 sold</p>
                    </div>
                    <div className="mt-auto">
                      <div className="flex items-center text-gray-600">
                        <Icon
                          icon="mdi:map-marker"
                          width="14"
                          height="14"
                          className="mr-2 min-w-[14px]"
                        />
                        <span className="text-sm line-clamp-1">
                          {product.address}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="fixed bottom-0 left-0 w-full bg-white shadow-md z-[1000]">
          <div className="flex justify-around items-center py-2">
            <div className="flex flex-col items-center text-primary transition-colors cursor-pointer">
              <Icon icon="ic:baseline-home" width="28" height="28" />
              <span className="text-xs mt-1">Home</span>
            </div>
            <Link
              to="/favorites"
              className="flex flex-col items-center text-gray-600 hover:text-primary transition-colors"
            >
              <Icon icon="ic:baseline-favorite-border" width="28" height="28" />
              <span className="text-xs mt-1">Favorites</span>
            </Link>
            <Link
              to="/profile"
              className="flex flex-col items-center text-gray-600 hover:text-primary transition-colors"
            >
              <Icon icon="ic:baseline-person-outline" width="28" height="28" />
              <span className="text-xs mt-1">Profile</span>
            </Link>
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
