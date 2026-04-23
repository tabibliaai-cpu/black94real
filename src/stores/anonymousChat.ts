import { create } from 'zustand'

export interface AnonMessage {
  id: string
  roomId: string
  senderAlias: string
  content: string
  isMine: boolean
  timestamp: number
  type: 'text' | 'reaction' | 'system' | 'image'
}

export interface AnonRoom {
  id: string
  strangerAlias: string
  strangerColor: string
  status: 'matching' | 'connected' | 'disconnected' | 'ended'
  startedAt: number
  messageCount: number
}

interface AnonChatState {
  // Connection
  myAlias: string
  myColor: string
  room: AnonRoom | null
  setRoom: (room: AnonRoom | null) => void

  // Messages
  messages: AnonMessage[]
  addMessage: (msg: AnonMessage) => void
  clearMessages: () => void

  // Typing
  strangerTyping: boolean
  setStrangerTyping: (typing: boolean) => void

  // Reconnecting
  reconnecting: boolean
  setReconnecting: (r: boolean) => void

  // Actions
  generateAlias: () => string
  generateColor: () => string
  startMatching: () => void
  connectToStranger: (alias: string) => void
  disconnect: () => void
  skipToStranger: () => void
  sendMessage: (content: string) => void
}

/* ── Alias generators ──────────────────────────────────────────────── */
const PREFIXES = ['Ghost', 'Shadow', 'Phantom', 'Echo', 'Mist', 'Wisp', 'Drift', 'Blip', 'Void', 'Haze']
const SUFFIX_TYPES = ['number', 'hex', 'alpha']

function randItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function genAlias(): string {
  const prefix = randItem(PREFIXES)
  const type = randItem(SUFFIX_TYPES)
  if (type === 'number') return `${prefix}_${Math.floor(Math.random() * 99) + 1}`
  if (type === 'hex') return `${prefix}_${Math.random().toString(16).slice(2, 4).toUpperCase()}`
  return `${prefix}_${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`
}

function genColor(): string {
  const colors = [
    '#FFFFFF', '#2a7fff', '#06b6d4', '#f59e0b', '#f91880',
    '#FFFFFF', '#ef4444', '#10b981', '#ec4899', '#6366f1',
    '#14b8a6', '#f97316', '#84cc16', '#a78bfa', '#fb7185',
  ]
  return randItem(colors)
}

/* ── Stranger response pool ──────────────────────────────────────────── */
const STRANGER_RESPONSES = [
  "Hey! What's up? 😄",
  "Haha that's interesting, tell me more!",
  "I totally get what you mean",
  "Same here honestly",
  "That's cool! I've been thinking about that too",
  "No way! That's awesome",
  "haha true 😂",
  "What do you do for fun?",
  "I'm just vibing rn",
  "Yo that's deep",
  "I feel that on a spiritual level",
  "Wait really? That's wild",
  "Nice, I like your energy",
  "Have you tried listening to lo-fi while working?",
  "That reminds me of something funny that happened to me",
  "I couldn't agree more",
  "lowkey obsessed with that idea",
  "bruh that's hilarious 😭",
  "Honestly same, same",
  "What's your take on AI? I think it's fascinating",
]

/* ── AI icebreakers ──────────────────────────────────────────────────── */
const ICEBREAKERS = [
  "Ask about their favorite hobby",
  "Start with a fun random question",
  "Share something you've never told anyone",
  "What would you do if you won the lottery?",
  "If you could teleport anywhere right now...",
  "What's the most spontaneous thing you've done?",
  "Do you believe in aliens? 👽",
  "Cats or dogs? The debate continues...",
]

let msgCounter = 0

export const useAnonChat = create<AnonChatState>((set, get) => ({
  // Connection
  myAlias: '',
  myColor: '',
  room: null,
  setRoom: (room) => set({ room }),

  // Messages
  messages: [],
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  clearMessages: () => set({ messages: [] }),

  // Typing
  strangerTyping: false,
  setStrangerTyping: (typing) => set({ strangerTyping: typing }),

  // Reconnecting
  reconnecting: false,
  setReconnecting: (r) => set({ reconnecting: r }),

  // Actions
  generateAlias: () => genAlias(),
  generateColor: () => genColor(),

  startMatching: () => {
    const alias = genAlias()
    const color = genColor()
    const roomId = `anon_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    set({
      myAlias: alias,
      myColor: color,
      room: { id: roomId, strangerAlias: '', strangerColor: '', status: 'matching', startedAt: Date.now(), messageCount: 0 },
      messages: [],
      strangerTyping: false,
      reconnecting: false,
    })
  },

  connectToStranger: (alias) => {
    const { room } = get()
    if (!room) return
    const strangerColor = genColor()
    set({
      room: { ...room, strangerAlias: alias, strangerColor, status: 'connected' },
      messages: [
        {
          id: `sys_${Date.now()}`,
          roomId: room.id,
          senderAlias: 'system',
          content: `You're now chatting with ${alias}. Say hello!`,
          isMine: false,
          timestamp: Date.now(),
          type: 'system',
        },
      ],
    })
  },

  disconnect: () => {
    const { room, messages } = get()
    if (room) {
      get().addMessage({
        id: `sys_${Date.now()}`,
        roomId: room.id,
        senderAlias: 'system',
        content: 'Stranger disconnected.',
        isMine: false,
        timestamp: Date.now(),
        type: 'system',
      })
    }
    set({ room: room ? { ...room, status: 'disconnected' } : null, strangerTyping: false })
  },

  skipToStranger: () => {
    const { room } = get()
    if (!room) return
    // Add system message about skip
    get().addMessage({
      id: `sys_${Date.now()}`,
      roomId: room.id,
      senderAlias: 'system',
      content: 'You skipped to a new stranger.',
      isMine: false,
      timestamp: Date.now(),
      type: 'system',
    })
    // Briefly show matching, then connect to next stranger
    set({
      room: { ...room, status: 'matching', strangerAlias: '', strangerColor: '' },
      messages: [],
      strangerTyping: false,
    })

    // Simulate finding a new stranger after 1.5-3s
    setTimeout(() => {
      const state = get()
      if (state.room?.status === 'matching') {
        const newAlias = genAlias()
        state.connectToStranger(newAlias)
      }
    }, 1500 + Math.random() * 1500)
  },

  sendMessage: (content) => {
    const { myAlias, room } = get()
    if (!room || !content.trim()) return

    const msg: AnonMessage = {
      id: `msg_${++msgCounter}_${Date.now()}`,
      roomId: room.id,
      senderAlias: myAlias,
      content: content.trim(),
      isMine: true,
      timestamp: Date.now(),
      type: 'text',
    }
    get().addMessage(msg)
    set((s) => ({ room: s.room ? { ...s.room, messageCount: s.room.messageCount + 1 } : null }))

    // Trigger typing indicator then deliver response
    setTimeout(() => {
      get().setStrangerTyping(true)
    }, 500 + Math.random() * 1000)

    setTimeout(() => {
      get().setStrangerTyping(false)
      const response = randItem(STRANGER_RESPONSES)
      get().addMessage({
        id: `msg_${++msgCounter}_${Date.now()}`,
        roomId: room.id,
        senderAlias: room.strangerAlias || 'Stranger',
        content: response,
        isMine: false,
        timestamp: Date.now(),
        type: 'text',
      })
      set((s) => ({ room: s.room ? { ...s.room, messageCount: s.room.messageCount + 1 } : null }))
    }, 1500 + Math.random() * 2500)
  },
}))
