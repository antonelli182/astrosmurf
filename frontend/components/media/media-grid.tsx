"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { fetchAllMedia, fetchArticleWithMedia } from "@/lib/db/actions"
import { MediaCard } from "@/components/media/media-card"

type MediaItem = Awaited<ReturnType<typeof fetchAllMedia>>[number] | Awaited<ReturnType<typeof fetchArticleWithMedia>>["media"][number]

interface MediaGridProps {
    media: MediaItem[]
}

export function MediaGrid({ media }: MediaGridProps) {
    const { data: session } = useSession()
    const [postingId, setPostingId] = useState<number | null>(null)
    const [postedIds, setPostedIds] = useState<Set<number>>(new Set())

    const handlePostToX = async (mediaId: number) => {
        if (!session?.user?.id) {
            alert("Please sign in to post to X")
            return
        }

        setPostingId(mediaId)

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/x_post`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    user_id: Number(session.user.id),
                    media_id: mediaId,
                    text: "",
                }),
            })

            if (!response.ok) {
                throw new Error("Failed to post to X")
            }

            setPostedIds(prev => new Set(prev).add(mediaId))
        } catch (error) {
            alert(error instanceof Error ? error.message : "Failed to post to X")
        } finally {
            setPostingId(null)
        }
    }

    if (media.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                No media found
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {media.map((item) => (
                <MediaCard
                    key={item.id}
                    id={item.id}
                    media_url={item.media_url}
                    media_type={item.media_type}
                    prompt={item.prompt}
                    style={item.style}
                    date_created={item.date_created}
                    onPostToX={handlePostToX}
                    isPosting={postingId === item.id}
                    isPosted={postedIds.has(item.id)}
                />
            ))}
        </div>
    )
}
