/* ═══════════════════════════════════════════════════════════════════════════
   CRM & Ads — Mock Data & Utilities
   ═══════════════════════════════════════════════════════════════════════════ */

export interface Lead {
  id: string
  businessId: string
  name: string
  email: string
  phone: string
  source: 'Ad' | 'Organic' | 'Referral' | 'Chat'
  aiScore: number
  status: 'New' | 'Contacted' | 'Qualified' | 'Converted' | 'Lost'
  notes: string
  createdAt: string
  updatedAt: string
}

export interface Deal {
  id: string
  name: string
  value: number
  contactName: string
  stage: 'New' | 'Contacted' | 'Proposal' | 'Negotiation' | 'Won' | 'Lost'
  createdAt: string
  updatedAt: string
}

export interface Order {
  id: string
  customerName: string
  product: string
  amount: number
  status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled'
  date: string
}

export interface AdCampaign {
  id: string
  name: string
  headline: string
  description: string
  ctaText: string
  ctaUrl: string
  budget: number
  duration: number
  targetAge: string
  targetLocation: string
  interests: string[]
  status: 'Active' | 'Paused' | 'Ended'
  impressions: number
  clicks: number
  spend: number
  conversions: number
  createdAt: string
}

export interface CrmAnalytics {
  totalRevenue: number
  totalLeads: number
  conversionRate: number
  avgDealSize: number
  customerLifetimeValue: number
  activeCustomers: number
}

/* ── Mock Leads ─────────────────────────────────────────────────────────── */

export const mockLeads: Lead[] = [
  {
    id: 'L001', businessId: 'B001', name: 'Arjun Mehta', email: 'arjun.mehta@gmail.com',
    phone: '+91 98765 43210', source: 'Ad', aiScore: 92, status: 'Qualified',
    notes: 'Interested in premium plan. Follow up next week.', createdAt: '2025-01-15', updatedAt: '2025-01-20',
  },
  {
    id: 'L002', businessId: 'B001', name: 'Priya Sharma', email: 'priya.s@outlook.com',
    phone: '+91 87654 32109', source: 'Organic', aiScore: 78, status: 'Contacted',
    notes: 'Requested demo of the platform.', createdAt: '2025-01-18', updatedAt: '2025-01-22',
  },
  {
    id: 'L003', businessId: 'B001', name: 'Rahul Verma', email: 'rahul.v@yahoo.com',
    phone: '+91 76543 21098', source: 'Referral', aiScore: 45, status: 'New',
    notes: 'Referred by Priya Sharma.', createdAt: '2025-01-22', updatedAt: '2025-01-22',
  },
  {
    id: 'L004', businessId: 'B001', name: 'Sneha Kulkarni', email: 'sneha.k@gmail.com',
    phone: '+91 99887 76655', source: 'Chat', aiScore: 88, status: 'Converted',
    notes: 'Closed deal for annual subscription.', createdAt: '2025-01-10', updatedAt: '2025-01-25',
  },
  {
    id: 'L005', businessId: 'B001', name: 'Vikram Patel', email: 'vikram.p@gmail.com',
    phone: '+91 88776 65544', source: 'Ad', aiScore: 34, status: 'Lost',
    notes: 'Went with a competitor.', createdAt: '2025-01-08', updatedAt: '2025-01-20',
  },
  {
    id: 'L006', businessId: 'B001', name: 'Ananya Reddy', email: 'ananya.r@gmail.com',
    phone: '+91 77665 54433', source: 'Organic', aiScore: 67, status: 'Contacted',
    notes: 'Met at startup event. Exploring options.', createdAt: '2025-01-20', updatedAt: '2025-01-24',
  },
  {
    id: 'L007', businessId: 'B001', name: 'Deepak Joshi', email: 'deepak.j@rediff.com',
    phone: '+91 66554 43322', source: 'Ad', aiScore: 81, status: 'Qualified',
    notes: 'Running an e-commerce store. Needs multi-channel support.', createdAt: '2025-01-16', updatedAt: '2025-01-23',
  },
  {
    id: 'L008', businessId: 'B001', name: 'Kavita Nair', email: 'kavita.n@gmail.com',
    phone: '+91 55443 32211', source: 'Chat', aiScore: 55, status: 'New',
    notes: 'Inquired about pricing for team plan.', createdAt: '2025-01-24', updatedAt: '2025-01-24',
  },
]

