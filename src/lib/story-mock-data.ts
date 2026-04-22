// =============================================================================
// Story Mock Data – Complete types, constants, helpers & seed data
// =============================================================================

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type StoryFormat = 'text' | 'voice' | 'thread' | 'poll' | 'festival' | 'cricket' | 'feed'
export type StoryAudience = 'everyone' | 'followers' | 'close_friends' | 'subscribers'
export type StoryExpiry = '6h' | '24h' | '72h' | 'permanent'
export type Language = 'hi' | 'en' | 'te' | 'ta' | 'bn' | 'mr' | 'kn' | 'ml' | 'gu'
export type ReactionType = 'agree' | 'disagree' | 'fire' | 'skull' | 'mindblown' | 'clapping'

export interface LanguageOption {
  code: Language
  label: string
  nativeLabel: string
  flag: string
}

export interface StoryCard {
  id: string
  format: StoryFormat
  content: string
  mediaUrl?: string
  language: Language
  pollOptions?: PollOption[]
  festivalTemplate?: FestivalTemplate
  cricketData?: CricketMatch
  voiceWaveform?: number[]
  voiceDuration?: number
}

export interface PollOption {
  id: string
  text: string
  votes: number
  percentage: number
}

export interface CricketMatch {
  team1: string
  team2: string
  team1Score: string
  team2Score: string
  overs: string
  venue: string
  status: string
}

export interface FestivalTemplate {
  id: string
  name: string
  gradient: string
  emoji: string
  textColor: string
}

export interface StoryGroup {
  creatorId: string
  creatorName: string
  creatorHandle: string
  creatorAvatar: string
  creatorVerified: boolean
  creatorCountry: string
  creatorLanguages: Language[]
  viewed: boolean
  stories: StoryCard[]
  createdAt: string
  viewCount: number
  isCollab?: boolean
  collabAvatars?: string[]
  tippingEnabled: boolean
  upiId?: string
  trendingTopic?: string
  reactions: Record<ReactionType, number>
}

export interface TrendingTopic {
  id: string
  tag: string
  state: string
  stateFlag: string
  count: number
}

// ---------------------------------------------------------------------------
// Language options
// ---------------------------------------------------------------------------

export const LANGUAGES: LanguageOption[] = [
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी', flag: '🇮🇳' },
  { code: 'en', label: 'English', nativeLabel: 'English', flag: '🇬🇧' },
  { code: 'te', label: 'Telugu', nativeLabel: 'తెలుగు', flag: '🇮🇳' },
  { code: 'ta', label: 'Tamil', nativeLabel: 'தமிழ்', flag: '🇮🇳' },
  { code: 'bn', label: 'Bengali', nativeLabel: 'বাংলা', flag: '🇮🇳' },
  { code: 'mr', label: 'Marathi', nativeLabel: 'मराठी', flag: '🇮🇳' },
  { code: 'kn', label: 'Kannada', nativeLabel: 'ಕನ್ನಡ', flag: '🇮🇳' },
  { code: 'ml', label: 'Malayalam', nativeLabel: 'മലയാളം', flag: '🇮🇳' },
  { code: 'gu', label: 'Gujarati', nativeLabel: 'ગુજરાતી', flag: '🇮🇳' },
]

// ---------------------------------------------------------------------------
// Festival Templates (12)
// ---------------------------------------------------------------------------

