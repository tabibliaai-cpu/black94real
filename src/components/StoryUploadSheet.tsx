'use client'

import { useState, useRef, useCallback } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'

interface StoryUploadSheetProps {
  open: boolean
  onClose: () => void
  onStoryUploaded: (imageUrl: string) => void
}

export function StoryUploadSheet({ open, onClose, onStoryUploaded }: StoryUploadSheetProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [caption, setCaption] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return
    setSelectedFile(file)
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleFileSelect = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleShare = useCallback(() => {
    if (!previewUrl) return
    onStoryUploaded(previewUrl)
    // Reset state
    setSelectedFile(null)
    setPreviewUrl(null)
    setCaption('')
  }, [previewUrl, onStoryUploaded])

  const handleClose = useCallback(() => {
    setSelectedFile(null)
    setPreviewUrl(null)
    setCaption('')
    onClose()
  }, [onClose])

  return (
    <Sheet open={open} onOpenChange={(isOpen) => { if (!isOpen) handleClose() }}>
      <SheetContent
        side="bottom"
        className="bg-[#110f1a] border-t border-white/[0.06] rounded-t-2xl max-h-[85vh] overflow-y-auto"
      >
        <SheetHeader className="px-4 pt-2 pb-1">
          <SheetTitle className="text-[18px] font-bold text-[#f0eef6] text-left">
            Create Story
          </SheetTitle>
        </SheetHeader>

        <div className="px-4 pb-6 space-y-4">
          {/* Upload zone */}
          {!previewUrl ? (
            <div
              onClick={handleFileSelect}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`
                relative rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer
                aspect-[9/16] max-h-[400px] flex flex-col items-center justify-center gap-4
                ${isDragging
                  ? 'border-[#8b5cf6] bg-[#8b5cf6]/10'
                  : 'border-white/[0.15] bg-white/[0.03] hover:border-white/[0.25] hover:bg-white/[0.05]'
                }
              `}
            >
              <div className={`
                w-16 h-16 rounded-full flex items-center justify-center transition-colors
                ${isDragging ? 'bg-[#8b5cf6]/20' : 'bg-white/[0.06]'}
              `}>
                <svg className={`w-8 h-8 transition-colors ${isDragging ? 'text-[#8b5cf6]' : 'text-[#94a3b8]'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" strokeLinecap="round" strokeLinejoin="round" />
                  <polyline points="17 8 12 3 7 8" strokeLinecap="round" strokeLinejoin="round" />
                  <line x1="12" y1="3" x2="12" y2="15" strokeLinecap="round" />
                </svg>
              </div>
              <div className="text-center px-4">
                <p className="text-[15px] text-[#f0eef6] font-medium">Tap to select a photo</p>
                <p className="text-[13px] text-[#94a3b8] mt-1">or drag and drop an image</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleInputChange}
              />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Preview */}
              <div className="relative rounded-2xl overflow-hidden aspect-[9/16] max-h-[400px] mx-auto">
                <img
                  src={previewUrl}
                  alt="Story preview"
                  className="w-full h-full object-cover"
                />
                {/* Remove button */}
                <button
                  onClick={() => {
                    setSelectedFile(null)
                    setPreviewUrl(null)
                  }}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-[#09080f]/60 backdrop-blur-sm flex items-center justify-center hover:bg-[#09080f]/80 transition-colors"
                >
                  <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                  </svg>
                </button>
              </div>

              {/* Caption input */}
              <div>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Add a caption..."
                  maxLength={200}
                  rows={2}
                  className="w-full rounded-xl bg-white/[0.06] border border-white/[0.08] px-4 py-3 text-[15px] text-[#f0eef6] placeholder-[#64748b] resize-none focus:outline-none focus:border-[#8b5cf6]/50 focus:ring-1 focus:ring-[#8b5cf6]/30 transition-colors"
                />
                <p className="text-[12px] text-[#94a3b8] mt-1 text-right">
                  {caption.length}/200
                </p>
              </div>

              {/* Change photo */}
              <button
                onClick={() => {
                  setPreviewUrl(null)
                  setSelectedFile(null)
                }}
                className="text-[14px] text-[#8b5cf6] font-medium hover:underline"
              >
                Change photo
              </button>
            </div>
          )}

          {/* Share button */}
          <button
            onClick={handleShare}
            disabled={!previewUrl}
            className={`
              w-full py-3 rounded-full text-[15px] font-bold transition-all
              ${previewUrl
                ? 'bg-[#8b5cf6] text-black hover:bg-[#7c3aed] active:scale-[0.98]'
                : 'bg-white/[0.08] text-[#64748b] cursor-not-allowed'
              }
            `}
          >
            Share Story
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
