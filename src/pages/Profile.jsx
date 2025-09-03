// Profile.jsx
import React, { useEffect, useRef, useState } from "react";
import {
  Sun,
  Moon,
  CheckCircle2,
  Edit3,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Users,
  MapPin,
  ArrowRight,
  Twitter,
  Linkedin,
  Github,
  Globe,
  Sparkles,
  Trophy,
  Plus,
} from "lucide-react";

/**
 * Profile.jsx — Premium Inkwell Profile (frontend-only)
 * - Tailwind CSS only
 * - Mock data stored locally (ready for backend integration)
 * - Advanced UI/UX: parallax banner, avatar ring, glass stats, sliding tabs,
 *   search suggestions, masonry feed, pinned carousel, confetti, inline edit,
 *   drag reorder (owner), infinite scroll + skeletons, light/dark toggle
 *
 * Usage: <Profile isOwner={true} />
 */

const MOCK_USER = {
  id: "u1",
  username: "Tanmay Singh",
  bio:
    "Innovative tech creator exploring AI, cloud computing and blockchain. I build agentic systems & scalable platforms. Prototyping often, shipping faster 🚀",
  avatar: "https://i.pravatar.cc/200?img=12",
  banner: "https://images.unsplash.com/photo-1503264116251-35a269479413?q=80&w=1400&auto=format&fit=crop",
  verified: true,
  social: {
    twitter: "https://twitter.com",
    linkedin: "https://linkedin.com",
    github: "https://github.com",
    website: "https://example.com",
  },
  stats: { posts: 32, followers: 1240, following: 312, likes: 5420 },
  achievements: [
    { id: "a1", title: "10 Posts Published", icon: "Trophy" },
    { id: "a2", title: "100 Likes Received", icon: "Sparkles" },
  ],
  pinned: [1, 2],
  mutualFollowers: [
    { id: "m1", name: "Asha", avatar: "https://i.pravatar.cc/56?img=3" },
    { id: "m2", name: "Ravi", avatar: "https://i.pravatar.cc/56?img=5" },
    { id: "m3", name: "Leena", avatar: "https://i.pravatar.cc/56?img=7" },
  ],
};

const MOCK_BLOGS = Array.from({ length: 12 }).map((_, i) => ({
  id: i + 1,
  title:
    i % 3 === 0
      ? "Exploring Agentic AI: a practical approach"
      : i % 3 === 1
      ? "Cloud Patterns that scale"
      : "UI Patterns for modern apps",
  cover: `https://source.unsplash.com/collection/1065972/600x4${(i % 9) + 10}`,
  date: new Date(Date.now() - i * 1000 * 60 * 60 * 24).toLocaleDateString(),
  likes: Math.floor(Math.random() * 600),
  comments: Math.floor(Math.random() * 60),
  content:
    "Short excerpt for the post. This appears as quick preview. Keep it concise and engaging so readers tap through.",
  tags: ["Tech", i % 2 ? "Cloud" : "AI"],
  badge: i % 7 === 0 ? "Draft" : i % 6 === 0 ? "Trending" : i % 5 === 0 ? "Most Liked" : null,
}));

