'use client'

import { useState, useRef } from 'react'
import { cn } from '@/lib/utils'
import { PAvatar } from './PAvatar'
import { useAppStore } from '@/stores/app'
import { createPost } from '@/lib/db'

interface ComposeDialogProps {
  open: boolean
  onClose: () => void
}

export function ComposeDialog({ open, onClose }: ComposeDialogProps) {
  const user = useAppStore((s) => s.user)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  if (!open) return null

  const maxLen = 280
  const remaining = maxLen - text.length
  const overLimit = remaining < 0

  const handleSubmit = async () => {
    if (!text.trim() || !user || sending) return
    setSending(true)
    try {
      await createPost(user.id, text.trim())
      setText('')
      onClose()
    } catch (err) {
      console.error('Failed to create post:', err)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#09080f]/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="relative w-full max-w-lg bg-[#09080f] border border-white/[0.08] rounded-t-2xl sm:rounded-2xl animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.08]">
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/[0.08] transition-colors"
          >
            <svg className="w-5 h-5 text-[#f0eef6]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
          <button
            onClick={handleSubmit}
            disabled={!text.trim() || sending || overLimit}
            className={cn(
              'px-5 py-1.5 rounded-full text-[15px] font-bold transition-all',
              text.trim() && !sending && !overLimit
                ? 'bg-[#8b5cf6] text-black hover:bg-[#7c3aed]'
                : 'bg-white/[0.08] text-[#64748b] cursor-not-allowed'
            )}
          >
            {sending ? 'Posting...' : 'Post'}
          </button>
        </div>

        {/* Body */}
        <div className="flex gap-4 p-5">
          <PAvatar src={user?.profileImage} name={user?.displayName} size={40} verified={user?.isVerified} />
          <div className="flex-1 min-w-0">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="What is happening?!"
              className="w-full bg-transparent text-[#f0eef6] text-[18px] placeholder-[#64748b] resize-none outline-none min-h-[120px] leading-relaxed"
              maxLength={maxLen + 50}
              autoFocus
            />
            <div className="border-t border-white/[0.08] pt-3.5 mt-2.5 flex items-center justify-between">
              <div className="flex items-center gap-1">
                <button className="p-2 rounded-full hover:bg-[#8b5cf6]/10 transition-colors">
                  <svg className="w-5 h-5 text-[#8b5cf6]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                    <rect x="3" y="3" width="18" height="18" rx="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <path d="M21 15l-5-5L5 21" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <button className="p-2 rounded-full hover:bg-[#8b5cf6]/10 transition-colors">
                  <svg className="w-5 h-5 text-[#8b5cf6]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <button className="p-2 rounded-full hover:bg-[#8b5cf6]/10 transition-colors">
                  <svg className="w-5 h-5 text-[#8b5cf6]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
              {text.length > maxLen * 0.9 && (
                <span className={cn('text-[13px]', overLimit ? 'text-[#f4212e]' : 'text-[#94a3b8]')}>
                  {remaining}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
