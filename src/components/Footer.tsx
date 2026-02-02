"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

export function Footer() {
    const t = useTranslations("Footer");
    const locale = useLocale();
    const currentYear = new Date().getFullYear();

    return (
        <footer className="footer">
            <div className="container">
                <div className="footer__inner">
                    <div className="footer__brand">
                        <span className="footer__logo">
                            <span className="footer__logo-dot"></span>
                            FLOWTUNER
                        </span>
                        <p>{t("description")}</p>
                    </div>

                    <div className="footer__column">
                        <h4 className="footer__heading">{t("navigation")}</h4>
                        <ul className="footer__links">
                            <li>
                                <Link href={`/${locale}/#solution`} className="footer__link">
                                    {t("services")}
                                </Link>
                            </li>
                            <li>
                                <Link href={`/${locale}/#how-it-works`} className="footer__link">
                                    {t("process")}
                                </Link>
                            </li>
                            <li>
                                <Link href={`/${locale}/#faq`} className="footer__link">
                                    {t("faq")}
                                </Link>
                            </li>
                            <li>
                                <Link href={`/${locale}/blog`} className="footer__link">
                                    {t("blog")}
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div className="footer__column">
                        <h4 className="footer__heading">{t("legal")}</h4>
                        <ul className="footer__links">
                            <li>
                                <Link href={`/${locale}/impressum`} className="footer__link">
                                    {t("imprint")}
                                </Link>
                            </li>
                            <li>
                                <Link href={`/${locale}/datenschutz`} className="footer__link">
                                    {t("privacy")}
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="footer__bottom">
                    <p>{t("copyright", { year: currentYear })}</p>
                    <p>{t("madeIn")}</p>
                </div>
            </div>
        </footer>
    );
}
