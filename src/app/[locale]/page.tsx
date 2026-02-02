import { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { HeroSection } from "@/components/sections/HeroSection";
import { ProblemSection } from "@/components/sections/ProblemSection";
import { SolutionSection } from "@/components/sections/SolutionSection";
import { HowItWorksSection } from "@/components/sections/HowItWorksSection";
import { SocialProofSection } from "@/components/sections/SocialProofSection";
import { FAQSection } from "@/components/sections/FAQSection";
import { CTASection } from "@/components/sections/CTASection";
import { BlogTeaserSection } from "@/components/sections/BlogTeaserSection";

type Props = {
    params: Promise<{ locale: string }>;
};

// LocalBusiness Schema for Homepage
const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "FLOWTUNER",
    description: "[FIRMENBESCHREIBUNG]",
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://example.com",
    telephone: "[TELEFON]",
    email: "[EMAIL]",
    address: {
        "@type": "PostalAddress",
        streetAddress: "[STRASSE]",
        addressLocality: "[STADT]",
        postalCode: "[PLZ]",
        addressCountry: "DE",
    },
    geo: {
        "@type": "GeoCoordinates",
        latitude: "[LATITUDE]",
        longitude: "[LONGITUDE]",
    },
    openingHoursSpecification: [
        {
            "@type": "OpeningHoursSpecification",
            dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
            opens: "09:00",
            closes: "18:00",
        },
    ],
    priceRange: "$$",
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "Metadata" });

    return {
        title: t("title"),
        description: t("description"),
        alternates: {
            canonical: `/${locale}`,
        },
    };
}

export default async function HomePage({ params }: Props) {
    const { locale } = await params;
    setRequestLocale(locale);

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(localBusinessSchema),
                }}
            />
            <HeroSection />
            <ProblemSection />
            <SolutionSection />
            <HowItWorksSection />
            <SocialProofSection />
            <FAQSection />
            <CTASection />
            <BlogTeaserSection />
        </>
    );
}
