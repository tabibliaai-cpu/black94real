'use client'

import { useEffect, useState } from 'react'
import { auth, db } from '@/lib/firebase'
import { doc, updateDoc, getDoc } from 'firebase/firestore'
import { onAuthStateChanged } from '@/lib/firebase'

export default function UpgradeRolePage() {
  const [status, setStatus] = useState('Waiting for auth...')
  const [uid, setUid] = useState<string | null>(null)
  const [currentRole, setCurrentRole] = useState('')

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setStatus('ERROR: No authenticated user. Please sign in first, then visit this page.')
        return
      }

      const userId = user.uid
      setUid(userId)
      setStatus(`Authenticated as ${user.email}. Reading current role...`)

      try {
        const userRef = doc(db, 'users', userId)
        const snap = await getDoc(userRef)

        if (!snap.exists()) {
          setStatus('ERROR: User document not found in Firestore.')
          return
        }

        const data = snap.data()
        const prevRole = data.role || 'personal'
        setCurrentRole(prevRole)

        if (prevRole === 'business') {
          setStatus(`Already a business account! No changes needed. (uid: ${userId})`)
          return
        }

        setStatus(`Current role: "${prevRole}". Updating to "business"...`)

        await updateDoc(userRef, { role: 'business' })

        setStatus(`SUCCESS! Role updated from "${prevRole}" to "business" for uid: ${userId}. You can now close this page.`)
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        setStatus(`ERROR: ${msg}`)
      }
    })

    return () => unsub()
  }, [])

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="max-w-lg w-full bg-[#0a0a0a] border border-white/[0.08] rounded-2xl p-6">
        <h1 className="text-xl font-bold text-[#e8f0dc] mb-2">Account Upgrade</h1>
        <p className="text-sm text-[#71767b] mb-4">Setting account role to Business</p>
        
        <div className="bg-black/50 rounded-xl p-4 mb-4">
          <p className="text-[13px] text-[#71767b] mb-1">UID</p>
          <p className="text-[14px] font-mono text-[#e8f0dc]">{uid || '—'}</p>
        </div>

        <div className="bg-black/50 rounded-xl p-4 mb-4">
          <p className="text-[13px] text-[#71767b] mb-1">Current Role</p>
          <p className="text-[14px] font-mono text-[#e8f0dc]">{currentRole || '—'}</p>
        </div>

        <div className={`
          rounded-xl p-4 text-[14px] leading-relaxed
          ${status.startsWith('SUCCESS') ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 
            status.startsWith('ERROR') ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
            'bg-amber-500/10 text-amber-400 border border-amber-500/20'}
        `}>
          {status}
        </div>

        {status.startsWith('SUCCESS') && (
          <button
            onClick={() => window.location.href = '/'}
            className="w-full mt-4 py-3 rounded-full bg-[#a3d977] text-black font-bold text-[14px]"
          >
            Go to Home
          </button>
        )}
      </div>
    </div>
  )
}
