'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/stores/app'
import { updateUser } from '@/lib/db'
import { PAvatar, VerifiedBadge } from '@/components/PAvatar'
import { toast } from 'sonner'

/* ═══════════════════════════════════════════════════════════════════════════
   EDIT PROFILE VIEW — Only profile editing: name, username, bio, website
   ═══════════════════════════════════════════════════════════════════════════ */

export function SettingsView() {
  const user = useAppStore((s) => s.user)
  const navigate = useAppStore((s) => s.navigate)

  const [displayName, setDisplayName] = useState(user?.displayName || '')
  const [username, setUsername] = useState(user?.username || '')
  const [bio, setBio] = useState(user?.bio || '')
  const [website, setWebsite] = useState(user?.nameVisibility || '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    try {
      await updateUser(user.id, { displayName, bio })
      toast.success('Profile updated')
    } catch {
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="px-4 pt-2 pb-24 space-y-5">
      {/* ─── Header ─── */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('feed')} className="p-2 -ml-2 rounded-full hover:bg-white/[0.06] transition-colors">
          <svg className="w-5 h-5 text-[#e7e9ea]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <h1 className="text-xl font-bold text-[#e7e9ea]">Edit Profile</h1>
      </div>

      {/* ─── Profile Avatar ─── */}
      <div className="flex items-center gap-4">
        <PAvatar src={user?.profileImage} name={user?.displayName} size={80} verified={user?.isVerified} badge={user?.badge} />
        <div>
          <p className="font-bold text-[15px] text-[#e7e9ea] flex items-center gap-1">
            {user?.displayName}
            {(user?.isVerified || !!user?.badge) && <VerifiedBadge size={14} badge={user?.badge} />}
          </p>
          <p className="text-[14px] text-[#94a3b8]">@{user?.username}</p>
          <button className="mt-2 text-[14px] text-[#8b5cf6] font-semibold hover:text-[#7c3aed] transition-colors">
            Change photo
          </button>
        </div>
      </div>

      {/* ─── Form Fields ─── */}
      <div className="space-y-4">
        {/* Display Name */}
        <div className="space-y-1.5">
          <label className="text-[14px] text-[#94a3b8] font-medium">Display Name</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full bg-transparent border border-white/[0.08] rounded-xl px-4 py-3 text-[15px] text-[#e7e9ea] placeholder-[#64748b] outline-none focus:border-[#8b5cf6]/50 transition-colors"
            placeholder="Your display name"
          />
        </div>

        {/* Username */}
        <div className="space-y-1.5">
          <label className="text-[14px] text-[#94a3b8] font-medium">Username</label>
          <div className="flex items-center bg-transparent border border-white/[0.08] rounded-xl px-4 py-3 focus-within:border-[#8b5cf6]/50 transition-colors">
            <span className="text-[15px] text-[#64748b] mr-1">@</span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="flex-1 bg-transparent text-[15px] text-[#e7e9ea] placeholder-[#64748b] outline-none"
              placeholder="username"
            />
          </div>
        </div>

        {/* Bio */}
        <div className="space-y-1.5">
          <label className="text-[14px] text-[#94a3b8] font-medium">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={160}
            rows={3}
            className="w-full bg-transparent border border-white/[0.08] rounded-xl px-4 py-3 text-[15px] text-[#e7e9ea] placeholder-[#64748b] outline-none focus:border-[#8b5cf6]/50 transition-colors resize-none"
            placeholder="Tell us about yourself"
          />
          <p className="text-[13px] text-[#94a3b8] text-right">{bio.length}/160</p>
        </div>

        {/* Website */}
        <div className="space-y-1.5">
          <label className="text-[14px] text-[#94a3b8] font-medium">Website</label>
          <input
            type="url"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            className="w-full bg-transparent border border-white/[0.08] rounded-xl px-4 py-3 text-[15px] text-[#e7e9ea] placeholder-[#64748b] outline-none focus:border-[#8b5cf6]/50 transition-colors"
            placeholder="https://yourwebsite.com"
          />
        </div>
      </div>

      {/* ─── Save Button ─── */}
      <button
        onClick={handleSave}
        disabled={saving}
        className={cn(
          'w-full py-3 rounded-full text-[15px] font-bold transition-all',
          !saving
            ? 'bg-[#e7e9ea] text-black hover:bg-gray-200 active:scale-[0.98]'
            : 'bg-white/[0.08] text-[#64748b]'
        )}
      >
        {saving ? 'Saving...' : 'Save changes'}
      </button>
    </div>
  )
}
