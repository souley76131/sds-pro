"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ConnexionPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [tel, setTel] = useState("");
  const [adresse, setAdresse] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function getCatalogueTargetFromParams(params: URLSearchParams) {
    const boutiqueId = params.get("boutique_id");
    if (boutiqueId && typeof window !== "undefined") {
      window.sessionStorage.setItem("sds_boutique_id", boutiqueId);
    }
    return boutiqueId ? `/catalogue?boutique=${encodeURIComponent(boutiqueId)}` : "/catalogue";
  }

  function getRedirectTarget() {
    if (typeof window === "undefined") return "/mon-credit";
    const params = new URLSearchParams(window.location.search);
    const explicitRedirect = params.get("redirect");
    if (explicitRedirect) {
      if (explicitRedirect.startsWith("/achat-direct")) {
        const [, query = ""] = explicitRedirect.split("?");
        return getCatalogueTargetFromParams(new URLSearchParams(query));
      }
      return explicitRedirect;
    }

    if (!["produit_id", "appareil", "prix", "boutique_id"].some((key) => params.has(key))) {
      return "/mon-credit";
    }

    return getCatalogueTargetFromParams(params);
  }

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        router.replace(getRedirectTarget());
      }
    });
  }, [router]);

  async function connexion() {
    setError("");
    if (!email || !password) {
      setError("Email et mot de passe requis.");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) {
      setError("Email ou mot de passe incorrect.");
      return;
    }
    router.push(getRedirectTarget());
  }

  async function inscription() {
    setError("");
    const emailOk = email.trim().toLowerCase();
    const domaines = [
      "gmail.com", "googlemail.com", "hotmail.com", "hotmail.fr",
      "outlook.com", "outlook.fr", "live.com", "yahoo.com", "yahoo.fr", "icloud.com",
    ];
    const domaine = emailOk.split("@")[1] || "";
    if (!domaines.includes(domaine)) {
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
    const telClean = tel.replace(/\s+/g, "").replace(/^\+221/, "");
    if (!/^(70|71|75|76|77|78)\d{7}$/.test(telClean)) {
      setError("Numéro sénégalais invalide (70, 71, 75, 76, 77, 78).");
      return;
    }
    if (!adresse.trim()) {
      setError("Adresse requise.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.signUp({
      email: emailOk,
      password,
      options: {
        data: { phone: telClean, adresse: adresse.trim() },
      },
    });
    setLoading(false);
    if (err) {
      setError(/registered|exist/i.test(err.message)
        ? "Un compte existe déjà avec cet email."
        : "Erreur : " + err.message);
      return;
    }
    router.push(getRedirectTarget());
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "100px 20px 40px",
        background: "#020912",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: "linear-gradient(160deg, #071828, #040f1e)",
          border: "1px solid rgba(0,180,255,0.22)",
          borderRadius: 20,
          padding: "30px 26px",
        }}
      >
        <div
          style={{
            fontFamily: "Rajdhani, sans-serif",
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: 2,
            textAlign: "center",
            marginBottom: 4,
          }}
        >
          <span style={{ color: "#fff" }}>SECK</span>{" "}
          <span style={{ color: "#00c8ff" }}>DIGITAL</span>{" "}
          <span style={{ color: "#fff" }}>SERVICES</span>{" "}
          <span style={{ color: "#00c8ff" }}>PRO</span>
        </div>
        <div
          style={{
            textAlign: "center",
            color: "#7a9abb",
            fontSize: 12,
            fontFamily: "DM Mono, monospace",
            letterSpacing: 2,
            marginBottom: 24,
          }}
        >
          {mode === "login" ? "Connexion client" : "Créer un compte client"}
        </div>

        <Field label="Email">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
            placeholder="vous@gmail.com"
          />
        </Field>

        <Field label="Mot de passe">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
            onKeyDown={(e) => e.key === "Enter" && mode === "login" && connexion()}
          />
        </Field>

        {mode === "signup" && (
          <>
            <Field label="Confirmer le mot de passe">
              <input
                type="password"
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
                style={inputStyle}
              />
            </Field>
            <Field label="Téléphone (Sénégal)">
              <input
                type="tel"
                value={tel}
                onChange={(e) => setTel(e.target.value)}
                placeholder="77 123 45 67"
                style={inputStyle}
              />
            </Field>
            <Field label="Adresse">
              <input
                type="text"
                value={adresse}
                onChange={(e) => setAdresse(e.target.value)}
                placeholder="Quartier, ville…"
                style={inputStyle}
              />
            </Field>
          </>
        )}

        <button
          onClick={mode === "login" ? connexion : inscription}
          disabled={loading}
          style={btnStyle}
        >
          {loading
            ? "…"
            : mode === "login"
            ? "Se connecter"
            : "Créer mon compte"}
        </button>

        {error && (
          <p style={{ color: "#ff5a6e", fontSize: 13, marginTop: 12, textAlign: "center" }}>
            {error}
          </p>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 16,
            fontSize: 13,
          }}
        >
          <button
            onClick={() => {
              setError("");
              setMode(mode === "login" ? "signup" : "login");
            }}
            style={{
              background: "none",
              border: "none",
              color: "#00c8ff",
              cursor: "pointer",
              padding: 0,
            }}
          >
            {mode === "login" ? "Créer un compte" : "← J’ai déjà un compte"}
          </button>
          <Link href="/" style={{ color: "#7a9abb", textDecoration: "none" }}>
            ← Accueil
          </Link>
        </div>

        <div style={{ textAlign: "center", marginTop: 20, fontSize: 12, color: "#7a9abb" }}>
          Vous êtes une boutique ?{" "}
          <Link href="/espace-partenaire" style={{ color: "#00c8ff" }}>
            Espace partenaire
          </Link>
        </div>
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label
        style={{
          display: "block",
          fontSize: 11,
          color: "#7a9abb",
          letterSpacing: 1,
          marginBottom: 6,
          textTransform: "uppercase",
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
  background: "rgba(0,20,40,0.6)",
  border: "1.5px solid rgba(0,180,255,0.22)",
  borderRadius: 12,
  padding: 14,
  color: "#fff",
  fontSize: 15,
  outline: "none",
  boxSizing: "border-box",
};

const btnStyle: React.CSSProperties = {
  width: "100%",
  background: "linear-gradient(135deg, #0055ff, #00c8ff)",
  border: "none",
  borderRadius: 12,
  padding: 15,
  color: "#fff",
  fontSize: 15,
  fontWeight: 600,
  cursor: "pointer",
  marginTop: 4,
};
