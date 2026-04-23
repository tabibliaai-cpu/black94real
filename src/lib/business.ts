// ═══════════════════════════════════════════════════════════════
// Business Types & Utilities for Black94
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

// ── Default data arrays (populated from server) ──────────────────────────────

export const affiliatesData: Affiliate[] = []

export const teamMembersData: TeamMember[] = []

export const campaignPerformanceData: CampaignPerformance[] = []

export const channelPerformanceData: ChannelPerformance[] = []

export const abTestsData: ABTest[] = []

export const aiSuggestionsData: AISuggestion[] = []

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

const PRO_TRIAL_DURATION_DAYS = 7
const GOLD_TRIAL_DURATION_DAYS = 7
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

export async function startProTrial(uid: string): Promise<void> {
  const now = new Date()
  const endDate = new Date(now.getTime() + PRO_TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000)

  const userRef = doc(db, 'users', uid)
  await updateDoc(userRef, {
    subscription: 'pro',
    badge: 'blue',
    isVerified: true,
    role: 'professional',
    updatedAt: serverTimestamp(),
  })

  const trialRef = doc(db, 'subscription_trials', `pro_${uid}`)
  await setDoc(trialRef, {
    uid,
    plan: 'pro',
    startDate: now.toISOString(),
    endDate: endDate.toISOString(),
    isActive: true,
    createdAt: serverTimestamp(),
  })
}

export async function startGoldTrial(uid: string): Promise<void> {
  const now = new Date()
  const endDate = new Date(now.getTime() + GOLD_TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000)

  const userRef = doc(db, 'users', uid)
  await updateDoc(userRef, {
    subscription: 'gold',
    badge: 'gold',
    isVerified: true,
    role: 'business',
    updatedAt: serverTimestamp(),
  })

  const trialRef = doc(db, 'subscription_trials', `gold_${uid}`)
  await setDoc(trialRef, {
    uid,
    plan: 'gold',
    startDate: now.toISOString(),
    endDate: endDate.toISOString(),
    isActive: true,
    createdAt: serverTimestamp(),
  })
}

export async function getSubscriptionTrial(uid: string, plan: 'pro' | 'gold'): Promise<BusinessTrial | null> {
  const trialRef = doc(db, 'subscription_trials', `${plan}_${uid}`)
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
    plan: d.plan ?? plan,
    startDate,
    endDate,
    isActive,
    daysRemaining,
  }
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
