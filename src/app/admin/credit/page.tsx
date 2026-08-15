"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Dossier = {
  dossier_id: string;
  client_nom?: string;
  client_tel?: string;
  client_email?: string;
  client_adresse?: string;
  numero_cni?: string;
  appareil?: string;
  prix_total?: number;
  montant_1?: number;
  montant_2?: number;
  montant_3?: number;
  montant_4?: number;
  paye_1?: boolean;
  paye_2?: boolean;
  paye_3?: boolean;
  paye_4?: boolean;
  statut_compte?: string;
  boutique_id?: string;
  created_at?: string;
  doc_cni?: string;
  doc_cni_verso?: string;
  doc_selfie?: string;
  doc_residence?: string;
};

async function getDocUrl(pathOrUrl?: string | null): Promise<string | null> {
  if (!pathOrUrl) return null;
  if (pathOrUrl.startsWith("http")) return pathOrUrl;

  const supabase = createClient();
  const path = pathOrUrl.replace(/^\/+/, "");
  const { data, error } = await supabase.storage.from("credit-docs").createSignedUrl(path, 3600);

  if (error) {
    console.error("credit-docs signedUrl", path, error.message);
    return null;
  }
  return data.signedUrl;
}

function formatPrice(n: number) {
  return Number(n || 0).toLocaleString("fr-FR");
}

function statusMeta(s?: string) {
  const v = (s || "en_verification").toLowerCase();
  if (v === "valide") return { label: "Validé", color: "#00e676" };
  if (v === "refuse" || v === "refusé") return { label: "Refusé", color: "#ff4444" };
  if (v === "livre" || v === "livré") return { label: "Livré", color: "#00e5ff" };
  return { label: "En vérification", color: "#ff9100" };
}

