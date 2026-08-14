"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Order = {
  id: number | string;
  commande_id?: string;
  user_name?: string;
  client_name?: string;
  user_email?: string;
  telephone?: string;
  phone?: string;
  adresse?: string;
  address?: string;
  produit?: string;
  product?: string;
  prix?: number;
  amount?: number;
  total?: number;
  status?: string;
  paiement?: string;
  operator?: string;
  paydunya_status?: string;
  payment_url?: string;
  created_at?: string;
  boutique_id?: string;
  boutique_nom?: string;
  has_icloud?: boolean;
  has_charger?: boolean;
  livraison?: number;
  articles?: string;
  boutiques?: {
    id?: string | number;
    nom?: string;
    name?: string;
    boutique_name?: string;
  } | null;
};

function formatPrice(n: number) {
  return Number(n || 0).toLocaleString("fr-FR");
}

function statusMeta(status?: string) {
  const s = (status || "en_attente").toLowerCase();
  if (["livre", "livré", "delivered"].includes(s))
    return { label: "Livré", color: "#00e676", bg: "rgba(0,230,118,0.15)", border: "rgba(0,230,118,0.3)" };
  if (["en_cours", "processing"].includes(s))
    return { label: "En cours", color: "#00e5ff", bg: "rgba(0,229,255,0.15)", border: "rgba(0,229,255,0.3)" };
  if (["annule", "annulé", "cancelled", "failed"].includes(s))
    return { label: "Annulé", color: "#ff4444", bg: "rgba(255,68,68,0.15)", border: "rgba(255,68,68,0.3)" };
  if (["paye", "paid", "paie", "completed"].includes(s))
    return { label: "Payé", color: "#00e676", bg: "rgba(0,230,118,0.15)", border: "rgba(0,230,118,0.3)" };
  return { label: "En attente", color: "#ff9100", bg: "rgba(255,145,0,0.15)", border: "rgba(255,145,0,0.3)" };
}

