import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/blog";
import { routing } from "@/i18n/routing";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://example.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const locales = routing.locales;

    // Static pages for each locale
    const staticPages: MetadataRoute.Sitemap = locales.flatMap((locale) => [
        {
            url: `${siteUrl}/${locale}`,
            lastModified: new Date(),
            changeFrequency: "weekly" as const,
            priority: 1.0,
            alternates: {
                languages: Object.fromEntries(
                    locales.map((l) => [l, `${siteUrl}/${l}`])
                ),
            },
        },
        {
            url: `${siteUrl}/${locale}/blog`,
            lastModified: new Date(),
            changeFrequency: "daily" as const,
            priority: 0.8,
            alternates: {
                languages: Object.fromEntries(
                    locales.map((l) => [l, `${siteUrl}/${l}/blog`])
                ),
            },
        },
        {
            url: `${siteUrl}/${locale}/impressum`,
            lastModified: new Date(),
            changeFrequency: "yearly" as const,
            priority: 0.3,
        },
        {
            url: `${siteUrl}/${locale}/datenschutz`,
            lastModified: new Date(),
            changeFrequency: "yearly" as const,
            priority: 0.3,
        },
    ]);

    // Dynamic blog posts for each locale
    const posts = await getAllPosts();
    const blogPages: MetadataRoute.Sitemap = locales.flatMap((locale) =>
        posts.map((post) => ({
            url: `${siteUrl}/${locale}/blog/${post.slug}`,
            lastModified: new Date(post.updatedAt || post.publishedAt),
            changeFrequency: "weekly" as const,
            priority: 0.7,
            alternates: {
                languages: Object.fromEntries(
                    locales.map((l) => [l, `${siteUrl}/${l}/blog/${post.slug}`])
                ),
            },
        }))
    );

    return [...staticPages, ...blogPages];
}
