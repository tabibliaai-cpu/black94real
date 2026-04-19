'use client'

import { useState } from 'react'
import { useAppStore } from '@/stores/app'
import { PAvatar } from '@/components/PAvatar'

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
            <PAvatar name={u.name} size={40} verified={u.verified} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <span className="font-bold text-[15px] text-[#f0eef6]">{u.name}</span>
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