export const FESTIVAL_TEMPLATES: FestivalTemplate[] = [
  {
    id: 'diwali',
    name: 'Diwali',
    gradient: 'linear-gradient(135deg, #FF6F00 0%, #FF8F00 30%, #FFD54F 60%, #FFF8E1 100%)',
    emoji: '🪔',
    textColor: '#FFFFFF',
  },
  {
    id: 'holi',
    name: 'Holi',
    gradient: 'linear-gradient(135deg, #E91E63 0%, #AB47BC 25%, #42A5F5 50%, #66BB6A 75%, #FFEE58 100%)',
    emoji: '🎨',
    textColor: '#FFFFFF',
  },
  {
    id: 'eid',
    name: 'Eid',
    gradient: 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 40%, #A5D6A7 70%, #FFD54F 100%)',
    emoji: '🌙',
    textColor: '#FFFFFF',
  },
  {
    id: 'onam',
    name: 'Onam',
    gradient: 'linear-gradient(135deg, #F9A825 0%, #FDD835 30%, #AED581 60%, #4CAF50 100%)',
    emoji: '🌸',
    textColor: '#33691E',
  },
  {
    id: 'navratri',
    name: 'Navratri',
    gradient: 'linear-gradient(135deg, #B71C1C 0%, #D32F2F 30%, #FF5722 60%, #FF8A65 100%)',
    emoji: '🙏',
    textColor: '#FFFFFF',
  },
  {
    id: 'pongal',
    name: 'Pongal',
    gradient: 'linear-gradient(135deg, #E65100 0%, #F57C00 30%, #FFB300 60%, #FFF9C4 100%)',
    emoji: '🌾',
    textColor: '#FFFFFF',
  },
  {
    id: 'durga-puja',
    name: 'Durga Puja',
    gradient: 'linear-gradient(135deg, #880E4F 0%, #AD1457 30%, #FCE4EC 60%, #FFFFFF 100%)',
    emoji: '🏵️',
    textColor: '#FFFFFF',
  },
  {
    id: 'baisakhi',
    name: 'Baisakhi',
    gradient: 'linear-gradient(135deg, #F57F17 0%, #FBC02D 30%, #FFEE58 60%, #FFF8E1 100%)',
    emoji: '🥁',
    textColor: '#4E342E',
  },
  {
    id: 'christmas',
    name: 'Christmas',
    gradient: 'linear-gradient(135deg, #B71C1C 0%, #C62828 35%, #2E7D32 65%, #1B5E20 100%)',
    emoji: '🎄',
    textColor: '#FFFFFF',
  },
  {
    id: 'new-year',
    name: 'New Year',
    gradient: 'linear-gradient(135deg, #1A0033 0%, #4A148C 30%, #7B1FA2 55%, #FFD700 100%)',
    emoji: '🎆',
    textColor: '#FFFFFF',
  },
  {
    id: 'eid-ul-adha',
    name: 'Eid ul-Adha',
    gradient: 'linear-gradient(135deg, #1B5E20 0%, #388E3C 30%, #8D6E63 60%, #FFD54F 100%)',
    emoji: '🐪',
    textColor: '#FFFFFF',
  },
  {
    id: 'raksha-bandhan',
    name: 'Raksha Bandhan',
    gradient: 'linear-gradient(135deg, #C2185B 0%, #E91E63 35%, #F48FB1 65%, #FCE4EC 100%)',
    emoji: '🧵',
    textColor: '#FFFFFF',
  },
]

// ---------------------------------------------------------------------------
// Mock story groups (8)
// ---------------------------------------------------------------------------

