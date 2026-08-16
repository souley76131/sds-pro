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
  boutiqueNom?: string | null;
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
  const [soundOn, setSoundOn] = useState(false);

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

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !soundOn;
    video.volume = soundOn ? 1 : 0;
  }, [soundOn]);

  function toggleSound(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setSoundOn((v) => !v);
  }

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
          position: "relative",
          borderRadius: 16,
          overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
          {product.video_url ? (
            <video
              ref={videoRef}
              muted={!soundOn}
              playsInline
              loop
              preload="metadata"
              poster={product.images?.[0] ?? undefined}
              src={product.video_url}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                zIndex: 0,
              }}
            />
          ) : product.images && product.images.length > 0 ? (
            <img
              src={product.images[0]}
              alt={product.name}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(135deg, rgba(0,80,255,0.08), rgba(0,20,40,0.3))",
                fontSize: 56,
              }}
            >
              {product.emoji || "📱"}
            </div>
          )}
        </div>

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
              zIndex: 3,
            }}
          >
            ▶ Vidéo
          </span>
        )}

        {product.video_url && (
          <button
            type="button"
            onClick={toggleSound}
            style={{
              position: "absolute",
              bottom: 10,
              left: 10,
              zIndex: 3,
              padding: "6px 10px",
              borderRadius: 999,
              border: "none",
              background: "rgba(0,0,0,0.65)",
              color: "#fff",
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            {soundOn ? "🔊" : "🔇"}
          </button>
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
              zIndex: 3,
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
            zIndex: 3,
          }}
        >
          {product.brand}
        </span>

        <div style={{ height: 160 }} />

        <div
          style={{
            position: "relative",
            zIndex: 2,
            padding: "12px 14px 14px",
            background: "linear-gradient(to top, rgba(2,10,20,0.72) 0%, rgba(2,10,20,0.35) 55%, rgba(2,10,20,0.12) 100%)",
            backdropFilter: "blur(2px)",
            WebkitBackdropFilter: "blur(2px)",
          }}
        >
          {product.boutiqueNom && (
            <div
              style={{
                fontSize: 10,
                color: "#00c8ff",
                fontFamily: "DM Mono, monospace",
                letterSpacing: 1,
                marginBottom: 2,
                textShadow: "0 1px 4px rgba(0,0,0,0.8)",
              }}
            >
              🏪 {product.boutiqueNom}
            </div>
          )}

          <div
            style={{
              fontSize: 11,
              color: "#c8dff5",
              fontFamily: "DM Mono, monospace",
              letterSpacing: 1,
              textShadow: "0 1px 4px rgba(0,0,0,0.8)",
            }}
          >
            {product.model || product.specs?.[0]}
          </div>

          <div
            style={{
              fontFamily: "Rajdhani, sans-serif",
              fontSize: 18,
              fontWeight: 700,
              color: "#fff",
              marginTop: 2,
              textShadow: "0 1px 6px rgba(0,0,0,0.85)",
            }}
          >
            {product.name}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: 12,
              gap: 8,
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
                  textShadow: "0 1px 6px rgba(0,0,0,0.8)",
                }}
              >
                {product.price.toLocaleString("fr-FR")}
              </div>
              <small style={{ fontSize: 9, color: "#b8d0e8" }}>FCFA</small>
            </div>

            <div style={{ display: "flex", gap: 6 }}>
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
    </div>
    </Link>
  );
}