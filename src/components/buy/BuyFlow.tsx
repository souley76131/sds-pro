"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Product = {
  id: string | number;
  name: string;
  model?: string;
  brand?: string;
  price: number;
  badge?: string;
  specs?: string[];
  emoji?: string;
  variantes?: { stockage?: string; couleur?: string; prix?: number; image?: string }[];
};

type Props = {
  product: Product | null;
  open: boolean;
  initialQty?: number;
  onClose: () => void;
};

const ALLOWED_EMAIL = [
  "gmail.com", "googlemail.com", "hotmail.com", "hotmail.fr",
  "outlook.com", "outlook.fr", "live.com", "yahoo.com", "yahoo.fr", "icloud.com",
];

const LIVRAISON = 10000;
const CHARGEUR = 15000;
const ICLOUD = 5000;

function isValidSenegalPhone(phone: string) {
  let d = (phone || "").replace(/\D/g, "");
  if (d.startsWith("221")) d = d.slice(3);
  return /^(70|71|75|76|77|78)\d{7}$/.test(d);
}

function isValidEmailDomain(email: string) {
  const m = (email || "").trim().toLowerCase().match(/@([^\s@]+)$/);
  return !!m && ALLOWED_EMAIL.includes(m[1]);
}

function formatPrice(n: number) {
  return n.toLocaleString("fr-FR");
}

