'use client'

import { useState, useCallback, useMemo, useRef } from 'react'
import { AnimatePresence } from 'framer-motion'
import StoryFeed from '@/components/stories/StoryFeed'
import StoryCreator from '@/components/stories/StoryCreator'
import StoryViewer from '@/components/stories/StoryViewer'
import { MOCK_STORY_GROUPS, type StoryGroup, type StoryCard } from '@/lib/story-mock-data'

export function StoriesView() {
  const [storyGroups, setStoryGroups] = useState<StoryGroup[]>(MOCK_STORY_GROUPS)
  const [viewingGroupId, setViewingGroupId] = useState<string | null>(null)
  const [creatorOpen, setCreatorOpen] = useState(false)
  const selfGroupCounterRef = useRef(0)

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
