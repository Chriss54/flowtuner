"use client";

import { useTranslations } from "next-intl";

export function ProblemSection() {
    const t = useTranslations("Problem");

    const painPoints = [
        { icon: "🔍", key: "search" },
        { icon: "🚪", key: "knowledge" },
        { icon: "🏚️", key: "silos" },
        { icon: "🤷", key: "ai" },
    ];

    return (
        <section className="section section--alt" id="problem">
            <div className="container">
                <div className="section__header reveal">
                    <span className="section__label">{t("label")}</span>
                    <h2 className="section__title">{t("title")}</h2>
                </div>
                <div className="pain-grid">
                    {painPoints.map((point, index) => (
                        <div key={point.key} className={`pain-card reveal reveal-delay-${index + 1}`}>
                            <div className="pain-card__icon">{point.icon}</div>
                            <h3 className="pain-card__title">{t(`cards.${point.key}.title`)}</h3>
                            <p className="pain-card__text">{t(`cards.${point.key}.text`)}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
