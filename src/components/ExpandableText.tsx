'use client'

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type ReactNode,
  memo,
} from 'react'
import { cn } from '@/lib/utils'
import { useExpandableTextStore } from '@/stores/expandableText'

/* ═══════════════════════════════════════════════════════════════════════════
   ExpandableText

   Truncates long text after N lines with a "See more / See less" toggle.

   How it works:
   1. Renders text with `-webkit-line-clamp` applied
   2. After layout, compares scrollHeight vs clientHeight to detect overflow
   3. If overflow → shows "… See more" inline
   4. On tap → removes clamp with a smooth max-height transition

   Features:
   - Zustand-backed per-item expanded state (survives scroll)
   - Smooth max-height animation on expand/collapse
   - Hashtag/mention highlighting via renderContent
   - Memoized — no unnecessary re-renders in large feeds
   ═══════════════════════════════════════════════════════════════════════════ */

export interface ExpandableTextProps {
  id: string
  text: string
  maxLines?: number
  className?: string
  linkColor?: string
  renderContent?: (text: string) => ReactNode
  transitionDuration?: number
}

export const ExpandableText = memo(function ExpandableText({
  id,
  text,
  maxLines = 4,
  className,
  linkColor = '#8b5cf6',
  renderContent,
  transitionDuration = 300,
}: ExpandableTextProps) {
  const isExpanded = useExpandableTextStore((s) => s.expanded.has(id))
  const toggle = useExpandableTextStore((s) => s.toggle)

  const textRef = useRef<HTMLDivElement>(null)
  const [needsTruncation, setNeedsTruncation] = useState(false)
  const [measured, setMeasured] = useState(false)
  const [scrollH, setScrollH] = useState(0)

  /* ── Measure overflow after mount & on text/maxLines change ── */
  useEffect(() => {
    const el = textRef.current
    if (!el || !text) {
      setNeedsTruncation(false)
      setMeasured(true)
      return
    }

    // Use rAF to ensure layout is settled after style changes
    const raf = requestAnimationFrame(() => {
      // When -webkit-line-clamp is active:
      // clientHeight = visible clamped height
      // scrollHeight = full content height
      const overflow = el.scrollHeight > el.clientHeight + 2
      setNeedsTruncation(overflow)
      setScrollH(el.scrollHeight)
      setMeasured(true)
    })

    return () => cancelAnimationFrame(raf)
  }, [text, maxLines])

  /* ── Recalculate on resize ── */
  useEffect(() => {
    const el = textRef.current
    if (!el || !measured) return

    const handleResize = () => {
      const overflow = el.scrollHeight > el.clientHeight + 2
      setNeedsTruncation(overflow)
      setScrollH(el.scrollHeight)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [measured])

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

  if (!text) return null

  /* ── Short text: no truncation needed → render plain ── */
  if (measured && !needsTruncation) {
    return (
      <div className={className}>
        {renderContent ? renderContent(text) : text}
      </div>
    )
  }

  return (
    <div className={cn('relative', className)}>
      <div
        ref={textRef}
        className="whitespace-pre-wrap break-words"
        style={{
          display: '-webkit-box',
          WebkitLineClamp: isExpanded ? 'unset' : String(maxLines),
          WebkitBoxOrient: 'vertical' as const,
          overflow: 'hidden',
          // Smooth expand: animate from clamped height to full scrollHeight
          ...(isExpanded && measured
            ? {
                maxHeight: `${scrollH}px`,
                transition: `max-height ${transitionDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`,
              }
            : {}),
          ...(measured && !isExpanded && needsTruncation
            ? {
                maxHeight: 'none', // Let line-clamp handle it when collapsed
              }
            : {}),
        }}
        aria-expanded={needsTruncation ? isExpanded : undefined}
      >
        {renderContent ? renderContent(text) : text}
      </div>

      {/* "… See more" / "See less" */}
      {measured && needsTruncation && (
        <span
          role="button"
          tabIndex={0}
          aria-expanded={isExpanded}
          onClick={handleToggle}
          onKeyDown={handleKeyDown}
          className={cn(
            'inline cursor-pointer select-none font-semibold',
            'hover:underline focus-visible:outline-none',
            'focus-visible:ring-2 focus-visible:ring-[#8b5cf6]/50',
            'focus-visible:ring-offset-1 rounded-sm ml-0.5'
          )}
          style={{ color: linkColor, fontSize: 'inherit', lineHeight: 'inherit' }}
        >
          {isExpanded ? 'See less' : '\u2026 See more'}
        </span>
      )}
    </div>
  )
})

export default ExpandableText
