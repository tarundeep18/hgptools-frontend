import { useState, useRef, useEffect } from "react";
import { Link, Navigate, Outlet, useNavigate } from "react-router-dom";
import {
  Menu,
  X,
  ArrowLeft,
  Grid,
  Settings,
  Maximize2,
  MessageSquare,
  Mail,
  Bell,
  Sun,
  Moon,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Sparkles,
} from "lucide-react";
import Sidebar from "./Sidebar";
import React from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import DashboardLoader from "../PageLoader/DashboardLoader";



export default function DashboardLayout() {
  const { user, loading } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState(null);
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [darkMode, setDarkMode] = useState(() => {
    const savedMode = localStorage.getItem("darkMode");
    if (savedMode !== null) return JSON.parse(savedMode);
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem("darkMode", JSON.stringify(newMode));
  };

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarRef = useRef(null);
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  useEffect(() => {
    if (loading) return;

    if (user) {
      setName(user.name);
      setIsAuthorized(true);

      const roleMessages = {
        admin: "Welcome Admin",
        customer: "Welcome Customer 🛍️",
        user: "Welcome User 👋",
        client: "Welcome back",
      };

      setMessage(roleMessages[user.role] || "Welcome 👋");
    } else {
      setIsAuthorized(false);
    }
  }, [loading, user]);

  if (loading) {
    return <DashboardLoader darkMode={darkMode} />;
  }

  if (!user) return <p>Not Authorized</p>;

  const handleLogout = async () => {
    try {
      await axios.get(
        `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/user/logout`,
        { withCredentials: true },
      );
      toast.success("Logged out successfully");
      navigate("/login");
    } catch (err) {
      console.error("Logout failed", err);
      toast.error("Failed to logout");
    }
  };

  return (
    <div className={`flex h-screen overflow-hidden ${darkMode ? "dark" : ""}`}>
      {/* Mobile Sidebar Toggle Button */}
      {/* Mobile Sidebar Toggle */}
      <div className="fixed top-4 left-4 z-[120] md:hidden">
        <button
          type="button"
          onClick={() => setSidebarOpen((open) => !open)}
          className={`p-2 rounded-md shadow-sm transition-colors ${
            darkMode
              ? "bg-gray-800 text-white hover:bg-gray-700"
              : "bg-gray-100 text-gray-800 hover:bg-gray-200"
          }`}
          aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className={`
    fixed md:relative
    inset-y-0 left-0
    z-[100]
    w-[60%] sm:w-72 md:w-64
    shadow-md
    h-full
    overflow-hidden
    transition-transform duration-300 ease-in-out
    ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
    md:translate-x-0
    ${darkMode ? "bg-gray-900 text-gray-100" : "bg-white text-gray-800"}
  `}
      >
        <Sidebar darkMode={darkMode} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Navbar */}
        <header
          className={`sticky top-0 z-30 w-full shadow-sm ${
            darkMode ? "bg-gray-900 text-white" : "bg-white text-gray-800"
          }`}
        >
          {/* Top Row */}
          <div
            className={`min-h-20 flex items-center 
        justify-between gap-3 
        px-4 md:px-8 py-3
        border-b ${darkMode ? "border-gray-800" : "border-gray-100"}`}
          >
            {/* Left */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {/* Greeting */}
              <div className="flex-shrink-0 hidden xs:block">
                <div
                  className={`text-sm md:text-base font-semibold ${
                    darkMode ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  {message}
                </div>

                <div
                  className={`text-base md:text-lg font-bold capitalize ${
                    darkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  {name}
                </div>
              </div>

             
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Dark Mode */}
              <button
                onClick={toggleDarkMode}
                className={`p-2 rounded-lg transition-all ${
                  darkMode
                    ? "bg-gray-800 text-yellow-400 hover:bg-gray-700"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              {/* Profile */}
              <div className="relative">
                <div
                  className={`group flex items-center gap-2 
              pl-2 pr-2 sm:pr-3 py-1.5
              cursor-pointer rounded-xl
              ${
                darkMode ? "hover:bg-white/10" : "hover:bg-gray-100 shadow-sm"
              }`}
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                >
                  {/* Avatar */}
                  <div className="relative">
                    <div
                      className={`w-10 h-10 sm:w-12 sm:h-12 
                  rounded-xl overflow-hidden border-2
                  ${darkMode ? "border-gray-700" : "border-white shadow-sm"}`}
                    >
                      <img
                        src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80"
                        alt="User"
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <span
                      className="absolute bottom-0 right-0 
                  w-2.5 h-2.5 bg-green-500 
                  border-2 border-white 
                  dark:border-gray-900 rounded-full"
                    />
                  </div>

                  {/* User Info */}
                  <div className="hidden sm:flex flex-col">
                    <p
                      className={`text-sm font-semibold capitalize ${
                        darkMode ? "text-gray-100" : "text-gray-900"
                      }`}
                    >
                      {name}
                    </p>

                    <span
                      className="text-[10px] uppercase font-bold
                  px-1.5 py-0.5 rounded
                  bg-indigo-500/10 text-indigo-500"
                    >
                      {user.role}
                    </span>
                  </div>
                </div>

                {/* Dropdown */}
                {/* Dropdown */}
{dropdownOpen && (
  <>
    {/* Click outside overlay */}
    <div
      className="fixed inset-0 z-[100]"
      onClick={() => setDropdownOpen(false)}
    />

    {/* Dropdown menu */}
    <div
      className={`absolute right-0 top-full mt-2
        w-64 max-w-[90vw]
        rounded-xl shadow-2xl ring-1
        z-[110]
        pointer-events-auto
        ${
          darkMode
            ? "bg-gray-900 ring-white/10 text-gray-200"
            : "bg-white ring-black/5 text-gray-700"
        }`}
    >
      <div className="px-4 py-3 border-b border-inherit">
        <p className="text-xs uppercase opacity-50">
          Signed in as
        </p>

        <p className="text-sm truncate">
          {user.email}
        </p>
      </div>

      <div className="p-1.5">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleLogout();
          }}
          className={`relative z-[120]
            flex items-center gap-3
            w-full px-3 py-2
            text-sm rounded-lg
            cursor-pointer
            pointer-events-auto
            ${
              darkMode
                ? "hover:bg-red-900/20 text-red-400"
                : "hover:bg-red-50 text-red-600"
            }`}
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </div>
  </>
)}
              </div>
            </div>
          </div>
        </header>

        {/* Page */}
        <main
          className={`flex-1 overflow-y-auto 
      p-3 sm:p-4
      transition-colors duration-300
      ${darkMode ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-800"}`}
        >
          <Outlet context={{ darkMode }} />
        </main>
      </div>
    </div>
  );
}
