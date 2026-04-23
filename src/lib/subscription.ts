// ── Subscription & Feature Access ────────────────────────────────────────────
// Black94 is a free platform. All features are available to every user at no cost.

export interface Plan {
  id: 'free'
  name: string
  features: string[]
}

export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Black94 Free',
    features: [
      'Post creation (up to 4000 characters)',
      'Chat messaging with E2E encryption',
      'Stories (text, voice, poll, festival, cricket)',
      'Search & Explore',
      'Blue verification badge',
      'Paid chat functionality',
      'Article creation',
      'Privacy controls',
      'Profile customization',
      'Business tools & dashboard',
      'CRM & ad management',
      'AI-powered tools',
      'Affiliate badges',
    ],
  },
]

export function getCurrentPlan(_subscription?: string): Plan {
  return PLANS[0]
}

// All features are always accessible — platform is fully free
export function canAccessFeature(_subscription: string, _feature: string): boolean {
  return true
}
