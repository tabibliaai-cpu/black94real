// ═══════════════════════════════════════════════════════════════
// Business mock data & utility functions for Black94
// ═══════════════════════════════════════════════════════════════

export interface Affiliate {
  id: string
  name: string
  email: string
  role: string
  businessName: string
  badgeAssignedAt: string
  status: 'active' | 'revoked'
}

export interface Commission {
  sale: string
  amount: number
  percentage: number
}

export interface Incentive {
  type: string
  amount: number
  reason: string
}

export interface TeamMember {
  id: string
  name: string
  role: string
  avatar: string
  baseSalary: number
  commissions: Commission[]
  incentives: Incentive[]
  paymentStatus: 'paid' | 'pending'
  paymentDate: string | null
}

export interface PayrollSummary {
  totalSalary: number
  totalCommissions: number
  totalIncentives: number
  grandTotal: number
}

export interface CampaignPerformance {
  id: string
  name: string
  impressions: number
  clicks: number
  ctr: number
  conversions: number
  roi: number
  budget: number
  budgetUsed: number
  status: 'active' | 'paused' | 'completed'
}

export interface ChannelPerformance {
  channel: string
  impressions: number
  clicks: number
  ctr: number
}

export interface ABTest {
  id: string
  name: string
  variantA: {
    impressions: number
    clicks: number
    conversions: number
  }
  variantB: {
    impressions: number
    clicks: number
    conversions: number
  }
  winner: 'A' | 'B' | null
}

export interface AISuggestion {
  id: string
  text: string
  impact: 'high' | 'medium' | 'low'
  category: string
}

export interface BusinessTrial {
  uid: string
  plan: 'trial' | 'pro' | 'enterprise'
  startDate: string
  endDate: string
  isActive: boolean
  daysRemaining: number
}

// ── Mock Affiliates ──────────────────────────────────────────
export const mockAffiliates: Affiliate[] = [
  {
    id: 'aff-001',
    name: 'Priya Sharma',
    email: 'priya.sharma@techcorp.in',
    role: 'Sales Lead',
    businessName: 'NovaTech Solutions',
    badgeAssignedAt: '2024-11-15T10:30:00Z',
    status: 'active',
  },
  {
    id: 'aff-002',
    name: 'Rahul Verma',
    email: 'rahul.v@novatech.in',
    role: 'Account Executive',
    businessName: 'NovaTech Solutions',
    badgeAssignedAt: '2025-01-08T14:00:00Z',
    status: 'active',
  },
  {
    id: 'aff-003',
    name: 'Ananya Gupta',
    email: 'ananya.g@partner.co',
    role: 'Brand Representative',
    businessName: 'NovaTech Solutions',
    badgeAssignedAt: '2025-03-22T09:15:00Z',
    status: 'active',
  },
]

