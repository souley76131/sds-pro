"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { addToCart } from "@/lib/cart";
import BuyFlow from "@/components/buy/BuyFlow";
import type { Product } from "@/components/catalogue/ProductCard";

const LIVRAISON = 10000;

function formatPrice(value: number) {
  return value.toLocaleString("fr-FR");
}

function ProductVideo({ src }: { src: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [soundOn, setSoundOn] = useState(false);

  function toggleSound() {
    const video = ref.current;
    if (!video) return;

    if (soundOn) {
      video.muted = true;
      setSoundOn(false);
      return;
    }

    video.muted = false;
    video.volume = 1;
    video.play().catch(() => undefined);
    setSoundOn(true);
  }

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <video
        ref={ref}
        src={src}
        autoPlay
        muted
        loop
        playsInline
        controls
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
          background: "#000",
        }}
      />
      <button
        type="button"
        onClick={toggleSound}
        style={{
          position: "absolute",
          top: 12,
          right: 12,
          zIndex: 2,
          padding: "8px 12px",
          borderRadius: 8,
          border: "none",
          background: "rgba(0,0,0,0.65)",
          color: "#fff",
          cursor: "pointer",
          fontSize: 13,
        }}
      >
        {soundOn ? "🔊 Son" : "🔇 Activer le son"}
      </button>
    </div>
  );
}

