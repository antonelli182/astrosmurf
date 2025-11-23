import { fetchAllMedia } from "@/lib/db/actions"
import { MediaGrid } from "@/components/media/media-grid"

export default async function ImagesPage() {
    const media = await fetchAllMedia()

    return (
        <div className="container mx-auto p-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold">Images</h1>
                <p className="text-muted-foreground mt-2">
                    All your generated media
                </p>
            </div>
            <MediaGrid media={media} />
        </div>
    )
}
