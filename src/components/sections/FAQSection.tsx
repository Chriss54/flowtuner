"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

const faqKeys = [
    "what",
    "duration",
    "gdpr",
    "cost",
    "technical",
    "sources",
    "difference",
    "security",
];

export function FAQSection() {
    const t = useTranslations("FAQ");
    const locale = useLocale();

    // Build FAQ items for schema
    const faqItems = faqKeys.map((key) => ({
        question: t(`items.${key}.question`),
        answer: t(`items.${key}.answer`),
        hasLink: key === "cost",
    }));

    // JSON-LD Schema for FAQ
    const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqItems.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: {
                "@type": "Answer",
                text: item.answer,
            },
        })),
    };

    return (
        <section className="section section--alt" id="faq">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
            />
            <div className="container">
                <div className="faq-layout">
                    <div className="faq-left reveal">
                        <span className="section__label">{t("label")}</span>
                        <h2 className="section__title">{t("title")}</h2>
                        <p className="section__desc">{t("description")}</p>
                    </div>
                    <div className="faq-list">
                        {faqItems.map((item, index) => (
                            <details key={index} className="faq-item reveal reveal-delay-1">
                                <summary>
                                    {item.question}
                                    <span className="faq-icon">+</span>
                                </summary>
                                <div className="faq-answer">
                                    <p>
                                        {item.answer}
                                        {item.hasLink && (
                                            <>
                                                {" "}
                                                <Link href={`/${locale}/#contact`}>{t("bookNow")}</Link>
                                            </>
                                        )}
                                    </p>
                                </div>
                            </details>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
