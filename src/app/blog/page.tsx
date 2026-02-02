import { Metadata } from "next";
import Link from "next/link";
import { getAllPosts, calculateReadingTime } from "@/lib/blog";

export const metadata: Metadata = {
    title: "Blog – KI, Automatisierung & digitale Transformation",
    description:
        "Aktuelle Artikel und Einblicke zu KI-Automatisierung, Wissensmanagement und digitaler Transformation für Unternehmen.",
    alternates: {
        canonical: "/blog",
    },
};

export default async function BlogPage() {
    const posts = await getAllPosts();

    return (
        <div className="article">
            <div className="container">
                <div className="section__header">
                    <h1 className="section__title">
                        Blog – KI, Automatisierung & digitale Transformation
                    </h1>
                    <p className="section__subtitle">
                        Aktuelle Einblicke und Expertenwissen für Geschäftsführer und
                        Entscheider
                    </p>
                </div>

                {posts.length > 0 ? (
                    <div className="blog-cards">
                        {posts.map((post) => (
                            <Link
                                key={post.slug}
                                href={`/blog/${post.slug}`}
                                className="blog-card card"
                            >
                                <div className="blog-card__image">
                                    {post.featuredImage ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={post.featuredImage} alt={post.title} />
                                    ) : null}
                                </div>
                                <div className="blog-card__meta">
                                    {new Date(post.publishedAt).toLocaleDateString("de-DE", {
                                        day: "numeric",
                                        month: "long",
                                        year: "numeric",
                                    })}{" "}
                                    · {calculateReadingTime(post.content)} Min. Lesezeit
                                </div>
                                <h2 className="blog-card__title">{post.title}</h2>
                                <p className="blog-card__excerpt">{post.metaDescription}</p>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="text-center" style={{ padding: "4rem 0" }}>
                        <p style={{ color: "var(--color-text-secondary)" }}>
                            Bald erscheinen hier unsere ersten Artikel.
                        </p>
                        <Link
                            href="/"
                            className="btn btn--primary"
                            style={{ marginTop: "1.5rem" }}
                        >
                            Zurück zur Startseite
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
