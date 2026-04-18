'use client'

import { useState, useRef, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { PAvatar } from './PAvatar'
import { useAppStore } from '@/stores/app'
import { createPost } from '@/lib/db'
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'
import { toast } from 'sonner'

interface ComposeDialogProps {
  open: boolean
  onClose: () => void
}

/* ── Image compression helper — fits within Firestore 1MB doc limit ── */
function compressImage(file: File, maxDim = 1200, quality = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('Failed to load image'))
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let { width, height } = img
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width)
            width = maxDim
          } else {
            width = Math.round((width * maxDim) / height)
            height = maxDim
          }
        }
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) { reject(new Error('Canvas not supported')); return }
        ctx.drawImage(img, 0, 0, width, height)
        const dataUrl = canvas.toDataURL('image/jpeg', quality)
        // If still too large (base64 > ~750KB raw), compress more aggressively
        if (dataUrl.length > 750_000) {
          const dataUrl2 = canvas.toDataURL('image/jpeg', 0.4)
          resolve(dataUrl2.length < dataUrl.length ? dataUrl2 : dataUrl)
        } else {
          resolve(dataUrl)
        }
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}

export function ComposeDialog({ open, onClose }: ComposeDialogProps) {
  const user = useAppStore((s) => s.user)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [showEmoji, setShowEmoji] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [compressing, setCompressing] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Premium detection: subscription OR badge indicates premium tier
  const isPremium = user?.subscription === 'pro' || user?.subscription === 'gold'
    || user?.badge === 'gold' || user?.badge === 'blue'
  const maxLen = isPremium ? 4000 : 500
  const remaining = maxLen - text.length
  const overLimit = remaining < 0

  const handleImageSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be under 10MB')
      return
    }
    setCompressing(true)
    try {
      const compressed = await compressImage(file)
      setImagePreview(compressed)
    } catch (err) {
      console.error('Image compression failed:', err)
      toast.error('Failed to process image')
    } finally {
      setCompressing(false)
    }
  }, [])

  const removeImage = useCallback(() => {
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [])

  const handleSubmit = async () => {
    if ((!text.trim() && !imagePreview) || !user || sending || overLimit) return
    if (overLimit) {
      toast.error(`Post exceeds ${maxLen} character limit by ${Math.abs(remaining)} characters`)
      return
    }
    setSending(true)
    try {
      const mediaUrls = imagePreview || ''
      await createPost(user.id, text.trim(), mediaUrls)
      setText('')
      setImagePreview(null)
      setShowEmoji(false)
      onClose()
      toast.success('Post published!')
    } catch (err) {
      console.error('Failed to create post:', err)
      toast.error('Failed to publish post. Try again.')
    } finally {
      setSending(false)
    }
  }

  const handleEmojiSelect = (emoji: any) => {
    const newText = text + emoji.native
    if (newText.length <= maxLen + 100) {
      setText(newText)
    }
    textareaRef.current?.focus()
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#09080f]/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="relative w-full max-w-lg bg-[#0d0b14] border border-white/[0.08] rounded-t-2xl sm:rounded-2xl animate-scale-in max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.08] shrink-0">
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/[0.08] transition-colors"
          >
            <svg className="w-5 h-5 text-[#f0eef6]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
          <div className="flex items-center gap-3">
            {!isPremium && (
              <span className="text-[11px] text-[#f59e0b] font-medium bg-[#f59e0b]/10 px-2 py-0.5 rounded-full">
                500 char limit — Upgrade for 4000
              </span>
            )}
            <button
              onClick={handleSubmit}
              disabled={(!text.trim() && !imagePreview) || sending || overLimit}
              className={cn(
                'px-5 py-1.5 rounded-full text-[15px] font-bold transition-all',
                (text.trim() || imagePreview) && !sending && !overLimit
                  ? 'bg-[#8b5cf6] text-black hover:bg-[#7c3aed]'
                  : 'bg-white/[0.08] text-[#64748b] cursor-not-allowed'
              )}
            >
              {sending ? 'Posting...' : 'Post'}
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex gap-3.5 p-4 overflow-y-auto flex-1">
          <PAvatar
            src={user?.profileImage}
            name={user?.displayName}
            size={38}
            verified={user?.isVerified}
            badge={user?.subscription}
          />
          <div className="flex-1 min-w-0">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={handleChange}
              onPaste={(e) => {
                // Allow full paste, then enforce limit via state
                setTimeout(() => {
                  if (textareaRef.current) {
                    const val = textareaRef.current.value
                    if (val.length > maxLen) {
                      setText(val.slice(0, maxLen))
                    }
                  }
                }, 0)
              }}
              placeholder="What is happening?!"
              className="w-full bg-transparent text-[#f0eef6] text-[17px] placeholder-[#64748b] resize-none outline-none min-h-[110px] leading-relaxed"
              autoFocus
            />

            {/* Compressing indicator */}
            {compressing && (
              <div className="flex items-center gap-2 mt-2">
                <div className="w-4 h-4 border-2 border-[#8b5cf6]/30 border-t-[#8b5cf6] rounded-full animate-spin" />
                <span className="text-[13px] text-[#94a3b8]">Optimizing image...</span>
              </div>
            )}

            {/* Image Preview */}
            {imagePreview && (
              <div className="mt-3 relative inline-block">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="max-h-[200px] max-w-full rounded-2xl border border-white/[0.08] object-cover"
                />
                <button
                  onClick={removeImage}
                  className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-[#09080f] border border-white/[0.15] flex items-center justify-center hover:bg-red-500/20 transition-colors"
                >
                  <svg className="w-4 h-4 text-[#f0eef6]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            )}

            {/* Emoji Picker */}
            {showEmoji && (
              <div className="mt-3 animate-fade-in">
                <Picker
                  data={data}
                  onEmojiSelect={handleEmojiSelect}
                  theme="dark"
                  set="native"
                  perLine={8}
                  previewPosition="none"
                  skinTonePosition="search"
                  style={{ maxWidth: '100%' }}
                />
              </div>
            )}

            <div className="border-t border-white/[0.08] pt-3 mt-3 flex items-center justify-between">
              <div className="flex items-center gap-0.5">
                {/* Image upload */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={compressing}
                  className="p-2 rounded-full hover:bg-[#8b5cf6]/10 transition-colors disabled:opacity-50"
                >
                  <svg className="w-5 h-5 text-[#8b5cf6]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                    <rect x="3" y="3" width="18" height="18" rx="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <path d="M21 15l-5-5L5 21" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageSelect}
                />

                {/* GIF */}
                <button className="p-2 rounded-full hover:bg-[#8b5cf6]/10 transition-colors">
                  <svg className="w-5 h-5 text-[#8b5cf6]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                    <rect x="2" y="4" width="20" height="16" rx="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <text x="12" y="15" textAnchor="middle" fill="#8b5cf6" fontSize="7" fontWeight="bold" fontFamily="sans-serif">GIF</text>
                  </svg>
                </button>

                {/* Emoji toggle */}
                <button
                  onClick={() => setShowEmoji(!showEmoji)}
                  className={cn(
                    'p-2 rounded-full transition-colors',
                    showEmoji ? 'bg-[#8b5cf6]/20' : 'hover:bg-[#8b5cf6]/10'
                  )}
                >
                  <svg className="w-5 h-5 text-[#8b5cf6]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
              <div className="flex items-center gap-2">
                {overLimit && (
                  <span className="text-[13px] text-red-400 font-bold tabular-nums">
                    {Math.abs(remaining)} over
                  </span>
                )}
                {!overLimit && text.length > maxLen * 0.85 && (
                  <span className={cn('text-[13px] tabular-nums', 'text-[#94a3b8]')}>
                    {remaining}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