export default function AdminCreditPage() {
  const supabase = useMemo(() => createClient(), []);
  const [rows, setRows] = useState<Dossier[]>([]);
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [selected, setSelected] = useState<Dossier | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [docUrls, setDocUrls] = useState<Record<string, string | null>>({});
  const [docsLoading, setDocsLoading] = useState(false);

  useEffect(() => {
    if (!selected) {
      setDocUrls({});
      return;
    }
    let cancelled = false;
    setDocsLoading(true);
    (async () => {
      const entries = await Promise.all(
        (
          [
            ["cni", selected.doc_cni],
            ["verso", selected.doc_cni_verso],
            ["selfie", selected.doc_selfie],
            ["residence", selected.doc_residence],
          ] as const
        ).map(async ([k, v]) => [k, await getDocUrl(v)] as const)
      );
      if (cancelled) return;
      setDocUrls(Object.fromEntries(entries));
      setDocsLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [selected?.dossier_id]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("credit_phones")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) showToast("Erreur : " + error.message);
    setRows(data || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function adminAction(dossier_id: string, action: "valider" | "refuser" | "livre") {
    setActionLoading(true);
    try {
      // Prefer backend if available
      const res = await fetch("https://sdsprotech-backend.pages.dev/credit-admin-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dossier_id, action }),
      });
      const json: any = await res.json().catch(() => ({}));
      if (!res.ok) {
        // fallback direct DB
        const map: Record<string, string> = {
          valider: "valide",
          refuser: "refuse",
          livre: "livre",
        };
        const { error } = await supabase
          .from("credit_phones")
          .update({ statut_compte: map[action] })
          .eq("dossier_id", dossier_id);
        if (error) throw error;
      } else if (json && json.error) {
        throw new Error(json.error);
      }
      showToast(
        action === "valider" ? "✅ Dossier validé" : action === "refuser" ? "❌ Dossier refusé" : "📦 Marqué livré"
      );
      setSelected(null);
      load();
    } catch (e: any) {
      showToast("Erreur : " + (e.message || "action impossible"));
    } finally {
      setActionLoading(false);
    }
  }

  const filtered = rows.filter((d) => {
    const st = (d.statut_compte || "en_verification").toLowerCase();
    if (filter !== "all" && st !== filter) return false;
    if (!q.trim()) return true;
    const s = q.toLowerCase();
    return (
      (d.client_nom || "").toLowerCase().includes(s) ||
      (d.client_tel || "").toLowerCase().includes(s) ||
      (d.appareil || "").toLowerCase().includes(s) ||
      (d.dossier_id || "").toLowerCase().includes(s)
    );
  });

  const input: React.CSSProperties = {
    width: "100%",
    background: "rgba(0,100,255,0.06)",
    border: "1px solid rgba(0,180,255,0.18)",
    color: "#fff",
    padding: "11px 16px",
    borderRadius: 10,
    fontSize: 13,
    marginBottom: 12,
    outline: "none",
  };

  return (
    <div>
      <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 18, fontWeight: 700, letterSpacing: 2, marginBottom: 14 }}>
        🤝 Crédit Halal — Dossiers
      </div>

      <input
        style={input}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="🔍 Nom, téléphone, appareil, dossier_id…"
      />

      <div style={{ display: "flex", gap: 8, marginBottom: 16, overflowX: "auto" }}>
        {[
          ["all", "Tous"],
          ["en_verification", "En vérif."],
          ["valide", "Validés"],
          ["refuse", "Refusés"],
          ["livre", "Livrés"],
        ].map(([id, label]) => (
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

      {!loading && !filtered.length && (
        <div style={{ textAlign: "center", padding: 40, color: "#4a7a9b" }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>🤝</div>
          Aucun dossier crédit
        </div>
      )}

      {filtered.map((d) => {
        const st = statusMeta(d.statut_compte);
        const date = d.created_at ? new Date(d.created_at).toLocaleDateString("fr-FR") : "—";
        const paid = [d.paye_1, d.paye_2, d.paye_3, d.paye_4].filter(Boolean).length;

        return (
          <div
            key={d.dossier_id}
            style={{
              background: "#0a1f35",
              border: "1px solid rgba(0,180,255,0.18)",
              borderRadius: 14,
              padding: 16,
              marginBottom: 12,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
              <div style={{ fontSize: 10, color: "#4a7a9b", fontFamily: "DM Mono, monospace" }}>
                {d.dossier_id} · {date}
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: st.color }}>{st.label}</span>
            </div>

            <div style={{ fontWeight: 700, marginBottom: 4 }}>{d.client_nom || "—"}</div>
            <div style={{ fontSize: 13, color: "#c8dff5", marginBottom: 2 }}>📞 {d.client_tel || "—"}</div>
            <div style={{ fontSize: 13, color: "#c8dff5", marginBottom: 2 }}>📱 {d.appareil || "—"}</div>
            {d.boutique_id && (
              <div style={{ fontSize: 12, color: "#00e5ff", marginBottom: 2 }}>🏪 Boutique : {d.boutique_id}</div>
            )}
            <div style={{ fontSize: 12, color: "#4a7a9b", marginBottom: 8 }}>
              Versements payés : {paid}/4
            </div>
            <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 20, fontWeight: 700, color: "#00e5ff", marginBottom: 12 }}>
              {formatPrice(d.prix_total || 0)} FCFA
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Btn onClick={() => setSelected(d)} color="#6ab0ff">
                👁 Détail
              </Btn>
              <Btn onClick={() => adminAction(d.dossier_id, "valider")} color="#00e676">
                ✅ Valider
              </Btn>
              <Btn onClick={() => adminAction(d.dossier_id, "refuser")} color="#ff4444">
                ❌ Refuser
              </Btn>
              <Btn onClick={() => adminAction(d.dossier_id, "livre")} color="#00e5ff">
                📦 Livré
              </Btn>
            </div>
          </div>
        );
      })}

      {/* Modal détail */}
      {selected && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 200,
            background: "rgba(0,0,0,0.88)",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
            padding: 16,
            overflowY: "auto",
          }}
          onClick={(e) => e.target === e.currentTarget && setSelected(null)}
        >
          <div
            style={{
              background: "#0a1f35",
              border: "1px solid rgba(0,180,255,0.18)",
              borderRadius: 18,
              width: "100%",
              maxWidth: 520,
              margin: "auto",
              padding: 20,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
              <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 18, fontWeight: 700, color: "#00e5ff" }}>
                Dossier {selected.dossier_id}
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  border: "1px solid rgba(0,180,255,0.18)",
                  background: "rgba(255,255,255,0.06)",
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>

            <Line k="Client" v={selected.client_nom || "—"} />
            <Line k="Téléphone" v={selected.client_tel || "—"} />
            <Line k="Email" v={selected.client_email || "—"} />
            <Line k="Adresse" v={selected.client_adresse || "—"} />
            <Line k="CNI" v={selected.numero_cni || "—"} />
            <Line k="Appareil" v={selected.appareil || "—"} />
            <Line k="Boutique" v={selected.boutique_id || "SDS PRO"} />
            <Line k="Prix total" v={`${formatPrice(selected.prix_total || 0)} FCFA`} />

            <div style={{ marginTop: 12, marginBottom: 8, fontSize: 11, color: "#4a7a9b", fontFamily: "DM Mono, monospace" }}>
              VERSEMENTS
            </div>
            {[1, 2, 3, 4].map((n) => {
              const montant = (selected as any)[`montant_${n}`] || 0;
              const paye = !!(selected as any)[`paye_${n}`];
              return (
                <div
                  key={n}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "8px 0",
                    borderBottom: "1px solid rgba(0,180,255,0.12)",
                    fontSize: 13,
                  }}
                >
                  <span>
                    V{n} {n === 1 ? "(Acompte)" : ""}
                  </span>
                  <span style={{ color: paye ? "#00e676" : "#ff9100" }}>
                    {formatPrice(montant)} · {paye ? "Payé" : "En attente"}
                  </span>
                </div>
              );
            })}

            {/* Documents client */}
            <div style={{ marginTop: 16, borderTop: "1px solid rgba(0,180,255,0.2)", paddingTop: 12 }}>
              <div style={{ fontWeight: 600, color: "#00c8ff", marginBottom: 10 }}>
                Documents
              </div>
              {selected.numero_cni && (
                <div style={{ fontSize: 13, color: "#9eb6d0", marginBottom: 8 }}>
                  N° CNI : {selected.numero_cni}
                </div>
              )}
              <DocLink label="CNI recto" raw={selected.doc_cni} url={docUrls.cni} loading={docsLoading} />
              <DocLink label="CNI verso" raw={selected.doc_cni_verso} url={docUrls.verso} loading={docsLoading} />
              <DocLink label="Selfie" raw={selected.doc_selfie} url={docUrls.selfie} loading={docsLoading} />
              <DocLink label="Résidence" raw={selected.doc_residence} url={docUrls.residence} loading={docsLoading} />
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
              <Btn
                onClick={() => adminAction(selected.dossier_id, "valider")}
                color="#00e676"
                disabled={actionLoading}
              >
                ✅ Valider
              </Btn>
              <Btn
                onClick={() => adminAction(selected.dossier_id, "refuser")}
                color="#ff4444"
                disabled={actionLoading}
              >
                ❌ Refuser
              </Btn>
              <Btn
                onClick={() => adminAction(selected.dossier_id, "livre")}
                color="#00e5ff"
                disabled={actionLoading}
              >
                📦 Livré
              </Btn>
            </div>
          </div>
        </div>
      )}

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