export const MOCK_STORY_GROUPS: StoryGroup[] = [
  // 1. @ranveer_talks – Voice story about IPL 2025
  {
    creatorId: 'u_001',
    creatorName: 'Ranveer Sharma',
    creatorHandle: 'ranveer_talks',
    creatorAvatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=ranveer&backgroundColor=FF6F00',
    creatorVerified: true,
    creatorCountry: '🇮🇳',
    creatorLanguages: ['hi', 'en'],
    viewed: false,
    stories: [
      {
        id: 's_001_voice',
        format: 'voice',
        content: 'IPL 2025 ka season shuru hone wala hai aur mujhe lagta hai ki is baar CSK ki team bahut strong dikh rahi hai. MS Dhoni ka experience aur Ruturaj Gaikwad ki batting form — dono saath mein lethal combination banenge. Aur Kolkata Knight Riders ne bhi apni squad mein kafi depth add ki hai. Kya aap bhi excited hain? Drop your predictions! 🏏🔥',
        language: 'hi',
        voiceWaveform: [
          35, 62, 78, 55, 90, 42, 68, 85, 50, 72,
          88, 40, 65, 95, 48, 70, 82, 58, 76, 44,
        ],
        voiceDuration: 45,
      },
    ],
    createdAt: '2025-06-13T18:30:00Z',
    viewCount: 45200,
    tippingEnabled: true,
    upiId: 'ranveer@upi',
    trendingTopic: '#IPL2025',
    reactions: {
      agree: 8200,
      disagree: 450,
      fire: 4100,
      skull: 800,
      mindblown: 320,
      clapping: 670,
    },
  },

  // 2. @techwithanisha – Poll story "Is AGI here?"
  {
    creatorId: 'u_002',
    creatorName: 'Anisha Kapoor',
    creatorHandle: 'techwithanisha',
    creatorAvatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=anisha&backgroundColor=7B1FA2',
    creatorVerified: true,
    creatorCountry: '🇮🇳',
    creatorLanguages: ['en', 'hi'],
    viewed: false,
    stories: [
      {
        id: 's_002_poll',
        format: 'poll',
        content: 'With GPT-5, Claude 4, and Gemini Ultra all dropping this quarter — do you think we\'ve reached AGI? Or is it still hype? I talked to three AI researchers last week and their answers surprised me. Cast your vote 👇',
        language: 'en',
        pollOptions: [
          { id: 'po_01', text: 'Yes, we\'re close', votes: 14200, percentage: 42 },
          { id: 'po_02', text: 'Not for decades', votes: 11850, percentage: 35 },
          { id: 'po_03', text: 'Already here', votes: 7800, percentage: 23 },
        ],
      },
    ],
    createdAt: '2025-06-13T16:45:00Z',
    viewCount: 28700,
    tippingEnabled: false,
    trendingTopic: '#AGI',
    reactions: {
      agree: 3100,
      disagree: 5600,
      fire: 2100,
      skull: 180,
      mindblown: 890,
      clapping: 420,
    },
  },

  // 3. @cricketwallah – Cricket live score card
  {
    creatorId: 'u_003',
    creatorName: 'Cricket Wallah',
    creatorHandle: 'cricketwallah',
    creatorAvatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=cricket&backgroundColor=1B5E20',
    creatorVerified: true,
    creatorCountry: '🇮🇳',
    creatorLanguages: ['en', 'hi'],
    viewed: false,
    stories: [
      {
        id: 's_003_cricket',
        format: 'cricket',
        content: 'India vs Australia – 3rd ODI at Eden Gardens. Kohli and Gill are anchoring beautifully after early blows. Australia 265 looks chaseable on this flat track!',
        language: 'en',
        cricketData: {
          team1: 'IND',
          team2: 'AUS',
          team1Score: '287/4',
          team2Score: '265',
          overs: '42.3',
          status: 'live',
          venue: 'Eden Gardens, Kolkata',
        },
      },
    ],
    createdAt: '2025-06-13T14:20:00Z',
    viewCount: 156000,
    tippingEnabled: false,
    trendingTopic: '#INDvsAUS',
    reactions: {
      agree: 6700,
      disagree: 1200,
      fire: 12300,
      skull: 950,
      mindblown: 2100,
      clapping: 3400,
    },
  },

  // 4. @constitutionwallah – Thread on Article 370 (5 cards)
  {
    creatorId: 'u_004',
    creatorName: 'Constitution Wallah',
    creatorHandle: 'constitutionwallah',
    creatorAvatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=constwallah&backgroundColor=0D47A1',
    creatorVerified: true,
    creatorCountry: '🇮🇳',
    creatorLanguages: ['en', 'hi'],
    viewed: false,
    stories: [
      {
        id: 's_004_thread_1',
        format: 'thread',
        content: '1/5 — What exactly was Article 370? It was a temporary provision added to the Indian Constitution in 1949 under Part XXI. It granted special autonomous status to the region of Jammu & Kashmir, allowing it its own constitution and decision-making for all matters except defence, communications, and foreign affairs.',
        language: 'en',
      },
      {
        id: 's_004_thread_2',
        format: 'thread',
        content: '2/5 — The historical context. When the Instrument of Accession was signed by Maharaja Hari Singh in October 1947, Jawaharlal Nehru and Sheikh Abdullah negotiated additional guarantees for J&K. These were eventually codified as Article 370, introduced by N. Gopalaswami Ayyangar in the Constituent Assembly.',
        language: 'en',
      },
      {
        id: 's_004_thread_3',
        format: 'thread',
        content: '3/5 — The erosion over decades. Starting from 1954, Presidential Orders were used to gradually extend most central laws to J&K. By 2019, Article 370 had been hollowed out significantly — only a handful of provisions remained exclusive to the state, most notably Article 35A (property rights for permanent residents).',
        language: 'en',
      },
      {
        id: 's_004_thread_4',
        format: 'thread',
        content: '4/5 — August 5, 2019. The BJP government, led by PM Modi and Amit Shah, revoked Article 370 through a Presidential Order. The state was bifurcated into two Union Territories — Jammu & Kashmir and Ladakh. The move was accompanied by a massive security crackdown, communication blackout, and detention of local political leaders.',
        language: 'en',
      },
      {
        id: 's_004_thread_5',
        format: 'thread',
        content: '5/5 — The aftermath and the Supreme Court verdict. In December 2023, a five-judge bench of the Supreme Court upheld the abrogation, stating Article 370 was always meant to be temporary. The court also directed restoration of statehood to J&K "at the earliest" and elections by Sept 30, 2024. The debate on federalism and constitutional morality continues.',
        language: 'en',
      },
    ],
    createdAt: '2025-06-13T12:00:00Z',
    viewCount: 89100,
    tippingEnabled: false,
    trendingTopic: '#Article370',
    reactions: {
      agree: 9400,
      disagree: 3200,
      fire: 2800,
      skull: 560,
      mindblown: 1800,
      clapping: 1500,
    },
  },

  // 5. @mumbai_diaries – Diwali festival template
  {
    creatorId: 'u_005',
    creatorName: 'Mumbai Diaries',
    creatorHandle: 'mumbai_diaries',
    creatorAvatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=mumbai&backgroundColor=E65100',
    creatorVerified: true,
    creatorCountry: '🇮🇳',
    creatorLanguages: ['en', 'hi', 'mr'],
    viewed: false,
    stories: [
      {
        id: 's_005_festival',
        format: 'festival',
        content: 'From the city of dreams to your screen — Happy Diwali! ✨🪔',
        language: 'en',
        festivalTemplate: FESTIVAL_TEMPLATES.find((t) => t.id === 'diwali'),
        mediaUrl: 'https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=800',
      },
    ],
    createdAt: '2025-06-13T20:00:00Z',
    viewCount: 34500,
    tippingEnabled: true,
    upiId: 'mumbai.diaries@paytm',
    reactions: {
      agree: 4100,
      disagree: 90,
      fire: 6200,
      skull: 200,
      mindblown: 850,
      clapping: 3800,
    },
  },

  // 6. @hyd_creator – Text story in Telugu
  {
    creatorId: 'u_006',
    creatorName: 'Hyderabad Creator',
    creatorHandle: 'hyd_creator',
    creatorAvatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=hydcreator&backgroundColor=4A148C',
    creatorVerified: false,
    creatorCountry: '🇮🇳',
    creatorLanguages: ['te', 'en'],
    viewed: false,
    stories: [
      {
        id: 's_006_text',
        format: 'text',
        content: 'తెలుగు సినిమా ఇండస్ట్రీకి ప్రపంచం అంతా చూస్తోంది! 🔥',
        language: 'te',
        mediaUrl: 'linear-gradient(135deg, #7B1FA2 0%, #1565C0 100%)',
      },
    ],
    createdAt: '2025-06-13T17:15:00Z',
    viewCount: 12800,
    tippingEnabled: false,
    reactions: {
      agree: 1400,
      disagree: 120,
      fire: 2900,
      skull: 340,
      mindblown: 560,
      clapping: 780,
    },
  },

  // 7. Collab story – @sahil_bloom + @naval on wealth (3 cards)
  {
    creatorId: 'u_007',
    creatorName: 'Sahil Bloom',
    creatorHandle: 'sahil_bloom',
    creatorAvatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=sahil&backgroundColor=37474F',
    creatorVerified: true,
    creatorCountry: '🇺🇸',
    creatorLanguages: ['en'],
    viewed: false,
    isCollab: true,
    collabAvatars: [
      'https://api.dicebear.com/9.x/avataaars/svg?seed=sahil&backgroundColor=37474F',
      'https://api.dicebear.com/9.x/avataaars/svg?seed=naval&backgroundColor=263238',
    ],
    stories: [
      {
        id: 's_007_collab_1',
        format: 'text',
        content: 'Thread with @naval → The 3 Laws of Wealth Building\n\nLaw #1: Earn with your mind, not your time. If you\'re trading hours for dollars, you\'re capped. Build assets that earn while you sleep — code, media, capital, and labor.',
        language: 'en',
        mediaUrl: 'linear-gradient(135deg, #1A1A2E 0%, #16213E 50%, #0F3460 100%)',
      },
      {
        id: 's_007_collab_2',
        format: 'text',
        content: 'Law #2: Play iterated games. The #1 reason people don\'t build wealth is they quit too early. The power of compounding isn\'t just in money — it\'s in relationships, knowledge, and reputation. Stay in the game long enough and luck finds you.',
        language: 'en',
        mediaUrl: 'linear-gradient(135deg, #1A1A2E 0%, #16213E 50%, #0F3460 100%)',
      },
      {
        id: 's_007_collab_3',
        format: 'text',
        content: 'Law #3: Own equity. Renters pay landlords, employees pay founders. Whether it\'s stock, a business, or a piece of software — you need ownership stakes in things that can grow 100x. That\'s how the wealth game is actually won.',
        language: 'en',
        mediaUrl: 'linear-gradient(135deg, #1A1A2E 0%, #16213E 50%, #0F3460 100%)',
      },
    ],
    createdAt: '2025-06-13T15:00:00Z',
    viewCount: 203000,
    tippingEnabled: false,
    reactions: {
      agree: 4300,
      disagree: 680,
      fire: 15200,
      skull: 420,
      mindblown: 8700,
      clapping: 5100,
    },
  },

  // 8. @NASA – Feed-to-story (James Webb)
  {
    creatorId: 'u_008',
    creatorName: 'NASA',
    creatorHandle: 'NASA',
    creatorAvatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=nasa&backgroundColor=0D47A1',
    creatorVerified: true,
    creatorCountry: '🇺🇸',
    creatorLanguages: ['en'],
    viewed: false,
    stories: [
      {
        id: 's_008_feed',
        format: 'feed',
        content: 'The James Webb Space Telescope has captured the most detailed image of the early universe ever seen. These galaxies formed just 300 million years after the Big Bang — light that traveled over 13.5 billion years to reach us. We are witnessing the dawn of time itself. 🔭✨',
        language: 'en',
        mediaUrl: 'https://images.unsplash.com/photo-1462332420958-a05d1e002413?w=800',
      },
    ],
    createdAt: '2025-06-13T10:30:00Z',
    viewCount: 487000,
    tippingEnabled: false,
    trendingTopic: '#JamesWebb',
    reactions: {
      agree: 9800,
      disagree: 310,
      fire: 11400,
      skull: 220,
      mindblown: 22100,
      clapping: 7200,
    },
  },
]

