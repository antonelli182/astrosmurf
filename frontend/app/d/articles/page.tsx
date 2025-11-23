import { fetchAllArticles } from "@/lib/db/actions"
import { ArticleCard } from "@/components/articles/article-card"

export default async function ArticlesPage() {
    const articles = await fetchAllArticles()

    return (
        <div className="container mx-auto p-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold">Articles</h1>
                <p className="text-muted-foreground mt-2">
                    All your generated articles
                </p>
            </div>
            {articles.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                    No articles found. Generate your first article!
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {articles.map((article) => (
                        <ArticleCard key={article.id} article={article} />
                    ))}
                </div>
            )}
        </div>
    )
}
