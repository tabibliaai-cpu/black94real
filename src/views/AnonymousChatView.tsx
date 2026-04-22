'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { cn } from '@/lib/utils'
import { useAnonChat, type AnonMessage } from '@/stores/anonymousChat'
import { useAppStore } from '@/stores/app'
import { XChatInputBar } from '@/components/XChatInputBar'

/* ── ICEBREAKERS ───────────────────────────────────────────────────── */
const ICEBREAKERS = [
  "What's a secret you've never told anyone?",
  "If you could teleport anywhere right now...",
  "What's the most spontaneous thing you've done?",
  "What would you do if you won the lottery?",
  "Share something you've never told anyone",
  "Ask about their favorite hobby",
]

/* ── MASK ICON (incognito) ─────────────────────────────────────────── */
function MaskIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="currentColor" opacity="0.08" />
      <path d="M12 3C7.03 3 3 7.03 3 12c0 2.4.84 4.6 2.24 6.32L12 22l6.76-3.68C20.16 16.6 21 14.4 21 12c0-4.97-4.03-9-9-9z" fill="currentColor" opacity="0.15" />
      <path d="M8.5 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5z" fill="currentColor" />
      <path d="M15.5 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5z" fill="currentColor" />
      <path d="M12 15c-1.4 0-2.6-.55-3.35-1.38" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
    </svg>
  )
}

/* ── GHOST ICON ────────────────────────────────────────────────────── */
function GhostIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none">
      <ellipse cx="32" cy="26" rx="18" ry="20" fill="currentColor" opacity="0.9" />
      <path d="M14 40c0 0-4 8 2 16h32c6-8 2-16 2-16l-4 4-4-4-4 4-4-4-4 4-4-4-4 4z" fill="currentColor" opacity="0.9" />
      <circle cx="25" cy="22" r="3" fill="#000" />
      <circle cx="39" cy="22" r="3" fill="#000" />
      <circle cx="26" cy="21" r="1" fill="#fff" />
      <circle cx="40" cy="21" r="1" fill="#fff" />
      <ellipse cx="32" cy="30" rx="2" ry="1.5" fill="#000" opacity="0.5" />
    </svg>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   ANONYMOUS CHAT LOBBY — REDESIGNED
   ═══════════════════════════════════════════════════════════════════════════ */
