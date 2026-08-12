"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getCart, clearCart, type CartItem } from "@/lib/cart";

const LIVRAISON = 10000;
const CHARGEUR = 15000;
const ICLOUD = 5000;

const ALLOWED_EMAIL = [
  "gmail.com", "googlemail.com", "hotmail.com", "hotmail.fr",
  "outlook.com", "outlook.fr", "live.com", "yahoo.com", "yahoo.fr", "icloud.com",
];

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

function lineTotal(item: CartItem) {
  return (
    (item.price ?? item.unitPrice) * item.qty +
    (item.charger ? CHARGEUR * item.qty : 0) +
    (item.icloud ? ICLOUD * item.qty : 0)
  );
}

const btnPrimary: React.CSSProperties = {
  width: "100%",
  padding: 14,
  borderRadius: 12,
  border: "none",
  background: "linear-gradient(135deg,#0033cc,#00aaff)",
  color: "#fff",
  fontWeight: 700,
  fontFamily: "Rajdhani, sans-serif",
  letterSpacing: 1,
  cursor: "pointer",
  fontSize: 15,
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
};

export default function CheckoutPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [items, setItems] = useState<CartItem[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [authTab, setAuthTab] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [nameSignup, setNameSignup] = useState("");
  const [telSignup, setTelSignup] = useState("");
  const [adresseSignup, setAdresseSignup] = useState("");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [payEmail, setPayEmail] = useState("");

  useEffect(() => {
    const cart = getCart();
    if (!cart.length) {
      router.replace("/panier");
      return;
    }
    setItems(cart);

    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        const meta = session.user.user_metadata || {};
        setName(meta.name || meta.full_name || "");
        setPhone(meta.phone || "");
        setAddress(meta.adresse_livraison || "");
        setPayEmail(session.user.email || "");
      }
    })();
  }, [router, supabase]);

  const subtotal = items.reduce((s, i) => s + lineTotal(i), 0);
  const total = items.length ? subtotal + LIVRAISON : 0;

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
      const meta = data.user?.user_metadata || {};
      setName(meta.name || meta.full_name || "");
      setPhone(meta.phone || "");
      setAddress(meta.adresse_livraison || "");
      setPayEmail(data.user?.email || "");
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
    if (!adresseSignup.trim() || !nameSignup.trim()) {
      setError("Nom et adresse obligatoires.");
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
        setName(nameSignup.trim());
        setPhone(telSignup.replace(/\s/g, ""));
        setAddress(adresseSignup.trim());
        setPayEmail(emailOk);
      }
    } catch (e: any) {
      setError(/already|registered|exist/i.test(e.message) ? "Un compte existe déjà avec cet email." : e.message);
    } finally {
      setLoading(false);
    }
  }

  async function pay() {
    setError("");
    if (!name.trim() || !phone.trim() || !address.trim()) {
      setError("Nom, téléphone et adresse obligatoires.");
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

    const articles = items
      .map((i) => {
        const extras = [
          i.storage,
          i.color,
          i.charger ? "Chargeur" : null,
          i.icloud ? "iCloud" : null,
          `x${i.qty}`,
        ]
          .filter(Boolean)
          .join(" · ");
        return `${i.name}${extras ? " (" + extras + ")" : ""}`;
      })
      .join(" | ");

    const commande_id =
      "CMD-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7).toUpperCase();

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
          articles,
          commande_id,
          boutique_id:
            items[0]?.boutiqueId ||
            (typeof window !== "undefined" ? sessionStorage.getItem("sds_boutique_id") : null),
          boutique_nom:
            items[0]?.boutiqueNom ||
            (typeof window !== "undefined" ? sessionStorage.getItem("sds_boutique_nom") : null),
          has_icloud: items.some((i) => !!i.icloud),
          has_charger: items.some((i) => !!i.charger),
          livraison: LIVRAISON,
          payment_url: null,
          cart_items: items.map((i) => ({
            produit_id: Number(i.productId),
            table: "products",
            qty: i.qty,
            storage: i.storage || null,
            color: i.color || null,
            charger: !!i.charger,
            icloud: !!i.icloud,
          })),
          return_url: "https://sdsprotech.com/mes-commandes?statut=succes",
          cancel_url: "https://sdsprotech.com/panier?statut=annule",
        }),
      });

      const data: any = await res.json();
      if (res.ok && data.success && data.payment_url) {
        clearCart();
        window.location.href = data.payment_url;
      } else {
        setError(data.error || "Paiement indisponible. WhatsApp 77 069 97 39.");
      }
    } catch {
      setError("Failed to fetch — réseau ou CORS. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  if (!items.length) {
    return (
      <main style={{ paddingTop: 100, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#7a9abb" }}>
        Redirection…
      </main>
    );
  }

  return (
    <main style={{ paddingTop: 90, paddingBottom: 100, maxWidth: 560, margin: "0 auto", paddingLeft: 16, paddingRight: 16 }}>
      <div style={{ fontFamily: "DM Mono, monospace", fontSize: 10, letterSpacing: 2, color: "#00c8ff", marginBottom: 8 }}>
        // CHECKOUT
      </div>
      <h1 style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 28, fontWeight: 700, marginBottom: 20 }}>
        Finaliser la commande
      </h1>

      <div style={{ marginBottom: 20, padding: 14, borderRadius: 14, border: "1px solid rgba(0,200,255,0.15)", background: "rgba(0,200,255,0.04)" }}>
        {items.map((i, idx) => (
          <div key={idx} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13 }}>
            <span>
              {i.name} ×{i.qty}
              {(i.charger || i.icloud) && (
                <span style={{ color: "#7a9abb" }}>
                  {' '} {[i.charger && "Chargeur", i.icloud && "iCloud"].filter(Boolean).join(", ")}
                </span>
              )}
            </span>
            <span style={{ color: "#00c8ff" }}>{formatPrice(lineTotal(i))}</span>
          </div>
        ))}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, paddingTop: 10, borderTop: "1px solid rgba(0,200,255,0.15)", fontSize: 13, color: "#7a9abb" }}>
          <span>Livraison Dakar</span>
          <span>{formatPrice(LIVRAISON)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontWeight: 700 }}>
          <span>Total</span>
          <span style={{ color: "#00c8ff", fontSize: 20, fontFamily: "Rajdhani, sans-serif" }}>
            {formatPrice(total)} FCFA
          </span>
        </div>
      </div>

      {error && <div style={{ color: "#f87171", fontSize: 13, marginBottom: 12 }}>{error}</div>}

      {!user && (
        <div style={{ marginBottom: 20, padding: 16, borderRadius: 14, border: "1px solid rgba(0,200,255,0.2)" }}>
          <div style={{ fontWeight: 700, marginBottom: 12, color: "#00c8ff" }}>🔐 Connexion requise</div>
          <div style={{ display: "flex", gap: 0, background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: 3, marginBottom: 12 }}>
            <button type="button" onClick={() => setAuthTab("login")} style={{ flex: 1, padding: 8, border: "none", borderRadius: 8, cursor: "pointer", background: authTab === "login" ? "rgba(0,200,255,0.15)" : "transparent", color: authTab === "login" ? "#00c8ff" : "#7a9abb" }}>
              Se connecter
            </button>
            <button type="button" onClick={() => setAuthTab("signup")} style={{ flex: 1, padding: 8, border: "none", borderRadius: 8, cursor: "pointer", background: authTab === "signup" ? "rgba(0,200,255,0.15)" : "transparent", color: authTab === "signup" ? "#00c8ff" : "#7a9abb" }}>
              Créer un compte
            </button>
          </div>

          {authTab === "login" ? (
            <>
              <input style={input} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <input style={input} type="password" placeholder="Mot de passe" value={password} onChange={(e) => setPassword(e.target.value)} />
              <button type="button" disabled={loading} onClick={login} style={btnPrimary}>
                {loading ? "…" : "SE CONNECTER →"}
              </button>
            </>
          ) : (
            <>
              <input style={input} placeholder="Nom complet" value={nameSignup} onChange={(e) => setNameSignup(e.target.value)} />
              <input style={input} type="email" placeholder="Email (Gmail, Hotmail…)" value={email} onChange={(e) => setEmail(e.target.value)} />
              <input style={input} type="password" placeholder="Mot de passe (8 min)" value={password} onChange={(e) => setPassword(e.target.value)} />
              <input style={input} type="password" placeholder="Confirmer le mot de passe" value={password2} onChange={(e) => setPassword2(e.target.value)} />
              <input style={input} type="tel" placeholder="Téléphone (77 …)" value={telSignup} onChange={(e) => setTelSignup(e.target.value)} />
              <input style={input} placeholder="Adresse de livraison" value={adresseSignup} onChange={(e) => setAdresseSignup(e.target.value)} />
              <button type="button" disabled={loading} onClick={signup} style={btnPrimary}>
                {loading ? "…" : "CRÉER MON COMPTE →"}
              </button>
            </>
          )}
        </div>
      )}

      {user && (
        <>
          <div style={{ fontSize: 12, color: "#7a9abb", marginBottom: 8 }}>Adresse de livraison</div>
          <input style={input} value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom complet *" />
          <input style={input} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Téléphone *" />
          <input style={input} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Adresse complète *" />
          <input style={{ ...input, marginBottom: 16 }} value={payEmail} onChange={(e) => setPayEmail(e.target.value)} placeholder="Email" />

          <button type="button" disabled={loading} onClick={pay} style={btnPrimary}>
            {loading ? "⏳ Redirection…" : `💳 PAYER ${formatPrice(total)} FCFA →`}
          </button>
        </>
      )}

      <div style={{ marginTop: 16, textAlign: "center" }}>
        <Link href="/panier" style={{ color: "#7a9abb", fontSize: 13 }}>
          ← Retour au panier
        </Link>
      </div>
    </main>
  );
}