// ---------------------------------------------------------------------------
// Trending Topics (10 per tab)
// ---------------------------------------------------------------------------

export const TRENDING_FOR_YOU: TrendingTopic[] = [
  { id: 'tt_fy_01', tag: '#IPL2025', state: 'Pan-India', stateFlag: '🇮🇳', count: 234000 },
  { id: 'tt_fy_02', tag: '#AGI', state: 'Global', stateFlag: '🌍', count: 189000 },
  { id: 'tt_fy_03', tag: '#INDvsAUS', state: 'Pan-India', stateFlag: '🇮🇳', count: 312000 },
  { id: 'tt_fy_04', tag: '#JamesWebb', state: 'Global', stateFlag: '🌍', count: 487000 },
  { id: 'tt_fy_05', tag: '#NationalDogDay', state: 'Pan-India', stateFlag: '🇮🇳', count: 98000 },
  { id: 'tt_fy_06', tag: '#Article370', state: 'Pan-India', stateFlag: '🇮🇳', count: 156000 },
  { id: 'tt_fy_07', tag: '#StartupIndia', state: 'Pan-India', stateFlag: '🇮🇳', count: 74000 },
  { id: 'tt_fy_08', tag: '#Olympics2028', state: 'Global', stateFlag: '🌍', count: 124000 },
  { id: 'tt_fy_09', tag: '#Budget2026', state: 'Pan-India', stateFlag: '🇮🇳', count: 203000 },
  { id: 'tt_fy_10', tag: '#AIinEducation', state: 'Global', stateFlag: '🌍', count: 67000 },
]