/* ── Mock Deals ─────────────────────────────────────────────────────────── */

export const mockDeals: Deal[] = [
  { id: 'D001', name: 'Annual Subscription – Mehta Corp', value: 120000, contactName: 'Arjun Mehta', stage: 'Proposal', createdAt: '2025-01-15', updatedAt: '2025-01-22' },
  { id: 'D002', name: 'Enterprise Setup – TechFlow', value: 350000, contactName: 'Sneha Kulkarni', stage: 'Won', createdAt: '2025-01-10', updatedAt: '2025-01-25' },
  { id: 'D003', name: 'Basic Plan – QuickServe', value: 24000, contactName: 'Priya Sharma', stage: 'Contacted', createdAt: '2025-01-18', updatedAt: '2025-01-22' },
  { id: 'D004', name: 'Pro Plan – ShopEasy', value: 48000, contactName: 'Deepak Joshi', stage: 'Negotiation', createdAt: '2025-01-16', updatedAt: '2025-01-24' },
  { id: 'D005', name: 'Custom Integration – DataMiners', value: 200000, contactName: 'Vikram Patel', stage: 'Lost', createdAt: '2025-01-08', updatedAt: '2025-01-20' },
  { id: 'D006', name: 'Starter Bundle – FreshBite', value: 12000, contactName: 'Ananya Reddy', stage: 'New', createdAt: '2025-01-20', updatedAt: '2025-01-20' },
  { id: 'D007', name: 'Team Plan – EduFirst', value: 72000, contactName: 'Kavita Nair', stage: 'New', createdAt: '2025-01-24', updatedAt: '2025-01-24' },
]

/* ── Mock Orders ────────────────────────────────────────────────────────── */

export const mockOrders: Order[] = [
  { id: 'ORD-2401', customerName: 'Arjun Mehta', product: 'Premium Plan (Annual)', amount: 120000, status: 'Delivered', date: '2025-01-15' },
  { id: 'ORD-2402', customerName: 'Sneha Kulkarni', product: 'Enterprise Setup', amount: 350000, status: 'Shipped', date: '2025-01-18' },
  { id: 'ORD-2403', customerName: 'Priya Sharma', product: 'Basic Plan', amount: 24000, status: 'Processing', date: '2025-01-20' },
  { id: 'ORD-2404', customerName: 'Deepak Joshi', product: 'Pro Plan (6 months)', amount: 48000, status: 'Pending', date: '2025-01-22' },
  { id: 'ORD-2405', customerName: 'Vikram Patel', product: 'Custom Integration', amount: 200000, status: 'Cancelled', date: '2025-01-12' },
  { id: 'ORD-2406', customerName: 'Ananya Reddy', product: 'Starter Bundle', amount: 12000, status: 'Delivered', date: '2025-01-23' },
  { id: 'ORD-2407', customerName: 'Kavita Nair', product: 'Team Plan', amount: 72000, status: 'Shipped', date: '2025-01-25' },
]

/* ── Mock Ad Campaigns ──────────────────────────────────────────────────── */