// ── Mock Team Members ────────────────────────────────────────
export const mockTeamMembers: TeamMember[] = [
  {
    id: 'tm-001',
    name: 'Priya Sharma',
    role: 'Sales Lead',
    avatar: 'PS',
    baseSalary: 65000,
    commissions: [
      { sale: 'Enterprise License — Acme Corp', amount: 18500, percentage: 5 },
      { sale: 'SaaS Onboarding — Beta Inc', amount: 9200, percentage: 3 },
      { sale: 'Annual Contract — Zenith Ltd', amount: 24600, percentage: 6 },
    ],
    incentives: [
      { type: 'Quarterly Target Bonus', amount: 8000, reason: 'Exceeded 120% of quarterly target' },
      { type: 'Referral Bonus', amount: 3000, reason: 'Referred 2 enterprise clients' },
    ],
    paymentStatus: 'paid',
    paymentDate: '2025-06-01',
  },
  {
    id: 'tm-002',
    name: 'Rahul Verma',
    role: 'Account Executive',
    avatar: 'RV',
    baseSalary: 48000,
    commissions: [
      { sale: 'Starter Plan — FreshStart', amount: 4200, percentage: 2 },
      { sale: 'Growth Plan — CloudNine', amount: 7800, percentage: 4 },
    ],
    incentives: [
      { type: 'New Client Bonus', amount: 2000, reason: 'Onboarded 5 new clients this month' },
    ],
    paymentStatus: 'paid',
    paymentDate: '2025-06-01',
  },
  {
    id: 'tm-003',
    name: 'Ananya Gupta',
    role: 'Brand Representative',
    avatar: 'AG',
    baseSalary: 42000,
    commissions: [
      { sale: 'Partnership Deal — RetailHub', amount: 12000, percentage: 4 },
    ],
    incentives: [
      { type: 'Event Bonus', amount: 5000, reason: 'Successfully managed product launch event' },
      { type: 'Social Reach Bonus', amount: 2500, reason: 'Achieved 50K+ impressions on campaign content' },
    ],
    paymentStatus: 'pending',
    paymentDate: null,
  },
  {
    id: 'tm-004',
    name: 'Kiran Patel',
    role: 'Marketing Coordinator',
    avatar: 'KP',
    baseSalary: 38000,
    commissions: [
      { sale: 'Ad Campaign — FoodExpress', amount: 5500, percentage: 3 },
      { sale: 'Content Package — StyleHub', amount: 3200, percentage: 2 },
      { sale: 'Brand Deal — FitLife', amount: 8800, percentage: 4 },
    ],
    incentives: [
      { type: 'Content Excellence', amount: 4000, reason: 'Viral post with 200K+ engagement' },
    ],
    paymentStatus: 'pending',
    paymentDate: null,
  },
]

// ── Mock Campaign Performance ────────────────────────────────
export const mockCampaignPerformance: CampaignPerformance[] = [
  {
    id: 'camp-001',
    name: 'Summer Product Launch',
    impressions: 284500,
    clicks: 14200,
    ctr: 4.99,
    conversions: 1856,
    roi: 342,
    budget: 150000,
    budgetUsed: 127500,
    status: 'active',
  },
  {
    id: 'camp-002',
    name: 'Brand Awareness — Q2',
    impressions: 523000,
    clicks: 18830,
    ctr: 3.6,
    conversions: 942,
    roi: 218,
    budget: 200000,
    budgetUsed: 200000,
    status: 'completed',
  },
  {
    id: 'camp-003',
    name: 'Lead Gen — Enterprise',
    impressions: 98400,
    clicks: 6888,
    ctr: 7.0,
    conversions: 412,
    roi: 520,
    budget: 80000,
    budgetUsed: 52400,
    status: 'active',
  },
  {
    id: 'camp-004',
    name: 'Retargeting — Cart Abandon',
    impressions: 156700,
    clicks: 10970,
    ctr: 7.0,
    conversions: 2840,
    roi: 680,
    budget: 60000,
    budgetUsed: 38400,
    status: 'active',
  },
]

// ── Mock Channel Performance ─────────────────────────────────
export const mockChannelPerformance: ChannelPerformance[] = [
  { channel: 'Feed Ads', impressions: 412000, clicks: 22660, ctr: 5.5 },
  { channel: 'Comment Ads', impressions: 198000, clicks: 13986, ctr: 7.07 },
  { channel: 'Profile Ads', impressions: 352600, clicks: 11283, ctr: 3.2 },
]

// ── Mock A/B Tests ───────────────────────────────────────────
export const mockABTests: ABTest[] = [
  {
    id: 'ab-001',
    name: 'Hero Image — Product vs Lifestyle',
    variantA: { impressions: 52000, clicks: 2600, conversions: 312 },
    variantB: { impressions: 51800, clicks: 3110, conversions: 415 },
    winner: 'B',
  },
  {
    id: 'ab-002',
    name: 'CTA Color — Green vs Gold',
    variantA: { impressions: 44500, clicks: 2890, conversions: 380 },
    variantB: { impressions: 44200, clicks: 2210, conversions: 288 },
    winner: 'A',
  },
]

