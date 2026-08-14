"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Boutique = {
  id: string | number;
  nom?: string;
  proprietaire?: string;
  telephone?: string;
  ville?: string;
  slug?: string;
  logo_url?: string;
};

export default function Portail() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<Boutique[]>([]);
  const router = useRouter();

  useEffect(() => {
    const initialQuery = (searchParams.get("q") || "").trim();
    if (initialQuery && initialQuery !== query) {
      setQuery(initialQuery);
    }
  }, [searchParams]);

  useEffect(() => {
    const q = query.trim();
    setError("");

    if (q.length < 1) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const supabase = createClient();
        const { data, error: err } = await supabase
          .from("boutiques")
          .select("id,nom,proprietaire,telephone,ville,slug,logo_url")
          .or(
            `nom.ilike.%${q}%,proprietaire.ilike.%${q}%,telephone.ilike.%${q}%,slug.ilike.%${q}%`
          )
          .limit(10);

        if (err) {
          setError("Erreur de recherche.");
          setResults([]);
        } else {
          const rows = (data || []) as Boutique[];
          setResults(rows);
          if (rows.length === 0) {
            setError("Aucune boutique trouvée.");
          }
        }
      } catch {
        setError("Erreur de recherche.");
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  function ouvrirBoutique(b: Boutique) {
    const key = b.slug || String(b.id);
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem("sds_boutique_id", String(key));
      if (b.nom) {
        window.sessionStorage.setItem("sds_boutique_nom", String(b.nom));
      }
    }
    router.push(`/catalogue?boutique=${encodeURIComponent(key)}`);
  }

  const handleSearch = () => {
    const q = query.trim();
    if (!q) return;

    if (results.length === 1) {
      ouvrirBoutique(results[0]);
      return;
    }

    router.replace(`/?q=${encodeURIComponent(q)}`);
  };

  return (
    <section
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "100px 20px 40px",
        background: "#020912",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Glow */}
      <div
        style={{
          position: "absolute",
          top: "-30%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 900,
          height: 900,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(0,200,255,0.12), transparent 62%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 2,
          width: "100%",
          maxWidth: 620,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div
          style={{
            fontFamily: "Rajdhani, sans-serif",
            fontSize: "clamp(17px, 4vw, 28px)",
            fontWeight: 700,
            letterSpacing: 5,
            textTransform: "uppercase",
            textAlign: "center",
            color: "#fff",
            marginBottom: 9,
          }}
        >
          <span style={{ color: "#fff" }}>SECK</span>{" "}
          <span style={{ color: "#00c8ff" }}>DIGITAL</span>{" "}
          <span style={{ color: "#fff" }}>SERVICES</span>{" "}
          <span style={{ color: "#00c8ff" }}>PRO</span>
        </div>

        <div
          style={{
            fontFamily: "DM Mono, monospace",
            fontSize: 11,
            letterSpacing: 3,
            color: "#7a9abb",
            textTransform: "uppercase",
            marginBottom: 30,
            textAlign: "center",
          }}
        >
          Réseau de boutiques partenaires
        </div>

        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <h1
            style={{
              fontSize: "clamp(21px, 5vw, 32px)",
              fontWeight: 700,
              lineHeight: 1.25,
              marginBottom: 12,
              color: "#fff",
            }}
          >
            Sécurisez vos ventes de téléphones avec{" "}
            <span style={{ color: "#00c8ff" }}>SDS PRO</span>
          </h1>
          <p
            style={{
              color: "#bdd4ea",
              fontSize: 14.5,
              lineHeight: 1.7,
              maxWidth: 520,
              margin: "0 auto",
            }}
          >
            Nous fournissons aux boutiques partenaires la technologie qui protège
            chaque téléphone vendu à crédit. Vous êtes client d’une de nos
            boutiques ? Retrouvez-la ci-dessous pour accéder à son catalogue.
          </p>
        </div>

        <div
          style={{
            width: "100%",
            background: "linear-gradient(160deg, #071828, #040f1e)",
            border: "1px solid rgba(0,180,255,0.22)",
            borderRadius: 22,
            padding: "26px 22px",
            boxShadow: "0 24px 70px rgba(0,0,0,0.5)",
          }}
        >
          <div
            style={{
              fontFamily: "Rajdhani, sans-serif",
              fontSize: 19,
              fontWeight: 600,
              letterSpacing: 1,
              color: "#fff",
              marginBottom: 5,
            }}
          >
            Trouver ma boutique
          </div>
          <div style={{ color: "#7a9abb", fontSize: 12.5, marginBottom: 16 }}>
            Tapez le début du nom, du téléphone ou du code partenaire.
          </div>

          <div>
            <div style={{ position: "relative", marginBottom: 11 }}>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSearch();
                  }
                }}
                placeholder="Ex: Mbao, 77, Modou…"
                autoComplete="off"
                style={{
                  width: "100%",
                  background: "rgba(0,20,40,0.6)",
                  border: "1.5px solid rgba(0,180,255,0.22)",
                  borderRadius: 14,
                  padding: "15px 46px 15px 15px",
                  color: "#fff",
                  fontSize: 16,
                  fontFamily: "Outfit, sans-serif",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
              <span
                style={{
                  position: "absolute",
                  right: 15,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#00c8ff",
                  fontSize: 19,
                  pointerEvents: "none",
                }}
              >
                {loading ? "…" : "⌕"}
              </span>
            </div>

            <div
              style={{
                fontFamily: "DM Mono, monospace",
                fontSize: 10.5,
                color: "#7a9abb",
                marginBottom: 14,
                lineHeight: 1.8,
              }}
            >
              Les résultats s’affichent dès la première lettre ou le premier chiffre.
            </div>

            {error && query.trim().length > 0 && results.length === 0 && !loading && (
              <p style={{ color: "#ff5a6e", fontSize: 13, marginBottom: 10 }}>{error}</p>
            )}

            {results.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {results.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => ouvrirBoutique(b)}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      background: "rgba(0,40,80,0.45)",
                      border: "1px solid rgba(0,180,255,0.25)",
                      borderRadius: 12,
                      padding: "12px 14px",
                      cursor: "pointer",
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: "rgba(0,200,255,0.1)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 18,
                        flexShrink: 0,
                        overflow: "hidden",
                      }}
                    >
                      {b.logo_url ? (
                        <img
                          src={b.logo_url}
                          alt=""
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      ) : (
                        "🏪"
                      )}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 15 }}>{b.nom}</div>
                      <div style={{ color: "#7a9abb", fontSize: 12, marginTop: 2 }}>
                        {[b.proprietaire, b.telephone, b.ville].filter(Boolean).join(" · ")}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ marginTop: 26, textAlign: "center" }}>
          <button
            onClick={() => router.push("/catalogue")}
            style={{
              background: "none",
              border: "none",
              color: "#7a9abb",
              fontSize: 12,
              borderBottom: "1px dotted rgba(0,180,255,0.22)",
              paddingBottom: 2,
              cursor: "pointer",
              marginBottom: 16,
              display: "inline-block",
            }}
          >
            Continuer sans revendeur (catalogue SDS PRO)
          </button>

          <div>
            <a
              href="/espace-partenaire"
              style={{
                color: "#00c8ff",
                fontSize: 12,
                textDecoration: "none",
                borderBottom: "1px solid #00c8ff",
                paddingBottom: 2,
              }}
            >
              Vous êtes une boutique ? Devenir partenaire SDS PRO
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}