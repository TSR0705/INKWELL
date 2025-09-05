// Home.jsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Bell,
  Sun,
  Moon,
  Menu,
  X,
  ChevronDown,
  User,
  Settings,
  LogOut,
  Heart,
  Bookmark,
  Share2,
  ArrowRight,
  Github,
  Twitter,
  Linkedin,
  Globe,
} from "lucide-react";

/* ===========================
   Mock Data (blogs, authors)
   =========================== */
const MOCK_BLOGS = Array.from({ length: 24 }).map((_, i) => ({
  id: i + 1,
  title:
    i % 3 === 0
      ? "Exploring Agentic AI: practical experiments"
      : i % 3 === 1
      ? "Cloud Patterns that scale"
      : "Design Systems & Micro-interactions",
  cover: `https://source.unsplash.com/random/900x6${(i % 10) + 10}`,
  excerpt:
    "Short excerpt: This is a preview line for the post. It should be engaging and encourage click-through.",
  content:
    "Full content... (mock) Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse varius enim in eros elementum tristique.",
  date: new Date(Date.now() - i * 86400000).toLocaleDateString(),
  likes: Math.floor(Math.random() * 400),
  comments: Math.floor(Math.random() * 40),
  tags: ["Tech", i % 2 ? "Cloud" : "AI"],
  readingProgress: Math.floor(Math.random() * 80),
  trending: i % 7 === 0,
}));

const MOCK_AUTHORS = Array.from({ length: 6 }).map((_, i) => ({
  id: i + 1,
  name: ["Asha", "Ravi", "Leena", "Maya", "Ishaan", "Neha"][i],
  avatar: `https://i.pravatar.cc/80?img=${i + 3}`,
  posts: 5 + i,
  likes: 100 + i * 25,
}));

/* ===========================
   Utilities & Hooks
   =========================== */
function useInfiniteScroll(callback, isLoading) {
  useEffect(() => {
    if (isLoading) return;
    const onScroll = () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 900) {
        callback();
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [callback, isLoading]);
}

function useInView(ref, options = {}) {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setInView(true);
        });
      },
      { threshold: 0.15, ...options }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [ref, options]);
  return inView;
}

/* ===========================
   Small Visual Helpers
   =========================== */
const shimmer = (
  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent opacity-20 animate-[shimmer_1.2s_infinite]" style={{backgroundSize:'200% 100%'}} />
);

/* ===========================
   Reusable Components
   =========================== */

