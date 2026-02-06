import { Metadata } from "next";
import Link from "next/link";
import { getLocale, setRequestLocale } from "next-intl/server";
import { getAllPosts, calculateReadingTime } from "@/lib/blog";

type Props = {
    params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { locale } = await params;
    return {
        title: locale === "de"
            ? "Blog – KI, Automatisierung & digitale Transformation"
            : locale === "fr"
                ? "Blog – IA, Automatisation & Transformation Numérique"
                : "Blog – AI, Automation & Digital Transformation",
        description: locale === "de"
            ? "Aktuelle Artikel und Einblicke zu KI-Automatisierung, Wissensmanagement und digitaler Transformation für Unternehmen."
            : locale === "fr"
                ? "Articles et insights actuels sur l'automatisation IA, la gestion des connaissances et la transformation numérique pour les entreprises."
                : "Current articles and insights on AI automation, knowledge management, and digital transformation for businesses.",
        alternates: {
            canonical: `/${locale}/blog`,
        },
    };
}

export default async function BlogPage({ params }: Props) {
    const { locale } = await params;
    setRequestLocale(locale);
    const posts = await getAllPosts(locale);
    const dateLocale = locale === "de" ? "de-DE" : locale === "fr" ? "fr-FR" : "en-US";

    const labels = {
        title: locale === "de"
            ? "Blog – KI, Automatisierung & digitale Transformation"
            : locale === "fr"
                ? "Blog – IA, Automatisation & Transformation Numérique"
                : "Blog – AI, Automation & Digital Transformation",
        subtitle: locale === "de"
            ? "Aktuelle Einblicke und Expertenwissen für Geschäftsführer und Entscheider"
            : locale === "fr"
                ? "Insights actuels et expertise pour les dirigeants et décideurs"
                : "Current insights and expert knowledge for executives and decision-makers",
        noPostsYet: locale === "de"
            ? "Bald erscheinen hier unsere ersten Artikel."
            : locale === "fr"
                ? "Nos premiers articles apparaîtront bientôt ici."
                : "Our first articles will appear here soon.",
        backHome: locale === "de"
            ? "Zurück zur Startseite"
            : locale === "fr"
                ? "Retour à l'accueil"
                : "Back to homepage",
        readTime: locale === "de"
            ? "Min. Lesezeit"
            : locale === "fr"
                ? "min de lecture"
                : "min read",
    };

    return (
        <div className="article">
            <div className="container">
                <div className="section__header">
                    <h1 className="section__title">{labels.title}</h1>
                    <p className="section__subtitle">{labels.subtitle}</p>
                </div>

                {posts.length > 0 ? (
                    <div className="blog-cards">
                        {posts.map((post) => (
                            <Link
                                key={post.slug}
                                href={`/${locale}/blog/${post.slug}`}
                                className="blog-card card"
                            >
                                <div className="blog-card__image">
                                    {post.featuredImage ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={post.featuredImage} alt={post.title} />
                                    ) : null}
                                </div>
                                <div className="blog-card__meta">
                                    {new Date(post.publishedAt).toLocaleDateString(dateLocale, {
                                        day: "numeric",
                                        month: "long",
                                        year: "numeric",
                                    })}{" "}
                                    · {calculateReadingTime(post.content)} {labels.readTime}
                                </div>
                                <h2 className="blog-card__title">{post.title}</h2>
                                <p className="blog-card__excerpt">{post.metaDescription}</p>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="text-center" style={{ padding: "4rem 0" }}>
                        <p style={{ color: "var(--color-text-secondary)" }}>
                            {labels.noPostsYet}
                        </p>
                        <Link
                            href={`/${locale}`}
                            className="btn btn--primary"
                            style={{ marginTop: "1.5rem" }}
                        >
                            {labels.backHome}
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
