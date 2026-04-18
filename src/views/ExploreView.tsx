'use client'

import { useState } from 'react'
import { useAppStore } from '@/stores/app'

const CATEGORIES = [
  { id: 'trending', label: 'Trending', icon: '🔥' },
  { id: 'tech', label: 'Technology', icon: '💻' },
  { id: 'music', label: 'Music', icon: '🎵' },
  { id: 'sports', label: 'Sports', icon: '⚽' },
  { id: 'news', label: 'News', icon: '📰' },
  { id: 'entertainment', label: 'Entertainment', icon: '🎬' },
]

const TRENDING_TOPICS = [
  { tag: 'Black94Launch', posts: '24.5K', category: 'Technology' },
  { tag: 'AIRevolution', posts: '156K', category: 'Trending' },
  { tag: 'React19', posts: '8.2K', category: 'Technology' },
  { tag: 'WorldCup', posts: '342K', category: 'Sports' },
  { tag: 'NewAlbum', posts: '45.1K', category: 'Music' },
  { tag: 'ClimateSummit', posts: '89K', category: 'News' },
  { tag: 'OscarNoms', posts: '201K', category: 'Entertainment' },
  { tag: 'SpaceX', posts: '67K', category: 'Technology' },
]

const SUGGESTED_USERS = [
  { id: '1', name: 'TechCrunch', username: 'techcrunch', verified: true },
  { id: '2', name: 'The Verge', username: 'verge', verified: true },
  { id: '3', name: 'Wired', username: 'WIRED', verified: true },
  { id: '4', name: 'Design Daily', username: 'designdaily', verified: false },
]

export function ExploreView() {
  const navigate = useAppStore((s) => s.navigate)
  const [activeCategory, setActiveCategory] = useState('trending')
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <div>
      {/* Search bar */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-center gap-3 bg-white/[0.06] rounded-full px-4 py-2.5 border border-white/[0.08] focus-within:border-[#8b5cf6]/50 transition-all">
          <svg className="w-5 h-5 text-[#94a3b8] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Black94"
            className="flex-1 bg-transparent text-[15px] text-[#f0eef6] placeholder-[#64748b] outline-none"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="flex gap-2 px-4 pb-3 overflow-x-auto no-scrollbar">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-4 py-1.5 rounded-full text-[14px] font-medium whitespace-nowrap transition-colors ${
              activeCategory === cat.id
                ? 'bg-[#f0eef6] text-black'
                : 'bg-white/[0.06] text-[#f0eef6] hover:bg-white/[0.1]'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Trending */}
      <div className="border-t border-b border-white/[0.06]">
        <div className="flex items-center justify-between px-4 py-2">
          <h3 className="text-xl font-bold text-[#f0eef6]">Trends for you</h3>
        </div>
        {TRENDING_TOPICS.map((topic, i) => (
          <button
            key={i}
            className="w-full text-left px-4 py-3 hover:bg-white/[0.04] transition-colors"
            onClick={() => navigate('search')}
          >
            <p className="text-[13px] text-[#94a3b8]">{topic.category}</p>
            <p className="font-bold text-[15px] text-[#f0eef6] mt-0.5">#{topic.tag}</p>
            <p className="text-[13px] text-[#94a3b8] mt-0.5">{topic.posts} posts</p>
          </button>
        ))}
      </div>

      {/* Suggested users */}
      <div className="px-4 py-4">
        <h3 className="text-lg font-bold text-[#f0eef6] mb-3">Who to follow</h3>
        {SUGGESTED_USERS.map((u) => (
          <div key={u.id} className="flex items-center gap-3 py-2.5">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1a2a1a] to-[#110f1a] flex items-center justify-center text-[14px] text-[#8b5cf6] font-bold">
              {u.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <span className="font-bold text-[15px] text-[#f0eef6]">{u.name}</span>
                {u.verified && (
                  <svg className="w-[16px] h-[16px] text-[#8b5cf6]" viewBox="0 0 22 22" fill="none">
                    <path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.853-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.69-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.636.433 1.221.878 1.69.47.446 1.055.752 1.69.883.635.13 1.294.083 1.902-.143.271.586.702 1.084 1.24 1.438.54.354 1.167.551 1.813.568.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.225 1.261.275 1.894.144.634-.13 1.219-.435 1.69-.882.445-.47.749-1.055.878-1.691.13-.634.084-1.292-.139-1.899.586-.272 1.084-.701 1.438-1.24.354-.542.551-1.172.57-1.82z" fill="#8b5cf6"/>
                    <path d="M9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z" fill="#000"/>
                  </svg>
                )}
              </div>
              <span className="text-[14px] text-[#94a3b8]">@{u.username}</span>
            </div>
            <button className="px-4 py-1.5 rounded-full bg-[#f0eef6] text-black text-[14px] font-bold hover:bg-gray-200 transition-colors">
              Follow
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
