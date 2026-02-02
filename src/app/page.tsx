import { Metadata } from "next";
import { HeroSection } from "@/components/sections/HeroSection";
import { ProblemSection } from "@/components/sections/ProblemSection";
import { SolutionSection } from "@/components/sections/SolutionSection";
import { HowItWorksSection } from "@/components/sections/HowItWorksSection";
import { SocialProofSection } from "@/components/sections/SocialProofSection";
import { FAQSection } from "@/components/sections/FAQSection";
import { CTASection } from "@/components/sections/CTASection";
import { BlogTeaserSection } from "@/components/sections/BlogTeaserSection";

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

export const metadata: Metadata = {
  title: "FLOWTUNER – KI-Automatisierung für Unternehmen",
  description:
    "Wir automatisieren, was Ihre besten Leute von ihrer besten Arbeit abhält. Ihr Unternehmenswissen – sofort verfügbar für jeden Mitarbeiter.",
  alternates: {
    canonical: "/",
  },
};

export default function HomePage() {
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
