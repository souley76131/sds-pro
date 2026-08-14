"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

export type Product = {
  id: number | string;
  name: string;
  model: string;
  brand: string;
  price: number;
  badge?: string;
  specs?: string[];
  emoji?: string;
  images?: string[];
  video_url?: string | null;
  categorie?: string | null;
  description?: string | null;
  variantes?: { stockage?: string; couleur?: string; prix?: number; image?: string }[];
};

type Props = {
  product: Product;
  onOrder?: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
};

export default function ProductCard({ product, onOrder, onAddToCart }: Props) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoVisible, setVideoVisible] = useState(false);

  useEffect(() => {
    if (!product.video_url || typeof window === "undefined" || typeof IntersectionObserver === "undefined") return;
    const card = cardRef.current;
    const video = videoRef.current;
    if (!card || !video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setVideoVisible(entry.intersectionRatio >= 0.5);
      },
      { threshold: [0.5] }
    );

    observer.observe(card);
    return () => observer.disconnect();
  }, [product.video_url]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (videoVisible) {
      video.play().catch(() => {
        /* autoplay blocked */
      });
    } else {
      video.pause();
    }
  }, [videoVisible]);

  return (
    <Link href={`/produit/${product.id}`} style={{ display: "block", textDecoration: "none", color: "inherit" }}>
      <div
        ref={cardRef}
        style={{
          background: "rgba(7,24,40,0.12)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: "1px solid rgba(0,180,255,0.18)",
          borderRadius: 16,
          overflow: "hidden",
          cursor: "pointer",
          transition: "transform 0.3s, border-color 0.3s, box-shadow 0.3s",
          position: "relative",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-6px)";
          e.currentTarget.style.borderColor = "rgba(0,200,255,0.4)";
          e.currentTarget.style.boxShadow = "0 20px 60px rgba(0,100,255,0.25)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "none";
          e.currentTarget.style.borderColor = "rgba(0,180,255,0.18)";
          e.currentTarget.style.boxShadow = "none";
        }}
      >
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          background: "linear-gradient(180deg, rgba(2,9,17,0.02) 0%, rgba(2,9,17,0.48) 50%, rgba(2,9,17,0.8) 100%)",
        }}
      />
      {/* Image zone */}
      <div
        style={{
          height: 160,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, rgba(0,80,255,0.08), rgba(0,20,40,0.3))",
          fontSize: 56,
          position: "relative",
          overflow: "hidden",
          zIndex: 1,
        }}
      >
        {product.video_url ? (
          <video
            ref={videoRef}
            muted
            playsInline
            loop
            preload="metadata"
            poster={product.images?.[0] ?? undefined}
            src={product.video_url}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : product.images && product.images.length > 0 ? (
          <img
            src={product.images[0]}
            alt={product.name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <span style={{ zIndex: 1 }}>{product.emoji || "📱"}</span>
        )}
        {product.video_url && (
          <span
            style={{
              position: "absolute",
              bottom: 10,
              right: 10,
              background: "rgba(0,0,0,0.65)",
              color: "#00c8ff",
              borderRadius: 999,
              padding: "6px 10px",
              fontSize: 11,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            ▶ Vidéo
          </span>
        )}
        {product.badge && (
          <span
            style={{
              position: "absolute",
              top: 10,
              left: 10,
              fontSize: 9,
              fontWeight: 700,
              padding: "3px 10px",
              borderRadius: 100,
              letterSpacing: 1,
              textTransform: "uppercase",
              background: "#0055ff",
              color: "#fff",
            }}
          >
            {product.badge}
          </span>
        )}
        <span
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            fontFamily: "DM Mono, monospace",
            fontSize: 8,
            color: "#00c8ff",
            background: "rgba(0,150,255,0.12)",
            padding: "2px 7px",
            borderRadius: 4,
            border: "1px solid rgba(0,150,255,0.2)",
          }}
        >
          {product.brand}
        </span>
      </div>

      {/* Body */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          padding: "12px 14px 14px",
          background: "linear-gradient(180deg, rgba(4,14,28,0.08) 0%, rgba(4,14,28,0.46) 38%, rgba(4,14,28,0.68) 100%)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
          borderTop: "1px solid rgba(0, 180, 255, 0.10)",
        }}
      >
        <div
          style={{
            fontFamily: "DM Mono, monospace",
            fontSize: 9,
            color: "#9eb6d0",
            letterSpacing: 2,
            marginBottom: 4,
            textTransform: "uppercase",
          }}
        >
          {product.model}
        </div>

        <div
          style={{
            fontSize: 15,
            fontWeight: 600,
            marginBottom: 10,
            lineHeight: 1.3,
            color: "#fff",
          }}
        >
          {product.name}
        </div>

        {product.specs && (
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 13 }}>
            {product.specs.map((s) => (
              <span
                key={s}
                style={{
                  background: "rgba(0,150,255,0.1)",
                  border: "1px solid rgba(0,150,255,0.25)",
                  color: "#c8dff5",
                  fontSize: 9,
                  padding: "2px 8px",
                  borderRadius: 100,
                  fontFamily: "DM Mono, monospace",
                }}
              >
                {s}
              </span>
            ))}
          </div>
        )}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: 13,
            borderTop: "1px solid rgba(0,180,255,0.22)",
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "Rajdhani, sans-serif",
                fontSize: 22,
                fontWeight: 700,
                color: "#00c8ff",
                lineHeight: 1,
              }}
            >
              {product.price.toLocaleString("fr-FR")}
            </div>
            <small style={{ fontSize: 9, color: "#7a9abb" }}>FCFA</small>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onAddToCart?.(product);
              }}
              style={{
                background: "rgba(0,200,255,0.08)",
                color: "#00c8ff",
                border: "1px solid rgba(0,180,255,0.25)",
                padding: "9px 12px",
                borderRadius: 7,
                fontWeight: 600,
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              + Panier
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onOrder?.(product);
              }}
              style={{
                background: "linear-gradient(135deg, #0055ff, #00c8ff)",
                color: "#fff",
                border: "none",
                padding: "9px 14px",
                borderRadius: 7,
                fontWeight: 600,
                fontSize: 12,
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(0,100,255,0.3)",
              }}
            >
              Commander
            </button>
          </div>
        </div>
      </div>
    </div>
    </Link>
  );
}