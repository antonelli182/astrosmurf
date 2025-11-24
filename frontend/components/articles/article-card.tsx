"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { fetchAllArticles } from "@/lib/db/actions"

type ArticleType = Awaited<ReturnType<typeof fetchAllArticles>>[number]

interface ArticleCardProps {
    article: ArticleType
}

export function ArticleCard({ article }: ArticleCardProps) {
    const formattedDate = article.date_created
        ? new Date(article.date_created).toLocaleDateString()
        : "No date"

    return (
        <Link href={`/d/articles/${article.id}`}>
            <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                    <CardTitle className="line-clamp-2">
                        {article.text.substring(0, 100)}...
                    </CardTitle>
                    <CardDescription>
                        {formattedDate} • {article.source}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                        {article.text}
                    </p>
                </CardContent>
            </Card>
        </Link>
    )
}
