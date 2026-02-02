"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { routing, Locale } from "@/i18n/routing";

const localeLabels: Record<Locale, string> = {
    de: "DE",
    en: "EN",
    fr: "FR",
};

export function Header() {
    const t = useTranslations("Header");
    const locale = useLocale();
    const pathname = usePathname();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
        document.body.style.overflow = isMenuOpen ? "" : "hidden";
    };

    const closeMenu = () => {
        setIsMenuOpen(false);
        document.body.style.overflow = "";
    };

    // Get path without locale prefix for switching
    const getLocaleSwitchPath = (newLocale: string) => {
        // Remove current locale prefix and add new one
        const pathWithoutLocale = pathname.replace(/^\/(de|en|fr)/, "") || "/";
        return `/${newLocale}${pathWithoutLocale === "/" ? "" : pathWithoutLocale}`;
    };

    const navLinks = [
        { href: `/${locale}/#solution`, label: t("services") },
        { href: `/${locale}/#how-it-works`, label: t("process") },
        { href: `/${locale}/#faq`, label: t("faq") },
        { href: `/${locale}/blog`, label: t("blog") },
    ];

    return (
        <header className={`header ${isScrolled ? "header--scrolled" : ""}`}>
            <div className="header__inner">
                <Link href={`/${locale}`} className="header__logo" onClick={closeMenu}>
                    <span className="header__logo-dot"></span>
                    FLOWTUNER
                </Link>

                <button
                    className="header__menu-toggle"
                    onClick={toggleMenu}
                    aria-label={isMenuOpen ? t("menuClose") : t("menuOpen")}
                    aria-expanded={isMenuOpen}
                >
                    <span></span>
                    <span></span>
                    <span></span>
                </button>

                <nav className={`header__nav ${isMenuOpen ? "is-open" : ""}`}>
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className="header__nav-link"
                            onClick={closeMenu}
                        >
                            {link.label}
                        </Link>
                    ))}

                    {/* Language Switcher */}
                    <div className="header__lang-switcher">
                        {routing.locales.map((loc, index) => (
                            <span key={loc}>
                                <Link
                                    href={getLocaleSwitchPath(loc)}
                                    className={`header__lang-link ${locale === loc ? "header__lang-link--active" : ""}`}
                                    onClick={closeMenu}
                                >
                                    {localeLabels[loc]}
                                </Link>
                                {index < routing.locales.length - 1 && (
                                    <span className="header__lang-separator">·</span>
                                )}
                            </span>
                        ))}
                    </div>

                    <div className="header__cta">
                        <Link href={`/${locale}/#contact`} className="btn btn--primary" onClick={closeMenu}>
                            {t("cta")}
                        </Link>
                    </div>
                </nav>
            </div>
        </header>
    );
}
