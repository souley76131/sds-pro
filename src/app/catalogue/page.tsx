"use client";

import { useEffect, useRef, useState } from "react";
import BuyFlow from "@/components/buy/BuyFlow";
import ProductCard from "@/components/catalogue/ProductCard";
import PubHero from "@/components/home/PubHero";
import { createClient } from "@/lib/supabase/client";
import { addToCart } from "@/lib/cart";

type Product = {
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
  boutiqueId?: string | null;
  boutiqueNom?: string | null;
};

type BoutiqueMeta = {
  nom?: string;
  logo?: string;
  telephone?: string;
  whatsapp?: string;
  heroVideos?: string[];
  ouvertureStatut?: "ouverte" | "fermee" | "suspendue" | null;
  messagePublic?: string | null;
};

const BRANDS = [
  { id: "apple", name: "Apple" },
  { id: "samsung", name: "Samsung" },
  { id: "infinix", name: "Infinix" },
  { id: "tecno", name: "Tecno" },
  { id: "huawei", name: "Huawei" },
];

export default function CataloguePage() {
  const [openBrand, setOpenBrand] = useState<string | null>("all");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("Chargement…");
  const [currentBoutiqueId, setCurrentBoutiqueId] = useState<string | null>(null);
  const [boutiqueMeta, setBoutiqueMeta] = useState<BoutiqueMeta | null>(null);
  const [boutiqueProductCount, setBoutiqueProductCount] = useState(0);
  const [boutiqueMinPrice, setBoutiqueMinPrice] = useState<number | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [buyProduct, setBuyProduct] = useState<Product | null>(null);
  const [choiceOpen, setChoiceOpen] = useState(false);
  const [cartFlash, setCartFlash] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const p = new URLSearchParams(window.location.search);
    const found =
      p.get("boutique_id") ||
      p.get("boutique") ||
      window.sessionStorage.getItem("sds_boutique_id") ||
      null;

    if (found) {
      setCurrentBoutiqueId(found);
      window.sessionStorage.setItem("sds_boutique_id", found);
    }
  }, []);

  useEffect(() => {
    if (!currentBoutiqueId) {
      setBoutiqueMeta(null);
      return;
    }

    const loadBoutiqueMeta = async () => {
      try {
        const supabase = createClient();

        // "name" n'existe pas sur boutiques (seule "nom" existe) — l'inclure faisait
        // échouer TOUTE la requête (42703), donc la bannière boutique (nom, logo,
        // tel, whatsapp, vidéos) ne s'affichait jamais sur un catalogue boutique-scopé.
        let boutique = null;
        let heroVidsData: string[] = [];

        const { data, error } = await supabase
          .from("boutiques")
          .select("id, nom, logo_url, telephone, whatsapp, hero_videos, ouverture_statut, message_public")
          .eq("id", currentBoutiqueId)
          .maybeSingle();

        if (data) {
          boutique = data;

          // Parse hero_videos safely
          if (boutique.hero_videos) {
            if (typeof boutique.hero_videos === 'string') {
              try {
                heroVidsData = JSON.parse(boutique.hero_videos);
              } catch {
                heroVidsData = [];
              }
            } else if (Array.isArray(boutique.hero_videos)) {
              heroVidsData = boutique.hero_videos;
            }
          }
        }

        // Si hero_videos n'existe pas dans cet environnement, fallback sans cette colonne
        if (!data && error && error.message.includes('hero_videos')) {
          const { data: fallback } = await supabase
            .from("boutiques")
            .select("id, nom, logo_url, telephone, whatsapp, ouverture_statut, message_public")
            .eq("id", currentBoutiqueId)
            .maybeSingle();

          boutique = fallback;
        }

        if (boutique) {
          setBoutiqueMeta({
            nom: boutique.nom || "Boutique",
            logo: boutique.logo_url || undefined,
            telephone: boutique.telephone || undefined,
            whatsapp: boutique.whatsapp || undefined,
            heroVideos: heroVidsData.filter(Boolean),
            ouvertureStatut: boutique.ouverture_statut || "ouverte",
            messagePublic: boutique.message_public || null,
          });
        }

        // Count products for this boutique
        const { count: productCount } = await supabase
          .from("products")
          .select("id", { count: "exact", head: true })
          .eq("boutique_id", currentBoutiqueId)
          .eq("visible", true)
          .eq("moderation_status", "approved");

        setBoutiqueProductCount(productCount || 0);

        // Find minimum price for this boutique
        const { data: minPriceData } = await supabase
          .from("products")
          .select("price")
          .eq("boutique_id", currentBoutiqueId)
          .eq("visible", true)
          .eq("moderation_status", "approved")
          .order("price", { ascending: true })
          .limit(1);

        if (minPriceData && minPriceData.length > 0) {
          setBoutiqueMinPrice(Number(minPriceData[0].price || 0));
        }
      } catch (err) {
        console.error("Error loading boutique meta:", err);
        setBoutiqueMeta(null);
      }
    };

    loadBoutiqueMeta();
  }, [currentBoutiqueId]);

  useEffect(() => {
    async function load() {
      try {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!url || !key) {
          setMessage("Clés Supabase manquantes dans .env.local");
          setLoading(false);
          return;
        }

        // Contexte boutique (même détection que l'effect ci-dessus, lu en synchrone
        // ici pour éviter un flash "catalogue global" avant que l'état se mette à jour).
        let boutiqueScope: string | null = null;
        if (typeof window !== "undefined") {
          const p = new URLSearchParams(window.location.search);
          boutiqueScope =
            p.get("boutique_id") ||
            p.get("boutique") ||
            window.sessionStorage.getItem("sds_boutique_id") ||
            null;
        }

        const supabase = createClient();
        const mapProduct = (p: any): Product => ({
          id: p.id,
          name: p.nom || p.name || p.n || "Produit",
          model: p.modele || p.model || p.m || "",
          brand: String(p.marque || p.brand || p.b || "").toLowerCase(),
          price: Number(p.prix || p.price || p.prix_raw || 0),
          badge: p.badge || undefined,
          specs: Array.isArray(p.specs) ? p.specs : [],
          emoji: p.emoji || undefined,
          images: Array.isArray(p.images) ? p.images : [],
          video_url: p.video_url || null,
          categorie: p.categorie || null,
          description: p.description || p.description_longue || null,
          variantes: Array.isArray(p.variantes) ? p.variantes : [],
          boutiqueId: p.boutique_id || null,
          boutiqueNom: p.boutiques?.nom || null,
        });

        let productsQuery = supabase
          .from("products")
          .select("*, boutiques(nom)")
          .eq("visible", true)
          .eq("moderation_status", "approved");

        if (boutiqueScope) {
          productsQuery = productsQuery.eq("boutique_id", boutiqueScope);
        }

        const { data, error } = await productsQuery.order("id", { ascending: true });

        if (error) {
          const { data: fallbackData, error: fallbackError } = await supabase
            .from("produits")
            .select("*")
            .eq("visible", true)
            .order("id", { ascending: true });

          if (fallbackError) {
            setMessage("Erreur Supabase : " + fallbackError.message);
            setLoading(false);
            return;
          }

          const mappedFallback: Product[] = (fallbackData || []).map(mapProduct);
          setProducts(mappedFallback);
          setMessage(
            mappedFallback.length === 0
              ? "Aucun produit pour le moment. Ils seront ajoutés via l’espace partenaire / admin."
              : ""
          );
          return;
        }

        let mapped: Product[] = (data || []).map(mapProduct);

        if (mapped.length === 0) {
          const { data: fallbackData, error: fallbackError } = await supabase
            .from("produits")
            .select("*")
            .eq("visible", true)
            .order("id", { ascending: true });

          if (!fallbackError) {
            mapped = (fallbackData || []).map(mapProduct);
          }
        }

        setProducts(mapped);
        setMessage(
          mapped.length === 0
            ? "Aucun produit pour le moment. Ils seront ajoutés via l’espace partenaire / admin."
            : ""
        );
      } catch (e: any) {
        setMessage("Erreur : " + (e.message || "inconnue"));
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const toggle = (id: string) => {
    setOpenBrand((prev) => (prev === id ? null : id));
  };

  const getProductsByBrand = (brandId: string) =>
    products.filter((p) => p.brand.includes(brandId));

  function openBuyChoice(product: Product) {
    setSelectedProduct(product);
    setChoiceOpen(true);
    if (typeof document !== "undefined") {
      document.body.style.overflow = "hidden";
    }
  }

  function closeBuyChoice() {
    setChoiceOpen(false);
    if (typeof document !== "undefined") {
      document.body.style.overflow = "";
    }
  }

  function chooseBuyDirect() {
    if (!selectedProduct) return;
    if (typeof window !== "undefined" && currentBoutiqueId) {
      window.sessionStorage.setItem("sds_boutique_id", currentBoutiqueId);
    }
    closeBuyChoice();
    setBuyProduct(selectedProduct);
  }

  function chooseBuyCredit() {
    closeBuyChoice();
    if (!selectedProduct || typeof window === "undefined") return;

    const params = new URLSearchParams({
      produit_id: String(selectedProduct.id || ""),
      appareil: selectedProduct.name || "",
      prix: String(selectedProduct.price || 0),
    });

    if (currentBoutiqueId) {
      params.set("boutique_id", currentBoutiqueId);
    }

    window.location.href = "/credit-halal?" + params.toString();
  }

  function addProductToCart(product: Product) {
    addToCart({
      productId: String(product.id),
      name: product.name,
      model: product.model,
      brand: product.brand,
      emoji: product.emoji,
      unitPrice: Number(product.price || 0),
      qty: 1,
      boutiqueId: product.boutiqueId || currentBoutiqueId,
      boutiqueNom: product.boutiqueNom || boutiqueMeta?.nom || null,
    });
    setCartFlash(`${product.name} ajouté au panier`);
    if (typeof window !== "undefined") {
      window.setTimeout(() => setCartFlash(""), 1800);
    }
  }

  return (
    <main style={{ paddingTop: 80, paddingBottom: 80, minHeight: "100vh" }}>
      <div style={{ maxWidth: 1440, margin: "0 auto", padding: "0 20px" }}>
        <PubHero />

        {(loading || message) && (
          <p style={{ color: "#7a9abb", marginBottom: 24, fontSize: 14 }}>
            {loading ? "Chargement…" : message}
          </p>
        )}

        {cartFlash && (
          <div
            style={{
              marginBottom: 16,
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid rgba(52,211,153,0.35)",
              background: "rgba(52,211,153,0.12)",
              color: "#9ff0ca",
              fontSize: 13,
            }}
          >
            {cartFlash}
          </div>
        )}

        {currentBoutiqueId &&
        boutiqueMeta &&
        (boutiqueMeta.ouvertureStatut === "fermee" || boutiqueMeta.ouvertureStatut === "suspendue") ? (
          <div
            style={{
              textAlign: "center",
              padding: "60px 20px",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 16,
              background: "rgba(255,255,255,0.03)",
            }}
          >
            <h1 style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 24, marginBottom: 10 }}>
              {boutiqueMeta.nom}
            </h1>
            <p
              style={{
                color: boutiqueMeta.ouvertureStatut === "suspendue" ? "#f87171" : "#ff9100",
                fontWeight: 700,
                marginBottom: 10,
              }}
            >
              {boutiqueMeta.ouvertureStatut === "suspendue" ? "Boutique suspendue" : "Boutique fermée"}
            </p>
            <p style={{ color: "#c8dff5", maxWidth: 420, margin: "0 auto" }}>
              {boutiqueMeta.messagePublic || "Cette boutique n'accepte pas de commandes pour le moment."}
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {BRANDS.map((brand) => {
            const isOpen = openBrand === brand.id || openBrand === "all";
            const brandProducts = getProductsByBrand(brand.id);

            return (
              <div
                key={brand.id}
                style={{
                  borderRadius: 16,
                  overflow: "hidden",
                  border: `1px solid ${
                    isOpen ? "rgba(0,200,255,0.4)" : "rgba(0,180,255,0.22)"
                  }`,
                }}
              >
                <div
                  onClick={() => toggle(brand.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 20,
                    padding: "22px 28px",
                    cursor: "pointer",
                    background: isOpen
                      ? "rgba(0,60,180,0.12)"
                      : "rgba(7,24,40,0.7)",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontFamily: "Rajdhani, sans-serif",
                        fontSize: 22,
                        fontWeight: 700,
                        letterSpacing: 3,
                        textTransform: "uppercase",
                      }}
                    >
                      {brand.name}
                    </div>
                    <div
                      style={{
                        fontFamily: "DM Mono, monospace",
                        fontSize: 10,
                        color: "#8ab0cc",
                        marginTop: 5,
                      }}
                    >
                      {brandProducts.length} modèles
                    </div>
                  </div>

                  <div
                    style={{
                      background: "rgba(0,200,255,0.1)",
                      border: "1px solid rgba(0,200,255,0.25)",
                      borderRadius: 100,
                      padding: "4px 14px",
                      fontFamily: "Rajdhani, sans-serif",
                      fontSize: 18,
                      fontWeight: 700,
                      color: "#00c8ff",
                    }}
                  >
                    {brandProducts.length}
                  </div>

                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      border: `1px solid ${
                        isOpen ? "#00c8ff" : "rgba(0,180,255,0.22)"
                      }`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: isOpen ? "#00c8ff" : "#7a9abb",
                      transform: isOpen ? "rotate(90deg)" : "none",
                      transition: "all 0.3s",
                    }}
                  >
                    ›
                  </div>
                </div>

                {isOpen && (
                  <div
                    style={{
                      padding: "20px 28px 28px",
                      background: "transparent",
                    }}
                  >
                    {brandProducts.length === 0 ? (
                      <p style={{ color: "#7a9abb", fontSize: 14 }}>
                        Aucun produit pour cette marque.
                      </p>
                    ) : (
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "repeat(auto-fill, minmax(240px, 1fr))",
                          gap: 16,
                        }}
                      >
                        {brandProducts.map((p) => (
                          <ProductCard key={p.id} product={p} onOrder={openBuyChoice} onAddToCart={addProductToCart} />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          </div>
        )}
      </div>

      <div
        className={choiceOpen ? "buy-choice-overlay on" : "buy-choice-overlay"}
        onClick={(e) => {
          if (e.target === e.currentTarget) closeBuyChoice();
        }}
        style={{
          display: choiceOpen ? "flex" : "none",
          position: "fixed",
          inset: 0,
          zIndex: 1200,
          background: "rgba(0,0,0,0.85)",
          alignItems: "flex-end",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 480,
            background: "rgba(4,14,28,0.99)",
            border: "1px solid rgba(0,200,255,0.2)",
            borderRadius: "22px 22px 0 0",
            padding: "22px 20px 28px",
            transform: choiceOpen ? "translateY(0)" : "translateY(100%)",
            transition: "transform 0.35s cubic-bezier(0.4,0,0.2,1)",
          }}
        >
          <div
            style={{
              fontFamily: "Rajdhani, sans-serif",
              fontSize: 20,
              fontWeight: 700,
              color: "#00c8ff",
              marginBottom: 6,
            }}
          >
            Comment voulez-vous payer ?
          </div>
          <div style={{ fontSize: 13, color: "#7a9abb", marginBottom: 18, lineHeight: 1.5 }}>
            {selectedProduct
              ? `${selectedProduct.name || "Ce produit"} — ${(selectedProduct.price || 0).toLocaleString("fr-FR")} FCFA`
              : "Choisissez le mode d’achat pour ce produit."}
          </div>

          <button
            onClick={chooseBuyDirect}
            style={{
              width: "100%",
              padding: 16,
              borderRadius: 12,
              marginBottom: 10,
              fontFamily: "Rajdhani, sans-serif",
              fontWeight: 700,
              fontSize: 15,
              letterSpacing: 1,
              cursor: "pointer",
              border: "none",
              transition: "all 0.2s",
              background: "linear-gradient(135deg,#0033cc,#00aaff)",
              color: "#fff",
              boxShadow: "0 4px 20px rgba(0,100,255,0.35)",
            }}
          >
            💳 Achat direct — payer maintenant
          </button>

          <button
            onClick={chooseBuyCredit}
            style={{
              width: "100%",
              padding: 16,
              borderRadius: 12,
              marginBottom: 10,
              fontFamily: "Rajdhani, sans-serif",
              fontWeight: 700,
              fontSize: 15,
              letterSpacing: 1,
              cursor: "pointer",
              border: "none",
              transition: "all 0.2s",
              background: "linear-gradient(135deg,#b8860b,#ffd700)",
              color: "#000",
            }}
          >
            🌙 Achat échelonné Halal — 4 versements
          </button>

          <button
            onClick={closeBuyChoice}
            style={{
              width: "100%",
              padding: 16,
              borderRadius: 12,
              marginBottom: 10,
              fontFamily: "Rajdhani, sans-serif",
              fontWeight: 700,
              fontSize: 15,
              letterSpacing: 1,
              cursor: "pointer",
              transition: "all 0.2s",
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.15)",
              color: "#7a9abb",
            }}
          >
            Annuler
          </button>
        </div>
      </div>

      <BuyFlow
        product={buyProduct}
        open={!!buyProduct}
        onClose={() => setBuyProduct(null)}
      />
    </main>
  );
}

function CatalogueHero({
  boutiqueNom,
  boutiqueLogo,
  telephone,
  whatsapp,
  productCount = 0,
  minPrice,
  heroVideos = [],
}: {
  boutiqueNom?: string;
  boutiqueLogo?: string;
  telephone?: string;
  whatsapp?: string;
  productCount?: number;
  minPrice?: number | null;
  heroVideos?: string[];
}) {
  const [videoIndex, setVideoIndex] = useState(0);
  const [withSound, setWithSound] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const currentVideo = heroVideos && heroVideos.length > 0 
    ? heroVideos[videoIndex % heroVideos.length] 
    : null;

  useEffect(() => {
    const videos = heroVideos && Array.isArray(heroVideos) ? heroVideos.filter(Boolean) : [];

    if (videos.length <= 1) return;

    const timer = setInterval(() => {
      setVideoIndex((v) => (v + 1) % videos.length);
    }, 6000);

    return () => clearInterval(timer);
  }, [heroVideos]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !withSound;
    v.volume = withSound ? 1 : 0;
    if (withSound) {
      v.play().catch(() => undefined);
    }
  }, [withSound, currentVideo]);

  const contact = whatsapp || telephone;

  function enableSound() {
    const v = videoRef.current;
    if (!v) return;
    v.muted = false;
    v.volume = 1;
    v.play().catch(() => undefined);
    setWithSound(true);
  }

  return (
    <section
      style={{
        position: "relative",
        minHeight: 320,
        height: "min(48vh, 420px)",
        borderRadius: 16,
        overflow: "hidden",
        marginBottom: 28,
        border: "1px solid rgba(0,200,255,0.22)",
        background: "#04101c",
      }}
    >
      {currentVideo && (
        <video
          ref={videoRef}
          key={currentVideo}
          src={currentVideo}
          autoPlay
          muted={!withSound}
          loop
          playsInline
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: 0.55,
          }}
        />
      )}

      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(90deg, rgba(2,10,20,0.9), rgba(2,10,20,0.5))",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          padding: "32px 40px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          minHeight: "100%",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
          {boutiqueLogo && (
            <img
              src={boutiqueLogo}
              alt=""
              style={{
                width: 56,
                height: 56,
                borderRadius: 12,
                objectFit: "cover",
                border: "2px solid rgba(0,200,255,0.4)",
                boxShadow: "0 8px 24px rgba(0,200,255,0.15)",
              }}
            />
          )}
          <div>
            <div
              style={{
                fontFamily: "DM Mono, monospace",
                fontSize: 11,
                letterSpacing: 2,
                color: "#00c8ff",
                textTransform: "uppercase",
                marginBottom: 4,
              }}
            >
              Bienvenue chez
            </div>
            <h1
              style={{
                margin: 0,
                fontFamily: "Rajdhani, sans-serif",
                fontSize: "clamp(24px, 5vw, 42px)",
                fontWeight: 700,
                color: "#fff",
                letterSpacing: 1,
              }}
            >
              {boutiqueNom || "SDS PRO"}
            </h1>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 20,
            color: "#9eb6d0",
            fontSize: "clamp(13px, 2vw, 15px)",
            fontFamily: "Outfit, sans-serif",
          }}
        >
          {contact && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 18 }}>📞</span>
              <span style={{ color: "#00c8ff", fontWeight: 600 }}>{contact}</span>
            </div>
          )}
          {productCount > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 18 }}>📦</span>
              <span style={{ color: "#34d399", fontWeight: 600 }}>
                {productCount} produit{productCount > 1 ? "s" : ""}
              </span>
            </div>
          )}
          {minPrice !== null && minPrice !== undefined && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 18 }}>💰</span>
              <span style={{ color: "#fb923c", fontWeight: 600 }}>
                dès {minPrice.toLocaleString("fr-FR")} FCFA
              </span>
            </div>
          )}
        </div>
      </div>

      {currentVideo && (
        <button
          type="button"
          onClick={enableSound}
          style={{
            position: "absolute",
            right: 16,
            bottom: 16,
            zIndex: 3,
            padding: "8px 12px",
            borderRadius: 999,
            border: "1px solid rgba(255,255,255,0.24)",
            background: "rgba(0,0,0,0.55)",
            color: "#fff",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 600,
            backdropFilter: "blur(6px)",
          }}
        >
          {withSound ? "🔊 Son activé" : "🔇 Activer le son"}
        </button>
      )}

      {heroVideos && heroVideos.length > 1 && (
        <div
          style={{
            position: "absolute",
            bottom: 16,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            gap: 8,
            zIndex: 2,
          }}
        >
          {heroVideos.map((_, idx) => (
            <div
              key={idx}
              style={{
                width: idx === videoIndex ? 18 : 8,
                height: 8,
                borderRadius: 99,
                background:
                  idx === videoIndex ? "#00c8ff" : "rgba(255,255,255,0.25)",
                transition: "all 0.3s ease",
              }}
            />
          ))}
        </div>
      )}
    </section>
  );
}