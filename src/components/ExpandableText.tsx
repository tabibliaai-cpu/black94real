'use client'

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'
import { cn } from '@/lib/utils'
import { useExpandableTextStore } from '@/stores/expandableText'

/* ═══════════════════════════════════════════════════════════════════════════
   ExpandableText

   Truncates long text after N lines with "… See more" / "See less" toggle.

   Strategy (bulletproof, no animation tricks):
   1. Always render text in a div
   2. When collapsed: apply -webkit-line-clamp via inline style
   3. When expanded: no inline style → normal block display → full text
   4. Detect overflow once via scrollHeight > clientHeight after mount
   ═══════════════════════════════════════════════════════════════════════════ */

export interface ExpandableTextProps {
  id: string
  text: string
  maxLines?: number
  className?: string
  linkColor?: string
  renderContent?: (text: string) => ReactNode
}

export function ExpandableText({
  id,
  text,
  maxLines = 4,
  className,
  linkColor = '#8b5cf6',
  renderContent,
}: ExpandableTextProps) {
  const isExpanded = useExpandableTextStore((s) => s.expanded.has(id))
  const toggle = useExpandableTextStore((s) => s.toggle)

  const textRef = useRef<HTMLDivElement>(null)
  const [needsTruncation, setNeedsTruncation] = useState(false)

  /* ── One-time overflow check after layout settles ── */
  useEffect(() => {
    const el = textRef.current
    if (!el || !text) {
      setNeedsTruncation(false)
      return
    }
    const raf = requestAnimationFrame(() => {
      setNeedsTruncation(el.scrollHeight > el.clientHeight + 2)
    })
    return () => cancelAnimationFrame(raf)
  }, [text, maxLines])

  const handleToggle = useCallback(
    (e: React.MouseEvent | React.KeyboardEvent) => {
      e.stopPropagation()
      e.preventDefault()
      toggle(id)
    },
    [toggle, id],
  )

  if (!text) return null

  /* ── Short text fits in clamp → no toggle needed ── */
  if (!needsTruncation) {
    return (
      <div className={className}>
        {renderContent ? renderContent(text) : text}
      </div>
    )
  }

  return (
    <div className={cn('relative', className)}>
      {/* Text: clamped when collapsed, full when expanded */}
      <div
        ref={textRef}
        className="whitespace-pre-wrap break-words"
        style={
          isExpanded
            ? { display: 'block', overflow: 'visible' }
            : {
                display: '-webkit-box',
                WebkitLineClamp: String(maxLines),
                WebkitBoxOrient: 'vertical' as const,
                overflow: 'hidden',
              }
        }
      >
        {renderContent ? renderContent(text) : text}
      </div>

      {/* Toggle link */}
      <span
        role="button"
        tabIndex={0}
        onClick={handleToggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleToggle(e)
          }
        }}
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
    </div>
  )
}

export default ExpandableText