export const TRENDING_YOUR_REGION: TrendingTopic[] = [
  { id: 'tt_tr_01', tag: '#HyderabadRains', state: 'Telangana', stateFlag: '🇮🇳', count: 45600 },
  { id: 'tt_tr_02', tag: '#TeluguMovies', state: 'Telangana', stateFlag: '🇮🇳', count: 89200 },
  { id: 'tt_tr_03', tag: '#BiryaniFest', state: 'Telangana', stateFlag: '🇮🇳', count: 32100 },
  { id: 'tt_tr_04', tag: '#TechHub', state: 'Telangana', stateFlag: '🇮🇳', count: 28400 },
  { id: 'tt_tr_05', tag: '#Golconda', state: 'Telangana', stateFlag: '🇮🇳', count: 15700 },
  { id: 'tt_tr_06', tag: '#HITEC', state: 'Telangana', stateFlag: '🇮🇳', count: 12300 },
  { id: 'tt_tr_07', tag: '#Charminar', state: 'Telangana', stateFlag: '🇮🇳', count: 18900 },
  { id: 'tt_tr_08', tag: '#TSJobs', state: 'Telangana', stateFlag: '🇮🇳', count: 34700 },
  { id: 'tt_tr_09', tag: '#RamojiFilmCity', state: 'Telangana', stateFlag: '🇮🇳', count: 22100 },
  { id: 'tt_tr_10', tag: '#HyderabadFood', state: 'Telangana', stateFlag: '🇮🇳', count: 27800 },
]

