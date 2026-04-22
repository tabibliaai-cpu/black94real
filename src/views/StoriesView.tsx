'use client'

import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import StoryFeed from '@/components/stories/StoryFeed'
import StoryCreator from '@/components/stories/StoryCreator'
import StoryViewer from '@/components/stories/StoryViewer'
import { MOCK_STORY_GROUPS, type StoryGroup, type StoryCard } from '@/lib/story-mock-data'
import { fetchStories, type Story as FirestoreStory } from '@/lib/db'

export function StoriesView() {
  const [storyGroups, setStoryGroups] = useState<StoryGroup[]>(MOCK_STORY_GROUPS)
  const [viewingGroupId, setViewingGroupId] = useState<string | null>(null)
  const [creatorOpen, setCreatorOpen] = useState(false)
  const selfGroupCounterRef = useRef(0)
  const [loading, setLoading] = useState(true)

  // Fetch real stories from Firestore on mount
  useEffect(() => {
    async function loadStories() {
      try {
        const stories = await fetchStories(50)
        if (stories.length === 0) {
          setLoading(false)
          return
        }

        // Convert Firestore stories into StoryGroups (grouped by authorId)
        const authorMap = new Map<string, {
          stories: StoryCard[]
          authorId: string
          authorUsername: string
          authorDisplayName: string
          authorProfileImage: string
          authorIsVerified: boolean
          latestCreatedAt: string
        }>()

        for (const s of stories) {
          const existing = authorMap.get(s.authorId)
          const storyCard: StoryCard = {
            id: s.id,
            format: s.format as StoryCard['format'],
            content: s.content,
            mediaUrl: s.mediaUrl || undefined,
            language: s.language as StoryCard['language'],
            pollOptions: s.pollOptions as StoryCard['pollOptions'],
            festivalTemplate: s.festivalTemplate as StoryCard['festivalTemplate'],
            cricketData: s.cricketData as StoryCard['cricketData'],
            voiceWaveform: s.voiceWaveform,
            voiceDuration: s.voiceDuration,
          }

          if (existing) {
            existing.stories.push(storyCard)
            if (s.createdAt > existing.latestCreatedAt) {
              existing.latestCreatedAt = s.createdAt
            }
          } else {
            authorMap.set(s.authorId, {
              stories: [storyCard],
              authorId: s.authorId,
              authorUsername: s.authorUsername,
              authorDisplayName: s.authorDisplayName,
              authorProfileImage: s.authorProfileImage,
              authorIsVerified: s.authorIsVerified,
              latestCreatedAt: s.createdAt,
            })
          }
        }

        // Convert to StoryGroup format
        const firestoreGroups: StoryGroup[] = Array.from(authorMap.values()).map((a) => ({
          creatorId: a.authorId,
          creatorName: a.authorDisplayName || a.authorUsername,
          creatorHandle: a.authorUsername,
          creatorAvatar: a.authorProfileImage || `https://api.dicebear.com/9.x/avataaars/svg?seed=${a.authorUsername}&backgroundColor=00f0ff`,
          creatorVerified: a.authorIsVerified,
          creatorCountry: '🇮🇳',
          creatorLanguages: ['en'],
          viewed: true,
          stories: a.stories,
          createdAt: a.latestCreatedAt,
          viewCount: 1,
          tippingEnabled: false,
          reactions: {
            agree: 0,
            disagree: 0,
            fire: 0,
            skull: 0,
            mindblown: 0,
            clapping: 0,
          },
        }))

        // Merge: Firestore stories first, then mock data (deduped)
        const mockIds = new Set(MOCK_STORY_GROUPS.map(g => g.creatorId))
        const firestoreOnly = firestoreGroups.filter(g => !mockIds.has(g.creatorId))
        setStoryGroups([...firestoreOnly, ...MOCK_STORY_GROUPS])
      } catch (err) {
        console.warn('Failed to load stories from Firestore, using mock data:', err)
      } finally {
        setLoading(false)
      }
    }

    loadStories()
  }, [])

  // Find the index of a group by creatorId in the original array
  const viewingGroupIndex = useMemo(() => {
    if (!viewingGroupId) return null
    return storyGroups.findIndex((g) => g.creatorId === viewingGroupId)
  }, [viewingGroupId, storyGroups])

  const handleOpenStory = useCallback((groupId: string) => {
    setViewingGroupId(groupId)
  }, [])

  const handleCloseStory = useCallback(() => {
    setViewingGroupId(null)
  }, [])

  const handleOpenCreator = useCallback(() => {
    setCreatorOpen(true)
  }, [])

  const handleCloseCreator = useCallback(() => {
    setCreatorOpen(false)
  }, [])

  const handleStoryPublished = useCallback((story: StoryCard) => {
    selfGroupCounterRef.current += 1
    const selfId = `self_${selfGroupCounterRef.current}_${Date.now()}`

    const newGroup: StoryGroup = {
      creatorId: selfId,
      creatorName: 'You',
      creatorHandle: 'you',
      creatorAvatar: `https://api.dicebear.com/9.x/avataaars/svg?seed=self${selfGroupCounterRef.current}&backgroundColor=00f0ff`,
      creatorVerified: false,
      creatorCountry: '🇮🇳',
      creatorLanguages: ['en'],
      viewed: true,
      stories: [story],
      createdAt: new Date().toISOString(),
      viewCount: 1,
      tippingEnabled: false,
      reactions: {
        agree: 0,
        disagree: 0,
        fire: 0,
        skull: 0,
        mindblown: 0,
        clapping: 0,
      },
    }

    // Add story to feed AND open viewer in one state update cycle
    setStoryGroups((prev) => {
      const updated = [newGroup, ...prev]
      return updated
    })

    // Open viewer immediately after state update (using unique ID)
    // Use a microtask to ensure the state is committed first
    Promise.resolve().then(() => {
      setViewingGroupId(selfId)
    })
  }, [])

  const handleNavigateCreator = useCallback((_creatorId: string) => {
    setViewingGroupId(null)
  }, [])

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Story Feed — discovery screen */}
      <StoryFeed
        storyGroups={storyGroups}
        onOpenStory={handleOpenStory}
        onOpenCreator={handleOpenCreator}
      />

      {/* Story Creator */}
      <AnimatePresence>
        {creatorOpen && (
          <StoryCreator
            open={creatorOpen}
            onClose={handleCloseCreator}
            onStoryPublished={handleStoryPublished}
          />
        )}
      </AnimatePresence>

      {/* Story Viewer — full-screen playback */}
      <AnimatePresence>
        {viewingGroupIndex !== null && viewingGroupIndex >= 0 && (
          <StoryViewer
            groups={storyGroups}
            initialGroupIndex={viewingGroupIndex}
            onClose={handleCloseStory}
            onNavigateCreator={handleNavigateCreator}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
