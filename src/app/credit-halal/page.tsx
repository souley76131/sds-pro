"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const FRAIS_MDM = 10000;
const BACKEND = "https://sdsprotech-backend.pages.dev";
// Boutique par défaut quand le client n'arrive pas via un lien boutique
// (catalogue global) — le CA reste rattaché à SDS PRO plutôt que null.
const SDS_PRO_BOUTIQUE_ID = "1a7c846f-f4a9-4d06-b07f-51474edab005";

export default function CreditHalalPage() {
  const [user, setUser] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [formNom, setFormNom] = useState("");
  const [formTel, setFormTel] = useState("");
  const [formAdresse, setFormAdresse] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formProduit, setFormProduit] = useState("");
  const [formMsg, setFormMsg] = useState("");
  const [cgv, setCgv] = useState<boolean[]>([false, false, false, false, false]);
  const [files, setFiles] = useState<{
    cniRecto?: File;
    cniVerso?: File;
    selfie?: File;
    residence?: File;
  }>({});
  const [fileNames, setFileNames] = useState<Record<string, string>>({});
  const [boutiqueId, setBoutiqueId] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      if (typeof window !== "undefined") {
        const p = new URLSearchParams(window.location.search);
        const b =
          p.get("boutique_id") ||
          p.get("boutique") ||
          window.sessionStorage.getItem("sds_boutique_id") ||
          null;
        if (b) {
          setBoutiqueId(b);
          window.sessionStorage.setItem("sds_boutique_id", b);
        }
        const produitIdFromUrl = p.get("produit_id");
        if (produitIdFromUrl) {
          setFormProduit(produitIdFromUrl);
        }
      }

      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);

      const { data } = await supabase
        .from("products")
        .select("id,nom,prix,emoji,modele")
        .eq("visible", true)
        .eq("moderation_status", "approved")
        .order("id", { ascending: true });

      setProducts(data || []);
      setLoading(false);
    }
    init();
  }, []);

  const prod = products.find((p) => String(p.id) === String(selectedId));
  const prix = prod ? Number(prod.prix) : 0;
  const acompte = Math.ceil(prix * 0.5);
  const reste = Math.max(prix - acompte, 0);
  const tranche = Math.ceil(reste / 3);
  const aujourdhui = acompte + FRAIS_MDM;

  const fmt = (n: number) => n.toLocaleString("fr-FR");

  function handleFile(key: string, file?: File) {
    if (!file) return;
    setFiles((prev) => ({ ...prev, [key]: file }));
    setFileNames((prev) => ({ ...prev, [key]: file.name }));
  }

  async function fileToBase64(file: File): Promise<{ data: string; type: string }> {
    if (file.type === "application/pdf" || !file.type.startsWith("image/")) {
      const buf = await file.arrayBuffer();
      const bytes = new Uint8Array(buf);
      let binary = "";
      for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
      return { data: btoa(binary), type: file.type || "application/pdf" };
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const maxW = 1500;
        const scale = Math.min(1, maxW / img.width);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
        resolve({ data: dataUrl.split(",")[1], type: "image/jpeg" });
      };
      img.onerror = reject;
      img.src = url;
    });
  }

  async function soumettreDossier() {
    setFormMsg("");
    if (!formProduit || !formNom.trim() || !formTel.trim() || !formAdresse.trim()) {
      setFormMsg("❌ Remplissez tous les champs obligatoires.");
      return;
    }
    if (!files.cniRecto || !files.cniVerso || !files.selfie || !files.residence) {
      setFormMsg("❌ Tous les documents sont requis.");
      return;
    }
    if (!cgv.every(Boolean)) {
      setFormMsg("❌ Vous devez accepter toutes les conditions.");
      return;
    }
    if (!user) {
      setFormMsg("❌ Connectez-vous d’abord.");
      return;
    }

    const produit = products.find((p) => String(p.id) === String(formProduit));
    if (!produit) {
      setFormMsg("❌ Produit introuvable.");
      return;
    }

    setFormMsg("⏳ Compression des documents…");
    try {
      const [d1, d2, d3, d5] = await Promise.all([
        fileToBase64(files.cniRecto),
        fileToBase64(files.cniVerso),
        fileToBase64(files.selfie),
        fileToBase64(files.residence),
      ]);

      setFormMsg("⏳ Envoi en cours…");

      const res = await fetch(`${BACKEND}/credit-upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          client_nom: formNom.trim(),
          client_tel: formTel.trim(),
          client_email: formEmail.trim() || user.email,
          client_adresse: formAdresse.trim(),
          appareil: produit.nom + (produit.modele ? " " + produit.modele : ""),
          produit_id: Number(formProduit),
          prix_total: Number(produit.prix),
          boutique_id:
            (typeof window !== "undefined"
              ? window.sessionStorage.getItem("sds_boutique_id") || boutiqueId
              : boutiqueId) || SDS_PRO_BOUTIQUE_ID,
          doc_cni_recto: d1,
          doc_cni_verso: d2,
          doc_selfie: d3,
          doc_cni_legalisee: null,
          doc_residence: d5,
        }),
      });

      const result: any = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || "Échec de la soumission");
      }

      setFormMsg("✅ Dossier soumis avec succès !");
      setTimeout(() => {
        window.location.href = "/mon-credit";
      }, 1500);
    } catch (e: any) {
      setFormMsg("❌ Erreur : " + (e.message || "inconnue"));
    }
  }

  return (
    <main style={{ minHeight: "100vh", background: "#020912", color: "#fff", paddingBottom: 60 }}>
      {/* Hero */}
      <section
        style={{
          padding: "110px 20px 40px",
          textAlign: "center",
          background: "radial-gradient(ellipse at 50% 0%, rgba(0,100,200,0.18) 0%, transparent 70%)",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: "rgba(255,215,0,0.1)",
            border: "1px solid rgba(255,215,0,0.3)",
            borderRadius: 100,
            padding: "6px 18px",
            fontSize: 11,
            fontFamily: "DM Mono, monospace",
            letterSpacing: 2,
            color: "#ffd700",
            marginBottom: 20,
          }}
        >
          🌙 VENTE MOURABAHA · SANS INTÉRÊT · PAIEMENT ÉCHELONNÉ
        </div>

        <h1
          style={{
            fontFamily: "Rajdhani, sans-serif",
            fontSize: "clamp(28px, 7vw, 52px)",
            fontWeight: 700,
            lineHeight: 1.1,
            marginBottom: 16,
          }}
        >
          Achat <span style={{ color: "#ffd700" }}>Échelonné</span>{" "}
          <span style={{ color: "#00c8ff" }}>Halal</span>
        </h1>

        <p
          style={{
            fontSize: 14,
            color: "#bdd4ea",
            lineHeight: 1.8,
            maxWidth: 480,
            margin: "0 auto 30px",
          }}
        >
          Obtenez votre smartphone avec un acompte 50% + 3 tranches. Payez le prix exact du téléphone, sans frais cachés.
        </p>

        {/* Principes */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
            maxWidth: 500,
            margin: "0 auto",
          }}
        >
          {[
            { icon: "🚫", title: "Sans Intérêt", desc: "Vous payez exactement le prix du téléphone." },
            { icon: "🛡️", title: "Sécurisé MDM", desc: "10 000 FCFA — appareil géré jusqu’au dernier paiement." },
            { icon: "📋", title: "Transparent", desc: "Tous les frais affichés dès le départ." },
            { icon: "✅", title: "Halal Certifié", desc: "Contrat Murabaha conforme à la charia." },
          ].map((p) => (
            <div
              key={p.title}
              style={{
                background: "rgba(255,215,0,0.05)",
                border: "1px solid rgba(255,215,0,0.3)",
                borderRadius: 14,
                padding: 16,
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 24, marginBottom: 8 }}>{p.icon}</div>
              <div
                style={{
                  fontFamily: "Rajdhani, sans-serif",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#ffd700",
                  marginBottom: 4,
                }}
              >
                {p.title}
              </div>
              <div style={{ fontSize: 11, color: "#7a9abb", lineHeight: 1.5 }}>{p.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Calculateur */}
      <section style={{ padding: "0 20px 40px", maxWidth: 500, margin: "0 auto" }}>
        <div
          style={{
            fontFamily: "Rajdhani, sans-serif",
            fontSize: 18,
            fontWeight: 700,
            color: "#00c8ff",
            letterSpacing: 2,
            textTransform: "uppercase",
            marginBottom: 16,
          }}
        >
          💰 Simuler votre crédit
        </div>

        <div
          style={{
            background: "rgba(4,15,30,0.95)",
            border: "1px solid rgba(0,180,255,0.22)",
            borderRadius: 16,
            padding: 20,
          }}
        >
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            style={{
              width: "100%",
              background: "rgba(0,20,50,0.8)",
              border: "1px solid rgba(0,180,255,0.22)",
              borderRadius: 10,
              padding: "12px 14px",
              color: "#fff",
              fontSize: 14,
              marginBottom: 16,
              outline: "none",
            }}
          >
            <option value="">— Choisir un produit —</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {(p.emoji || "📱") + " " + p.nom + " — " + fmt(p.prix) + " FCFA"}
              </option>
            ))}
          </select>

          {prod && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                background: "rgba(0,100,255,0.08)",
                border: "1px solid rgba(0,180,255,0.2)",
                borderRadius: 12,
                padding: 14,
                marginBottom: 16,
              }}
            >
              <div style={{ fontSize: 28 }}>{prod.emoji || "📱"}</div>
              <div>
                <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 16, fontWeight: 700 }}>
                  {prod.nom}
                </div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#00c8ff" }}>
                  {fmt(prix)} FCFA
                </div>
              </div>
            </div>
          )}

          <Row label="Prix total" value={prod ? fmt(prix) + " FCFA" : "—"} cyan />
          <Row label="🔑 Acompte (50%) + 10 000 FCFA MDM" value={prod ? fmt(acompte) + " FCFA + " + fmt(FRAIS_MDM) + " FCFA" : "—"} gold />
          <Row label="📅 Tranche 1/3" value={prod ? fmt(tranche) + " FCFA" : "—"} />
          <Row label="📅 Tranche 2/3" value={prod ? fmt(tranche) + " FCFA" : "—"} />
          <Row label="📅 Tranche 3/3" value={prod ? fmt(tranche) + " FCFA" : "—"} />
          <Row label="🔒 Frais MDM" value={fmt(FRAIS_MDM) + " FCFA"} />
          <Row
            label="💳 Total à payer aujourd’hui"
            value={prod ? fmt(aujourdhui) + " FCFA" : "—"}
            green
            bold
          />

          {prod && (
            <div
              style={{
                fontSize: 11,
                color: "#7a9abb",
                lineHeight: 1.6,
                marginTop: 14,
                padding: "10px 12px",
                background: "rgba(255,215,0,0.05)",
                border: "1px solid rgba(255,215,0,0.15)",
                borderRadius: 8,
              }}
            >
              📌 Vous payez <strong>{fmt(acompte)} FCFA</strong> + {fmt(FRAIS_MDM)} FCFA MDM
              aujourd’hui, puis <strong>{fmt(tranche)} FCFA × 3</strong>. Aucun intérêt.
            </div>
          )}
        </div>
      </section>

      {/* Comment ça marche */}
      <section style={{ padding: "0 20px 40px", maxWidth: 500, margin: "0 auto" }}>
        <div
          style={{
            fontFamily: "Rajdhani, sans-serif",
            fontSize: 18,
            fontWeight: 700,
            color: "#00c8ff",
            letterSpacing: 2,
            textTransform: "uppercase",
            marginBottom: 16,
          }}
        >
          📋 Comment ça marche
        </div>

        {[
          ["1", "Créez votre compte", "Inscrivez-vous avec votre vrai nom et numéro."],
          ["2", "Soumettez votre dossier", "Envoyez vos documents d’identité clairs."],
          ["3", "Validation 24-48h", "Notre équipe vérifie. Notification WhatsApp."],
          ["4", "Acompte + MDM", "Payez 50% + 10 000 FCFA MDM pour activer la commande."],
          ["5", "Tranche 1/3", "Payez le premier tiers du reste à la date prévue."],
          ["6", "Tranche 2/3", "Payez le deuxième tiers du reste."],
          ["7", "Tranche 3/3", "Payez le dernier tiers et clôturez le dossier."],
          ["8", "Fin de contrat", "MDM retiré. Le téléphone vous appartient."],
        ].map(([num, title, desc]) => (
          <div
            key={num}
            style={{
              display: "flex",
              gap: 14,
              alignItems: "flex-start",
              background: "rgba(0,20,50,0.5)",
              border: "1px solid rgba(0,180,255,0.22)",
              borderRadius: 14,
              padding: 16,
              marginBottom: 12,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                minWidth: 32,
                background: "linear-gradient(135deg, #0055ff, #00c8ff)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "Rajdhani, sans-serif",
                fontSize: 14,
                fontWeight: 700,
              }}
            >
              {num}
            </div>
            <div>
              <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
                {title}
              </div>
              <div style={{ fontSize: 12, color: "#7a9abb", lineHeight: 1.6 }}>{desc}</div>
            </div>
          </div>
        ))}
      </section>

      {/* CTA */}
      <section style={{ padding: "0 20px", maxWidth: 500, margin: "0 auto", textAlign: "center" }}>
        {loading ? (
          <p style={{ color: "#7a9abb" }}>Chargement…</p>
        ) : user ? (
          <p style={{ color: "#7a9abb", fontSize: 13 }}>Complétez le formulaire ci-dessous pour soumettre votre dossier.</p>
        ) : (
          <div
            style={{
              background: "rgba(0,20,60,0.8)",
              border: "1px solid rgba(255,215,0,0.3)",
              borderRadius: 16,
              padding: "30px 20px",
            }}
          >
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
              Vous devez être connecté pour soumettre un dossier Achat Échelonné Halal.
            </p>
            <Link
              href="/espace-partenaire"
              style={{
                display: "inline-block",
                background: "linear-gradient(135deg, #b8860b, #ffd700)",
                color: "#000",
                padding: "12px 28px",
                borderRadius: 10,
                fontFamily: "Rajdhani, sans-serif",
                fontWeight: 700,
                fontSize: 14,
                textDecoration: "none",
              }}
            >
              Se connecter / S’inscrire
            </Link>
          </div>
        )}
      </section>

      {/* Formulaire dossier — visible si connecté */}
      {user && (
        <section style={{ padding: "40px 20px", maxWidth: 500, margin: "0 auto" }}>
          <div
            style={{
              fontFamily: "Rajdhani, sans-serif",
              fontSize: 18,
              fontWeight: 700,
              color: "#00c8ff",
              letterSpacing: 2,
              textTransform: "uppercase",
              marginBottom: 16,
            }}
          >
            📝 Soumettre mon dossier
          </div>

          <div
            style={{
              background: "rgba(4,15,30,0.95)",
              border: "1px solid rgba(0,180,255,0.22)",
              borderRadius: 16,
              padding: 20,
            }}
          >
            <Field label="Produit souhaité *">
              <select value={formProduit} onChange={(e) => setFormProduit(e.target.value)} style={inputStyle}>
                <option value="">— Choisir —</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {(p.emoji || "📱") + " " + p.nom + " — " + fmt(Number(p.prix)) + " FCFA"}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Nom complet *">
              <input
                value={formNom}
                onChange={(e) => setFormNom(e.target.value)}
                placeholder="Prénom Nom"
                style={inputStyle}
              />
            </Field>

            <Field label="Téléphone *">
              <input
                value={formTel}
                onChange={(e) => setFormTel(e.target.value)}
                placeholder="77 123 45 67"
                style={inputStyle}
              />
            </Field>

            <Field label="Adresse complète *">
              <input
                value={formAdresse}
                onChange={(e) => setFormAdresse(e.target.value)}
                placeholder="Quartier, rue, ville…"
                style={inputStyle}
              />
            </Field>

            <Field label="Email">
              <input
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="vous@gmail.com"
                style={inputStyle}
              />
            </Field>

            <div
              style={{
                fontFamily: "DM Mono, monospace",
                fontSize: 9,
                letterSpacing: 2,
                color: "#7a9abb",
                textTransform: "uppercase",
                margin: "20px 0 12px",
              }}
            >
              Documents d’identité
            </div>

            <UploadZone
              label="CNI Recto *"
              icon="🪪"
              hint="Face avant de la CNI"
              name={fileNames.cniRecto}
              onChange={(f) => handleFile("cniRecto", f)}
            />
            <UploadZone
              label="CNI Verso *"
              icon="🪪"
              hint="Face arrière de la CNI"
              name={fileNames.cniVerso}
              onChange={(f) => handleFile("cniVerso", f)}
            />
            <UploadZone
              label="Selfie avec CNI en main *"
              icon="🤳"
              hint="Visage + CNI visibles"
              name={fileNames.selfie}
              onChange={(f) => handleFile("selfie", f)}
              capture
            />
            <UploadZone
              label="Certificat de résidence / Facture *"
              icon="🏠"
              hint="Document récent à votre nom"
              name={fileNames.residence}
              onChange={(f) => handleFile("residence", f)}
              accept="image/*,application/pdf"
            />

            <div
              style={{
                fontSize: 11,
                color: "#7a9abb",
                lineHeight: 1.6,
                margin: "16px 0",
                padding: "10px 12px",
                background: "rgba(0,230,118,0.05)",
                border: "1px solid rgba(0,230,118,0.2)",
                borderRadius: 8,
              }}
            >
              🔒 Vos documents sont utilisés uniquement pour l’étude du dossier.
            </div>

            {formMsg && (
              <p style={{ color: formMsg.startsWith("✅") ? "#00e676" : "#ff5a6e", fontSize: 13, marginBottom: 12 }}>
                {formMsg}
              </p>
            )}

            <div
              style={{
                background: "rgba(0,200,255,0.04)",
                border: "1px solid rgba(0,200,255,0.15)",
                borderRadius: 14,
                padding: 16,
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  fontFamily: "DM Mono, monospace",
                  fontSize: 10,
                  letterSpacing: 2,
                  color: "#7a9abb",
                  textTransform: "uppercase",
                  marginBottom: 14,
                }}
              >
                📋 Conditions à accepter
              </div>

              {[
                "Je certifie que les documents sont authentiques et j’accepte le traitement de mes données par SECK DIGITAL SERVICES PRO (NINEA 013038395).",
                "Je comprends que les frais MDM de 10 000 FCFA sont non remboursables.",
                "J’accepte qu’en cas de retard, certaines fonctions de l’appareil puissent être restreintes.",
                "J’accepte qu’en cas d’impayé, l’appareil puisse être bloqué à distance.",
                "Je reconnais que SDS PRO peut engager une procédure judiciaire en cas d’impayé persistant.",
              ].map((txt, i) => (
                <label
                  key={i}
                  style={{
                    display: "flex",
                    gap: 12,
                    alignItems: "flex-start",
                    marginBottom: i < 4 ? 14 : 0,
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={!!cgv[i]}
                    onChange={(e) =>
                      setCgv((prev) => {
                        const next = [...prev];
                        next[i] = e.target.checked;
                        return next;
                      })
                    }
                    style={{ marginTop: 3, flexShrink: 0, accentColor: "#00c8ff" }}
                  />
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", lineHeight: 1.6 }}>
                    {txt}
                  </span>
                </label>
              ))}
            </div>

            <button
              onClick={soumettreDossier}
              style={{
                width: "100%",
                background: "linear-gradient(135deg, #b8860b, #ffd700)",
                color: "#000",
                border: "none",
                padding: 15,
                borderRadius: 12,
                fontFamily: "Rajdhani, sans-serif",
                fontWeight: 700,
                fontSize: 15,
                letterSpacing: 1,
                cursor: "pointer",
              }}
            >
              ✅ SOUMETTRE MON DOSSIER
            </button>
          </div>
        </section>
      )}
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label
        style={{
          display: "block",
          fontFamily: "DM Mono, monospace",
          fontSize: 9,
          letterSpacing: 2,
          color: "#7a9abb",
          textTransform: "uppercase",
          marginBottom: 6,
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "rgba(0,20,50,0.8)",
  border: "1px solid rgba(0,180,255,0.22)",
  borderRadius: 10,
  padding: "12px 14px",
  color: "#fff",
  fontSize: 14,
  fontFamily: "Outfit, sans-serif",
  outline: "none",
  boxSizing: "border-box",
};

function UploadZone({
  label,
  icon,
  hint,
  name,
  onChange,
  accept = "image/*",
  capture,
}: {
  label: string;
  icon: string;
  hint: string;
  name?: string;
  onChange: (f?: File) => void;
  accept?: string;
  capture?: boolean;
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label
        style={{
          display: "block",
          fontFamily: "DM Mono, monospace",
          fontSize: 9,
          letterSpacing: 2,
          color: "#7a9abb",
          textTransform: "uppercase",
          marginBottom: 6,
        }}
      >
        {label}
      </label>
      <label
        style={{
          display: "block",
          border: `1px dashed ${name ? "rgba(0,230,118,0.5)" : "rgba(0,180,255,0.4)"}`,
          borderRadius: 10,
          padding: 16,
          textAlign: "center",
          cursor: "pointer",
          background: name ? "rgba(0,230,118,0.05)" : "transparent",
          position: "relative",
        }}
      >
        <input
          type="file"
          accept={accept}
          capture={capture ? "user" : undefined}
          onChange={(e) => onChange(e.target.files?.[0])}
          style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }}
        />
        <div style={{ fontSize: 22, marginBottom: 6 }}>{icon}</div>
        <div style={{ fontSize: 12, color: "#7a9abb" }}>{hint}</div>
        {name && (
          <div
            style={{
              fontSize: 11,
              color: "#00c8ff",
              marginTop: 6,
              fontFamily: "DM Mono, monospace",
            }}
          >
            ✅ {name}
          </div>
        )}
      </label>
    </div>
  );
}

function Row({
  label,
  value,
  cyan,
  gold,
  green,
  bold,
}: {
  label: string;
  value: string;
  cyan?: boolean;
  gold?: boolean;
  green?: boolean;
  bold?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px 0",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <span style={{ fontSize: 13, color: bold ? "#fff" : "#7a9abb", fontWeight: bold ? 700 : 400 }}>
        {label}
      </span>
      <span
        style={{
          fontFamily: "Rajdhani, sans-serif",
          fontSize: 16,
          fontWeight: 700,
          color: cyan ? "#00c8ff" : gold ? "#ffd700" : green ? "#00e676" : "#fff",
        }}
      >
        {value}
      </span>
    </div>
  );
}
