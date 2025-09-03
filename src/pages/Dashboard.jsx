// Dashboard.jsx
import React, { useMemo, useState } from "react";

/**
 * Dashboard.jsx — Inkwell (Blogging Platform)
 * TailwindCSS-based, responsive dashboard for managing published posts and drafts.
 *
 * Props:
 *  - posts: Array<{
 *      id: string | number,
 *      title: string,
 *      coverImage?: string | null,
 *      status: "published" | "draft",
 *      publishedAt?: string | Date | null,
 *      updatedAt?: string | Date | null,
 *      likes?: number,
 *      commentsCount?: number
 *    }>
 *  - onCreateNew?: () => void
 *  - onEdit?: (id) => void
 *  - onDelete?: (id) => void
 *  - onPublish?: (id) => void
 *  - onView?: (id) => void
 *
 * Dark mode: ensure a parent element (e.g., <html>) has className "dark"
 */

const formatDate = (d) => {
  if (!d) return "—";
  const date = typeof d === "string" || typeof d === "number" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
};

const cx = (...classes) => classes.filter(Boolean).join(" ");

export default function Dashboard({
  posts = [],
  onCreateNew = () => {},
  onEdit = () => {},
  onDelete = () => {},
  onPublish = () => {},
  onView = () => {},
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("Published"); // "Published" | "Drafts"
  const [sort, setSort] = useState("Latest"); // "Latest" | "Most Liked" | "Most Commented"

  // Theme tokens (Inkwell palette)
  const theme = {
    bg: "bg-[#F9F5F6] dark:bg-[#495C83]",
    text: "text-black dark:text-white",
    card: "bg-[#F8E8EE] dark:bg-[#7A86B6]",
    accent: "bg-[#F2BED1] dark:bg-[#C8B6E2]",
    hover: "hover:bg-[#FDCEDF] dark:hover:bg-[#A8A4CE]",
    ring: "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F2BED1] dark:focus:ring-[#C8B6E2] focus:ring-offset-transparent",
    subtleText: "text-black/70 dark:text-white/80",
    badge: "bg-black/10 dark:bg-white/20",
  };

  const totals = useMemo(() => {
    const published = posts.filter((p) => p.status === "published");
    const drafts = posts.filter((p) => p.status === "draft");
    const totalLikes = published.reduce((s, p) => s + (p.likes || 0), 0);
    return {
      totalPublished: published.length,
      totalDrafts: drafts.length,
      totalLikes,
    };
  }, [posts]);

  const normalized = useMemo(() => {
    const q = query.trim().toLowerCase();

    const byFilter = posts.filter((p) => {
      if (!q) return filter === "Published" ? p.status === "published" : p.status === "draft";
      const inTitle = p.title?.toLowerCase().includes(q);
      const matchesFilter = filter === "Published" ? p.status === "published" : p.status === "draft";
      return matchesFilter && inTitle;
    });

    const sortValue = (p) => {
      if (sort === "Most Liked") return -(p.likes || 0);
      if (sort === "Most Commented") return -(p.commentsCount || 0);
      // Latest
      const date = p.status === "published" ? p.publishedAt : p.updatedAt;
      return -(date ? new Date(date).getTime() : 0);
    };

    const published = byFilter
      .filter((p) => p.status === "published")
      .sort((a, b) => sortValue(a) - sortValue(b));

    const drafts = byFilter
      .filter((p) => p.status === "draft")
      .sort((a, b) => sortValue(a) - sortValue(b));

    return { published, drafts };
  }, [posts, filter, sort, query]);

  // Empty states
  const showEmpty =
    (filter === "Published" && normalized.published.length === 0) ||
    (filter === "Drafts" && normalized.drafts.length === 0);

  return (
    <div className={cx(theme.bg, theme.text, "min-h-screen w-full transition-colors duration-300")}>
      {/* Header / Primary Actions */}
      <header className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Inkwell — Dashboard</h1>
          <p className={cx(theme.subtleText, "text-sm mt-1")}>
            Manage your published posts and drafts with search, filters, and quick stats.
          </p>
        </div>
        <button
          onClick={onCreateNew}
          className={cx(
            theme.accent,
            theme.hover,
            theme.ring,
            "text-sm font-medium px-4 py-2 rounded-2xl shadow-sm transition-all duration-200 active:scale-[0.98]"
          )}
        >
          Create New Post
        </button>
      </header>

      {/* Quick Stats */}
      <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            theme={theme}
            label="Published Posts"
            value={totals.totalPublished}
            ariaLabel="Total published posts"
          />
          <StatCard theme={theme} label="Drafts" value={totals.totalDrafts} ariaLabel="Total drafts" />
          <StatCard
            theme={theme}
            label="Total Likes Received"
            value={totals.totalLikes}
            ariaLabel="Total likes received"
          />
        </div>
      </section>

      {/* Controls */}
      <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 mt-6">
        <div className={cx(theme.card, "rounded-2xl p-4 shadow-sm")}>
          <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
            {/* Search */}
            <div className="flex-1">
              <label htmlFor="search" className="sr-only">
                Search posts
              </label>
              <input
                id="search"
                type="text"
                placeholder="Search by title…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className={cx(
                  "w-full rounded-xl px-3 py-2 bg-white/70 dark:bg-white/10",
                  theme.text,
                  theme.ring,
                  "placeholder-black/50 dark:placeholder-white/60"
                )}
              />
            </div>

            {/* Filter toggle */}
            <div role="tablist" aria-label="Filter posts" className="flex rounded-xl overflow-hidden">
              {["Published", "Drafts"].map((opt) => (
                <button
                  key={opt}
                  role="tab"
                  aria-selected={filter === opt}
                  onClick={() => setFilter(opt)}
                  className={cx(
                    "px-4 py-2 text-sm font-medium transition-all duration-200",
                    filter === opt
                      ? cx(theme.accent, theme.hover)
                      : "bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15"
                  )}
                >
                  {opt}
                </button>
              ))}
            </div>

            {/* Sort */}
            <div>
              <label htmlFor="sort" className="sr-only">
                Sort by
              </label>
              <select
                id="sort"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className={cx(
                  "rounded-xl px-3 py-2 bg-white/70 dark:bg-white/10",
                  theme.text,
                  theme.ring,
                  "text-sm"
                )}
              >
                <option>Latest</option>
                <option>Most Liked</option>
                <option>Most Commented</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Content Sections */}
      <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 my-8 space-y-10">
        {/* Published first */}
        {filter === "Published" && (
          <Section
            title="Published Posts"
            emptyLabel={showEmpty ? "No published posts found." : ""}
            theme={theme}
          >
            <CardsGrid>
              {normalized.published.map((p) => (
                <PublishedCard
                  key={p.id}
                  post={p}
                  theme={theme}
                  onEdit={() => onEdit(p.id)}
                  onDelete={() => onDelete(p.id)}
                  onView={() => onView(p.id)}
                />
              ))}
            </CardsGrid>
          </Section>
        )}

        {filter === "Drafts" && (
          <Section title="Drafts" emptyLabel={showEmpty ? "No drafts found." : ""} theme={theme}>
            <CardsGrid>
              {normalized.drafts.map((p) => (
                <DraftCard
                  key={p.id}
                  post={p}
                  theme={theme}
                  onEdit={() => onEdit(p.id)}
                  onDelete={() => onDelete(p.id)}
                  onPublish={() => onPublish(p.id)}
                />
              ))}
            </CardsGrid>
          </Section>
        )}
      </main>
    </div>
  );
}

