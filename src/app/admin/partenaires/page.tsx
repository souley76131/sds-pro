"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Boutique = {
  id: string;
  nom?: string;
  name?: string;
  code?: string;
  telephone?: string;
  phone?: string;
  email?: string;
  adresse?: string;
  address?: string;
  statut?: string;
  status?: string;
  owner_id?: string;
  created_at?: string;
  commission?: number;
  hero_videos?: string[] | string | null;
};

type Order = {
  id: number | string;
  commande_id?: string;
  prix?: number;
  amount?: number;
  total?: number;
  status?: string;
  created_at?: string;
  produit?: string;
  product?: string;
  boutique_id?: string;
};

function formatPrice(n: number) {
  return Number(n || 0).toLocaleString("fr-FR");
}

function statusMeta(s?: string) {
  const v = (s || "en_attente").toLowerCase();
  if (["valide", "validé", "approved", "actif", "active"].includes(v))
    return { label: "Validée", color: "#00e676" };
  if (["refuse", "refusé", "rejected", "suspendu"].includes(v))
    return { label: "Refusée / Suspendue", color: "#ff4444" };
  return { label: "En attente", color: "#ff9100" };
}

export default function AdminPartenairesPage() {
  const supabase = useMemo(() => createClient(), []);
  const [rows, setRows] = useState<Boutique[]>([]);
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [selected, setSelected] = useState<Boutique | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [heroVideos, setHeroVideos] = useState<string[]>([]);
  const [newVideoUrl, setNewVideoUrl] = useState("");
  const [videoMsg, setVideoMsg] = useState("");

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }

  async function load() {
    setLoading(true);
    const { data, error } = await supabase.from("boutiques").select("*").order("created_at", { ascending: false });
    if (error) showToast("Erreur : " + error.message);
    setRows(data || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function setStatut(id: string, statut: string) {
    const { error } = await supabase.from("boutiques").update({ statut, status: statut }).eq("id", id);
    if (error) {
      showToast("Erreur : " + error.message);
      return;
    }
    showToast(
      statut === "valide" ? "✅ Boutique validée" : statut === "refuse" ? "❌ Boutique refusée" : "Statut mis à jour"
    );
    load();
  }

  async function openDetail(b: Boutique) {
    setSelected(b);
    setOrdersLoading(true);
    
    // Load hero videos
    let list: string[] = [];
    if (b.hero_videos) {
      if (Array.isArray(b.hero_videos)) {
        list = b.hero_videos;
      } else if (typeof b.hero_videos === "string") {
        try {
          list = JSON.parse(b.hero_videos || "[]");
        } catch {
          list = [];
        }
      }
    }
    setHeroVideos(list.filter(Boolean));
    
    const { data } = await supabase
      .from("orders")
      .select("*")
      .eq("boutique_id", b.id)
      .order("created_at", { ascending: false });
    setOrders(data || []);
    setOrdersLoading(false);
  }

  async function saveVideos(next: string[]) {
    if (!selected?.id) return;
    setVideoMsg("");
    const { error } = await supabase
      .from("boutiques")
      .update({ hero_videos: next })
      .eq("id", selected.id);
    if (error) {
      setVideoMsg("Erreur : " + error.message);
      return;
    }
    setHeroVideos(next);
    setVideoMsg("✓ Vidéos enregistrées");
    setTimeout(() => setVideoMsg(""), 3000);
  }

  async function addVideo() {
    const url = newVideoUrl.trim();
    if (!url) {
      setVideoMsg("URL requise");
      return;
    }
    if (!/^https?:\/\//i.test(url)) {
      setVideoMsg("URL invalide (doit commencer par http:// ou https://)");
      return;
    }
    await saveVideos([...heroVideos, url]);
    setNewVideoUrl("");
  }

  async function removeVideo(index: number) {
    await saveVideos(heroVideos.filter((_, i) => i !== index));
  }

  const filtered = rows.filter((b) => {
    const st = (b.statut || b.status || "en_attente").toLowerCase();
    if (filter === "valide" && !["valide", "validé", "approved", "actif", "active"].includes(st)) return false;
    if (filter === "en_attente" && !["en_attente", "pending", "pending_validation"].includes(st)) return false;
    if (filter === "refuse" && !["refuse", "refusé", "rejected", "suspendu"].includes(st)) return false;
    if (!q.trim()) return true;
    const s = q.toLowerCase();
    return (
      (b.nom || b.name || "").toLowerCase().includes(s) ||
      (b.code || "").toLowerCase().includes(s) ||
      (b.telephone || b.phone || "").toLowerCase().includes(s) ||
      (b.email || "").toLowerCase().includes(s) ||
      String(b.id).toLowerCase().includes(s)
    );
  });

  const caBoutique = orders.reduce((s, o) => s + (o.prix || o.amount || o.total || 0), 0);

  return (
    <div>
      <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 18, fontWeight: 700, letterSpacing: 2, marginBottom: 14 }}>
        🏪 Partenaires / Boutiques
      </div>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="🔍 Nom, code, téléphone, email…"
        style={{
          width: "100%",
          background: "rgba(0,100,255,0.06)",
          border: "1px solid rgba(0,180,255,0.18)",
          color: "#fff",
          padding: "11px 16px",
          borderRadius: 10,
          fontSize: 13,
          marginBottom: 12,
          outline: "none",
        }}
      />

      <div style={{ display: "flex", gap: 8, marginBottom: 16, overflowX: "auto" }}>
        {[
          ["all", "Toutes"],
          ["en_attente", "En attente"],
          ["valide", "Validées"],
          ["refuse", "Refusées"],
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

      {!loading && !filtered.length && (
        <div style={{ textAlign: "center", padding: 40, color: "#4a7a9b" }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>🏪</div>
          Aucune boutique
        </div>
      )}

      {filtered.map((b) => {
        const st = statusMeta(b.statut || b.status);
        const nom = b.nom || b.name || "Boutique";
        const tel = b.telephone || b.phone || "—";
        const date = b.created_at ? new Date(b.created_at).toLocaleDateString("fr-FR") : "—";

        return (
          <div
            key={b.id}
            style={{
              background: "#0a1f35",
              border: "1px solid rgba(0,180,255,0.18)",
              borderRadius: 14,
              padding: 16,
              marginBottom: 12,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 8 }}>
              <div style={{ fontSize: 10, color: "#4a7a9b", fontFamily: "DM Mono, monospace" }}>
                {b.code || b.id} · {date}
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: st.color }}>{st.label}</span>
            </div>

            <div style={{ fontWeight: 700, marginBottom: 4 }}>{nom}</div>
            <div style={{ fontSize: 13, color: "#c8dff5", marginBottom: 2 }}>📞 {tel}</div>
            {b.email && <div style={{ fontSize: 13, color: "#c8dff5", marginBottom: 2 }}>📧 {b.email}</div>}
            {(b.adresse || b.address) && (
              <div style={{ fontSize: 13, color: "#c8dff5", marginBottom: 2 }}>📍 {b.adresse || b.address}</div>
            )}

            <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
              <Btn onClick={() => openDetail(b)} color="#6ab0ff">
                👁 Détail / CA
              </Btn>
              <Btn onClick={() => setStatut(b.id, "valide")} color="#00e676">
                ✅ Valider
              </Btn>
              <Btn onClick={() => setStatut(b.id, "refuse")} color="#ff4444">
                ❌ Refuser
              </Btn>
              {tel !== "—" && (
                <Btn
                  onClick={() =>
                    window.open(
                      `https://wa.me/${String(tel).replace(/\D/g, "")}?text=${encodeURIComponent(
                        `Bonjour, SDS PRO concernant votre boutique partenaire "${nom}".`
                      )}`,
                      "_blank"
                    )
                  }
                  color="#25d366"
                >
                  💬 WA
                </Btn>
              )}
            </div>
          </div>
        );
      })}

      {/* Modal détail boutique */}
      {selected && (
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
          onClick={(e) => e.target === e.currentTarget && setSelected(null)}
        >
          <div
            style={{
              background: "#0a1f35",
              border: "1px solid rgba(0,180,255,0.18)",
              borderRadius: 18,
              width: "100%",
              maxWidth: 520,
              margin: "auto",
              padding: 20,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
              <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 18, fontWeight: 700, color: "#00e5ff" }}>
                {selected.nom || selected.name || "Boutique"}
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
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

            <Line k="ID" v={selected.id} />
            <Line k="Code" v={selected.code || "—"} />
            <Line k="Tél" v={selected.telephone || selected.phone || "—"} />
            <Line k="Email" v={selected.email || "—"} />
            <Line k="Adresse" v={selected.adresse || selected.address || "—"} />
            <Line k="Statut" v={statusMeta(selected.statut || selected.status).label} />

            <div
              style={{
                marginTop: 14,
                marginBottom: 10,
                padding: 12,
                borderRadius: 12,
                background: "rgba(0,200,255,0.08)",
                border: "1px solid rgba(0,200,255,0.2)",
              }}
            >
              <div style={{ fontSize: 10, color: "#4a7a9b", fontFamily: "DM Mono, monospace" }}>CA BOUTIQUE</div>
              <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 24, fontWeight: 700, color: "#00e5ff" }}>
                {formatPrice(caBoutique)} FCFA
              </div>
              <div style={{ fontSize: 12, color: "#7a9abb" }}>{orders.length} commande(s)</div>
            </div>

            <div style={{ marginTop: 18, marginBottom: 14, padding: 12, borderRadius: 12, background: "rgba(0,150,150,0.08)", border: "1px solid rgba(0,200,200,0.2)" }}>
              <div style={{ fontSize: 11, color: "#4a7a9b", fontFamily: "DM Mono, monospace", marginBottom: 8, fontWeight: 600 }}>
                📹 VIDÉOS DU BANDEAU
              </div>
              
              {heroVideos.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  {heroVideos.map((url, i) => (
                    <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6, padding: 6, background: "rgba(0,0,0,0.2)", borderRadius: 6 }}>
                      <span style={{ flex: 1, fontSize: 11, color: "#c8dff5", wordBreak: "break-all", fontFamily: "monospace" }}>
                        {i + 1}. {url.length > 40 ? url.substring(0, 37) + "…" : url}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeVideo(i)}
                        style={{
                          padding: "3px 8px",
                          borderRadius: 4,
                          border: "1px solid rgba(248,113,113,0.3)",
                          background: "rgba(248,113,113,0.08)",
                          color: "#f87171",
                          fontSize: 10,
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        Supprimer
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                <input
                  type="text"
                  value={newVideoUrl}
                  onChange={(e) => setNewVideoUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addVideo()}
                  placeholder="https://.../video.mp4"
                  style={{
                    flex: 1,
                    padding: "8px 10px",
                    borderRadius: 6,
                    border: "1px solid rgba(0,180,255,0.18)",
                    background: "rgba(7,24,40,0.6)",
                    color: "#fff",
                    fontSize: 12,
                    fontFamily: "monospace",
                  }}
                />
                <button
                  type="button"
                  onClick={addVideo}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 6,
                    border: "none",
                    background: "linear-gradient(135deg, #0055ff, #00c8ff)",
                    color: "#fff",
                    fontWeight: 600,
                    fontSize: 11,
                    cursor: "pointer",
                  }}
                >
                  Ajouter
                </button>
              </div>

              {videoMsg && (
                <div
                  style={{
                    padding: 8,
                    borderRadius: 6,
                    background: videoMsg.includes("Erreur") ? "rgba(248,113,113,0.12)" : "rgba(52,211,153,0.12)",
                    border: videoMsg.includes("Erreur") ? "1px solid rgba(248,113,113,0.25)" : "1px solid rgba(52,211,153,0.25)",
                    color: videoMsg.includes("Erreur") ? "#f87171" : "#34d399",
                    fontSize: 11,
                  }}
                >
                  {videoMsg}
                </div>
              )}
            </div>

            <div style={{ fontSize: 11, color: "#4a7a9b", fontFamily: "DM Mono, monospace", marginBottom: 8 }}>
              COMMANDES LIÉES
            </div>

            {ordersLoading && <div style={{ color: "#4a7a9b" }}>Chargement…</div>}
            {!ordersLoading && !orders.length && (
              <div style={{ color: "#4a7a9b", fontSize: 13 }}>Aucune commande pour cette boutique</div>
            )}

            {orders.slice(0, 20).map((o) => (
              <div
                key={String(o.id)}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 10,
                  padding: "8px 0",
                  borderBottom: "1px solid rgba(0,180,255,0.12)",
                  fontSize: 12,
                }}
              >
                <div>
                  <div style={{ color: "#c8dff5" }}>{o.produit || o.product || o.commande_id || o.id}</div>
                  <div style={{ color: "#4a7a9b", fontSize: 10 }}>
                    {o.created_at ? new Date(o.created_at).toLocaleDateString("fr-FR") : ""} · {o.status || "—"}
                  </div>
                </div>
                <div style={{ color: "#00e5ff", fontWeight: 700 }}>
                  {formatPrice(o.prix || o.amount || o.total || 0)}
                </div>
              </div>
            ))}
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

function Line({ k, v }: { k: string; v: string }) {
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 6, fontSize: 13 }}>
      <span style={{ minWidth: 70, color: "#4a7a9b", fontFamily: "DM Mono, monospace", fontSize: 10 }}>{k}</span>
      <span style={{ color: "#c8dff5" }}>{v}</span>
    </div>
  );
}

function Btn({ children, onClick, color }: { children: React.ReactNode; onClick: () => void; color: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1,
        minWidth: 90,
        padding: "9px 10px",
        borderRadius: 8,
        fontSize: 11,
        fontWeight: 700,
        cursor: "pointer",
        border: `1px solid ${color}55`,
        background: `${color}22`,
        color,
      }}
    >
      {children}
    </button>
  );
}