// ---------------------------------------------------------------------------
// Audience options
// ---------------------------------------------------------------------------

export const AUDIENCE_OPTIONS: { value: StoryAudience; label: string; icon: string }[] = [
  { value: 'everyone', label: 'Everyone', icon: '🌍' },
  { value: 'followers', label: 'Followers only', icon: '👥' },
  { value: 'close_friends', label: 'Close friends', icon: '💚' },
  { value: 'subscribers', label: 'Subscribers only', icon: '⭐' },
]

// ---------------------------------------------------------------------------
// Expiry options
// ---------------------------------------------------------------------------

export const EXPIRY_OPTIONS: { value: StoryExpiry; label: string; description: string }[] = [
  { value: '6h', label: '6 hours', description: 'Quick updates and hot takes' },
  { value: '24h', label: '24 hours', description: 'Classic story — standard choice' },
  { value: '72h', label: '3 days', description: 'Weekend stories & events' },
  { value: 'permanent', label: 'Permanent', description: 'Highlights and important content' },
]

// ---------------------------------------------------------------------------
// Story format config (labels & icons)
// ---------------------------------------------------------------------------

export const STORY_FORMATS: { value: StoryFormat; label: string; icon: string; description: string }[] = [
  { value: 'text', label: 'Text', icon: '📝', description: 'Write a text story with a background' },
  { value: 'voice', label: 'Voice', icon: '🎙️', description: 'Record a voice note story' },
  { value: 'thread', label: 'Thread', icon: '🧵', description: 'Convert a thread into a story series' },
  { value: 'poll', label: 'Poll', icon: '📊', description: 'Ask your audience a question' },
  { value: 'festival', label: 'Festival', icon: '🎉', description: 'Share festival greetings with templates' },
  { value: 'cricket', label: 'Cricket', icon: '🏏', description: 'Live scores and match updates' },
  { value: 'feed', label: 'Feed', icon: '📰', description: 'Embed a post or article as a story' },
]

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

/**
 * Get the full `LanguageOption` object for a given language code.
 */
export function getLanguage(code: Language): LanguageOption {
  return LANGUAGES.find((l) => l.code === code) ?? LANGUAGES[0]
}

/**
 * Map a reaction type to its display emoji.
 */
export function getReactionLabel(type: ReactionType): string {
  const map: Record<ReactionType, string> = {
    agree: '👍',
    disagree: '👎',
    fire: '🔥',
    skull: '💀',
    mindblown: '🤯',
    clapping: '👏',
  }
  return map[type]
}

/**
 * Format a number into a compact human-readable string.
 * Examples: 1200 → "1.2K", 45200 → "45.2K", 1000000 → "1M"
 */
export function formatCount(n: number): string {
  if (n >= 1_000_000) {
    return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  }
  if (n >= 1_000) {
    return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K'
  }
  return n.toString()
}

/**
 * Returns the default detected state for the current user.
 * In a real app this would use geolocation or IP-based detection.
 */
export function getStateName(): string {
  return 'Telangana'
}

/**
 * Returns the festival template matching the given id, or undefined.
 */
export function getFestivalTemplate(id: string): FestivalTemplate | undefined {
  return FESTIVAL_TEMPLATES.find((t) => t.id === id)
}

/**
 * Compute total reactions for a story group.
 */
export function getTotalReactions(reactions: Record<ReactionType, number>): number {
  return Object.values(reactions).reduce((sum, v) => sum + v, 0)
}

/**
 * Get the top reaction type (highest count) for a story group.
 */
export function getTopReaction(reactions: Record<ReactionType, number>): {
  type: ReactionType
  count: number
  emoji: string
} {
  const entries = Object.entries(reactions) as [ReactionType, number][]
  const [type, count] = entries.reduce(
    (best, cur) => (cur[1] > best[1] ? cur : best),
    entries[0],
  )
  return { type, count, emoji: getReactionLabel(type) }
}

/**
 * Sort story groups: unviewed first, then by viewCount descending.
 */
export function sortStoryGroups(groups: StoryGroup[]): StoryGroup[] {
  return [...groups].sort((a, b) => {
    if (a.viewed !== b.viewed) return a.viewed ? 1 : -1
    return b.viewCount - a.viewCount
  })
}
