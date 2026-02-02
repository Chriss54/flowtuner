import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
    getPostBySlug,
    getAllSlugs,
    getRelatedPosts,
    calculateReadingTime,
} from "@/lib/blog";

// ISR with 1 hour revalidation
export const revalidate = 3600;

// Generate static paths for all existing posts
export async function generateStaticParams() {
    const slugs = await getAllSlugs();
    return slugs.map((slug) => ({ slug }));
}

// Generate metadata for each post
export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string }>;
}): Promise<Metadata> {
    const { slug } = await params;
    const post = await getPostBySlug(slug);

    if (!post) {
        return {
            title: "Artikel nicht gefunden",
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
            canonical: `${siteUrl}/blog/${slug}`,
        },
    };
}

export default async function BlogPostPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const post = await getPostBySlug(slug);

    if (!post) {
        notFound();
    }

    const relatedPosts = await getRelatedPosts(slug, post.tags, 3);
    const readingTime = calculateReadingTime(post.content);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://example.com";

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
            "@id": `${siteUrl}/blog/${slug}`,
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
                item: siteUrl,
            },
            {
                "@type": "ListItem",
                position: 2,
                name: "Blog",
                item: `${siteUrl}/blog`,
            },
            {
                "@type": "ListItem",
                position: 3,
                name: post.title,
                item: `${siteUrl}/blog/${slug}`,
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
                            <Link href="/">Home</Link>
                            <span aria-hidden="true">›</span>
                            <Link href="/blog">Blog</Link>
                            <span aria-hidden="true">›</span>
                            <span>{post.title}</span>
                        </nav>

                        <h1>{post.title}</h1>

                        <div className="article__meta">
                            {post.author && <span>Von {post.author}</span>}
                            <span>
                                {new Date(post.publishedAt).toLocaleDateString("de-DE", {
                                    day: "numeric",
                                    month: "long",
                                    year: "numeric",
                                })}
                            </span>
                            <span>{readingTime} Min. Lesezeit</span>
                        </div>
                    </header>

                    {/* Main Content */}
                    <div
                        className="article__content"
                        dangerouslySetInnerHTML={{ __html: post.content }}
                    />

                    {/* CTA Box */}
                    <div className="article__cta">
                        <h3>Haben Sie Fragen zu diesem Thema?</h3>
                        <p>
                            Lassen Sie uns in einem kostenlosen 15-Minuten-Gespräch
                            herausfinden, wie KI-Automatisierung Ihrem Unternehmen helfen
                            kann.
                        </p>
                        <Link href="/#contact" className="btn btn--inverse">
                            Kostenlose Erstberatung buchen
                        </Link>
                    </div>

                    {/* Related Posts */}
                    {relatedPosts.length > 0 && (
                        <section style={{ marginTop: "4rem" }}>
                            <h2 style={{ marginBottom: "1.5rem" }}>Ähnliche Artikel</h2>
                            <div className="blog-cards">
                                {relatedPosts.map((relatedPost) => (
                                    <Link
                                        key={relatedPost.slug}
                                        href={`/blog/${relatedPost.slug}`}
                                        className="blog-card card"
                                    >
                                        <div className="blog-card__image"></div>
                                        <div className="blog-card__meta">
                                            {new Date(relatedPost.publishedAt).toLocaleDateString(
                                                "de-DE",
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
                            Teilen:
                        </span>
                        <a
                            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
                                `${siteUrl}/blog/${slug}`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: "var(--color-text-secondary)" }}
                            aria-label="Auf LinkedIn teilen"
                        >
                            LinkedIn
                        </a>
                        <a
                            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                                post.title
                            )}&url=${encodeURIComponent(`${siteUrl}/blog/${slug}`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: "var(--color-text-secondary)" }}
                            aria-label="Auf X teilen"
                        >
                            X
                        </a>
                        <a
                            href={`mailto:?subject=${encodeURIComponent(
                                post.title
                            )}&body=${encodeURIComponent(`${siteUrl}/blog/${slug}`)}`}
                            style={{ color: "var(--color-text-secondary)" }}
                            aria-label="Per E-Mail teilen"
                        >
                            E-Mail
                        </a>
                    </div>
                </div>
            </article>
        </>
    );
}
