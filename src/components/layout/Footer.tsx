"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import LegalIds from "@/components/LegalIds";

export default function Footer() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth <= 768);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return (
    <footer
      style={{
        background: "#000",
        borderTop: "1px solid rgba(0,180,255,0.22)",
        padding: isMobile ? "32px 16px 24px" : "56px 20px 36px",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          maxWidth: 1440,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(200px, 1fr))",
          gap: isMobile ? 24 : 40,
          marginBottom: isMobile ? 24 : 40,
          paddingBottom: isMobile ? 20 : 40,
          borderBottom: "1px solid rgba(0,180,255,0.22)",
          width: "100%",
          boxSizing: "border-box",
          overflow: "hidden",
        }}
      >
        {/* Brand */}
        <div>
          <div
            style={{
              fontFamily: "Rajdhani, sans-serif",
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: 2,
              marginBottom: 14,
            }}
          >
            <span style={{ color: "#00e5ff" }}>SDS</span>{" "}
            <span style={{ color: "#fff" }}>PRO</span>
          </div>
          <p
            style={{
              fontSize: 13,
              color: "#7a9abb",
              lineHeight: 1.7,
              maxWidth: 290,
              overflowWrap: "anywhere",
              wordBreak: "break-word",
            }}
          >
            <strong style={{ color: "#eaf7ff" }}>
              <span style={{ color: "#fff" }}>SECK</span>{" "}
              <span style={{ color: "#00c8ff" }}>DIGITAL</span>{" "}
              <span style={{ color: "#fff" }}>SERVICES</span>{" "}
              <span style={{ color: "#00c8ff" }}>PRO</span>{" "}
              (SDS PRO)
            </strong>
            <br />
            Commerce général, accessoires téléphoniques, vente en ligne et dépannage.
            <br />
            MDM &amp; crédit phone pour boutiques partenaires.
          </p>
          <div
            style={{
              fontSize: 12,
              color: "#7a9abb",
              lineHeight: 1.8,
              marginTop: 12,
            }}
          >
            Petit Mbao, Cité Ville Neuve, Villa N199 · Pikine, Dakar
            <br />
            <LegalIds style={{ fontSize: 12, color: "#7a9abb" }} />
            <br />
            📞 77 069 97 39 · contact@sdsprotech.com
          </div>

          <div style={{ display: "flex", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
            <FooterAnchor href="https://wa.me/221770699739" color="#25d366">
              WhatsApp
            </FooterAnchor>
            <FooterAnchor href="https://www.facebook.com/share/1LQKP4saFs/" color="#1877f2">
              Facebook
            </FooterAnchor>
            <FooterAnchor href="https://www.instagram.com/seckdigitalservicepro1" color="#e1306c">
              Instagram
            </FooterAnchor>
            <FooterAnchor href="mailto:contact@sdsprotech.com" color="#00c8ff">
              Email
            </FooterAnchor>
          </div>
        </div>

        {/* Catalogue */}
        <div>
          <h4
            style={{
              fontFamily: "Rajdhani, sans-serif",
              fontSize: 14,
              letterSpacing: 2,
              textTransform: "uppercase",
              marginBottom: 14,
              color: "#00c8ff",
            }}
          >
            Catalogue
          </h4>
          <FooterLink href="/catalogue">Smartphones</FooterLink>
          <FooterLink href="/accessoires">Accessoires</FooterLink>
          <FooterLink href="/ordinateurs">Ordinateurs</FooterLink>
          <FooterLink href="/credit-halal">Achat Échelonné</FooterLink>
        </div>

        {/* Contact */}
        <div>
          <h4
            style={{
              fontFamily: "Rajdhani, sans-serif",
              fontSize: 14,
              letterSpacing: 2,
              textTransform: "uppercase",
              marginBottom: 14,
              color: "#00c8ff",
            }}
          >
            Contact
          </h4>
          <FooterLink href="tel:+221770699739">77 069 97 39</FooterLink>
          <FooterLink href="https://wa.me/221770699739">WhatsApp</FooterLink>
          <FooterLink href="mailto:contact@sdsprotech.com">Email</FooterLink>
          <p style={{ fontSize: 13, color: "#7a9abb", marginTop: 8, lineHeight: 1.7 }}>
            Petit Mbao, Cité Ville Neuve, Villa N199
            <br />
            Pikine, Dakar
          </p>
        </div>
      </div>

      {/* Bottom */}
      <div
        style={{
          maxWidth: 1440,
          margin: "0 auto",
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          justifyContent: "space-between",
          alignItems: isMobile ? "flex-start" : "center",
          flexWrap: "wrap",
          gap: 8,
          fontSize: 11,
          color: "#7a9abb",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        <span>
          © 2026 <span style={{ color: "#fff" }}>SECK</span>{" "}
          <span style={{ color: "#00c8ff" }}>DIGITAL</span>{" "}
          <span style={{ color: "#fff" }}>SERVICES</span>{" "}
          <span style={{ color: "#00c8ff" }}>PRO</span>
        </span>
        <span>GÉRANT : SOULEYMANE SECK</span>
      </div>
    </footer>
  );
}

function FooterAnchor({
  href,
  color,
  children,
}: {
  href: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
      style={{ color, fontSize: 13, textDecoration: "none" }}
    >
      {children}
    </a>
  );
}

function FooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  if (!href.startsWith("/")) {
    return (
      <a
        href={href}
        target={href.startsWith("http") ? "_blank" : undefined}
        rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
        style={{
          display: "block",
          color: "#7a9abb",
          fontSize: 13,
          textDecoration: "none",
          marginBottom: 7,
        }}
      >
        {children}
      </a>
    );
  }

  return (
    <Link
      href={href}
      style={{
        display: "block",
        color: "#7a9abb",
        fontSize: 13,
        textDecoration: "none",
        marginBottom: 7,
      }}
    >
      {children}
    </Link>
  );
}