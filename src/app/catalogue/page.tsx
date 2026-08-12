"use client";

import { useEffect, useState } from "react";
import BuyFlow from "@/components/buy/BuyFlow";
import ProductCard from "@/components/catalogue/ProductCard";
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
    async function load() {
      try {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!url || !key) {
          setMessage("Clés Supabase manquantes dans .env.local");
          setLoading(false);
          return;
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
        });

        const { data, error } = await supabase
          .from("products")
          .select("*")
          .eq("visible", true)
          .order("id", { ascending: true });

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
      boutiqueId: currentBoutiqueId,
    });
    setCartFlash(`${product.name} ajouté au panier`);
    if (typeof window !== "undefined") {
      window.setTimeout(() => setCartFlash(""), 1800);
    }
  }

  return (
    <main style={{ paddingTop: 80, paddingBottom: 80, minHeight: "100vh" }}>
      <div style={{ maxWidth: 1440, margin: "0 auto", padding: "0 20px" }}>
        <div
          style={{
            fontFamily: "DM Mono, monospace",
            fontSize: 10,
            letterSpacing: 3,
            color: "#00c8ff",
            textTransform: "uppercase",
            marginBottom: 10,
          }}
        >
          // Catalogue complet
        </div>

        <h1
          style={{
            fontFamily: "Rajdhani, sans-serif",
            fontSize: "clamp(28px, 5vw, 52px)",
            fontWeight: 700,
            letterSpacing: 2,
            textTransform: "uppercase",
            marginBottom: 40,
          }}
        >
          SMARTPHONES{" "}
          <span
            style={{
              WebkitTextStroke: "1px rgba(0,200,255,0.2)",
              color: "transparent",
            }}
          >
            PREMIUM
          </span>
        </h1>

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
                      background: "rgba(4,14,28,0.6)",
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