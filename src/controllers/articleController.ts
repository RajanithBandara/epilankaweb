/**
 * Article reactions controller.
 *
 * Article CRUD lives on the FastAPI side now (see /articles/* in epilanka-api).
 * This file is responsible only for per-user reactions (likes + bookmarks),
 * which the frontend owns: it writes to the `article_reactions` collection and
 * keeps `likeCount` / `bookmarkCount` denormalised on the article document.
 *
 * Both services share the same MongoDB database, so it is safe for the
 * frontend to update the `articles` collection's counters while FastAPI
 * remains the source of truth for the article content itself.
 */

import { Collection, ObjectId } from "mongodb";
import { getMongoDb } from "@/lib/mongodb";

const ARTICLES = "articles";
const REACTIONS = "article_reactions";

export type ArticleStatus = "draft" | "published";

export type SerializedArticle = {
    id: string;
    slug: string;
    title: string;
    summary: string;
    body: string;
    tags: string[];
    category: string;
    author: { id: string; name: string; email: string };
    status: ArticleStatus;
    createdAt: string | null;
    updatedAt: string | null;
    publishedAt: string | null;
    likeCount: number;
    bookmarkCount: number;
};

export type ArticleWithReaction = SerializedArticle & {
    liked: boolean;
    bookmarked: boolean;
};

type ReactionDocument = {
    _id: ObjectId;
    articleId: string;
    userId: string;
    liked: boolean;
    bookmarked: boolean;
    updatedAt: Date;
};

type ArticleCountersDocument = {
    _id: ObjectId;
    likeCount?: number;
    bookmarkCount?: number;
};

async function reactionsCollection(): Promise<Collection<ReactionDocument>> {
    const db = await getMongoDb();
    const col = db.collection<ReactionDocument>(REACTIONS);
    await col.createIndex({ articleId: 1, userId: 1 }, { unique: true });
    await col.createIndex({ userId: 1, bookmarked: 1 });
    return col;
}

async function articleCountersCollection(): Promise<Collection<ArticleCountersDocument>> {
    const db = await getMongoDb();
    return db.collection<ArticleCountersDocument>(ARTICLES);
}

async function getReaction(
    articleId: string,
    userId: string
): Promise<ReactionDocument | null> {
    const col = await reactionsCollection();
    return col.findOne({ articleId, userId });
}

async function recountArticle(
    articleId: string
): Promise<{ likeCount: number; bookmarkCount: number }> {
    const reactions = await reactionsCollection();
    const [likeCount, bookmarkCount] = await Promise.all([
        reactions.countDocuments({ articleId, liked: true }),
        reactions.countDocuments({ articleId, bookmarked: true }),
    ]);

    if (ObjectId.isValid(articleId)) {
        const articles = await articleCountersCollection();
        await articles.updateOne(
            { _id: new ObjectId(articleId) },
            { $set: { likeCount, bookmarkCount } }
        );
    }

    return { likeCount, bookmarkCount };
}

async function toggleFlag(
    articleId: string,
    userId: string,
    field: "liked" | "bookmarked"
): Promise<{ liked: boolean; bookmarked: boolean; likeCount: number; bookmarkCount: number } | null> {
    if (!ObjectId.isValid(articleId)) return null;

    // Confirm the article actually exists before recording a reaction for it.
    const articles = await articleCountersCollection();
    const exists = await articles.findOne({ _id: new ObjectId(articleId) });
    if (!exists) return null;

    const reactions = await reactionsCollection();
    const current = await getReaction(articleId, userId);
    const nextValue = !(current?.[field] ?? false);
    const now = new Date();

    if (current) {
        await reactions.updateOne(
            { _id: current._id },
            { $set: { [field]: nextValue, updatedAt: now } }
        );
    } else {
        await reactions.insertOne({
            _id: new ObjectId(),
            articleId,
            userId,
            liked: field === "liked" ? nextValue : false,
            bookmarked: field === "bookmarked" ? nextValue : false,
            updatedAt: now,
        });
    }

    const counts = await recountArticle(articleId);
    const after = await getReaction(articleId, userId);
    return {
        liked: after?.liked ?? false,
        bookmarked: after?.bookmarked ?? false,
        ...counts,
    };
}

export async function toggleLike(articleId: string, userId: string) {
    return toggleFlag(articleId, userId, "liked");
}

export async function toggleBookmark(articleId: string, userId: string) {
    return toggleFlag(articleId, userId, "bookmarked");
}

export async function attachReactions(
    articles: SerializedArticle[],
    userId: string | null
): Promise<ArticleWithReaction[]> {
    if (!userId || articles.length === 0) {
        return articles.map((a) => ({ ...a, liked: false, bookmarked: false }));
    }
    const reactions = await reactionsCollection();
    const ids = articles.map((a) => a.id);
    const rows = await reactions
        .find({ userId, articleId: { $in: ids } })
        .toArray();
    const map = new Map<string, { liked: boolean; bookmarked: boolean }>();
    for (const r of rows) {
        map.set(r.articleId, { liked: r.liked, bookmarked: r.bookmarked });
    }
    return articles.map((a) => ({
        ...a,
        liked: map.get(a.id)?.liked ?? false,
        bookmarked: map.get(a.id)?.bookmarked ?? false,
    }));
}

/**
 * Return the article IDs the user has bookmarked (used by the "Saved" tab
 * after the article docs are fetched from the FastAPI public endpoint).
 */
export async function listBookmarkedArticleIds(userId: string): Promise<string[]> {
    const reactions = await reactionsCollection();
    const rows = await reactions
        .find({ userId, bookmarked: true })
        .project<{ articleId: string }>({ articleId: 1 })
        .toArray();
    return rows.map((r) => r.articleId);
}
