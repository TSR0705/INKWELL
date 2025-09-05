// src/components/CommentBox.jsx
// Inkwell — Conversational Comment System (Tailwind + Framer Motion)
// Palette: bg #F4F8FA, cards #D2E3EB, borders #B3D1DD, text #2A3441, subtext #567A9F
// accents #618CAF, hover #81A9C3, links #8FB8CB, pinned #E6EFF3

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Heart,
  MessageCircle,
  CornerUpLeft,
  Edit3,
  Trash2,
  ChevronDown,
  ChevronUp,
  Link2,
  AtSign,
  ShieldCheck,
  Pin,
  Loader2,
} from "lucide-react";

/**
 * Reusable CommentBox component
 * Props:
 * - currentUser: { id, name, avatar, verified, badges?: string[] }
 * - comments: Array<Comment> (flat or nested) — see shape below
 * - onSubmit: (payload) => Promise<{ ok: boolean, id?: string }>
 * - onReact?: (commentId, emoji) => Promise
 * - onDelete?: (commentId) => Promise
 * - onEdit?: (commentId, text) => Promise
 * - onFetchMore?: () => Promise  // for pagination
 * - isOwner?: (userId) => boolean // check if the viewer owns the comment
 * - initialSort?: "top" | "new" | "old" | "liked"
 *
 * Comment shape:
 * {
 *   id: string,
 *   user: { id, name, avatar, verified, badges?: string[] },
 *   text: string,
 *   createdAt: string | number,
 *   likes: number,
 *   likedByMe?: boolean,
 *   pinned?: boolean,
 *   replies?: Comment[]
 * }
 */

const PALETTE = {
  bg: "#F4F8FA",
  card: "#D2E3EB",
  border: "#B3D1DD",
  text: "#2A3441",
  sub: "#567A9F",
  accent: "#618CAF",
  hover: "#81A9C3",
  link: "#8FB8CB",
  pinned: "#E6EFF3",
};

function timeAgo(dateLike) {
  const d = new Date(dateLike);
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const dd = Math.floor(h / 24);
  if (dd < 30) return `${dd}d ago`;
  const mo = Math.floor(dd / 30);
  if (mo < 12) return `${mo}mo ago`;
  const y = Math.floor(mo / 12);
  return `${y}y ago`;
}

const ripple = {
  initial: { scale: 0, opacity: 0.4 },
  animate: { scale: 3, opacity: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 8 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.25 } }),
  exit: { opacity: 0, y: -8, transition: { duration: 0.2 } },
};

const slideDown = {
  hidden: { opacity: 0, height: 0 },
  show: { opacity: 1, height: "auto", transition: { duration: 0.25 } },
  exit: { opacity: 0, height: 0, transition: { duration: 0.2 } },
};

const emojiSet = ["👍", "❤️", "😂", "😮", "👏", "🔥", "🎉", "😍", "😢", "🙌"]; // minimal local picker

