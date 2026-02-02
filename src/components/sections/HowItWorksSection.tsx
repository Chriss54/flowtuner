"use client";

import { useTranslations } from "next-intl";

export function HowItWorksSection() {
    const t = useTranslations("HowItWorks");

    const steps = [
        { number: "1", key: "consultation" },
        { number: "2", key: "build" },
        { number: "3", key: "result" },
    ];

    return (
        <section className="section section--alt" id="how-it-works">
            <div className="container">
                <div className="section__header section__header--center reveal">
                    <span className="section__label">{t("label")}</span>
                    <h2 className="section__title">{t("title")}</h2>
                    <p className="section__desc">{t("description")}</p>
                </div>
                <div className="steps-container">
                    {steps.map((step, index) => (
                        <div key={step.number} className={`step reveal reveal-delay-${index + 1}`}>
                            <div className="step__number">{step.number}</div>
                            <h3 className="step__title">{t(`steps.${step.key}.title`)}</h3>
                            <p className="step__text">{t(`steps.${step.key}.text`)}</p>
                            <span className="step__time">{t(`steps.${step.key}.time`)}</span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
