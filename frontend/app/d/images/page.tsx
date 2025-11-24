"use client"

import { useEffect, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Eye, Download, Share2 } from "lucide-react"
import { fetchMediaAction, deleteMediaAction } from "@/app/actions"
import Link from "next/link"

// Define the media item type
interface MediaItem {
  id: string
  media_url: string
  description: string
  style: string
  concept?: string
}

export default function ImagesPage() {
  const [media, setMedia] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState<MediaItem | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  // Fetch media data from the backend

  // Fetch media function
  const fetchMediaData = async (search?: string) => {
    setLoading(true);
    try {
      // Fetch real media data from backend
      const result = await fetchMediaAction(search)
      
      console.log("Backend response:", result);
      
      if (result && result.media) {
        // Transform the API response into the expected MediaItem format
        console.log(`Processing ${result.media.length} media items`);
        
        const mediaItems: MediaItem[] = result.media.map((item: any) => {
          console.log("Processing media item:", item);
          return {
            id: item.id.toString(),
            media_url: item.media_url,
            description: item.article_text?.split('\n')[0] || 'Generated image', // Use first line of article text as description
            style: item.style || 'meme',
            concept: item.article_text || ''
          };
        });
        
        console.log("Transformed media items:", mediaItems);
        setMedia(mediaItems);
      } else {
        console.warn("No media items found in response:", result);
        setMedia([]);
      }
    } catch (error) {
      console.error("Failed to fetch media:", error);
      
      // Fallback to empty array
      setMedia([]);
    } finally {
      setLoading(false);
    }
  }

  // Fetch media on component mount
  useEffect(() => {
    fetchMediaData()
  }, [])

  // Handle search
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetchMediaData(searchTerm);
  }

  const openPreview = (item: MediaItem) => {
    setSelectedImage(item)
    setPreviewOpen(true)
  }

  const handleDownload = (imageUrl: string) => {
    // Create a temporary anchor element
    const link = document.createElement('a')
    link.href = imageUrl
    link.download = `astrosmurf-image-${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleShare = async (imageUrl: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Check out this image from Astrosmurf',
          text: 'Generated with Astrosmurf AI',
          url: imageUrl,
        })
      } catch (error) {
        console.error('Error sharing:', error)
      }
    } else {
      // Fallback - copy to clipboard
      navigator.clipboard.writeText(imageUrl)
      alert('Image URL copied to clipboard!')
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Images</h1>
        <p className="text-muted-foreground">All your generated media</p>
        
        {/* Search form */}
        <form onSubmit={handleSearch} className="mt-4 flex gap-2">
          <input
            type="text"
            placeholder="Search images..."
            className="flex-1 px-4 py-2 rounded-lg bg-gray-800 border border-gray-700"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Button type="submit">Search</Button>
          {searchTerm && (
            <Button 
              type="button" 
              variant="outline"
              onClick={() => {
                setSearchTerm("");
                fetchMediaData();
              }}
            >
              Clear
            </Button>
          )}
        </form>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-lg overflow-hidden">
              <Skeleton className="h-64 w-full" />
              <div className="p-3 bg-gray-800">
                <Skeleton className="h-6 w-2/3 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : media.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-2xl font-semibold mb-2">No images yet</p>
          <p className="text-muted-foreground mb-6">
            Generate your first image to see it here
          </p>
          <Link href="/d"><Button>Generate Now</Button></Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {media.map((item) => (
            <div key={item.id} className="bg-gray-800 rounded-lg overflow-hidden shadow-lg border border-gray-700 hover:border-primary transition-all">
              <div className="relative aspect-video overflow-hidden bg-black">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.media_url}
                  alt={item.description}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60 opacity-0 hover:opacity-100 transition-opacity flex items-end justify-end p-3">
                  <div className="flex gap-2">
                    <Button 
                      variant="secondary" 
                      size="icon" 
                      className="rounded-full w-8 h-8"
                      onClick={() => openPreview(item)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="secondary" 
                      size="icon" 
                      className="rounded-full w-8 h-8"
                      onClick={() => handleDownload(item.media_url)}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="secondary" 
                      size="icon" 
                      className="rounded-full w-8 h-8"
                      onClick={() => handleShare(item.media_url)}
                    >
                      <Share2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
              <div className="p-3">
                <p className="text-sm line-clamp-2 text-muted-foreground">
                  {item.description}
                </p>
                <div className="mt-2 flex justify-between items-center">
                  <span className="inline-block bg-primary/20 text-primary text-xs px-2 py-1 rounded-full capitalize">
                    {item.style}
                  </span>
                  <button 
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (confirm('Are you sure you want to delete this image?')) {
                        try {
                          setLoading(true);
                          // Call the real deletion API
                          await deleteMediaAction(item.id);
                          // Update the UI by removing from local state
                          setMedia(media.filter(m => m.id !== item.id));
                        } catch (error) {
                          console.error("Failed to delete image:", error);
                          alert("Failed to delete image. Please try again.");
                        } finally {
                          setLoading(false);
                        }
                      }
                    }}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Image Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-5xl p-1 sm:p-2 bg-black/95 border-gray-800">
          {selectedImage && (
            <div className="relative">
              <div className="flex justify-center items-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedImage.media_url}
                  alt={selectedImage.description}
                  className="max-h-[80vh] max-w-full object-contain"
                />
              </div>
              
              <div className="absolute bottom-4 right-4 flex gap-2">
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={() => handleDownload(selectedImage.media_url)}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={() => handleShare(selectedImage.media_url)}
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}