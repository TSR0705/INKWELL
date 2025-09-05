import React from "react";
import { CheckCircle2, Twitter, Linkedin, Globe } from "lucide-react";

export default function ProfileCard({
  username,
  avatar,
  bio,
  followers,
  following,
  posts,
  isOwner = false,
  isFollowing = false,
  onFollowToggle,
  onEdit,
  onViewProfile,
  social = {},
  tags = [],
}) {
  const initials = username
    ? username
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "U";

  return (
    <div
      className="
        w-full max-w-md mx-auto rounded-2xl shadow-lg 
        bg-[#F9F5F6] dark:bg-[#495C83]
        text-black dark:text-white
        p-6 flex flex-col gap-5
        transition-all duration-300
        hover:shadow-xl hover:-translate-y-1
        hover:bg-[#F8E8EE] dark:hover:bg-[#7A86B6]
      "
    >
      {/* Top Section */}
      <div className="flex items-center gap-4">
        {avatar ? (
          <img
            src={avatar}
            alt={`${username} avatar`}
            className="w-16 h-16 rounded-full object-cover border-2 border-transparent 
            hover:border-[#F2BED1] dark:hover:border-[#C8B6E2] transition-all duration-300"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-[#F2BED1] dark:bg-[#C8B6E2] flex items-center justify-center font-bold text-xl">
            {initials}
          </div>
        )}

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <a
              href={`/profile/${username}`}
              className="font-semibold text-lg hover:text-[#F2BED1] dark:hover:text-[#C8B6E2] transition"
            >
              {username}
            </a>
            <CheckCircle2
              size={18}
              className="text-[#6BA4FF]"
              title="Verified"
            />
          </div>
          <p className="text-sm opacity-80 line-clamp-2">{bio}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 text-center gap-2">
        <Stat label="Posts" value={posts} />
        <Stat label="Followers" value={followers} />
        <Stat label="Following" value={following} />
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag, i) => (
            <span
              key={i}
              className="px-3 py-1 text-xs rounded-full 
              bg-[#F2BED1]/70 dark:bg-[#C8B6E2]/70 
              text-black dark:text-white font-medium"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Social Links */}
      <div className="flex gap-4">
        {social.twitter && (
          <a
            href={social.twitter}
            target="_blank"
            rel="noreferrer"
            className="hover:text-[#1DA1F2] transition"
            title="Twitter"
          >
            <Twitter size={20} />
          </a>
        )}
        {social.linkedin && (
          <a
            href={social.linkedin}
            target="_blank"
            rel="noreferrer"
            className="hover:text-[#0A66C2] transition"
            title="LinkedIn"
          >
            <Linkedin size={20} />
          </a>
        )}
        {social.website && (
          <a
            href={social.website}
            target="_blank"
            rel="noreferrer"
            className="hover:text-[#16A34A] transition"
            title="Website"
          >
            <Globe size={20} />
          </a>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 mt-2">
        {isOwner ? (
          <button
            onClick={onEdit}
            className="flex-1 px-4 py-2 rounded-lg bg-[#F2BED1] dark:bg-[#C8B6E2] text-black dark:text-[#1e1e1e] hover:bg-[#FDCEDF] dark:hover:bg-[#A8A4CE] transition font-medium"
          >
            Edit Profile
          </button>
        ) : (
          <button
            onClick={onFollowToggle}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition 
              ${
                isFollowing
                  ? "bg-gray-200 dark:bg-gray-600 hover:opacity-80"
                  : "bg-[#F2BED1] dark:bg-[#C8B6E2] hover:bg-[#FDCEDF] dark:hover:bg-[#A8A4CE]"
              }`}
          >
            {isFollowing ? "Unfollow" : "Follow"}
          </button>
        )}
        <button
          onClick={onViewProfile}
          className="flex-1 px-4 py-2 rounded-lg border border-[#F2BED1] dark:border-[#C8B6E2] hover:bg-[#FDCEDF] dark:hover:bg-[#A8A4CE] transition font-medium"
        >
          View Profile
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="flex flex-col items-center">
      <span className="font-bold text-lg">{value}</span>
      <span className="text-xs opacity-75">{label}</span>
    </div>
  );
}