export const mockAdCampaigns: AdCampaign[] = [
  {
    id: 'AD001', name: 'Diwali Sale 2025', headline: 'Grand Diwali Offers!', description: 'Up to 60% off on all plans this Diwali season.',
    ctaText: 'Shop Now', ctaUrl: 'https://black94.in/diwali', budget: 50000, duration: 14,
    targetAge: '25-34', targetLocation: 'Metro Cities', interests: ['Technology', 'Business'],
    status: 'Active', impressions: 245000, clicks: 8200, spend: 18450, conversions: 410, createdAt: '2025-01-10',
  },
  {
    id: 'AD002', name: 'New Year Growth', headline: 'Start Fresh with Black94', description: 'Boost your business in the new year with our powerful tools.',
    ctaText: 'Sign Up', ctaUrl: 'https://black94.in/newyear', budget: 30000, duration: 7,
    targetAge: '18-24', targetLocation: 'All India', interests: ['Technology', 'Fashion'],
    status: 'Active', impressions: 180000, clicks: 5400, spend: 9720, conversions: 270, createdAt: '2025-01-01',
  },
  {
    id: 'AD003', name: 'Founder Festival Push', headline: 'Build Your Empire', description: 'Tools designed for entrepreneurs and creators.',
    ctaText: 'Learn More', ctaUrl: 'https://black94.in/founders', budget: 25000, duration: 30,
    targetAge: '35-44', targetLocation: 'Tier 2 Cities', interests: ['Business', 'Food'],
    status: 'Paused', impressions: 95000, clicks: 2850, spend: 5700, conversions: 142, createdAt: '2024-12-15',
  },
  {
    id: 'AD004', name: 'Campus Ambassador', headline: 'Join the Movement', description: 'Become a campus ambassador and earn while you learn.',
    ctaText: 'Sign Up', ctaUrl: 'https://black94.in/campus', budget: 10000, duration: 7,
    targetAge: '18-24', targetLocation: 'All India', interests: ['Music', 'Sports'],
    status: 'Ended', impressions: 320000, clicks: 12800, spend: 10000, conversions: 640, createdAt: '2024-11-01',
  },
  {
    id: 'AD005', name: 'Product Hunt Launch', headline: 'We Launched on Product Hunt!', description: 'Check out Black94 — India\'s fastest growing social platform.',
    ctaText: 'Learn More', ctaUrl: 'https://producthunt.com/posts/black94', budget: 5000, duration: 3,
    targetAge: '25-34', targetLocation: 'All India', interests: ['Technology'],
    status: 'Ended', impressions: 150000, clicks: 9000, spend: 5000, conversions: 450, createdAt: '2024-10-15',
  },
]

/* ── Mock Analytics ─────────────────────────────────────────────────────── */

export const mockAnalytics: CrmAnalytics = {
  totalRevenue: 626000,
  totalLeads: 8,
  conversionRate: 12.5,
  avgDealSize: 89428,
  customerLifetimeValue: 185000,
  activeCustomers: 156,
}

/* ── Revenue chart data (last 6 months) ─────────────────────────────────── */

export const monthlyRevenueData = [
  { month: 'Aug', revenue: 320000 },
  { month: 'Sep', revenue: 410000 },
  { month: 'Oct', revenue: 380000 },
  { month: 'Nov', revenue: 520000 },
  { month: 'Dec', revenue: 490000 },
  { month: 'Jan', revenue: 626000 },
]

/* ── Impressions chart data (last 7 days) ───────────────────────────────── */

export const dailyImpressionsData = [
  { day: 'Mon', impressions: 42000 },
  { day: 'Tue', impressions: 38000 },
  { day: 'Wed', impressions: 55000 },
  { day: 'Thu', impressions: 47000 },
  { day: 'Fri', impressions: 61000 },
  { day: 'Sat', impressions: 73000 },
  { day: 'Sun', impressions: 65000 },
]

/* ── Lead source distribution ───────────────────────────────────────────── */

export const leadSourceData = [
  { source: 'Ad', count: 3, color: '#D4A574' },
  { source: 'Organic', count: 2, color: '#ffd700' },
  { source: 'Referral', count: 1, color: '#ff6b6b' },
  { source: 'Chat', count: 2, color: '#6bc5ff' },
]

/* ── Top products / services ────────────────────────────────────────────── */

