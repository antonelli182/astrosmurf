"use client"

import Image from "next/image"
import { Media } from "@/lib/db/schema"

interface MediaGridProps {
    media: (Media & { article_id?: number })[]
}

export function MediaGrid({ media }: MediaGridProps) {
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
                <div
                    key={item.id}
                    className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 hover:shadow-lg transition-shadow"
                >
                    {item.media_type === "image" ? (
                        <Image
                            src={item.media_url}
                            alt={item.prompt || "Generated media"}
                            fill
                            className="object-cover"
                            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        />
                    ) : (
                        <video
                            src={item.media_url}
                            className="w-full h-full object-cover"
                            controls
                        />
                    )}
                    {item.prompt && (
                        <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-2 text-white text-xs">
                            <p className="line-clamp-2">{item.prompt}</p>
                        </div>
                    )}
                </div>
            ))}
        </div>
    )
}
