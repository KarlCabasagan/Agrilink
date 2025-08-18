import { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import full_logo from "./assets/full_logo.png";

function Login() {
  return (
    <>
      <div className="min-h-screen min-w-screen flex items-center justify-center">
        <div className="w-10/12 max-w-6xl h-[90vh] bg-black flex flex-col items-center">
          <div className="">
            <img src={full_logo} alt="Full Logo" className="w-full mb-4" />
          </div>
          <div className="bg-red-600 w-10 h-10"></div>
        </div>
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
      </Routes>
    </Router>
  );
}

export default App;
