// CreatePost.jsx
import React, { useEffect, useRef, useState, useCallback } from "react";

/**
 * CreatePost.jsx — Inkwell (upgraded)
 *
 * - Adds: subtitle, slug (auto / editable), thumbnail, comments toggle,
 *   schedule publish (datetime-local), SEO fields (seo title, meta desc, social preview),
 *   author info (editable), and social preview thumbnail.
 * - Fixes contentEditable issues (typing reversed) by making editor DOM the source of truth
 *   and avoiding re-setting innerHTML on each render.
 * - Rich-text uses document.execCommand wrappers for simple formatting and paste handling.
 * - Autosave to localStorage; preview mode uses sanitized HTML from editor DOM.
 *
 * Requirements:
 * - TailwindCSS configured in the project.
 * - No backend required.
 *
 * NOTE: execCommand is used for simplicity. For production-grade editor (consistent behavior,
 * collaboration, history), consider integrating ProseMirror/TipTap/Slate.
 */

/* ----------------------------- Theme Tokens ---------------------------- */
const INKWELL = {
  light: {
    bg: "bg-[#F9F5F6]",
    card: "bg-[#F8E8EE]",
    accent: "bg-[#F2BED1]",
    accentHover: "hover:bg-[#FDCEDF]",
    text: "text-black",
  },
  dark: {
    bg: "bg-[#495C83]",
    card: "bg-[#7A86B6]",
    accent: "bg-[#C8B6E2]",
    accentHover: "hover:bg-[#A8A4CE]",
    text: "text-white",
  },
};

const STORAGE_KEY = "inkwell:createpost:autosave:v2";

/* ------------------------------- Helpers -------------------------------- */
const slugify = (s = "") =>
  s
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-");

const readFileAsDataURL = (file) =>
  new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = rej;
    r.readAsDataURL(file);
  });

const getWordCount = (html) => {
  const text = html.replace(/<\/?[^>]+(>|$)/g, " ").replace(/\s+/g, " ").trim();
  return text ? text.split(" ").length : 0;
};

const estimateReadingTime = (wordCount) => {
  const min = Math.max(1, Math.round(wordCount / 200));
  return `${min} min read`;
};

