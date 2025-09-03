// src/App.jsx
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import CreatePost from "./pages/CreatePost";
import Profile from "./pages/Profile";

export default function App() {
  return (
    <div className="min-h-screen bg-lightBg dark:bg-darkBg transition-colors">
      {/* Navbar */}
      <Navbar />

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
