import type { Metadata } from "next";
import "./globals.css";
import UrgentBanner from "@/components/UrgentBanner";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  metadataBase: new URL("https://sdsprotech.com"),
  title: "SDS PRO | Smartphones & Crédit Halal à Dakar",
  description:
    "Commerce général, accessoires téléphoniques, vente en ligne et dépannage. MDM & crédit phone pour boutiques partenaires — Dakar. NINEA 013038395 · RCCM SN DKR 2026 A 16899 · D-U-N-S 669805885.",
  keywords: [
    "smartphones Dakar",
    "téléphones Pikine",
    "crédit halal Dakar",
    "crédit téléphone Pikine",
    "iPhone Dakar",
    "Samsung Dakar",
    "livraison Dakar 24-48h",
    "SECK DIGITAL SERVICES PRO",
    "SDS PRO",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "SDS PRO — Smartphones Dakar",
    description: "Catalogue, boutiques partenaires et crédit halal à Dakar.",
    url: "https://sdsprotech.com",
    locale: "fr_SN",
    type: "website",
    siteName: "SECK DIGITAL SERVICES PRO",
  },
  robots: {
    index: true,
    follow: true,
  },
};

const localBusinessJsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "SECK DIGITAL SERVICES PRO",
  alternateName: "SDS PRO",
  url: "https://sdsprotech.com",
  telephone: "+221770699739",
  email: "contact@sdsprotech.com",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Petit Mbao, Cité Ville Neuve, Villa N199",
    addressLocality: "Pikine",
    addressRegion: "Dakar",
    addressCountry: "SN",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 14.7586,
    longitude: -17.389,
  },
  areaServed: "Dakar",
  priceRange: "$$",
  identifier: [
    { "@type": "PropertyValue", name: "NINEA", value: "013038395" },
    { "@type": "PropertyValue", name: "D-U-N-S", value: "669805885" },
  ],
  sameAs: [
    "https://wa.me/221770699739",
    "https://www.facebook.com/share/1LQKP4saFs/",
    "https://www.instagram.com/seckdigitalservicepro1",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Outfit:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
        />
      </head>
      <body
        style={{
          margin: 0,
          background: "#020912",
          color: "#fff",
          fontFamily: "Outfit, system-ui, sans-serif",
        }}
      >
        <UrgentBanner />
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}