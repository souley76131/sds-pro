"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Pub = {
  id: string;
  auteur_type?: string;
  boutique_id?: string | null;
  titre: string;
  sous_titre: string | null;
  media_url: string | null;
  media_type: string | null;
  lien_url: string | null;
  ordre?: number;
};

/** Fonds par défaut (style crédit phone) si pas de media en base */
const FALLBACK_BACKGROUNDS = [
  "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1592898915956-a96c94895502?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?auto=format&fit=crop&w=1600&q=80",
];

export default function PubHero() {
  const [pubs, setPubs] = useState<Pub[]>([]);
  const [i, setI] = useState(0);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data, error } = await supabase
        .from("publications")
        .select("id, auteur_type, boutique_id, titre, sous_titre, media_url, media_type, lien_url, ordre")
        .eq("actif", true)
        .order("ordre", { ascending: true });

      if (error) {
        console.error("PubHero select:", error.message, error);
        setPubs([]);
        return;
      }

      const rows = (data as Pub[]) || [];

      // Les pubs SDS passent toujours ; les pubs boutique seulement si la
      // boutique est SDS Verified au moment de l'affichage.
      const boutiqueIds = [
        ...new Set(
          rows
            .filter((r) => r.auteur_type === "boutique" && r.boutique_id)
            .map((r) => r.boutique_id!)
        ),
      ];

      let verifiedIds = new Set<string>();
      if (boutiqueIds.length) {
        const { data: bs } = await supabase
          .from("boutiques")
          .select("id")
          .in("id", boutiqueIds)
          .eq("sds_verified", true);
        verifiedIds = new Set((bs || []).map((b: { id: string }) => b.id));
      }

      setPubs(
        rows.filter(
          (r) =>
            r.auteur_type !== "boutique" ||
            (r.boutique_id && verifiedIds.has(r.boutique_id))
        )
      );
    })();
  }, []);

  useEffect(() => {
    if (pubs.length <= 1) return;
    const t = setInterval(() => setI((v) => (v + 1) % pubs.length), 5500);
    return () => clearInterval(t);
  }, [pubs.length]);

  const list =
    pubs.length > 0
      ? pubs
      : [
          {
            id: "fallback",
            titre: "Crédit phone & MDM",
            sous_titre:
              "Infrastructure MDM et solutions de crédit phone pour boutiques partenaires à Dakar et au Sénégal.",
            media_url: FALLBACK_BACKGROUNDS[0],
            media_type: "image",
            lien_url: "/credit-halal",
          },
        ];

  const p = list[i % list.length];
  const rawMedia = (p.media_url || "").trim();
  const bg = rawMedia || FALLBACK_BACKGROUNDS[i % FALLBACK_BACKGROUNDS.length];
  const isVideo = p.media_type === "video" && !!rawMedia;
  const href = p.lien_url || "/catalogue";

  return (
    <section
      style={{
        position: "relative",
        minHeight: 300,
        height: "min(44vh, 380px)",
        borderRadius: 16,
        overflow: "hidden",
        marginBottom: 28,
        border: "1px solid rgba(0,180,255,0.2)",
        background: "transparent",
      }}
    >
      {isVideo ? (
        <video
          key={p.id}
          src={p.media_url!}
          autoPlay
          muted
          loop
          playsInline
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      ) : (
        <div
          key={`${p.id}-${i}-${bg}`}
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url("${bg}")`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundColor: "#04101c",
          }}
        />
      )}

      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(105deg, rgba(2,10,22,0.78) 0%, rgba(2,10,22,0.45) 45%, rgba(2,10,22,0.2) 100%)",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "28px 24px 40px",
        }}
      >
        <h1
          style={{
            margin: 0,
            fontFamily: "Rajdhani, sans-serif",
            fontSize: "clamp(26px, 5vw, 42px)",
            fontWeight: 700,
            color: "#fff",
            letterSpacing: 1,
            lineHeight: 1.1,
            maxWidth: 640,
            textShadow: "0 2px 12px rgba(0,0,0,0.5)",
          }}
        >
          {p.titre}
        </h1>

        {p.sous_titre && (
          <p
            style={{
              margin: "12px 0 0",
              color: "#d0e4f5",
              fontSize: 15,
              lineHeight: 1.45,
              maxWidth: 520,
              textShadow: "0 1px 8px rgba(0,0,0,0.45)",
            }}
          >
            {p.sous_titre}
          </p>
        )}

        <Link
          href={href}
          style={{
            display: "inline-block",
            marginTop: 18,
            padding: "11px 20px",
            borderRadius: 10,
            background: "linear-gradient(135deg, #0055ff, #00c8ff)",
            color: "#fff",
            fontWeight: 600,
            fontSize: 13,
            textDecoration: "none",
            alignSelf: "flex-start",
            boxShadow: "0 8px 24px rgba(0,100,255,0.35)",
          }}
        >
          En savoir plus →
        </Link>
      </div>

      {list.length > 1 && (
        <div
          style={{
            position: "absolute",
            bottom: 14,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            gap: 7,
            zIndex: 2,
          }}
        >
          {list.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setI(idx)}
              style={{
                width: idx === i % list.length ? 18 : 8,
                height: 8,
                borderRadius: 99,
                border: "none",
                background:
                  idx === i % list.length ? "#00c8ff" : "rgba(255,255,255,0.4)",
                cursor: "pointer",
              }}
            />
          ))}
        </div>
      )}
    </section>
  );
}