function Navbar({
  current = "home",
  user = { name: "Tanmay Singh", avatar: "", username: "tanmay" },
  onToggleTheme,
  dark,
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifCount, setNotifCount] = useState(2);
  const [profileOpen, setProfileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 6);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!query) return setSuggestions([]);
    const id = setTimeout(() => {
      const q = query.toLowerCase();
      setSuggestions(["Agentic AI", "Cloud Patterns", "Design Systems"].filter((s) => s.toLowerCase().includes(q)));
    }, 140);
    return () => clearTimeout(id);
  }, [query]);

  return (
    <header className={`sticky top-0 z-50 backdrop-blur-lg transition-shadow ${scrolled ? "shadow-xl bg-white/60 dark:bg-[#0b1126]/60" : "bg-white/40 dark:bg-[#0b1126]/30"}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center gap-3 py-3">
          {/* branding */}
          <motion.a initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} href="/" className="flex items-center gap-3 select-none">
            <motion.span whileHover={{ scale: 1.06 }} className="text-2xl font-extrabold bg-gradient-to-r from-[#F2BED1] via-[#FDCEDF] to-[#C8B6E2] bg-clip-text text-transparent">Inkwell</motion.span>
          </motion.a>

          {/* links */}
          <motion.ul initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.06 } } }} className="hidden md:flex items-center gap-1 ml-4">
            {["home","explore","create","dashboard"].map((k) => {
              const label = k[0].toUpperCase()+k.slice(1);
              const active = current === k;
              return (
                <motion.li key={k} variants={{ hidden:{opacity:0,y:6}, show:{opacity:1,y:0}}}>
                  <a href={`/${k==='home'?'':k}`} className={`relative px-3 py-2 text-sm font-medium transition ${active ? "text-[#7A86B6] dark:text-[#C8B6E2]" : "text-gray-700 dark:text-gray-200"}`}>
                    {label}
                    <span className={`absolute left-3 right-3 -bottom-0.5 h-[2px] origin-left bg-gradient-to-r from-[#F2BED1] to-[#C8B6E2] transition-transform ${active ? "scale-x-100 shadow-[0_0_12px_#C8B6E2]" : "scale-x-0 group-hover:scale-x-100"}`} />
                  </a>
                </motion.li>
              );
            })}
          </motion.ul>

          <div className="flex-1" />

          {/* search */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center relative">
              <button aria-label="Search" onClick={()=>setSearchOpen(s=>!s)} className="p-2 rounded-lg bg-white/60 dark:bg-black/30 hover:scale-95 transition">
                <Search className="w-5 h-5" />
              </button>
              <AnimatePresence>
                {searchOpen && (
                  <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 260, opacity: 1 }} exit={{ width:0, opacity:0 }} transition={{ type:"spring", stiffness: 200, damping: 20 }} className="ml-2 overflow-hidden">
                    <input value={query} onChange={e=>setQuery(e.target.value)} className="w-[260px] px-3 py-2 rounded-lg bg-white/90 dark:bg-black/40 focus:ring-2 focus:ring-[#F2BED1]" placeholder="Search articles, tags..." />
                    <AnimatePresence>
                      {suggestions.length>0 && (
                        <motion.ul initial={{opacity:0,y:-6}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-6}} className="absolute left-12 top-12 w-[260px] rounded-xl shadow-lg bg-white/95 dark:bg-[#111827]/95">
                          {suggestions.map((s,i)=>(<li key={i}><a className="block px-3 py-2 hover:bg-[#F8E8EE] dark:hover:bg-[#23263d]" href={`/search?q=${encodeURIComponent(s)}`}>{s}</a></li>))}
                        </motion.ul>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* theme */}
            <motion.button onClick={onToggleTheme} aria-label="toggle theme" whileTap={{rotate:120}} className="p-2 rounded-lg bg-white/60 dark:bg-black/30">
              {dark ? <Sun className="w-5 h-5 text-yellow-400"/> : <Moon className="w-5 h-5"/>}
            </motion.button>

            {/* notifications */}
            <div className="relative">
              <button onClick={()=>setNotifOpen(o=>!o)} className="p-2 rounded-lg bg-white/60 dark:bg-black/30">
                <Bell className="w-5 h-5" />
                {notifCount>0 && <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] leading-4 px-1 rounded-full">{notifCount}</span>}
              </button>
              <AnimatePresence>
                {notifOpen && (
                  <motion.div initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} className="absolute right-0 mt-2 w-72 rounded-xl shadow-xl bg-white/95 dark:bg-[#111827]/95 overflow-hidden">
                    <div className="px-4 py-3 font-semibold">Notifications</div>
                    <ul className="divide-y divide-black/5 dark:divide-white/10">
                      <li className="px-4 py-3 text-sm hover:bg-[#F8E8EE] dark:hover:bg-[#23263d]">Your post *Agentic AI* got new likes</li>
                      <li className="px-4 py-3 text-sm hover:bg-[#F8E8EE] dark:hover:bg-[#23263d]">@neha started following</li>
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

           {/* profile */}
<div className="relative ml-2">
  <button
    onClick={() => setProfileOpen((o) => !o)}
    className="flex items-center gap-2 px-2 py-1 rounded-full bg-white/60 dark:bg-black/30 hover:ring-2 hover:ring-[#F2BED1] transition"
  >
    {user?.avatar ? (
      <img
        src={user.avatar}
        alt="avatar"
        className="w-8 h-8 rounded-full object-cover"
      />
    ) : (
      <div className="w-8 h-8 rounded-full bg-[#F2BED1] flex items-center justify-center">
        {(user?.name || "U")
          .split(" ")
          .map((n) => n[0])
          .join("")
          .slice(0, 2)}
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
        <a
          href="/profile"
          className="flex items-center gap-2 px-4 py-3 text-sm hover:bg-[#F8E8EE] dark:hover:bg-[#2b2f55]"
        >
          <User className="w-4 h-4" /> Profile
        </a>
        <a
          href="/settings"
          className="flex items-center gap-2 px-4 py-3 text-sm hover:bg-[#F8E8EE] dark:hover:bg-[#2b2f55]"
        >
          <Settings className="w-4 h-4" /> Settings
        </a>
        <a
          href="/logout"
          className="flex items-center gap-2 px-4 py-3 text-sm hover:bg-[#F8E8EE] dark:hover:bg-[#2b2f55]"
        >
          <LogOut className="w-4 h-4" /> Logout
        </a>
      </motion.div>
    )}
  </AnimatePresence>
</div>


            {/* mobile menu toggler */}
            <div className="md:hidden ml-2">
              <button onClick={()=>setMobileOpen(s=>!s)} className="p-2 rounded-lg bg-white/60 dark:bg-black/30"><Menu className="w-5 h-5"/></button>
            </div>
          </div>
        </nav>
      </div>

      {/* Mobile slideout */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.aside initial={{x:"-100%"}} animate={{x:0}} exit={{x:"-100%"}} transition={{type:'spring', stiffness:240, damping:24}} className="fixed inset-y-0 left-0 w-[80%] max-w-sm bg-white/95 dark:bg-[#061028]/95 backdrop-blur-xl z-50 p-4">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-lg bg-gradient-to-r from-[#F2BED1] to-[#C8B6E2] bg-clip-text text-transparent">Inkwell</span>
              <button onClick={()=>setMobileOpen(false)} className="p-2 rounded-lg"><X/></button>
            </div>
            <ul className="mt-4 space-y-2">
              {["home","explore","create","dashboard"].map(k=>(<li key={k}><a href={`/${k==='home'?'':k}`} className="block px-3 py-2 rounded-lg hover:bg-[#F8E8EE] dark:hover:bg-[#23263d]">{k}</a></li>))}
            </ul>
          </motion.aside>
        )}
      </AnimatePresence>
    </header>
  );
}

