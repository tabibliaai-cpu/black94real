'use client'

import { useState, useCallback, useMemo } from 'react'
import { AnimatePresence } from 'framer-motion'
import StoryFeed from '@/components/stories/StoryFeed'
import StoryCreator from '@/components/stories/StoryCreator'
import StoryViewer from '@/components/stories/StoryViewer'
import { MOCK_STORY_GROUPS, type StoryGroup, type StoryCard } from '@/lib/story-mock-data'

export function StoriesView() {
  const [storyGroups, setStoryGroups] = useState<StoryGroup[]>(MOCK_STORY_GROUPS)
  const [viewingGroupId, setViewingGroupId] = useState<string | null>(null)
  const [creatorOpen, setCreatorOpen] = useState(false)

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
    const newGroup: StoryGroup = {
      creatorId: 'self',
      creatorName: 'You',
      creatorHandle: 'you',
      creatorAvatar: '',
      creatorVerified: false,
      creatorCountry: '🇮🇳',
      creatorLanguages: ['en'],
      viewed: true,
      stories: [story],
      createdAt: new Date().toISOString(),
      viewCount: 0,
      tippingEnabled: false,
      reactions: {},
    }
    setStoryGroups((prev) => [newGroup, ...prev])
    // Open the viewer on the new story
    setTimeout(() => setViewingGroupId('self'), 300)
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

      {/* Story Creator — multi-step flow */}
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