function DocLink({
  label,
  raw,
  url,
  loading,
}: {
  label: string;
  raw?: string | null;
  url?: string | null;
  loading?: boolean;
}) {
  if (!raw) {
    return (
      <div style={{ fontSize: 13, color: "#7a9abb", marginBottom: 8 }}>
        {label} : <em>non fourni</em>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ fontSize: 13, color: "#7a9abb", marginBottom: 8 }}>
        {label} : chargement…
      </div>
    );
  }

  if (!url) {
    return (
      <div style={{ fontSize: 13, color: "#f87171", marginBottom: 8 }}>
        {label} : <em>échec de chargement — bucket ou chemin invalide ({raw.slice(0, 40)}{raw.length > 40 ? "…" : ""})</em>
      </div>
    );
  }

  const isImg = /\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(url);

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 12, color: "#9eb6d0", marginBottom: 6 }}>{label}</div>
      {isImg ? (
        <a href={url} target="_blank" rel="noreferrer">
          <img
            src={url}
            alt={label}
            style={{
              maxWidth: "100%",
              maxHeight: 160,
              borderRadius: 8,
              border: "1px solid rgba(0,180,255,0.25)",
            }}
          />
        </a>
      ) : (
        <a href={url} target="_blank" rel="noreferrer" style={{ color: "#00c8ff", fontSize: 13 }}>
          Ouvrir →
        </a>
      )}
    </div>
  );
}

function Line({ k, v }: { k: string; v: string }) {
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 6, fontSize: 13 }}>
      <span style={{ minWidth: 90, color: "#4a7a9b", fontFamily: "DM Mono, monospace", fontSize: 10 }}>{k}</span>
      <span style={{ color: "#c8dff5" }}>{v}</span>
    </div>
  );
}

function Btn({
  children,
  onClick,
  color,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  color: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      style={{
        flex: 1,
        minWidth: 90,
        padding: "9px 10px",
        borderRadius: 8,
        fontSize: 11,
        fontWeight: 700,
        cursor: disabled ? "not-allowed" : "pointer",
        border: `1px solid ${color}55`,
        background: `${color}22`,
        color,
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {children}
    </button>
  );
}