export const topProductsData = [
  { name: 'Premium Plan (Annual)', revenue: 120000 },
  { name: 'Enterprise Setup', revenue: 350000 },
  { name: 'Team Plan', revenue: 72000 },
  { name: 'Pro Plan (6 months)', revenue: 48000 },
  { name: 'Custom Integration', revenue: 200000 },
]

/* ── Customer acquisition trend (last 6 months) ─────────────────────────── */

export const acquisitionTrend = [
  { month: 'Aug', customers: 85 },
  { month: 'Sep', customers: 102 },
  { month: 'Oct', customers: 118 },
  { month: 'Nov', customers: 134 },
  { month: 'Dec', customers: 148 },
  { month: 'Jan', customers: 156 },
]

/* ── Recent Activity ────────────────────────────────────────────────────── */

export const recentActivity = [
  { id: 'A1', text: 'Diwali Sale 2025 ad was approved', time: '2 hours ago', type: 'success' as const },
  { id: 'A2', text: 'Budget limit reached for Campus Ambassador', time: '5 hours ago', type: 'warning' as const },
  { id: 'A3', text: 'New Year Growth campaign reached 180K impressions', time: '1 day ago', type: 'info' as const },
  { id: 'A4', text: 'Founder Festival Push was paused', time: '2 days ago', type: 'neutral' as const },
  { id: 'A5', text: 'Product Hunt Launch ended — 9K clicks', time: '3 days ago', type: 'info' as const },
]

/* ── Utility Functions ──────────────────────────────────────────────────── */

export function getLeadScoreColor(score: number): string {
  if (score > 80) return 'text-[#D4A574]'
  if (score >= 50) return 'text-[#ffd700]'
  return 'text-[#ff6b6b]'
}

export function getLeadScoreBg(score: number): string {
  if (score > 80) return 'bg-[#D4A574]/15 text-[#D4A574]'
  if (score >= 50) return 'bg-[#ffd700]/15 text-[#ffd700]'
  return 'bg-[#ff6b6b]/15 text-[#ff6b6b]'
}

export function getStageColor(stage: string): string {
  switch (stage) {
    case 'New': return 'bg-blue-500/15 text-blue-400'
    case 'Contacted': return 'bg-yellow-500/15 text-yellow-400'
    case 'Proposal': return 'bg-[#D4A574]/15 text-[#D4A574]'
    case 'Negotiation': return 'bg-orange-500/15 text-orange-400'
    case 'Won': return 'bg-[#D4A574]/15 text-[#D4A574]'
    case 'Lost': return 'bg-red-500/15 text-red-400'
    default: return 'bg-white/10 text-[#94a3b8]'
  }
}

export function getOrderStatusColor(status: string): string {
  switch (status) {
    case 'Pending': return 'bg-yellow-500/15 text-yellow-400'
    case 'Processing': return 'bg-blue-500/15 text-blue-400'
    case 'Shipped': return 'bg-[#D4A574]/15 text-[#D4A574]'
    case 'Delivered': return 'bg-[#D4A574]/15 text-[#D4A574]'
    case 'Cancelled': return 'bg-red-500/15 text-red-400'
    default: return 'bg-white/10 text-[#94a3b8]'
  }
}

export function getAdStatusColor(status: string): string {
  switch (status) {
    case 'Active': return 'bg-[#D4A574]/15 text-[#D4A574]'
    case 'Paused': return 'bg-yellow-500/15 text-yellow-400'
    case 'Ended': return 'bg-white/10 text-[#94a3b8]'
    default: return 'bg-white/10 text-[#94a3b8]'
  }
}

export function getLeadSourceColor(source: string): string {
  switch (source) {
    case 'Ad': return 'bg-[#D4A574]/15 text-[#D4A574]'
    case 'Organic': return 'bg-[#ffd700]/15 text-[#ffd700]'
    case 'Referral': return 'bg-[#D4A574]/15 text-[#D4A574]'
    case 'Chat': return 'bg-blue-500/15 text-blue-400'
    default: return 'bg-white/10 text-[#94a3b8]'
  }
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