export default function ProductDetailPage() {
  const params = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [buyOpen, setBuyOpen] = useState(false);
  const [qty, setQty] = useState(1);
  const [cartFlash, setCartFlash] = useState("");
  const [boutiqueId, setBoutiqueId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const query = new URLSearchParams(window.location.search);
    const boutique =
      query.get("boutique_id") || query.get("boutique") || window.sessionStorage.getItem("sds_boutique_id") || null;
    if (boutique) {
      setBoutiqueId(boutique);
      window.sessionStorage.setItem("sds_boutique_id", boutique);
    }
  }, []);

  useEffect(() => {
    const id = params?.id;
    if (!id) return;

    async function load() {
      setLoading(true);
      setError("");
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
        variantes: Array.isArray(p.variantes) ? p.variantes : [],
        images: Array.isArray(p.images) ? p.images : [],
        video_url: p.video_url || null,
        categorie: p.categorie || null,
        description: p.description || p.description_longue || null,
      });

      try {
        let { data, error: err } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
        if (err || !data) {
          const fallback = await supabase.from("produits").select("*").eq("id", id).maybeSingle();
          if (fallback.error || !fallback.data) {
            setError("Produit introuvable.");
            setProduct(null);
            return;
          }
          setProduct(mapProduct(fallback.data));
          return;
        }
        setProduct(mapProduct(data));
      } catch (e: any) {
        setError("Erreur lors du chargement du produit.");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [params]);

  const gallery = useMemo(() => {
    if (!product) return [] as { type: "image" | "video"; url: string }[];
    const items: { type: "image" | "video"; url: string }[] = [];
    if (product.images?.length) {
      product.images.forEach((url) => {
        if (url) items.push({ type: "image", url });
      });
    }
    if (product.video_url) {
      items.push({ type: "video", url: product.video_url });
    }
    return items;
  }, [product]);

  const mainMedia = gallery[galleryIndex] || gallery[0] || null;

  function changeQty(delta: number) {
    setQty((current) => Math.max(1, current + delta));
  }

  function openCreditFlow() {
    if (!product) return;
    const params = new URLSearchParams({ produit_id: String(product.id) });
    if (boutiqueId) params.set("boutique_id", boutiqueId);
    window.location.href = "/credit-halal?" + params.toString();
  }

  function addProductToCart(product: Product) {
    addToCart({
      productId: String(product.id),
      name: product.name,
      model: product.model || "",
      brand: product.brand || "",
      emoji: product.emoji,
      unitPrice: Number(product.price || 0),
      qty,
      boutiqueId,
    });
    setCartFlash(`${product.name} ajouté au panier`);
    if (typeof window !== "undefined") {
      window.setTimeout(() => setCartFlash(""), 1800);
    }
  }

  if (loading) {
    return (
      <main style={{ minHeight: "100vh", padding: "110px 20px 60px", background: "#020912", color: "#fff" }}>
        <div style={{ maxWidth: 1040, margin: "0 auto" }}>
          <p style={{ color: "#7a9abb" }}>Chargement du produit…</p>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: "100vh", padding: "110px 20px 60px", background: "#020912", color: "#fff" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ marginBottom: 24 }}>
          <Link href="/catalogue" style={{ color: "#00c8ff", textDecoration: "none", fontSize: 14 }}>
            ← Retour au catalogue
          </Link>
        </div>

        {error ? (
          <div style={{ padding: 24, borderRadius: 18, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <p style={{ color: "#f87171" }}>{error}</p>
          </div>
        ) : !product ? (
          <div style={{ padding: 24, borderRadius: 18, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <p style={{ color: "#7a9abb" }}>Produit introuvable.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 0.9fr", gap: 28 }}>
            <section>
              <div
                style={{
                  borderRadius: 24,
                  border: "1px solid rgba(0,160,255,0.12)",
                  overflow: "hidden",
                  marginBottom: 20,
                }}
              >
                <div
                  style={{
                    width: "100%",
                    maxWidth: 560,
                    aspectRatio: "4 / 5",
                    margin: "0 auto",
                    borderRadius: 16,
                    overflow: "hidden",
                    background: "#000",
                    position: "relative",
                  }}
                >
                  {mainMedia ? (
                    mainMedia.type === "video" ? (
                      <ProductVideo src={mainMedia.url} />
                    ) : (
                      <img
                        src={mainMedia.url}
                        alt={product.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                      />
                    )
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        display: "grid",
                        placeItems: "center",
                        background: "rgba(0,0,0,0.35)",
                        color: "#00c8ff",
                        fontSize: 72,
                      }}
                    >
                      {product.emoji || "📱"}
                    </div>
                  )}
                </div>
                {gallery.length > 1 && (
                  <div style={{ padding: 16, display: "flex", gap: 12, overflowX: "auto" }}>
                    {gallery.map((item, index) => (
                      <button
                        key={`${item.type}-${item.url}-${index}`}
                        type="button"
                        onClick={() => setGalleryIndex(index)}
                        style={{
                          minWidth: 96,
                          minHeight: 96,
                          borderRadius: 18,
                          border: index === galleryIndex ? "2px solid #00c8ff" : "1px solid rgba(255,255,255,0.08)",
                          background: "rgba(255,255,255,0.04)",
                          overflow: "hidden",
                          cursor: "pointer",
                          padding: 0,
                        }}
                      >
                        {item.type === "video" ? (
                          <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", background: "#000" }}>
                            <span style={{ color: "#00c8ff", fontSize: 28 }}>▶</span>
                          </div>
                        ) : (
                          <img
                            src={item.url}
                            alt={product.name}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div
                style={{
                  padding: 24,
                  borderRadius: 22,
                  border: "1px solid rgba(0,160,255,0.12)",
                  background: "rgba(7,18,32,0.8)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                  <span
                    style={{
                      fontSize: 12,
                      color: "#00c8ff",
                      letterSpacing: 1.8,
                      textTransform: "uppercase",
                      fontFamily: "DM Mono, monospace",
                    }}
                  >
                    {product.brand || "Marque inconnue"}
                  </span>
                  {product.badge && (
                    <span
                      style={{
                        fontSize: 11,
                        color: "#fff",
                        background: "rgba(0,160,255,0.12)",
                        padding: "4px 9px",
                        borderRadius: 999,
                        textTransform: "uppercase",
                        letterSpacing: 1,
                      }}
                    >
                      {product.badge}
                    </span>
                  )}
                </div>
                <h1 style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "clamp(32px, 4vw, 52px)", margin: 0, lineHeight: 1.05 }}>
                  {product.name}
                </h1>
                {product.model && (
                  <p style={{ color: "#7a9abb", marginTop: 10, fontSize: 14 }}>
                    {product.model}
                  </p>
                )}
                {product.categorie && (
                  <p style={{ marginTop: 8, fontSize: 13, color: "#94b2d3" }}>
                    Statut&nbsp;: {product.categorie}
                  </p>
                )}

                {product.description && (
                  <p style={{ marginTop: 18, color: "#cbd6eb", lineHeight: 1.8, fontSize: 14 }}>
                    {product.description}
                  </p>
                )}

                {product.specs?.length ? (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 10, marginTop: 20 }}>
                    {product.specs.map((item) => (
                      <span
                        key={item}
                        style={{
                          padding: "10px 12px",
                          borderRadius: 12,
                          background: "rgba(255,255,255,0.04)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          color: "#d8e4ff",
                          fontSize: 12,
                          fontFamily: "DM Mono, monospace",
                        }}
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </section>

            <aside>
              <div
                style={{
                  padding: 24,
                  borderRadius: 22,
                  border: "1px solid rgba(0,160,255,0.12)",
                  background: "rgba(7,18,32,0.8)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                  <div>
                    <div style={{ fontSize: 12, color: "#00c8ff", letterSpacing: 1.6, textTransform: "uppercase" }}>
                      Prix unitaire
                    </div>
                    <div style={{ fontSize: 38, fontWeight: 700, color: "#00c8ff" }}>
                      {formatPrice(product.price)}
                    </div>
                    <div style={{ color: "#7a9abb", fontSize: 12 }}>FCFA</div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, marginBottom: 18 }}>
                  <button
                    type="button"
                    onClick={() => changeQty(-1)}
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 14,
                      border: "1px solid rgba(255,255,255,0.1)",
                      background: "rgba(255,255,255,0.04)",
                      color: "#fff",
                      fontSize: 22,
                      cursor: "pointer",
                    }}
                  >
                    −
                  </button>
                  <div style={{ fontSize: 18, fontWeight: 700, minWidth: 40, textAlign: "center" }}>{qty}</div>
                  <button
                    type="button"
                    onClick={() => changeQty(1)}
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 14,
                      border: "1px solid rgba(255,255,255,0.1)",
                      background: "rgba(255,255,255,0.04)",
                      color: "#fff",
                      fontSize: 22,
                      cursor: "pointer",
                    }}
                  >
                    +
                  </button>
                </div>

                <div style={{ marginBottom: 18, color: "#9db7db", fontSize: 13, lineHeight: 1.6 }}>
                  Livraison standard : <strong>{formatPrice(LIVRAISON)} FCFA</strong>
                </div>
                <div style={{ marginBottom: 20, color: "#cfdaf4", fontSize: 15 }}>
                  Total approximatif&nbsp;:
                  <div style={{ marginTop: 8, fontSize: 24, fontWeight: 700, color: "#00e4ff" }}>
                    {formatPrice(product.price * qty + LIVRAISON)} FCFA
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => addProductToCart(product)}
                  style={{
                    width: "100%",
                    padding: 16,
                    marginBottom: 12,
                    borderRadius: 16,
                    border: "1px solid rgba(0,200,255,0.25)",
                    background: "rgba(0,200,255,0.08)",
                    color: "#00c8ff",
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  🛒 Ajouter au panier
                </button>

                <button
                  type="button"
                  onClick={() => setBuyOpen(true)}
                  style={{
                    width: "100%",
                    padding: 16,
                    marginBottom: 12,
                    borderRadius: 16,
                    border: "none",
                    background: "linear-gradient(135deg, #0033cc, #00aaff)",
                    color: "#fff",
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: "pointer",
                    boxShadow: "0 10px 24px rgba(0,120,255,0.24)",
                  }}
                >
                  💳 Acheter maintenant
                </button>

                <button
                  type="button"
                  onClick={openCreditFlow}
                  style={{
                    width: "100%",
                    padding: 16,
                    marginBottom: 12,
                    borderRadius: 16,
                    border: "none",
                    background: "linear-gradient(135deg, #b8860b, #ffd700)",
                    color: "#000",
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  🌙 Achat échelonné
                </button>

                {cartFlash && (
                  <div style={{ marginTop: 12, padding: 12, borderRadius: 14, background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.35)", color: "#9ff0ca", fontSize: 13 }}>
                    {cartFlash}
                  </div>
                )}

                <div style={{ marginTop: 16, padding: 16, borderRadius: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "#7a9abb", fontSize: 13 }}>
                  <p style={{ margin: 0, marginBottom: 8 }}>
                    Pour un achat direct, vous pouvez ajouter un chargeur et un compte iCloud dans la fenêtre suivante.
                  </p>
                  <p style={{ margin: 0 }}>
                    Le paiement échelonné utilise le dossier Halal et conserve la même boutique sélectionnée pour la livraison.
                  </p>
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>

      <BuyFlow product={product} open={buyOpen} initialQty={qty} onClose={() => setBuyOpen(false)} />
    </main>
  );
}
