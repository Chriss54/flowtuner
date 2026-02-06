import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import {
    getPostBySlug,
    getAllSlugs,
    getRelatedPosts,
    calculateReadingTime,
} from "@/lib/blog";

// ISR with 1 hour revalidation
export const revalidate = 3600;

type Props = {
    params: Promise<{ locale: string; slug: string }>;
};

// Generate static paths for all existing posts in all locales
export async function generateStaticParams() {
    const slugs = await getAllSlugs();
    const locales = ["de", "en", "fr"];
    return locales.flatMap((locale) =>
        slugs.map((slug) => ({ locale, slug }))
    );
}

// Generate metadata for each post
export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { locale, slug } = await params;
    const post = await getPostBySlug(slug);

    if (!post) {
        return {
            title: locale === "de" ? "Artikel nicht gefunden" : locale === "fr" ? "Article non trouvé" : "Article not found",
        };
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://example.com";

    return {
        title: post.title,
        description: post.metaDescription,
        authors: post.author ? [{ name: post.author }] : undefined,
        openGraph: {
            title: post.title,
            description: post.metaDescription,
            type: "article",
            publishedTime: post.publishedAt,
            modifiedTime: post.updatedAt || post.publishedAt,
            authors: post.author ? [post.author] : undefined,
            images: post.featuredImage
                ? [{ url: post.featuredImage, width: 1200, height: 630 }]
                : undefined,
        },
        twitter: {
            card: "summary_large_image",
            title: post.title,
            description: post.metaDescription,
            images: post.featuredImage ? [post.featuredImage] : undefined,
        },
        alternates: {
            canonical: `${siteUrl}/${locale}/blog/${slug}`,
            languages: {
                "de-DE": `${siteUrl}/de/blog/${slug}`,
                "en-US": `${siteUrl}/en/blog/${slug}`,
                "fr-FR": `${siteUrl}/fr/blog/${slug}`,
            },
        },
    };
}

