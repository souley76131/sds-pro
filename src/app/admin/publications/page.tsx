"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Pub = {
  id: string;
  auteur_type: "sds" | "boutique";
  boutique_id: string | null;
  titre: string;
  sous_titre: string | null;
  media_url: string | null;
  media_type: "image" | "video";
  lien_url: string | null;
  ordre: number;
  actif: boolean;
};

const emptyForm = {
  titre: "",
  sous_titre: "",
  media_url: "",
  media_type: "image" as "image" | "video",
  lien_url: "",
  ordre: 0,
  actif: true,
};

export default function AdminPublicationsPage() {
  const [pubs, setPubs] = useState<Pub[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("publications")
      .select("*")
      .order("ordre", { ascending: true });
    setLoading(false);
    if (error) {
      setMsg("Erreur chargement : " + error.message);
      setPubs([]);
      return;
    }
    setPubs((data as Pub[]) || []);
  }

  useEffect(() => {
    load();
  }, []);

  function startEdit(p: Pub) {
    setEditId(p.id);
    setForm({
      titre: p.titre || "",
      sous_titre: p.sous_titre || "",
      media_url: p.media_url || "",
      media_type: (p.media_type as "image" | "video") || "image",
      lien_url: p.lien_url || "",
      ordre: p.ordre ?? 0,
      actif: !!p.actif,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setEditId(null);
    setForm(emptyForm);
  }

  async function save() {
    if (!form.titre.trim()) {
      setMsg("Titre obligatoire");
      return;
    }
    setSaving(true);
    setMsg("");
    const supabase = createClient();
    const payload = {
      auteur_type: "sds" as const,
      boutique_id: null,
      titre: form.titre.trim(),
      sous_titre: form.sous_titre.trim() || null,
      media_url: form.media_url.trim() || null,
      media_type: form.media_type,
      lien_url: form.lien_url.trim() || null,
      ordre: Number(form.ordre) || 0,
      actif: form.actif,
    };

    let error;
    if (editId) {
      ({ error } = await supabase.from("publications").update(payload).eq("id", editId));
    } else {
      ({ error } = await supabase.from("publications").insert(payload));
    }
    setSaving(false);
    if (error) {
      setMsg("Erreur : " + error.message);
      return;
    }
    setMsg(editId ? "Publication mise à jour" : "Publication créée");
    resetForm();
    await load();
  }

  async function toggleActif(p: Pub) {
    const supabase = createClient();
    const { error } = await supabase
      .from("publications")
      .update({ actif: !p.actif })
      .eq("id", p.id);
    if (error) {
      setMsg(error.message);
      return;
    }
    await load();
  }

  async function remove(id: string) {
    if (!confirm("Supprimer cette publication ?")) return;
    const supabase = createClient();
    const { error } = await supabase.from("publications").delete().eq("id", id);
    if (error) {
      setMsg(error.message);
      return;
    }
    if (editId === id) resetForm();
    await load();
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid rgba(0,180,255,0.3)",
    background: "rgba(0,0,0,0.35)",
    color: "#fff",
    fontSize: 14,
    marginBottom: 10,
  };

  return (
    <main style={{ padding: "24px 16px", maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ fontFamily: "Rajdhani, sans-serif", color: "#00c8ff", marginTop: 0 }}>
        Publications (bandeau catalogue)
      </h1>
      <p style={{ color: "#9eb6d0", fontSize: 14 }}>
        Pubs SDS PRO affichées sur /catalogue. Image ou vidéo en URL (Storage, CDN…).
      </p>

      {/* Formulaire */}
      <div
        style={{
          padding: 16,
          borderRadius: 12,
          border: "1px solid rgba(0,180,255,0.25)",
          background: "rgba(4,16,28,0.8)",
          marginBottom: 24,
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: 12, color: "#fff" }}>
          {editId ? "Modifier la publication" : "Nouvelle publication SDS"}
        </div>
        <input
          placeholder="Titre *"
          value={form.titre}
          onChange={(e) => setForm({ ...form, titre: e.target.value })}
          style={inputStyle}
        />
        <textarea
          placeholder="Sous-titre"
          value={form.sous_titre}
          onChange={(e) => setForm({ ...form, sous_titre: e.target.value })}
          rows={2}
          style={{ ...inputStyle, resize: "vertical" }}
        />
        <input
          placeholder="URL image ou vidéo"
          value={form.media_url}
          onChange={(e) => setForm({ ...form, media_url: e.target.value })}
          style={inputStyle}
        />
        <select
          value={form.media_type}
          onChange={(e) =>
            setForm({ ...form, media_type: e.target.value as "image" | "video" })
          }
          style={inputStyle}
        >
          <option value="image">Image</option>
          <option value="video">Vidéo</option>
        </select>
        <input
          placeholder="Lien CTA (ex. /credit-halal)"
          value={form.lien_url}
          onChange={(e) => setForm({ ...form, lien_url: e.target.value })}
          style={inputStyle}
        />
        <input
          type="number"
          placeholder="Ordre"
          value={form.ordre}
          onChange={(e) => setForm({ ...form, ordre: Number(e.target.value) })}
          style={inputStyle}
        />
        <label style={{ display: "flex", alignItems: "center", gap: 8, color: "#c8dff5", marginBottom: 12 }}>
          <input
            type="checkbox"
            checked={form.actif}
            onChange={(e) => setForm({ ...form, actif: e.target.checked })}
          />
          Active (visible sur le catalogue)
        </label>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            style={{
              padding: "10px 18px",
              borderRadius: 8,
              border: "none",
              background: "linear-gradient(135deg,#0055ff,#00c8ff)",
              color: "#fff",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {saving ? "…" : editId ? "Enregistrer" : "Créer"}
          </button>
          {editId && (
            <button type="button" onClick={resetForm} style={{ padding: "10px 14px", borderRadius: 8 }}>
              Annuler
            </button>
          )}
        </div>
        {msg && <p style={{ marginTop: 10, fontSize: 13, color: "#9eb6d0" }}>{msg}</p>}
      </div>

      {/* Liste */}
      {loading && <p style={{ color: "#7a9abb" }}>Chargement…</p>}
      {!loading && pubs.length === 0 && (
        <p style={{ color: "#7a9abb" }}>Aucune publication.</p>
      )}
      {pubs.map((p) => (
        <div
          key={p.id}
          style={{
            display: "flex",
            gap: 12,
            padding: 12,
            marginBottom: 10,
            borderRadius: 12,
            border: "1px solid rgba(0,180,255,0.2)",
            background: "rgba(0,0,0,0.25)",
            alignItems: "center",
          }}
        >
          {p.media_url && p.media_type === "image" && (
            <img
              src={p.media_url}
              alt=""
              style={{ width: 72, height: 48, objectFit: "cover", borderRadius: 8 }}
            />
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, color: "#fff" }}>
              #{p.ordre} · {p.titre}
              {!p.actif && (
                <span style={{ marginLeft: 8, fontSize: 11, color: "#f87171" }}>inactive</span>
              )}
            </div>
            <div style={{ fontSize: 12, color: "#7a9abb" }}>
              {p.lien_url || "—"} · {p.media_type}
            </div>
          </div>
          <button type="button" onClick={() => startEdit(p)} style={{ fontSize: 12 }}>
            Modifier
          </button>
          <button type="button" onClick={() => toggleActif(p)} style={{ fontSize: 12 }}>
            {p.actif ? "Désactiver" : "Activer"}
          </button>
          <button type="button" onClick={() => remove(p.id)} style={{ fontSize: 12, color: "#f87171" }}>
            Supprimer
          </button>
        </div>
      ))}
    </main>
  );
}
