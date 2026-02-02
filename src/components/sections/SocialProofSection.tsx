"use client";

import { useTranslations } from "next-intl";

// Tech stack logos as placeholders - replace with actual partner/client logos when available
const techLogos = ["OpenAI", "LangChain", "Python", "TypeScript", "PostgreSQL"];

export function SocialProofSection() {
    const t = useTranslations("SocialProof");

    return (
        <section className="section" id="social-proof">
            <div className="container">
                {/* Technology Partner Logos */}
                <div className="proof-logos reveal">
                    {techLogos.map((logo) => (
                        <span key={logo} className="proof-logo">
                            {logo}
                        </span>
                    ))}
                </div>

                {/* Testimonial Quote */}
                <div className="quote-block reveal reveal-delay-2">
                    <div className="quote-mark">&ldquo;</div>
                    <p className="quote-text">{t("quote")}</p>
                    <p className="quote-author">
                        <strong>{t("author")}</strong>{t("authorSuffix")}
                    </p>
                </div>
            </div>
        </section>
    );
}
