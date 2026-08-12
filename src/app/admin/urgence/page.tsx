"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Settings = {
  id?: number | string;
  boutique_fermee?: boolean;
  message_urgence?: string;
  updated_at?: string;
};

export default function AdminUrgencePage() {
  const supabase = useMemo(() => createClient(), []);
  const [fermee, setFermee] = useState(false);
  const [message, setMessage] = useState(
    "Boutique temporairement fermée. Réouverture bientôt. Merci de votre compréhension."
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [rowId, setRowId] = useState<number | string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }

  async function load() {
    setLoading(true);
    // Table settings / site_settings / config
    const { data } = await supabase.from("settings").select("*").limit(1);
    if (data && data[0]) {
      const s = data[0] as Settings;
      setRowId(s.id ?? 1);
      setFermee(!!s.boutique_fermee);
      if (s.message_urgence) setMessage(s.message_urgence);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function save(nextFermee?: boolean) {
    setSaving(true);
    const payload = {
      boutique_fermee: typeof nextFermee === "boolean" ? nextFermee : fermee,
      message_urgence: message.trim(),
      updated_at: new Date().toISOString(),
    };

    let error;
    if (rowId != null) {
      ({ error } = await supabase.from("settings").update(payload).eq("id", rowId));
    } else {
      const res = await supabase.from("settings").insert(payload).select("id").single();
      error = res.error;
      if (res.data?.id) setRowId(res.data.id);
    }

    // Fallback table site_config
    if (error) {
      const res2 = await supabase.from("site_config").upsert({
        key: "urgence",
        value: payload,
        updated_at: new Date().toISOString(),
      });
      error = res2.error;
    }

    setSaving(false);
    if (error) {
      showToast("Erreur : " + error.message + " (crée table settings si besoin)");
      return;
    }
    if (typeof nextFermee === "boolean") setFermee(nextFermee);
    showToast(payload.boutique_fermee ? "🔴 Boutique fermée" : "✅ Boutique ouverte");
  }

  if (loading) {
    return <div style={{ color: "#4a7a9b", textAlign: "center", padding: 40 }}>Chargement…</div>;
  }

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
        🔴 Mode urgence
      </div>

      <div
        style={{
          background: fermee ? "rgba(255,68,68,0.1)" : "rgba(0,230,118,0.08)",
          border: `1px solid ${fermee ? "rgba(255,68,68,0.35)" : "rgba(0,230,118,0.3)"}`,
          borderRadius: 16,
          padding: 18,
          marginBottom: 16,
        }}
      >
        <div style={{ fontSize: 13, color: "#7a9abb", marginBottom: 8 }}>État actuel</div>
        <div
          style={{
            fontFamily: "Rajdhani, sans-serif",
            fontSize: 28,
            fontWeight: 700,
            color: fermee ? "#ff4444" : "#00e676",
          }}
        >
          {fermee ? "BOUTIQUE FERMÉE" : "BOUTIQUE OUVERTE"}
        </div>
        <div style={{ fontSize: 12, color: "#4a7a9b", marginTop: 6 }}>
          Quand fermée, le site public peut afficher le message d’urgence.
        </div>
      </div>

      <div style={{ fontSize: 12, color: "#4a7a9b", marginBottom: 8, fontFamily: "DM Mono, monospace" }}>
        MESSAGE AFFICHÉ AUX CLIENTS
      </div>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={4}
        style={{
          width: "100%",
          background: "rgba(0,100,255,0.06)",
          border: "1px solid rgba(0,180,255,0.18)",
          color: "#fff",
          padding: "12px 14px",
          borderRadius: 10,
          fontSize: 13,
          marginBottom: 14,
          outline: "none",
          resize: "vertical",
        }}
      />

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button
          type="button"
          disabled={saving}
          onClick={() => save(true)}
          style={{
            flex: 1,
            minWidth: 140,
            padding: 14,
            borderRadius: 10,
            border: "1px solid rgba(255,68,68,0.4)",
            background: "rgba(255,68,68,0.15)",
            color: "#ff6b6b",
            fontFamily: "Rajdhani, sans-serif",
            fontWeight: 700,
            fontSize: 14,
            letterSpacing: 1,
            cursor: "pointer",
            opacity: saving ? 0.7 : 1,
          }}
        >
          🔴 FERMER LA BOUTIQUE
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => save(false)}
          style={{
            flex: 1,
            minWidth: 140,
            padding: 14,
            borderRadius: 10,
            border: "1px solid rgba(0,230,118,0.4)",
            background: "rgba(0,230,118,0.12)",
            color: "#00e676",
            fontFamily: "Rajdhani, sans-serif",
            fontWeight: 700,
            fontSize: 14,
            letterSpacing: 1,
            cursor: "pointer",
            opacity: saving ? 0.7 : 1,
          }}
        >
          ✅ ROUVRIR
        </button>
      </div>

      <button
        type="button"
        disabled={saving}
        onClick={() => save()}
        style={{
          width: "100%",
          marginTop: 12,
          padding: 13,
          borderRadius: 10,
          border: "none",
          background: "linear-gradient(135deg,#0050ff,#00e5ff)",
          color: "#fff",
          fontWeight: 700,
          cursor: "pointer",
          opacity: saving ? 0.7 : 1,
        }}
      >
        {saving ? "…" : "Enregistrer le message"}
      </button>

      <div
        style={{
          marginTop: 20,
          padding: 14,
          borderRadius: 12,
          background: "rgba(255,145,0,0.08)",
          border: "1px solid rgba(255,145,0,0.25)",
          fontSize: 12,
          color: "#c8dff5",
          lineHeight: 1.5,
        }}
      >
        <strong style={{ color: "#ff9100" }}>SQL rapide</strong> si la table n’existe pas encore :
        <pre style={{ marginTop: 8, whiteSpace: "pre-wrap", color: "#7a9abb", fontSize: 11 }}>
{`create table if not exists settings (
  id bigint primary key generated always as identity,
  boutique_fermee boolean default false,
  message_urgence text,
  updated_at timestamptz default now()
);`}
        </pre>
      </div>

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