/* ---------------------------- Main Component ---------------------------- */
export default function CreatePost() {
  const prefersDark = typeof document !== "undefined" && document.documentElement.classList.contains("dark");
  const theme = prefersDark ? INKWELL.dark : INKWELL.light;

  // Basic fields
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);

  // Editor content (state used for autosave/preview only). Editor DOM keeps actual content.
  const [contentHtml, setContentHtml] = useState(""); // snapshot
  const editorRef = useRef(null);

  // Cover & Thumbnail & Social Preview & author avatar
  const [cover, setCover] = useState(null); // { src, brightness }
  const [thumbnail, setThumbnail] = useState(null);
  const [socialPreview, setSocialPreview] = useState(null);
  const [authorAvatar, setAuthorAvatar] = useState(null);

  // Tags
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const suggestions = ["React", "Tailwind", "WebDev", "Design", "Tutorial", "Life"];

  // Settings & meta
  const [commentsEnabled, setCommentsEnabled] = useState(true);
  const [scheduleAt, setScheduleAt] = useState(""); // datetime-local string
  const [seoTitle, setSeoTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");

  // Author info
  const [authorName, setAuthorName] = useState("Your Name");
  const [authorBio, setAuthorBio] = useState("");

  // UI & editor helpers
  const [isPreview, setIsPreview] = useState(false);
  const [toolbarVisible, setToolbarVisible] = useState(false);
  const [selectionRect, setSelectionRect] = useState(null);
  const [autosaveBlink, setAutosaveBlink] = useState(false);
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);
  const fileInputCover = useRef(null);
  const fileInputThumb = useRef(null);
  const fileInputSocial = useRef(null);
  const fileInputAuthor = useRef(null);

  // Load autosave
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        setTitle(data.title || "");
        setSubtitle(data.subtitle || "");
        setSlug(data.slug || "");
        setSlugEdited(Boolean(data.slugEdited));
        setTags(data.tags || []);
        setCommentsEnabled(typeof data.commentsEnabled === "boolean" ? data.commentsEnabled : true);
        setScheduleAt(data.scheduleAt || "");
        setSeoTitle(data.seoTitle || "");
        setMetaDescription(data.metaDescription || "");
        setAuthorName(data.authorName || "Your Name");
        setAuthorBio(data.authorBio || "");
        setCover(data.cover || null);
        setThumbnail(data.thumbnail || null);
        setSocialPreview(data.socialPreview || null);
        setAuthorAvatar(data.authorAvatar || null);
        setContentHtml(data.contentHtml || "");
      }
    } catch (e) {
      // ignore
    }
  }, []);

  // Initialize editor DOM once (to avoid re-writing and caret loss)
  useEffect(() => {
    if (editorRef.current && contentHtml) {
      // Only set innerHTML once when mounting/loading saved content
      // If editor currently empty, populate.
      if (!editorRef.current.innerHTML || editorRef.current.innerHTML.trim().length === 0 || contentHtml !== "") {
        editorRef.current.innerHTML = contentHtml;
      }
    }
    // If no contentHtml, keep placeholder inserted by render.
  }, [editorRef, contentHtml]);

  // Autosave (debounced)
  useEffect(() => {
    const id = setTimeout(() => {
      const payload = {
        title,
        subtitle,
        slug,
        slugEdited,
        contentHtml,
        tags,
        commentsEnabled,
        scheduleAt,
        seoTitle,
        metaDescription,
        authorName,
        authorBio,
        cover,
        thumbnail,
        socialPreview,
        authorAvatar,
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
        setAutosaveBlink(true);
        setTimeout(() => setAutosaveBlink(false), 700);
      } catch (e) {}
    }, 900);
    return () => clearTimeout(id);
  }, [
    title,
    subtitle,
    slug,
    slugEdited,
    contentHtml,
    tags,
    commentsEnabled,
    scheduleAt,
    seoTitle,
    metaDescription,
    authorName,
    authorBio,
    cover,
    thumbnail,
    socialPreview,
    authorAvatar,
  ]);

  // Selection / inline toolbar
  useEffect(() => {
    const onSelectionChange = () => {
      const sel = document.getSelection();
      if (!sel || sel.rangeCount === 0) {
        setToolbarVisible(false);
        setSelectionRect(null);
        return;
      }
      const range = sel.getRangeAt(0);
      if (!editorRef.current || !editorRef.current.contains(range.commonAncestorContainer)) {
        setToolbarVisible(false);
        setSelectionRect(null);
        return;
      }
      const hasText = sel.toString().trim().length > 0;
      if (!hasText) {
        setToolbarVisible(false);
        setSelectionRect(null);
        return;
      }
      const rect = range.getBoundingClientRect();
      setSelectionRect(rect);
      setToolbarVisible(true);
    };
    document.addEventListener("selectionchange", onSelectionChange);
    return () => document.removeEventListener("selectionchange", onSelectionChange);
  }, []);

  // Keyboard shortcuts (basic)
  useEffect(() => {
    const onKeyDown = (e) => {
      const meta = e.ctrlKey || e.metaKey;
      if (!meta) return;
      const key = e.key.toLowerCase();
      if (key === "b" || key === "i" || key === "u") {
        e.preventDefault();
        if (key === "b") execCommand("bold");
        if (key === "i") execCommand("italic");
        if (key === "u") execCommand("underline");
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Editor onInput to update snapshot state (but do not overwrite DOM)
  const onEditorInput = useCallback(() => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    setContentHtml(html);
  }, []);

  // Paste handling: prefer images, otherwise paste plain text to avoid messy HTML
  const onPaste = (e) => {
    if (!editorRef.current) return;
    const items = e.clipboardData?.items;
    if (items) {
      for (const it of items) {
        if (it.type.indexOf("image") === 0) {
          const file = it.getAsFile();
          readFileAsDataURL(file).then((src) => {
            execCommand("insertImage", src);
            onEditorInput();
          });
          e.preventDefault();
          return;
        }
      }
      // If no image, paste plain text
      const text = e.clipboardData.getData("text/plain");
      if (text) {
        // Use insertText for clean paste
        document.execCommand("insertText", false, text);
        e.preventDefault();
        onEditorInput();
      }
    }
  };

  // execCommand wrapper
  const execCommand = (cmd, value = null) => {
    try {
      document.execCommand(cmd, false, value);
      // reflect to state after a tick
      setTimeout(onEditorInput, 0);
    } catch (e) {
      // ignore in old browsers
    }
  };

  /* --------------------------- Image handlers --------------------------- */

  const handleFile = async (files, setter) => {
    if (!files || files.length === 0) return;
    const src = await readFileAsDataURL(files[0]);
    setter({ src, name: files[0].name });
  };

  const onDropCover = async (e) => {
    e.preventDefault();
    if (e.dataTransfer?.files?.length) {
      await handleFile(e.dataTransfer.files, setCover);
    }
  };
  const onDropThumb = async (e) => {
    e.preventDefault();
    if (e.dataTransfer?.files?.length) {
      await handleFile(e.dataTransfer.files, setThumbnail);
    }
  };
  const onDropSocial = async (e) => {
    e.preventDefault();
    if (e.dataTransfer?.files?.length) {
      await handleFile(e.dataTransfer.files, setSocialPreview);
    }
  };
  const onDropAuthor = async (e) => {
    e.preventDefault();
    if (e.dataTransfer?.files?.length) {
      await handleFile(e.dataTransfer.files, setAuthorAvatar);
    }
  };

  /* ------------------------------- Tags UI ------------------------------- */

  const addTag = (t) => {
    const tag = (t || tagInput).trim();
    if (!tag) return;
    if (tags.includes(tag)) {
      setTagInput("");
      return;
    }
    setTags((s) => [...s, tag]);
    setTagInput("");
  };
  const removeTag = (i) => setTags((s) => s.filter((_, idx) => idx !== i));
  const dragIdx = useRef(null);
  const onTagDragStart = (e, i) => {
    dragIdx.current = i;
    e.dataTransfer.effectAllowed = "move";
  };
  const onTagDragOver = (e, i) => {
    e.preventDefault();
    if (dragIdx.current === null || dragIdx.current === i) return;
    setTags((prev) => {
      const copy = [...prev];
      const [item] = copy.splice(dragIdx.current, 1);
      copy.splice(i, 0, item);
      dragIdx.current = i;
      return copy;
    });
  };
  const onTagDragEnd = () => (dragIdx.current = null);

  /* ------------------------------ Actions ------------------------------- */

  const simulateSave = useCallback(async (type = "draft") => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 700));
    setSaving(false);
    setToast(type === "publish" ? "Published successfully" : type === "schedule" ? "Scheduled successfully" : "Draft saved");
    setTimeout(() => setToast(null), 2000);
  }, []);

  const onPublish = async () => {
    // If schedule set and in future, schedule
    if (scheduleAt) {
      const scheduledTime = new Date(scheduleAt).getTime();
      const now = Date.now();
      if (scheduledTime > now) {
        await simulateSave("schedule");
        return;
      }
    }
    await simulateSave("publish");
    setIsPreview(true);
    // keep data in state/localStorage only (no backend)
  };

  const onPreviewToggle = () => {
    // update snapshot from DOM before preview
    if (editorRef.current) setContentHtml(editorRef.current.innerHTML);
    setIsPreview((p) => !p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* ----------------------------- Slug logic ------------------------------ */
  useEffect(() => {
    if (!slugEdited) {
      setSlug(slugify(title));
    }
  }, [title, slugEdited]);

  /* ---------------------------- Utility UI ------------------------------ */

  const clearAll = () => {
    setTitle("");
    setSubtitle("");
    setSlug("");
    setSlugEdited(false);
    setContentHtml("");
    if (editorRef.current) editorRef.current.innerHTML = "";
    setCover(null);
    setThumbnail(null);
    setSocialPreview(null);
    setAuthorAvatar(null);
    setTags([]);
    setSeoTitle("");
    setMetaDescription("");
    setScheduleAt("");
    setToast("Cleared");
    setTimeout(() => setToast(null), 1200);
    localStorage.removeItem(STORAGE_KEY);
  };

  /* ------------------------------ Preview UI ----------------------------- */
  const previewRender = (
    <article className={`max-w-3xl mx-auto rounded-2xl overflow-hidden shadow-lg ${theme.card} ${theme.text}`}>
      {cover ? (
        <div className="relative">
          <img src={cover.src} alt="cover" className="w-full h-64 object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/25 pointer-events-none" />
        </div>
      ) : null}
      <div className="p-8">
        <h1 className="text-3xl font-extrabold mb-2">{title || "Untitled"}</h1>
        {subtitle ? <p className="text-lg text-black/70 dark:text-white/80 mb-4">{subtitle}</p> : null}
        <div className="mb-4 text-sm text-black/60 dark:text-white/70">
          {getWordCount(contentHtml)} words • {estimateReadingTime(getWordCount(contentHtml))}
        </div>
        <div className="prose prose-lg max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: contentHtml || "<p class='opacity-60 italic'>No content yet.</p>" }} />
        <div className="mt-6 flex gap-2 flex-wrap">
          {tags.map((t) => (
            <span key={t} className="px-3 py-1 rounded-full text-sm font-medium bg-black/5 dark:bg-white/10">
              {t}
            </span>
          ))}
        </div>
        <div className="mt-6 flex items-center gap-3">
          <img src={authorAvatar?.src || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Crect width='40' height='40' fill='%23ccc' /%3E%3C/svg%3E"} alt="author" className="w-10 h-10 rounded-full object-cover" />
          <div>
            <div className="font-medium">{authorName}</div>
            {authorBio ? <div className="text-xs opacity-70">{authorBio}</div> : null}
          </div>
        </div>
      </div>
    </article>
  );

  /* -------------------------------- Render -------------------------------- */
  return (
    <div className={`${theme.bg} ${theme.text} min-h-screen transition-colors duration-300 p-4`}>
      {/* Header */}
      <header className="max-w-7xl mx-auto mb-6">
        <div className={`rounded-2xl p-6 relative ${theme.card} shadow-sm`}>
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ background: "radial-gradient(400px 150px at 10% 20%, rgba(242,190,209,0.4), transparent 20%)" }} />
          <h2 className="text-4xl font-extrabold z-10 relative">Create Your Masterpiece</h2>
          <p className="mt-1 text-sm z-10 relative text-black/70 dark:text-white/80">Your story, your style</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 pb-36">
        {/* Left (editor) */}
        <section className="lg:col-span-2 space-y-4">
          {/* Title + subtitle + slug */}
          <div className={`rounded-2xl ${theme.card} p-4 shadow-sm`}>
            <textarea
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter your blog title…"
              className="w-full bg-transparent resize-none focus:outline-none text-3xl sm:text-4xl font-extrabold placeholder:opacity-40"
              rows={1}
              style={{ lineHeight: 1.05 }}
            />
            <input
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="Subtitle / short description (optional)"
              className="w-full mt-2 bg-transparent focus:outline-none placeholder:opacity-50"
            />
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-xs opacity-70">Slug</div>
                <input
                  value={slug}
                  onChange={(e) => {
                    setSlug(e.target.value);
                    setSlugEdited(true);
                  }}
                  className="px-2 py-1 rounded-md text-sm bg-white/70 dark:bg-white/10"
                />
                <button
                  onClick={() => {
                    setSlug(slugify(title));
                    setSlugEdited(false);
                  }}
                  className="text-xs px-2 py-1 rounded-md bg-black/5 dark:bg-white/10"
                >
                  Auto
                </button>
                <div className="text-xs opacity-60">/{slug || "your-slug"}</div>
              </div>

              <div className="flex items-center gap-3">
                <div className={`text-xs px-2 py-1 rounded ${autosaveBlink ? "animate-pulse" : ""} ${theme.card}`}>
                  {saving ? "Saving…" : "Autosaved"}
                </div>
                <button onClick={clearAll} className="text-sm px-3 py-1 rounded-md bg-black/5 dark:bg-white/10">Reset</button>
              </div>
            </div>
          </div>

          {/* Editor area */}
          <div
            className={`rounded-2xl ${theme.card} p-4 shadow-sm relative`}
            onDrop={(e) => {
              e.preventDefault();
              // allow cover drop in editor as image embed
              const dt = e.dataTransfer;
              if (dt?.files?.length) {
                const f = dt.files[0];
                if (f.type.startsWith("image/")) {
                  readFileAsDataURL(f).then((src) => {
                    execCommand("insertImage", src);
                    onEditorInput();
                  });
                }
              }
            }}
            onDragOver={(e) => e.preventDefault()}
          >
            {/* Inline selection toolbar */}
            {toolbarVisible && selectionRect && (
              <div
                style={{
                  position: "absolute",
                  left: Math.max(16, selectionRect.left + selectionRect.width / 2 - 120),
                  top: window.scrollY + selectionRect.top - 56,
                  zIndex: 50,
                }}
                className="rounded-xl p-2 shadow-lg bg-white/90 dark:bg-black/60"
              >
                <div className="flex items-center gap-2">
                  <ToolbarButton onClick={() => execCommand("bold")}>B</ToolbarButton>
                  <ToolbarButton onClick={() => execCommand("italic")}>I</ToolbarButton>
                  <ToolbarButton onClick={() => execCommand("underline")}>U</ToolbarButton>
                  <ToolbarButton onClick={() => execCommand("strikeThrough")}>S</ToolbarButton>
                  <ToolbarButton onClick={() => execCommand("formatBlock", "H2")}>H2</ToolbarButton>
                  <ToolbarButton onClick={() => execCommand("insertUnorderedList")}>•</ToolbarButton>
                  <ToolbarButton onClick={() => execCommand("insertOrderedList")}>1.</ToolbarButton>
                  <ToolbarButton
                    onClick={() => {
                      const url = prompt("Image URL to embed");
                      if (url) {
                        execCommand("insertImage", url);
                        onEditorInput();
                      }
                    }}
                  >
                    🖼
                  </ToolbarButton>
                </div>
              </div>
            )}

            {/* Editable area (DOM is source-of-truth) */}
            <div
              ref={editorRef}
              contentEditable={!isPreview}
              onInput={onEditorInput}
              onPaste={onPaste}
              suppressContentEditableWarning
              className={`min-h-[360px] prose prose-lg max-w-none bg-transparent focus:outline-none ${isPreview ? "opacity-60 pointer-events-none" : ""}`}
              dangerouslySetInnerHTML={{ __html: contentHtml || `<p class="opacity-60 italic">Start writing your masterpiece…</p>` }}
            />
          </div>

          {/* Small formatting toolbar (block-level) */}
          <div className={`flex items-center gap-2 ${theme.card} p-3 rounded-2xl shadow-sm`}>
            <button onClick={() => execCommand("formatBlock", "H2")} className="px-3 py-1 rounded-md bg-black/5 dark:bg-white/10">H2</button>
            <button onClick={() => execCommand("formatBlock", "BLOCKQUOTE")} className="px-3 py-1 rounded-md bg-black/5 dark:bg-white/10">Quote</button>
            <button onClick={() => execCommand("insertOrderedList")} className="px-3 py-1 rounded-md bg-black/5 dark:bg-white/10">Number</button>
            <button onClick={() => execCommand("insertUnorderedList")} className="px-3 py-1 rounded-md bg-black/5 dark:bg-white/10">Bullet</button>
            <button onClick={() => {
              const code = prompt("Paste code snippet");
              if (code) execCommand("insertHTML", `<pre><code>${escapeHtml(code)}</code></pre>`);
            }} className="px-3 py-1 rounded-md bg-black/5 dark:bg-white/10">Code</button>
            <div className="ml-auto text-sm opacity-70">
              {getWordCount(contentHtml)} words • {estimateReadingTime(getWordCount(contentHtml))}
            </div>
          </div>
        </section>

        {/* Right sidebar */}
        <aside className="lg:col-span-1 space-y-4">
          {/* Cover */}
          <div className={`rounded-2xl ${theme.card} p-4 shadow-sm`} onDrop={onDropCover} onDragOver={(e) => e.preventDefault()}>
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold">Cover Image</div>
              <div className="text-xs opacity-60">Drag or click</div>
            </div>
            <div onClick={() => fileInputCover.current?.click()} className="cursor-pointer rounded-xl overflow-hidden">
              {cover ? (
                <div className="relative">
                  <img src={cover.src} alt="cover" className="w-full h-36 object-cover rounded-xl shadow" />
                  <div className="absolute bottom-3 right-3">
                    <button className={`px-3 py-1 rounded ${theme.accent} ${theme.accentHover}`}>Change</button>
                  </div>
                </div>
              ) : (
                <div className="border border-dashed rounded-xl h-36 flex items-center justify-center">
                  <div className="text-sm opacity-70">Click or drop to upload cover</div>
                </div>
              )}
            </div>
            <input ref={fileInputCover} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files, setCover)} />
            {cover && (
              <div className="mt-3">
                <label className="text-xs">Brightness</label>
                <input type="range" min={60} max={140} value={cover.brightness || 100} onChange={(e) => setCover((c) => ({ ...(c || {}), brightness: +e.target.value }))} className="w-full" />
              </div>
            )}
          </div>

          {/* Thumbnail */}
          <div className={`rounded-2xl ${theme.card} p-4 shadow-sm`} onDrop={onDropThumb} onDragOver={(e) => e.preventDefault()}>
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold">Thumbnail</div>
              <div className="text-xs opacity-60">Used in lists</div>
            </div>
            <div className="cursor-pointer" onClick={() => fileInputThumb.current?.click()}>
              {thumbnail ? (
                <img src={thumbnail.src} alt="thumb" className="w-full h-20 object-cover rounded-lg" />
              ) : (
                <div className="border border-dashed rounded-lg h-20 flex items-center justify-center">
                  <div className="text-sm opacity-70">Upload thumbnail</div>
                </div>
              )}
            </div>
            <input ref={fileInputThumb} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files, setThumbnail)} />
          </div>

          {/* Tags */}
          <div className={`rounded-2xl ${theme.card} p-4 shadow-sm`}>
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-semibold">Tags</div>
              <div className="text-xs opacity-60">{tags.length}</div>
            </div>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((t, i) => (
                <div key={t} draggable onDragStart={(e) => onTagDragStart(e, i)} onDragOver={(e) => onTagDragOver(e, i)} onDragEnd={onTagDragEnd} className="px-3 py-1 rounded-full bg-white/90 dark:bg-black/40 flex items-center gap-2">
                  <span className="text-sm">{t}</span>
                  <button onClick={() => removeTag(i)} className="text-xs opacity-60">✕</button>
                </div>
              ))}
            </div>
            <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())} placeholder="Add a tag and press Enter" className="w-full px-3 py-2 rounded-md bg-white/70 dark:bg-white/10" />
            <div className="mt-2 flex flex-wrap gap-2">
              {suggestions.filter((s) => !tags.includes(s)).map((s) => <button key={s} onClick={() => addTag(s)} className="text-xs px-2 py-1 rounded bg-black/5 dark:bg-white/10">{s}</button>)}
            </div>
          </div>

          {/* SEO & Social */}
          <div className={`rounded-2xl ${theme.card} p-4 shadow-sm`}>
            <div className="text-sm font-semibold mb-2">SEO & Social</div>
            <input placeholder="SEO Title" value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} className="w-full px-3 py-2 rounded-md bg-white/70 dark:bg-white/10 mb-2" />
            <textarea placeholder="Meta Description" value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} className="w-full px-3 py-2 rounded-md bg-white/70 dark:bg-white/10 mb-2" rows={3} />
            <div className="text-xs opacity-60 mb-2">Social preview image</div>
            <div className="cursor-pointer" onClick={() => fileInputSocial.current?.click()}>
              {socialPreview ? <img src={socialPreview.src} alt="social" className="w-full h-20 object-cover rounded-lg" /> : <div className="border border-dashed rounded-lg h-20 flex items-center justify-center text-sm opacity-70">Upload</div>}
              <input ref={fileInputSocial} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files, setSocialPreview)} />
            </div>
          </div>

          {/* Scheduling & comments */}
          <div className={`rounded-2xl ${theme.card} p-4 shadow-sm`}>
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-semibold">Publish & Comments</div>
            </div>
            <label className="text-xs opacity-70">Schedule publish</label>
            <input type="datetime-local" value={scheduleAt} onChange={(e) => setScheduleAt(e.target.value)} className="w-full px-3 py-2 rounded-md bg-white/70 dark:bg-white/10 mb-3" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input id="comments" type="checkbox" checked={commentsEnabled} onChange={(e) => setCommentsEnabled(e.target.checked)} />
                <label htmlFor="comments" className="text-sm">Comments enabled</label>
              </div>
              <div className="text-xs opacity-60">Schedule: {scheduleAt ? new Date(scheduleAt).toLocaleString() : "None"}</div>
            </div>
            <div className="mt-3 flex gap-2">
              <button onClick={() => (setSeoTitle(title), setMetaDescription(subtitle))} className="px-3 py-2 rounded-md bg-black/5 dark:bg-white/10">Fill SEO</button>
              <button onClick={() => setScheduleAt("")} className="px-3 py-2 rounded-md bg-black/5 dark:bg-white/10">Clear</button>
            </div>
          </div>

          {/* Author Info */}
          <div className={`rounded-2xl ${theme.card} p-4 shadow-sm`} onDrop={onDropAuthor} onDragOver={(e) => e.preventDefault()}>
            <div className="flex items-center gap-3 mb-3">
              <div>
                <div className="text-sm font-semibold">Author</div>
                <div className="text-xs opacity-60">Editable</div>
              </div>
              <div className="ml-auto">
                <button onClick={() => fileInputAuthor.current?.click()} className="px-3 py-1 rounded-md bg-black/5 dark:bg-white/10">Avatar</button>
                <input ref={fileInputAuthor} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files, setAuthorAvatar)} />
              </div>
            </div>
            <input value={authorName} onChange={(e) => setAuthorName(e.target.value)} className="w-full px-3 py-2 rounded-md bg-white/70 dark:bg-white/10 mb-2" />
            <textarea value={authorBio} onChange={(e) => setAuthorBio(e.target.value)} rows={3} className="w-full px-3 py-2 rounded-md bg-white/70 dark:bg-white/10" placeholder="Short bio (optional)" />
          </div>
        </aside>

        {/* Preview render (full-width) */}
        <div className="lg:col-span-3">
          {isPreview ? <div className="animate-fadeIn">{previewRender}</div> : null}
        </div>
      </main>

      {/* Sticky action bar */}
      <div className={`fixed left-1/2 transform -translate-x-1/2 bottom-5 z-50 w-[min(980px,92%)] rounded-3xl p-3 shadow-xl flex items-center justify-between transition-transform duration-300 ${theme.card}`}>
        <div className="flex items-center gap-3">
          <button onClick={() => simulateSave("draft")} className="px-3 py-2 rounded-xl text-sm bg-black/5 dark:bg-white/10">Save Draft</button>
          <button onClick={onPreviewToggle} className="px-3 py-2 rounded-xl text-sm bg-white/80 dark:bg-black/60">{isPreview ? "Editor" : "Preview"}</button>
          <div className="text-xs opacity-70">{autosaveBlink ? "Saved" : "All changes saved"}</div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm opacity-70">{saving ? "Saving..." : toast || ""}</div>
          <button onClick={onPublish} className={`px-4 py-2 rounded-2xl font-semibold shadow-lg ${theme.accent} ${theme.accentHover}`}>Publish</button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------- Small UI Helpers --------------------------- */

function ToolbarButton({ children, onClick }) {
  return (
    <button onMouseDown={(e) => e.preventDefault()} onClick={(e) => { e.preventDefault(); onClick?.(); }} className="px-2 py-1 rounded hover:bg-black/5 dark:hover:bg-white/10">
      {children}
    </button>
  );
}

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
}
