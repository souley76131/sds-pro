"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Notif = {
  id: number | string;
  titre: string | null;
  message: string | null;
  type: string | null;
  lu: boolean | null;
  created_at: string | null;
};

export default function AdminMessageriePage() {
  const supabase = useMemo(() => createClient(), []);
  const [rows, setRows] = useState<Notif[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"tous" | "non_lus">("tous");

  async function load() {
    setLoading(true);
    setError("");

    let q = supabase
      .from("notifications")
      .select("id, titre, message, type, lu, created_at")
      .eq("pour_admin", true)
      .order("created_at", { ascending: false })
      .limit(100);

    if (filter === "non_lus") q = q.eq("lu", false);

    const { data, error: err } = await q;
    setLoading(false);

    if (err) {
      setError(err.message);
      setRows([]);
      return;
    }
    setRows(data || []);
  }

  useEffect(() => {
    load();
  }, [filter]);

  async function markRead(id: number | string) {
    await supabase.from("notifications").update({ lu: true }).eq("id", id);
    load();
  }

  async function markAllRead() {
    await supabase.from("notifications").update({ lu: true }).eq("pour_admin", true).eq("lu", false);
    load();
  }

  const nonLus = rows.filter((n) => !n.lu).length;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
        <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 18, fontWeight: 700, letterSpacing: 2 }}>
          💬 Messagerie {nonLus > 0 ? `(${nonLus})` : ""}
        </div>
        {nonLus > 0 && (
          <button
            type="button"
            onClick={markAllRead}
            style={{
              padding: "6px 12px",
              borderRadius: 8,
              border: "1px solid rgba(0,200,255,0.3)",
              background: "rgba(0,180,255,0.1)",
              color: "#6ab0ff",
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Tout marquer lu
          </button>
        )}
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {(
          [
            ["tous", "Toutes"],
            ["non_lus", "Non lues"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id)}
            style={{
              padding: "7px 14px",
              borderRadius: 100,
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
              whiteSpace: "nowrap",
              border: filter === id ? "none" : "1px solid rgba(0,180,255,0.18)",
              background: filter === id ? "linear-gradient(135deg,#0050ff,#00e5ff)" : "rgba(0,100,255,0.04)",
              color: filter === id ? "#fff" : "#4a7a9b",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {loading && <div style={{ color: "#4a7a9b", textAlign: "center", padding: 30 }}>Chargement…</div>}
      {error && <div style={{ color: "#f87171", fontSize: 13, marginBottom: 12 }}>Erreur : {error}</div>}

      {!loading && !error && !rows.length && (
        <div style={{ textAlign: "center", padding: 40, color: "#4a7a9b" }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>💬</div>
          Aucun message
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {rows.map((n) => (
          <button
            key={String(n.id)}
            type="button"
            onClick={() => !n.lu && markRead(n.id)}
            style={{
              textAlign: "left",
              padding: 16,
              borderRadius: 14,
              border: `1px solid ${n.lu ? "rgba(0,180,255,0.18)" : "rgba(0,200,255,0.4)"}`,
              background: n.lu ? "#0a1f35" : "rgba(0,180,255,0.08)",
              cursor: n.lu ? "default" : "pointer",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
              {!n.lu && (
                <span style={{ marginTop: 4, width: 7, height: 7, borderRadius: "50%", background: "#e11d48", flexShrink: 0 }} />
              )}
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontWeight: 700, color: "#fff" }}>{n.titre || "Notification"}</div>
                <div style={{ color: "#c8dff5", fontSize: 13, marginTop: 4 }}>{n.message}</div>
                <div style={{ color: "#4a7a9b", fontSize: 10, marginTop: 6, fontFamily: "DM Mono, monospace" }}>
                  {n.type || "info"}
                  {n.created_at ? ` · ${new Date(n.created_at).toLocaleString("fr-FR")}` : ""}
                  {n.lu ? " · lu" : " · non lu"}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
