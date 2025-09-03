// src/components/BlogCard.jsx
export default function BlogCard({ blog }) {
  return (
    <div className="rounded-2xl shadow-md overflow-hidden bg-lightCard dark:bg-darkCard hover:shadow-lg transition">
      {/* Blog Cover */}
      <img
        src={blog.cover}
        alt={blog.title}
        className="w-full h-40 object-cover"
      />

      {/* Blog Content */}
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-2">{blog.title}</h3>
        <p className="text-sm mb-3">{blog.preview}</p>

        {/* Author + Date */}
        <div className="flex justify-between items-center text-xs text-gray-600 dark:text-gray-300">
          <span>{blog.author}</span>
          <span>{new Date(blog.date).toLocaleDateString()}</span>
        </div>

        {/* Likes + Comments */}
        <div className="flex justify-between items-center mt-3 text-sm">
          <span>❤️ {blog.likes}</span>
          <span>💬 {blog.comments}</span>
        </div>
      </div>
    </div>
  );
}
