"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Profile = {
  id: string;
  full_name?: string;
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  created_at?: string;
};

type Order = {
  id: number | string;
  produit?: string;
  product?: string;
  prix?: number;
  amount?: number;
  total?: number;
  status?: string;
  created_at?: string;
  adresse?: string;
  address?: string;
};

function formatPrice(n: number) {
  return Number(n || 0).toLocaleString("fr-FR");
}

export default function AdminClientsPage() {
  const supabase = useMemo(() => createClient(), []);
  const [clients, setClients] = useState<Profile[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [ordersByUser, setOrdersByUser] = useState<Record<string, Order[]>>({});
  const [toast, setToast] = useState("");

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("profiles").select("*").order("id");
    setClients(data || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleOrders(userId: string) {
    if (openId === userId) {
      setOpenId(null);
      return;
    }
    setOpenId(userId);
    if (ordersByUser[userId]) return;

    const { data } = await supabase
      .from("orders")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    setOrdersByUser((prev) => ({ ...prev, [userId]: data || [] }));
  }

  async function deleteClient(p: Profile) {
    const label = p.email || p.full_name || p.name || "ce client";
    if (!confirm(`Supprimer le client "${label}" ? Ses commandes seront conservées.`)) return;

    // Suppression profil (si policy admin le permet)
    const { error } = await supabase.from("profiles").delete().eq("id", p.id);
    if (error) {
      showToast("Erreur : " + error.message);
      return;
    }
    showToast("✅ Client retiré de la liste");
    load();
  }

  const filtered = clients.filter((p) => {
    if (!q.trim()) return true;
    const s = q.toLowerCase();
    return (
      (p.full_name || p.name || "").toLowerCase().includes(s) ||
      (p.email || "").toLowerCase().includes(s) ||
      (p.phone || "").toLowerCase().includes(s)
    );
  });

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
        👥 Clients inscrits
      </div>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="🔍 Rechercher un client..."
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

      {loading && <div style={{ color: "#4a7a9b", textAlign: "center", padding: 30 }}>Chargement…</div>}

      {!loading && !filtered.length && (
        <div style={{ textAlign: "center", padding: 40, color: "#4a7a9b" }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>👥</div>
          Aucun client
        </div>
      )}

      {filtered.map((p) => {
        const name = p.full_name || p.name || "Client";
        const initiale = name[0]?.toUpperCase() || "?";
        const isOpen = openId === p.id;
        const orders = ordersByUser[p.id] || [];
        const telClean = String(p.phone || "").replace(/\D/g, "");
        const msgWA = encodeURIComponent(
          `Bonjour ${name}, nous avons bien reçu votre commande sur SDS Pro Tech. Pourriez-vous confirmer votre adresse de livraison ? Merci 🙏`
        );

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
            <div
              style={{ display: "flex", alignItems: "center", gap: 14, cursor: "pointer" }}
              onClick={() => toggleOrders(p.id)}
            >
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg,#0050ff,#00e5ff)",
                  display: "grid",
                  placeItems: "center",
                  fontFamily: "Rajdhani, sans-serif",
                  fontSize: 18,
                  fontWeight: 700,
                  color: "#fff",
                  flexShrink: 0,
                }}
              >
                {initiale}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{name}</div>
                <div style={{ fontSize: 11, color: "#4a7a9b", marginTop: 2 }}>
                  {p.email || p.phone || "—"}
                </div>
                <div style={{ fontSize: 10, color: "#4a7a9b", fontFamily: "DM Mono, monospace", marginTop: 3 }}>
                  ID: {p.id?.slice?.(0, 8)}… · Cliquer pour voir commandes
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                <span
                  style={{
                    fontSize: 10,
                    padding: "3px 10px",
                    borderRadius: 100,
                    color: p.role === "admin" ? "#00e5ff" : "#00e676",
                    background: p.role === "admin" ? "rgba(0,229,255,0.15)" : "rgba(0,230,118,0.15)",
                    border: `1px solid ${p.role === "admin" ? "rgba(0,229,255,0.3)" : "rgba(0,230,118,0.3)"}`,
                  }}
                >
                  {p.role === "admin" ? "ADMIN" : "CLIENT"}
                </span>
                {p.role !== "admin" && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteClient(p);
                    }}
                    style={{
                      fontSize: 10,
                      padding: "4px 10px",
                      borderRadius: 8,
                      border: "1px solid rgba(255,68,68,0.25)",
                      background: "rgba(255,68,68,0.1)",
                      color: "#ff4444",
                      cursor: "pointer",
                    }}
                  >
                    🗑 Suppr.
                  </button>
                )}
              </div>
            </div>

            {isOpen && (
              <div style={{ marginTop: 12, borderTop: "1px solid rgba(0,180,255,0.18)", paddingTop: 12 }}>
                <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                  {telClean && (
                    <a
                      href={`https://wa.me/221${telClean.slice(-9)}?text=${msgWA}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        flex: 1,
                        minWidth: 120,
                        textAlign: "center",
                        padding: "8px 12px",
                        background: "rgba(37,211,102,0.15)",
                        border: "1px solid rgba(37,211,102,0.35)",
                        borderRadius: 8,
                        color: "#25D366",
                        fontSize: 12,
                        fontWeight: 700,
                        textDecoration: "none",
                      }}
                    >
                      💬 WhatsApp
                    </a>
                  )}
                  {p.email && (
                    <a
                      href={`mailto:${p.email}?subject=${encodeURIComponent(
                        "Confirmation adresse - SDS Pro Tech"
                      )}`}
                      style={{
                        flex: 1,
                        minWidth: 120,
                        textAlign: "center",
                        padding: "8px 12px",
                        background: "rgba(0,150,255,0.12)",
                        border: "1px solid rgba(0,150,255,0.3)",
                        borderRadius: 8,
                        color: "#00aaff",
                        fontSize: 12,
                        fontWeight: 700,
                        textDecoration: "none",
                      }}
                    >
                      ✉️ Email
                    </a>
                  )}
                </div>

                {!orders.length && (
                  <div style={{ color: "#4a7a9b", fontSize: 12, padding: "8px 0" }}>Aucune commande</div>
                )}

                {orders.map((o) => {
                  const prix = o.prix || o.amount || o.total || 0;
                  const status = o.status || "en_attente";
                  const adr = o.adresse || o.address;
                  return (
                    <div
                      key={String(o.id)}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "8px 0",
                        borderBottom: "1px solid rgba(0,180,255,0.12)",
                        gap: 10,
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 12, color: "#c8dff5" }}>{o.produit || o.product || "—"}</div>
                        <div style={{ fontSize: 10, color: "#4a7a9b", fontFamily: "DM Mono, monospace" }}>
                          {o.created_at ? new Date(o.created_at).toLocaleDateString("fr-FR") : ""}
                        </div>
                        {adr && adr !== "—" ? (
                          <div style={{ fontSize: 10, color: "#00e676", marginTop: 3 }}>📍 {adr}</div>
                        ) : (
                          <div style={{ fontSize: 10, color: "#ffa040", marginTop: 3 }}>⚠️ Adresse non confirmée</div>
                        )}
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 14, fontWeight: 700, color: "#00e5ff" }}>
                          {formatPrice(prix)} FCFA
                        </div>
                        <div style={{ fontSize: 10, color: "#4a7a9b", marginTop: 2 }}>{status}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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
