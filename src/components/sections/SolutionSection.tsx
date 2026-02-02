"use client";

import { useTranslations } from "next-intl";

export function SolutionSection() {
    const t = useTranslations("Solution");

    const features = [
        { icon: "⚡", key: "speed" },
        { icon: "📄", key: "documents" },
        { icon: "📈", key: "learning" },
        { icon: "🛡️", key: "security" },
    ];

    return (
        <section className="section" id="solution">
            <div className="container">
                <div className="section__header section__header--center reveal">
                    <span className="section__label">{t("label")}</span>
                    <h2 className="section__title">
                        {t("title")}
                        <span className="section__title-accent">{t("titleHighlight")}</span>
                    </h2>
                    <p className="section__desc">{t("description")}</p>
                </div>
                <div className="feature-grid">
                    {features.map((feature, index) => (
                        <div key={feature.key} className={`feature-card reveal reveal-delay-${index + 1}`}>
                            <div className="feature-card__icon">{feature.icon}</div>
                            <h3 className="feature-card__title">{t(`features.${feature.key}.title`)}</h3>
                            <p className="feature-card__text">{t(`features.${feature.key}.text`)}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
