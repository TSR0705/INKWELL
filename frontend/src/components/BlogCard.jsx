import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Heart, MessageCircle, Eye, Bookmark, Share2 } from "lucide-react";
import Confetti from "react-confetti";

const BlogCard = ({
  id,
  title,
  excerpt,
  coverImage,
  authorName,
  authorAvatar,
  likes,
  comments,
  views,
  tags = [],
  isBookmarked = false,
  onLike,
  onBookmark,
  onShare,
  onNavigate,
}) => {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(likes || 0);
  const [bookmarked, setBookmarked] = useState(isBookmarked);
  const [confetti, setConfetti] = useState(false);

  // Animate stats (count up effect)
  const [displayLikes, setDisplayLikes] = useState(0);
  const [displayViews, setDisplayViews] = useState(0);

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      if (i < likeCount) {
        i++;
        setDisplayLikes(i);
      } else clearInterval(interval);
    }, 30);

    let j = 0;
    const interval2 = setInterval(() => {
      if (j < views) {
        j++;
        setDisplayViews(j);
      } else clearInterval(interval2);
    }, 20);

    return () => {
      clearInterval(interval);
      clearInterval(interval2);
    };
  }, [likeCount, views]);

  const handleLike = () => {
    setLiked(!liked);
    setLikeCount(likeCount + (liked ? -1 : 1));
    if (!liked) {
      setConfetti(true);
      setTimeout(() => setConfetti(false), 1200);
    }
    if (onLike) onLike(id, !liked);
  };

  const handleBookmark = () => {
    setBookmarked(!bookmarked);
    if (onBookmark) onBookmark(id, !bookmarked);
  };

  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02, rotateX: 1, rotateY: 1 }}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative w-full max-w-md rounded-2xl overflow-hidden backdrop-blur-xl 
                 bg-white/40 dark:bg-black/30 border border-white/20 dark:border-purple-400/20 
                 shadow-lg hover:shadow-2xl hover:border-pink-400/50 group cursor-pointer"
    >
      {/* Confetti on Like */}
      {confetti && <Confetti numberOfPieces={80} recycle={false} />}

      {/* Cover Media */}
      <motion.div
        className="relative w-full h-56 overflow-hidden"
        whileHover={{ scale: 1.05 }}
        transition={{ duration: 0.4 }}
        onClick={() => onNavigate && onNavigate(id)}
      >
        {coverImage ? (
          <img
            src={coverImage}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center 
                          bg-gradient-to-r from-pink-300 to-purple-300 dark:from-purple-600 dark:to-pink-600 
                          text-white text-lg font-semibold">
            No Media
          </div>
        )}
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent"></div>
      </motion.div>

      {/* Content */}
      <div className="p-5 space-y-3">
        {/* Title */}
        <h2
          className="text-xl font-bold bg-gradient-to-r from-pink-400 via-purple-500 to-indigo-400 
                     bg-clip-text text-transparent hover:animate-pulse cursor-pointer"
          onClick={() => onNavigate && onNavigate(id)}
        >
          {title}
        </h2>

        {/* Excerpt */}
        <p className="text-gray-700 dark:text-gray-300 line-clamp-3 relative">
          {excerpt?.slice(0, 150)}...
          <span className="absolute bottom-0 right-0 bg-gradient-to-l 
                           from-white dark:from-black h-full w-16"></span>
        </p>

        {/* Author */}
        <div className="flex items-center gap-3 mt-3">
          <motion.img
            whileHover={{ scale: 1.1, rotate: 6 }}
            src={authorAvatar}
            alt={authorName}
            className="w-9 h-9 rounded-full ring-2 ring-pink-400 hover:ring-purple-400 transition-all cursor-pointer"
          />
          <span className="text-sm font-medium hover:text-pink-500 cursor-pointer">
            {authorName}
          </span>
        </div>

        {/* Stats */}
        <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400 mt-3">
          <div className="flex items-center gap-5">
            <button
              onClick={handleLike}
              className="flex items-center gap-1 hover:text-red-500 transition-all"
            >
              <Heart
                size={20}
                className={`transition-transform ${
                  liked ? "fill-red-500 text-red-500 scale-110" : ""
                }`}
              />
              <motion.span
                key={displayLikes}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {displayLikes}
              </motion.span>
            </button>

            <div className="flex items-center gap-1 hover:text-blue-500 transition-all">
              <MessageCircle size={20} />
              <span>{comments}</span>
            </div>

            <div className="flex items-center gap-1 hover:text-green-500 transition-all">
              <Eye size={20} />
              <span>{displayViews}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={handleBookmark}
              className="hover:scale-110 transition-transform"
            >
              <Bookmark
                size={20}
                className={`${bookmarked ? "fill-yellow-400 text-yellow-400" : ""}`}
              />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={() => onShare && onShare(id)}
              className="hover:scale-110 transition-transform"
            >
              <Share2 size={20} />
            </motion.button>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mt-3">
          {tags.map((tag, i) => (
            <motion.span
              whileHover={{ scale: 1.1 }}
              key={i}
              className="px-3 py-1 rounded-full text-xs 
                         bg-gradient-to-r from-pink-400 to-purple-500 
                         text-white shadow-md hover:shadow-lg cursor-pointer"
            >
              #{tag}
            </motion.span>
          ))}
        </div>

        {/* Read More */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          className="mt-4 px-4 py-2 w-full rounded-lg 
                     bg-gradient-to-r from-pink-400 to-purple-500 text-white 
                     font-semibold shadow-md hover:shadow-xl hover:from-purple-500 hover:to-pink-400 transition-all"
          onClick={() => onNavigate && onNavigate(id)}
        >
          Read More →
        </motion.button>
      </div>
    </motion.div>
  );
};

export default BlogCard;
