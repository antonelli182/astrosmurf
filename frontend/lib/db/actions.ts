"use server"

import { db } from "./db"
import { auth } from "@/auth"

export async function fetchAllArticles() {
    const session = await auth()
    if (!session?.user?.id) {
        throw new Error("Unauthorized")
    }

    const articles = await db
        .selectFrom("articles")
        // .where("user_id", "=", Number(session.user.id))
        .selectAll()
        .orderBy("date_created", "desc")
        .execute()

    return articles
}

export async function fetchArticleWithMedia(articleId: number) {
    const session = await auth()
    if (!session?.user?.id) {
        throw new Error("Unauthorized")
    }

    const article = await db
        .selectFrom("articles")
        .where("id", "=", articleId)
        // .where("user_id", "=", Number(session.user.id))
        .selectAll()
        .executeTakeFirst()

    if (!article) {
        throw new Error("Article not found")
    }

    const media = await db
        .selectFrom("media")
        .where("article_id", "=", articleId)
        .selectAll()
        .orderBy("date_created", "desc")
        .execute()

    return { article, media }
}

export async function fetchAllMedia() {
    const session = await auth()
    if (!session?.user?.id) {
        throw new Error("Unauthorized")
    }

    const media = await db
        .selectFrom("media")
        .innerJoin("articles", "articles.id", "media.article_id")
        // .where("articles.user_id", "=", Number(session.user.id))
        .select([
            "media.id",
            "media.media_url",
            "media.media_type",
            "media.prompt",
            "media.style",
            "media.date_created",
            "media.article_id"
        ])
        .orderBy("media.date_created", "desc")
        .execute()

    return media
}

export async function createPersona(data: {
    name: string
    description: string
    imageUrl: string
}) {
    const session = await auth()
    if (!session?.user?.id) {
        throw new Error("Unauthorized")
    }

    const persona = await db
        .insertInto("personas")
        .values({
            name: data.name,
            description: data.description,
            image_url: data.imageUrl,
            user_id: Number(session.user.id),
        })
        .returningAll()
        .executeTakeFirst()

    return persona
}

export async function fetchAllPersonas() {
    const session = await auth()
    if (!session?.user?.id) {
        throw new Error("Unauthorized")
    }

    const personas = await db
        .selectFrom("personas")
        .where("user_id", "=", Number(session.user.id))
        .selectAll()
        .orderBy("date_created", "desc")
        .execute()

    return personas
}