export default async function BlogPostPage({ params }: Props) {
    const { locale, slug } = await params;
    setRequestLocale(locale);

    const post = await getPostBySlug(slug);

    if (!post) {
        notFound();
    }

    const relatedPosts = await getRelatedPosts(slug, post.tags, 3);
    const readingTime = calculateReadingTime(post.content);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://example.com";
    const dateLocale = locale === "de" ? "de-DE" : locale === "fr" ? "fr-FR" : "en-US";

    const labels = {
        by: locale === "de" ? "Von" : locale === "fr" ? "Par" : "By",
        readTime: locale === "de" ? "Min. Lesezeit" : locale === "fr" ? "min de lecture" : "min read",
        ctaTitle: locale === "de"
            ? "Haben Sie Fragen zu diesem Thema?"
            : locale === "fr"
                ? "Avez-vous des questions sur ce sujet ?"
                : "Have questions about this topic?",
        ctaText: locale === "de"
            ? "Lassen Sie uns in einem kostenlosen 15-Minuten-Gespräch herausfinden, wie KI-Automatisierung Ihrem Unternehmen helfen kann."
            : locale === "fr"
                ? "Découvrons ensemble en 15 minutes gratuites comment l'automatisation IA peut aider votre entreprise."
                : "Let's find out in a free 15-minute call how AI automation can help your business.",
        ctaButton: locale === "de"
            ? "Kostenlose Erstberatung buchen"
            : locale === "fr"
                ? "Réserver une consultation gratuite"
                : "Book free consultation",
        relatedArticles: locale === "de" ? "Ähnliche Artikel" : locale === "fr" ? "Articles similaires" : "Related Articles",
        share: locale === "de" ? "Teilen:" : locale === "fr" ? "Partager :" : "Share:",
    };

    // Article Schema
    const articleSchema = {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: post.title,
        description: post.metaDescription,
        image: post.featuredImage || `${siteUrl}/images/og-image.jpg`,
        author: {
            "@type": "Person",
            name: post.author || "FLOWTUNER",
        },
        publisher: {
            "@type": "Organization",
            name: "FLOWTUNER",
            logo: {
                "@type": "ImageObject",
                url: `${siteUrl}/images/logo.svg`,
            },
        },
        datePublished: post.publishedAt,
        dateModified: post.updatedAt || post.publishedAt,
        mainEntityOfPage: {
            "@type": "WebPage",
            "@id": `${siteUrl}/${locale}/blog/${slug}`,
        },
    };

    // Breadcrumb Schema
    const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
            {
                "@type": "ListItem",
                position: 1,
                name: "Home",
                item: `${siteUrl}/${locale}`,
            },
            {
                "@type": "ListItem",
                position: 2,
                name: "Blog",
                item: `${siteUrl}/${locale}/blog`,
            },
            {
                "@type": "ListItem",
                position: 3,
                name: post.title,
                item: `${siteUrl}/${locale}/blog/${slug}`,
            },
        ],
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
            />

            <article className="article">
                <div className="container">
                    <header className="article__header">
                        {/* Breadcrumb */}
                        <nav className="article__breadcrumb" aria-label="Breadcrumb">
                            <Link href={`/${locale}`}>Home</Link>
                            <span aria-hidden="true">›</span>
                            <Link href={`/${locale}/blog`}>Blog</Link>
                            <span aria-hidden="true">›</span>
                            <span>{post.title}</span>
                        </nav>

                        <h1>{post.title}</h1>

                        <div className="article__meta">
                            {post.author && <span>{labels.by} {post.author}</span>}
                            <span>
                                {new Date(post.publishedAt).toLocaleDateString(dateLocale, {
                                    day: "numeric",
                                    month: "long",
                                    year: "numeric",
                                })}
                            </span>
                            <span>{readingTime} {labels.readTime}</span>
                        </div>
                    </header>

                    {/* Featured Image */}
                    {post.featuredImage && (
                        <div className="article__featured-image">
                            <img
                                src={post.featuredImage}
                                alt={post.title}
                                loading="eager"
                            />
                        </div>
                    )}

                    {/* Main Content */}
                    <div
                        className="article__content"
                        dangerouslySetInnerHTML={{ __html: post.content }}
                    />

                    {/* CTA Box */}
                    <div className="article__cta">
                        <h3>{labels.ctaTitle}</h3>
                        <p>{labels.ctaText}</p>
                        <Link href={`/${locale}/#contact`} className="btn btn--inverse">
                            {labels.ctaButton}
                        </Link>
                    </div>

                    {/* Related Posts */}
                    {relatedPosts.length > 0 && (
                        <section style={{ marginTop: "4rem" }}>
                            <h2 style={{ marginBottom: "1.5rem" }}>{labels.relatedArticles}</h2>
                            <div className="blog-cards">
                                {relatedPosts.map((relatedPost) => (
                                    <Link
                                        key={relatedPost.slug}
                                        href={`/${locale}/blog/${relatedPost.slug}`}
                                        className="blog-card card"
                                    >
                                        <div className="blog-card__image"></div>
                                        <div className="blog-card__meta">
                                            {new Date(relatedPost.publishedAt).toLocaleDateString(
                                                dateLocale,
                                                {
                                                    day: "numeric",
                                                    month: "long",
                                                    year: "numeric",
                                                }
                                            )}
                                        </div>
                                        <h3 className="blog-card__title">{relatedPost.title}</h3>
                                        <p className="blog-card__excerpt">
                                            {relatedPost.metaDescription}
                                        </p>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Share Links */}
                    <div
                        style={{
                            marginTop: "3rem",
                            paddingTop: "2rem",
                            borderTop: "1px solid var(--color-border)",
                            display: "flex",
                            gap: "1rem",
                            alignItems: "center",
                        }}
                    >
                        <span style={{ color: "var(--color-text-secondary)" }}>
                            {labels.share}
                        </span>
                        <a
                            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
                                `${siteUrl}/${locale}/blog/${slug}`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: "var(--color-text-secondary)" }}
                            aria-label="Share on LinkedIn"
                        >
                            LinkedIn
                        </a>
                        <a
                            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                                post.title
                            )}&url=${encodeURIComponent(`${siteUrl}/${locale}/blog/${slug}`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: "var(--color-text-secondary)" }}
                            aria-label="Share on X"
                        >
                            X
                        </a>
                        <a
                            href={`mailto:?subject=${encodeURIComponent(
                                post.title
                            )}&body=${encodeURIComponent(`${siteUrl}/${locale}/blog/${slug}`)}`}
                            style={{ color: "var(--color-text-secondary)" }}
                            aria-label="Share via Email"
                        >
                            E-Mail
                        </a>
                    </div>
                </div>
            </article>
        </>
    );
}
