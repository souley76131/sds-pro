"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

function formatPrice(n: number) {
  return Number(n || 0).toLocaleString("fr-FR");
}

export default function AdminDashboardPage() {
  const supabase = createClient();
  const [stats, setStats] = useState({
    orders: 0,
    clients: 0,
    revenue: 0,
    products: 0,
    monthOrders: 0,
    monthRevenue: 0,
  });
  const [recent, setRecent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const now = new Date();
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const [ordersRes, productsRes, monthRes] = await Promise.all([
        supabase.from("orders").select("*"),
        supabase.from("products").select("id,visible"),
        supabase.from("orders").select("*").gte("created_at", firstOfMonth),
      ]);

      const orders = ordersRes.data || [];
      const products = productsRes.data || [];
      const monthOrders = monthRes.data || [];

      const emails = [...new Set(orders.map((o: any) => o.user_email).filter(Boolean))];
      const total = orders.reduce((s: number, o: any) => s + (o.prix || o.price || o.total || o.amount || 0), 0);
      const monthRev = monthOrders.reduce((s: number, o: any) => s + (o.prix || o.price || o.total || o.amount || 0), 0);

      setStats({
        orders: orders.length,
        clients: emails.length,
        revenue: total,
        products: products.filter((p: any) => p.visible !== false).length,
        monthOrders: monthOrders.length,
        monthRevenue: monthRev,
      });

      setRecent(
        [...orders]
          .sort((a: any, b: any) => +new Date(b.created_at) - +new Date(a.created_at))
          .slice(0, 5)
      );
      setLoading(false);
    })();
  }, [supabase]);

  const card = (num: string, label: string, sub?: string) => (
    <div
      style={{
        background: "#0a1f35",
        border: "1px solid rgba(0,180,255,0.18)",
        borderRadius: 14,
        padding: "18px 16px",
        textAlign: "center",
      }}
    >
      <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 28, fontWeight: 700, color: "#00e5ff" }}>
        {num}
      </div>
      <div style={{ fontSize: 11, color: "#4a7a9b", marginTop: 4, fontFamily: "DM Mono, monospace", letterSpacing: 1 }}>
        {label}
      </div>
      {sub && <div style={{ fontSize: 10, color: "#00e676", marginTop: 2 }}>{sub}</div>}
    </div>
  );

  if (loading) return <div style={{ color: "#4a7a9b" }}>Chargement…</div>;

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
        {card(String(stats.orders), "COMMANDES", `${stats.monthOrders} ce mois`)}
        {card(String(stats.clients), "CLIENTS")}
        {card(formatPrice(stats.revenue), "FCFA TOTAL", `${formatPrice(stats.monthRevenue)} ce mois`)}
        {card(String(stats.products), "PRODUITS ACTIFS")}
      </div>

      <div
        style={{
          fontFamily: "Rajdhani, sans-serif",
          fontSize: 18,
          fontWeight: 700,
          letterSpacing: 2,
          marginBottom: 14,
        }}
      >
        📦 Dernières commandes
      </div>

      {!recent.length && (
        <div style={{ color: "#4a7a9b", textAlign: "center", padding: 40 }}>Aucune commande</div>
      )}

      {recent.map((o) => (
        <div
          key={o.id}
          style={{
            background: "#0a1f35",
            border: "1px solid rgba(0,180,255,0.18)",
            borderRadius: 14,
            padding: 16,
            marginBottom: 10,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 10, color: "#4a7a9b", fontFamily: "DM Mono, monospace" }}>
              #{o.commande_id || o.id}
            </span>
            <span style={{ fontSize: 11, color: "#ff9100" }}>{o.status || "en_attente"}</span>
          </div>
          <div style={{ fontSize: 14 }}>{o.user_name || o.client_name || "—"}</div>
          <div style={{ fontSize: 13, color: "#c8dff5", marginTop: 4 }}>
            {o.produit || o.product || "—"}
          </div>
          <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 18, fontWeight: 700, color: "#00e5ff", marginTop: 6 }}>
            {formatPrice(o.prix || o.amount || o.total || 0)} FCFA
          </div>
        </div>
      ))}
    </div>
  );
}
