import { fetchArticleWithMedia } from "@/lib/db/actions"
import { MediaGrid } from "@/components/media/media-grid"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { notFound } from "next/navigation"

interface ArticlePageProps {
    params: Promise<{ id: string }>
}

export default async function ArticlePage({ params }: ArticlePageProps) {
    const { id } = await params
    const articleId = parseInt(id)

    if (isNaN(articleId)) {
        notFound()
    }

    try {
        const { article, media } = await fetchArticleWithMedia(articleId)

        const formattedDate = article.date_created
            ? new Date(article.date_created).toLocaleDateString()
            : "No date"

        return (
            <div className="container mx-auto p-6 max-w-6xl">
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle className="text-2xl">Article Details</CardTitle>
                        <CardDescription>
                            {formattedDate} • {article.source}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-base leading-relaxed whitespace-pre-wrap">
                            {article.text}
                        </p>
                    </CardContent>
                </Card>

                <div className="mb-4">
                    <h2 className="text-2xl font-bold">Associated Media</h2>
                    <p className="text-muted-foreground mt-1">
                        {media.length} {media.length === 1 ? "item" : "items"}
                    </p>
                </div>

                <MediaGrid media={media} />
            </div>
        )
    } catch (error) {
        notFound()
    }
}
