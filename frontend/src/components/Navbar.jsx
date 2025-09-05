// Navbar.jsx — Inkwell Blogging Platform
// Tech: React + Tailwind CSS + Framer Motion
// Features: animated branding, staggered links, expanding search, theme toggle,
// notifications dropdown with shake, profile menu, responsive hamburger + slideout,
// sticky/shrinking on scroll, glassmorphism, full dark/light support.

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import {
  Search,
  Bell,
  Sun,
  Moon,
  Menu,
  X,
  ChevronDown,
  LogOut,
  Settings,
  User,
} from "lucide-react";

export default function Navbar({ current = "home", user = {} }) {
  const [dark, setDark] = useState(() =>
    typeof document !== "undefined" && document.documentElement.classList.contains("dark")
  );
  const [scrolled, setScrolled] = useState(false);
  const [scrollUp, setScrollUp] = useState(true);
  const lastY = useRef(0);

  const [mobileOpen, setMobileOpen] = useState(false);

  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);

  const [notifOpen, setNotifOpen] = useState(false);
  const [notifCount, setNotifCount] = useState(2); // mock new notifications
  const bellControls = useAnimation();

  const [profileOpen, setProfileOpen] = useState(false);

  // Apply dark mode to <html>
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  // Sticky + shrinking navbar behavior
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 12);
      setScrollUp(y < lastY.current);
      lastY.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Bell shake when new notifications
  useEffect(() => {
    if (notifCount > 0) {
      bellControls.start({
        rotate: [0, -15, 12, -8, 5, 0],
        transition: { duration: 0.6, ease: "easeInOut" },
      });
    }
  }, [notifCount, bellControls]);

  // Mock search source
  const searchSource = useMemo(
    () => [
      "Agentic AI",
      "Cloud Patterns",
      "UI Design",
      "React Hooks",
      "Framer Motion",
      "Scaling Backends",
      "Prompt Engineering",
      "Dark Mode UX",
      "TypeScript Tips",
    ],
    []
  );

  useEffect(() => {
    if (!query.trim()) return setSuggestions([]);
    const id = setTimeout(() => {
      const q = query.toLowerCase();
      const res = searchSource.filter((s) => s.toLowerCase().includes(q)).slice(0, 6);
      setSuggestions(res);
    }, 150);
    return () => clearTimeout(id);
  }, [query, searchSource]);

  // Close popovers on outside click
  const popoverRef = useRef(null);
  useEffect(() => {
    const onClick = (e) => {
      if (!popoverRef.current) return;
      if (!popoverRef.current.contains(e.target)) {
        setNotifOpen(false);
        setProfileOpen(false);
      }
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  const links = [
    { key: "home", label: "Home", href: "/" },
    { key: "explore", label: "Explore", href: "/explore" },
    { key: "create", label: "Create", href: "/create" },
    { key: "dashboard", label: "Dashboard", href: "/dashboard" },
  ];

  const initials = (user?.name || user?.username || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <motion.header
      role="banner"
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`sticky top-0 z-50 w-full backdrop-blur-lg transition-[height,background,box-shadow] duration-300
        ${
          scrolled
            ? "shadow-lg bg-white/60 dark:bg-[#22264a]/40"
            : "bg-white/40 dark:bg-[#22264a]/30"
        } ${scrollUp ? "" : ""}`}
    >
      <div
        className={`mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8
        transition-all duration-300 ${scrolled ? "py-2" : "py-3"}`}
        ref={popoverRef}
      >
        <nav className="flex items-center gap-3">
          {/* Mobile: hamburger */}
          <button
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            onClick={() => setMobileOpen((s) => !s)}
            className="md:hidden mr-1 p-2 rounded-lg bg-white/60 dark:bg-black/30 hover:bg-white/80 dark:hover:bg-black/50 transition"
          >
            <motion.div initial={false} animate={mobileOpen ? "open" : "closed"} className="relative w-5 h-5">
              <motion.span
                variants={{ closed: { rotate: 0, y: -4 }, open: { rotate: 45, y: 0 } }}
                className="absolute left-0 right-0 h-0.5 bg-current"
              />
              <motion.span
                variants={{ closed: { opacity: 1 }, open: { opacity: 0 } }}
                className="absolute left-0 right-0 top-2 h-0.5 bg-current"
              />
              <motion.span
                variants={{ closed: { rotate: 0, y: 4 }, open: { rotate: -45, y: 0 } }}
                className="absolute left-0 right-0 bottom-0 h-0.5 bg-current"
              />
            </motion.div>
          </button>

          {/* Branding */}
          <motion.a
            href="/"
            className="relative group select-none"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <span
              className="text-xl sm:text-2xl font-extrabold tracking-tight
              bg-gradient-to-r from-[#F2BED1] via-[#FDCEDF] to-[#C8B6E2]
              bg-clip-text text-transparent"
            >
              Inkwell
            </span>
            <span
              className="absolute -inset-1 rounded-xl opacity-0 blur-md transition group-hover:opacity-70
              bg-gradient-to-r from-[#F2BED1]/60 via-[#FDCEDF]/50 to-[#C8B6E2]/60"
              aria-hidden
            />
          </motion.a>

          {/* Desktop links */}
          <motion.ul
            className="hidden md:flex items-center gap-1 ml-2"
            initial="hidden"
            animate="show"
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: { staggerChildren: 0.06, delayChildren: 0.15 },
              },
            }}
          >
            {links.map((l) => (
              <motion.li key={l.key} variants={{ hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0 } }}>
                <a
                  href={l.href}
                  className={`relative px-3 py-2 rounded-lg text-sm font-medium transition
                    hover:text-[#7A86B6] dark:hover:text-[#C8B6E2]
                    ${current === l.key ? "text-[#7A86B6] dark:text-[#C8B6E2]" : "opacity-90"}`}
                >
                  {l.label}
                  {/* underline */}
                  <span
                    className={`pointer-events-none absolute left-3 right-3 -bottom-0.5 h-[2px]
                      origin-left scale-x-0 bg-gradient-to-r from-[#F2BED1] to-[#C8B6E2]
                      transition-transform duration-300 ease-out group-hover:scale-x-100
                      ${current === l.key ? "scale-x-100 shadow-[0_0_8px_#C8B6E2]" : ""}`}
                  />
                </a>
              </motion.li>
            ))}
          </motion.ul>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Search */}
          <div className="relative hidden sm:flex items-center">
            <motion.button
              aria-label="Open search"
              onClick={() => setSearchOpen((s) => !s)}
              className="p-2 rounded-lg bg-white/60 dark:bg-black/30 hover:bg-white/80 dark:hover:bg-black/50 transition"
              whileTap={{ scale: 0.96 }}
            >
              <Search className="w-5 h-5" />
            </motion.button>
            <AnimatePresence initial={false}>
              {searchOpen && (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 260, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 200, damping: 24 }}
                  className="overflow-hidden ml-2"
                >
                  <input
                    autoFocus
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search articles, tags..."
                    className="w-[260px] px-3 py-2 rounded-lg bg-white/80 dark:bg-black/40 outline-none
                      focus:ring-2 focus:ring-[#F2BED1] dark:focus:ring-[#C8B6E2]"
                  />

                  <AnimatePresence>
                    {suggestions.length > 0 && (
                      <motion.ul
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className="absolute left-[44px] top-12 w-[260px] rounded-xl shadow-lg
                          bg-white/95 dark:bg-[#111827]/90 backdrop-blur-md overflow-hidden"
                      >
                        {suggestions.map((s, i) => (
                          <li key={i}>
                            <a
                              href={`/search?q=${encodeURIComponent(s)}`}
                              className="block px-3 py-2 text-sm hover:bg-[#F8E8EE] dark:hover:bg-[#2b2f55]"
                            >
                              {s}
                            </a>
                          </li>
                        ))}
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Theme toggle */}
          <motion.button
            aria-label="Toggle theme"
            onClick={() => setDark((d) => !d)}
            className="ml-1 p-2 rounded-lg bg-white/60 dark:bg-black/30 hover:bg-white/80 dark:hover:bg-black/50 transition"
            whileTap={{ rotate: 180, scale: 0.95 }}
          >
            {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </motion.button>

          {/* Notifications */}
          <div className="relative ml-1">
            <motion.button
              aria-haspopup="menu"
              aria-expanded={notifOpen}
              onClick={() => {
                setNotifOpen((o) => !o);
                setNotifCount(0);
              }}
              className="relative p-2 rounded-lg bg-white/60 dark:bg-black/30 hover:bg-white/80 dark:hover:bg-black/50 transition"
              animate={bellControls}
            >
              <Bell className="w-5 h-5" />
              {notifCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 min-w-[1.25rem] text-[10px] leading-5 text-center rounded-full bg-rose-500 text-white">
                  {notifCount}
                </span>
              )}
            </motion.button>
            <AnimatePresence>
              {notifOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="absolute right-0 mt-2 w-72 rounded-xl shadow-xl bg-white/95 dark:bg-[#111827]/95 overflow-hidden"
                >
                  <div className="px-4 py-3 font-semibold text-sm">Notifications</div>
                  <ul className="divide-y divide-black/5 dark:divide-white/10">
                    <li className="px-4 py-3 text-sm hover:bg-[#F8E8EE] dark:hover:bg-[#2b2f55]">Your post *Agentic AI* got 12 new likes</li>
                    <li className="px-4 py-3 text-sm hover:bg-[#F8E8EE] dark:hover:bg-[#2b2f55]">@neha started following you</li>
                    <li className="px-4 py-3 text-sm hover:bg-[#F8E8EE] dark:hover:bg-[#2b2f55]">Weekly stats are ready</li>
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Profile */}
          <div className="relative ml-1">
            <button
              onClick={() => setProfileOpen((o) => !o)}
              className="flex items-center gap-2 px-2 py-1 rounded-full bg-white/60 dark:bg-black/30 hover:bg-white/80 dark:hover:bg-black/50 transition"
            >
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt="avatar"
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-transparent hover:ring-[#F2BED1] dark:hover:ring-[#C8B6E2] transition"
                />
              ) : (
                <div className="w-8 h-8 rounded-full grid place-items-center bg-[#F2BED1] dark:bg-[#C8B6E2] text-black font-bold">
                  {initials}
                </div>
              )}
              <ChevronDown className="w-4 h-4 opacity-70" />
            </button>
            <AnimatePresence>
              {profileOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: -4 }}
                  className="absolute right-0 mt-2 w-52 rounded-xl shadow-xl bg-white/95 dark:bg-[#111827]/95 overflow-hidden"
                >
                  <a href="/profile" className="flex items-center gap-2 px-4 py-3 text-sm hover:bg-[#F8E8EE] dark:hover:bg-[#2b2f55]"><User className="w-4 h-4"/> Profile</a>
                  <a href="/settings" className="flex items-center gap-2 px-4 py-3 text-sm hover:bg-[#F8E8EE] dark:hover:bg-[#2b2f55]"><Settings className="w-4 h-4"/> Settings</a>
                  <a href="/logout" className="flex items-center gap-2 px-4 py-3 text-sm hover:bg-[#F8E8EE] dark:hover:bg-[#2b2f55]"><LogOut className="w-4 h-4"/> Logout</a>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </nav>
      </div>

      {/* Mobile slideout */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            initial={{ x: "-100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "-100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 240, damping: 26 }}
            className="fixed inset-y-0 left-0 w-[78%] max-w-sm bg-white/90 dark:bg-[#0b102a]/95 backdrop-blur-xl shadow-2xl z-50"
          >
            <div className="px-4 pt-4 pb-6 border-b border-black/5 dark:border-white/10 flex items-center justify-between">
              <span className="text-lg font-extrabold bg-gradient-to-r from-[#F2BED1] via-[#FDCEDF] to-[#C8B6E2] bg-clip-text text-transparent">Inkwell</span>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-2 rounded-lg bg-white/60 dark:bg-black/30 hover:bg-white/80 dark:hover:bg-black/50 transition"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <motion.ul
              className="p-3 space-y-1"
              initial="hidden"
              animate="show"
              variants={{
                hidden: { opacity: 0 },
                show: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
              }}
            >
              {links.map((l) => (
                <motion.li key={l.key} variants={{ hidden: { opacity: 0, x: -12 }, show: { opacity: 1, x: 0 } }}>
                  <a
                    href={l.href}
                    onClick={() => setMobileOpen(false)}
                    className={`block px-3 py-3 rounded-lg text-base font-medium transition
                      hover:bg-[#F8E8EE] dark:hover:bg-[#2b2f55]
                      ${current === l.key ? "bg-[#F8E8EE] dark:bg-[#2b2f55]" : ""}`}
                  >
                    {l.label}
                  </a>
                </motion.li>
              ))}

              {/* Mobile Search */}
              <li className="pt-2">
                <div className="flex items-center gap-2 px-2">
                  <Search className="w-5 h-5" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search..."
                    className="flex-1 px-3 py-2 rounded-lg bg-white/80 dark:bg-black/40 outline-none focus:ring-2 focus:ring-[#F2BED1] dark:focus:ring-[#C8B6E2]"
                  />
                </div>
                <AnimatePresence>
                  {suggestions.length > 0 && (
                    <motion.ul
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="mx-4 mt-2 rounded-xl overflow-hidden shadow-lg bg-white/95 dark:bg-[#111827]/95"
                    >
                      {suggestions.map((s, i) => (
                        <li key={i}>
                          <a
                            href={`/search?q=${encodeURIComponent(s)}`}
                            onClick={() => setMobileOpen(false)}
                            className="block px-3 py-2 text-sm hover:bg-[#F8E8EE] dark:hover:bg-[#2b2f55]"
                          >
                            {s}
                          </a>
                        </li>
                      ))}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </li>

              {/* Mobile theme & profile quick actions */}
             
            </motion.ul>
          </motion.aside>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
