"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Order = {
  id: number | string;
  commande_id?: string;
  produit?: string;
  product?: string;
  prix?: number;
  amount?: number;
  total?: number;
  status?: string;
  paydunya_status?: string;
  payment_url?: string;
  created_at?: string;
  telephone?: string;
  phone?: string;
};

function formatPrice(n: number) {
  return Number(n || 0).toLocaleString("fr-FR");
}

function statusInfo(o: Order) {
  const s = (o.status || o.paydunya_status || "en_attente").toLowerCase();
  if (["livre", "livré", "delivered"].includes(s))
    return { label: "Livrée", color: "#34d399", bg: "rgba(52,211,153,0.12)" };
  if (["paye", "paid", "paie", "completed"].includes(s))
    return { label: "Payée", color: "#00c8ff", bg: "rgba(0,200,255,0.12)" };
  if (["en_cours", "processing"].includes(s))
    return { label: "En préparation", color: "#60a5fa", bg: "rgba(96,165,250,0.12)" };
  if (["annule", "annulé", "cancelled", "failed"].includes(s))
    return { label: "Annulée", color: "#ff6b6b", bg: "rgba(255,80,80,0.12)" };
  return { label: "En attente", color: "#ffb347", bg: "rgba(255,180,0,0.12)" };
}

export default function MesCommandesPage() {
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        await loadOrders(session.user.id, session.user.email || "");
      } else {
        setLoading(false);
      }
    })();
  }, [supabase]);

  async function loadOrders(userId: string, userEmail: string) {
    setLoading(true);
    setError("");
    try {
      let { data, error: err } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if ((!data || !data.length) && userEmail) {
        const res2 = await supabase
          .from("orders")
          .select("*")
          .eq("user_email", userEmail)
          .order("created_at", { ascending: false });
        data = res2.data;
        err = res2.error;
      }

      if (err) throw err;
      setOrders(data || []);
    } catch (e: any) {
      setError(e.message || "Impossible de charger les commandes");
    } finally {
      setLoading(false);
    }
  }

  async function login() {
    setError("");
    setAuthLoading(true);
    try {
      const { data, error: err } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (err) throw err;
      setUser(data.user);
      await loadOrders(data.user.id, data.user.email || "");
    } catch (e: any) {
      setError(e.message?.includes("Invalid") ? "Email ou mot de passe incorrect." : e.message);
    } finally {
      setAuthLoading(false);
    }
  }

  const input: React.CSSProperties = {
    width: "100%",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 9,
    padding: "12px 14px",
    color: "#fff",
    fontSize: 13,
    marginBottom: 10,
    outline: "none",
  };

  return (
    <main
      style={{
        paddingTop: 90,
        paddingBottom: 100,
        maxWidth: 720,
        margin: "0 auto",
        paddingLeft: 16,
        paddingRight: 16,
        minHeight: "100vh",
      }}
    >
      <div style={{ fontFamily: "DM Mono, monospace", fontSize: 10, letterSpacing: 2, color: "#00c8ff", marginBottom: 8 }}>
        {"// MES COMMANDES"}
      </div>
      <h1 style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 28, fontWeight: 700, marginBottom: 20 }}>
        Historique
      </h1>

      {error && (
        <div style={{ color: "#f87171", fontSize: 13, marginBottom: 12 }}>{error}</div>
      )}

      {!user && (
        <div
          style={{
            padding: 16,
            borderRadius: 14,
            border: "1px solid rgba(0,200,255,0.2)",
            background: "rgba(0,200,255,0.04)",
            marginBottom: 20,
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 12, color: "#00c8ff" }}>
            🔐 Connectez-vous pour voir vos commandes
          </div>
          <input
            style={input}
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            style={input}
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            disabled={authLoading}
            onClick={login}
            style={{
              width: "100%",
              padding: 13,
              borderRadius: 10,
              border: "none",
              background: "linear-gradient(135deg,#0033cc,#00aaff)",
              color: "#fff",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {authLoading ? "…" : "SE CONNECTER →"}
          </button>
          <div style={{ marginTop: 12, textAlign: "center" }}>
            <Link href="/connexion" style={{ color: "#7a9abb", fontSize: 13 }}>
              Créer un compte
            </Link>
          </div>
        </div>
      )}

      {user && loading && (
        <div style={{ color: "#7a9abb", textAlign: "center", padding: 40 }}>Chargement…</div>
      )}

      {user && !loading && !orders.length && (
        <div style={{ textAlign: "center", padding: "48px 16px", color: "#7a9abb" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
          <div style={{ marginBottom: 16 }}>Aucune commande pour le moment</div>
          <Link
            href="/catalogue"
            style={{
              display: "inline-block",
              padding: "12px 20px",
              borderRadius: 10,
              background: "linear-gradient(135deg,#0033cc,#00aaff)",
              color: "#fff",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            Voir le catalogue →
          </Link>
        </div>
      )}

      {user &&
        orders.map((o) => {
          const st = statusInfo(o);
          const montant = o.prix || o.amount || o.total || 0;
          const titre = o.produit || o.product || "Commande";
          const date = o.created_at
            ? new Date(o.created_at).toLocaleDateString("fr-FR", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
            : "—";
          const pending =
            st.label === "En attente" &&
            o.payment_url &&
            String(o.payment_url).startsWith("http");

          return (
            <div
              key={String(o.id)}
              style={{
                background: "rgba(7,24,40,0.58)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                border: "1px solid rgba(0,180,255,0.22)",
                borderRadius: 16,
                padding: 16,
                marginBottom: 12,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 11, color: "#7a9abb", fontFamily: "DM Mono, monospace" }}>
                    {o.commande_id || `#${o.id}`} · {date}
                  </div>
                  <div style={{ fontWeight: 700, marginTop: 4 }}>{titre}</div>
                </div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "4px 10px",
                    borderRadius: 100,
                    color: st.color,
                    background: st.bg,
                    height: "fit-content",
                    whiteSpace: "nowrap",
                  }}
                >
                  {st.label}
                </span>
              </div>

              <div
                style={{
                  fontFamily: "Rajdhani, sans-serif",
                  fontSize: 22,
                  fontWeight: 700,
                  color: "#00c8ff",
                  marginBottom: pending ? 12 : 0,
                }}
              >
                {formatPrice(montant)} <small style={{ fontSize: 11, color: "#7a9abb" }}>FCFA</small>
              </div>

              {pending && (
                <a
                  href={o.payment_url}
                  style={{
                    display: "block",
                    textAlign: "center",
                    padding: 12,
                    borderRadius: 10,
                    background: "linear-gradient(135deg,#0033cc,#00aaff)",
                    color: "#fff",
                    fontWeight: 700,
                    textDecoration: "none",
                    fontFamily: "Rajdhani, sans-serif",
                    letterSpacing: 1,
                  }}
                >
                  💳 Continuer le paiement →
                </a>
              )}
            </div>
          );
        })}
    </main>
  );
}
