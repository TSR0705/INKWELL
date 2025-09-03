// src/App.jsx
import { Routes, Route } from "react-router-dom";

import Home from "./pages/Home";


export default function App() {
  return (
    <div className="min-h-screen bg-lightBg dark:bg-darkBg transition-colors">
      {/* Navbar */}
      

      {/* Routes */}
      <Routes>
        <Route path="/" element={<Home />} />
     

        {/* future routes here */}
      </Routes>
    </div>
  );
}
