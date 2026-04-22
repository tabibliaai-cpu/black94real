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
// Animation helpers
// ---------------------------------------------------------------------------

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction > 0 ? -300 : 300,
    opacity: 0,
  }),
}

const springTransition = { type: 'spring' as const, stiffness: 300, damping: 30 }

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function StoryCreator({ open, onClose, onStoryPublished }: StoryCreatorProps) {
  // ---- State ----
  const [step, setStep] = useState(1)
  const [direction, setDirection] = useState(1)
  const [format, setFormat] = useState<StoryFormat | null>(null)
  const [language, setLanguage] = useState<Language>('en')
  const [audience, setAudience] = useState<StoryAudience>('everyone')
  const [expiry, setExpiry] = useState<StoryExpiry>('24h')
  const [region, setRegion] = useState('all_india')
  const [publishing, setPublishing] = useState(false)
  const [published, setPublished] = useState(false)

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

  const totalSteps = 5

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

  // Reset step-related state when format changes
  useEffect(() => {
    if (!open) {
      // Full reset on close
      setStep(1)
      setFormat(null)
      setLanguage('en')
      setAudience('everyone')
      setExpiry('24h')
      setRegion('all_india')
      setPublishing(false)
      setPublished(false)
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

  // ---- Navigation ----

  const goNext = useCallback(() => {
    if (step < totalSteps) {
      setDirection(1)
      setStep((s) => s + 1)
    }
  }, [step])

  const goBack = useCallback(() => {
    if (step > 1) {
      setDirection(-1)
      setStep((s) => s - 1)
    }
  }, [step])

  // ---- Can proceed ----

  const canProceed = useMemo(() => {
    switch (step) {
      case 1:
        return format !== null
      case 2:
        return true
      case 3:
        return checkStep3Content()
      case 4:
        return true
      case 5:
        return true
      default:
        return false
    }
  }, [step, format, textContent, textPollEnabled, pollOptions, hasRecorded, selectedThread, standalonePollQuestion, standalonePollOptions, selectedFestival, festivalMessage, selectedMatch, cricketCommentary, feedUrl])

  function checkStep3Content(): boolean {
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

  const handlePublish = useCallback(async () => {
    setPublishing(true)
    // Simulate upload
    await new Promise((r) => setTimeout(r, 1500))
    confetti({ particleCount: 150, spread: 80, origin: { y: 0.7 } })
    setPublishing(false)
    setPublished(true)
    toast.success('Story published! 🎉')
    const story = buildStory()
    onStoryPublished(story)
    setTimeout(() => {
      onClose()
    }, 2000)
  }, [onStoryPublished, onClose, format, textContent, textGradient, textPollEnabled, pollOptions, voiceWaveform, recordingTime, threadCards, standalonePollQuestion, standalonePollOptions, selectedFestival, festivalMessage, selectedMatchData, cricketCommentary, feedUrl, feedCaption, language])

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

  // =========================================================================
  // RENDER
  // =========================================================================

  if (!open) return null

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-black flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      {/* ---- Top Bar ---- */}
      <header className="flex items-center justify-between px-4 py-3 shrink-0">
        <button
          onClick={step > 1 ? goBack : onClose}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/[0.06] text-white"
        >
          {step > 1 ? (
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M13 4L7 10l6 6" />
            </svg>
          ) : (
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 5l10 10M15 5L5 15" />
            </svg>
          )}
        </button>

        <div className="flex items-center gap-1.5">
          {Array.from({ length: totalSteps }, (_, i) => (
            <motion.div
              key={i}
              className={cn(
                'h-1.5 rounded-full transition-all duration-300',
                step === i + 1
                  ? 'w-6 bg-[#FFFFFF]'
                  : i + 1 < step
                    ? 'w-3 bg-[#FFFFFF]/50'
                    : 'w-3 bg-white/20',
              )}
              layout
            />
          ))}
        </div>

        <span className="text-white/40 text-xs font-medium tabular-nums">
          Step {step} of {totalSteps}
        </span>
      </header>

      {/* ---- Step Content ---- */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={springTransition}
            className="absolute inset-0 overflow-y-auto px-4 pb-4"
          >
            {step === 1 && <StepFormatPicker selected={format} onSelect={setFormat} />}
            {step === 2 && <StepLanguageSelector selected={language} onSelect={setLanguage} />}
            {step === 3 && <StepCreationCanvas format={format} />}
            {step === 4 && (
              <StepAudienceExpiry
                audience={audience}
                onAudienceChange={setAudience}
                expiry={expiry}
                onExpiryChange={setExpiry}
                region={region}
                onRegionChange={setRegion}
              />
            )}
            {step === 5 && <StepPublish publishing={publishing} published={published} onPublish={handlePublish} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ---- Bottom Button ---- */}
      {step < totalSteps && (
        <div className="px-4 pb-6 pt-2 shrink-0">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={goNext}
            disabled={!canProceed}
            className={cn(
              'w-full py-4 rounded-2xl text-white font-semibold text-base transition-all duration-200',
              canProceed
                ? 'bg-[#FFFFFF] shadow-lg shadow-[#FFFFFF]/25'
                : 'bg-white/[0.08] text-white/30 cursor-not-allowed',
            )}
          >
            Next
          </motion.button>
        </div>
      )}
    </motion.div>
  )

  // =========================================================================
  // Step 1 — Format Picker
  // =========================================================================

  function StepFormatPicker({
    selected,
    onSelect,
  }: {
    selected: StoryFormat | null
    onSelect: (f: StoryFormat) => void
  }) {
    return (
      <div className="pt-4">
        <h2 className="text-xl font-bold text-white mb-1">Create a Story</h2>
        <p className="text-white/40 text-sm mb-6">Choose a format to get started</p>

        <div className="grid grid-cols-2 gap-3">
          {FORMAT_OPTIONS.map((fmt, i) => (
            <motion.button
              key={fmt.value}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, type: 'spring', stiffness: 300, damping: 25 }}
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.02 }}
              onClick={() => onSelect(fmt.value)}
              className={cn(
                'flex flex-col items-start rounded-2xl p-4 text-left transition-all duration-200',
                selected === fmt.value
                  ? 'border border-[#FFFFFF] bg-[#FFFFFF]/10'
                  : 'border border-white/[0.08] bg-white/[0.04]',
              )}
            >
              <span className="text-[32px] leading-none mb-3">{fmt.icon}</span>
              <span className="text-white font-bold text-sm">{fmt.label}</span>
              <span className="text-white/40 text-xs mt-0.5">{fmt.desc}</span>
            </motion.button>
          ))}
        </div>
      </div>
    )
  }

  // =========================================================================
  // Step 2 — Language Selector
  // =========================================================================

  function StepLanguageSelector({
    selected,
    onSelect,
  }: {
    selected: Language
    onSelect: (l: Language) => void
  }) {
    return (
      <div className="pt-4">
        <h2 className="text-xl font-bold text-white mb-1">Choose Language</h2>
        <p className="text-white/40 text-sm mb-6">Select the primary language of your story</p>

        <div className="flex gap-2.5 overflow-x-auto pb-2 -mx-1 px-1">
          {LANGUAGES.map((lang) => (
            <motion.button
              key={lang.code}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSelect(lang.code)}
              className={cn(
                'relative flex items-center gap-2 px-4 py-2.5 rounded-full whitespace-nowrap text-sm font-medium transition-colors shrink-0',
                selected === lang.code
                  ? 'bg-[#FFFFFF] text-white'
                  : 'bg-white/[0.06] text-white/60',
              )}
            >
              {selected === lang.code && (
                <motion.div
                  layoutId="lang-pill"
                  className="absolute inset-0 bg-[#FFFFFF] rounded-full"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10">{lang.flag}</span>
              <span className="relative z-10">{lang.nativeLabel}</span>
            </motion.button>
          ))}
        </div>

        <div className="mt-8 rounded-2xl bg-white/[0.04] border border-white/[0.08] p-5">
          <p className="text-white/30 text-xs mb-2">Selected language</p>
          <div className="flex items-center gap-3">
            <span className="text-2xl">
              {LANGUAGES.find((l) => l.code === selected)?.flag}
            </span>
            <div>
              <p className="text-white font-semibold">
                {LANGUAGES.find((l) => l.code === selected)?.nativeLabel}
              </p>
              <p className="text-white/40 text-sm">
                {LANGUAGES.find((l) => l.code === selected)?.label}
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // =========================================================================
  // Step 3 — Creation Canvas
  // =========================================================================

  function StepCreationCanvas({ format: fmt }: { format: StoryFormat | null }) {
    if (!fmt) return null

    switch (fmt) {
      case 'text':
        return <TextCanvas />
      case 'voice':
        return <VoiceCanvas />
      case 'thread':
        return <ThreadCanvas />
      case 'poll':
        return <PollCanvas />
      case 'festival':
        return <FestivalCanvas />
      case 'cricket':
        return <CricketCanvas />
      case 'feed':
        return <FeedCanvas />
      default:
        return null
    }
  }

  // ---- TEXT ----

  function TextCanvas() {
    return (
      <div className="pt-2 flex flex-col gap-4">
        {/* Preview / canvas */}
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

        {/* Font size picker */}
        <div className="flex items-center gap-2">
          <span className="text-white/40 text-xs mr-1">Size</span>
          {(['S', 'M', 'L'] as const).map((size) => (
            <motion.button
              key={size}
              whileTap={{ scale: 0.92 }}
              onClick={() => setTextFontSize(size)}
              className={cn(
                'px-3.5 py-1.5 rounded-full text-xs font-bold transition-all',
                textFontSize === size
                  ? 'bg-[#FFFFFF] text-white'
                  : 'bg-white/[0.06] text-white/50',
              )}
            >
              {size}
            </motion.button>
          ))}
        </div>

        {/* Color picker */}
        <div className="flex items-center gap-2.5">
          <span className="text-white/40 text-xs mr-1">BG</span>
          {GRADIENT_COLORS.map((grad, i) => (
            <motion.button
              key={i}
              whileTap={{ scale: 0.9 }}
              onClick={() => setTextGradient(grad)}
              className={cn(
                'w-8 h-8 rounded-full shrink-0 transition-all border-2',
                textGradient === grad ? 'border-white scale-110' : 'border-transparent',
              )}
              style={{ background: grad }}
            />
          ))}
        </div>

        {/* Inline poll toggle */}
        <div className="flex items-center justify-between rounded-xl bg-white/[0.04] border border-white/[0.08] p-3.5">
          <div>
            <p className="text-white text-sm font-medium">Add live poll below</p>
            <p className="text-white/30 text-xs">Let viewers vote on options</p>
          </div>
          <button
            onClick={() => setTextPollEnabled(!textPollEnabled)}
            className={cn(
              'w-12 h-7 rounded-full relative transition-colors duration-200',
              textPollEnabled ? 'bg-[#FFFFFF]' : 'bg-white/20',
            )}
          >
            <motion.div
              className="absolute top-0.5 w-6 h-6 rounded-full bg-white"
              animate={{ left: textPollEnabled ? 22 : 2 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          </button>
        </div>

        {/* Inline poll options */}
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
                      className="flex-1 bg-white/[0.06] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-[#FFFFFF]/50 transition-colors"
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
                    className="self-start flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.06] text-white/50 text-xs hover:bg-white/[0.1] transition-colors"
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
      <div className="pt-4 flex flex-col items-center gap-6">
        {/* Waveform */}
        <div className="flex items-center justify-center gap-[3px] h-24 w-full max-w-xs">
          {(voiceWaveform.length > 0
            ? voiceWaveform
            : Array.from({ length: 20 }, () => 8)
          ).map((h, i) => (
            <motion.div
              key={i}
              className="w-[5px] rounded-full bg-[#FFFFFF]"
              animate={{
                height: `${Math.max(4, h)}%`,
              }}
              transition={{
                duration: 0.15,
                ease: 'easeOut',
              }}
              style={{
                minHeight: 4,
                height: `${Math.max(4, h)}%`,
              }}
            />
          ))}
        </div>

        {/* Timer */}
        <div className="text-center">
          <p className="text-white font-mono text-3xl tabular-nums font-bold tracking-wider">
            {formatTime(recordingTime)}
          </p>
          <p className="text-white/30 text-sm mt-1">/ 01:00</p>
        </div>

        {/* Record button */}
        <div className="relative flex items-center justify-center">
          {/* Pulse rings when recording */}
          <AnimatePresence>
            {isRecording && (
              <>
                {[0, 1, 2].map((ring) => (
                  <motion.div
                    key={ring}
                    initial={{ scale: 1, opacity: 0.6 }}
                    animate={{ scale: 2.2 + ring * 0.4, opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{
                      duration: 1.2,
                      repeat: Infinity,
                      delay: ring * 0.3,
                      ease: 'easeOut',
                    }}
                    className="absolute w-20 h-20 rounded-full border-2 border-red-500/40"
                  />
                ))}
              </>
            )}
          </AnimatePresence>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={toggleRecording}
            className={cn(
              'relative z-10 w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all duration-200',
              isRecording
                ? 'bg-red-500 shadow-red-500/30'
                : 'bg-red-500 shadow-red-500/20',
            )}
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

        {/* Playback controls */}
        {hasRecorded && !isRecording && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4"
          >
            <button className="w-12 h-12 rounded-full bg-white/[0.06] flex items-center justify-center text-white">
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
            <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-[#FFFFFF] rounded-full"
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: recordingTime, ease: 'linear' }}
              />
            </div>
          </motion.div>
        )}

        {/* Auto-caption toggle */}
        <div className="w-full rounded-xl bg-white/[0.04] border border-white/[0.08] p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-white text-sm font-medium">Auto-caption</p>
              <p className="text-white/30 text-xs">Generate text from your voice</p>
            </div>
            <button
              onClick={() => setAutoCaption(!autoCaption)}
              className={cn(
                'w-12 h-7 rounded-full relative transition-colors duration-200',
                autoCaption ? 'bg-[#FFFFFF]' : 'bg-white/20',
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
                      'shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                      voiceCaptionLang === lang.code
                        ? 'bg-[#FFFFFF] text-white'
                        : 'bg-white/[0.06] text-white/50',
                    )}
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
      <div className="pt-2 flex flex-col gap-4">
        {!selectedThread ? (
          <>
            <h3 className="text-lg font-bold text-white">Your recent threads</h3>
            <p className="text-white/40 text-sm">
              Select a thread to convert into a story series
            </p>
            <div className="flex flex-col gap-3 mt-2">
              {MOCK_THREADS.map((thread, i) => (
                <motion.button
                  key={thread.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => selectThread(thread.id)}
                  className="flex items-center gap-3 rounded-xl bg-white/[0.04] border border-white/[0.08] p-4 text-left"
                >
                  <div className="w-10 h-10 rounded-lg bg-[#FFFFFF]/20 flex items-center justify-center text-[#FFFFFF] font-bold text-sm shrink-0">
                    {thread.cardCount}
                  </div>
                  <div className="min-w-0">
                    <p className="text-white font-semibold text-sm truncate">
                      {thread.title}
                    </p>
                    <p className="text-white/40 text-xs">
                      {thread.cardCount} cards
                    </p>
                  </div>
                  <svg
                    className="w-4 h-4 text-white/30 shrink-0 ml-auto"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
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
                onClick={() => {
                  setSelectedThread(null)
                  setThreadCards([])
                }}
                className="text-white/40 text-xs hover:text-white transition-colors"
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
                    className="relative shrink-0 w-64 rounded-2xl bg-white/[0.04] border border-white/[0.08] p-4 snap-start"
                  >
                    {/* Card number */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[#FFFFFF] text-xs font-bold">
                        Card {i + 1}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => startEditCard(i)}
                          className="text-white/40 hover:text-[#FFFFFF] transition-colors text-xs font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => removeThreadCard(i)}
                          className="w-6 h-6 flex items-center justify-center rounded-full bg-white/[0.06] text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors text-xs"
                        >
                          ×
                        </button>
                      </div>
                    </div>

                    {editingCardIndex === i ? (
                      <textarea
                        value={editingCardText}
                        onChange={(e) => setEditingCardText(e.target.value)}
                        className="w-full bg-white/[0.06] rounded-lg p-2.5 text-sm text-white outline-none resize-none border border-[#FFFFFF]/30"
                        rows={4}
                        autoFocus
                      />
                    ) : (
                      <p className="text-white/70 text-sm leading-relaxed line-clamp-5">
                        {card}
                      </p>
                    )}

                    {editingCardIndex === i && (
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={saveEditCard}
                          className="flex-1 py-1.5 rounded-lg bg-[#FFFFFF] text-white text-xs font-medium"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingCardIndex(null)}
                          className="flex-1 py-1.5 rounded-lg bg-white/[0.06] text-white/60 text-xs font-medium"
                        >
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
                  className="mt-3 text-[#FFFFFF] text-sm font-medium"
                >
                  Reset cards
                </button>
              </div>
            )}

            <p className="text-white/30 text-xs text-center">
              Swipe to preview all cards • {threadCards.length} card{threadCards.length !== 1 ? 's' : ''} selected
            </p>
          </>
        )}
      </div>
    )
  }

  // ---- POLL ----

  function PollCanvas() {
    // Compute mock percentages for the live preview
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
      <div className="pt-2 flex flex-col gap-5">
        {/* Question */}
        <input
          type="text"
          value={standalonePollQuestion}
          onChange={(e) => setStandalonePollQuestion(e.target.value)}
          placeholder="Ask a question..."
          className="w-full bg-transparent text-white text-xl font-bold placeholder:text-white/20 outline-none"
        />

        {/* Options */}
        <div className="flex flex-col gap-2.5">
          {standalonePollOptions.map((opt, i) => (
            <div key={opt.id} className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={opt.text}
                  onChange={(e) => updatePollOption(i, e.target.value)}
                  placeholder={`Option ${i + 1}`}
                  className="w-full bg-white/[0.06] border border-white/[0.08] rounded-xl px-3.5 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-[#FFFFFF]/50 transition-colors"
                />
                {/* Mock percentage bar */}
                {opt.text.trim() && (
                  <motion.div
                    initial={{ width: '0%' }}
                    animate={{ width: `${mockPercentages[i] || 0}%` }}
                    className="absolute inset-0 bg-[#FFFFFF]/15 rounded-xl pointer-events-none"
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  />
                )}
              </div>
              <span className="text-white/30 text-xs w-10 text-right tabular-nums">
                {opt.text.trim() ? `${mockPercentages[i]}%` : ''}
              </span>
              {standalonePollOptions.length > 2 && (
                <button
                  onClick={() => removePollOption(i)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white/[0.06] text-white/40 hover:text-red-400 transition-colors text-lg"
                >
                  ×
                </button>
              )}
            </div>
          ))}
          {standalonePollOptions.length < 4 && (
            <button
              onClick={addPollOption}
              className="self-start flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.06] text-white/50 text-xs hover:bg-white/[0.1] transition-colors"
            >
              <span className="text-sm">+</span> Add option
            </button>
          )}
        </div>

        {/* Reaction emojis row */}
        <div>
          <p className="text-white/30 text-xs mb-2">Reaction emojis</p>
          <div className="flex gap-2">
            {pollReactionEmojis.map((emoji, i) => (
              <motion.button
                key={i}
                whileTap={{ scale: 0.85 }}
                onClick={() => {
                  setPollReactionEmojis((prev) =>
                    prev.filter((_, idx) => idx !== i),
                  )
                }}
                className="w-10 h-10 rounded-lg bg-white/[0.06] flex items-center justify-center text-lg hover:bg-white/[0.1] transition-colors"
              >
                {emoji}
              </motion.button>
            ))}
            <button
              onClick={() => {
                const emojis = ['😂', '❤️', '🤔', '😤', '🙌', '💯', '🎉', '😢', '🤩', '👏']
                const random = emojis[Math.floor(Math.random() * emojis.length)]
                if (pollReactionEmojis.length < 8) {
                  setPollReactionEmojis((prev) => [...prev, random])
                }
              }}
              className="w-10 h-10 rounded-lg bg-[#FFFFFF]/20 flex items-center justify-center text-[#FFFFFF] text-lg font-bold hover:bg-[#FFFFFF]/30 transition-colors"
            >
              +
            </button>
          </div>
        </div>

        {/* Live preview */}
        {standalonePollQuestion.trim() && standalonePollOptions.some((o) => o.text.trim()) && (
          <div className="rounded-2xl bg-white/[0.04] border border-white/[0.08] p-5">
            <p className="text-white/30 text-xs mb-3 font-medium uppercase tracking-wider">
              Live Preview
            </p>
            <p className="text-white font-bold text-base mb-4">
              {standalonePollQuestion || 'Your question here'}
            </p>
            <div className="flex flex-col gap-2">
              {standalonePollOptions
                .filter((o) => o.text.trim())
                .map((opt, i) => {
                  const pct = mockPercentages[standalonePollOptions.indexOf(opt)] || 0
                  return (
                    <div key={opt.id} className="relative">
                      <motion.div
                        initial={{ width: '0%' }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6, ease: 'easeOut', delay: i * 0.1 }}
                        className="absolute inset-0 bg-[#FFFFFF]/20 rounded-xl"
                      />
                      <div className="relative flex items-center justify-between px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                        <span className="text-white text-sm">{opt.text}</span>
                        <span className="text-[#FFFFFF] text-sm font-bold tabular-nums">
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
      <div className="pt-2 flex flex-col gap-4">
        {!selectedFestival ? (
          <>
            <h3 className="text-lg font-bold text-white">Festival Templates</h3>
            <p className="text-white/40 text-sm">
              Choose a template and add your message
            </p>
            <div className="grid grid-cols-2 gap-3 mt-1">
              {FESTIVAL_TEMPLATES.map((tpl, i) => (
                <motion.button
                  key={tpl.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05, type: 'spring', stiffness: 300, damping: 25 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedFestival(tpl)}
                  className="relative rounded-2xl overflow-hidden aspect-[3/4] flex flex-col items-center justify-end p-4"
                  style={{ background: tpl.gradient }}
                >
                  <span className="text-5xl mb-3 drop-shadow-lg">{tpl.emoji}</span>
                  <span
                    className="font-bold text-sm drop-shadow-md"
                    style={{ color: tpl.textColor }}
                  >
                    {tpl.name}
                  </span>
                </motion.button>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Customise Card</h3>
              <button
                onClick={() => {
                  setSelectedFestival(null)
                  setFestivalMessage('')
                }}
                className="text-white/40 text-xs hover:text-white transition-colors"
              >
                Change template
              </button>
            </div>

            {/* Live preview */}
            <div
              className="relative rounded-2xl overflow-hidden aspect-[3/4] flex flex-col items-center justify-end p-6"
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

              <p
                className="text-xs mt-3 font-medium drop-shadow-sm opacity-60"
                style={{ color: selectedFestival.textColor }}
              >
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
      <div className="pt-2 flex flex-col gap-5">
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
                  className="rounded-xl bg-white/[0.04] border border-white/[0.08] p-4 text-left"
                >
                  {/* Status badge */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 animate-pulse">
                      {match.status}
                    </span>
                    <span className="text-white/30 text-xs">{match.venue}</span>
                  </div>

                  {/* Teams */}
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
            {/* Score preview widget */}
            {selectedMatchData && (
              <div className="rounded-2xl bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border border-white/[0.08] p-5">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 animate-pulse">
                    {selectedMatchData.status}
                  </span>
                  <span className="text-white/30 text-xs">{selectedMatchData.venue}</span>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <span className="text-3xl">{selectedMatchData.team1Flag}</span>
                    <div>
                      <p className="text-white font-bold">{selectedMatchData.team1}</p>
                      <p className="text-[#FFFFFF] font-mono text-lg font-bold">{selectedMatchData.team1Score}</p>
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

            {/* Commentary input */}
            <div>
              <label className="text-white/40 text-xs mb-2 block">Add your take</label>
              <textarea
                value={cricketCommentary}
                onChange={(e) => setCricketCommentary(e.target.value)}
                placeholder="What do you think about this match?"
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder:text-white/30 outline-none resize-none text-sm focus:border-[#FFFFFF]/50 transition-colors"
                rows={3}
              />
            </div>

            {/* Preview */}
            {cricketCommentary.trim() && selectedMatchData && (
              <div className="rounded-2xl overflow-hidden">
                <div
                  className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] p-5 flex flex-col items-center justify-center min-h-[200px]"
                >
                  <div className="flex items-center gap-6 mb-4">
                    <div className="text-center">
                      <span className="text-3xl">{selectedMatchData.team1Flag}</span>
                      <p className="text-white/50 text-xs mt-1">{selectedMatchData.team1}</p>
                    </div>
                    <div>
                      <p className="text-[#FFFFFF] font-mono font-bold text-sm">
                        {selectedMatchData.team1Score}
                      </p>
                      <p className="text-white/30 text-[10px]">vs</p>
                      <p className="text-white/60 font-mono font-bold text-sm">
                        {selectedMatchData.team2Score}
                      </p>
                    </div>
                    <div className="text-center">
                      <span className="text-3xl">{selectedMatchData.team2Flag}</span>
                      <p className="text-white/50 text-xs mt-1">{selectedMatchData.team2}</p>
                    </div>
                  </div>
                  <div className="w-16 h-[1px] bg-white/10 mb-4" />
                  <p className="text-white text-sm text-center font-medium leading-relaxed px-2">
                    "{cricketCommentary}"
                  </p>
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
      <div className="pt-4 flex flex-col gap-5">
        <h3 className="text-lg font-bold text-white">Share a Post</h3>
        <p className="text-white/40 text-sm">Paste a URL from a post or article</p>

        {/* URL input */}
        <div>
          <label className="text-white/40 text-xs mb-2 block">Post URL</label>
          <div className="relative">
            <input
              type="url"
              value={feedUrl}
              onChange={(e) => setFeedUrl(e.target.value)}
              placeholder="https://example.com/post/..."
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-[#FFFFFF]/50 transition-colors pr-12"
            />
            {feedUrl.trim() && (
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-400"
              >
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M5 13l4 4L19 7" />
                </svg>
              </motion.button>
            )}
          </div>
        </div>

        {/* Caption */}
        <div>
          <label className="text-white/40 text-xs mb-2 block">Add a caption (optional)</label>
          <textarea
            value={feedCaption}
            onChange={(e) => setFeedCaption(e.target.value)}
            placeholder="What do you think about this?"
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none resize-none focus:border-[#FFFFFF]/50 transition-colors"
            rows={3}
          />
        </div>

        {/* Link preview mock */}
        {feedUrl.trim() && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-white/[0.04] border border-white/[0.08] overflow-hidden"
          >
            <div className="h-32 bg-gradient-to-br from-[#FFFFFF]/30 to-[#6366f1]/20 flex items-center justify-center">
              <span className="text-4xl">📰</span>
            </div>
            <div className="p-4">
              <p className="text-white/30 text-xs mb-1">article.example.com</p>
              <p className="text-white font-semibold text-sm mb-1">
                {feedCaption || 'Shared post from the feed'}
              </p>
              <p className="text-white/40 text-xs truncate">{feedUrl}</p>
            </div>
          </motion.div>
        )}
      </div>
    )
  }

  // =========================================================================
  // Step 4 — Audience + Expiry
  // =========================================================================

  function StepAudienceExpiry({
    audience: aud,
    onAudienceChange,
    expiry: exp,
    onExpiryChange,
    region: reg,
    onRegionChange,
  }: {
    audience: StoryAudience
    onAudienceChange: (a: StoryAudience) => void
    expiry: StoryExpiry
    onExpiryChange: (e: StoryExpiry) => void
    region: string
    onRegionChange: (r: string) => void
  }) {
    return (
      <div className="pt-4 flex flex-col gap-8">
        {/* Audience */}
        <section>
          <h3 className="text-lg font-bold text-white mb-1">Audience</h3>
          <p className="text-white/40 text-sm mb-4">Who can see this story?</p>
          <div className="flex gap-2.5 overflow-x-auto pb-1 -mx-1 px-1">
            {AUDIENCE_OPTIONS.map((opt) => (
              <motion.button
                key={opt.value}
                whileTap={{ scale: 0.95 }}
                onClick={() => onAudienceChange(opt.value)}
                className={cn(
                  'relative flex items-center gap-2 px-4 py-2.5 rounded-full whitespace-nowrap text-sm font-medium transition-all shrink-0',
                  aud === opt.value
                    ? 'bg-[#FFFFFF] text-white'
                    : 'bg-white/[0.06] text-white/60',
                )}
              >
                <span>{opt.icon}</span>
                <span>{opt.label}</span>
              </motion.button>
            ))}
          </div>
        </section>

        {/* Expiry */}
        <section>
          <h3 className="text-lg font-bold text-white mb-1">Story Expiry</h3>
          <p className="text-white/40 text-sm mb-4">How long should this story be visible?</p>
          <div className="flex flex-col gap-2.5">
            {EXPIRY_OPTIONS.map((opt) => (
              <motion.button
                key={opt.value}
                whileTap={{ scale: 0.98 }}
                onClick={() => onExpiryChange(opt.value)}
                className={cn(
                  'flex items-center gap-3 rounded-xl p-4 text-left transition-all',
                  exp === opt.value
                    ? 'bg-[#FFFFFF]/10 border border-[#FFFFFF]/50'
                    : 'bg-white/[0.04] border border-white/[0.08]',
                )}
              >
                <div
                  className={cn(
                    'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors',
                    exp === opt.value ? 'border-[#FFFFFF]' : 'border-white/20',
                  )}
                >
                  {exp === opt.value && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-2.5 h-2.5 rounded-full bg-[#FFFFFF]"
                    />
                  )}
                </div>
                <div>
                  <p
                    className={cn(
                      'text-sm font-semibold transition-colors',
                      exp === opt.value ? 'text-white' : 'text-white/70',
                    )}
                  >
                    {opt.label}
                  </p>
                </div>
              </motion.button>
            ))}
          </div>
        </section>

        {/* Region */}
        <section>
          <h3 className="text-lg font-bold text-white mb-1">Region Targeting</h3>
          <p className="text-white/40 text-sm mb-4">Boost visibility in your area</p>
          <div className="flex flex-col gap-2.5">
            {REGION_OPTIONS.map((opt) => (
              <motion.button
                key={opt.value}
                whileTap={{ scale: 0.98 }}
                onClick={() => onRegionChange(opt.value)}
                className={cn(
                  'flex items-center gap-3 rounded-xl p-4 text-left transition-all',
                  reg === opt.value
                    ? 'bg-[#FFFFFF]/10 border border-[#FFFFFF]/50'
                    : 'bg-white/[0.04] border border-white/[0.08]',
                )}
              >
                <div
                  className={cn(
                    'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors',
                    reg === opt.value ? 'border-[#FFFFFF]' : 'border-white/20',
                  )}
                >
                  {reg === opt.value && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-2.5 h-2.5 rounded-full bg-[#FFFFFF]"
                    />
                  )}
                </div>
                <p
                  className={cn(
                    'text-sm font-semibold transition-colors',
                    reg === opt.value ? 'text-white' : 'text-white/70',
                  )}
                >
                  {opt.label}
                </p>
              </motion.button>
            ))}
          </div>
        </section>
      </div>
    )
  }

  // =========================================================================
  // Step 5 — Publish
  // =========================================================================

  function StepPublish({
    publishing: pub,
    published: done,
    onPublish: pubFn,
  }: {
    publishing: boolean
    published: boolean
    onPublish: () => void
  }) {
    return (
      <div className="pt-4 flex flex-col items-center justify-center min-h-[60vh] gap-6 px-4">
        {done ? (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="flex flex-col items-center gap-4"
          >
            <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center">
              <motion.svg
                width="36"
                height="36"
                fill="none"
                stroke="#22c55e"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                viewBox="0 0 24 24"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <motion.path
                  d="M5 13l4 4L19 7"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                />
              </motion.svg>
            </div>
            <div className="text-center">
              <p className="text-white font-bold text-lg">Story Published!</p>
              <p className="text-white/40 text-sm mt-1">Your story is now live 🎉</p>
            </div>
          </motion.div>
        ) : (
          <>
            {/* Story summary */}
            <div className="w-full rounded-2xl bg-white/[0.04] border border-white/[0.08] p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-[#FFFFFF]/20 flex items-center justify-center text-xl">
                  {FORMAT_OPTIONS.find((f) => f.value === format)?.icon}
                </div>
                <div>
                  <p className="text-white font-semibold">
                    {FORMAT_OPTIONS.find((f) => f.value === format)?.label} Story
                  </p>
                  <p className="text-white/40 text-xs">
                    {LANGUAGES.find((l) => l.code === language)?.flag}{' '}
                    {LANGUAGES.find((l) => l.code === language)?.label} • {audience} •{' '}
                    {expiry}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="px-2.5 py-1 rounded-full bg-white/[0.06] text-white/50 text-xs">
                  {EXPIRY_OPTIONS.find((e) => e.value === expiry)?.label}
                </span>
                <span className="px-2.5 py-1 rounded-full bg-white/[0.06] text-white/50 text-xs">
                  {AUDIENCE_OPTIONS.find((a) => a.value === audience)?.icon}{' '}
                  {AUDIENCE_OPTIONS.find((a) => a.value === audience)?.label}
                </span>
                <span className="px-2.5 py-1 rounded-full bg-white/[0.06] text-white/50 text-xs">
                  📍 {REGION_OPTIONS.find((r) => r.value === region)?.label}
                </span>
              </div>
            </div>

            {/* Publish button */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={pubFn}
              disabled={pub}
              className={cn(
                'w-full py-4 rounded-2xl text-white font-semibold text-base transition-all relative overflow-hidden',
                pub
                  ? 'bg-white/[0.08] text-white/30 cursor-wait'
                  : 'bg-gradient-to-r from-[#FFFFFF] to-[#6366f1] shadow-lg shadow-[#FFFFFF]/25',
              )}
            >
              {pub && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                />
              )}
              <span className="relative z-10 flex items-center justify-center gap-2">
                {pub ? (
                  <>
                    <svg
                      className="animate-spin"
                      width="18"
                      height="18"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M12 2a10 10 0 0 1 10 10"
                        strokeLinecap="round"
                      />
                    </svg>
                    Publishing...
                  </>
                ) : (
                  'Publish Story'
                )}
              </span>
            </motion.button>

            <p className="text-white/20 text-xs text-center">
              Your story will be visible to {AUDIENCE_OPTIONS.find((a) => a.value === audience)?.label.toLowerCase()} for{' '}
              {EXPIRY_OPTIONS.find((e) => e.value === expiry)?.label}
            </p>
          </>
        )}
      </div>
    )
  }
}