export default function CommentBox({
  currentUser,
  comments: initialComments = [],
  onSubmit,
  onReact,
  onDelete,
  onEdit,
  onFetchMore,
  isOwner = () => false,
  initialSort = "top",
}) {
  const [sortBy, setSortBy] = useState(initialSort);
  const [comments, setComments] = useState(initialComments);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [showMoreMap, setShowMoreMap] = useState({});

  useEffect(() => setComments(initialComments), [initialComments]);

  const sorted = useMemo(() => sortComments(comments, sortBy), [comments, sortBy]);

  const handleSubmit = async (text, replyingToId, quote) => {
    if (!text.trim()) return;
    setError("");
    setPending(true);
    // Optimistic local id
    const tempId = `temp-${Date.now()}`;
    const newComment = {
      id: tempId,
      user: currentUser,
      text,
      createdAt: Date.now(),
      likes: 0,
      likedByMe: false,
      pinned: false,
      replies: [],
    };

    setComments((prev) =>
      replyingToId
        ? attachReply(prev, replyingToId, newComment)
        : [newComment, ...prev]
    );

    try {
      const res = await onSubmit?.({ text, replyingToId, quote });
      if (res?.ok && res.id) {
        // Replace temp id with real id
        setComments((prev) => replaceId(prev, tempId, res.id));
      }
    } catch (e) {
      setError("Could not post comment. Please try again.");
      // Revert
      setComments((prev) => removeById(prev, tempId));
    } finally {
      setPending(false);
    }
  };

  const handleReact = async (id, emoji) => {
    // Optimistic like for ❤️ only (others stored in reactions map in future)
    if (emoji === "❤️") {
      setComments((prev) => toggleLike(prev, id));
    }
    try { await onReact?.(id, emoji); } catch {}
  };

  const handleEdit = async (id, text) => {
    const old = JSON.stringify(comments);
    setComments((prev) => updateText(prev, id, text));
    try { await onEdit?.(id, text); } catch { setComments(JSON.parse(old)); }
  };

  const handleDelete = async (id) => {
    const snapshot = comments;
    setComments((prev) => removeById(prev, id));
    try { await onDelete?.(id); } catch { setComments(snapshot); }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Sort bar */}
      <div
        className="flex items-center justify-between rounded-xl border"
        style={{ background: PALETTE.bg, borderColor: PALETTE.border }}
      >
        <div className="flex gap-2 p-2 text-sm" style={{ color: PALETTE.sub }}>
          {[
            { k: "top", label: "Top" },
            { k: "new", label: "New" },
            { k: "old", label: "Old" },
            { k: "liked", label: "Most Liked" },
          ].map(({ k, label }) => (
            <button
              key={k}
              onClick={() => setSortBy(k)}
              className={`px-3 py-1 rounded-md transition`}
              style={{
                color: sortBy === k ? PALETTE.text : PALETTE.sub,
                background: sortBy === k ? PALETTE.card : "transparent",
                border: `1px solid ${sortBy === k ? PALETTE.border : "transparent"}`,
              }}
            >
              {label}
            </button>
          ))}
        </div>
        {error && (
          <div className="px-3 py-1 text-xs rounded-md mr-2" style={{ color: PALETTE.text, background: PALETTE.pinned }}>
            {error}
          </div>
        )}
      </div>

      {/* Composer */}
      <Composer onSubmit={handleSubmit} currentUser={currentUser} pending={pending} />

      {/* Comment list */}
      <section className="mt-4 space-y-3">
        <AnimatePresence initial={false}>
          {sorted.map((c, i) => (
            <CommentCard
              key={c.id}
              comment={c}
              depth={0}
              index={i}
              showMoreMap={showMoreMap}
              setShowMoreMap={setShowMoreMap}
              onReact={handleReact}
              onDelete={handleDelete}
              onEdit={handleEdit}
              onReply={(text, quote) => handleSubmit(text, c.id, quote)}
              isOwner={isOwner(c.user.id)}
            />
          ))}
        </AnimatePresence>

        {/* Load more */}
        {onFetchMore && (
          <button
            onClick={onFetchMore}
            className="mx-auto block mt-2 px-4 py-2 rounded-lg text-sm transition"
            style={{ background: PALETTE.card, color: PALETTE.text, border: `1px solid ${PALETTE.border}` }}
          >
            Load more
          </button>
        )}
      </section>
    </div>
  );
}

