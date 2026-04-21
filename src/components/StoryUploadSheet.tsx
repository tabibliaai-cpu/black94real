'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useAppStore } from '@/stores/app'
import { createStory } from '@/lib/stories-db'
import { IMAGE_FILTERS, type ImageFilter } from '@/lib/image-filters'
import { toast } from 'sonner'

interface StoryUploadSheetProps {
  open: boolean
  onClose: () => void
  onStoryUploaded: () => void
}

/* ── Image compression (fast, small for stories) ─────────────────────── */
function compressStoryImage(
  file: File,
  filterCss: string,
  maxWidth = 720,
  maxHeight = 1280,
  quality = 0.55,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('Failed to load image'))
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let { width, height } = img

        // Fit within maxWidth × maxHeight while preserving aspect ratio
        if (width > maxWidth) { height = Math.round((height * maxWidth) / width); width = maxWidth }
        if (height > maxHeight) { width = Math.round((width * maxHeight) / height); height = maxHeight }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) { reject(new Error('Canvas not supported')); return }

        ctx.fillStyle = '#000000'
        ctx.fillRect(0, 0, width, height)

        if (filterCss && filterCss !== 'none') {
          ctx.filter = filterCss
        }

        ctx.drawImage(img, 0, 0, width, height)
        ctx.filter = 'none'

        let dataUrl = canvas.toDataURL('image/jpeg', quality)

        // Auto-recompress if still too large for Firestore
        if (dataUrl.length > 500_000) {
          // Try progressively lower quality
          for (const q of [0.4, 0.3, 0.2]) {
            const smaller = canvas.toDataURL('image/jpeg', q)
            if (smaller.length < dataUrl.length) dataUrl = smaller
            if (dataUrl.length < 400_000) break
          }
        }
        resolve(dataUrl)
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}