export default function AdminCommandesPage() {
  const supabase = useMemo(() => createClient(), []);
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("orders")
      .select(`
        *,
        boutiques: boutique_id (
          id,
          nom,
          name,
          boutique_name
        )
      `)
      .order("created_at", { ascending: false });
    setOrders((data as Order[]) || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }

  async function updateStatus(id: number | string, status: string) {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (!error) {
      showToast("Statut mis à jour ✅");
      load();
    } else {
      showToast("Erreur : " + error.message);
    }
  }

  function exportCSV() {
    if (!orders.length) {
      showToast("Aucune commande à exporter");
      return;
    }
    const headers = ["ID", "Date", "Client", "Téléphone", "Adresse", "Produit", "Paiement", "Montant", "Statut"];
    const rows = orders.map((o) => [
      o.commande_id || o.id,
      o.created_at ? new Date(o.created_at).toLocaleDateString("fr-FR") : "",
      o.user_name || o.client_name || "",
      o.telephone || o.phone || "",
      o.adresse || o.address || "",
      o.produit || o.product || "",
      o.paiement || o.operator || "",
      o.prix || o.amount || o.total || 0,
      o.status || "",
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `commandes-sds-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("✅ Export CSV téléchargé");
  }

  const filtered = orders.filter((o) => {
    const status = (o.status || "en_attente").toLowerCase();
    if (filter !== "all" && status !== filter) return false;
    if (!q.trim()) return true;
    const s = q.toLowerCase();
    return (
      (o.user_name || o.client_name || "").toLowerCase().includes(s) ||
      (o.telephone || o.phone || "").toLowerCase().includes(s) ||
      (o.produit || o.product || "").toLowerCase().includes(s) ||
      String(o.commande_id || o.id).toLowerCase().includes(s)
    );
  });

  const filters = [
    { id: "all", label: "Toutes" },
    { id: "en_attente", label: "En attente" },
    { id: "en_cours", label: "En cours" },
    { id: "livre", label: "Livrées" },
    { id: "annule", label: "Annulées" },
  ];

  const btn = (bg: string, color: string, border: string): React.CSSProperties => ({
    flex: 1,
    minWidth: 80,
    padding: "8px 10px",
    borderRadius: 8,
    fontSize: 11,
    fontWeight: 600,
    cursor: "pointer",
    border: `1px solid ${border}`,
    background: bg,
    color,
  });

  const pill: React.CSSProperties = {
    fontSize: 11,
    padding: "4px 10px",
    borderRadius: 100,
    border: "1px solid rgba(0,180,255,0.25)",
    background: "rgba(0,100,255,0.08)",
    color: "#c8dff5",
  };

  return (
    <div>
      <div
        style={{
          fontFamily: "Rajdhani, sans-serif",
          fontSize: 18,
          fontWeight: 700,
          letterSpacing: 2,
          marginBottom: 14,
        }}
      >
        📦 Toutes les commandes
      </div>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="🔍 Rechercher par nom, téléphone, produit..."
        style={{
          width: "100%",
          background: "rgba(0,100,255,0.06)",
          border: "1px solid rgba(0,180,255,0.18)",
          color: "#fff",
          padding: "11px 16px",
          borderRadius: 10,
          fontSize: 13,
          marginBottom: 14,
          outline: "none",
        }}
      />

      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 8, overflowX: "auto", flex: 1 }}>
          {filters.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              style={{
                padding: "7px 14px",
                borderRadius: 100,
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
                whiteSpace: "nowrap",
                border: filter === f.id ? "none" : "1px solid rgba(0,180,255,0.18)",
                background:
                  filter === f.id
                    ? "linear-gradient(135deg,#0050ff,#00e5ff)"
                    : "rgba(0,100,255,0.04)",
                color: filter === f.id ? "#fff" : "#4a7a9b",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={exportCSV}
          style={{
            background: "linear-gradient(135deg,#004d00,#00c853)",
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
          ⬇️ Export CSV
        </button>
      </div>

      {loading && <div style={{ color: "#4a7a9b", textAlign: "center", padding: 30 }}>Chargement…</div>}

      {!loading && !filtered.length && (
        <div style={{ textAlign: "center", padding: 40, color: "#4a7a9b" }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>📦</div>
          Aucune commande
        </div>
      )}

      {filtered.map((o) => {
        const nom = o.user_name || o.client_name || "—";
        const tel = o.telephone || o.phone || "—";
        const adr = o.adresse || o.address || "—";
        const produit = o.produit || o.product || "—";
        const prix = o.prix || o.amount || o.total || 0;
        const st = statusMeta(o.status);
        const date = o.created_at ? new Date(o.created_at).toLocaleDateString("fr-FR") : "—";
        const boutiqueNom =
          o.boutiques?.nom ||
          o.boutiques?.name ||
          o.boutiques?.boutique_name ||
          o.boutique_nom ||
          o.boutique_id ||
          "SDS PRO (catalogue)";
        const telClean = String(tel).replace(/\D/g, "");
        const wa = `https://wa.me/${telClean}?text=${encodeURIComponent(
          `Bonjour ${nom} 👋\nVotre commande SDS PRO est prête !\n📱 ${produit}\n📍 Livraison à : ${adr}\nMerci de votre confiance !`
        )}`;

        return (
          <div
            key={String(o.id)}
            style={{
              background: "#0a1f35",
              border: "1px solid rgba(0,180,255,0.18)",
              borderRadius: 14,
              padding: 16,
              marginBottom: 12,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ fontSize: 10, color: "#4a7a9b", fontFamily: "DM Mono, monospace" }}>
                #{o.commande_id || o.id} · {date}
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  padding: "3px 10px",
                  borderRadius: 100,
                  color: st.color,
                  background: st.bg,
                  border: `1px solid ${st.border}`,
                  fontFamily: "DM Mono, monospace",
                }}
              >
                {st.label}
              </span>
            </div>

            <Row k="👤 Client" v={nom} />
            <Row k="📞 Tél" v={tel} />
            <Row k="📍 Adresse" v={adr} />
            <Row k="📱 Produit" v={produit} />
            <div style={{ fontSize: 12, color: "#7a9abb", marginBottom: 6 }}>
              Boutique : <strong style={{ color: "#00c8ff" }}>{boutiqueNom}</strong>
            </div>
            <Row k="💳 Paiement" v={o.paiement || o.operator || "PayDunya"} />
            <div style={{ display: "flex", gap: 6, marginBottom: 5, alignItems: "baseline" }}>
              <span style={{ fontSize: 10, color: "#4a7a9b", fontFamily: "DM Mono, monospace", minWidth: 70 }}>
                💰 Montant
              </span>
              <span style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 18, fontWeight: 700, color: "#00e5ff" }}>
                {formatPrice(prix)} FCFA
              </span>
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
              <button type="button" onClick={() => updateStatus(o.id, "livre")} style={btn("rgba(0,230,118,0.15)", "#00e676", "rgba(0,230,118,0.3)")}>
                ✅ Livré
              </button>
              <button type="button" onClick={() => updateStatus(o.id, "en_cours")} style={btn("rgba(0,80,255,0.15)", "#6ab0ff", "rgba(0,80,255,0.3)")}>
                🔄 En cours
              </button>
              <button type="button" onClick={() => updateStatus(o.id, "annule")} style={btn("rgba(255,68,68,0.1)", "#ff4444", "rgba(255,68,68,0.25)")}>
                ❌ Annuler
              </button>
              <button
                type="button"
                onClick={() => window.open(wa, "_blank")}
                style={btn("rgba(37,211,102,0.12)", "#25d366", "rgba(37,211,102,0.3)")}
              >
                💬 WhatsApp
              </button>
            </div>
          </div>
        );
      })}

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

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div style={{ display: "flex", gap: 6, marginBottom: 5, alignItems: "baseline" }}>
      <span style={{ fontSize: 10, color: "#4a7a9b", fontFamily: "DM Mono, monospace", minWidth: 70 }}>{k}</span>
      <span style={{ fontSize: 13, color: "#c8dff5", fontWeight: 500 }}>{v}</span>
    </div>
  );
}
