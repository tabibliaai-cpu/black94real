'use client'

import { useState, useCallback, useRef, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { LANGUAGES, FESTIVAL_TEMPLATES, type StoryFormat, type Language, type StoryAudience, type StoryExpiry, type StoryCard, type PollOption, type FestivalTemplate } from '@/lib/story-mock-data'
import confetti from 'canvas-confetti'
import { toast } from 'sonner'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface StoryCreatorProps {
  open: boolean
  onClose: () => void
  onStoryPublished: (story: StoryCard) => void
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FORMAT_OPTIONS: { value: StoryFormat; icon: string; label: string; desc: string }[] = [
  { value: 'text', icon: '✍️', label: 'Text', desc: 'Share your opinion' },
  { value: 'voice', icon: '🎙️', label: 'Voice', desc: 'Record up to 60s' },
  { value: 'thread', icon: '🧵', label: 'Thread', desc: 'Import your threads' },
  { value: 'poll', icon: '📊', label: 'Poll', desc: 'Ask your audience' },
  { value: 'festival', icon: '🎉', label: 'Festival', desc: 'Celebration cards' },
  { value: 'cricket', icon: '🏏', label: 'Cricket', desc: 'Live match updates' },
  { value: 'feed', icon: '📰', label: 'Feed', desc: 'Share a post URL' },
]

const GRADIENT_COLORS = [
  'linear-gradient(135deg, #7B1FA2 0%, #1565C0 100%)',
  'linear-gradient(135deg, #D32F2F 0%, #FF6F00 100%)',
  'linear-gradient(135deg, #2E7D32 0%, #00897B 100%)',
  'linear-gradient(135deg, #C2185B 0%, #7B1FA2 100%)',
  'linear-gradient(135deg, #F57F17 0%, #795548 100%)',
  'linear-gradient(135deg, #0D47A1 0%, #1A237E 100%)',
  'linear-gradient(135deg, #212121 0%, #424242 100%)',
  'linear-gradient(135deg, #FAFAFA 0%, #E0E0E0 100%)',
]

const AUDIENCE_OPTIONS: { value: StoryAudience; label: string; icon: string }[] = [
  { value: 'everyone', label: 'Everyone', icon: '🌐' },
  { value: 'followers', label: 'Followers only', icon: '👥' },
  { value: 'close_friends', label: 'Close friends', icon: '🔒' },
  { value: 'subscribers', label: 'Subscribers only', icon: '⭐' },
]

const EXPIRY_OPTIONS: { value: StoryExpiry; label: string }[] = [
  { value: '6h', label: '6 hours' },
  { value: '24h', label: '24 hours' },
  { value: '72h', label: '72 hours' },
  { value: 'permanent', label: 'Permanent' },
]

const REGION_OPTIONS = [
  { value: 'all_india', label: 'All India' },
  { value: 'state', label: 'My state (Telangana)' },
  { value: 'city', label: 'My city (Hyderabad)' },
]

const MOCK_THREADS = [
  {
    id: 'mt_1',
    title: '5 thoughts on startup culture',
    cardCount: 5,
    cards: [
      '1/5 — Startups romanticise failure, but nobody talks about the toll it takes on mental health.',
      '2/5 — The "hustle culture" narrative is toxic. Consistency beats intensity every time.',
      '3/5 — Most successful founders I know work 6-7 focused hours, not 16-hour days.',
      '4/5 — Your first idea is almost never the one that works. Speed of iteration > perfection.',
      '5/5 — The best startups solve problems their founders personally experienced deeply.',
    ],
  },
  {
    id: 'mt_2',
    title: 'My India travel diary (8 places)',
    cardCount: 8,
    cards: [
      'Varanasi — The spiritual capital hit different at sunrise on the Ganges.',
      'Jaipur — Hawa Mahal at golden hour is something else entirely.',
      'Kerala backwaters — Houseboat life is the most peaceful experience.',
      'Leh-Ladakh — Pangong Tso lake at 4,350m altitude is surreal.',
      'Rishikesh — Yoga and the Ganges combo is unbeatable.',
      'Goa — Not just beaches — Old Goa churches are stunning.',
      'Hampi — Boulders and ruins make it look like another planet.',
      'Mumbai — The city that never sleeps truly lives up to the hype.',
    ],
  },
  {
    id: 'mt_3',
    title: 'Book recommendations 2025',
    cardCount: 3,
    cards: [
      '"Thinking, Fast and Slow" by Kahneman — Changed how I see decision-making.',
      '"The Almanack of Naval Ravikant" — Wealth and happiness decoded.',
      '"Sapiens" by Yuval Noah Harari — Rewired my understanding of civilisation.',
    ],
  },
]

const MOCK_MATCHES = [
  {
    id: 'match_1',
    team1: 'IND',
    team2: 'AUS',
    team1Flag: '🇮🇳',
    team2Flag: '🇦🇺',
    team1Score: '287/4',
    team2Score: '265',
    overs: '42.3',
    venue: 'Eden Gardens, Kolkata',
    status: 'LIVE',
  },
  {
    id: 'match_2',
    team1: 'ENG',
    team2: 'SA',
    team1Flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    team2Flag: '🇿🇦',
    team1Score: '198/6',
    team2Score: '201/3',
    overs: '38.2',
    venue: 'Wankhede, Mumbai',
    status: 'LIVE',
  },
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function StoryCreator({ open, onClose, onStoryPublished }: StoryCreatorProps) {
  // ---- State ----
  const [format, setFormat] = useState<StoryFormat>('text')
  const [language, setLanguage] = useState<Language>('en')
  const [audience, setAudience] = useState<StoryAudience>('everyone')
  const [expiry, setExpiry] = useState<StoryExpiry>('24h')
  const [region, setRegion] = useState('all_india')
  const [publishing, setPublishing] = useState(false)
  const [published, setPublished] = useState(false)

  // Collapsible dropdown toggles
  const [audienceOpen, setAudienceOpen] = useState(false)
  const [expiryOpen, setExpiryOpen] = useState(false)
  const [languageOpen, setLanguageOpen] = useState(false)

  // Text format state
  const [textContent, setTextContent] = useState('')
  const [textGradient, setTextGradient] = useState(GRADIENT_COLORS[0])
  const [textFontSize, setTextFontSize] = useState<'S' | 'M' | 'L'>('M')
  const [textPollEnabled, setTextPollEnabled] = useState(false)
  const [pollQuestion, setPollQuestion] = useState('')
  const [pollOptions, setPollOptions] = useState<PollOption[]>([
    { id: 'opt_1', text: '', votes: 0, percentage: 0 },
    { id: 'opt_2', text: '', votes: 0, percentage: 0 },
  ])

  // Voice format state
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [voiceWaveform, setVoiceWaveform] = useState<number[]>([])
  const [autoCaption, setAutoCaption] = useState(true)
  const [voiceCaptionLang, setVoiceCaptionLang] = useState<Language>('en')
  const [hasRecorded, setHasRecorded] = useState(false)
  const recordingInterval = useRef<ReturnType<typeof setInterval> | null>(null)
  const waveformInterval = useRef<ReturnType<typeof setInterval> | null>(null)

  // Thread format state
  const [selectedThread, setSelectedThread] = useState<string | null>(null)
  const [threadCards, setThreadCards] = useState<string[]>([])
  const [editingCardIndex, setEditingCardIndex] = useState<number | null>(null)
  const [editingCardText, setEditingCardText] = useState('')

  // Poll format state (standalone)
  const [standalonePollQuestion, setStandalonePollQuestion] = useState('')
  const [standalonePollOptions, setStandalonePollOptions] = useState<PollOption[]>([
    { id: 'sp_1', text: '', votes: 0, percentage: 25 },
    { id: 'sp_2', text: '', votes: 0, percentage: 25 },
    { id: 'sp_3', text: '', votes: 0, percentage: 25 },
    { id: 'sp_4', text: '', votes: 0, percentage: 25 },
  ])
  const [pollReactionEmojis, setPollReactionEmojis] = useState<string[]>(['👍', '🔥', '💯', '😱'])

  // Festival format state
  const [selectedFestival, setSelectedFestival] = useState<FestivalTemplate | null>(null)
  const [festivalMessage, setFestivalMessage] = useState('')

  // Cricket format state
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null)
  const [cricketCommentary, setCricketCommentary] = useState('')

  // Feed format state
  const [feedUrl, setFeedUrl] = useState('')
  const [feedCaption, setFeedCaption] = useState('')

  // ---- Derived ----
  const selectedMatchData = useMemo(
    () => MOCK_MATCHES.find((m) => m.id === selectedMatch),
    [selectedMatch],
  )

  // ---- Effects ----

  // Recording timer
  useEffect(() => {
    if (isRecording) {
      recordingInterval.current = setInterval(() => {
        setRecordingTime((t) => {
          if (t >= 60) {
            setIsRecording(false)
            setHasRecorded(true)
            return 60
          }
          return t + 1
        })
      }, 1000)
      waveformInterval.current = setInterval(() => {
        setVoiceWaveform(
          Array.from({ length: 20 }, () => Math.floor(Math.random() * 80 + 20)),
        )
      }, 150)
    } else {
      if (recordingInterval.current) clearInterval(recordingInterval.current)
      if (waveformInterval.current) clearInterval(waveformInterval.current)
    }
    return () => {
      if (recordingInterval.current) clearInterval(recordingInterval.current)
      if (waveformInterval.current) clearInterval(waveformInterval.current)
    }
  }, [isRecording])

  // Reset on close
  useEffect(() => {
    if (!open) {
      setFormat('text')
      setLanguage('en')
      setAudience('everyone')
      setExpiry('24h')
      setRegion('all_india')
      setPublishing(false)
      setPublished(false)
      setAudienceOpen(false)
      setExpiryOpen(false)
      setLanguageOpen(false)
      setTextContent('')
      setTextGradient(GRADIENT_COLORS[0])
      setTextFontSize('M')
      setTextPollEnabled(false)
      setPollQuestion('')
      setPollOptions([
        { id: 'opt_1', text: '', votes: 0, percentage: 0 },
        { id: 'opt_2', text: '', votes: 0, percentage: 0 },
      ])
      setIsRecording(false)
      setRecordingTime(0)
      setVoiceWaveform([])
      setHasRecorded(false)
      setSelectedThread(null)
      setThreadCards([])
      setEditingCardIndex(null)
      setStandalonePollQuestion('')
      setStandalonePollOptions([
        { id: 'sp_1', text: '', votes: 0, percentage: 25 },
        { id: 'sp_2', text: '', votes: 0, percentage: 25 },
        { id: 'sp_3', text: '', votes: 0, percentage: 25 },
        { id: 'sp_4', text: '', votes: 0, percentage: 25 },
      ])
      setSelectedFestival(null)
      setFestivalMessage('')
      setSelectedMatch(null)
      setCricketCommentary('')
      setFeedUrl('')
      setFeedCaption('')
    }
  }, [open])

  // ---- Content validation ----

  function hasContent(): boolean {
    switch (format) {
      case 'text':
        return textContent.trim().length > 0
      case 'voice':
        return hasRecorded
      case 'thread':
        return selectedThread !== null && threadCards.length > 0
      case 'poll':
        return standalonePollQuestion.trim().length > 0 && standalonePollOptions.some((o) => o.text.trim().length > 0)
      case 'festival':
        return selectedFestival !== null && festivalMessage.trim().length > 0
      case 'cricket':
        return selectedMatch !== null && cricketCommentary.trim().length > 0
      case 'feed':
        return feedUrl.trim().length > 0
      default:
        return false
    }
  }

  // ---- Build story ----

  function buildStory(): StoryCard {
    const id = `story_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

    const base: StoryCard = {
      id,
      format: format!,
      content: '',
      language,
    }

    switch (format) {
      case 'text':
        return {
          ...base,
          content: textContent,
          mediaUrl: textGradient,
          pollOptions: textPollEnabled
            ? pollOptions.filter((o) => o.text.trim())
            : undefined,
        }
      case 'voice':
        return {
          ...base,
          content: `Voice story (${recordingTime}s)`,
          voiceWaveform: voiceWaveform.length > 0 ? voiceWaveform : Array.from({ length: 20 }, () => Math.floor(Math.random() * 80 + 20)),
          voiceDuration: recordingTime,
        }
      case 'thread':
        return {
          ...base,
          content: threadCards.join('\n---\n'),
        }
      case 'poll':
        return {
          ...base,
          content: standalonePollQuestion,
          pollOptions: standalonePollOptions
            .filter((o) => o.text.trim())
            .map((o) => ({ ...o, percentage: Math.floor(Math.random() * 40 + 10) })),
        }
      case 'festival':
        return {
          ...base,
          content: festivalMessage,
          festivalTemplate: selectedFestival,
        }
      case 'cricket': {
        const match = selectedMatchData
        return {
          ...base,
          content: cricketCommentary,
          cricketData: match
            ? {
                team1: match.team1,
                team2: match.team2,
                team1Score: match.team1Score,
                team2Score: match.team2Score,
                overs: match.overs,
                venue: match.venue,
                status: match.status,
              }
            : undefined,
        }
      }
      case 'feed':
        return {
          ...base,
          content: feedCaption || feedUrl,
        }
      default:
        return base
    }
  }

  // ---- Publish ----

  const handlePublish = async () => {
    try {
      if (!hasContent()) {
        toast.error('Please add content before publishing')
        return
      }

      setPublishing(true)

      // Simulate upload delay
      await new Promise((r) => setTimeout(r, 1200))

      // Build and publish the story
      const story = buildStory()
      onStoryPublished(story)

      // Success feedback
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.7 } })
      setPublishing(false)
      setPublished(true)
      toast.success('Story published!')

      // Close creator after a brief delay so user sees the success state
      setTimeout(() => {
        onClose()
      }, 1500)
    } catch (err) {
      console.error('Story publish failed:', err)
      setPublishing(false)
      toast.error('Failed to publish story. Please try again.')
    }
  }

  // ---- Voice helpers ----

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      setIsRecording(false)
      if (recordingTime > 0) setHasRecorded(true)
    } else {
      if (recordingTime >= 60) return
      setIsRecording(true)
      setRecordingTime(0)
      setHasRecorded(false)
      setVoiceWaveform([])
    }
  }, [isRecording, recordingTime])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, '0')
    const s = (seconds % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  // ---- Thread helpers ----

  const selectThread = useCallback(
    (threadId: string) => {
      const thread = MOCK_THREADS.find((t) => t.id === threadId)
      if (thread) {
        setSelectedThread(threadId)
        setThreadCards([...thread.cards])
      }
    },
    [],
  )

  const removeThreadCard = useCallback((index: number) => {
    setThreadCards((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const startEditCard = useCallback((index: number) => {
    setEditingCardIndex(index)
    setEditingCardText(threadCards[index])
  }, [threadCards])

  const saveEditCard = useCallback(() => {
    if (editingCardIndex !== null && editingCardText.trim()) {
      setThreadCards((prev) =>
        prev.map((c, i) => (i === editingCardIndex ? editingCardText.trim() : c)),
      )
      setEditingCardIndex(null)
      setEditingCardText('')
    }
  }, [editingCardIndex, editingCardText])

  // ---- Poll helpers ----

  const addPollOption = useCallback(() => {
    if (standalonePollOptions.length < 4) {
      setStandalonePollOptions((prev) => [
        ...prev,
        { id: `sp_${Date.now()}`, text: '', votes: 0, percentage: 0 },
      ])
    }
  }, [standalonePollOptions.length])

  const removePollOption = useCallback(
    (index: number) => {
      if (standalonePollOptions.length > 2) {
        setStandalonePollOptions((prev) => prev.filter((_, i) => i !== index))
      }
    },
    [standalonePollOptions.length],
  )

  const updatePollOption = useCallback((index: number, text: string) => {
    setStandalonePollOptions((prev) =>
      prev.map((o, i) => (i === index ? { ...o, text } : o)),
    )
  }, [])

  // ---- Text poll helpers (inline) ----

  const addTextPollOption = useCallback(() => {
    if (pollOptions.length < 4) {
      setPollOptions((prev) => [
        ...prev,
        { id: `opt_${Date.now()}`, text: '', votes: 0, percentage: 0 },
      ])
    }
  }, [pollOptions.length])

  const removeTextPollOption = useCallback(
    (index: number) => {
      if (pollOptions.length > 2) {
        setPollOptions((prev) => prev.filter((_, i) => i !== index))
      }
    },
    [pollOptions.length],
  )

  const updateTextPollOption = useCallback((index: number, text: string) => {
    setPollOptions((prev) =>
      prev.map((o, i) => (i === index ? { ...o, text } : o)),
    )
  }, [])

  // ---- Close all dropdowns ----
  const closeDropdowns = useCallback(() => {
    setAudienceOpen(false)
    setExpiryOpen(false)
    setLanguageOpen(false)
  }, [])

  // =========================================================================
  // CANVAS COMPONENTS (defined before return for proper JSX rendering)
  // =========================================================================

  // ---- TEXT ----
  function TextCanvas() {
    return (
      <div className="pt-2 pb-20 flex flex-col gap-4">
        <div
          className="rounded-2xl p-5 min-h-[200px] flex items-center justify-center relative overflow-hidden"
          style={{ background: textGradient }}
        >
          <textarea
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
            placeholder="Type your story here..."
            className={cn(
              'w-full bg-transparent text-white placeholder:text-white/30 resize-none outline-none',
              textFontSize === 'S' && 'text-base',
              textFontSize === 'M' && 'text-xl',
              textFontSize === 'L' && 'text-2xl',
            )}
            style={{ fontWeight: 700 }}
            rows={4}
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-white/40 text-xs mr-1">Size</span>
          {(['S', 'M', 'L'] as const).map((size) => (
            <motion.button
              key={size}
              whileTap={{ scale: 0.92 }}
              onClick={() => setTextFontSize(size)}
              className={cn(
                'px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border',
                textFontSize === size
                  ? 'border-[#00f0ff] bg-[#00f0ff]/15 shadow-[0_0_8px_rgba(0,240,255,0.25)]'
                  : 'border-white/[0.08] bg-white/[0.04] text-white/50',
              )}
              style={textFontSize === size ? { color: '#00f0ff', textShadow: '0 0 6px rgba(0,240,255,0.3)' } : undefined}
            >
              {size}
            </motion.button>
          ))}
        </div>

        <div className="flex items-center gap-2.5">
          <span className="text-white/40 text-xs mr-1">BG</span>
          {GRADIENT_COLORS.map((grad, i) => (
            <motion.button
              key={i}
              whileTap={{ scale: 0.9 }}
              onClick={() => setTextGradient(grad)}
              className={cn(
                'w-8 h-8 rounded-full shrink-0 transition-all border-2',
                textGradient === grad
                  ? 'border-[#00f0ff] scale-110 shadow-[0_0_10px_rgba(0,240,255,0.4)]'
                  : 'border-transparent',
              )}
              style={{ background: grad }}
            />
          ))}
        </div>

        <div className={cn(
          'flex items-center justify-between rounded-xl bg-white/[0.04] border p-3.5 transition-all',
          textPollEnabled ? 'border-[#00f0ff]/30 shadow-[0_0_12px_rgba(0,240,255,0.1)]' : 'border-white/[0.08]',
        )}>
          <div>
            <p className="text-white text-sm font-medium">Add live poll below</p>
            <p className="text-white/30 text-xs">Let viewers vote on options</p>
          </div>
          <button
            onClick={() => setTextPollEnabled(!textPollEnabled)}
            className={cn(
              'w-12 h-7 rounded-full relative transition-colors duration-200',
              textPollEnabled ? 'bg-[#00f0ff]' : 'bg-white/20',
            )}
          >
            <motion.div
              className="absolute top-0.5 w-6 h-6 rounded-full bg-white"
              animate={{ left: textPollEnabled ? 22 : 2 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          </button>
        </div>

        <AnimatePresence>
          {textPollEnabled && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="flex flex-col gap-2 pb-2">
                {pollOptions.map((opt, i) => (
                  <div key={opt.id} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={opt.text}
                      onChange={(e) => updateTextPollOption(i, e.target.value)}
                      placeholder={`Option ${i + 1}`}
                      className="flex-1 bg-white/[0.06] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-[#00f0ff]/50 transition-colors"
                    />
                    {pollOptions.length > 2 && (
                      <button
                        onClick={() => removeTextPollOption(i)}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-white/[0.06] text-white/40 hover:text-red-400 transition-colors text-lg"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                {pollOptions.length < 4 && (
                  <button
                    onClick={addTextPollOption}
                    className="self-start flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-colors bg-[#00f0ff]/10 border border-[#00f0ff]/30 text-[#00f0ff] hover:bg-[#00f0ff]/20"
                  >
                    <span className="text-sm">+</span> Add option
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  // ---- VOICE ----
  function VoiceCanvas() {
    return (
      <div className="pt-4 pb-20 flex flex-col items-center gap-6">
        <div className="flex items-center justify-center gap-[3px] h-24 w-full max-w-xs">
          {(voiceWaveform.length > 0
            ? voiceWaveform
            : Array.from({ length: 20 }, () => 8)
          ).map((h, i) => (
            <motion.div
              key={i}
              className="w-[5px] rounded-full"
              style={{
                minHeight: 4,
                height: `${Math.max(4, h)}%`,
                background: isRecording
                  ? 'linear-gradient(to top, #00f0ff, #ff00aa)'
                  : 'rgba(0,240,255,0.6)',
                boxShadow: isRecording ? '0 0 6px rgba(0,240,255,0.5)' : 'none',
              }}
              animate={{ height: `${Math.max(4, h)}%` }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
            />
          ))}
        </div>

        <div className="text-center">
          <p
            className="font-mono text-3xl tabular-nums font-bold tracking-wider"
            style={{ color: '#00f0ff', textShadow: '0 0 12px rgba(0,240,255,0.4)' }}
          >
            {formatTime(recordingTime)}
          </p>
          <p className="text-white/30 text-sm mt-1">/ 01:00</p>
        </div>

        <div className="relative flex items-center justify-center">
          <AnimatePresence>
            {isRecording && (
              <>
                {[0, 1, 2].map((ring) => (
                  <motion.div
                    key={ring}
                    initial={{ scale: 1, opacity: 0.6 }}
                    animate={{ scale: 2.2 + ring * 0.4, opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: ring * 0.3, ease: 'easeOut' }}
                    className="absolute w-20 h-20 rounded-full border-2"
                    style={{ borderColor: 'rgba(0,240,255,0.3)' }}
                  />
                ))}
              </>
            )}
          </AnimatePresence>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={toggleRecording}
            className="relative z-10 w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 bg-red-500 shadow-red-500/20"
          >
            {isRecording ? (
              <div className="w-6 h-6 rounded-md bg-white" />
            ) : (
              <svg width="28" height="28" fill="white" viewBox="0 0 24 24">
                <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.93V21h2v-3.07A7 7 0 0 0 19 11h-2z" />
              </svg>
            )}
          </motion.button>
        </div>

        <p className="text-white/40 text-sm">
          {isRecording ? 'Tap to stop' : hasRecorded ? 'Tap to re-record' : 'Tap to record'}
        </p>

        {hasRecorded && !isRecording && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 w-full max-w-xs"
          >
            <button
              className="w-12 h-12 rounded-full bg-[#00f0ff]/10 border border-[#00f0ff]/30 flex items-center justify-center"
              style={{ color: '#00f0ff' }}
            >
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
            <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(to right, #00f0ff, #ff00aa)' }}
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: recordingTime, ease: 'linear' }}
              />
            </div>
          </motion.div>
        )}

        <div className={cn(
          'w-full rounded-xl bg-white/[0.04] border p-4 transition-all',
          autoCaption ? 'border-[#00f0ff]/20' : 'border-white/[0.08]',
        )}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-white text-sm font-medium">Auto-caption</p>
              <p className="text-white/30 text-xs">Generate text from your voice</p>
            </div>
            <button
              onClick={() => setAutoCaption(!autoCaption)}
              className={cn(
                'w-12 h-7 rounded-full relative transition-colors duration-200',
                autoCaption ? 'bg-[#00f0ff]' : 'bg-white/20',
              )}
            >
              <motion.div
                className="absolute top-0.5 w-6 h-6 rounded-full bg-white"
                animate={{ left: autoCaption ? 22 : 2 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </button>
          </div>
          {autoCaption && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="overflow-hidden"
            >
              <div className="flex gap-2 overflow-x-auto pb-1">
                {LANGUAGES.slice(0, 5).map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => setVoiceCaptionLang(lang.code)}
                    className={cn(
                      'shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all border',
                      voiceCaptionLang === lang.code
                        ? 'border-[#00f0ff] bg-[#00f0ff]/15 shadow-[0_0_8px_rgba(0,240,255,0.25)]'
                        : 'border-white/[0.08] bg-white/[0.04] text-white/50',
                    )}
                    style={voiceCaptionLang === lang.code ? { color: '#00f0ff', textShadow: '0 0 6px rgba(0,240,255,0.3)' } : undefined}
                  >
                    {lang.flag} {lang.nativeLabel}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    )
  }

  // ---- THREAD ----
  function ThreadCanvas() {
    return (
      <div className="pt-2 pb-20 flex flex-col gap-4">
        {!selectedThread ? (
          <>
            <h3 className="text-lg font-bold text-white">Your recent threads</h3>
            <p className="text-white/40 text-sm">Select a thread to convert into a story series</p>
            <div className="flex flex-col gap-3 mt-2">
              {MOCK_THREADS.map((thread, i) => (
                <motion.button
                  key={thread.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => selectThread(thread.id)}
                  className="flex items-center gap-3 rounded-xl bg-white/[0.04] border border-white/[0.08] p-4 text-left hover:border-[#00f0ff]/20 transition-colors"
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm shrink-0"
                    style={{ background: 'rgba(0,240,255,0.15)', color: '#00f0ff', textShadow: '0 0 8px rgba(0,240,255,0.4)' }}
                  >
                    {thread.cardCount}
                  </div>
                  <div className="min-w-0">
                    <p className="text-white font-semibold text-sm truncate">{thread.title}</p>
                    <p className="text-white/40 text-xs">{thread.cardCount} cards</p>
                  </div>
                  <svg className="w-4 h-4 text-white/30 shrink-0 ml-auto" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M9 5l7 7-7 7" />
                  </svg>
                </motion.button>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">
                {MOCK_THREADS.find((t) => t.id === selectedThread)?.title}
              </h3>
              <button
                onClick={() => { setSelectedThread(null); setThreadCards([]) }}
                className="text-white/40 text-xs hover:text-[#00f0ff] transition-colors"
              >
                Change thread
              </button>
            </div>

            {threadCards.length > 0 && (
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory">
                {threadCards.map((card, i) => (
                  <motion.div
                    key={`${selectedThread}-${i}`}
                    layout
                    className={cn(
                      'relative shrink-0 w-64 rounded-2xl bg-white/[0.04] border p-4 snap-start transition-colors',
                      editingCardIndex === i ? 'border-[#00f0ff]/50 shadow-[0_0_12px_rgba(0,240,255,0.15)]' : 'border-white/[0.08]',
                    )}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold" style={{ color: '#00f0ff', textShadow: '0 0 6px rgba(0,240,255,0.3)' }}>
                        Card {i + 1}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => startEditCard(i)} className="text-white/40 hover:text-[#00f0ff] transition-colors text-xs font-medium">
                          Edit
                        </button>
                        <button onClick={() => removeThreadCard(i)} className="w-6 h-6 flex items-center justify-center rounded-full bg-white/[0.06] text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors text-xs">
                          ×
                        </button>
                      </div>
                    </div>

                    {editingCardIndex === i ? (
                      <textarea
                        value={editingCardText}
                        onChange={(e) => setEditingCardText(e.target.value)}
                        className="w-full bg-white/[0.06] rounded-lg p-2.5 text-sm text-white outline-none resize-none border border-[#00f0ff]/30 focus:border-[#00f0ff]/60"
                        rows={4}
                        autoFocus
                      />
                    ) : (
                      <p className="text-white/70 text-sm leading-relaxed line-clamp-5">{card}</p>
                    )}

                    {editingCardIndex === i && (
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={saveEditCard}
                          className="flex-1 py-1.5 rounded-lg text-white text-xs font-medium"
                          style={{ background: 'linear-gradient(135deg, #00f0ff 0%, #00b8d4 100%)' }}
                        >
                          Save
                        </button>
                        <button onClick={() => setEditingCardIndex(null)} className="flex-1 py-1.5 rounded-lg bg-white/[0.06] text-white/60 text-xs font-medium">
                          Cancel
                        </button>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}

            {threadCards.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <span className="text-4xl mb-3">🗑️</span>
                <p className="text-white/40 text-sm">All cards removed</p>
                <button
                  onClick={() => {
                    const thread = MOCK_THREADS.find((t) => t.id === selectedThread)
                    if (thread) setThreadCards([...thread.cards])
                  }}
                  className="mt-3 text-sm font-medium"
                  style={{ color: '#00f0ff', textShadow: '0 0 6px rgba(0,240,255,0.3)' }}
                >
                  Reset cards
                </button>
              </div>
            )}

            <p className="text-white/30 text-xs text-center">
              Swipe to preview all cards · {threadCards.length} card{threadCards.length !== 1 ? 's' : ''} selected
            </p>
          </>
        )}
      </div>
    )
  }

  // ---- POLL ----
  function PollCanvas() {
    const mockPercentages = useMemo(() => {
      const total = standalonePollOptions.reduce(
        (sum, o) => sum + (o.text.trim() ? Math.floor(Math.random() * 80 + 20) : 0),
        0,
      )
      if (total === 0) return standalonePollOptions.map(() => 0)
      return standalonePollOptions.map((o) =>
        o.text.trim() ? Math.round((Math.floor(Math.random() * 80 + 20) / total) * 100) : 0,
      )
    }, [standalonePollOptions])

    return (
      <div className="pt-2 pb-20 flex flex-col gap-5">
        <input
          type="text"
          value={standalonePollQuestion}
          onChange={(e) => setStandalonePollQuestion(e.target.value)}
          placeholder="Ask a question..."
          className="w-full bg-transparent text-white text-xl font-bold placeholder:text-white/20 outline-none"
        />

        <div className="flex flex-col gap-2.5">
          {standalonePollOptions.map((opt, i) => (
            <div key={opt.id} className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={opt.text}
                  onChange={(e) => updatePollOption(i, e.target.value)}
                  placeholder={`Option ${i + 1}`}
                  className="w-full bg-white/[0.06] border border-white/[0.08] rounded-xl px-3.5 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-[#00f0ff]/50 transition-colors"
                />
                {opt.text.trim() && (
                  <motion.div
                    initial={{ width: '0%' }}
                    animate={{ width: `${mockPercentages[i] || 0}%` }}
                    className="absolute inset-0 rounded-xl pointer-events-none"
                    style={{ background: 'rgba(0,240,255,0.1)' }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  />
                )}
              </div>
              <span className="text-white/30 text-xs w-10 text-right tabular-nums">
                {opt.text.trim() ? `${mockPercentages[i]}%` : ''}
              </span>
              {standalonePollOptions.length > 2 && (
                <button onClick={() => removePollOption(i)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/[0.06] text-white/40 hover:text-red-400 transition-colors text-lg">
                  ×
                </button>
              )}
            </div>
          ))}
          {standalonePollOptions.length < 4 && (
            <button onClick={addPollOption} className="self-start flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-colors bg-[#00f0ff]/10 border border-[#00f0ff]/30 text-[#00f0ff] hover:bg-[#00f0ff]/20">
              <span className="text-sm">+</span> Add option
            </button>
          )}
        </div>

        <div>
          <p className="text-white/30 text-xs mb-2">Reaction emojis</p>
          <div className="flex gap-2">
            {pollReactionEmojis.map((emoji, i) => (
              <motion.button
                key={i}
                whileTap={{ scale: 0.85 }}
                onClick={() => setPollReactionEmojis((prev) => prev.filter((_, idx) => idx !== i))}
                className="w-10 h-10 rounded-lg bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-lg hover:border-[#00f0ff]/30 transition-colors"
              >
                {emoji}
              </motion.button>
            ))}
            <button
              onClick={() => {
                const emojis = ['😂', '❤️', '🤔', '😤', '🙌', '💯', '🎉', '😢', '🤩', '👏']
                const random = emojis[Math.floor(Math.random() * emojis.length)]
                if (pollReactionEmojis.length < 8) setPollReactionEmojis((prev) => [...prev, random])
              }}
              className="w-10 h-10 rounded-lg bg-[#00f0ff]/10 border border-[#00f0ff]/30 flex items-center justify-center text-lg font-bold hover:bg-[#00f0ff]/20 transition-colors"
              style={{ color: '#00f0ff' }}
            >
              +
            </button>
          </div>
        </div>

        {standalonePollQuestion.trim() && standalonePollOptions.some((o) => o.text.trim()) && (
          <div className="rounded-2xl bg-white/[0.04] border border-[#00f0ff]/20 p-5">
            <p className="text-white/30 text-xs mb-3 font-medium uppercase tracking-wider">Live Preview</p>
            <p className="text-white font-bold text-base mb-4">{standalonePollQuestion || 'Your question here'}</p>
            <div className="flex flex-col gap-2">
              {standalonePollOptions.filter((o) => o.text.trim()).map((opt) => {
                const pct = mockPercentages[standalonePollOptions.indexOf(opt)] || 0
                return (
                  <div key={opt.id} className="relative">
                    <motion.div
                      initial={{ width: '0%' }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut', delay: standalonePollOptions.indexOf(opt) * 0.1 }}
                      className="absolute inset-0 rounded-xl"
                      style={{ background: 'rgba(0,240,255,0.15)' }}
                    />
                    <div className="relative flex items-center justify-between px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                      <span className="text-white text-sm">{opt.text}</span>
                      <span className="text-sm font-bold tabular-nums" style={{ color: '#00f0ff', textShadow: '0 0 6px rgba(0,240,255,0.3)' }}>
                        {pct}%
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    )
  }

  // ---- FESTIVAL ----
  function FestivalCanvas() {
    return (
      <div className="pt-2 pb-20 flex flex-col gap-4">
        {!selectedFestival ? (
          <>
            <h3 className="text-lg font-bold text-white">Festival Templates</h3>
            <p className="text-white/40 text-sm">Choose a template and add your message</p>
            <div className="grid grid-cols-2 gap-3 mt-1">
              {FESTIVAL_TEMPLATES.map((tpl, i) => (
                <motion.button
                  key={tpl.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05, type: 'spring', stiffness: 300, damping: 25 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedFestival(tpl)}
                  className="relative rounded-2xl overflow-hidden aspect-[3/4] flex flex-col items-center justify-end p-4 hover:shadow-[0_0_20px_rgba(0,240,255,0.2)] transition-shadow border border-transparent hover:border-[#00f0ff]/30"
                >
                  <span className="text-5xl mb-3 drop-shadow-lg">{tpl.emoji}</span>
                  <span className="font-bold text-sm drop-shadow-md" style={{ color: tpl.textColor }}>{tpl.name}</span>
                </motion.button>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Customise Card</h3>
              <button onClick={() => { setSelectedFestival(null); setFestivalMessage('') }} className="text-white/40 text-xs hover:text-[#00f0ff] transition-colors">
                Change template
              </button>
            </div>
            <div
              className="relative rounded-2xl overflow-hidden aspect-[3/4] flex flex-col items-center justify-end p-6 border border-[#00f0ff]/20"
              style={{ background: selectedFestival.gradient }}
            >
              <span className="text-6xl mb-4 drop-shadow-lg">{selectedFestival.emoji}</span>
              <textarea
                value={festivalMessage}
                onChange={(e) => setFestivalMessage(e.target.value)}
                placeholder="Type your message..."
                className="w-full bg-transparent text-center text-white placeholder:text-white/40 outline-none resize-none font-bold text-lg drop-shadow-md"
                style={{ color: selectedFestival.textColor }}
                rows={3}
                autoFocus
              />
              <p className="text-xs mt-3 font-medium drop-shadow-sm opacity-60" style={{ color: selectedFestival.textColor }}>
                {selectedFestival.name} Greetings
              </p>
            </div>
          </>
        )}
      </div>
    )
  }

  // ---- CRICKET ----
  function CricketCanvas() {
    return (
      <div className="pt-2 pb-20 flex flex-col gap-5">
        {!selectedMatch ? (
          <>
            <h3 className="text-lg font-bold text-white">Live Matches</h3>
            <p className="text-white/40 text-sm">Select a match to add your take</p>
            <div className="flex flex-col gap-3 mt-2">
              {MOCK_MATCHES.map((match, i) => (
                <motion.button
                  key={match.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedMatch(match.id)}
                  className="rounded-xl bg-white/[0.04] border border-white/[0.08] p-4 text-left hover:border-[#00f0ff]/20 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 animate-pulse">{match.status}</span>
                    <span className="text-white/30 text-xs">{match.venue}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{match.team1Flag}</span>
                      <div>
                        <p className="text-white font-bold text-sm">{match.team1}</p>
                        <p className="text-white/60 text-xs">{match.team1Score}/{match.overs} ov</p>
                      </div>
                    </div>
                    <span className="text-white/20 text-xs font-bold">VS</span>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <p className="text-white font-bold text-sm">{match.team2}</p>
                        <p className="text-white/60 text-xs">{match.team2Score}</p>
                      </div>
                      <span className="text-2xl">{match.team2Flag}</span>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </>
        ) : (
          <>
            {selectedMatchData && (
              <div className="rounded-2xl bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border border-[#00f0ff]/20 p-5 shadow-[0_0_16px_rgba(0,240,255,0.1)]">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 animate-pulse">{selectedMatchData.status}</span>
                  <span className="text-white/30 text-xs">{selectedMatchData.venue}</span>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <span className="text-3xl">{selectedMatchData.team1Flag}</span>
                    <div>
                      <p className="text-white font-bold">{selectedMatchData.team1}</p>
                      <p className="font-mono text-lg font-bold" style={{ color: '#00f0ff', textShadow: '0 0 8px rgba(0,240,255,0.4)' }}>{selectedMatchData.team1Score}</p>
                    </div>
                  </div>
                  <span className="text-white/20 text-xs">vs</span>
                  <div className="flex items-center gap-2.5">
                    <div className="text-right">
                      <p className="text-white font-bold">{selectedMatchData.team2}</p>
                      <p className="text-white/60 font-mono text-lg">{selectedMatchData.team2Score}</p>
                    </div>
                    <span className="text-3xl">{selectedMatchData.team2Flag}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-white/30 text-xs">Overs:</span>
                  <span className="text-white/70 text-xs font-mono">{selectedMatchData.overs}</span>
                </div>
              </div>
            )}

            <div>
              <label className="text-white/40 text-xs mb-2 block">Add your take</label>
              <textarea
                value={cricketCommentary}
                onChange={(e) => setCricketCommentary(e.target.value)}
                placeholder="What do you think about this match?"
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder:text-white/30 outline-none resize-none text-sm focus:border-[#00f0ff]/50 transition-colors"
                rows={3}
              />
            </div>

            {cricketCommentary.trim() && selectedMatchData && (
              <div className="rounded-2xl overflow-hidden border border-[#00f0ff]/15">
                <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] p-5 flex flex-col items-center justify-center min-h-[200px]">
                  <div className="flex items-center gap-6 mb-4">
                    <div className="text-center">
                      <span className="text-3xl">{selectedMatchData.team1Flag}</span>
                      <p className="text-white/50 text-xs mt-1">{selectedMatchData.team1}</p>
                    </div>
                    <div>
                      <p className="font-mono font-bold text-sm" style={{ color: '#00f0ff', textShadow: '0 0 8px rgba(0,240,255,0.4)' }}>{selectedMatchData.team1Score}</p>
                      <p className="text-white/30 text-[10px]">vs</p>
                      <p className="text-white/60 font-mono font-bold text-sm">{selectedMatchData.team2Score}</p>
                    </div>
                    <div className="text-center">
                      <span className="text-3xl">{selectedMatchData.team2Flag}</span>
                      <p className="text-white/50 text-xs mt-1">{selectedMatchData.team2}</p>
                    </div>
                  </div>
                  <div className="w-16 h-[1px] bg-[#00f0ff]/20 mb-4" />
                  <p className="text-white text-sm text-center font-medium leading-relaxed px-2">&ldquo;{cricketCommentary}&rdquo;</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    )
  }

  // ---- FEED ----
  function FeedCanvas() {
    return (
      <div className="pt-4 pb-20 flex flex-col gap-5">
        <h3 className="text-lg font-bold text-white">Share a Post</h3>
        <p className="text-white/40 text-sm">Paste a URL from a post or article</p>

        <div>
          <label className="text-white/40 text-xs mb-2 block">Post URL</label>
          <div className="relative">
            <input
              type="url"
              value={feedUrl}
              onChange={(e) => setFeedUrl(e.target.value)}
              placeholder="https://example.com/post/..."
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-[#00f0ff]/50 transition-colors pr-12"
            />
            {feedUrl.trim() && (
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#39ff14]/20 flex items-center justify-center"
                style={{ color: '#39ff14' }}
              >
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M5 13l4 4L19 7" />
                </svg>
              </motion.button>
            )}
          </div>
        </div>

        <div>
          <label className="text-white/40 text-xs mb-2 block">Add a caption (optional)</label>
          <textarea
            value={feedCaption}
            onChange={(e) => setFeedCaption(e.target.value)}
            placeholder="What do you think about this?"
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none resize-none focus:border-[#00f0ff]/50 transition-colors"
            rows={3}
          />
        </div>

        {feedUrl.trim() && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-white/[0.04] border border-[#00f0ff]/15 overflow-hidden"
          >
            <div className="h-32 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(0,240,255,0.15) 0%, rgba(255,0,170,0.1) 100%)' }}>
              <span className="text-4xl">📰</span>
            </div>
            <div className="p-4">
              <p className="text-white/30 text-xs mb-1">article.example.com</p>
              <p className="text-white font-semibold text-sm mb-1">{feedCaption || 'Shared post from the feed'}</p>
              <p className="text-white/40 text-xs truncate">{feedUrl}</p>
            </div>
          </motion.div>
        )}
      </div>
    )
  }

  // =========================================================================
  // RENDER
  // =========================================================================

  if (!open) return null

  const currentLang = LANGUAGES.find((l) => l.code === language)

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-[#0a0a0f] flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* ============ HEADER ============ */}
      <header className="flex items-center justify-between px-4 py-3 shrink-0 relative z-30">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onClose}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-white/[0.06] text-white/70 hover:text-white transition-colors"
        >
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 5l10 10M15 5L5 15" />
          </svg>
        </motion.button>

        <h1
          className="text-sm font-bold tracking-wide"
          style={{ color: '#00f0ff', textShadow: '0 0 10px rgba(0,240,255,0.5)' }}
        >
          Create Story
        </h1>

        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={handlePublish}
          disabled={publishing || published}
          className={cn(
            'relative px-5 py-2 rounded-full text-sm font-bold transition-all overflow-hidden',
            (publishing || published) ? 'bg-white/20 text-white/40 cursor-wait' : 'text-[#0a0a0f]',
          )}
          style={
            !publishing && !published
              ? { background: 'linear-gradient(135deg, #00f0ff 0%, #ff00aa 100%)', boxShadow: '0 0 20px rgba(0,240,255,0.4), 0 0 40px rgba(255,0,170,0.2)' }
              : undefined
          }
        >
          {publishing && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
          )}
          <span className="relative z-10 flex items-center gap-1.5">
            {publishing ? (
              <>
                <svg className="animate-spin" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
                </svg>
                Posting...
              </>
            ) : published ? (
              '✓ Done'
            ) : (
              'Post'
            )}
          </span>
        </motion.button>
      </header>

      {/* ============ COLLAPSIBLE OPTIONS ROW ============ */}
      <div className="shrink-0 px-4 pb-2 relative z-20">
        <div className="flex items-center gap-2">
          {/* Audience */}
          <div className="relative">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => { setAudienceOpen(!audienceOpen); setExpiryOpen(false); setLanguageOpen(false) }}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border',
                audienceOpen
                  ? 'border-[#00f0ff] bg-[#00f0ff]/10 shadow-[0_0_12px_rgba(0,240,255,0.3)]'
                  : 'border-white/[0.08] bg-white/[0.04] text-white/60',
              )}
            >
              <span>{AUDIENCE_OPTIONS.find((a) => a.value === audience)?.icon}</span>
              <span>{AUDIENCE_OPTIONS.find((a) => a.value === audience)?.label}</span>
              <svg className={cn('w-3 h-3 transition-transform', audienceOpen && 'rotate-180')} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" /></svg>
            </motion.button>
            <AnimatePresence>
              {audienceOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full left-0 mt-1.5 bg-[#13131a] border border-[#00f0ff]/20 rounded-xl shadow-[0_0_20px_rgba(0,240,255,0.15)] p-1.5 min-w-[160px] z-50"
                >
                  {AUDIENCE_OPTIONS.map((opt) => (
                    <motion.button
                      key={opt.value}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => { setAudience(opt.value); setAudienceOpen(false) }}
                      className={cn(
                        'flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs font-medium transition-all',
                        audience === opt.value
                          ? 'bg-[#00f0ff]/15 text-[#00f0ff]'
                          : 'text-white/60 hover:text-white hover:bg-white/[0.04]',
                      )}
                    >
                      <span>{opt.icon}</span>
                      <span>{opt.label}</span>
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Expiry */}
          <div className="relative">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => { setExpiryOpen(!expiryOpen); setAudienceOpen(false); setLanguageOpen(false) }}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border',
                expiryOpen
                  ? 'border-[#00f0ff] bg-[#00f0ff]/10 shadow-[0_0_12px_rgba(0,240,255,0.3)]'
                  : 'border-white/[0.08] bg-white/[0.04] text-white/60',
              )}
            >
              <span>⏱</span>
              <span>{EXPIRY_OPTIONS.find((e) => e.value === expiry)?.label}</span>
              <svg className={cn('w-3 h-3 transition-transform', expiryOpen && 'rotate-180')} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" /></svg>
            </motion.button>
            <AnimatePresence>
              {expiryOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full left-0 mt-1.5 bg-[#13131a] border border-[#00f0ff]/20 rounded-xl shadow-[0_0_20px_rgba(0,240,255,0.15)] p-1.5 min-w-[140px] z-50"
                >
                  {EXPIRY_OPTIONS.map((opt) => (
                    <motion.button
                      key={opt.value}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => { setExpiry(opt.value); setExpiryOpen(false) }}
                      className={cn(
                        'flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs font-medium transition-all',
                        expiry === opt.value
                          ? 'bg-[#00f0ff]/15 text-[#00f0ff]'
                          : 'text-white/60 hover:text-white hover:bg-white/[0.04]',
                      )}
                    >
                      <span>{opt.label}</span>
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Language */}
          <div className="relative">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => { setLanguageOpen(!languageOpen); setAudienceOpen(false); setExpiryOpen(false) }}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border',
                languageOpen
                  ? 'border-[#00f0ff] bg-[#00f0ff]/10 shadow-[0_0_12px_rgba(0,240,255,0.3)]'
                  : 'border-white/[0.08] bg-white/[0.04] text-white/60',
              )}
            >
              <span>{currentLang?.flag}</span>
              <span>{currentLang?.nativeLabel}</span>
              <svg className={cn('w-3 h-3 transition-transform', languageOpen && 'rotate-180')} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" /></svg>
            </motion.button>
            <AnimatePresence>
              {languageOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full left-0 mt-1.5 bg-[#13131a] border border-[#00f0ff]/20 rounded-xl shadow-[0_0_20px_rgba(0,240,255,0.15)] p-1.5 min-w-[160px] max-h-[200px] overflow-y-auto z-50"
                >
                  {LANGUAGES.map((lang) => (
                    <motion.button
                      key={lang.code}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => { setLanguage(lang.code); setLanguageOpen(false) }}
                      className={cn(
                        'flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs font-medium transition-all',
                        language === lang.code
                          ? 'bg-[#00f0ff]/15 text-[#00f0ff]'
                          : 'text-white/60 hover:text-white hover:bg-white/[0.04]',
                      )}
                    >
                      <span>{lang.flag}</span>
                      <span>{lang.nativeLabel}</span>
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ============ SCROLLABLE CANVAS AREA ============ */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden relative z-10" onClick={closeDropdowns}>
        <AnimatePresence mode="wait">
          <motion.div
            key={format}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="px-4 pb-4"
          >
            {format === 'text' && <TextCanvas />}
            {format === 'voice' && <VoiceCanvas />}
            {format === 'thread' && <ThreadCanvas />}
            {format === 'poll' && <PollCanvas />}
            {format === 'festival' && <FestivalCanvas />}
            {format === 'cricket' && <CricketCanvas />}
            {format === 'feed' && <FeedCanvas />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ============ FORMAT STRIP (Bottom) ============ */}
      <div className="shrink-0 z-20 border-t border-white/[0.06] bg-[#0a0a0f]/90 backdrop-blur-xl">
        <div className="flex items-center gap-2 px-4 py-3 overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {FORMAT_OPTIONS.map((fmt) => (
            <motion.button
              key={fmt.value}
              whileTap={{ scale: 0.92 }}
              onClick={() => setFormat(fmt.value)}
              className={cn(
                'flex items-center gap-1.5 px-3.5 py-2 rounded-full whitespace-nowrap text-xs font-medium transition-all shrink-0 border',
                format === fmt.value
                  ? 'border-[#00f0ff] bg-[#00f0ff]/10 shadow-[0_0_12px_rgba(0,240,255,0.3)]'
                  : 'border-white/[0.08] bg-white/[0.04] text-white/50 hover:text-white/70',
              )}
              style={format === fmt.value ? { color: '#00f0ff', textShadow: '0 0 8px rgba(0,240,255,0.4)' } : undefined}
            >
              <span className={cn('text-sm', format === fmt.value && 'drop-shadow-[0_0_6px_rgba(0,240,255,0.6)]')}>
                {fmt.icon}
              </span>
              <span>{fmt.label}</span>
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