export function StoryUploadSheet({ open, onClose, onStoryUploaded }: StoryUploadSheetProps) {
  const user = useAppStore((s) => s.user)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [selectedFilter, setSelectedFilter] = useState<ImageFilter>(IMAGE_FILTERS[0])
  const [caption, setCaption] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [step, setStep] = useState<'idle' | 'compressing' | 'uploading' | 'done'>('idle')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const filtersScrollRef = useRef<HTMLDivElement>(null)

  // Reset on open
  useEffect(() => {
    if (open) {
      setSelectedFile(null)
      setPreviewUrl(null)
      setSelectedFilter(IMAGE_FILTERS[0])
      setCaption('')
      setUploading(false)
      setStep('idle')
    }
  }, [open])

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

  const handleShare = useCallback(async () => {
    if (!previewUrl || !selectedFile || !user || uploading) return
    setUploading(true)

    // Step 1: Compress image
    let compressed = ''
    try {
      setStep('compressing')
      console.log('[StoryUpload] Compressing image…')
      compressed = await compressStoryImage(selectedFile, selectedFilter.css)
      console.log('[StoryUpload] Compression done. Size:', Math.round(compressed.length / 1024), 'KB')
    } catch (compressErr) {
      console.error('[StoryUpload] Compression FAILED:', compressErr)
      setUploading(false)
      setStep('idle')
      toast.error('Failed to process image. Try a different photo.')
      return
    }

    // Step 2: Upload to Firestore
    try {
      setStep('uploading')
      console.log('[StoryUpload] Uploading to Firestore…')
      await createStory({
        userId: user.id,
        username: user.username,
        displayName: user.displayName || 'You',
        profileImage: user.profileImage || '',
        verified: user.isVerified,
        mediaUrl: compressed,
        caption: caption.trim(),
      })
      console.log('[StoryUpload] Firestore write ✅')
    } catch (uploadErr) {
      console.error('[StoryUpload] Firestore write FAILED:', uploadErr)
      setUploading(false)
      setStep('idle')
      const msg = uploadErr instanceof Error ? uploadErr.message : String(uploadErr)
      toast.error(`Upload failed: ${msg}`)
      return
    }

    // All done
    setStep('done')
    toast.success('Story shared!')
    // Close sheet first, then reload after a short delay for Firestore consistency
    onClose()
    setUploading(false)
    setTimeout(() => {
      onStoryUploaded()
    }, 800)
  }, [previewUrl, selectedFile, selectedFilter, caption, user, uploading, onStoryUploaded, onClose])

  const handleClose = useCallback(() => {
    onClose()
  }, [onClose])

  // Derive status text from step
  const statusText = step === 'compressing' ? 'Compressing…' : step === 'uploading' ? 'Sharing to cloud…' : uploading ? 'Sharing…' : 'Share Story'

  return (
    <Sheet open={open} onOpenChange={(isOpen) => { if (!isOpen) handleClose() }}>
      <SheetContent
        side="bottom"
        className="bg-[#000000] border-t border-white/[0.06] rounded-t-2xl max-h-[92vh] overflow-y-auto"
      >
        <SheetHeader className="px-4 pt-2 pb-1">
          <SheetTitle className="text-[18px] font-bold text-[#e7e9ea] text-left">
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
                aspect-[9/16] max-h-[420px] flex flex-col items-center justify-center gap-4
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
                <p className="text-[15px] text-[#e7e9ea] font-medium">Tap to select a photo</p>
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
              {/* Preview with filter */}
              <div className="relative rounded-2xl overflow-hidden aspect-[9/16] max-h-[420px] mx-auto">
                <img
                  src={previewUrl}
                  alt="Story preview"
                  className="w-full h-full object-cover"
                  style={selectedFilter.css !== 'none' ? { filter: selectedFilter.css } : undefined}
                />
                {/* Remove button */}
                <button
                  onClick={() => {
                    setSelectedFile(null)
                    setPreviewUrl(null)
                  }}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-[#000000]/60 backdrop-blur-sm flex items-center justify-center hover:bg-[#000000]/80 transition-colors"
                >
                  <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                  </svg>
                </button>
                {/* Current filter badge */}
                {selectedFilter.id !== 'normal' && (
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-[#000000]/60 backdrop-blur-sm">
                    <span className="text-[12px] text-white font-medium">{selectedFilter.name}</span>
                  </div>
                )}
              </div>

              {/* ── Filter selector ── */}
              <div className="space-y-2">
                <h4 className="text-[14px] font-semibold text-[#e7e9ea]">Filters</h4>
                <div
                  ref={filtersScrollRef}
                  className="flex gap-3 overflow-x-auto no-scrollbar pb-1"
                >
                  {IMAGE_FILTERS.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setSelectedFilter(f)}
                      className="flex flex-col items-center gap-1 shrink-0"
                    >
                      <div
                        className={`
                          w-[62px] h-[82px] rounded-xl overflow-hidden border-2 transition-all
                          ${selectedFilter.id === f.id
                            ? 'border-[#8b5cf6] scale-105 shadow-lg shadow-[#8b5cf6]/20'
                            : 'border-transparent opacity-80 hover:opacity-100'
                          }
                        `}
                      >
                        <img
                          src={previewUrl}
                          alt={f.name}
                          className="w-full h-full object-cover"
                          style={f.css !== 'none' ? { filter: f.css } : undefined}
                          draggable={false}
                        />
                      </div>
                      <span className={`text-[10px] truncate max-w-[62px] ${selectedFilter.id === f.id ? 'text-[#8b5cf6] font-bold' : 'text-[#94a3b8]'}`}>
                        {f.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Caption input */}
              <div>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Add a caption..."
                  maxLength={200}
                  rows={2}
                  className="w-full rounded-xl bg-white/[0.06] border border-white/[0.08] px-4 py-3 text-[15px] text-[#e7e9ea] placeholder-[#64748b] resize-none focus:outline-none focus:border-[#8b5cf6]/50 focus:ring-1 focus:ring-[#8b5cf6]/30 transition-colors"
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
                  setSelectedFilter(IMAGE_FILTERS[0])
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
            disabled={!previewUrl || uploading}
            className={`
              w-full py-3 rounded-full text-[15px] font-bold transition-all flex items-center justify-center gap-2
              ${previewUrl && !uploading
                ? 'bg-[#8b5cf6] text-black hover:bg-[#7c3aed] active:scale-[0.98]'
                : 'bg-white/[0.08] text-[#64748b] cursor-not-allowed'
              }
            `}
          >
            {uploading && (
              <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            )}
            {statusText}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
