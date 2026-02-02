"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { MouseGlow } from "@/components/MouseGlow";

export function HeroSection() {
    const t = useTranslations("Hero");
    const locale = useLocale();

    return (
        <section className="hero" id="hero">
            <MouseGlow />
            <div className="hero__grid"></div>
            <div className="container">
                <div className="hero__content">
                    <div className="hero__badge">
                        <span className="hero__badge-dot"></span>
                        {t("badge")}
                    </div>
                    <h1 className="hero__title">
                        {t("title")}<em>{t("titleHighlight")}</em>
                        <br />
                        {t("titleSuffix")}
                    </h1>
                    <p className="hero__subtitle">
                        {t("subtitle")}
                    </p>
                    <div className="hero__actions">
                        <Link href={`/${locale}/#contact`} className="btn btn--primary btn--large">
                            {t("ctaPrimary")}
                        </Link>
                        <Link href={`/${locale}/#how-it-works`} className="btn btn--secondary btn--large">
                            {t("ctaSecondary")}
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