/* ------------------------ Composer ------------------------ */
function Composer({ onSubmit, currentUser, pending }) {
  const [text, setText] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [selection, setSelection] = useState([0, 0]);
  const ref = useRef(null);

  const applyWrap = (before, after = before) => {
    const [s, e] = selection;
    const t = text;
    const next = t.slice(0, s) + before + t.slice(s, e) + after + t.slice(e);
    setText(next);
  };

  const insertAtCursor = (str) => {
    const [s, e] = selection;
    const t = text;
    setText(t.slice(0, s) + str + t.slice(e));
  };

  return (
    <div
      className="mt-3 rounded-xl border p-3"
      style={{ background: PALETTE.card, borderColor: PALETTE.border }}
    >
      <div className="flex gap-3">
        <Avatar src={currentUser?.avatar} alt={currentUser?.name} size={36} />
        <div className="flex-1">
          <textarea
            ref={ref}
            value={text}
            placeholder="Write a comment…"
            onChange={(e) => setText(e.target.value)}
            onSelect={(e) => setSelection([e.target.selectionStart, e.target.selectionEnd])}
            className="w-full resize-none rounded-lg bg-transparent p-2 outline-none placeholder:opacity-60 min-h-[72px]"
            style={{ color: PALETTE.text, border: `1px solid ${PALETTE.border}` }}
          />

          {/* Toolbar */}
          <div className="mt-2 flex items-center gap-2 text-sm">
            <ToolbarBtn label="Bold" onClick={() => applyWrap("**")} />
            <ToolbarBtn label="Italic" onClick={() => applyWrap("*" )} />
            <ToolbarBtn label="Link" onClick={() => applyWrap("[", "](https://)")} />
            <div className="relative">
              <ToolbarBtn label="Emoji" onClick={() => setShowEmoji((s) => !s)} />
              <AnimatePresence>
                {showEmoji && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="absolute z-20 mt-1 grid grid-cols-5 gap-1 rounded-lg p-2"
                    style={{ background: PALETTE.bg, border: `1px solid ${PALETTE.border}` }}
                  >
                    {emojiSet.map((e) => (
                      <button
                        key={e}
                        onClick={() => { insertAtCursor(e); setShowEmoji(false); }}
                        className="px-2 py-1 rounded hover:scale-110 transition"
                      >{e}</button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="ml-auto relative">
              <motion.button
                whileTap={{ scale: 0.98 }}
                disabled={!text.trim() || pending}
                onClick={() => { onSubmit?.(text); setText(""); }}
                className="relative overflow-hidden rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-60"
                style={{ color: "white", background: `linear-gradient(90deg, ${PALETTE.accent}, ${PALETTE.hover})` }}
              >
                <RippleCursor />
                {pending ? (
                  <span className="inline-flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin"/>Posting…</span>
                ) : (
                  "Submit"
                )}
              </motion.button>
            </div>
          </div>

          <div className="mt-1 text-xs" style={{ color: PALETTE.sub }}>
            Supports **bold**, *italic*, [links](https://) and @mentions.
          </div>
        </div>
      </div>
    </div>
  );
}

function ToolbarBtn({ label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="rounded-md px-2 py-1 text-xs border transition"
      style={{ borderColor: PALETTE.border, color: PALETTE.text, background: PALETTE.bg }}
    >
      {label}
    </button>
  );
}

/* ------------------------ Comment Card ------------------------ */
function CommentCard({
  comment,
  depth,
  index,
  showMoreMap,
  setShowMoreMap,
  onReact,
  onDelete,
  onEdit,
  onReply,
  isOwner,
}) {
  const [openReply, setOpenReply] = useState(false);
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(comment.text);
  const [expanded, setExpanded] = useState(false);

  const short = text.length > 260 ? text.slice(0, 260) + "…" : text;

  const likeIt = () => onReact?.(comment.id, "❤️");

  return (
    <motion.article
      variants={fadeUp}
      initial="hidden"
      animate="show"
      exit="exit"
      custom={index}
      className="rounded-xl p-3"
      style={{
        background: comment.pinned ? PALETTE.pinned : PALETTE.card,
        border: `1px solid ${PALETTE.border}`,
        boxShadow: "0 6px 18px rgba(43,74,102,0.08)",
      }}
    >
      <div className="flex gap-3">
        <Avatar src={comment.user.avatar} alt={comment.user.name} size={36} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link to={`/profile/${comment.user.id}`} className="font-semibold hover:underline" style={{ color: PALETTE.text }}>
              {comment.user.name}
            </Link>
            {comment.user.verified && <ShieldCheck className="w-4 h-4" color={PALETTE.accent} />}
            {comment.user.badges?.map((b) => (
              <span key={b} className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: PALETTE.bg, color: PALETTE.sub, border: `1px solid ${PALETTE.border}` }}>{b}</span>
            ))}
            {comment.pinned && (
              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full" style={{ background: PALETTE.bg, color: PALETTE.sub, border: `1px solid ${PALETTE.border}` }}>
                <Pin className="w-3 h-3"/>Pinned
              </span>
            )}
            <span className="ml-auto text-xs" style={{ color: PALETTE.sub }}>{timeAgo(comment.createdAt)}</span>
          </div>

          {/* Text block */}
          {!editing ? (
            <p className="mt-1 text-sm whitespace-pre-wrap" style={{ color: PALETTE.text }}>
              {expanded ? text : short}
              {text.length > 260 && (
                <button onClick={() => setExpanded((s) => !s)} className="ml-2 text-xs underline" style={{ color: PALETTE.link }}>
                  {expanded ? "Show less" : "Show more"}
                </button>
              )}
            </p>
          ) : (
            <div className="mt-2">
              <textarea value={text} onChange={(e) => setText(e.target.value)} className="w-full rounded-md p-2 text-sm" style={{ color: PALETTE.text, border: `1px solid ${PALETTE.border}`, background: PALETTE.bg }} />
              <div className="mt-2 flex gap-2 text-xs">
                <button onClick={() => { onEdit?.(comment.id, text); setEditing(false); }} className="px-3 py-1 rounded-md text-white" style={{ background: PALETTE.accent }}>Save</button>
                <button onClick={() => { setText(comment.text); setEditing(false); }} className="px-3 py-1 rounded-md" style={{ background: PALETTE.bg, border: `1px solid ${PALETTE.border}`, color: PALETTE.text }}>Cancel</button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="mt-2 flex items-center gap-2 opacity-90">
            <ActionBtn onClick={likeIt} title="Like">
              <Heart className={`w-4 h-4 ${comment.likedByMe ? "fill-current" : ""}`} color={PALETTE.accent} />
              <AnimatedCount value={comment.likes} />
            </ActionBtn>

            <ActionBtn onClick={() => setOpenReply((s) => !s)} title="Reply">
              <CornerUpLeft className="w-4 h-4" color={PALETTE.accent} /> Reply
            </ActionBtn>

            {isOwner && (
              <>
                <ActionBtn onClick={() => setEditing(true)} title="Edit">
                  <Edit3 className="w-4 h-4" color={PALETTE.accent} /> Edit
                </ActionBtn>
                <ActionBtn onClick={() => onDelete?.(comment.id)} title="Delete">
                  <Trash2 className="w-4 h-4" color={PALETTE.accent} /> Delete
                </ActionBtn>
              </>
            )}

            <ActionBtn onClick={() => copyLink(comment.id)} title="Copy link">
              <Link2 className="w-4 h-4" color={PALETTE.accent} /> Share
            </ActionBtn>
          </div>

          {/* Reply composer */}
          <AnimatePresence initial={false}>
            {openReply && (
              <motion.div variants={slideDown} initial="hidden" animate="show" exit="exit" className="mt-2 pl-3 border-l" style={{ borderColor: PALETTE.border }}>
                <MiniReply onSubmit={(t, q) => { onReply?.(t, q); setOpenReply(false); }} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Replies */}
          {comment.replies?.length > 0 && (
            <div className="mt-2 pl-3 border-l" style={{ borderColor: PALETTE.border }}>
              <RepliesThread replies={comment.replies} onReact={onReact} onDelete={onDelete} onEdit={onEdit} onReply={onReply} />
            </div>
          )}
        </div>
      </div>
    </motion.article>
  );
}

function RepliesThread({ replies, onReact, onDelete, onEdit, onReply }) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div>
      <button onClick={() => setCollapsed((s) => !s)} className="text-xs inline-flex items-center gap-1 px-2 py-1 rounded-md transition"
        style={{ color: PALETTE.sub, background: PALETTE.bg, border: `1px solid ${PALETTE.border}` }}>
        {collapsed ? <ChevronDown className="w-3 h-3"/> : <ChevronUp className="w-3 h-3"/>}
        {collapsed ? `View ${replies.length} replies` : `Hide replies`}
      </button>
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div variants={slideDown} initial="hidden" animate="show" exit="exit" className="mt-2 space-y-2">
            {replies.map((r, i) => (
              <CommentCard
                key={r.id}
                comment={r}
                depth={1}
                index={i}
                showMoreMap={{}}
                setShowMoreMap={() => {}}
                onReact={onReact}
                onDelete={onDelete}
                onEdit={onEdit}
                onReply={(t, q) => onReply?.(t, q)}
                isOwner={false}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MiniReply({ onSubmit }) {
  const [val, setVal] = useState("");
  const [quote, setQuote] = useState("");
  return (
    <div className="rounded-lg p-2" style={{ background: PALETTE.bg, border: `1px solid ${PALETTE.border}` }}>
      <textarea value={val} onChange={(e) => setVal(e.target.value)} placeholder="Write a reply…" className="w-full text-sm rounded-md p-2 bg-transparent outline-none" style={{ color: PALETTE.text, border: `1px solid ${PALETTE.border}` }} />
      {quote && (
        <blockquote className="mt-1 text-xs p-2 rounded-md" style={{ color: PALETTE.sub, background: PALETTE.pinned, border: `1px dashed ${PALETTE.border}` }}>{quote}</blockquote>
      )}
      <div className="mt-2 flex items-center gap-2">
        <motion.button whileTap={{ scale: 0.98 }} onClick={() => onSubmit?.(val, quote)} className="px-3 py-1 rounded-md text-white text-xs" style={{ background: PALETTE.accent }}>Reply</motion.button>
        <button onClick={() => setQuote(val)} className="text-xs underline" style={{ color: PALETTE.link }}>Quote</button>
      </div>
    </div>
  );
}

/* ------------------------ Primitives ------------------------ */
function Avatar({ src, alt, size = 32 }) {
  const initials = useMemo(() => (alt ? alt.split(" ").map((p) => p[0]).slice(0, 2).join("") : "?"), [alt]);
  return (
    <div
      className="flex items-center justify-center rounded-full overflow-hidden bg-white/70"
      style={{ width: size, height: size, border: `1px solid ${PALETTE.border}`, color: PALETTE.sub }}
    >
      {src ? (
        <img src={src} alt={alt} className="w-full h-full object-cover" />
      ) : (
        <span className="text-xs font-semibold">{initials}</span>
      )}
    </div>
  );
}

function ActionBtn({ children, onClick, title }) {
  return (
    <button
      onClick={onClick}
      className="group inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md transition relative overflow-hidden"
      title={title}
      style={{ color: PALETTE.text, border: `1px solid ${PALETTE.border}`, background: PALETTE.bg }}
    >
      <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition" style={{ background: "linear-gradient(90deg, rgba(97,140,175,0.12), rgba(129,169,195,0.12))" }} />
      <span className="relative z-10 inline-flex items-center gap-1">{children}</span>
    </button>
  );
}

function AnimatedCount({ value }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let raf; const start = performance.now(); const from = display; const to = value; const dur = 350;
    const tick = (t) => {
      const p = Math.min(1, (t - start) / dur);
      setDisplay(Math.round(from + (to - from) * p));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <span>{display}</span>;
}

function RippleCursor() {
  const [clicks, setClicks] = useState([]);
  return (
    <span
      onMouseDown={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - r.left; const y = e.clientY - r.top;
        setClicks((arr) => [...arr, { id: Date.now(), x, y }]);
      }}
      className="absolute inset-0"
    >
      <AnimatePresence>
        {clicks.map((c) => (
          <motion.span
            key={c.id}
            variants={ripple}
            initial="initial"
            animate="animate"
            exit={{ opacity: 0 }}
            className="absolute rounded-full"
            style={{ left: c.x, top: c.y, width: 12, height: 12, background: "white" }}
            onAnimationComplete={() => setClicks((arr) => arr.filter((x) => x.id !== c.id))}
          />
        ))}
      </AnimatePresence>
    </span>
  );
}

/* ------------------------ Helpers (immutable ops) ------------------------ */
function replaceId(list, tempId, realId) {
  return list.map((c) =>
    c.id === tempId
      ? { ...c, id: realId }
      : { ...c, replies: c.replies ? replaceId(c.replies, tempId, realId) : c.replies }
  );
}
function removeById(list, id) {
  return list
    .filter((c) => c.id !== id)
    .map((c) => ({ ...c, replies: c.replies ? removeById(c.replies, id) : c.replies }));
}
function updateText(list, id, text) {
  return list.map((c) =>
    c.id === id ? { ...c, text } : { ...c, replies: c.replies ? updateText(c.replies, id, text) : c.replies }
  );
}
function toggleLike(list, id) {
  return list.map((c) =>
    c.id === id
      ? { ...c, likedByMe: !c.likedByMe, likes: c.likedByMe ? c.likes - 1 : c.likes + 1 }
      : { ...c, replies: c.replies ? toggleLike(c.replies, id) : c.replies }
  );
}
function attachReply(list, id, reply) {
  return list.map((c) =>
    c.id === id ? { ...c, replies: [reply, ...(c.replies || [])] } : { ...c, replies: c.replies ? attachReply(c.replies, id, reply) : c.replies }
  );
}
function sortComments(list, mode) {
  const clone = JSON.parse(JSON.stringify(list));
  const cmp = {
    top: (a, b) => (b.pinned === a.pinned ? b.likes - a.likes : (b.pinned?1:0) - (a.pinned?1:0)),
    new: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    old: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
    liked: (a, b) => b.likes - a.likes,
  }[mode] || ((a, b) => 0);
  clone.sort(cmp);
  clone.forEach((c) => c.replies && (c.replies = c.replies.sort(cmp)));
  return clone;
}

function copyLink(id) {
  try {
    const url = `${window.location.origin}${window.location.pathname}#comment-${id}`;
    navigator.clipboard.writeText(url);
  } catch {}
}
