export interface Plan {
  id: 'free' | 'pro' | 'gold'
  name: string
  price: number
  currency: string
  billingCycle: string
  features: string[]
  badgeColor: string
  popular?: boolean
}

export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free Plan',
    price: 0,
    currency: '₹',
    billingCycle: 'Forever free',
    badgeColor: '#94a3b8',
    features: [
      'Post creation',
      'Chat messaging',
      'Stories',
      'Search & Explore',
      'Basic profile',
    ],
  },
  {
    id: 'pro',
    name: 'Premium Plan',
    price: 449,
    currency: '₹',
    billingCycle: 'month',
    badgeColor: '#3b82f6',
    popular: true,
    features: [
      'Blue tick verification',
      'Advanced privacy features',
      'Paid chat functionality',
      'Article creation',
      'Priority support',
      'Everything in Free',
    ],
  },
  {
    id: 'gold',
    name: 'Business Plan',
    price: 1599,
    currency: '₹',
    billingCycle: 'month',
    badgeColor: '#ffd700',
    features: [
      'Gold tick verification',
      'Affiliate badge system',
      'Business dashboard',
      'CRM system',
      'Ad creation & analytics',
      'AI-powered tools',
      'Everything in Premium',
    ],
  },
]

export function getCurrentPlan(subscription: string): Plan {
  const match = PLANS.find((p) => p.id === subscription)
  return match ?? PLANS[0]
}

export interface FeatureAccess {
  name: string
  free: boolean
  pro: boolean
  gold: boolean
}

export const FEATURE_COMPARISON: FeatureAccess[] = [
  { name: 'Post creation', free: true, pro: true, gold: true },
  { name: 'Chat', free: true, pro: true, gold: true },
  { name: 'Stories', free: true, pro: true, gold: true },
  { name: 'Search', free: true, pro: true, gold: true },
  { name: 'Profile verification', free: false, pro: true, gold: true },
  { name: 'Privacy controls', free: false, pro: true, gold: true },
  { name: 'Paid chat', free: false, pro: true, gold: true },
  { name: 'Articles', free: false, pro: true, gold: true },
  { name: 'Business tools', free: false, pro: false, gold: true },
  { name: 'CRM', free: false, pro: false, gold: true },
  { name: 'Ad manager', free: false, pro: false, gold: true },
  { name: 'AI tools', free: false, pro: false, gold: true },
  { name: 'Affiliate badges', free: false, pro: false, gold: true },
  { name: 'Support', free: false, pro: true, gold: true },
]

export function canAccessFeature(subscription: string, feature: string): boolean {
  const row = FEATURE_COMPARISON.find((f) => f.name.toLowerCase() === feature.toLowerCase())
  if (!row) return false
  if (subscription === 'gold') return row.gold
  if (subscription === 'pro') return row.pro
  return row.free
}

export interface BillingEntry {
  id: string
  date: string
  amount: number
  plan: string
  status: 'paid' | 'pending'
}

export const billingHistoryData: BillingEntry[] = []