function LobbyScreen() {
  const { startMatching, connectToStranger, room, myAlias } = useAnonChat()
  const { navigate } = useAppStore()
  const [started, setStarted] = useState(false)
  const [showIcebreaker, setShowIcebreaker] = useState(false)
  const icebreakerRef = useRef<ReturnType<typeof setTimeout>>()

  const handleStart = useCallback(() => {
    setStarted(true)
    startMatching()

    const delay = 2000 + Math.random() * 2000
    setTimeout(() => {
      const state = useAnonChat.getState()
      if (state.room?.status === 'matching') {
        const prefixes = ['Ghost', 'Shadow', 'Phantom', 'Echo', 'Mist', 'Wisp', 'Drift', 'Blip', 'Void', 'Haze']
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
        const num = Math.floor(Math.random() * 99) + 1
        const strangerAlias = `${prefix}_${num}`
        state.connectToStranger(strangerAlias)
      }
    }, delay)
  }, [startMatching, connectToStranger])

  useEffect(() => {
    if (room?.status === 'connected') {
      const t = setTimeout(() => navigate('anonymous-room'), 300)
      return () => clearTimeout(t)
    }
  }, [room?.status, navigate])

  useEffect(() => {
    if (started && room?.status === 'matching') {
      icebreakerRef.current = setTimeout(() => setShowIcebreaker(true), 3000)
      return () => clearTimeout(icebreakerRef.current)
    }
    setShowIcebreaker(false)
  }, [started, room?.status])

  return (
    <div className="min-h-full flex flex-col relative overflow-hidden bg-[#000000]">
      {/* Gradient mesh background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-[#D4A574]/[0.06] blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#1d9bf0]/[0.04] blur-[80px]" />
        <div className="absolute top-[40%] left-[50%] w-[40%] h-[40%] rounded-full bg-[#D4A574]/[0.03] blur-[60px] -translate-x-1/2" />
      </div>

      {/* Back button */}
      <div className="shrink-0 flex items-center px-4 pt-3 pb-1 relative z-10">
        <button
          onClick={() => navigate('feed')}
          className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/[0.06] active:bg-white/[0.1] transition-colors"
          style={{ minHeight: 0, minWidth: 0 }}
        >
          <svg className="w-[22px] h-[22px] text-[#e7e9ea]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 relative z-10">
        <div className="relative z-10 flex flex-col items-center text-center w-full max-w-[340px]">

          {/* Logo area */}
          <div className="relative mb-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#D4A574]/20 to-[#1d9bf0]/10 border border-[#D4A574]/15 flex items-center justify-center backdrop-blur-xl">
              <MaskIcon className={cn(
                'w-12 h-12 text-[#D4A574] transition-all duration-700',
                started ? 'scale-90 opacity-60' : 'scale-100 opacity-100'
              )} />
            </div>
            {started && (
              <div className="absolute -inset-2 rounded-3xl border border-[#D4A574]/20 animate-pulse-soft" />
            )}
          </div>

          {/* Title */}
          <h1 className="text-[26px] font-bold text-white mb-1.5 tracking-tight leading-tight">
            Anonymous Chat
          </h1>
          <p className="text-[15px] text-[#71767b] mb-6">
            Talk freely. Stay unknown.
          </p>

          {/* Identity badge */}
          {myAlias && (
            <div className="mb-8 inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08]">
              <div className="w-2 h-2 rounded-full bg-[#D4A574] animate-pulse-soft" />
              <span className="text-[13px] text-[#D4A574] font-mono tracking-wide">{myAlias}</span>
            </div>
          )}

          {/* Matching state */}
          {started && room?.status === 'matching' && (
            <div className="flex flex-col items-center gap-4 w-full animate-fade-in">
              <div className="flex items-center gap-2.5">
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#D4A574] animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-[#D4A574] animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-[#D4A574] animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-[14px] text-[#e7e9ea] font-medium">Finding someone...</span>
              </div>
              <div className="w-56 h-[3px] rounded-full bg-white/[0.06] overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#D4A574] to-[#1d9bf0] rounded-full animate-matching-progress" />
              </div>
              {showIcebreaker && (
                <div className="w-full px-4 py-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] animate-slide-up">
                  <p className="text-[11px] text-[#71767b] mb-1.5 font-semibold uppercase tracking-wider">Conversation starter</p>
                  <p className="text-[14px] text-[#e7e9ea] leading-snug">
                    {ICEBREAKERS[Math.floor(Math.random() * ICEBREAKERS.length)]}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Start button */}
          {!started && (
            <button
              onClick={handleStart}
              className="w-full mt-2 py-3.5 rounded-2xl bg-white text-black font-bold text-[15px] hover:bg-gray-100 active:scale-[0.98] transition-all duration-150"
              style={{ minHeight: 0 }}
            >
              Start a chat
            </button>
          )}

          {/* Feature cards */}
          {!started && (
            <div className="mt-8 w-full grid grid-cols-3 gap-2.5">
              {[
                { icon: (
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
                  </svg>
                ), label: 'Private' },
                { icon: (
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                  </svg>
                ), label: 'Live' },
                { icon: (
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                  </svg>
                ), label: 'Instant' },
              ].map((f) => (
                <div key={f.label} className="flex flex-col items-center gap-2 py-4 rounded-2xl bg-white/[0.03] border border-white/[0.05]">
                  <div className="text-[#71767b]">{f.icon}</div>
                  <span className="text-[12px] text-[#71767b] font-medium">{f.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   ANONYMOUS CHAT ROOM — FULL-SCREEN WITH PERFECT STICKY INPUT BAR
   ═══════════════════════════════════════════════════════════════════════════ */
function AnonChatRoom() {
  const {
    room, messages, strangerTyping, reconnecting,
    myAlias, myColor,
    sendMessage, skipToStranger, disconnect,
    setStrangerTyping, clearMessages,
  } = useAnonChat()
  const { navigate } = useAppStore()
  const [input, setInput] = useState('')
  const [showReactions, setShowReactions] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [showUploadMenu, setShowUploadMenu] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [sentReactions, setSentReactions] = useState<Set<string>>(new Set())
  const chatEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const isConnected = room?.status === 'connected'
  const isMatching = room?.status === 'matching'
  const isDisconnected = room?.status === 'disconnected' || room?.status === 'ended'

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, strangerTyping])

  useEffect(() => {
    if (isConnected) inputRef.current?.focus()
  }, [isConnected])

  useEffect(() => {
    if (!room) navigate('anonymous-chat')
  }, [room, navigate])

  const handleSend = useCallback(() => {
    if (!input.trim() || !isConnected) return
    sendMessage(input)
    setInput('')
  }, [input, isConnected, sendMessage])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }, [handleSend])

  const handleReaction = useCallback((emoji: string) => {
    if (!room) return
    const { addMessage } = useAnonChat.getState()
    addMessage({
      id: `react_${Date.now()}`,
      roomId: room.id,
      senderAlias: myAlias,
      content: emoji,
      isMine: true,
      timestamp: Date.now(),
      type: 'reaction',
    })
    setSentReactions((prev) => new Set(prev).add(emoji))
    setShowReactions(false)

    if (Math.random() > 0.4) {
      setTimeout(() => {
        const emojis = ['🔥', '😂', '💀', '❤️', '👏']
        const r = emojis[Math.floor(Math.random() * emojis.length)]
        addMessage({
          id: `react_${Date.now()}`,
          roomId: room.id,
          senderAlias: room.strangerAlias || 'Stranger',
          content: r,
          isMine: false,
          timestamp: Date.now(),
          type: 'reaction',
        })
      }, 800 + Math.random() * 1500)
    }
  }, [room, myAlias])

  const handleNewChat = useCallback(() => {
    const { startMatching, connectToStranger } = useAnonChat.getState()
    clearMessages()
    startMatching()
    setTimeout(() => {
      const state = useAnonChat.getState()
      if (state.room?.status === 'matching') {
        const prefixes = ['Ghost', 'Shadow', 'Phantom', 'Echo', 'Mist', 'Wisp', 'Drift', 'Blip', 'Void', 'Haze']
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
        const num = Math.floor(Math.random() * 99) + 1
        state.connectToStranger(`${prefix}_${num}`)
      }
    }, 1500 + Math.random() * 2000)
  }, [clearMessages])

  const handleBack = useCallback(() => {
    disconnect()
    navigate('anonymous-chat')
  }, [disconnect, navigate])

  /* ── Upload handlers ─────────────────────────────────────────────── */
  const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setSelectedImage(ev.target?.result as string)
    reader.readAsDataURL(file)
    setShowUploadMenu(false)
  }, [])

  const handleCameraCapture = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setSelectedImage(ev.target?.result as string)
    reader.readAsDataURL(file)
    setShowUploadMenu(false)
  }, [])

  const handleSendImage = useCallback(() => {
    if (!selectedImage || !isConnected || !room) return
    const { addMessage } = useAnonChat.getState()
    addMessage({
      id: `msg_${Date.now()}`,
      roomId: room.id,
      senderAlias: myAlias,
      content: selectedImage,
      isMine: true,
      timestamp: Date.now(),
      type: 'image',
    })
    setSelectedImage(null)
  }, [selectedImage, isConnected, room, myAlias])

  const handleSendGif = useCallback(() => {
    if (!isConnected || !room) return
    const { addMessage } = useAnonChat.getState()
    const gifs = ['🎉', '🔥', '💯', '🚀', '👀', '✨', '💥', '🌟']
    addMessage({
      id: `msg_${Date.now()}`,
      roomId: room.id,
      senderAlias: myAlias,
      content: gifs[Math.floor(Math.random() * gifs.length)],
      isMine: true,
      timestamp: Date.now(),
      type: 'reaction',
    })
    setShowUploadMenu(false)
  }, [isConnected, room, myAlias])

  const handleVoiceMessage = useCallback(() => {
    if (!isConnected || !room) return
    const { addMessage } = useAnonChat.getState()
    addMessage({
      id: `msg_${Date.now()}`,
      roomId: room.id,
      senderAlias: myAlias,
      content: '🎤 Voice message',
      isMine: true,
      timestamp: Date.now(),
      type: 'system',
    })
    setShowUploadMenu(false)
  }, [isConnected, room, myAlias])

  const formatTime = (ts: number) => {
    const d = new Date(ts)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const reactions = ['🔥', '😂', '💀', '❤️', '👏', '😮']

  if (!room) return null

  return (
    <div
      className="animate-fade-in"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 40,
        display: 'flex',
        flexDirection: 'column',
        background: '#000000',
        height: '100dvh',
        width: '100vw',
        overflow: 'hidden',
      }}
    >

      {/* ─── Top Bar ─── */}
      <div className="shrink-0 flex items-center justify-between px-3 bg-[#000000]/95 backdrop-blur-xl relative z-10" style={{ height: 56, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-3">
          <button onClick={handleBack} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/[0.06] active:bg-white/[0.1] transition-colors" style={{ minHeight: 0, minWidth: 0 }}>
            <svg className="w-5 h-5 text-[#e7e9ea]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#D4A574]/20 to-[#1d9bf0]/10 border border-white/[0.08] flex items-center justify-center">
              <MaskIcon className="w-4.5 h-4.5 text-[#D4A574]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[15px] font-semibold text-white">
                  {isConnected ? room.strangerAlias : isMatching ? 'Searching...' : 'Disconnected'}
                </span>
                {isConnected && (
                  <div className="w-2 h-2 rounded-full bg-[#00ba7c]" />
                )}
              </div>
              <span className="text-[12px] text-[#71767b]">
                {isConnected ? 'Connected' : isMatching ? 'Looking for someone' : 'Stranger left'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-0.5">
          <button
            onClick={() => setShowReport(true)}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/[0.06] transition-colors"
          >
            <svg className="w-[18px] h-[18px] text-[#71767b]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
              <line x1="4" y1="22" x2="4" y2="15" />
            </svg>
          </button>
          <button
            onClick={isConnected ? skipToStranger : handleNewChat}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/[0.06] transition-colors"
          >
            <svg className="w-[18px] h-[18px] text-[#71767b]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 4v6h6" />
              <path d="M3.51 15a9 9 0 102.13-9.36L1 10" />
            </svg>
          </button>
        </div>
      </div>

      {/* ─── Chat Area ─── */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-1.5 no-scrollbar" style={{ paddingBottom: '80px' }}>
        {isMatching && (
          <div className="flex flex-col items-center justify-center h-full gap-5">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
              <MaskIcon className="w-10 h-10 text-[#D4A574]/50 animate-pulse-soft" />
            </div>
            <div className="flex items-center gap-1.5">
              <div className="typing-dot" />
              <div className="typing-dot" />
              <div className="typing-dot" />
            </div>
            <p className="text-[14px] text-[#71767b]">Looking for a stranger...</p>
          </div>
        )}

        {messages.map((msg) => {
          if (msg.type === 'system') {
            return (
              <div key={msg.id} className="flex justify-center py-1.5">
                <span className="text-[12px] text-[#71767b] bg-white/[0.03] px-3.5 py-1 rounded-full">
                  {msg.content}
                </span>
              </div>
            )
          }

          if (msg.type === 'reaction') {
            return (
              <div key={msg.id} className={cn('flex', msg.isMine ? 'justify-end' : 'justify-start')}>
                <div className="px-3.5 py-2 rounded-2xl bg-white/[0.03] text-[30px] animate-scale-in">
                  {msg.content}
                </div>
              </div>
            )
          }

          if (msg.type === 'image') {
            return (
              <div key={msg.id} className={cn('flex flex-col', msg.isMine ? 'items-end' : 'items-start')}>
                <span className={cn(
                  'text-[11px] mb-1.5 ml-1 font-mono tracking-wide',
                  msg.isMine ? 'text-[#D4A574]/50' : 'text-[#71767b]'
                )}>
                  {msg.isMine ? myAlias : msg.senderAlias}
                </span>
                <div className={cn(
                  'max-w-[75%] rounded-2xl overflow-hidden animate-slide-up',
                  msg.isMine ? 'rounded-br-sm' : 'rounded-bl-sm border border-white/[0.06]'
                )}>
                  <img src={msg.content} alt="Photo" className="w-full h-auto max-h-[280px] object-cover" />
                </div>
                <span className="text-[10px] text-[#3a3a3a] mt-1 ml-1">
                  {formatTime(msg.timestamp)}
                </span>
              </div>
            )
          }

          return (
            <div key={msg.id} className={cn('flex flex-col', msg.isMine ? 'items-end' : 'items-start')}>
              <span className={cn(
                'text-[11px] mb-1.5 ml-1 font-mono tracking-wide',
                msg.isMine ? 'text-[#D4A574]/50' : 'text-[#71767b]'
              )}>
                {msg.isMine ? myAlias : msg.senderAlias}
              </span>
              <div
                className={cn(
                  'max-w-[80%] px-4 py-2.5 text-[15px] leading-[1.45] animate-slide-up',
                  msg.isMine
                    ? 'bg-white text-black rounded-2xl rounded-br-sm'
                    : 'bg-white/[0.06] text-[#e7e9ea] rounded-2xl rounded-bl-sm'
                )}
              >
                {msg.content}
              </div>
              <span className="text-[10px] text-[#3a3a3a] mt-1 ml-1">
                {formatTime(msg.timestamp)}
              </span>
            </div>
          )
        })}

        {strangerTyping && isConnected && (
          <div className="flex items-start animate-fade-in">
            <span className="text-[11px] text-[#71767b] font-mono ml-1 mb-1">
              {room.strangerAlias}
            </span>
            <div className="bg-white/[0.06] rounded-2xl rounded-bl-sm px-4 py-3 ml-2">
              <div className="flex items-center gap-1">
                <div className="typing-dot" />
                <div className="typing-dot" />
                <div className="typing-dot" />
              </div>
            </div>
          </div>
        )}

        {isDisconnected && (
          <div className="flex flex-col items-center gap-4 pt-10 animate-fade-in">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
              <MaskIcon className="w-8 h-8 text-[#2f3336]" />
            </div>
            <p className="text-[14px] text-[#94a3b8] text-center">
              Stranger has disconnected
            </p>
            <button
              onClick={handleNewChat}
              className="mt-2 px-7 py-2.5 rounded-full bg-white text-black font-bold text-[14px] hover:bg-gray-100 active:scale-[0.98] transition-all duration-150"
              style={{ minHeight: 0 }}
            >
              Find New Stranger
            </button>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* ─── Reconnecting banner ─── */}
      {reconnecting && (
        <div className="shrink-0 px-4 py-2 bg-[#f59e0b]/5 border-t border-[#f59e0b]/10 flex items-center justify-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#f59e0b] animate-pulse-soft" />
          <span className="text-[12px] text-[#f59e0b]/80">Reconnecting...</span>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
         BOTTOM BAR GROUP — everything anchored to absolute bottom
         ═══════════════════════════════════════════════════════════════ */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 50, background: '#000000' }}>

        {/* ─── Upload options (above input) ─── */}
        {showUploadMenu && (
          <div className="bg-[#000000] border-t border-white/[0.06] px-4 py-3 animate-slide-up">
            <div className="flex items-center gap-1">
              <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center gap-1.5 w-14 py-2 rounded-xl hover:bg-white/[0.06] transition-colors">
                <svg className="w-5 h-5 text-[#e7e9ea]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                </svg>
                <span className="text-[10px] text-[#71767b]">Photo</span>
              </button>
              <button onClick={() => cameraInputRef.current?.click()} className="flex flex-col items-center gap-1.5 w-14 py-2 rounded-xl hover:bg-white/[0.06] transition-colors">
                <svg className="w-5 h-5 text-[#e7e9ea]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/>
                </svg>
                <span className="text-[10px] text-[#71767b]">Camera</span>
              </button>
              <button onClick={handleSendGif} className="flex flex-col items-center gap-1.5 w-14 py-2 rounded-xl hover:bg-white/[0.06] transition-colors">
                <svg className="w-5 h-5 text-[#e7e9ea]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2"/>
                  <text x="6" y="15" fill="currentColor" stroke="none" fontSize="9" fontWeight="bold" fontFamily="sans-serif">GIF</text>
                </svg>
                <span className="text-[10px] text-[#71767b]">GIF</span>
              </button>
              <button onClick={handleVoiceMessage} className="flex flex-col items-center gap-1.5 w-14 py-2 rounded-xl hover:bg-white/[0.06] transition-colors">
                <svg className="w-5 h-5 text-[#e7e9ea]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
                </svg>
                <span className="text-[10px] text-[#71767b]">Voice</span>
              </button>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleCameraCapture} className="hidden" />
          </div>
        )}

        {/* ─── Reaction picker ─── */}
        {showReactions && (
          <div className="px-4 py-2.5 bg-[#000000] border-t border-white/[0.06] animate-slide-up">
            <div className="flex items-center justify-center gap-2">
              {reactions.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleReaction(emoji)}
                  className="w-10 h-10 rounded-full bg-white/[0.06] flex items-center justify-center text-[20px] hover:bg-white/[0.1] active:scale-90 transition-all duration-150"
                >
                  {emoji}
                </button>
              ))}
              <button
                onClick={() => setShowReactions(false)}
                className="w-10 h-10 rounded-full bg-white/[0.06] flex items-center justify-center hover:bg-white/[0.1] transition-colors"
              >
                <svg className="w-4 h-4 text-[#71767b]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* ─── Image preview ─── */}
        {selectedImage && (
          <div className="px-3 py-2.5 bg-[#000000] border-t border-white/[0.06]">
            <div className="flex items-center gap-3">
              <div className="relative w-11 h-11 rounded-xl overflow-hidden shrink-0 border border-white/[0.08]">
                <img src={selectedImage} alt="Preview" className="w-full h-full object-cover" />
              </div>
              <span className="flex-1 text-[13px] text-[#e7e9ea]">Photo ready</span>
              <button onClick={() => setSelectedImage(null)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/[0.06] shrink-0" style={{ minHeight: 0, minWidth: 0 }}>
                <svg className="w-4 h-4 text-[#71767b]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                </svg>
              </button>
              <button onClick={handleSendImage} className="w-9 h-9 rounded-full flex items-center justify-center bg-[#D4A574] text-black shrink-0 active:scale-90 transition-transform" style={{ minHeight: 0, minWidth: 0 }}>
                <svg className="w-[16px] h-[16px]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
           STICKY INPUT BAR — always at absolute bottom
           ═══════════════════════════════════════════════════════════════ */}
        <XChatInputBar
          value={input}
          onChange={setInput}
          onSend={handleSend}
          inputRef={inputRef as React.RefObject<HTMLInputElement>}
          placeholder={isConnected ? "Send a message..." : ""}
          disabled={!isConnected}
          showGif={false}
          onEmojiClick={() => { setShowReactions(!showReactions); setShowUploadMenu(false) }}
          emojiActive={showReactions}
          onAttachClick={() => { setShowUploadMenu(!showUploadMenu); setShowReactions(false) }}
        />
      </div>

      {/* ─── Report Dialog ─── */}
      {showReport && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowReport(false)}>
          <div
            className="w-full max-w-lg bg-[#000000] border-t border-white/[0.08] rounded-t-2xl p-5 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 rounded-full bg-white/10 mx-auto mb-5" />
            <h3 className="text-[17px] font-bold text-white mb-4">Report</h3>
            <div className="space-y-1">
              {['Inappropriate behavior', 'Spam', 'Harassment', 'Hate speech', 'Other'].map((reason) => (
                <button
                  key={reason}
                  onClick={() => setShowReport(false)}
                  className="w-full text-left px-4 py-3.5 rounded-xl text-[14px] text-[#e7e9ea] hover:bg-white/[0.04] active:bg-white/[0.06] transition-colors"
                >
                  {reason}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowReport(false)}
              className="w-full mt-2 py-3 rounded-xl text-[14px] text-[#71767b] font-medium hover:bg-white/[0.02] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   EXPORTS
   ═══════════════════════════════════════════════════════════════════════════ */
export function AnonymousChatView() {
  const { room } = useAnonChat()
  return room?.status === 'connected' || room?.status === 'matching'
    ? <AnonChatRoom />
    : <LobbyScreen />
}

export { AnonChatRoom as AnonymousChatRoomView }