/* --------------------------- UI Subcomponents --------------------------- */

function StatCard({ label, value, ariaLabel, theme }) {
  return (
    <div
      className={cx(
        theme.card,
        "rounded-2xl p-4 shadow-sm flex items-center justify-between"
      )}
      aria-label={ariaLabel}
    >
      <div className="space-y-1">
        <p className={cx(theme.subtleText, "text-sm")}>{label}</p>
        <p className="text-2xl font-semibold">{value}</p>
      </div>
      <span className={cx(theme.badge, "px-3 py-1 rounded-full text-xs")}>Inkwell</span>
    </div>
  );
}

function Section({ title, children, emptyLabel, theme }) {
  const isEmpty = React.Children.count(children?.props?.children ?? []) === 0;
  return (
    <section aria-label={title}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        <div className={cx(theme.subtleText, "text-sm")}>
          {isEmpty && emptyLabel ? emptyLabel : null}
        </div>
      </div>
      {isEmpty ? (
        <div className={cx(theme.card, "rounded-2xl p-6 text-center")}>
          <p className={cx(theme.subtleText, "text-sm")}>
            {emptyLabel || "Nothing to show here yet."}
          </p>
        </div>
      ) : (
        children
      )}
    </section>
  );
}

function CardsGrid({ children }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">{children}</div>
  );
}

