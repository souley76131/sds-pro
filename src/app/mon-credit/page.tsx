"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const FRAIS_MDM = 10000;
const BACKEND = "https://sdsprotech-backend.pages.dev";

export default function MonCreditPage() {
  const [user, setUser] = useState<any>(null);
  const [dossier, setDossier] = useState<any>(null);
  const [commandes, setCommandes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function payerVersement(numero: number) {
    if (!dossier?.dossier_id) return;
    const boutiqueId =
      typeof window !== "undefined"
        ? window.sessionStorage.getItem("sds_boutique_id") || null
        : null;
    try {
      const res = await fetch(`${BACKEND}/credit-checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dossier_id: dossier.dossier_id,
          numero_versement: numero,
          boutique_id: boutiqueId,
        }),
      });
      const data: any = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || "Erreur de paiement");
        return;
      }
      if (data.payment_url || data.url) {
        window.location.href = data.payment_url || data.url;
      } else {
        alert("Lien de paiement non reçu");
      }
    } catch (e: any) {
      alert("Erreur : " + (e.message || "réseau"));
    }
  }

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const u = session?.user || null;
      setUser(u);

      if (!u) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("credit_phones")
        .select(
          "dossier_id,appareil,statut_compte,motif_refus,prix_total,montant_1,montant_2,montant_3,montant_4,paye_1,paye_2,paye_3,paye_4,echeance_1,echeance_2,echeance_3,echeance_4,created_at"
        )
        .eq("user_id", u.id)
        .order("created_at", { ascending: false })
        .limit(1);

      const { data: ordersData } = await supabase
        .from("orders")
        .select("id,produit,prix,status,statut,payment_url,payment_token,created_at")
        .eq("user_id", u.id)
        .order("created_at", { ascending: false })
        .limit(30);

      setDossier(Array.isArray(data) ? data[0] : null);
      setCommandes(Array.isArray(ordersData) ? ordersData : []);
      setLoading(false);
    }
    load();
  }, []);

  const fmt = (n: number) => Number(n || 0).toLocaleString("fr-FR");

  function normalizeStatus(o: any): "en_attente" | "paye" | "livre" | "annule" {
    const raw = String(o?.statut || o?.status || "").toLowerCase();
    if (raw === "paye" || raw === "paid") return "paye";
    if (raw === "livre" || raw === "delivered") return "livre";
    if (raw === "annule" || raw === "cancelled" || raw === "canceled") return "annule";
    return "en_attente";
  }

  function statusUi(status: "en_attente" | "paye" | "livre" | "annule") {
    if (status === "paye") {
      return { text: "Payée", bg: "rgba(0,230,118,0.15)", color: "#00e676" };
    }
    if (status === "livre") {
      return { text: "Livrée", bg: "rgba(0,200,255,0.15)", color: "#00c8ff" };
    }
    if (status === "annule") {
      return { text: "Annulée", bg: "rgba(255,90,110,0.15)", color: "#ff5a6e" };
    }
    return { text: "En attente", bg: "rgba(255,176,32,0.15)", color: "#ffb020" };
  }

  const ordersBlock = (
    <div style={{ marginTop: 18 }}>
      <h2 style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 20, fontWeight: 700, marginBottom: 10 }}>
        Mes commandes directes
      </h2>
      {commandes.length === 0 ? (
        <div style={{ ...cardStyle, padding: "16px 14px", maxWidth: "none", textAlign: "left" }}>
          <p style={{ fontSize: 13, color: "#7a9abb", margin: 0 }}>Aucune commande directe pour le moment.</p>
        </div>
      ) : (
        commandes.map((commande) => {
          const st = normalizeStatus(commande);
          const badge = statusUi(st);
          return (
            <div
              key={commande.id}
              style={{
                background: "rgba(4,15,30,0.95)",
                border: "1px solid rgba(0,180,255,0.22)",
                borderRadius: 14,
                padding: 14,
                marginBottom: 10,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 16, fontWeight: 700 }}>
                    {commande.produit || "Produit"}
                  </div>
                  <div style={{ fontSize: 11, color: "#7a9abb", marginTop: 2 }}>
                    #{commande.id} · {commande.created_at ? new Date(commande.created_at).toLocaleDateString("fr-FR") : "—"}
                  </div>
                </div>
                <div style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                  <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 19, fontWeight: 700, color: "#00c8ff" }}>
                    {fmt(commande.prix)} FCFA
                  </div>
                  <span
                    style={{
                      display: "inline-block",
                      marginTop: 4,
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "3px 10px",
                      borderRadius: 100,
                      background: badge.bg,
                      color: badge.color,
                      textTransform: "uppercase",
                    }}
                  >
                    {badge.text}
                  </span>
                </div>
              </div>

              {st === "en_attente" && commande.payment_url && (
                <a
                  href={commande.payment_url}
                  style={{
                    display: "block",
                    textAlign: "center",
                    marginTop: 10,
                    padding: 12,
                    borderRadius: 10,
                    background: "linear-gradient(135deg,#0033cc,#00aaff)",
                    color: "#fff",
                    fontWeight: 700,
                    textDecoration: "none",
                  }}
                >
                  💳 Continuer le paiement →
                </a>
              )}
            </div>
          );
        })
      )}
    </div>
  );

  if (loading) {
    return (
      <main style={pageStyle}>
        <p style={{ color: "#7a9abb" }}>Chargement…</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main style={pageStyle}>
        <div style={cardStyle}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔐</div>
          <div
            style={{
              fontFamily: "Rajdhani, sans-serif",
              fontSize: 18,
              fontWeight: 700,
              color: "#ffd700",
              marginBottom: 8,
            }}
          >
            Connexion requise
          </div>
          <p style={{ fontSize: 13, color: "#7a9abb", lineHeight: 1.7, marginBottom: 20 }}>
            Connectez-vous pour voir votre dossier crédit.
          </p>
          <Link href="/espace-partenaire" style={goldBtn}>
            Se connecter
          </Link>
        </div>
      </main>
    );
  }

  if (!dossier) {
    return (
      <main style={pageStyle}>
        <div style={{ width: "100%", maxWidth: 560 }}>
          <div style={cardStyle}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
            <div
              style={{
                fontFamily: "Rajdhani, sans-serif",
                fontSize: 18,
                fontWeight: 700,
                color: "#00c8ff",
                marginBottom: 8,
              }}
            >
              Aucun dossier
            </div>
            <p style={{ fontSize: 13, color: "#7a9abb", lineHeight: 1.7, marginBottom: 20 }}>
              Vous n’avez pas encore de dossier d’achat échelonné.
            </p>
            <Link href="/credit-halal" style={goldBtn}>
              → Faire une demande
            </Link>
          </div>
          {ordersBlock}
        </div>
      </main>
    );
  }

  const st = dossier.statut_compte;

  if (st === "en_verification" || st === "en_attente_docs") {
    const acompteMontant = (dossier.montant_1 || 0) + FRAIS_MDM;
    return (
      <main style={{ ...pageStyle, display: "block", maxWidth: 560, margin: "0 auto", paddingTop: 100 }}>
        <div style={cardStyle}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⏳</div>
          <div
            style={{
              fontFamily: "Rajdhani, sans-serif",
              fontSize: 18,
              fontWeight: 700,
              color: "#ffb020",
              marginBottom: 8,
            }}
          >
            Dossier en vérification
          </div>
          <p style={{ fontSize: 13, color: "#7a9abb", lineHeight: 1.7 }}>
            Dossier pour <strong style={{ color: "#fff" }}>{dossier.appareil || "—"}</strong>
            <br />
            Soumis le {new Date(dossier.created_at).toLocaleDateString("fr-FR")}.
          </p>

          {dossier.paye_1 ? (
            <p style={{ fontSize: 13, color: "#00e676", lineHeight: 1.7, marginTop: 12 }}>
              ✅ Acompte réglé. Votre dossier est en attente de validation par notre équipe.
            </p>
          ) : (
            <div style={{ marginTop: 16, textAlign: "left" }}>
              <p style={{ color: "#ffb020", fontSize: 13, lineHeight: 1.7 }}>
                Pour avancer, réglez d’abord l’acompte (50% + 10 000 F frais MDM). Une fois payé, notre équipe
                pourra valider votre dossier.
              </p>
              <button
                type="button"
                onClick={() => payerVersement(1)}
                style={{
                  width: "100%",
                  marginTop: 8,
                  padding: 14,
                  borderRadius: 10,
                  border: "none",
                  background: "linear-gradient(135deg,#0055ff,#00c8ff)",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: "pointer",
                }}
              >
                💳 Payer l’acompte — {fmt(acompteMontant)} FCFA
              </button>
            </div>
          )}
        </div>
        {ordersBlock}
      </main>
    );
  }

  if (st === "refuse") {
    return (
      <main style={{ ...pageStyle, display: "block", maxWidth: 560, margin: "0 auto", paddingTop: 100 }}>
        <div style={cardStyle}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>❌</div>
          <div
            style={{
              fontFamily: "Rajdhani, sans-serif",
              fontSize: 18,
              fontWeight: 700,
              color: "#ff5a6e",
              marginBottom: 8,
            }}
          >
            Dossier refusé
          </div>
          <p style={{ fontSize: 13, color: "#7a9abb", lineHeight: 1.7, marginBottom: 12 }}>
            {dossier.motif_refus ? `Motif : ${dossier.motif_refus}` : "Documents non validés."}
          </p>
          <Link href="/credit-halal" style={goldBtn}>
            → Refaire une demande
          </Link>
        </div>
        {ordersBlock}
      </main>
    );
  }

  // valide / solde → versements
  const versements = [
    {
      n: 1,
      label: "Acompte",
      sub: "50% + frais MDM",
      montant: (dossier.montant_1 || 0) + FRAIS_MDM,
      paye: dossier.paye_1,
      date: dossier.echeance_1,
    },
    {
      n: 2,
      label: "Tranche 1/3",
      sub: "mensuelle",
      montant: dossier.montant_2 || 0,
      paye: dossier.paye_2,
      date: dossier.echeance_2,
    },
    {
      n: 3,
      label: "Tranche 2/3",
      sub: "mensuelle",
      montant: dossier.montant_3 || 0,
      paye: dossier.paye_3,
      date: dossier.echeance_3,
    },
    {
      n: 4,
      label: "Tranche 3/3",
      sub: "mensuelle",
      montant: dossier.montant_4 || 0,
      paye: dossier.paye_4,
      date: dossier.echeance_4,
    },
  ];

  const totalDu = versements.reduce((s, v) => s + v.montant, 0);
  const totalPaye = versements.filter((v) => v.paye).reduce((s, v) => s + v.montant, 0);
  const pct = totalDu ? Math.round((totalPaye / totalDu) * 100) : 0;

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#020912",
        color: "#fff",
        padding: "100px 18px 60px",
        maxWidth: 560,
        margin: "0 auto",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div
          style={{
            display: "inline-flex",
            background: "rgba(0,200,255,0.1)",
            border: "1px solid rgba(0,180,255,0.22)",
            borderRadius: 100,
            padding: "6px 18px",
            fontSize: 11,
            fontFamily: "DM Mono, monospace",
            letterSpacing: 2,
            color: "#00c8ff",
            marginBottom: 16,
          }}
        >
          💳 ESPACE CRÉDIT
        </div>
        <h1 style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 26, fontWeight: 700 }}>
          Mon <span style={{ color: "#00c8ff" }}>Crédit</span>
        </h1>
      </div>

      <div
        style={{
          background: "linear-gradient(135deg, rgba(0,85,255,0.12), rgba(0,200,255,0.06))",
          border: "1px solid rgba(0,180,255,0.22)",
          borderRadius: 16,
          padding: 18,
          marginBottom: 18,
        }}
      >
        <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 20, fontWeight: 700 }}>
          {dossier.appareil || "—"}
        </div>
        <div style={{ fontSize: 11, color: "#7a9abb", fontFamily: "DM Mono, monospace", marginTop: 4 }}>
          {dossier.dossier_id}
        </div>
        <div style={{ marginTop: 14 }}>
          <div
            style={{
              background: "rgba(0,0,0,0.3)",
              borderRadius: 8,
              height: 8,
              overflow: "hidden",
              marginBottom: 6,
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${pct}%`,
                background: "linear-gradient(90deg, #0055ff, #00c8ff)",
                borderRadius: 8,
              }}
            />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#7a9abb" }}>
            <span>{fmt(totalPaye)} FCFA payé</span>
            <span>{pct}%</span>
          </div>
        </div>
      </div>

      {versements.map((v) => {
        const enRetard = !v.paye && v.date && new Date(v.date) < new Date();
        return (
          <div
            key={v.n}
            style={{
              background: "rgba(4,15,30,0.95)",
              border: `1px solid ${
                v.paye ? "rgba(0,230,118,0.4)" : enRetard ? "rgba(255,68,68,0.4)" : "rgba(0,180,255,0.22)"
              }`,
              borderRadius: 14,
              padding: 16,
              marginBottom: 12,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <div>
                <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 15, fontWeight: 700 }}>
                  {v.label}
                </div>
                <div style={{ fontSize: 11, color: "#7a9abb", marginTop: 2 }}>
                  {v.sub} · {v.date ? new Date(v.date).toLocaleDateString("fr-FR") : "—"}
                </div>
                <span
                  style={{
                    display: "inline-block",
                    marginTop: 6,
                    fontSize: 11,
                    fontWeight: 600,
                    padding: "3px 10px",
                    borderRadius: 100,
                    background: v.paye
                      ? "rgba(0,230,118,0.15)"
                      : enRetard
                      ? "rgba(255,68,68,0.15)"
                      : "rgba(0,200,255,0.12)",
                    color: v.paye ? "#00e676" : enRetard ? "#ff4444" : "#00c8ff",
                  }}
                >
                  {v.paye ? "✅ Payé" : enRetard ? "⚠️ En retard" : "📅 À venir"}
                </span>
              </div>
              <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 20, fontWeight: 700, color: "#00c8ff" }}>
                {fmt(v.montant)}
                <span style={{ fontSize: 11, color: "#7a9abb", fontWeight: 400 }}> FCFA</span>
              </div>
            </div>
            {v.paye ? (
              <div
                style={{
                  textAlign: "center",
                  padding: 11,
                  borderRadius: 10,
                  background: "rgba(0,230,118,0.1)",
                  border: "1px solid rgba(0,230,118,0.3)",
                  color: "#00e676",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                ✅ Versement réglé
              </div>
            ) : (
              <button
                style={{
                  width: "100%",
                  background: "linear-gradient(135deg, #0055ff, #00c8ff)",
                  border: "none",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 14,
                  padding: 12,
                  borderRadius: 10,
                  cursor: "pointer",
                }}
                onClick={() => payerVersement(v.n)}
              >
                💳 Payer {fmt(v.montant)} FCFA
              </button>
            )}
          </div>
        );
      })}

      <p style={{ textAlign: "center", fontSize: 12, color: "#7a9abb", marginTop: 20, lineHeight: 1.7 }}>
        Un problème?{" "}
        <a href="tel:+221770699739" style={{ color: "#00c8ff", textDecoration: "none" }}>
          +221 77 069 97 39
        </a>
      </p>

      {ordersBlock}
    </main>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#020912",
  color: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 20,
};

const cardStyle: React.CSSProperties = {
  background: "rgba(4,15,30,0.95)",
  border: "1px solid rgba(0,180,255,0.22)",
  borderRadius: 16,
  padding: "30px 20px",
  textAlign: "center",
  maxWidth: 400,
  width: "100%",
};

const goldBtn: React.CSSProperties = {
  display: "inline-block",
  background: "linear-gradient(135deg, #b8860b, #ffd700)",
  color: "#000",
  padding: "12px 24px",
  borderRadius: 10,
  fontFamily: "Rajdhani, sans-serif",
  fontWeight: 700,
  fontSize: 14,
  textDecoration: "none",
};
