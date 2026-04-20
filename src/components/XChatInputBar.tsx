'use client'

import { useCallback, type ChangeEvent, type KeyboardEvent, type RefObject } from 'react'
import { cn } from '@/lib/utils'

/* ═══════════════════════════════════════════════════════════════════════════
   XChatInputBar — Pixel-perfect X (2026) Messages DM input bar

   Design spec:
   - Background: #000000, thin top border #333333
   - Input pill: bg-[#2A2A2A], rounded-full, px-5 py-3
   - Left inside pill: Emoji + GIF buttons (24px, gray)
   - Input: transparent, text-[17px], white, placeholder gray-500
   - Right inside pill: Paperclip/attach icon
   - Far right (outside pill): Send arrow — gray when empty, #1d9bf0 when typing
   - Height: ~56px, safe-area bottom padding
   ═══════════════════════════════════════════════════════════════════════════ */

export interface XChatInputBarProps {
  /** Current text value */
  value: string
  /** Called on every keystroke */
  onChange: (value: string) => void
  /** Called when user presses Enter (or taps send) */
  onSend: () => void
  /** Placeholder text (default: "Start a message") */
  placeholder?: string
  /** Disable the input entirely */
  disabled?: boolean
  /** Ref to the underlying input/textarea element */
  inputRef?: RefObject<HTMLInputElement | HTMLTextAreaElement | null>
  /** Additional condition for enabling send (e.g. image attached) */
  canSend?: boolean
  /** Use textarea instead of input (for multi-line support) */
  multiline?: boolean
  /** Show GIF button (default: true) */
  showGif?: boolean
  /** Emoji button click handler (default: no-op) */
  onEmojiClick?: () => void
  /** Emoji button active state */
  emojiActive?: boolean
  /** GIF button click handler (default: no-op) */
  onGifClick?: () => void
  /** Attach / paperclip click handler (default: no-op) */
  onAttachClick?: () => void
}

export function XChatInputBar({
  value,
  onChange,
  onSend,
  placeholder = 'Start a message',
  disabled = false,
  inputRef,
  canSend,
  multiline = false,
  showGif = true,
  onEmojiClick,
  emojiActive = false,
  onGifClick,
  onAttachClick,
}: XChatInputBarProps) {
  const hasText = value.trim().length > 0
  const isSendEnabled = hasText || !!canSend

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        if (isSendEnabled) onSend()
      }
    },
    [isSendEnabled, onSend],
  )

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      onChange(e.target.value)
    },
    [onChange],
  )

  const sharedInputClass =
    'flex-1 bg-transparent text-[17px] text-white placeholder-[#71767b] outline-none min-w-0 leading-snug'

  return (
    <div className="shrink-0 bg-[#000000] border-t border-[#333333] safe-area-bottom">
      <div className="flex items-center gap-3 px-4 py-3">
        {/* ── Input Pill ── */}
        <div className="flex-1 flex items-center gap-2 bg-[#2A2A2A] rounded-[24px] px-4 py-2.5 transition-colors duration-150 focus-within:bg-[#333333]">
          {/* Emoji button */}
          <button
            type="button"
            onClick={onEmojiClick}
            className={cn(
              'shrink-0 w-[28px] h-[28px] flex items-center justify-center rounded-full transition-colors duration-150',
              emojiActive ? 'text-[#1d9bf0]' : 'text-[#71767b] hover:text-[#e7e9ea] hover:bg-white/[0.08]',
            )}
          >
            <svg className="w-[22px] h-[22px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M8 14s1.5 2 4 2 4-2 4-2" />
              <line x1="9" y1="9" x2="9.01" y2="9" />
              <line x1="15" y1="9" x2="15.01" y2="9" />
            </svg>
          </button>

          {/* GIF button */}
          {showGif && (
            <button
              type="button"
              onClick={onGifClick}
              className="shrink-0 text-[#71767b] hover:text-[#e7e9ea] transition-colors duration-150"
            >
              <svg className="w-[24px] h-[24px]" viewBox="0 0 24 24" fill="none">
                <rect x="1" y="4" width="22" height="16" rx="3" stroke="currentColor" strokeWidth="1.8" />
                <text x="5.5" y="15.5" fill="currentColor" fontSize="8.5" fontWeight="800" fontFamily="system-ui, sans-serif" letterSpacing="-0.5">GIF</text>
              </svg>
            </button>
          )}

          {/* Text Input */}
          {multiline ? (
            <textarea
              ref={inputRef as RefObject<HTMLTextAreaElement>}
              value={value}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              rows={1}
              className={cn(sharedInputClass, 'resize-none max-h-[120px] py-0.5')}
              style={{ minHeight: '24px' }}
            />
          ) : (
            <input
              ref={inputRef as RefObject<HTMLInputElement>}
              type="text"
              value={value}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              className={sharedInputClass}
            />
          )}

          {/* Paperclip / Attach button */}
          {onAttachClick && (
            <button
              type="button"
              onClick={onAttachClick}
              className="shrink-0 w-[28px] h-[28px] flex items-center justify-center rounded-full text-[#71767b] hover:text-[#e7e9ea] hover:bg-white/[0.08] transition-colors duration-150"
            >
              <svg className="w-[20px] h-[20px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
              </svg>
            </button>
          )}
        </div>

        {/* ── Send Button (outside pill) ── */}
        <button
          type="button"
          onClick={isSendEnabled ? onSend : undefined}
          disabled={!isSendEnabled || disabled}
          className={cn(
            'shrink-0 w-[34px] h-[34px] flex items-center justify-center rounded-full transition-all duration-200',
            isSendEnabled && !disabled
              ? 'text-[#1d9bf0] hover:bg-[#1d9bf0]/10 active:scale-90'
              : 'text-[#333333] pointer-events-none',
          )}
        >
          <svg className="w-[20px] h-[20px]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3.478 2.404a.75.75 0 00-.926.941l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.404z" />
          </svg>
        </button>
      </div>
    </div>
  )
}