function PublishedCard({ post, theme, onEdit, onDelete, onView }) {
  return (
    <article
      className={cx(
        theme.card,
        "rounded-2xl overflow-hidden shadow-sm group transition-all duration-200 hover:shadow-md"
      )}
    >
      {post.coverImage ? (
        <div className="relative h-40 w-full overflow-hidden">
          <img
            src={post.coverImage}
            alt={post.title || "Blog cover"}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            loading="lazy"
          />
        </div>
      ) : (
        <div className="h-40 w-full flex items-center justify-center bg-black/5 dark:bg-white/10">
          <span className={cx(theme.subtleText, "text-sm")}>No cover image</span>
        </div>
      )}

      <div className="p-4 space-y-3">
        <h3 className="font-semibold line-clamp-2">{post.title || "Untitled Post"}</h3>
        <div className={cx(theme.subtleText, "text-xs flex items-center gap-3")}>
          <span>Published {formatDate(post.publishedAt)}</span>
          <span className="inline-flex items-center gap-1">
            <Dot /> {post.likes ?? 0} likes
          </span>
          <span className="inline-flex items-center gap-1">
            <Dot /> {post.commentsCount ?? 0} comments
          </span>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <ActionButton theme={theme} onClick={onEdit} label="Edit" />
            <ActionButton theme={theme} onClick={onDelete} label="Delete" variant="danger" />
          </div>
          <ActionButton theme={theme} onClick={onView} label="View Blog" variant="primary" />
        </div>
      </div>
    </article>
  );
}

function DraftCard({ post, theme, onEdit, onDelete, onPublish }) {
  return (
    <article
      className={cx(
        theme.card,
        "rounded-2xl overflow-hidden shadow-sm group transition-all duration-200 hover:shadow-md"
      )}
    >
      <div className="p-4 space-y-3">
        <h3 className="font-semibold line-clamp-2">{post.title || "Untitled Draft"}</h3>
        <div className={cx(theme.subtleText, "text-xs flex items-center gap-3")}>
          <span>Last edited {formatDate(post.updatedAt)}</span>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <ActionButton theme={theme} onClick={onEdit} label="Edit" />
            <ActionButton theme={theme} onClick={onDelete} label="Delete" variant="danger" />
          </div>
          <ActionButton theme={theme} onClick={onPublish} label="Publish" variant="primary" />
        </div>
      </div>
    </article>
  );
}

function ActionButton({ label, onClick, theme, variant = "default" }) {
  const base =
    "px-3 py-1.5 rounded-xl text-sm font-medium transition-all duration-200 active:scale-[0.98]";

  const variants = {
    default: "bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15",
    primary: cx(theme.accent, theme.hover),
    danger: "bg-red-200 dark:bg-red-400/30 hover:bg-red-300 dark:hover:bg-red-400/40",
  };

  return (
    <button onClick={onClick} className={cx(base, variants[variant], theme.ring)}>
      {label}
    </button>
  );
}

function Dot() {
  return <span aria-hidden className="inline-block w-1.5 h-1.5 rounded-full bg-current opacity-60" />;
}