// ── Mock AI Suggestions ──────────────────────────────────────
export const mockAISuggestions: AISuggestion[] = [
  {
    id: 'ai-001',
    text: 'Increase bid for 25-34 age group by 15% — this segment has the highest conversion rate at 8.2%.',
    impact: 'high',
    category: 'Bidding',
  },
  {
    id: 'ai-002',
    text: 'Shift 20% budget from Feed to Comment ads — Comment ads show 28% higher CTR this month.',
    impact: 'high',
    category: 'Budget',
  },
  {
    id: 'ai-003',
    text: 'Schedule "Summer Product Launch" ads between 6-9 PM IST for 40% more engagement from target audience.',
    impact: 'medium',
    category: 'Scheduling',
  },
  {
    id: 'ai-004',
    text: 'Pause "Brand Awareness — Q2" campaign — budget fully spent and ROI has plateaued over the last 5 days.',
    impact: 'low',
    category: 'Budget',
  },
]

// ── Utility Functions ────────────────────────────────────────

export function calculatePayrollSummary(members: TeamMember[]): PayrollSummary {
  const totalSalary = members.reduce((sum, m) => sum + m.baseSalary, 0)
  const totalCommissions = members.reduce(
    (sum, m) => sum + m.commissions.reduce((s, c) => s + c.amount, 0),
    0
  )
  const totalIncentives = members.reduce(
    (sum, m) => sum + m.incentives.reduce((s, i) => s + i.amount, 0),
    0
  )
  return {
    totalSalary,
    totalCommissions,
    totalIncentives,
    grandTotal: totalSalary + totalCommissions + totalIncentives,
  }
}

export function calculateOverallScore(campaigns: CampaignPerformance[]): number {
  if (campaigns.length === 0) return 0
  const avgCtr = campaigns.reduce((s, c) => s + c.ctr, 0) / campaigns.length
  const avgRoi = campaigns.reduce((s, c) => s + c.roi, 0) / campaigns.length
  const ctrScore = Math.min(avgCtr / 8, 1) * 40
  const roiScore = Math.min(avgRoi / 700, 1) * 40
  const budgetEfficiency =
    campaigns.reduce((s, c) => s + c.budgetUsed / c.budget, 0) / campaigns.length
  const budgetScore = Math.min(budgetEfficiency, 1) * 20
  return Math.round(ctrScore + roiScore + budgetScore)
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}

/* ═════════════════════════════════════════════════════════════════════════════════
   BUSINESS TRIAL MANAGEMENT
   ═════════════════════════════════════════════════════════════════════════════════ */

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from './firebase'

const TRIAL_DURATION_DAYS = 30

function tsToISO(value: unknown): string {
  if (value && typeof value === 'object' && 'seconds' in value) {
    const ts = value as { seconds: number; nanoseconds: number }
    return new Date(ts.seconds * 1000 + ts.nanoseconds / 1_000_000).toISOString()
  }
  if (value instanceof Date) return value.toISOString()
  if (typeof value === 'string') return value
  return new Date().toISOString()
}

export async function upgradeToBusinessTrial(uid: string): Promise<void> {
  const now = new Date()
  const endDate = new Date(now.getTime() + TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000)

  const userRef = doc(db, 'users', uid)
  await updateDoc(userRef, {
    role: 'business',
    badge: 'gold',
    isVerified: true,
    updatedAt: serverTimestamp(),
  })

  const trialRef = doc(db, 'business_trials', uid)
  await setDoc(trialRef, {
    uid,
    plan: 'trial',
    startDate: now.toISOString(),
    endDate: endDate.toISOString(),
    isActive: true,
    createdAt: serverTimestamp(),
  })
}

export async function getBusinessTrial(uid: string): Promise<BusinessTrial | null> {
  const trialRef = doc(db, 'business_trials', uid)
  const snap = await getDoc(trialRef)

  if (!snap.exists()) return null

  const d = snap.data()
  const startDate = tsToISO(d.startDate)
  const endDate = tsToISO(d.endDate)
  const now = new Date()
  const end = new Date(endDate)
  const isActive = now < end && d.isActive !== false
  const daysRemaining = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))

  return {
    uid: d.uid ?? uid,
    plan: d.plan ?? 'trial',
    startDate,
    endDate,
    isActive,
    daysRemaining,
  }
}

export function isTrialActive(trial: BusinessTrial): boolean {
  return trial.isActive && trial.daysRemaining > 0
}
