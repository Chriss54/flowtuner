import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { getAllPosts } from "@/lib/blog";

export async function BlogTeaserSection() {
    const t = await getTranslations("Blog");
    const locale = await getLocale();
    const posts = await getAllPosts();
    const recentPosts = posts.slice(0, 3);

    // Locale-specific date formatting
    const dateLocale = locale === "de" ? "de-DE" : locale === "fr" ? "fr-FR" : "en-US";

    return (
        <section className="section section--alt" id="blog-teaser">
            <div className="container">
                <div className="blog-header">
                    <div className="reveal">
                        <span className="section__label">{t("label")}</span>
                        <h2 className="section__title">{t("title")}</h2>
                    </div>
                    {recentPosts.length > 0 && (
                        <Link href={`/${locale}/blog`} className="blog-link reveal">
                            {t("allPosts")}
                        </Link>
                    )}
                </div>

                {recentPosts.length > 0 ? (
                    <div className="blog-grid">
                        {recentPosts.map((post, index) => (
                            <Link
                                key={post.slug}
                                href={`/${locale}/blog/${post.slug}`}
                                className={`blog-card reveal reveal-delay-${index + 1}`}
                            >
                                <div className="blog-card__image">
                                    {/* Gradient placeholder */}
                                </div>
                                <div className="blog-card__body">
                                    {post.tags && post.tags[0] && (
                                        <div className="blog-card__tag">{post.tags[0]}</div>
                                    )}
                                    <h3 className="blog-card__title">{post.title}</h3>
                                    <p className="blog-card__excerpt">{post.metaDescription}</p>
                                    <div className="blog-card__meta">
                                        <span>
                                            {new Date(post.publishedAt).toLocaleDateString(dateLocale, {
                                                day: "numeric",
                                                month: "short",
                                                year: "numeric",
                                            })}
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <p className="text-center" style={{ color: "var(--text-muted)" }}>
                        {t("noPostsYet")}
                    </p>
                )}
            </div>
        </section>
    );
}