/* Hero Section */
function Hero({ onStart }) {
  const headline = "Discover Stories. Share Your Voice.";
  const [typed, setTyped] = useState("");
  useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      setTyped((t) => headline.slice(0, i + 1));
      i++;
      if (i > headline.length) clearInterval(id);
    }, 28);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="relative overflow-hidden">
      {/* animated gradient background */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#FDF2F8] via-[#F9E7F0] to-[#EAE6FF] dark:from-[#2b2f55] dark:via-[#4f5a94] dark:to-[#7A86B6] animate-[gradientShift_12s_infinite]"></div>
      {/* floating shapes */}
      <motion.div initial={{opacity:0}} animate={{opacity:1}} className="absolute -left-12 top-12 w-48 h-48 bg-[#F2BED1]/30 rounded-full filter blur-3xl"></motion.div>
      <motion.div initial={{opacity:0}} animate={{opacity:1}} className="absolute right-8 -top-8 w-64 h-64 bg-[#C8B6E2]/20 rounded-full filter blur-2xl"></motion.div>

      <div className="max-w-7xl mx-auto px-4 py-20 lg:py-28">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
          <div className="lg:col-span-2">
            <motion.h1 initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:0.1}} className="text-4xl md:text-5xl font-extrabold leading-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#7A86B6] to-[#C8B6E2]">{typed}</span>
              <span className="inline-block ml-2 text-pink-500 animate-pulse">|</span>
            </motion.h1>
            <motion.p initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.35}} className="mt-4 text-lg text-gray-600 dark:text-gray-300 max-w-2xl">
              Curated stories and a friendly space to publish your thoughts. Write, connect, and grow your audience on Inkwell.
            </motion.p>
            <motion.div initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} transition={{delay:0.5}} className="mt-6">
              <button onClick={onStart} className="px-5 py-3 rounded-full bg-gradient-to-r from-[#F2BED1] via-[#FDCEDF] to-[#C8B6E2] text-black font-semibold shadow-lg hover:scale-[1.02] transition transform">
                Start Writing
              </button>
            </motion.div>
          </div>

          {/* Featured banner */}
          <motion.div initial={{opacity:0, y:12}} animate={{opacity:1,y:0}} className="bg-white/90 dark:bg-[#111827]/80 rounded-xl p-4 shadow-lg">
            <div className="relative overflow-hidden rounded-lg">
              <img src={MOCK_BLOGS[0].cover} alt="featured" className="w-full h-40 object-cover rounded-lg transform hover:scale-105 transition" />
              <div className="p-3">
                <div className="text-xs text-pink-600 font-semibold">Featured</div>
                <div className="font-semibold mt-1">{MOCK_BLOGS[0].title}</div>
                <div className="text-sm text-gray-600 dark:text-gray-300 mt-2 line-clamp-2">{MOCK_BLOGS[0].excerpt}</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* Filters */
