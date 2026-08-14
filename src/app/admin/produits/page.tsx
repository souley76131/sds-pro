"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Product = {
  id: number;
  nom?: string;
  name?: string;
  modele?: string;
  model?: string;
  marque?: string;
  prix?: number;
  price?: number;
  visible?: boolean;
  badge?: string;
  emoji?: string;
  specs?: string;
  description?: string;
  images?: string[] | string;
  video_url?: string;
  variantes?: any;
  categorie?: string;
  boutique_id?: string | null;
  moderation_status?: "pending" | "approved" | "rejected" | null;
  moderated_note?: string | null;
};

function formatPrice(n: number) {
  return Number(n || 0).toLocaleString("fr-FR");
}

export default function AdminProduitsPage() {
  const supabase = useMemo(() => createClient(), []);
  const [products, setProducts] = useState<Product[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  // form
  const [editId, setEditId] = useState<number | null>(null);
  const [nom, setNom] = useState("");
  const [emoji, setEmoji] = useState("📱");
  const [modele, setModele] = useState("");
  const [marque, setMarque] = useState("Apple");
  const [categorie, setCategorie] = useState("Iphone neuf");
  const [prix, setPrix] = useState("");
  const [badge, setBadge] = useState("");
  const [specs, setSpecs] = useState("");
  const [description, setDescription] = useState("");
  const [imagesText, setImagesText] = useState("");
  const [videoUrl, setVideoUrl] = useState("");

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("products")
      .select("*")
      .order("id", { ascending: false });
    setProducts(data || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleVisible(p: Product) {
    const next = p.visible === false;
    const { error } = await supabase.from("products").update({ visible: next }).eq("id", p.id);
    if (!error) {
      showToast(next ? "Produit activé ✅" : "Produit désactivé 🔴");
      load();
    } else showToast("Erreur : " + error.message);
  }

  async function moderer(p: Product, status: "approved" | "rejected") {
    const note = status === "rejected" ? window.prompt("Motif du refus (optionnel) :") || null : null;
    const { error } = await supabase
      .from("products")
      .update({
        moderation_status: status,
        moderated_at: new Date().toISOString(),
        moderated_note: note,
      })
      .eq("id", p.id);
    if (!error) {
      showToast(status === "approved" ? "✅ Produit approuvé" : "🔴 Produit refusé");
      load();
    } else showToast("Erreur : " + error.message);
  }

  async function deleteProd(p: Product) {
    const label = p.nom || p.name || "ce produit";
    if (!confirm(`Supprimer "${label}" ? Action irréversible.`)) return;
    const { error } = await supabase.from("products").delete().eq("id", p.id);
    if (!error) {
      showToast("🗑️ Produit supprimé");
      load();
    } else showToast("Erreur : " + error.message);
  }

  function openCreate() {
    setEditId(null);
    setNom("");
    setEmoji("📱");
    setModele("");
    setMarque("Apple");
    setCategorie("Iphone neuf");
    setPrix("");
    setBadge("");
    setSpecs("");
    setDescription("");
    setImagesText("");
    setVideoUrl("");
    setErr("");
    setModalOpen(true);
  }

  function openEdit(p: Product) {
    setEditId(p.id);
    setNom(p.nom || p.name || "");
    setEmoji(p.emoji || "📱");
    setModele(p.modele || p.model || "");
    setMarque(p.marque || "Apple");
    setCategorie(p.categorie || "Iphone neuf");
    setPrix(String(p.prix || p.price || ""));
    setBadge(p.badge || "");
    setSpecs(typeof p.specs === "string" ? p.specs : Array.isArray(p.specs) ? (p.specs as any).join(", ") : "");
    setDescription(p.description || "");
    if (Array.isArray(p.images)) setImagesText(p.images.join("\n"));
    else setImagesText(typeof p.images === "string" ? p.images : "");
    setVideoUrl(p.video_url || "");
    setErr("");
    setModalOpen(true);
  }

  async function save() {
    setErr("");
    if (!nom.trim()) {
      setErr("Nom requis");
      return;
    }
    const prixNum = parseInt(prix, 10);
    if (!prixNum || isNaN(prixNum)) {
      setErr("Prix requis");
      return;
    }

    const images = imagesText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    const payload = {
      nom: nom.trim(),
      emoji: emoji.trim() || "📱",
      modele: modele.trim() || null,
      marque: marque.trim() || "Apple",
      categorie: categorie || "Iphone neuf",
      prix: prixNum,
      badge: badge.trim() || null,
      specs: specs.trim() || null,
      description: description.trim() || null,
      images,
      video_url: videoUrl.trim() || null,
      visible: true,
      moderation_status: "approved",
      moderated_at: new Date().toISOString(),
      moderated_note: null,
    };

    setSaving(true);
    let error;
    if (editId) {
      ({ error } = await supabase.from("products").update(payload).eq("id", editId));
    } else {
      ({ error } = await supabase.from("products").insert(payload));
    }
    setSaving(false);

    if (error) {
      setErr(error.message);
      return;
    }
    showToast(editId ? "✅ Produit modifié" : "✅ Produit ajouté");
    setModalOpen(false);
    load();
  }

  const input: React.CSSProperties = {
    width: "100%",
    background: "rgba(0,100,255,0.06)",
    border: "1px solid rgba(0,180,255,0.18)",
    color: "#fff",
    padding: "11px 14px",
    borderRadius: 10,
    fontSize: 13,
    marginBottom: 10,
    outline: "none",
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, gap: 12, flexWrap: "wrap" }}>
        <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 18, fontWeight: 700, letterSpacing: 2 }}>
          🛍️ Catalogue produits
        </div>
        <button
          type="button"
          onClick={openCreate}
          style={{
            background: "linear-gradient(135deg,#0050ff,#00e5ff)",
            color: "#fff",
            border: "none",
            padding: "10px 20px",
            borderRadius: 10,
            fontFamily: "Rajdhani, sans-serif",
            fontWeight: 700,
            fontSize: 13,
            letterSpacing: 1,
            cursor: "pointer",
          }}
        >
          + Ajouter produit
        </button>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16, overflowX: "auto" }}>
        {[
          ["all", "Toutes"],
          ["pending", "En attente"],
          ["approved", "Approuvées"],
          ["rejected", "Refusées"],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id)}
            style={{
              padding: "7px 14px",
              borderRadius: 100,
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
              whiteSpace: "nowrap",
              border: filter === id ? "none" : "1px solid rgba(0,180,255,0.18)",
              background: filter === id ? "linear-gradient(135deg,#0050ff,#00e5ff)" : "rgba(0,100,255,0.04)",
              color: filter === id ? "#fff" : "#4a7a9b",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {loading && <div style={{ color: "#4a7a9b", textAlign: "center", padding: 30 }}>Chargement…</div>}

      {!loading && !products.length && (
        <div style={{ textAlign: "center", padding: 40, color: "#4a7a9b" }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>🛍️</div>
          Aucun produit — clique sur Ajouter
        </div>
      )}

      {products
        .filter((p) => filter === "all" || (p.moderation_status || "approved") === filter)
        .map((p) => {
        const visible = p.visible !== false;
        const title = p.nom || p.name || "—";
        const model = p.modele || p.model || "";
        const price = p.prix || p.price || 0;
        const modStatus = p.moderation_status || "approved";
        const modMeta =
          modStatus === "pending"
            ? { label: "🕓 En attente", color: "#ffb020" }
            : modStatus === "rejected"
            ? { label: "🔴 Refusé", color: "#ff4444" }
            : { label: "✅ Approuvé", color: "#00e676" };

        return (
          <div
            key={p.id}
            style={{
              background: "#0a1f35",
              border: "1px solid rgba(0,180,255,0.18)",
              borderRadius: 14,
              padding: 16,
              marginBottom: 10,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>
                  {p.emoji || "📱"} {title}
                </div>
                <div style={{ fontSize: 11, color: "#4a7a9b", marginTop: 2 }}>
                  {[p.marque, model, p.categorie].filter(Boolean).join(" · ")}
                </div>
              </div>
              <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 16, fontWeight: 700, color: "#00e5ff", whiteSpace: "nowrap" }}>
                {formatPrice(price)} FCFA
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <span
                  style={{
                    fontSize: 11,
                    padding: "3px 10px",
                    borderRadius: 100,
                    color: visible ? "#00e676" : "#ff4444",
                    background: visible ? "rgba(0,230,118,0.15)" : "rgba(255,68,68,0.15)",
                    border: `1px solid ${visible ? "rgba(0,230,118,0.3)" : "rgba(255,68,68,0.3)"}`,
                  }}
                >
                  {visible ? "✅ Actif" : "🔴 Désactivé"}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    padding: "3px 10px",
                    borderRadius: 100,
                    color: modMeta.color,
                    background: `${modMeta.color}22`,
                    border: `1px solid ${modMeta.color}55`,
                  }}
                >
                  {modMeta.label}
                </span>
              </div>

              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                <span style={{ fontSize: 11, color: "#4a7a9b", fontFamily: "DM Mono, monospace" }}>
                  {visible ? "ON" : "OFF"}
                </span>
                <input type="checkbox" checked={visible} onChange={() => toggleVisible(p)} />
              </label>
            </div>

            {p.moderated_note && modStatus === "rejected" && (
              <div style={{ fontSize: 11, color: "#ff8080", marginBottom: 10 }}>Motif : {p.moderated_note}</div>
            )}

            {modStatus !== "approved" && (
              <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <button
                  type="button"
                  onClick={() => moderer(p, "approved")}
                  style={{
                    flex: 1,
                    padding: "8px 10px",
                    borderRadius: 8,
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: "pointer",
                    border: "1px solid rgba(0,230,118,0.3)",
                    background: "rgba(0,230,118,0.1)",
                    color: "#00e676",
                  }}
                >
                  ✅ Approuver
                </button>
                <button
                  type="button"
                  onClick={() => moderer(p, "rejected")}
                  style={{
                    flex: 1,
                    padding: "8px 10px",
                    borderRadius: 8,
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: "pointer",
                    border: "1px solid rgba(255,68,68,0.25)",
                    background: "rgba(255,68,68,0.1)",
                    color: "#ff4444",
                  }}
                >
                  🔴 Refuser
                </button>
              </div>
            )}

            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                onClick={() => openEdit(p)}
                style={{
                  flex: 1,
                  padding: "8px 10px",
                  borderRadius: 8,
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                  border: "1px solid rgba(0,80,255,0.3)",
                  background: "rgba(0,80,255,0.15)",
                  color: "#6ab0ff",
                }}
              >
                ✏️ Modifier
              </button>
              <button
                type="button"
                onClick={() => deleteProd(p)}
                style={{
                  flex: 1,
                  padding: "8px 10px",
                  borderRadius: 8,
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                  border: "1px solid rgba(255,68,68,0.25)",
                  background: "rgba(255,68,68,0.1)",
                  color: "#ff4444",
                }}
              >
                🗑️ Supprimer
              </button>
            </div>
          </div>
        );
      })}

      {/* Modal */}
      {modalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 200,
            background: "rgba(0,0,0,0.88)",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
            padding: 16,
            overflowY: "auto",
          }}
          onClick={(e) => e.target === e.currentTarget && setModalOpen(false)}
        >
          <div
            style={{
              background: "#0a1f35",
              border: "1px solid rgba(0,180,255,0.18)",
              borderRadius: 20,
              width: "100%",
              maxWidth: 500,
              margin: "auto",
              padding: 24,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
              <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 20, fontWeight: 700, color: "#00e5ff" }}>
                {editId ? "Modifier produit" : "Ajouter produit"}
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  border: "1px solid rgba(0,180,255,0.18)",
                  background: "rgba(255,255,255,0.06)",
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 70px", gap: 10 }}>
              <input style={input} placeholder="Nom *" value={nom} onChange={(e) => setNom(e.target.value)} />
              <input style={{ ...input, textAlign: "center" }} placeholder="📱" value={emoji} onChange={(e) => setEmoji(e.target.value)} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <input style={input} placeholder="Modèle" value={modele} onChange={(e) => setModele(e.target.value)} />
              <input style={input} type="number" placeholder="Prix FCFA *" value={prix} onChange={(e) => setPrix(e.target.value)} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <input style={input} placeholder="Marque" value={marque} onChange={(e) => setMarque(e.target.value)} />
              <select style={input} value={categorie} onChange={(e) => setCategorie(e.target.value)}>
                <option value="Iphone neuf">iPhone Neuf</option>
                <option value="iphone recond">iPhone Reconditionné</option>
                <option value="samsung">Samsung</option>
                <option value="infinix">Infinix</option>
                <option value="tecno">Tecno</option>
              </select>
            </div>
            <input style={input} placeholder="Badge (NOUVEAU / PROMO)" value={badge} onChange={(e) => setBadge(e.target.value)} />
            <input style={input} placeholder="Specs (128GB, 5G…)" value={specs} onChange={(e) => setSpecs(e.target.value)} />
            <textarea
              style={{ ...input, minHeight: 70, resize: "vertical" }}
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <textarea
              style={{ ...input, minHeight: 70, resize: "vertical" }}
              placeholder="URLs images (une par ligne)"
              value={imagesText}
              onChange={(e) => setImagesText(e.target.value)}
            />
            <input style={input} placeholder="URL vidéo (YouTube ou mp4)" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} />

            {err && <div style={{ color: "#ff6b6b", fontSize: 12, marginBottom: 10 }}>{err}</div>}

            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="button"
                disabled={saving}
                onClick={save}
                style={{
                  flex: 1,
                  background: "linear-gradient(135deg,#0050ff,#00e5ff)",
                  color: "#fff",
                  border: "none",
                  padding: 13,
                  borderRadius: 10,
                  fontFamily: "Rajdhani, sans-serif",
                  fontWeight: 700,
                  cursor: "pointer",
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving ? "…" : "ENREGISTRER"}
              </button>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                style={{
                  padding: "13px 20px",
                  borderRadius: 10,
                  border: "1px solid rgba(0,180,255,0.18)",
                  background: "transparent",
                  color: "#4a7a9b",
                  cursor: "pointer",
                }}
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: 30,
            left: "50%",
            transform: "translateX(-50%)",
            background: "#0a1f35",
            border: "1px solid rgba(0,180,255,0.18)",
            borderRadius: 10,
            padding: "12px 24px",
            fontSize: 13,
            fontWeight: 600,
            color: "#00e5ff",
            zIndex: 9999,
          }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}
