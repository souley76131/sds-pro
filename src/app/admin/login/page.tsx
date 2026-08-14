"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AdminLoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function login() {
    setError("");
    setLoading(true);
    try {
      const { data, error: err } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (err) throw err;

      const { data: profile } = await supabase
        .from("profiles")
        .select("role,full_name")
        .eq("id", data.user.id)
        .single();

      if (!profile || profile.role !== "admin") {
        await supabase.auth.signOut();
        setError("Accès refusé — compte non autorisé");
        return;
      }

      router.replace("/admin");
    } catch (e: any) {
      setError("Email ou mot de passe incorrect");
    } finally {
      setLoading(false);
    }
  }

  const input: React.CSSProperties = {
    width: "100%",
    background: "rgba(0,100,255,0.06)",
    border: "1px solid rgba(0,180,255,0.18)",
    color: "#fff",
    padding: "13px 16px",
    borderRadius: 10,
    fontSize: 14,
    marginBottom: 12,
    outline: "none",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#020912",
        padding: 20,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 380,
          background: "#0a1f35",
          border: "1px solid rgba(0,180,255,0.18)",
          borderRadius: 20,
          padding: "40px 32px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontFamily: "Rajdhani, sans-serif",
            fontSize: 36,
            fontWeight: 700,
            color: "#00e5ff",
            letterSpacing: 4,
          }}
        >
          SDS
        </div>
        <div
          style={{
            fontSize: 12,
            color: "#4a7a9b",
            letterSpacing: 2,
            marginBottom: 32,
            fontFamily: "DM Mono, monospace",
          }}
        >
          {"// PANNEAU ADMINISTRATION"}
        </div>

        <input
          style={input}
          type="email"
          placeholder="Email admin"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          style={input}
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && login()}
        />

        <button
          type="button"
          onClick={login}
          disabled={loading}
          style={{
            width: "100%",
            background: "linear-gradient(135deg,#0050ff,#00e5ff)",
            color: "#fff",
            border: "none",
            padding: 14,
            borderRadius: 10,
            fontFamily: "Rajdhani, sans-serif",
            fontWeight: 700,
            fontSize: 16,
            letterSpacing: 2,
            cursor: "pointer",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "…" : "ACCÉDER →"}
        </button>

        {error && (
          <div style={{ color: "#ff6b6b", fontSize: 12, marginTop: 12 }}>{error}</div>
        )}
      </div>
    </div>
  );
}
