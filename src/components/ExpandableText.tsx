'use client'

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type ReactNode,
  type CSSProperties,
  memo,
} from 'react'
import { cn } from '@/lib/utils'
import { useExpandableTextStore } from '@/stores/expandableText'

/* ═══════════════════════════════════════════════════════════════════════════
   ExpandableText

   A production-ready, reusable component for truncating long text in a
   social media feed with "See more / See less" toggle.

   Features:
   - CSS line-clamp for truncation (3 lines default, configurable)
   - JS measurement fallback to detect overflow
   - Smooth height animation on expand/collapse
   - Zustand-backed per-item expanded state (survives scroll)
   - Accessible: keyboard focusable, aria-expanded
   - Supports emojis, hashtags, mentions, links (via children)
   - Memoized — no unnecessary re-renders in large feeds
   ═══════════════════════════════════════════════════════════════════════════ */

export interface ExpandableTextProps {
  /** Unique identifier for this text block (e.g., post.id) */
  id: string
  /** The full text content to display */
  text: string
  /** Maximum visible lines before truncation (default: 3) */
  maxLines?: number
  /** CSS class for the text container */
  className?: string
  /** Accent color for "See more / See less" (default: theme purple) */
  linkColor?: string
  /** Custom render function for text content (e.g., hashtag highlighting) */
  renderContent?: (text: string) => ReactNode
  /** Smooth height transition duration in ms (default: 250) */
  transitionDuration?: number
}

export const ExpandableText = memo(function ExpandableText({
  id,
  text,
  maxLines = 3,
  className,
  linkColor = '#8b5cf6',
  renderContent,
  transitionDuration = 250,
}: ExpandableTextProps) {
  const isExpanded = useExpandableTextStore((s) => s.expanded.has(id))
  const toggle = useExpandableTextStore((s) => s.toggle)

  const innerRef = useRef<HTMLSpanElement>(null)
  const [needsTruncation, setNeedsTruncation] = useState(false)
  const [measured, setMeasured] = useState(false)
  const [contentHeight, setContentHeight] = useState<number | null>(null)
  const [collapsedHeight, setCollapsedHeight] = useState<number | null>(null)

  /* ── Measure: check if content overflows the clamped height ── */
  useEffect(() => {
    const el = innerRef.current
    if (!el || !text) {
      setNeedsTruncation(false)
      setMeasured(true)
      return
    }

    // Temporarily remove clamp to measure full height
    el.style.webkitLineClamp = 'unset'
    el.style.display = 'block'
    el.style.overflow = 'visible'

    const fullHeight = el.scrollHeight

    // Apply clamp and measure
    el.style.webkitLineClamp = String(maxLines)
    el.style.display = '-webkit-box'
    el.style.overflow = 'hidden'

    const clampedHeight = el.scrollHeight

    setContentHeight(fullHeight)
    setCollapsedHeight(clampedHeight)
    setNeedsTruncation(fullHeight > clampedHeight + 1)
    setMeasured(true)
  }, [text, maxLines])

  /* ── Recalculate on resize ── */
  useEffect(() => {
    if (!needsTruncation || !measured) return

    const handleResize = () => {
      const el = innerRef.current
      if (!el) return
      el.style.webkitLineClamp = 'unset'
      el.style.display = 'block'
      el.style.overflow = 'visible'
      const fullHeight = el.scrollHeight
      el.style.webkitLineClamp = String(maxLines)
      el.style.display = '-webkit-box'
      el.style.overflow = 'hidden'
      const clampedHeight = el.scrollHeight
      setContentHeight(fullHeight)
      setCollapsedHeight(clampedHeight)
      setNeedsTruncation(fullHeight > clampedHeight + 1)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [needsTruncation, measured, maxLines])

  const handleToggle = useCallback(
    (e: React.MouseEvent | React.KeyboardEvent) => {
      e.stopPropagation()
      e.preventDefault()
      toggle(id)
    },
    [toggle, id],
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        handleToggle(e)
      }
    },
    [handleToggle],
  )

  /* ── Don't render if no text ── */
  if (!text) return null

  /* ── Short text: render directly without truncation UI ── */
  if (measured && !needsTruncation) {
    return (
      <span className={className}>
        {renderContent ? renderContent(text) : text}
      </span>
    )
  }

  /* ── Animated height style ── */
  const heightStyle: CSSProperties =
    measured && contentHeight !== null && collapsedHeight !== null
      ? {
          height: isExpanded ? `${contentHeight}px` : `${collapsedHeight}px`,
          overflow: 'hidden',
          transition: `height ${transitionDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`,
        }
      : {}

  const clampStyle: CSSProperties = isExpanded
    ? { WebkitLineClamp: 'unset', display: 'block', overflow: 'visible' }
    : { WebkitLineClamp: String(maxLines), display: '-webkit-box', overflow: 'hidden' }

  return (
    <div
      className={cn('relative', className)}
      style={heightStyle}
    >
      {/* Hidden measurer — always renders full content for measurement */}
      <span
        ref={innerRef}
        className="whitespace-pre-wrap break-words"
        style={{
          ...clampStyle,
          WebkitBoxOrient: 'vertical',
          visibility: measured ? 'visible' : 'hidden',
        }}
        aria-expanded={needsTruncation ? isExpanded : undefined}
      >
        {renderContent ? renderContent(text) : text}
      </span>

      {/* "See more / See less" — inline with text */}
      {measured && needsTruncation && (
        <span
          role="button"
          tabIndex={0}
          aria-expanded={isExpanded}
          onClick={handleToggle}
          onKeyDown={handleKeyDown}
          className="inline cursor-pointer select-none font-semibold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8b5cf6]/50 focus-visible:ring-offset-1 rounded-sm ml-0.5"
          style={{ color: linkColor, fontSize: 'inherit', lineHeight: 'inherit' }}
        >
          {isExpanded ? 'See less' : '… See more'}
        </span>
      )}
    </div>
  )
})

export default ExpandableText