export default function BuyFlow({ product, open, initialQty, onClose }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<any>(null);
  const [view, setView] = useState<"auth" | "tunnel">("auth");
  const [authTab, setAuthTab] = useState<"login" | "signup">("login");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [telSignup, setTelSignup] = useState("");
  const [adresseSignup, setAdresseSignup] = useState("");
  const [nameSignup, setNameSignup] = useState("");

  const [storage, setStorage] = useState("");
  const [color, setColor] = useState("");
  const [charger, setCharger] = useState(false);
  const [icloud, setIcloud] = useState(false);
  const [qty, setQty] = useState(1);
  const [accepted, setAccepted] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [payEmail, setPayEmail] = useState("");

  useEffect(() => {
    if (!open) return;
    void (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        prefillFromUser(session.user);
        setView("tunnel");
        setStep(1);
      } else {
        setUser(null);
        setView("auth");
      }
      setError("");
      setAccepted(false);
      setCharger(false);
      setIcloud(false);
      setQty(initialQty && initialQty > 0 ? initialQty : 1);
      setStorage("");
      setColor("");
      document.body.style.overflow = "hidden";
    })();

    return () => {
      document.body.style.overflow = "";
    };
  }, [open, product, initialQty, supabase]);

  function prefillFromUser(u: any) {
    const meta = u.user_metadata || {};
    setName(meta.name || meta.full_name || "");
    setPhone(meta.phone || "");
    setAddress(meta.adresse_livraison || meta.adresse || "");
    setPayEmail(u.email || "");
  }

  const storages = useMemo(() => {
    if (!product) return [] as string[];
    if (product.variantes?.length) {
      return [...new Set(product.variantes.map((v) => v.stockage).filter(Boolean) as string[])];
    }
    return (product.specs || []).filter((s) => /^\d+(GB|TB)$/i.test(s.trim()));
  }, [product]);

  const colors = useMemo(() => {
    if (!product) return [] as string[];
    if (product.variantes?.length) {
      return [...new Set(product.variantes.map((v) => v.couleur).filter(Boolean) as string[])];
    }
    return (product.specs || []).filter(
      (s) =>
        !/^\d+(GB|TB)$/i.test(s.trim()) &&
        !/unlocked|fonctionnel|face id|5g|magsafe|usb-c|dual sim|lidar|prores/i.test(s)
    );
  }, [product]);

  function unitPrice() {
    if (!product) return 0;
    if (product.variantes?.length) {
      const exact = product.variantes.find(
        (v) => (!storage || v.stockage === storage) && (!color || v.couleur === color)
      );
      if (exact?.prix) return exact.prix;
      const byStorage = product.variantes.find((v) => v.stockage === storage);
      if (byStorage?.prix) return byStorage.prix;
    }
    return product.price;
  }

  function total() {
    return unitPrice() * qty + LIVRAISON + (charger ? CHARGEUR * qty : 0) + (icloud ? ICLOUD * qty : 0);
  }

  async function login() {
    setError("");
    setLoading(true);
    try {
      const { data, error: err } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (err) throw err;
      setUser(data.user);
      prefillFromUser(data.user);
      setView("tunnel");
      setStep(1);
    } catch (e: any) {
      setError(e.message?.includes("Invalid") ? "Email ou mot de passe incorrect." : e.message);
    } finally {
      setLoading(false);
    }
  }

  async function signup() {
    setError("");
    const emailOk = email.trim().toLowerCase();
    const domaine = emailOk.split("@")[1] || "";
    if (!ALLOWED_EMAIL.includes(domaine)) {
      setError("Email non accepté. Utilisez Gmail, Hotmail, Yahoo, Outlook…");
      return;
    }
    if (!password || password.length < 8) {
      setError("Mot de passe : 8 caractères minimum.");
      return;
    }
    if (password !== password2) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    if (!isValidSenegalPhone(telSignup)) {
      setError("Téléphone Sénégal uniquement (70, 71, 75, 76, 77, 78).");
      return;
    }
    if (!adresseSignup.trim()) {
      setError("Adresse de livraison obligatoire.");
      return;
    }
    if (!nameSignup.trim()) {
      setError("Nom complet obligatoire.");
      return;
    }

    setLoading(true);
    try {
      const { data, error: err } = await supabase.auth.signUp({
        email: emailOk,
        password,
        options: {
          data: {
            name: nameSignup.trim(),
            phone: telSignup.replace(/\s/g, ""),
            adresse_livraison: adresseSignup.trim(),
          },
        },
      });
      if (err) throw err;
      if (data.user) {
        setUser(data.user);
        prefillFromUser(data.user);
        setView("tunnel");
        setStep(1);
      }
    } catch (e: any) {
      setError(/already|registered|exist/i.test(e.message) ? "Un compte existe déjà avec cet email." : e.message);
    } finally {
      setLoading(false);
    }
  }

  function canGoStep1() {
    const needS = storages.length > 1;
    const needC = colors.length > 1;
    return (!needS || !!storage) && (!needC || !!color);
  }

  function changeQty(delta: number) {
    setQty((q) => Math.max(1, q + delta));
  }

  async function pay() {
    if (!product) return;
    setError("");
    if (!name.trim() || !phone.trim()) {
      setError("Nom et téléphone obligatoires.");
      return;
    }
    if (!address.trim()) {
      setError("Adresse de livraison obligatoire.");
      return;
    }
    if (!isValidSenegalPhone(phone)) {
      setError("Numéro sénégalais invalide (70/71/75/76/77/78).");
      return;
    }
    if (payEmail && !isValidEmailDomain(payEmail)) {
      setError("Email non accepté.");
      return;
    }

    const commande_id = "CMD-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7).toUpperCase();
    const desc = `${product.name}${storage ? " · " + storage : ""}${color ? " · " + color : ""}${charger ? " + Chargeur" : ""}${icloud ? " + Compte iCloud" : ""}`;

    setLoading(true);
    try {
      const res = await fetch("https://sdsprotech-backend.pages.dev/paydunya-pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_nom: name.trim(),
          client_tel: phone.trim(),
          client_email: payEmail.trim(),
          client_address: address.trim(),
          user_id: user?.id || null,
          articles: desc,
          commande_id,
          produit_id: product.id,
          storage: storage || null,
          color: color || null,
          qty,
          charger,
          icloud,
          has_icloud: !!icloud,
          has_charger: !!charger,
          livraison: LIVRAISON,
          payment_url: null,
          chargeur_amount: charger ? CHARGEUR * qty : 0,
          icloud_amount: icloud ? ICLOUD * qty : 0,
          boutique_id: typeof window !== "undefined" ? sessionStorage.getItem("sds_boutique_id") : null,
          boutique_nom: typeof window !== "undefined" ? sessionStorage.getItem("sds_boutique_nom") : null,
          total_fallback: total(),
        }),
      });
      const data: any = await res.json();
      if (res.ok && data.success && data.payment_url) {
        window.location.href = data.payment_url;
      } else {
        setError(data.error || "Paiement indisponible. Réessayez ou WhatsApp 77 069 97 39.");
      }
    } catch {
      setError("Failed to fetch — réseau ou CORS. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  if (!open || !product) return null;

  const overlay: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    zIndex: 1300,
    background: "rgba(0,0,0,0.85)",
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
  };
  const box: React.CSSProperties = {
    width: "100%",
    maxWidth: 520,
    background: "rgba(4,14,28,0.99)",
    border: "1px solid rgba(0,200,255,0.2)",
    borderRadius: "22px 22px 0 0",
    maxHeight: "92dvh",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  };
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
    boxSizing: "border-box",
  };
  const btnPrimary: React.CSSProperties = {
    flex: 1,
    padding: 13,
    borderRadius: 10,
    border: "none",
    background: "linear-gradient(135deg,#0033cc,#00aaff)",
    color: "#fff",
    fontWeight: 700,
    fontFamily: "Rajdhani, sans-serif",
    letterSpacing: 1,
    cursor: loading ? "wait" : "pointer",
    opacity: loading ? 0.6 : 1,
  };
  const extraRow: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.03)",
    marginBottom: 8,
  };
  const extraRowActive: React.CSSProperties = {
    ...extraRow,
    border: "1px solid rgba(0,200,255,0.3)",
    background: "rgba(0,200,255,0.06)",
  };
  const extraBtn: React.CSSProperties = {
    width: 28,
    height: 28,
    borderRadius: "50%",
    border: "1.5px solid rgba(0,200,255,0.4)",
    background: "rgba(0,200,255,0.07)",
    color: "#00c8ff",
    cursor: "pointer",
  };

  return (
    <div style={overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={box}>
        <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(0,200,255,0.12)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 16, fontWeight: 700, color: "#00c8ff" }}>
            {view === "auth" ? "🔐 Connexion requise" : step === 1 ? "Variante" : step === 2 ? "Extras" : step === 3 ? "Conditions" : "Paiement"}
          </div>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.06)", color: "#fff", cursor: "pointer" }}>×</button>
        </div>

        {view === "tunnel" && (
          <div style={{ padding: "10px 16px 0", display: "flex", gap: 5 }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i < step ? "#00c8ff" : i === step ? "rgba(0,200,255,0.5)" : "rgba(255,255,255,0.1)" }} />
            ))}
          </div>
        )}

        <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
          {error && <div style={{ color: "#f87171", fontSize: 12, marginBottom: 10 }}>{error}</div>}

          {view === "auth" && (
            <>
              <div style={{ fontSize: 12, color: "#7a9abb", marginBottom: 12 }}>Connectez-vous pour commander {product.name}</div>
              <div style={{ display: "flex", gap: 0, background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: 3, marginBottom: 14 }}>
                <button type="button" onClick={() => setAuthTab("login")} style={{ flex: 1, padding: 8, borderRadius: 8, border: "none", cursor: "pointer", background: authTab === "login" ? "rgba(0,200,255,0.15)" : "transparent", color: authTab === "login" ? "#00c8ff" : "#7a9abb" }}>Se connecter</button>
                <button type="button" onClick={() => setAuthTab("signup")} style={{ flex: 1, padding: 8, borderRadius: 8, border: "none", cursor: "pointer", background: authTab === "signup" ? "rgba(0,200,255,0.15)" : "transparent", color: authTab === "signup" ? "#00c8ff" : "#7a9abb" }}>Créer un compte</button>
              </div>

              {authTab === "login" ? (
                <>
                  <input style={input} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
                  <input style={input} type="password" placeholder="Mot de passe" value={password} onChange={(e) => setPassword(e.target.value)} />
                  <button style={{ ...btnPrimary, width: "100%" }} disabled={loading} onClick={login}>{loading ? "…" : "SE CONNECTER →"}</button>
                </>
              ) : (
                <>
                  <input style={input} placeholder="Nom complet" value={nameSignup} onChange={(e) => setNameSignup(e.target.value)} />
                  <input style={input} type="email" placeholder="Email (Gmail, Hotmail…)" value={email} onChange={(e) => setEmail(e.target.value)} />
                  <input style={input} type="password" placeholder="Mot de passe (8 min)" value={password} onChange={(e) => setPassword(e.target.value)} />
                  <input style={input} type="password" placeholder="Confirmer le mot de passe" value={password2} onChange={(e) => setPassword2(e.target.value)} />
                  <input style={input} type="tel" placeholder="Téléphone (77 …)" value={telSignup} onChange={(e) => setTelSignup(e.target.value)} />
                  <input style={input} placeholder="Adresse de livraison" value={adresseSignup} onChange={(e) => setAdresseSignup(e.target.value)} />
                  <button style={{ ...btnPrimary, width: "100%" }} disabled={loading} onClick={signup}>{loading ? "…" : "CRÉER MON COMPTE →"}</button>
                </>
              )}
            </>
          )}

          {view === "tunnel" && step === 1 && (
            <>
              <div style={{ marginBottom: 12, padding: 12, borderRadius: 12, border: "1px solid rgba(0,200,255,0.12)", background: "rgba(0,200,255,0.04)" }}>
                <div style={{ fontWeight: 700 }}>{product.emoji || "📱"} {product.name}</div>
                <div style={{ color: "#00c8ff", fontSize: 20, fontWeight: 800 }}>{formatPrice(unitPrice() * qty)} FCFA</div>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  border: "1px solid rgba(0,200,255,0.2)",
                  borderRadius: 10,
                  padding: "10px 12px",
                  marginBottom: 12,
                  background: "rgba(0,200,255,0.04)",
                }}
              >
                <span style={{ fontWeight: 600 }}>Quantité</span>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => changeQty(-1)}
                    style={{ width: 28, height: 28, borderRadius: 8, border: "1px solid rgba(0,180,255,0.25)", background: "rgba(0,200,255,0.08)", color: "#00c8ff", cursor: "pointer" }}
                  >
                    −
                  </button>
                  <strong style={{ minWidth: 20, textAlign: "center", fontFamily: "Rajdhani, sans-serif", fontSize: 20 }}>{qty}</strong>
                  <button
                    type="button"
                    onClick={() => changeQty(1)}
                    style={{ width: 28, height: 28, borderRadius: 8, border: "1px solid rgba(0,180,255,0.25)", background: "rgba(0,200,255,0.08)", color: "#00c8ff", cursor: "pointer" }}
                  >
                    +
                  </button>
                </div>
              </div>

              {storages.length > 0 && (
                <>
                  <div style={{ fontSize: 10, color: "#7a9abb", letterSpacing: 1, marginBottom: 6 }}>STOCKAGE</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                    {storages.map((s) => (
                      <button key={s} type="button" onClick={() => setStorage(s)} style={{ padding: "8px 14px", borderRadius: 8, border: storage === s ? "1.5px solid #00c8ff" : "1.5px solid rgba(255,255,255,0.1)", background: storage === s ? "rgba(0,200,255,0.12)" : "rgba(255,255,255,0.03)", color: "#fff", cursor: "pointer" }}>{s}</button>
                    ))}
                  </div>
                </>
              )}
              {colors.length > 0 && (
                <>
                  <div style={{ fontSize: 10, color: "#7a9abb", letterSpacing: 1, marginBottom: 6 }}>COULEUR</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {colors.map((c) => (
                      <button key={c} type="button" onClick={() => setColor(c)} style={{ padding: "8px 14px", borderRadius: 8, border: color === c ? "1.5px solid #00c8ff" : "1.5px solid rgba(255,255,255,0.1)", background: color === c ? "rgba(0,200,255,0.12)" : "rgba(255,255,255,0.03)", color: "#fff", cursor: "pointer" }}>{c}</button>
                    ))}
                  </div>
                </>
              )}
              {storages.length === 0 && colors.length === 0 && (
                <div style={{ color: "#7a9abb", fontSize: 13, textAlign: "center", padding: 16 }}>Pas de variante à choisir.</div>
              )}
            </>
          )}

          {view === "tunnel" && step === 2 && (
            <>
              <div style={{ fontSize: 12, color: "#7a9abb", marginBottom: 10 }}>{product.name}{storage ? " · " + storage : ""}{color ? " · " + color : ""}</div>

              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: 12, marginBottom: 8, borderRadius: 10,
                border: "1px solid rgba(0,200,255,0.25)", background: "rgba(0,200,255,0.06)",
              }}>
                <div>
                  <div style={{ fontWeight: 600 }}>🚚 Livraison Dakar</div>
                  <div style={{ fontSize: 11, color: "#7a9abb" }}>24-48h · {formatPrice(LIVRAISON)} FCFA</div>
                </div>
                <span style={{ color: "#00c8ff", fontWeight: 700 }}>✓</span>
              </div>

              <div style={charger ? extraRowActive : extraRow}>
                <div>
                  <div style={{ fontWeight: 600 }}>🔌 Chargeur</div>
                  <div style={{ fontSize: 11, color: "#7a9abb" }}>+15 000 FCFA</div>
                </div>
                <button type="button" onClick={() => setCharger((v) => !v)} style={extraBtn}>{charger ? "✓" : "+"}</button>
              </div>

              <div style={icloud ? extraRowActive : extraRow}>
                <div>
                  <div style={{ fontWeight: 600 }}>☁️ Création compte iCloud</div>
                  <div style={{ fontSize: 11, color: "#7a9abb" }}>+5 000 FCFA · configuration incluse</div>
                </div>
                <button type="button" onClick={() => setIcloud((v) => !v)} style={extraBtn}>{icloud ? "✓" : "+"}</button>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, paddingTop: 10, borderTop: "1px solid rgba(0,200,255,0.2)" }}>
                <span style={{ color: "#7a9abb" }}>Total</span>
                <strong style={{ color: "#00c8ff", fontSize: 20 }}>{formatPrice(total())} FCFA</strong>
              </div>
            </>
          )}

          {view === "tunnel" && step === 3 && (
            <>
              <div style={{ fontSize: 12, lineHeight: 1.8, color: "rgba(255,255,255,0.75)", padding: 14, borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)", marginBottom: 14 }}>
                <strong style={{ color: "#00c8ff" }}>📦 Livraison</strong><br />
                Dakar 24-48h, {formatPrice(LIVRAISON)} FCFA.<br /><br />
                <strong style={{ color: "#00c8ff" }}>🔄 Retours</strong><br />
                72h si défaut à la réception.<br /><br />
                <strong style={{ color: "#00c8ff" }}>🛡️ Garantie</strong><br />
                6 mois panne. Blindé + pochette inclus.<br /><br />
                <strong style={{ color: "#00c8ff" }}>💳 Paiement</strong><br />
                Orange Money · Free Money · Wave · Djamo via PayDunya.
              </div>
              <label style={{ display: "flex", gap: 10, alignItems: "center", padding: 12, borderRadius: 10, border: "1.5px solid rgba(0,200,255,0.2)", background: "rgba(0,200,255,0.05)", cursor: "pointer" }}>
                <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />
                <span style={{ fontSize: 13 }}>J’accepte les conditions d’achat, livraison et garantie.</span>
              </label>
            </>
          )}

          {view === "tunnel" && step === 4 && (
            <>
              <div style={{ fontSize: 11, fontFamily: "DM Mono, monospace", lineHeight: 1.8, padding: 12, borderRadius: 10, border: "1px solid rgba(0,200,255,0.12)", background: "rgba(0,200,255,0.04)", marginBottom: 12, color: "rgba(255,255,255,0.75)" }}>
                📱 {product.name}{storage ? " · " + storage : ""}{color ? " · " + color : ""} · x{qty}
                <br />🚚 Livraison Dakar: {formatPrice(LIVRAISON)} FCFA · {charger ? "🔌 Chargeur inclus" : "Sans chargeur"}{icloud ? " · ☁️ iCloud inclus" : ""}
                <br /><strong style={{ color: "#00c8ff" }}>TOTAL : {formatPrice(total())} FCFA</strong>
              </div>
              <input style={input} value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom complet *" disabled={!!user} />
              <input style={input} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Téléphone *" disabled={!!user && !!phone} />
              <input style={input} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Adresse de livraison *" />
              <input style={{ ...input, marginBottom: 0 }} value={payEmail} onChange={(e) => setPayEmail(e.target.value)} placeholder="Email" disabled={!!user} />
            </>
          )}
        </div>

        {view === "tunnel" && (
          <div style={{ padding: "8px 16px 12px", borderTop: "1px solid rgba(0,200,255,0.12)", display: "flex", gap: 8 }}>
            {step > 1 && (
              <button type="button" onClick={() => setStep((s) => s - 1)} style={{ flex: 1, padding: 13, borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.7)", cursor: "pointer" }}>← Retour</button>
            )}
            {step < 4 && (
              <button
                type="button"
                style={btnPrimary}
                disabled={(step === 1 && !canGoStep1()) || (step === 3 && !accepted)}
                onClick={() => setStep((s) => s + 1)}
              >
                {step === 3 ? "Accepter & Continuer →" : "Continuer →"}
              </button>
            )}
            {step === 4 && (
              <button type="button" style={btnPrimary} disabled={loading} onClick={pay}>
                {loading ? "⏳ Redirection…" : "💳 PAYER MAINTENANT →"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}