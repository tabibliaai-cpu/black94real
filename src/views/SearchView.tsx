'use client'

import { useState, useEffect, useRef } from 'react'
import { useAppStore } from '@/stores/app'
import { searchUsers, searchPosts } from '@/lib/db'
import { PAvatar } from '@/components/PAvatar'
import type { Black94User } from '@/lib/db'

export function SearchView() {
  const navigate = useAppStore((s) => s.navigate)
  const [query, setQuery] = useState('')
  const [users, setUsers] = useState<Black94User[]>([])
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [tab, setTab] = useState<'people' | 'posts'>('people')
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return
    setLoading(true)
    setSearched(true)
    try {
      // Always search users first
      const u = await searchUsers(searchQuery.trim(), 10)
      setUsers(u)
    } catch (err) {
      console.error('User search failed:', err)
      setUsers([])
    }

    // Search posts separately so it doesn't block user results
    try {
      const p = await searchPosts(searchQuery.trim(), 10)
      setPosts(p)
    } catch (err) {
      console.error('Post search failed (missing composite index):', err)
      setPosts([])
    } finally {
      setLoading(false)
    }
  }

  // Debounce auto-search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!query.trim()) {
      setSearched(false)
      setUsers([])
      setPosts([])
      return
    }
    debounceRef.current = setTimeout(() => {
      handleSearch(query)
    }, 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  const trendingTopics = [
    { tag: 'Black94', category: 'Technology', count: '2.4K' },
    { tag: 'SocialMedia', category: 'Trending', count: '12.1K' },
    { tag: 'WebDevelopment', category: 'Technology', count: '5.8K' },
    { tag: 'UIDesign', category: 'Design', count: '3.2K' },
    { tag: 'AI', category: 'Technology', count: '45.7K' },
  ]

  return (
    <div className="px-4 pt-2">
      {/* Search bar */}
      <div className="sticky top-0 z-10 bg-[#09080f] pt-2 pb-3 -mx-4 px-4">
        <div className="flex items-center gap-3 bg-white/[0.06] rounded-full px-4 py-2.5 border border-white/[0.08] focus-within:border-[#8b5cf6]/50 focus-within:bg-white/[0.08] transition-all">
          <svg className="w-5 h-5 text-[#94a3b8] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search"
            className="flex-1 bg-transparent text-[15px] text-[#f0eef6] placeholder-[#64748b] outline-none"
          />
          <button
            onClick={() => handleSearch(query)}
            disabled={loading || !query.trim()}
            className="text-[#8b5cf6] hover:text-[#c4e899] transition-colors disabled:text-[#64748b] disabled:pointer-events-none shrink-0"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* Search results or trending */}
      {searched ? (
        <div>
          {/* Tabs */}
          <div className="flex border-b border-white/[0.06] mb-4">
            {(['people', 'posts'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-3 text-[15px] font-medium relative capitalize transition-colors ${
                  tab === t ? 'text-[#f0eef6] font-bold' : 'text-[#94a3b8]'
                }`}
              >
                {t}
                {tab === t && (
                  <div className="absolute bottom-0 inset-x-6 h-1 bg-[#8b5cf6] rounded-full" />
                )}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="py-8 text-center text-[#94a3b8]">Searching...</div>
          ) : tab === 'people' ? (
            <div>
              {users.length === 0 ? (
                <p className="text-[15px] text-[#94a3b8] text-center py-8">No users found</p>
              ) : (
                users.map((u) => (
                  <button
                    key={u.uid}
                    onClick={() => navigate('user-profile', { userId: u.uid })}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.04] transition-colors rounded-xl"
                  >
                    <PAvatar src={u.profileImage} name={u.displayName} size={44} verified={u.isVerified} />
                    <div className="text-left min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-[15px] text-[#f0eef6] truncate">{u.displayName}</span>
                        {u.isVerified && (
                          <svg className="w-[16px] h-[16px] text-[#8b5cf6] shrink-0" viewBox="0 0 22 22" fill="none">
                            <path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.853-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.69-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.636.433 1.221.878 1.69.47.446 1.055.752 1.69.883.635.13 1.294.083 1.902-.143.271.586.702 1.084 1.24 1.438.54.354 1.167.551 1.813.568.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.225 1.261.275 1.894.144.634-.13 1.219-.435 1.69-.882.445-.47.749-1.055.878-1.691.13-.634.084-1.292-.139-1.899.586-.272 1.084-.701 1.438-1.24.354-.542.551-1.172.57-1.82z" fill="#8b5cf6"/>
                            <path d="M9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z" fill="#000"/>
                          </svg>
                        )}
                      </div>
                      <span className="text-[14px] text-[#94a3b8] truncate">@{u.username}</span>
                      {u.bio && <p className="text-[13px] text-[#94a3b8] truncate mt-0.5">{u.bio}</p>}
                    </div>
                  </button>
                ))
              )}
            </div>
          ) : (
            <div>
              {posts.length === 0 ? (
                <p className="text-[15px] text-[#94a3b8] text-center py-8">No posts found</p>
              ) : (
                posts.map((p) => (
                  <div key={p.id} className="px-4 py-3 border-b border-white/[0.06]">
                    <p className="text-[15px] text-[#f0eef6] leading-relaxed">{p.caption}</p>
                    <p className="text-[13px] text-[#94a3b8] mt-1">by @{p.authorUsername}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      ) : (
        /* Trending */
        <div>
          <h3 className="text-xl font-bold text-[#f0eef6] mb-4">Trends for you</h3>
          {trendingTopics.map((topic, i) => (
            <button
              key={i}
              className="w-full text-left px-4 py-3 hover:bg-white/[0.04] transition-colors rounded-xl"
              onClick={() => { setQuery(topic.tag); }}
            >
              <p className="text-[13px] text-[#94a3b8]">{topic.category}</p>
              <p className="font-bold text-[15px] text-[#f0eef6] mt-0.5">#{topic.tag}</p>
              <p className="text-[13px] text-[#94a3b8] mt-0.5">{topic.count} posts</p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
