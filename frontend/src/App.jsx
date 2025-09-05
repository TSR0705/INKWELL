// src/App.jsx
import { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Loader from "./components/Loader";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import CreatePost from "./pages/CreatePost";
import Profile from "./pages/Profile";

export default function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate initial loading (API calls, auth check, etc.)
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000); // 2 sec ka loader
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    // Loader screen dikhayega jab tak loading true hai
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <Loader />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-lightBg dark:bg-darkBg transition-colors">
      {/* Navbar */}


      {/* Routes */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/create" element={<CreatePost />} />
        <Route path="/profile" element={<Profile />} />
        {/* future routes here */}
      </Routes>
    </div>
  );
}