function FeedFilters({ active, onChange, categories, activeCategory, onCategory }) {
  return (
    <div className="max-w-7xl mx-auto px-4">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-2" role="tablist" aria-label="Feed Filters">
          {["Latest","Popular","Trending"].map((f)=>(
            <button key={f} onClick={()=>onChange(f)} className={`px-3 py-2 rounded-full text-sm font-medium transition ${active===f ? "bg-gradient-to-r from-[#F2BED1] to-[#C8B6E2] text-black" : "bg-white/60 dark:bg-black/30"}`}>{f}</button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {categories.map(c=>(
            <button key={c} onClick={()=>onCategory(c)} className={`px-3 py-1 rounded-full text-sm transition ${activeCategory===c ? "bg-[#F2BED1] dark:bg-[#C8B6E2]" : "bg-white/60 dark:bg-black/30"}`}>{c}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* BlogCard */
function BlogCard({ blog, onLike, onBookmark }) {
  const ref = useRef(null);
  const inView = useInView(ref);
  const [liked, setLiked] = useState(false);
  const [booked, setBooked] = useState(false);
  const [showShare, setShowShare] = useState(false);

  // lazy image load state
  const [imgLoaded, setImgLoaded] = useState(false);

  useEffect(() => {
    if (inView && !imgLoaded) {
      const img = new Image();
      img.src = blog.cover;
      img.onload = () => setImgLoaded(true);
    }
  }, [inView, blog.cover, imgLoaded]);

  const handleLike = () => {
    setLiked(true);
    onLike(blog.id);
    // confetti
    const root = document.createElement("div");
    root.style.position = "absolute";
    root.style.left = "0";
    root.style.top = "0";
    root.style.pointerEvents = "none";
    ref.current.appendChild(root);
    for(let i=0;i<12;i++){
      const el = document.createElement("span");
      el.className = "absolute w-2 h-2 rounded-full";
      el.style.background = ["#F2BED1","#FDCEDF","#C8B6E2"][i%3];
      el.style.left = `${40 + Math.random()*120}px`;
      el.style.top = `${20}px`;
      el.style.transform = `translateY(0)`;
      root.appendChild(el);
      requestAnimationFrame(()=> {
        el.style.transition = "transform 800ms, opacity 700ms";
        el.style.transform = `translateY(${100 + Math.random()*60}px) translateX(${(Math.random()-0.5)*120}px)`;
        el.style.opacity = "0";
      });
      setTimeout(()=>root.removeChild(el),900);
    }
    setTimeout(()=>ref.current.removeChild(root),1200);
  };

  const handleBookmark = () => {
    setBooked((b)=>!b);
    onBookmark(blog.id);
  };

  return (
    <motion.article ref={ref} initial={{opacity:0, y:14}} animate={{opacity: inView?1:0, y: inView?0:14}} transition={{duration:0.5}} className="relative break-inside-avoid rounded-xl overflow-hidden bg-white/90 dark:bg-[#0b1026]/80 shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition">
      <div className="relative">
        <div className="relative overflow-hidden">
          <img src={imgLoaded ? blog.cover : ""} alt={blog.title} className={`w-full h-52 object-cover transition-transform ${imgLoaded ? "opacity-100 scale-100 hover:scale-105" : "opacity-0"}`} />
          {!imgLoaded && <div className="w-full h-52 bg-gray-200 dark:bg-gray-700 animate-pulse" />}
          <div className="absolute top-3 left-3 px-2 py-1 rounded-full bg-gradient-to-r from-[#F2BED1] to-[#C8B6E2] text-xs font-semibold">{blog.trending ? "Trending" : "Featured"}</div>
        </div>

        {/* overlay quick actions */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center pointer-events-auto">
            <div className="flex gap-2 bg-white/70 dark:bg-black/40 rounded-xl p-1">
              <button onClick={handleLike} className="p-2 rounded hover:bg-white/60"><Heart className={`w-4 h-4 ${liked?'text-rose-500':''}`} /></button>
              <button className="p-2 rounded hover:bg-white/60"><Share2 onClick={()=>setShowShare(s=>!s)} className="w-4 h-4"/></button>
              <button onClick={handleBookmark} className="p-2 rounded hover:bg-white/60"><Bookmark className={`w-4 h-4 ${booked?'text-yellow-500':''}`} /></button>
            </div>
            <div className="bg-white/70 dark:bg-black/40 rounded-xl p-2 pointer-events-auto">
              <a href={`/post/${blog.id}`} className="text-xs font-medium hover:underline">Read</a>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4">
        <h3 className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-[#7A86B6] to-[#C8B6E2]">{blog.title}</h3>
        <div className="text-xs text-gray-500 dark:text-gray-300 mt-1">{blog.date} • {blog.tags.join(", ")}</div>
        <p className="mt-3 text-sm text-gray-700 dark:text-gray-300 line-clamp-2">{blog.excerpt}</p>

        <div className="mt-3 flex items-center justify-between text-sm opacity-90">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1"><Heart className="w-4 h-4"/> {blog.likes}</div>
            <div className="flex items-center gap-1"><Share2 className="w-4 h-4"/> {blog.comments}</div>
          </div>
          <div className="text-xs text-gray-500">{blog.readingProgress}%</div>
        </div>
      </div>

      {/* share popover */}
      <AnimatePresence>
        {showShare && (
          <motion.div initial={{opacity:0, scale:0.96}} animate={{opacity:1, scale:1}} exit={{opacity:0, scale:0.96}} className="absolute right-3 top-3 bg-white/95 dark:bg-[#0b1026]/95 rounded-xl shadow p-2">
            <div className="flex gap-2">
              <a className="p-2 rounded hover:bg-gray-100" href="#"><Twitter size={16}/></a>
              <a className="p-2 rounded hover:bg-gray-100" href="#"><Linkedin size={16}/></a>
              <a className="p-2 rounded hover:bg-gray-100" href="#"><Globe size={16}/></a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}

/* Sidebar */
function Sidebar({ authors }) {
  return (
    <aside className="sticky top-24 space-y-5">
      <div className="bg-white/90 dark:bg-[#0b1026]/80 rounded-xl p-4 shadow">
        <h4 className="font-semibold">Suggested Authors</h4>
        <div className="mt-3 space-y-3">
          {authors.map(a=>(
            <div key={a.id} className="flex items-center gap-3 hover:scale-[1.02] transition p-1 rounded">
              <img src={a.avatar} alt={a.name} className="w-10 h-10 rounded-full object-cover"/>
              <div>
                <div className="font-medium text-sm">{a.name}</div>
                <div className="text-xs opacity-75">{a.posts} posts • {a.likes} likes</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white/90 dark:bg-[#0b1026]/80 p-4 rounded-xl shadow">
        <h4 className="font-semibold">Trending Tags</h4>
        <div className="mt-3 flex flex-wrap gap-2">
          {["AI","Cloud","Design","Travel","Food","Product"].map((t,i)=>(<span key={t} className="px-3 py-1 bg-gradient-to-r from-[#F2BED1] to-[#C8B6E2] rounded-full text-xs">{t}</span>))}
        </div>
      </div>

      <div className="bg-white/90 dark:bg-[#0b1026]/80 p-4 rounded-xl shadow">
        <h4 className="font-semibold">Leaderboard</h4>
        <ol className="mt-3 space-y-2 text-sm">
          {authors.slice(0,4).map((a,idx)=>(<li key={a.id} className="flex justify-between"><span>{idx+1}. {a.name}</span><span className="font-medium">{a.likes}</span></li>))}
        </ol>
      </div>
    </aside>
  );
}

/* FAB */
function FAB({ onCreate }) {
  return (
    <button onClick={onCreate} className="fixed z-40 bottom-6 right-6 md:hidden p-4 rounded-full bg-gradient-to-r from-[#F2BED1] to-[#C8B6E2] shadow-lg animate-bounce">
      <PlusIcon />
    </button>
  );
}
function PlusIcon(){ return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> }

/* Footer */
function Footer(){
  return (
    <footer className="mt-16 bg-white/40 dark:bg-[#0b1126]/40 backdrop-blur-lg py-8">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <div className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#F2BED1] to-[#C8B6E2]">Inkwell</div>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Write. Share. Inspire.</p>
        </div>
        <div className="flex gap-6">
          <a href="#" className="text-sm hover:underline">About</a>
          <a href="#" className="text-sm hover:underline">Terms</a>
          <a href="#" className="text-sm hover:underline">Privacy</a>
        </div>
        <div className="flex items-center gap-3">
          <a href="#" className="p-2 rounded hover:bg-white/20"><Twitter/></a>
          <a href="#" className="p-2 rounded hover:bg-white/20"><Github/></a>
          <a href="#" className="p-2 rounded hover:bg-white/20"><Linkedin/></a>
        </div>
      </div>
    </footer>
  );
}

/* ===========================
   Home Main Component
   =========================== */
export default function Home() {
  const [dark, setDark] = useState(() => typeof document !== "undefined" && document.documentElement.classList?.contains("dark"));
  useEffect(()=>{ if(typeof document!=="undefined") document.documentElement.classList.toggle("dark", dark); },[dark]);

  /* feed state */
  const [filter, setFilter] = useState("Latest");
  const [category, setCategory] = useState("All");
  const [blogs, setBlogs] = useState(MOCK_BLOGS.slice(0,8));
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  /* infinite scroll */
  const loadMore = useCallback(()=>{
    if(loading) return;
    setLoading(true);
    setTimeout(()=>{
      const next = MOCK_BLOGS.slice(blogs.length, blogs.length+6);
      setBlogs(s=>[...s,...next]);
      setPage(p=>p+1);
      setLoading(false);
    },900);
  },[blogs,loading]);
  useInfiniteScroll(loadMore, loading);

  const handleLike = (id) => {
    setBlogs(b=>b.map(x=>x.id===id?{...x,likes:x.likes+1}:x));
  };
  const handleBookmark = (id)=>{/* mock - no op for now */};

  /* sections - mock personalization */
  const recommended = MOCK_BLOGS.slice(2,6);
  const continueReading = MOCK_BLOGS.slice(6,9);
  const recentlyViewed = MOCK_BLOGS.slice(9,13);

  /* cursor glow */
  useEffect(()=>{
    const cursor = document.createElement("div");
    cursor.className = "pointer-events-none fixed z-50 w-24 h-24 rounded-full transform -translate-x-1/2 -translate-y-1/2 opacity-0 transition-all";
    cursor.style.mixBlendMode = "overlay";
    document.body.appendChild(cursor);
    const onMove = (e)=>{
      cursor.style.left = `${e.clientX}px`;
      cursor.style.top = `${e.clientY}px`;
      cursor.style.opacity = "1";
      cursor.style.background = "radial-gradient(circle at center, rgba(242,190,209,0.15), rgba(200,182,226,0.06))";
    };
    window.addEventListener("mousemove", onMove);
    return ()=>{ window.removeEventListener("mousemove", onMove); document.body.removeChild(cursor); };
  },[]);

  return (
    <div className="min-h-screen bg-[#F9F5F6] dark:bg-[#061028] text-black dark:text-white transition-colors">
      <Navbar current="home" user={{name:"Tanmay Singh"}} onToggleTheme={()=>setDark(d=>!d)} dark={dark} />

      <main>
        <Hero onStart={()=>alert("Start Writing - Hook to your editor")} />

        <section className="mt-6">
          <FeedFilters active={filter} onChange={setFilter} categories={["All","Tech","Lifestyle","Travel","Food"]} activeCategory={category} onCategory={setCategory} />
        </section>

        <section className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Feed */}
          <div className="lg:col-span-2 space-y-6">
            {/* Featured / For You */}
            <div className="bg-white/90 dark:bg-[#0b1026]/80 p-4 rounded-xl shadow">
              <h3 className="font-semibold">For You</h3>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {recommended.map(b=>(
                  <div key={b.id} className="rounded-lg overflow-hidden bg-white/80 dark:bg-[#071025]/80 p-0 shadow">
                    <img src={b.cover} alt={b.title} className="w-full h-36 object-cover"/>
                    <div className="p-3">
                      <div className="font-semibold">{b.title}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">{b.excerpt}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Blog feed */}
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                {blogs.map(b=>(
                  <BlogCard key={b.id} blog={b} onLike={handleLike} onBookmark={handleBookmark} />
                ))}
              </div>

              {/* Load more / skeleton */}
              {loading ? (
                <div className="grid md:grid-cols-2 gap-4">
                  {Array.from({length:4}).map((_,i)=>(<div key={i} className="rounded-xl bg-white/80 dark:bg-[#071025]/80 p-6 animate-pulse h-40" />))}
                </div>
              ) : (
                <div className="flex justify-center mt-4">
                  <button onClick={loadMore} className="px-4 py-2 rounded-full bg-gradient-to-r from-[#F2BED1] to-[#C8B6E2] shadow hover:scale-[1.02] transition">
                    Load More <ArrowRight className="inline-block w-4 h-4 ml-2" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <aside className="hidden lg:block">
            <Sidebar authors={MOCK_AUTHORS} />

            <div className="mt-6 bg-white/90 dark:bg-[#0b1026]/80 rounded-xl p-4 shadow">
              <h4 className="font-semibold">Continue Reading</h4>
              <div className="mt-3 space-y-2">
                {continueReading.map(c=>(
                  <div key={c.id} className="flex items-center gap-3">
                    <img src={c.cover} alt={c.title} className="w-12 h-12 object-cover rounded"/>
                    <div>
                      <div className="text-sm font-medium">{c.title}</div>
                      <div className="text-xs opacity-70">Progress {c.readingProgress}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 bg-white/90 dark:bg-[#0b1026]/80 rounded-xl p-4 shadow">
              <h4 className="font-semibold">Recently Viewed</h4>
              <div className="mt-3 flex gap-2 overflow-x-auto">
                {recentlyViewed.map(r=>(
                  <div key={r.id} className="w-40 shrink-0 rounded-lg overflow-hidden">
                    <img src={r.cover} alt={r.title} className="w-full h-24 object-cover"/>
                    <div className="p-2 text-xs">{r.title}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 bg-white/90 dark:bg-[#0b1026]/80 rounded-xl p-4 shadow">
              <h4 className="font-semibold">Streaks</h4>
              <div className="mt-3">🔥 <strong>5 days</strong> writing streak</div>
              <div className="mt-3 flex gap-2">
                <div className="px-3 py-1 bg-gradient-to-r from-[#F2BED1] to-[#C8B6E2] rounded-full text-sm">10 posts</div>
                <div className="px-3 py-1 bg-white/60 dark:bg-black/30 rounded-full text-sm">100 likes</div>
              </div>
            </div>
          </aside>
        </section>

        {/* Recently Viewed Carousel (mobile horizontal) */}
        <section className="max-w-7xl mx-auto px-4">
          <h4 className="font-semibold">Recently Viewed</h4>
          <div className="mt-3 flex gap-3 overflow-x-auto py-2">
            {recentlyViewed.map(rv=>(
              <div key={rv.id} className="w-64 shrink-0 rounded-xl overflow-hidden bg-white/90 dark:bg-[#071025]/80 shadow">
                <img src={rv.cover} alt={rv.title} className="w-full h-32 object-cover"/>
                <div className="p-3">
                  <div className="font-semibold">{rv.title}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Tag Cloud / Featured Banner */}
        <section className="max-w-7xl mx-auto px-4 mt-8">
          <div className="bg-white/90 dark:bg-[#0b1026]/80 rounded-xl p-6 shadow grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <h4 className="font-semibold">Featured</h4>
              <div className="mt-3 rounded-lg overflow-hidden">
                <img src={MOCK_BLOGS[1].cover} alt="featured" className="w-full h-44 object-cover"/>
                <div className="p-3">
                  <div className="font-semibold">{MOCK_BLOGS[1].title}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">{MOCK_BLOGS[1].excerpt}</div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold">Tag Cloud</h4>
              <div className="mt-3 flex flex-wrap gap-2">
                {["AI","Cloud","Design","Travel","Food","Product","Life"].map(t=>(
                  <span key={t} className="px-3 py-1 rounded-full bg-gradient-to-r from-[#F2BED1] to-[#C8B6E2] text-xs">{t}</span>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      {/* Floating FAB for mobile */}
      <div className="fixed bottom-6 right-6 md:hidden">
        <button className="p-4 rounded-full bg-gradient-to-r from-[#F2BED1] to-[#C8B6E2] shadow-lg animate-bounce" onClick={()=>alert("Create new post")}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      </div>
    </div>
  );
}
