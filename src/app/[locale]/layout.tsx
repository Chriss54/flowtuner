import type { Metadata } from "next";
import { Playfair_Display, DM_Sans, JetBrains_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing, Locale } from "@/i18n/routing";
import "../globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const playfairDisplay = Playfair_Display({
    variable: "--font-playfair",
    subsets: ["latin"],
    display: "swap",
    weight: ["400", "500", "600", "700"],
    style: ["normal", "italic"],
});

const dmSans = DM_Sans({
    variable: "--font-dm-sans",
    subsets: ["latin"],
    display: "swap",
    weight: ["300", "400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
    variable: "--font-jetbrains-mono",
    subsets: ["latin"],
    display: "swap",
    weight: ["400", "500"],
});

// Site configuration - replace placeholders before deployment
const siteConfig = {
    name: "FLOWTUNER",
    description: "[FIRMENBESCHREIBUNG]",
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://example.com",
    logo: "/images/logo.svg",
    phone: "[TELEFON]",
    email: "[EMAIL]",
    address: {
        street: "[STRASSE]",
        city: "[STADT]",
        postalCode: "[PLZ]",
        country: "DE",
    },
};

// Generate static params for all locales
export function generateStaticParams() {
    return routing.locales.map((locale) => ({ locale }));
}

// Organization Schema for all pages
const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.url,
    logo: `${siteConfig.url}${siteConfig.logo}`,
    description: siteConfig.description,
    contactPoint: {
        "@type": "ContactPoint",
        telephone: siteConfig.phone,
        contactType: "sales",
        availableLanguage: ["German", "English", "French"],
    },
    address: {
        "@type": "PostalAddress",
        streetAddress: siteConfig.address.street,
        addressLocality: siteConfig.address.city,
        postalCode: siteConfig.address.postalCode,
        addressCountry: siteConfig.address.country,
    },
};

type Props = {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { locale } = await params;
    const baseUrl = siteConfig.url;

    return {
        metadataBase: new URL(baseUrl),
        title: {
            default: `${siteConfig.name} – KI-Automatisierung für Unternehmen`,
            template: `%s | ${siteConfig.name}`,
        },
        description: siteConfig.description,
        keywords: [
            "KI-Automatisierung",
            "Company Brain",
            "Unternehmenswissen",
            "Digitale Transformation",
            "DSGVO-konforme KI",
        ],
        authors: [{ name: siteConfig.name }],
        creator: siteConfig.name,
        publisher: siteConfig.name,
        robots: {
            index: true,
            follow: true,
            googleBot: {
                index: true,
                follow: true,
                "max-video-preview": -1,
                "max-image-preview": "large",
                "max-snippet": -1,
            },
        },
        openGraph: {
            type: "website",
            locale: locale === "de" ? "de_DE" : locale === "fr" ? "fr_FR" : "en_US",
            url: `${baseUrl}/${locale}`,
            siteName: siteConfig.name,
            title: `${siteConfig.name} – KI-Automatisierung für Unternehmen`,
            description: siteConfig.description,
            images: [
                {
                    url: `${baseUrl}/images/og-image.jpg`,
                    width: 1200,
                    height: 630,
                    alt: siteConfig.name,
                },
            ],
        },
        twitter: {
            card: "summary_large_image",
            title: `${siteConfig.name} – KI-Automatisierung für Unternehmen`,
            description: siteConfig.description,
            images: [`${baseUrl}/images/og-image.jpg`],
        },
        alternates: {
            canonical: `${baseUrl}/${locale}`,
            languages: {
                "de-DE": `${baseUrl}/de`,
                "en-US": `${baseUrl}/en`,
                "fr-FR": `${baseUrl}/fr`,
                "x-default": `${baseUrl}/de`,
            },
        },
    };
}

export default async function RootLayout({ children, params }: Props) {
    const { locale } = await params;

    // Validate locale
    if (!routing.locales.includes(locale as Locale)) {
        notFound();
    }

    // Enable static rendering
    setRequestLocale(locale);

    // Load messages for the current locale
    const messages = await getMessages();

    return (
        <html lang={locale}>
            <head>
                <link rel="icon" href="/favicon.ico" sizes="any" />
                {/* hreflang tags for all locales */}
                <link rel="alternate" hrefLang="de" href={`${siteConfig.url}/de`} />
                <link rel="alternate" hrefLang="en" href={`${siteConfig.url}/en`} />
                <link rel="alternate" hrefLang="fr" href={`${siteConfig.url}/fr`} />
                <link rel="alternate" hrefLang="x-default" href={`${siteConfig.url}/de`} />
                {/* Theme initialization script - runs before paint to prevent flash */}
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
                            (function() {
                                try {
                                    var theme = localStorage.getItem('theme') || 'dark';
                                    document.documentElement.setAttribute('data-theme', theme);
                                } catch (e) {}
                            })();
                        `,
                    }}
                />
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify(organizationSchema),
                    }}
                />
            </head>
            <body className={`${playfairDisplay.variable} ${dmSans.variable} ${jetbrainsMono.variable}`}>
                <NextIntlClientProvider messages={messages}>
                    <Header />
                    <main>{children}</main>
                    <Footer />
                </NextIntlClientProvider>
            </body>
        </html>
    );
}
