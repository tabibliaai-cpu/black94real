'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/stores/app'
import { fetchChats, sendMessage, fetchMessages } from '@/lib/db'
import { PAvatar } from '@/components/PAvatar'
import type { Chat, Message } from '@/lib/db'
import { toast } from 'sonner'

function timeAgo(dateStr?: string): string {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'now'
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatTime(dateStr?: string): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

/* ── Chat List ───────────────────────────────────────────────────────── */

export function ChatListView() {
  const user = useAppStore((s) => s.user)
  const navigate = useAppStore((s) => s.navigate)
  const [chats, setChats] = useState<Chat[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    fetchChats(user.id)
      .then(setChats)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [user])

  return (
    <div>
      <div className="px-4 pt-3 pb-2 flex items-center justify-between">
        <h2 className="text-xl font-bold text-[#e8f0dc]">Messages</h2>
      </div>

      {loading ? (
        <div className="space-y-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3 animate-pulse">
              <div className="w-12 h-12 rounded-full bg-white/[0.06]" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-28 rounded bg-white/[0.06]" />
                <div className="h-3 w-40 rounded bg-white/[0.06]" />
              </div>
            </div>
          ))}
        </div>
      ) : chats.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
          <div className="w-16 h-16 rounded-full bg-white/[0.04] flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-[#71767b]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h3 className="text-lg font-bold text-[#e8f0dc] mb-1">No messages yet</h3>
          <p className="text-[15px] text-[#71767b]">Start a conversation to see messages here.</p>
        </div>
      ) : (
        <div>
          {chats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => navigate('chat-room', { chatId: chat.id })}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.04] transition-colors"
            >
              <div className="relative shrink-0">
                <PAvatar
                  src={chat.otherUser?.profileImage}
                  name={chat.otherUser?.displayName}
                  size={48}
                />
                {chat.unreadCount > 0 && (
                  <div className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-[#a3d977] flex items-center justify-center">
                    <span className="text-[10px] font-bold text-black">{chat.unreadCount}</span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0 border-b border-white/[0.06] pb-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[15px] text-[#e8f0dc] truncate">
                    {chat.otherUser?.displayName || 'User'}
                  </span>
                  <span className="text-[13px] text-[#71767b] shrink-0 ml-2">
                    {timeAgo(chat.lastMessage?.createdAt)}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <p className={cn('text-[14px] truncate', chat.unreadCount > 0 ? 'text-[#e8f0dc] font-semibold' : 'text-[#71767b]')}>
                    {chat.lastMessage?.content || 'No messages yet'}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Chat Room ───────────────────────────────────────────────────────── */

export function ChatRoomView() {
  const user = useAppStore((s) => s.user)
  const viewParams = useAppStore((s) => s.viewParams)
  const navigate = useAppStore((s) => s.navigate)
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const chatId = viewParams?.chatId
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!chatId) return
    setLoading(true)
    fetchMessages(chatId, 50)
      .then(setMessages)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [chatId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Resolve other user's ID and profile from the chat document
  const [otherId, setOtherId] = useState<string | null>(null)
  const [otherUser, setOtherUser] = useState<{ displayName: string; profileImage: string; username: string } | null>(null)
  const [chatLoading, setChatLoading] = useState(false)

  useEffect(() => {
    if (!chatId || !user) return
    setChatLoading(true)
    import('firebase/firestore').then(({ getDoc, doc: docFn }) => {
      import('@/lib/firebase').then(({ db }) => {
        getDoc(docFn(db, 'chats', chatId)).then(async snap => {
          if (snap.exists()) {
            const data = snap.data()!
            const resolvedOtherId = data.user1Id === user.id ? data.user2Id : data.user1Id
            setOtherId(resolvedOtherId)
            // Fetch other user's profile
            try {
              const { getUser } = await import('@/lib/db')
              const otherProfile = await getUser(resolvedOtherId)
              if (otherProfile) {
                setOtherUser({
                  displayName: otherProfile.displayName,
                  profileImage: otherProfile.profileImage,
                  username: otherProfile.username,
                })
              }
            } catch (e) {
              console.error('Failed to fetch other user:', e)
            }
          }
          setChatLoading(false)
        }).catch(() => setChatLoading(false))
      })
    })
  }, [chatId, user])

  const handleSend = useCallback(async () => {
    if (!text.trim() || !user || !chatId || sending || !otherId) return
    setSending(true)
    try {
      const msg = await sendMessage(chatId, user.id, otherId, text.trim())
      setMessages((prev) => [...prev, msg])
      setText('')
    } catch (err) {
      console.error('Send failed:', err)
    } finally {
      setSending(false)
    }
  }, [text, user, chatId, sending, otherId])

  return (
    <div className="flex flex-col h-[calc(100vh-90px)]">
      {/* Header */}
      <div className="flex items-center gap-3 px-3 py-2.5 border-b border-white/[0.06] bg-black/90 backdrop-blur-xl shrink-0">
        <button
          onClick={() => navigate('chat')}
          className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/[0.08] transition-colors"
        >
          <svg className="w-5 h-5 text-[#e8f0dc]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        {chatLoading ? (
          <div className="flex items-center gap-3 flex-1">
            <div className="w-9 h-9 rounded-full bg-white/[0.06] animate-pulse" />
            <div className="h-4 w-28 rounded bg-white/[0.06] animate-pulse" />
          </div>
        ) : otherUser ? (
          <>
            <PAvatar src={otherUser.profileImage} name={otherUser.displayName} size={36} />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-[15px] text-[#e8f0dc] truncate">{otherUser.displayName}</p>
              <p className="text-[12px] text-[#71767b] truncate">@{otherUser.username}</p>
            </div>
          </>
        ) : (
          <div className="flex-1">
            <p className="font-bold text-[15px] text-[#e8f0dc]">Chat</p>
          </div>
        )}
        <button
          onClick={() => navigate('audio-call', { chatName: otherUser?.displayName || 'User' })}
          className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/[0.08] transition-colors"
          aria-label="Audio call"
        >
          <svg className="w-5 h-5 text-[#e8f0dc]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
          </svg>
        </button>
        <button
          onClick={() => toast.info('Video call coming soon!')}
          className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/[0.08] transition-colors"
          aria-label="Video call"
        >
          <svg className="w-5 h-5 text-[#e8f0dc]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <polygon points="23 7 16 12 23 17 23 7" />
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-5 h-5 border-2 border-[#a3d977]/30 border-t-[#a3d977] rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-[15px] text-[#71767b]">No messages yet. Say hello!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = msg.senderId === user?.id
            return (
              <div key={msg.id} className={cn('flex', isMine ? 'justify-end' : 'justify-start')}>
                <div
                  className={cn(
                    'max-w-[75%] px-4 py-2.5 rounded-2xl text-[15px] leading-relaxed',
                    isMine ? 'bg-[#a3d977] text-black rounded-br-md' : 'bg-white/[0.08] text-[#e8f0dc] rounded-bl-md'
                  )}
                >
                  <p>{msg.content}</p>
                  <p className={cn('text-[11px] mt-1', isMine ? 'text-black/50' : 'text-[#71767b]')}>
                    {formatTime(msg.createdAt)}
                  </p>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div className="sticky bottom-0 border-t border-white/[0.06] bg-black px-4 py-3 safe-area-bottom">
        <div className="flex items-end gap-3">
          <div className="flex-1 bg-white/[0.06] rounded-2xl border border-white/[0.08] focus-within:border-[#a3d977]/40 transition-colors px-4 py-2.5">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Start a message"
              className="w-full bg-transparent text-[15px] text-[#e8f0dc] placeholder-[#536471] outline-none"
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!text.trim() || sending || !otherId || chatLoading}
            className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center transition-colors shrink-0',
              text.trim() && !sending && otherId
                ? 'bg-[#a3d977] text-black hover:bg-[#8cc65e]'
                : 'bg-white/[0.06] text-[#536471]'
            )}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
