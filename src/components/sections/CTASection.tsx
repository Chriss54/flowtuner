"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";

const calendlyUrl =
    process.env.NEXT_PUBLIC_CALENDLY_URL || "https://calendly.com/[CALENDLY-URL]";

export function CTASection() {
    const t = useTranslations("CTA");
    const calendlyRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Dynamically load Calendly widget script
        const script = document.createElement("script");
        script.src = "https://assets.calendly.com/assets/external/widget.js";
        script.async = true;

        if (!document.querySelector('script[src*="calendly"]')) {
            document.head.appendChild(script);
        }
    }, []);

    return (
        <section className="section cta-section" id="contact">
            <div className="container">
                <div className="cta-content reveal">
                    <span className="section__label">{t("label")}</span>
                    <h2 className="cta-title">{t("title")}</h2>
                    <p className="cta-subtitle">{t("subtitle")}</p>

                    {/* Calendly Inline Embed */}
                    <div ref={calendlyRef} className="cta-embed">
                        <div
                            className="calendly-inline-widget"
                            data-url={calendlyUrl}
                            style={{ minWidth: "320px", height: "500px" }}
                        ></div>

                        {/* Fallback placeholder */}
                        <noscript>
                            <div className="cta-embed-placeholder">
                                <p>
                                    {t("noJsMessage")}{" "}
                                    <a
                                        href={calendlyUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        {t("noJsLink")}
                                    </a>
                                </p>
                            </div>
                        </noscript>
                    </div>

                    <div className="cta-trust">
                        <span>{t("trustGdpr")}</span>
                        <span>{t("trustGerman")}</span>
                        <span>{t("trustFree")}</span>
                    </div>
                </div>
            </div>
        </section>
    );
}