export default function Profile({ isOwner = true }) {
  // Theme toggle
  const [dark, setDark] = useState(document.documentElement.classList?.contains("dark") ?? false);

  useEffect(() => {
    if (dark) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [dark]);

  // States
  const [user, setUser] = useState(MOCK_USER);
  const [blogs, setBlogs] = useState(MOCK_BLOGS.slice(0, 6)); // initial page
  const [allBlogs] = useState(MOCK_BLOGS);
  const [activeTab, setActiveTab] = useState("Published"); // Published | Drafts | Followers | Following
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bannerY, setBannerY] = useState(0);
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [pinnedIndex, setPinnedIndex] = useState(0);
  const [dragging, setDragging] = useState(null);
  const [showInlineEdit, setShowInlineEdit] = useState({ name: false, bio: false });
  const [tempName, setTempName] = useState(user.username);
  const [tempBio, setTempBio] = useState(user.bio);
  const [setInfinitePage] = useState(1);

  // counters animate
  const [counters, setCounters] = useState({ posts: 0, followers: 0, following: 0, likes: 0 });

  // parallax effect
  useEffect(() => {
    const onScroll = () => {
      setBannerY(window.scrollY * 0.3);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // animate counters
  useEffect(() => {
    const target = user.stats;
    const ticker = setInterval(() => {
      setCounters((prev) => {
        const next = { ...prev };
        let done = true;
        Object.keys(target).forEach((k) => {
          if (next[k] < target[k]) {
            next[k] = Math.min(next[k] + Math.ceil(target[k] / 20), target[k]);
            done = false;
          }
        });
        if (done) clearInterval(ticker);
        return next;
      });
    }, 50);
    return () => clearInterval(ticker);
  }, [user.stats]);

  // infinite scroll loader (mock)
  useEffect(() => {
    const onScroll = () => {
      const nearBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 700;
      if (nearBottom && !loading && blogs.length < allBlogs.length) loadMore();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [blogs, loading, allBlogs.length]);

  const loadMore = () => {
    setLoading(true);
    setTimeout(() => {
      const next = allBlogs.slice(blogs.length, blogs.length + 6);
      setBlogs((s) => [...s, ...next]);
      setLoading(false);
      setInfinitePage((p) => p + 1);
    }, 900);
  };

  // search suggestions
  useEffect(() => {
    if (!search) return setSuggestions([]);
    const q = search.toLowerCase();
    const s = allBlogs
      .flatMap((b) => [b.title, ...b.tags])
      .filter(Boolean)
      .filter((t, i, arr) => t.toLowerCase().includes(q) && arr.indexOf(t) === i)
      .slice(0, 5);
    setSuggestions(s);
  }, [search, allBlogs]);

  // follow confetti
  const confettiRef = useRef(null);
  const triggerConfetti = () => {
    // lightweight confetti: create small colored circles
    const root = confettiRef.current;
    if (!root) return;
    for (let i = 0; i < 18; i++) {
      const el = document.createElement("span");
      el.className = "absolute w-2 h-2 rounded-full opacity-0";
      el.style.left = `${50 + (Math.random() - 0.5) * 120}px`;
      el.style.top = `-10px`;
      el.style.background = ["#F2BED1", "#FDCEDF", "#C8B6E2", "#7A86B6"][Math.floor(Math.random() * 4)];
      root.appendChild(el);
      requestAnimationFrame(() => {
        el.style.transition = "transform 800ms cubic-bezier(.2,.8,.2,1), opacity 600ms";
        el.style.transform = `translateY(${120 + Math.random() * 80}px) translateX(${(Math.random() - 0.5) * 200}px) rotate(${Math.random() * 360}deg) scale(1.2)`;
        el.style.opacity = "1";
      });
      setTimeout(() => el.style.opacity = "0", 400);
      setTimeout(() => root.removeChild(el), 1000);
    }
  };

  // follow toggle
  const toggleFollow = () => {
    setIsFollowing((f) => {
      const newF = !f;
      if (newF) {
        // confetti & bump followers
        triggerConfetti();
        setUser((u) => ({ ...u, stats: { ...u.stats, followers: u.stats.followers + 1 } }));
        setCounters((c) => ({ ...c, followers: c.followers + 1 }));
      } else {
        setUser((u) => ({ ...u, stats: { ...u.stats, followers: Math.max(0, u.stats.followers - 1) } }));
        setCounters((c) => ({ ...c, followers: Math.max(0, c.followers - 1) }));
      }
      return newF;
    });
  };

  // inline edit save
  const saveName = () => {
    setUser((u) => ({ ...u, username: tempName }));
    setShowInlineEdit((s) => ({ ...s, name: false }));
  };
  const saveBio = () => {
    setUser((u) => ({ ...u, bio: tempBio }));
    setShowInlineEdit((s) => ({ ...s, bio: false }));
  };

  // drag reorder (owner)
  const onDragStart = (e, idx) => {
    if (!isOwner) return;
    setDragging(idx);
    e.dataTransfer.effectAllowed = "move";
  };
  const onDragOver = (e, idx) => {
    e.preventDefault();
    if (dragging === null || dragging === idx) return;
    const arr = [...blogs];
    const [item] = arr.splice(dragging, 1);
    arr.splice(idx, 0, item);
    setDragging(idx);
    setBlogs(arr);
  };
  const onDragEnd = () => setDragging(null);

  // like animation for a blog
  const likeBlog = (id) => {
    setBlogs((prev) => prev.map((b) => (b.id === id ? { ...b, likes: b.likes + 1 } : b)));
    // small micro-burst: we won't implement full animation per card for brevity
  };

  // inline edit blog title (owner)
  const inlineEditTitle = (id, newTitle) => {
    setBlogs((prev) => prev.map((b) => (b.id === id ? { ...b, title: newTitle } : b)));
  };

  // helpers & filters for tab
  const displayedBlogs = blogs.filter((b) => (activeTab === "Published" ? b.badge !== "Draft" : b.badge === "Draft"));

  // pinned carousel auto-advance
  useEffect(() => {
    const t = setInterval(() => setPinnedIndex((i) => (i + 1) % Math.max(1, user.pinned.length)), 4000);
    return () => clearInterval(t);
  }, [user.pinned.length]);

  /* ---------------------- Render UI ---------------------- */
  return (
    <div className="min-h-screen bg-[#F9F5F6] dark:bg-[#495C83] text-black dark:text-white transition-colors duration-500">
      {/* Parallax Banner */}
      <div
        className="relative h-56 md:h-72 overflow-hidden"
        style={{ transformStyle: "preserve-3d" }}
      >
        <div
          className="absolute inset-0 bg-gradient-to-r from-[#F2BED1]/60 via-[#FDCEDF]/30 to-[#C8B6E2]/40 dark:from-[#7A86B6]/40 dark:to-[#A8A4CE]/30"
          style={{
            transform: `translateY(${bannerY * 0.2}px)`,
            filter: "saturate(1.05) blur(0.3px)",
          }}
        />
        <img
          src={user.banner}
          alt="banner"
          className="absolute inset-0 w-full h-full object-cover opacity-60 transform scale-105"
          style={{ transform: `translateY(${bannerY * 0.5}px) scale(1.06)` }}
        />
        {/* top overlay controls */}
        <div className="absolute right-6 top-4 flex gap-3 items-center z-20">
          <button
            onClick={() => setDark((d) => !d)}
            className="p-2 rounded-full bg-white/80 dark:bg-black/40 shadow hover:scale-105 transition"
            title="Toggle theme"
          >
            {dark ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5" />}
          </button>
          <button className="p-2 rounded-full bg-white/80 dark:bg-black/40 shadow hover:scale-105 transition" title="Share profile">
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Profile header card */}
      <div className="max-w-6xl mx-auto -mt-14 px-4 relative">
        <div className="bg-transparent backdrop-blur-sm p-6 rounded-2xl shadow-lg flex flex-col md:flex-row gap-6 items-start z-10">
          {/* Avatar + ring */}
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-br from-[#F2BED1] to-[#C8B6E2] dark:from-[#7A86B6] dark:to-[#A8A4CE] rounded-full filter blur-xl opacity-40" />
            <div className="relative w-36 h-36 rounded-full bg-white dark:bg-[#7A86B6] p-1 shadow-xl transform transition hover:scale-105">
              <img src={user.avatar} alt="avatar" className="w-full h-full rounded-full object-cover" />
              {user.verified && (
                <div className="absolute -right-2 -bottom-2 bg-white dark:bg-[#7A86B6] rounded-full p-1 shadow">
                  <CheckCircle2 className="w-5 h-5 text-blue-500" />
                </div>
              )}
            </div>
            {/* parallax floating ring */}
            <div className="absolute top-0 left-0 w-36 h-36 rounded-full border-2 border-white/40 animate-pulse-slow pointer-events-none" />
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-center gap-4">
              <div className="flex flex-col">
                {showInlineEdit.name ? (
                  <div className="flex items-center gap-3">
                    <input className="text-2xl font-bold bg-transparent border-b border-dashed px-2 py-1" value={tempName} onChange={(e) => setTempName(e.target.value)} />
                    <button className="px-3 py-1 rounded-md bg-[#F2BED1] dark:bg-[#C8B6E2]" onClick={saveName}>Save</button>
                    <button className="px-2 py-1 rounded-md bg-white/30" onClick={() => setShowInlineEdit((s) => ({ ...s, name: false }))}>Cancel</button>
                  </div>
                ) : (
                  <h2 className="text-2xl md:text-3xl font-extrabold flex items-center gap-2">
                    {user.username}
                    {user.verified && <span className="text-xs px-2 py-0.5 rounded-full bg-white/80 dark:bg-black/40">Verified</span>}
                  </h2>
                )}
                <div className="flex items-center gap-3 mt-2 text-sm opacity-80">
                  <Users className="w-4 h-4" />
                  <div className="flex items-center gap-1">
                    <span className="font-medium">{counters.posts}</span>
                    <span className="text-xs opacity-70">posts</span>
                  </div>
                  <div className="flex items-center gap-1 ml-3">
                    <span className="font-medium">{counters.followers}</span>
                    <span className="text-xs opacity-70">followers</span>
                  </div>
                  <div className="flex items-center gap-1 ml-3">
                    <span className="font-medium">{counters.following}</span>
                    <span className="text-xs opacity-70">following</span>
                  </div>
                </div>
              </div>

              <div className="ml-auto flex items-center gap-3">
                {isOwner ? (
                  <button className="px-4 py-2 rounded-full bg-white/90 dark:bg-black/40 shadow hover:scale-105 transition flex items-center gap-2">
                    <Edit3 className="w-4 h-4" /> Edit Profile
                  </button>
                ) : (
                  <div className="relative" ref={confettiRef}>
                    <button
                      onClick={toggleFollow}
                      className={`px-4 py-2 rounded-full font-medium transition transform ${isFollowing ? "bg-white/80 dark:bg-black/40" : "bg-gradient-to-r from-[#F2BED1] to-[#C8B6E2] dark:from-[#C8B6E2] dark:to-[#A8A4CE]"} hover:scale-[1.03]`}
                    >
                      {isFollowing ? "Following" : "Follow"}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Bio with typewriter-ish fade */}
            <div className="mt-4">
              {showInlineEdit.bio ? (
                <div>
                  <textarea value={tempBio} onChange={(e) => setTempBio(e.target.value)} className="w-full rounded-md p-3 bg-white/60 dark:bg-black/30" rows={3} />
                  <div className="flex gap-2 mt-2">
                    <button className="px-3 py-1 rounded bg-[#F2BED1]" onClick={saveBio}>Save</button>
                    <button className="px-3 py-1 rounded" onClick={() => setShowInlineEdit((s) => ({ ...s, bio: false }))}>Cancel</button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">
                  {user.bio.length > 180 ? `${user.bio.slice(0, 180)}...` : user.bio}
                  {isOwner && (
                    <button className="ml-3 text-sm text-[#7A86B6]" onClick={() => { setShowInlineEdit((s) => ({ ...s, bio: true })); setTempBio(user.bio); }}>
                      Edit
                    </button>
                  )}
                </p>
              )}
            </div>

            {/* mutual followers and achievements */}
            <div className="mt-4 flex items-center gap-4">
              <div className="flex -space-x-2">
                {user.mutualFollowers.map((m) => (
                  <img key={m.id} src={m.avatar} alt={m.name} className="w-8 h-8 rounded-full border-2 border-white dark:border-black shadow-sm" />
                ))}
              </div>
              <div className="flex gap-2">
                {user.achievements.map((a) => (
                  <div key={a.id} className="px-3 py-1 rounded-full bg-gradient-to-r from-[#F2BED1] to-[#C8B6E2] dark:from-[#7A86B6] dark:to-[#A8A4CE] text-xs shadow">
                    {a.title}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Glass stats */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Posts", value: counters.posts, icon: <Sparkles className="w-5 h-5" /> },
            { label: "Followers", value: counters.followers, icon: <Users className="w-5 h-5" /> },
            { label: "Likes", value: counters.likes, icon: <Heart className="w-5 h-5" /> },
            { label: "Following", value: counters.following, icon: <MapPin className="w-5 h-5" /> },
          ].map((s) => (
            <div key={s.label} className="bg-white/60 dark:bg-black/30 rounded-xl p-3 backdrop-blur-md shadow hover:translate-y-[-4px] transition transform">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white dark:bg-black/40">{s.icon}</div>
                  <div>
                    <div className="text-sm opacity-80">{s.label}</div>
                    <div className="text-lg font-bold">{s.value}</div>
                  </div>
                </div>
                <div className="text-xs opacity-70">+{Math.floor(Math.random() * 20)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs + search + pinned carousel */}
      <div className="max-w-6xl mx-auto px-4 mt-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-white/80 dark:bg-black/40 p-1 rounded-full shadow">
              <div className="flex overflow-hidden rounded-full">
                {["Published", "Drafts", "Followers", "Following"].map((t) =>
                  (t !== "Drafts" || isOwner) ? (
                    <button
                      key={t}
                      onClick={() => setActiveTab(t)}
                      className={`px-4 py-2 rounded-full text-sm ${activeTab === t ? "bg-gradient-to-r from-[#F2BED1] to-[#C8B6E2] dark:from-[#C8B6E2] dark:to-[#A8A4CE] font-semibold" : "bg-transparent"}`}
                    >
                      {t}
                    </button>
                  ) : null
                )}
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search posts or tags..."
                className="px-3 py-2 rounded-lg bg-white/90 dark:bg-black/40 w-72 focus:ring-2 focus:ring-[#F2BED1]"
              />
              {suggestions.length > 0 && search && (
                <div className="absolute left-0 mt-1 w-72 bg-white dark:bg-black/30 rounded-lg shadow z-20">
                  {suggestions.map((s, i) => (
                    <div key={i} className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-black/40 cursor-pointer" onClick={() => { setSearch(s); setSuggestions([]); }}>
                      {s}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Pinned carousel */}
          <div className="hidden md:flex items-center gap-3">
            <div className="text-sm opacity-70">Pinned:</div>
            <div className="w-80 overflow-hidden rounded-xl">
              <div className="flex transition-transform duration-500" style={{ transform: `translateX(-${pinnedIndex * 100}%)` }}>
                {user.pinned.map((id) => {
                  const blog = allBlogs.find((b) => b.id === id) || allBlogs[0];
                  return (
                    <div key={id} className="w-80 flex-shrink-0 p-3 bg-white/80 dark:bg-black/40 rounded-xl mr-3">
                      <div className="flex gap-2">
                        <img src={blog.cover} alt="cover" className="w-20 h-12 object-cover rounded" />
                        <div>
                          <div className="font-semibold text-sm">{blog.title}</div>
                          <div className="text-xs opacity-70">{blog.date}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <button onClick={() => setPinnedIndex((i) => Math.max(0, i - 1))} className="p-2 rounded bg-white/80 dark:bg-black/40"><ArrowRight className="rotate-180 w-4 h-4" /></button>
            <button onClick={() => setPinnedIndex((i) => (i + 1) % Math.max(1, user.pinned.length))} className="p-2 rounded bg-white/80 dark:bg-black/40"><ArrowRight className="w-4 h-4" /></button>
          </div>
        </div>

        {/* Tag filters (simple) */}
        <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
          {["All", "AI", "Cloud", "Design", "Tutorial", "Product"].map((t) => (
            <button key={t} className="px-3 py-1 rounded-full bg-white/90 dark:bg-black/30 text-sm">{t}</button>
          ))}
        </div>
      </div>

      {/* Posts masonry grid */}
      <main className="max-w-6xl mx-auto px-4 mt-6">
        {/* Tabs content */}
        <div>
          {activeTab === "Followers" ? (
            <div className="bg-white/80 dark:bg-black/30 rounded-xl p-6"> {/* followers grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {new Array(12).fill(0).map((_, i) => (
                  <div key={i} className="bg-white/90 dark:bg-black/40 p-3 rounded-xl flex items-center gap-3">
                    <img src={`https://i.pravatar.cc/56?img=${(i % 70) + 1}`} alt="" className="w-10 h-10 rounded-full" />
                    <div>
                      <div className="font-medium">User {i + 1}</div>
                      <div className="text-xs opacity-70">mutual friend</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : activeTab === "Following" ? (
            <div className="bg-white/80 dark:bg-black/30 rounded-xl p-6">Following list...</div>
          ) : (
            // Published / Drafts
            <section>
              <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
                {displayedBlogs.length === 0 && !loading && <div className="text-center py-12 opacity-70">No posts here yet.</div>}
                {displayedBlogs.map((b, idx) => (
                  <article
                    key={b.id}
                    draggable={isOwner}
                    onDragStart={(e) => onDragStart(e, idx)}
                    onDragOver={(e) => onDragOver(e, idx)}
                    onDragEnd={onDragEnd}
                    className="break-inside-avoid bg-white/90 dark:bg-black/40 rounded-xl mb-4 overflow-hidden shadow-lg transform transition hover:scale-[1.02] hover:shadow-2xl"
                    style={{ animation: `cardAppear 400ms ease ${idx * 60}ms both` }}
                  >
                    <div className="relative">
                      <img src={b.cover} alt={b.title} className="w-full object-cover h-48" />
                      {b.badge && (
                        <span className="absolute top-3 left-3 px-2 py-1 rounded-full text-xs bg-gradient-to-r from-[#F2BED1] to-[#C8B6E2]">{b.badge}</span>
                      )}
                      <div className="absolute inset-0 flex items-end justify-between p-3 opacity-0 hover:opacity-100 transition">
                        <div className="bg-white/70 dark:bg-black/40 rounded-xl p-2 flex gap-2">
                          <button onClick={() => likeBlog(b.id)} className="p-2 rounded hover:bg-white/60"><Heart className="w-4 h-4" /></button>
                          <button className="p-2 rounded hover:bg-white/60"><MessageCircle className="w-4 h-4" /></button>
                          <button className="p-2 rounded hover:bg-white/60"><Bookmark className="w-4 h-4" /></button>
                        </div>
                        <div className="bg-white/70 dark:bg-black/40 rounded-xl p-2">
                          <Share2 className="w-4 h-4" />
                        </div>
                      </div>
                    </div>

                    <div className="p-4">
                      {/* inline title edit */}
                      {isOwner ? (
                        <InlineEditableText value={b.title} onSave={(v) => inlineEditTitle(b.id, v)} />
                      ) : (
                        <h3 className="font-semibold text-lg">{b.title}</h3>
                      )}

                      <div className="text-xs opacity-70 mt-1">{b.date} • {b.tags.join(", ")}</div>
                      <p className="mt-2 text-sm line-clamp-3">{b.content}</p>

                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-3 text-sm opacity-80">
                          <div className="flex items-center gap-1"><Heart className="w-4 h-4" /> {b.likes}</div>
                          <div className="flex items-center gap-1"><MessageCircle className="w-4 h-4" /> {b.comments}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isOwner && (
                            <>
                              <button className="px-2 py-1 rounded bg-white/80 dark:bg-black/30 text-xs">Edit</button>
                              <button className="px-2 py-1 rounded bg-red-300 text-xs">Delete</button>
                              {b.badge === "Draft" && <button className="px-2 py-1 rounded bg-green-200 text-xs">Publish</button>}
                            </>
                          )}
                          <button className="px-2 py-1 rounded bg-white/80 dark:bg-black/30 text-xs">Read</button>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              {/* skeletons while loading */}
              {loading && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="rounded-xl bg-white/80 dark:bg-black/40 p-4 animate-pulse h-56" />
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      </main>

      {/* Sticky mobile follow button */}
      <div className="fixed bottom-5 left-1/2 transform -translate-x-1/2 md:hidden z-50">
        <button onClick={toggleFollow} className="px-6 py-3 rounded-full bg-gradient-to-r from-[#F2BED1] to-[#C8B6E2] shadow-lg">
          {isFollowing ? "Following" : "Follow"}
        </button>
      </div>

      {/* small styles & keyframes */}
      <style jsx>{`
        @keyframes cardAppear {
          from { opacity: 0; transform: translateY(8px) scale(.995); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-pulse-slow { animation: pulse 2.5s infinite; }
        @keyframes pulse {
          0% { opacity: .6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.01); }
          100% { opacity: .6; transform: scale(1); }
        }
        /* tiny helpers for line-clamp fallback */
        .line-clamp-3 { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
      `}</style>
    </div>
  );
}

/* ---------------- Small helper components ---------------- */

function InlineEditableText({ value, onSave }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);
  useEffect(() => setVal(value), [value]);
  return editing ? (
    <div className="flex gap-2 items-center">
      <input value={val} onChange={(e) => setVal(e.target.value)} className="border-b px-1 py-0.5 w-full" />
      <button onClick={() => { onSave(val); setEditing(false); }} className="px-2 py-1 bg-[#F2BED1] rounded">Save</button>
      <button onClick={() => { setVal(value); setEditing(false); }} className="px-2 py-1 rounded">Cancel</button>
    </div>
  ) : (
    <h3 className="font-semibold text-lg flex items-center justify-between">
      <span>{value}</span>
      <button onClick={() => setEditing(true)} className="ml-2 text-xs opacity-70">Edit</button>
    </h3>
  );
}
