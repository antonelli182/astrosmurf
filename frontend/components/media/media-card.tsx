"use client"

import Image from "next/image"
import { useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Eye, Download, Share2, Loader2, Check } from "lucide-react"
import { DialogTitle } from "@radix-ui/react-dialog"

export interface MediaItemProps {
  id: number
  media_url: string
  media_type?: string
  prompt?: string
  style?: string
  date_created?: string
  onPostToX?: (mediaId: number) => Promise<void>
  isPosting?: boolean
  isPosted?: boolean
}

export function MediaCard({
  id,
  media_url,
  media_type = "image",
  prompt = "",
  style = "",
  onPostToX,
  isPosting = false,
  isPosted = false
}: MediaItemProps) {
  const [previewOpen, setPreviewOpen] = useState(false)

  const handleDownload = () => {
    // Create a temporary anchor element
    const link = document.createElement('a')
    link.href = media_url
    link.download = `media-${id}-${Date.now()}.${media_type === "image" ? "png" : "mp4"}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: prompt || 'Generated media',
          text: prompt || 'Check out this generated media',
          url: media_url,
        })
      } catch (error) {
        console.error('Error sharing:', error)
      }
    } else {
      // Fallback - copy to clipboard
      navigator.clipboard.writeText(media_url)
      alert('Media URL copied to clipboard!')
    }
  }

  return (
    <>
      <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 hover:shadow-lg transition-shadow group">
        {media_type === "image" ? (
          <Image
            src={media_url}
            alt={prompt || "Generated media"}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <video
            src={media_url}
            className="w-full h-full object-cover"
            controls
          />
        )}

        {/* Action buttons overlay */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            className="rounded-full w-8 h-8 p-0"
            onClick={() => setPreviewOpen(true)}
          >
            <Eye className="w-4 h-4" />
          </Button>

          <Button
            size="sm"
            variant="secondary"
            className="rounded-full w-8 h-8 p-0"
            onClick={handleDownload}
          >
            <Download className="w-4 h-4" />
          </Button>

          <Button
            size="sm"
            variant="secondary"
            className="rounded-full w-8 h-8 p-0"
            onClick={handleShare}
          >
            <Share2 className="w-4 h-4" />
          </Button>

          {onPostToX && (
            <Button
              size="sm"
              onClick={() => onPostToX(id)}
              disabled={isPosting || isPosted}
              className="bg-black/80 hover:bg-black text-white"
            >
              {isPosting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isPosted ? (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  Posted
                </>
              ) : (
                <>
                  <Share2 className="h-4 w-4 mr-1" />
                  Post to X
                </>
              )}
            </Button>
          )}
        </div>

        {prompt && (
          <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-2 text-white text-xs">
            <p className="line-clamp-2">{prompt}</p>
          </div>
        )}
      </div>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>

        <DialogContent className="max-w-5xl p-1 sm:p-2 bg-black/95 border-gray-800">
          <div className="relative">
            <div className="flex justify-center items-center">
              {media_type === "image" ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={media_url}
                  alt={prompt || "Generated media"}
                  className="max-h-[80vh] max-w-full object-contain"
                />
              ) : (
                <video
                  src={media_url}
                  className="max-h-[80vh] max-w-full"
                  controls
                  autoPlay
                />
              )}
            </div>

            <div className="absolute bottom-4 right-4 flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleDownload}
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleShare}
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
