"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Boutique = {
  id: string;
  nom: string;
  proprietaire?: string;
  ville?: string;
  logo_url?: string;
  hero_videos?: string[] | string | null;
};

export default function EspacePartenairePage() {
  const [view, setView] = useState<"loading" | "login" | "signup" | "createBoutique" | "app">("loading");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [telSignup, setTelSignup] = useState("");
  const [adresseSignup, setAdresseSignup] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [boutique, setBoutique] = useState<Boutique | null>(null);
  const [tab, setTab] = useState<"cmd" | "prod" | "vers" | "msg" | "vitrine">("cmd");

  const [heroVideos, setHeroVideos] = useState<string[]>([]);
  const [newVideoUrl, setNewVideoUrl] = useState("");
  const [videoMsg, setVideoMsg] = useState("");

  const [nom, setNom] = useState("");
  const [prop, setProp] = useState("");
  const [tel, setTel] = useState("");
  const [ville, setVille] = useState("");
  const [quartier, setQuartier] = useState("");
  const [payout, setPayout] = useState("");
  const [merci, setMerci] = useState(false);

  const [stats, setStats] = useState({ ca: 0, attente: 0, cmd: 0 });

  const [commandes, setCommandes] = useState<any[]>([]);
  const [cmdLoading, setCmdLoading] = useState(false);
  const [versements, setVersements] = useState<any[]>([]);
  const [versLoading, setVersLoading] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [msgText, setMsgText] = useState("");
  const [msgSending, setMsgSending] = useState(false);
  const [recording, setRecording] = useState(false);
  const [cancelVocal, setCancelVocal] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const cancelVocalRef = useRef(false);

  const [produits, setProduits] = useState<any[]>([]);
  const [prodLoading, setProdLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [pNom, setPNom] = useState("");
  const [pModele, setPModele] = useState("");
  const [pPrix, setPPrix] = useState("");
  const [pEmoji, setPEmoji] = useState("📱");
  const [pMarque, setPMarque] = useState("");
  const [pEtat, setPEtat] = useState("");
  const [pSpecs, setPSpecs] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [video, setVideo] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string[]>([]);
  const [videoName, setVideoName] = useState("");
  const [prodErr, setProdErr] = useState("");
  const [prodSaving, setProdSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");

  useEffect(() => {
    demarrer();
  }, []);

  async function demarrer() {
    const supabase = createClient();
    const { data: sess } = await supabase.auth.getSession();
    if (!sess?.session) {
      setView("login");
      return;
    }
    const { data: bid, error } = await supabase.rpc("ma_boutique");
    if (error || !bid) {
      setView("createBoutique");
      setEmail(sess.session.user.email || "");
      return;
    }
    const { data: rows } = await supabase
      .from("boutiques")
      .select("id,nom,logo_url,proprietaire,ville,hero_videos")
      .eq("id", bid)
      .limit(1);
    setBoutique((rows && rows[0]) || { id: bid, nom: "Ma boutique" });
    setView("app");
    chargerResume();
    chargerCommandes();
  }

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
    await demarrer();
  }

  async function creerCompte() {
    setError("");

    const emailOk = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailRegex.test(emailOk)) {
      setError("Email invalide.");
      return;
    }
    const domaine = emailOk.split("@")[1] || "";
    const domainesRefuses = ["nimportequoi.com", "example.com", "test.com", "localhost", "local"];
    if (domainesRefuses.includes(domaine)) {
      setError("Domaine email non accepté.");
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

    // Téléphone Sénégal : 77 78 76 75 71 70
    const telClean = telSignup.replace(/\s+/g, "").replace(/^\+221/, "");
    if (!/^(70|71|75|76|77|78)\d{7}$/.test(telClean)) {
      setError("Numéro invalide. Utilisez un numéro sénégalais (70, 71, 75, 76, 77, 78).");
      return;
    }

    if (!adresseSignup.trim()) {
      setError("Adresse de livraison requise.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.signUp({
      email: emailOk,
      password,
      options: {
        data: {
          phone: telClean,
          full_name: "",
          adresse: adresseSignup.trim(),
        },
      },
    });
    setLoading(false);

    if (err) {
      setError(
        /registered|exist/i.test(err.message)
          ? "Un compte existe déjà avec cet email."
          : "Erreur : " + err.message
      );
      return;
    }
    await demarrer();
  }
  async function creerBoutique() {
    setError("");
    if (!nom || !prop || !tel) {
      setError("Nom, gérant et téléphone sont requis.");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error: err } = await supabase.rpc("rpc_inscription_partenaire", {
      p_nom: nom,
      p_proprietaire: prop,
      p_telephone: tel,
      p_ville: ville,
      p_quartier: quartier,
      p_description: null,
      p_payout_numero: payout,
    });
    setLoading(false);
    if (err) {
      setError("Erreur : " + err.message);
      return;
    }
    setMerci(true);
  }

  async function deconnexion() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setBoutique(null);
    setView("login");
    setEmail("");
    setPassword("");
  }

  useEffect(() => {
    if (!boutique?.id) return;
    const raw = boutique.hero_videos;
    let list: string[] = [];
    if (Array.isArray(raw)) {
      list = raw;
    } else if (typeof raw === "string") {
      try {
        list = JSON.parse(raw || "[]");
      } catch {
        list = [];
      }
    }
    setHeroVideos(list.filter(Boolean));
  }, [boutique?.id]);

  async function saveVideos(next: string[]) {
    setVideoMsg("");
    const supabase = createClient();
    const { error } = await supabase
      .from("boutiques")
      .update({ hero_videos: next })
      .eq("id", boutique?.id);
    if (error) {
      setVideoMsg("Erreur : " + error.message);
      return;
    }
    setHeroVideos(next);
    setVideoMsg("✓ Vidéos enregistrées");
    setTimeout(() => setVideoMsg(""), 3000);
  }

  async function addVideo() {
    const url = newVideoUrl.trim();
    if (!url) {
      setVideoMsg("URL requise");
      return;
    }
    if (!/^https?:\/\//i.test(url)) {
      setVideoMsg("URL invalide (doit commencer par http:// ou https://)");
      return;
    }
    await saveVideos([...heroVideos, url]);
    setNewVideoUrl("");
  }

  async function removeVideo(index: number) {
    await saveVideos(heroVideos.filter((_, i) => i !== index));
  }

  async function chargerResume() {
    const supabase = createClient();
    const { data } = await supabase.rpc("rpc_mon_resume");
    if (data && data[0]) {
      setStats({
        ca: data[0].ca_encaisse || 0,
        attente: data[0].ca_en_attente || 0,
        cmd: data[0].commandes_payees || 0,
      });
    }
  }

  async function chargerCommandes() {
    setCmdLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("orders")
      .select("id,produit,prix,status,user_name,telephone,paiement,created_at")
      .order("created_at", { ascending: false });
    setCmdLoading(false);
    if (error) {
      console.error(error);
      setCommandes([]);
      return;
    }
    setCommandes(data || []);
  }

  async function confirmerPaiement(id: number) {
    if (!confirm("Confirmer que cette commande est payée ?")) return;
    const supabase = createClient();
    const { error } = await supabase.rpc("rpc_confirmer_paiement", { p_order_id: id });
    if (error) {
      alert("Erreur : " + error.message);
      return;
    }
    await chargerResume();
    await chargerCommandes();
  }

  async function chargerVersements() {
    setVersLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.rpc("rpc_mes_mouvements");
    setVersLoading(false);
    if (error) {
      console.error(error);
      setVersements([]);
      return;
    }
    setVersements(data || []);
  }

  async function chargerMessages() {
    setMsgLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.rpc("rpc_mes_messages");
    setMsgLoading(false);
    if (error) {
      console.error(error);
      setMessages([]);
      return;
    }
    setMessages(data || []);
    await supabase.rpc("rpc_partenaire_marquer_lu");
  }

  async function envoyerMessage() {
    const txt = msgText.trim();
    if (!txt || msgSending) return;
    setMsgSending(true);
    const supabase = createClient();
    const { error } = await supabase.rpc("rpc_partenaire_envoyer", {
      p_contenu: txt,
    });
    setMsgSending(false);
    if (error) {
      alert("Erreur : " + error.message);
      return;
    }
    setMsgText("");
    await chargerMessages();
  }

  async function uploaderMediaChat(file: File) {
    if (!boutique?.id) throw new Error("Boutique introuvable");
    const supabase = createClient();
    const ext = (file.name.split(".").pop() || "bin").toLowerCase();
    const chemin = `${boutique.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from("chat-media").upload(chemin, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || undefined,
    });
    if (error) throw error;
    const { data } = supabase.storage.from("chat-media").getPublicUrl(chemin);
    return data.publicUrl;
  }

  function typeMedia(file: File) {
    const t = file.type || "";
    if (t.startsWith("image/")) return "image";
    if (t.startsWith("video/")) return "video";
    if (t.startsWith("audio/")) return "audio";
    return "file";
  }

  async function envoyerMedia(file: File) {
    if (!file) return;
    if (file.size > 50 * 1048576) {
      alert("Fichier trop lourd (max 50 Mo).");
      return;
    }
    try {
      setMsgSending(true);
      const url = await uploaderMediaChat(file);
      const supabase = createClient();
      const { error } = await supabase.rpc("rpc_partenaire_envoyer", {
        p_contenu: null,
        p_media_type: typeMedia(file),
        p_media_url: url,
        p_media_nom: file.name,
      });
      if (error) throw error;
      await chargerMessages();
    } catch (e: any) {
      alert("Erreur : " + (e.message || e));
    } finally {
      setMsgSending(false);
    }
  }

  async function demarrerVocal() {
    try {
      cancelVocalRef.current = false;
      setCancelVocal(false);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      audioChunksRef.current = [];

      // Formats compatibles (ordre de préférence)
      const types = [
        "audio/mp4",
        "audio/aac",
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/ogg",
      ];
      const mimeType = types.find((t) => MediaRecorder.isTypeSupported(t)) || "";

      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = recorder;
      const usedType = recorder.mimeType || mimeType || "audio/webm";

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        if (cancelVocalRef.current) {
          setRecording(false);
          setCancelVocal(false);
          cancelVocalRef.current = false;
          return;
        }

        const blob = new Blob(audioChunksRef.current, { type: usedType });
        if (blob.size < 800) {
          alert("Aucun son capté, réessayez.");
          setRecording(false);
          return;
        }
        const ext = usedType.includes("mp4") || usedType.includes("aac")
          ? "m4a"
          : usedType.includes("ogg")
          ? "ogg"
          : "webm";
        const file = new File([blob], `vocal-${Date.now()}.${ext}`, {
          type: usedType,
        });
        await envoyerMedia(file);
        setRecording(false);
      };

      recorder.onerror = () => {
        setRecording(false);
      };

      recorder.start();
      setRecording(true);
    } catch (e: any) {
      alert("Micro non disponible : " + (e.message || e));
      setRecording(false);
      setCancelVocal(false);
      cancelVocalRef.current = false;
    }
  }

  function arreterVocal() {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    }
  }

  const annulerVocal = () => {
    cancelVocalRef.current = true;
    setCancelVocal(true);
    arreterVocal();
    setRecording(false);
  };

  async function chargerProduits() {
    setProdLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.rpc("rpc_mes_produits");
    setProdLoading(false);
    if (error) {
      console.error(error);
      setProduits([]);
      return;
    }
    setProduits(data || []);
  }

  function ouvrirAjout() {
    setEditId(null);
    setPNom("");
    setPModele("");
    setPPrix("");
    setPEmoji("📱");
    setPMarque("");
    setPEtat("");
    setPSpecs("");
    setPhotos([]);
    setVideo(null);
    setPhotoPreview([]);
    setVideoName("");
    setProdErr("");
    setUploadProgress("");
    setShowModal(true);
  }

  function ouvrirModifier(p: any) {
    setEditId(p.id);
    setPNom(p.nom || "");
    setPModele(p.modele || "");
    setPPrix(String(p.prix || ""));
    setPEmoji(p.emoji || "📱");
    setPMarque(p.marque || "");
    setPEtat(p.categorie?.includes("recond") ? "reconditionne" : "neuf");
    setPSpecs(Array.isArray(p.specs) ? p.specs.join(", ") : p.specs || "");
    setPhotos([]);
    setVideo(null);
    setPhotoPreview([]);
    setVideoName(p.video_url ? "Vidéo actuelle conservée si vous n'en choisissez pas une nouvelle." : "");
    setProdErr("");
    setUploadProgress("");
    setShowModal(true);
  }

  function onPhotosChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []).slice(0, 3);
    setPhotos(files);
    setPhotoPreview(files.map((f) => URL.createObjectURL(f)));
  }

  function onVideoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] || null;
    setVideo(f);
    setVideoName(f ? `${f.name} (${(f.size / 1048576).toFixed(1)} Mo)` : "");
  }

  async function uploaderFichier(bucket: string, file: File, boutiqueId: string) {
    const supabase = createClient();
    const ext = (file.name.split(".").pop() || "bin").toLowerCase();
    const chemin = `${boutiqueId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from(bucket).upload(chemin, file, { cacheControl: "3600", upsert: false });
    if (error) throw error;
    const { data } = supabase.storage.from(bucket).getPublicUrl(chemin);
    return data.publicUrl;
  }

  async function sauverProduit() {
    setProdErr("");
    if (!pNom.trim()) { setProdErr("Le nom est requis."); return; }
    const prix = parseInt(pPrix, 10);
    if (!prix || prix <= 0) { setProdErr("Prix invalide."); return; }
    if (!pMarque) { setProdErr("Choisissez la marque."); return; }
    if (!pEtat) { setProdErr("Choisissez l'état."); return; }
    if (!editId) {
      if (photos.length < 2) { setProdErr("Ajoutez au moins 2 photos."); return; }
      if (!video) { setProdErr("Ajoutez une vidéo de présentation."); return; }
    }
    const trop = [...photos, video].filter(Boolean).find((f) => f!.size > 50 * 1048576);
    if (trop) { setProdErr(`Fichier trop lourd : ${trop.name} (max 50 Mo).`); return; }
    if (!boutique?.id) { setProdErr("Boutique introuvable."); return; }

    const FILTRE: Record<string, string> = { Apple: "iphone", Samsung: "samsung", Infinix: "infinix", Tecno: "tecno", Huawei: "huawei", Xiaomi: "xiaomi", Autre: "autre" };
    const categorie = (FILTRE[pMarque] || pMarque.toLowerCase()) + " " + pEtat;

    setProdSaving(true);
    try {
      let urlsPhotos: string[] = [];
      if (photos.length) {
        for (let i = 0; i < photos.length; i++) {
          setUploadProgress(`Envoi photo ${i + 1}/${photos.length}…`);
          urlsPhotos.push(await uploaderFichier("products", photos[i], boutique.id));
        }
      }
      let urlVideo: string | null = null;
      if (video) {
        setUploadProgress("Envoi de la vidéo…");
        urlVideo = await uploaderFichier("product-videos", video, boutique.id);
      }
      setUploadProgress("Enregistrement…");
      const supabase = createClient();

      if (editId) {
        const maj: any = { nom: pNom.trim(), modele: pModele.trim() || null, prix, emoji: pEmoji.trim() || "📱", marque: pMarque, categorie, specs: pSpecs.trim() || null };
        if (urlsPhotos.length) maj.images = urlsPhotos;
        if (urlVideo) maj.video_url = urlVideo;
        const { error: err } = await supabase.from("products").update(maj).eq("id", editId);
        if (err) throw err;
      } else {
        const { error: err } = await supabase.rpc("rpc_soumettre_produit", {
          p_nom: pNom.trim(), p_prix: prix, p_modele: pModele.trim() || null, p_description: pSpecs.trim() || null,
          p_categorie: categorie, p_images: urlsPhotos, p_video_url: urlVideo, p_emoji: pEmoji.trim() || "📱", p_marque: pMarque,
        });
        if (err) throw err;
      }
      setShowModal(false);
      alert(editId ? "Produit modifié ✅" : "Produit soumis ✅\nIl sera visible après validation par SDS PRO.");
      await chargerProduits();
    } catch (e: any) {
      setProdErr("Erreur : " + (e.message || e));
    } finally {
      setProdSaving(false);
      setUploadProgress("");
    }
  }

  async function toggleVisible(p: any) {
    const supabase = createClient();
    const nouveau = p.visible === false ? true : false;
    const { error } = await supabase.from("products").update({ visible: nouveau }).eq("id", p.id);
    if (error) { alert("Erreur : " + error.message); return; }
    await chargerProduits();
  }

  async function supprimerProduit(id: number) {
    if (!confirm("Supprimer ce produit ?")) return;
    const supabase = createClient();
    const { error: err } = await supabase.from("products").delete().eq("id", id);
    if (err) { alert("Erreur : " + err.message); return; }
    await chargerProduits();
  }

  const fmt = (n: number) => Number(n || 0).toLocaleString("fr-FR");

  if (view === "loading") {
    return <main style={pageStyle}><p style={{ color: "#7a9abb" }}>Chargement…</p></main>;
  }

  if (view === "login") {
    return (
      <main style={pageStyle}>
        <div style={cardStyle}>
          <div style={brandStyle}><span style={{ color: "#fff" }}>SECK</span> <span style={{ color: "#00c8ff" }}>DIGITAL</span> <span style={{ color: "#fff" }}>SERVICES</span> <span style={{ color: "#00c8ff" }}>PRO</span></div>
          <div style={subStyle}>Espace partenaire</div>
          <Field label="Email"><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} /></Field>
          <Field label="Mot de passe"><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && connexion()} style={inputStyle} /></Field>
          <button onClick={connexion} disabled={loading} style={btnStyle}>{loading ? "Connexion…" : "Se connecter"}</button>
          {error && <p style={errStyle}>{error}</p>}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16, fontSize: 13 }}>
            <button onClick={() => { setError(""); setView("signup"); }} style={linkBtn}>Créer un compte</button>
            <Link href="/" style={{ color: "#7a9abb", textDecoration: "none" }}>← Accueil</Link>
          </div>
        </div>
      </main>
    );
  }

  if (view === "signup") {
    return (
      <main style={pageStyle}>
        <div style={cardStyle}>
          <div style={brandStyle}><span style={{ color: "#fff" }}>SECK</span> <span style={{ color: "#00c8ff" }}>DIGITAL</span> <span style={{ color: "#fff" }}>SERVICES</span> <span style={{ color: "#00c8ff" }}>PRO</span></div>
          <div style={subStyle}>Créer votre compte partenaire</div>
          <Field label="Email (Gmail, Hotmail, Yahoo, Outlook)">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} placeholder="vous@gmail.com" />
          </Field>
          <Field label="Mot de passe">
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="8 caractères minimum" style={inputStyle} />
          </Field>
          <Field label="Confirmer le mot de passe">
            <input type="password" value={password2} onChange={(e) => setPassword2(e.target.value)} style={inputStyle} />
          </Field>
          <Field label="Téléphone (Sénégal)">
            <input type="tel" value={telSignup} onChange={(e) => setTelSignup(e.target.value)} placeholder="77 123 45 67" style={inputStyle} />
          </Field>
          <Field label="Adresse de livraison">
            <input type="text" value={adresseSignup} onChange={(e) => setAdresseSignup(e.target.value)} placeholder="Quartier, ville…" style={inputStyle} />
          </Field>
          <button onClick={creerCompte} disabled={loading} style={btnStyle}>{loading ? "Création…" : "Créer mon compte"}</button>
          {error && <p style={errStyle}>{error}</p>}
          <div style={{ marginTop: 16, textAlign: "center", fontSize: 13 }}>
            <button onClick={() => { setError(""); setView("login"); }} style={linkBtn}>← J’ai déjà un compte</button>
          </div>
        </div>
      </main>
    );
  }

  if (view === "createBoutique") {
    return (
      <main style={pageStyle}>
        <div style={{ ...cardStyle, maxWidth: 440 }}>
          <div style={brandStyle}><span style={{ color: "#fff" }}>SECK</span> <span style={{ color: "#00c8ff" }}>DIGITAL</span> <span style={{ color: "#fff" }}>SERVICES</span> <span style={{ color: "#00c8ff" }}>PRO</span></div>
          <div style={subStyle}>Créez votre boutique</div>
          {!merci ? (
            <>
              <p style={{ color: "#7a9abb", fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>Votre compte n’a pas encore de boutique. Elle sera validée par SDS PRO.</p>
              <p style={{ color: "#00c8ff", fontSize: 12, marginBottom: 12 }}>Connecté : {email}</p>
              <button onClick={deconnexion} style={{ ...linkBtn, marginBottom: 16 }}>Changer de compte</button>
              <Field label="Nom de la boutique *"><input value={nom} onChange={(e) => setNom(e.target.value)} style={inputStyle} /></Field>
              <Field label="Votre nom (gérant) *"><input value={prop} onChange={(e) => setProp(e.target.value)} style={inputStyle} /></Field>
              <Field label="Téléphone *"><input value={tel} onChange={(e) => setTel(e.target.value)} style={inputStyle} /></Field>
              <Field label="Ville"><input value={ville} onChange={(e) => setVille(e.target.value)} style={inputStyle} /></Field>
              <Field label="Quartier"><input value={quartier} onChange={(e) => setQuartier(e.target.value)} style={inputStyle} /></Field>
              <Field label="Numéro versements (Wave / OM)"><input value={payout} onChange={(e) => setPayout(e.target.value)} style={inputStyle} /></Field>
              <button onClick={creerBoutique} disabled={loading} style={btnStyle}>{loading ? "Création…" : "Créer ma boutique"}</button>
              {error && <p style={errStyle}>{error}</p>}
            </>
          ) : (
            <div style={{ textAlign: "center", padding: 14 }}>
              <div style={{ fontSize: 34 }}>✓</div>
              <div style={{ color: "#00c8ff", fontWeight: 700, marginTop: 6 }}>Demande envoyée</div>
              <p style={{ color: "#7a9abb", fontSize: 13, marginTop: 8, lineHeight: 1.6 }}>Votre boutique est en cours de validation.</p>
            </div>
          )}
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: "100vh", padding: "90px 16px 60px", maxWidth: 1000, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, paddingBottom: 22, borderBottom: "1px solid rgba(0,180,255,0.22)", marginBottom: 22 }}>
        <div style={{ width: 46, height: 46, borderRadius: 12, background: "rgba(0,200,255,0.1)", border: "1px solid rgba(0,180,255,0.22)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🏪</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 19, fontWeight: 700 }}>{boutique?.nom || "Ma boutique"}</div>
          <div style={{ color: "#7a9abb", fontSize: 12 }}>{[boutique?.proprietaire, boutique?.ville].filter(Boolean).join(" · ") || "Espace partenaire"}</div>
          <div style={{ color: "#eaf7ff", fontSize: 11, marginTop: 6, lineHeight: 1.5 }}>
            SECK DIGITAL SERVICES PRO (SDS PRO) · Commerce général, accessoires téléphoniques, vente en ligne et dépannage.
          </div>
        </div>
        <button onClick={deconnexion} style={logoutBtn}>Déconnexion</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 24 }}>
        <Stat value={fmt(stats.ca) + " F"} label="Encaissé (payé)" color="#00c864" />
        <Stat value={fmt(stats.attente) + " F"} label="En attente" color="#ffb020" />
        <Stat value={String(stats.cmd)} label="Commandes payées" color="#00c8ff" />
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
        {([["cmd", "Commandes"], ["prod", "Mes produits"], ["vers", "Versements"], ["msg", "Messagerie"], ["vitrine", "Ma vitrine"]] as const).map(([id, label]) => (
          <button
            key={id}
            onClick={() => {
              setTab(id);
              if (id === "prod") chargerProduits();
              if (id === "cmd") chargerCommandes();
              if (id === "vers") chargerVersements();
              if (id === "msg") chargerMessages();
            }}
            style={{
              background: tab === id ? "#00c8ff" : "transparent",
              color: tab === id ? "#001018" : "#7a9abb",
              border: `1px solid ${tab === id ? "#00c8ff" : "rgba(0,180,255,0.22)"}`,
              borderRadius: 10, padding: "10px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div style={{ background: "linear-gradient(160deg, #071828, #040f1e)", border: "1px solid rgba(0,180,255,0.22)", borderRadius: 14, padding: 24, minHeight: 200 }}>
        {tab === "cmd" && (
          <div>
            {cmdLoading && <p style={{ color: "#7a9abb", fontSize: 14 }}>Chargement…</p>}
            {!cmdLoading && commandes.length === 0 && (
              <p style={{ color: "#7a9abb", fontSize: 14, textAlign: "center", padding: 30 }}>Aucune commande pour le moment.</p>
            )}
            {commandes.map((o) => {
              const paye = o.status === "paye" || o.status === "PAID" || o.status === "livre";
              return (
                <div key={o.id} style={rowStyle}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{o.produit || "Produit"}</div>
                    <div style={{ color: "#7a9abb", fontSize: 12, marginTop: 3 }}>
                      {o.user_name || "Client"}{o.telephone ? ` · ${o.telephone}` : ""}{o.paiement ? ` · ${o.paiement}` : ""}
                    </div>
                  </div>
                  <div style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 700, fontSize: 16, whiteSpace: "nowrap" }}>{fmt(o.prix)} F</div>
                  <span style={{
                    fontSize: 10, fontWeight: 600, padding: "4px 9px", borderRadius: 100, textTransform: "uppercase",
                    background: paye ? "rgba(0,200,100,.15)" : "rgba(255,176,32,.15)", color: paye ? "#00c864" : "#ffb020",
                  }}>{paye ? "Payé" : "En attente"}</span>
                  {!paye && (
                    <button onClick={() => confirmerPaiement(o.id)} style={{
                      background: "#00c864", border: "none", color: "#001810", borderRadius: 9, padding: "8px 13px",
                      fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
                    }}>Confirmer payé</button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {tab === "prod" && (
          <div>
            <button onClick={ouvrirAjout} style={addBtnStyle}>+ Ajouter un produit</button>
            {prodLoading && <p style={{ color: "#7a9abb", fontSize: 14 }}>Chargement…</p>}
            {!prodLoading && produits.length === 0 && (
              <p style={{ color: "#7a9abb", fontSize: 14, textAlign: "center", padding: 30 }}>Aucun produit. Ajoutez-en un pour commencer.</p>
            )}
            {produits.map((p) => {
              const st = p.statut_validation;
              const desactive = p.visible === false;
              const actif = !desactive && st === "valide";
              const details = p.modele || (Array.isArray(p.specs) ? p.specs.join(" · ") : "");
              return (
                <div
                  key={p.id}
                  style={{
                    background: "rgba(7,24,40,0.58)",
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                    border: "1px solid rgba(0,180,255,0.22)",
                    borderRadius: 16,
                    padding: 16,
                    marginBottom: 12,
                    opacity: desactive ? 0.75 : 1,
                  }}
                >
                  <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                    <div
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: 12,
                        background: "rgba(0,100,255,0.08)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 28,
                        flexShrink: 0,
                      }}
                    >
                      {p.emoji || "📱"}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
                        <strong style={{ fontSize: 16 }}>{p.nom}</strong>
                        <span
                          style={{
                            fontSize: 11,
                            padding: "3px 10px",
                            borderRadius: 100,
                            background: actif ? "rgba(52,211,153,0.15)" : "rgba(255,160,0,0.15)",
                            color: actif ? "#34d399" : "#ffb347",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {actif ? "En ligne" : "Désactivé"}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: "#7a9abb", marginBottom: 6 }}>
                        {details}
                      </div>
                      <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 22, fontWeight: 700, color: "#00c8ff" }}>
                        {Number(p.prix || 0).toLocaleString("fr-FR")} <small style={{ fontSize: 11, color: "#7a9abb" }}>FCFA</small>
                      </div>
                      {st === "refuse" && p.motif_refus && <div style={{ color: "#ff5a6e", fontSize: 12, marginTop: 6 }}>Motif : {p.motif_refus}</div>}
                    </div>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr",
                      gap: 8,
                      marginTop: 14,
                    }}
                  >
                    <button onClick={() => ouvrirModifier(p)} style={btnSoft}>Modifier</button>
                    <button onClick={() => toggleVisible(p)} style={actif ? btnWarn : btnOk}>{actif ? "Désactiver" : "Activer"}</button>
                    <button onClick={() => supprimerProduit(p.id)} style={btnDanger}>Supprimer</button>
                  </div>
                </div>
              );
            })}

            {showModal && (
              <div style={modalOverlay}>
                <div style={modalCard}>
                  <h3 style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 20, marginBottom: 18 }}>{editId ? "Modifier le produit" : "Nouveau produit"}</h3>
                  <Field label="Nom *"><input value={pNom} onChange={(e) => setPNom(e.target.value)} style={inputStyle} /></Field>
                  <Field label="Modèle"><input value={pModele} onChange={(e) => setPModele(e.target.value)} style={inputStyle} /></Field>
                  <Field label="Prix (FCFA) *"><input type="number" value={pPrix} onChange={(e) => setPPrix(e.target.value)} style={inputStyle} /></Field>
                  <Field label="Emoji"><input value={pEmoji} onChange={(e) => setPEmoji(e.target.value)} style={inputStyle} maxLength={4} /></Field>
                  <Field label="Marque *">
                    <select value={pMarque} onChange={(e) => setPMarque(e.target.value)} style={inputStyle}>
                      <option value="">— Choisir —</option>
                      <option value="Apple">Apple / iPhone</option>
                      <option value="Samsung">Samsung</option>
                      <option value="Infinix">Infinix</option>
                      <option value="Tecno">Tecno</option>
                      <option value="Huawei">Huawei</option>
                      <option value="Xiaomi">Xiaomi</option>
                      <option value="Autre">Autre</option>
                    </select>
                  </Field>
                  <Field label="État *">
                    <select value={pEtat} onChange={(e) => setPEtat(e.target.value)} style={inputStyle}>
                      <option value="">— Choisir —</option>
                      <option value="neuf">Neuf</option>
                      <option value="reconditionne">Reconditionné</option>
                    </select>
                  </Field>
                  <Field label="Specs (virgules)"><input value={pSpecs} onChange={(e) => setPSpecs(e.target.value)} style={inputStyle} placeholder="128GB, 5G" /></Field>
                  <Field label={editId ? "Photos (optionnel)" : "Photos (2 minimum)"}>
                    <input type="file" accept="image/*" multiple onChange={onPhotosChange} style={{ color: "#bdd4ea", fontSize: 13 }} />
                    {photoPreview.length > 0 && (
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                        {photoPreview.map((src, i) => (
                          <img key={i} src={src} alt="" style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 8, border: "1px solid rgba(0,180,255,0.22)" }} />
                        ))}
                      </div>
                    )}
                  </Field>
                  <Field label={editId ? "Vidéo (optionnel)" : "Vidéo (1 requise)"}>
                    <input type="file" accept="video/*" onChange={onVideoChange} style={{ color: "#bdd4ea", fontSize: 13 }} />
                    {videoName && <div style={{ color: "#7a9abb", fontSize: 12, marginTop: 6 }}>{videoName}</div>}
                  </Field>
                  {uploadProgress && <p style={{ color: "#00c8ff", fontSize: 12, marginBottom: 8 }}>{uploadProgress}</p>}
                  {prodErr && <p style={errStyle}>{prodErr}</p>}
                  <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
                    <button onClick={() => setShowModal(false)} style={{ ...btnStyle, background: "transparent", border: "1px solid rgba(0,180,255,0.22)", color: "#7a9abb" }}>Annuler</button>
                    <button onClick={sauverProduit} disabled={prodSaving} style={btnStyle}>{prodSaving ? "Envoi…" : "Enregistrer"}</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "vers" && (
          <div>
            {versLoading && <p style={{ color: "#7a9abb", fontSize: 14 }}>Chargement…</p>}
            {!versLoading && versements.length === 0 && (
              <p style={{ color: "#7a9abb", fontSize: 14, textAlign: "center", padding: 30 }}>
                Aucun versement pour le moment.
              </p>
            )}
            {versements.map((m, i) => {
              const remb = m.type === "remboursement";
              return (
                <div key={m.id || i} style={rowStyle}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>
                      {remb ? "Remboursement client" : "Versement reçu"}
                    </div>
                    <div style={{ color: "#7a9abb", fontSize: 12, marginTop: 3 }}>
                      Commande #{m.order_id}
                      {m.note ? ` · ${m.note}` : ""}
                      {m.cree_le ? ` · ${new Date(m.cree_le).toLocaleDateString("fr-FR")}` : ""}
                    </div>
                  </div>
                  <div
                    style={{
                      fontFamily: "Rajdhani, sans-serif",
                      fontWeight: 700,
                      fontSize: 16,
                      color: remb ? "#ff5a6e" : "#00c864",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {remb ? "−" : "+"}
                    {fmt(m.net)} F
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {tab === "msg" && (
          <div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 18, fontWeight: 700, color: "#00c8ff" }}>
                💬 Messagerie
              </div>
              <div style={{ color: "#7a9abb", fontSize: 13 }}>Discutez avec l’équipe SDS PRO</div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
                marginBottom: 14,
                minHeight: 280,
                maxHeight: 420,
                overflowY: "auto",
                padding: 8,
                background: "rgba(0,0,0,0.2)",
                borderRadius: 12,
              }}
            >
              {msgLoading && <p style={{ color: "#7a9abb", fontSize: 14, textAlign: "center" }}>Chargement…</p>}
              {!msgLoading && messages.length === 0 && (
                <p style={{ color: "#7a9abb", fontSize: 14, textAlign: "center", padding: 30 }}>
                  Aucun message pour le moment.
                </p>
              )}
              {messages.map((m, i) => {
                const moi = m.expediteur === "partenaire";
                return (
                  <div
                    key={m.id || i}
                    style={{
                      maxWidth: "78%",
                      padding: "9px 13px",
                      borderRadius: 14,
                      alignSelf: moi ? "flex-end" : "flex-start",
                      background: moi ? "linear-gradient(135deg, #0055ff, #00c8ff)" : "rgba(0,100,255,0.1)",
                      color: moi ? "#fff" : "#bdd4ea",
                      border: moi ? "none" : "1px solid rgba(0,180,255,0.22)",
                    }}
                  >
                    {m.annonce && <div style={{ fontSize: 10, opacity: 0.7, marginBottom: 2 }}>📢 Annonce SDS PRO</div>}
                    {m.contenu && <div style={{ fontSize: 14, lineHeight: 1.4 }}>{m.contenu}</div>}
                    {m.media_url && m.media_type === "image" && (
                      <img
                        src={m.media_url}
                        alt=""
                        onClick={() => window.open(m.media_url, "_blank")}
                        style={{ maxWidth: 200, borderRadius: 10, marginBottom: 5, cursor: "pointer", display: "block" }}
                      />
                    )}
                    {m.media_url && m.media_type === "video" && <VideoPlayer url={m.media_url} mine={moi} />}
                    {m.media_url && m.media_type === "audio" && <VoicePlayer url={m.media_url} mine={moi} />}
                    {m.media_url && m.media_type === "file" && (
                      <a
                        href={m.media_url}
                        target="_blank"
                        rel="noreferrer"
                        style={{ display: "block", fontSize: 13, marginBottom: 5, color: "inherit" }}
                      >
                        📄 {m.media_nom || "Fichier"}
                      </a>
                    )}
                    <div style={{ fontSize: 10, opacity: 0.6, marginTop: 3 }}>
                      {m.cree_le
                        ? new Date(m.cree_le).toLocaleString("fr-FR", {
                            day: "2-digit",
                            month: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : ""}
                    </div>
                  </div>
                );
              })}
            </div>

            <div
              style={{
                display: "flex",
                gap: 8,
                alignItems: "center",
                background: "rgba(7,24,40,0.9)",
                border: "1px solid rgba(0,180,255,0.18)",
                borderRadius: 28,
                padding: "6px 8px 6px 6px",
              }}
            >
              <label
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: "rgba(0,200,255,0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  flexShrink: 0,
                  fontSize: 18,
                }}
              >
                📎
                <input
                  type="file"
                  accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) envoyerMedia(f);
                    e.target.value = "";
                  }}
                />
              </label>

              <input
                type="text"
                value={msgText}
                onChange={(e) => setMsgText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && envoyerMessage()}
                placeholder="Message"
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: "#fff",
                  fontSize: 15,
                  fontFamily: "Outfit, sans-serif",
                  padding: "8px 4px",
                }}
              />

              {msgText.trim() ? (
                <button
                  onClick={envoyerMessage}
                  disabled={msgSending}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    border: "none",
                    background: "linear-gradient(135deg, #0055ff, #00c8ff)",
                    color: "#fff",
                    fontSize: 16,
                    cursor: "pointer",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {msgSending ? "…" : "➤"}
                </button>
              ) : (
                <button
                  onMouseDown={demarrerVocal}
                  onMouseUp={arreterVocal}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    demarrerVocal();
                  }}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    arreterVocal();
                  }}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    border: "none",
                    background: recording ? "linear-gradient(135deg, #cc0000, #ff4444)" : "linear-gradient(135deg, #0055ff, #00c8ff)",
                    color: "#fff",
                    fontSize: 18,
                    cursor: "pointer",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: recording ? "0 0 0 4px rgba(255,68,68,0.25)" : "none",
                    transition: "all 0.15s",
                  }}
                  title="Maintenir pour enregistrer"
                >
                  🎤
                </button>
              )}
            </div>

            {recording ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  background: "rgba(7,24,40,0.95)",
                  border: "1px solid rgba(255,68,68,0.35)",
                  borderRadius: 28,
                  padding: "10px 14px",
                  marginTop: 8,
                }}
              >
                <button
                  onClick={annulerVocal}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    border: "none",
                    background: "rgba(255,68,68,0.15)",
                    color: "#ff4444",
                    fontSize: 18,
                    cursor: "pointer",
                    flexShrink: 0,
                  }}
                  title="Supprimer"
                >
                  🗑️
                </button>

                <div style={{ flex: 1, textAlign: "center" }}>
                  <div style={{ color: "#ff4444", fontSize: 13, fontWeight: 600 }}>🔴 Enregistrement…</div>
                  <div style={{ color: "#7a9abb", fontSize: 11, marginTop: 2 }}>Relâchez pour envoyer · Poubelle pour annuler</div>
                </div>

                <button
                  onClick={arreterVocal}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    border: "none",
                    background: "linear-gradient(135deg, #0055ff, #00c8ff)",
                    color: "#fff",
                    fontSize: 16,
                    cursor: "pointer",
                    flexShrink: 0,
                  }}
                  title="Envoyer"
                >
                  ➤
                </button>
              </div>
            ) : null}
          </div>
        )}

        {tab === "vitrine" && (
          <div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 18, fontWeight: 700, color: "#00c8ff" }}>
                ✨ Ma vitrine
              </div>
              <div style={{ color: "#7a9abb", fontSize: 13 }}>Personnalisez le bandeau hero de votre boutique</div>
            </div>

            <div style={{ marginTop: 24, padding: 16, border: "1px solid rgba(0,180,255,0.25)", borderRadius: 12 }}>
              <h3 style={{ marginTop: 0, color: "#00c8ff", fontSize: 15, fontWeight: 700 }}>📹 Vidéos du bandeau</h3>
              <p style={{ fontSize: 13, color: "#9eb6d0", marginBottom: 14 }}>
                URLs MP4 (Supabase Storage, Cloudflare, etc.). Chaque vidéo s&apos;affiche 6 secondes. Max conseillé : 3.
              </p>

              {heroVideos.length > 0 && (
                <div style={{ marginBottom: 16, padding: 12, background: "rgba(0,100,100,0.08)", borderRadius: 8, border: "1px solid rgba(0,200,200,0.2)" }}>
                  <div style={{ fontSize: 12, color: "#7a9abb", marginBottom: 8, fontWeight: 600 }}>
                    {heroVideos.length} vidéo{heroVideos.length > 1 ? "s" : ""} en ligne
                  </div>
                  {heroVideos.map((url, i) => (
                    <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8, padding: 8, background: "rgba(0,0,0,0.2)", borderRadius: 6 }}>
                      <span style={{ flex: 1, fontSize: 12, color: "#c8dff5", wordBreak: "break-all", fontFamily: "monospace" }}>
                        {i + 1}. {url.length > 50 ? url.substring(0, 47) + "…" : url}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeVideo(i)}
                        style={{
                          padding: "4px 10px",
                          borderRadius: 6,
                          border: "1px solid rgba(248,113,113,0.4)",
                          background: "rgba(248,113,113,0.08)",
                          color: "#f87171",
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        Supprimer
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: "flex", gap: 8, marginTop: 12, marginBottom: 12 }}>
                <input
                  type="text"
                  value={newVideoUrl}
                  onChange={(e) => setNewVideoUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addVideo()}
                  placeholder="https://example.com/video.mp4"
                  style={{
                    flex: 1,
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: "1px solid rgba(0,180,255,0.22)",
                    background: "rgba(7,24,40,0.7)",
                    color: "#fff",
                    fontSize: 13,
                    fontFamily: "monospace",
                  }}
                />
                <button
                  type="button"
                  onClick={addVideo}
                  style={{
                    padding: "10px 18px",
                    borderRadius: 8,
                    border: "none",
                    background: "linear-gradient(135deg, #0055ff, #00c8ff)",
                    color: "#fff",
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  Ajouter
                </button>
              </div>

              {videoMsg && (
                <div
                  style={{
                    padding: 10,
                    borderRadius: 8,
                    background: videoMsg.includes("Erreur") ? "rgba(248,113,113,0.12)" : "rgba(52,211,153,0.12)",
                    border: videoMsg.includes("Erreur") ? "1px solid rgba(248,113,113,0.3)" : "1px solid rgba(52,211,153,0.3)",
                    color: videoMsg.includes("Erreur") ? "#f87171" : "#34d399",
                    fontSize: 13,
                  }}
                >
                  {videoMsg}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 11, color: "#7a9abb", letterSpacing: 1, marginBottom: 6, textTransform: "uppercase" }}>{label}</label>
      {children}
    </div>
  );
}

function Stat({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <div style={{ background: "linear-gradient(160deg, #071828, #040f1e)", border: "1px solid rgba(0,180,255,0.22)", borderRadius: 16, padding: 18 }}>
      <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 26, fontWeight: 700, color }}>{value}</div>
      <div style={{ color: "#7a9abb", fontSize: 11, textTransform: "uppercase", letterSpacing: 1, marginTop: 4 }}>{label}</div>
    </div>
  );
}

function VoicePlayer({ url, mine }: { url: string; mine: boolean }) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const a = new Audio();
    a.preload = "metadata";
    a.src = url;
    audioRef.current = a;

    const onLoaded = () => setDuration(a.duration || 0);
    const onTime = () => {
      if (a.duration) setProgress(a.currentTime / a.duration);
    };
    const onEnd = () => {
      setPlaying(false);
      setProgress(0);
    };
    const onError = () => {
      setPlaying(false);
      console.warn("Audio non lisible:", url);
    };

    a.addEventListener("loadedmetadata", onLoaded);
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("ended", onEnd);
    a.addEventListener("error", onError);

    return () => {
      a.pause();
      a.removeAttribute("src");
      a.load();
      a.removeEventListener("loadedmetadata", onLoaded);
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("ended", onEnd);
      a.removeEventListener("error", onError);
    };
  }, [url]);

  function toggle() {
    const a = audioRef.current;
    if (!a) return;
    if (playing) {
      a.pause();
      setPlaying(false);
    } else {
      a.play();
      setPlaying(true);
    }
  }

  function format(s: number) {
    if (!s || !isFinite(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        minWidth: 180,
        maxWidth: 240,
        marginBottom: 4,
        padding: "4px 0",
      }}
    >
      <button
        onClick={toggle}
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          border: "none",
          background: mine ? "rgba(255,255,255,0.25)" : "rgba(0,200,255,0.2)",
          color: mine ? "#fff" : "#00c8ff",
          fontSize: 14,
          cursor: "pointer",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {playing ? "⏸" : "▶"}
      </button>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            height: 4,
            borderRadius: 4,
            background: mine ? "rgba(255,255,255,0.25)" : "rgba(0,180,255,0.2)",
            overflow: "hidden",
            marginBottom: 4,
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progress * 100}%`,
              background: mine ? "#fff" : "#00c8ff",
              borderRadius: 4,
              transition: "width 0.1s linear",
            }}
          />
        </div>
        <div
          style={{
            fontSize: 10,
            opacity: 0.75,
            fontFamily: "DM Mono, monospace",
          }}
        >
          {playing ? format(audioRef.current?.currentTime || 0) : format(duration)}
        </div>
      </div>
    </div>
  );
}

function VideoPlayer({ url, mine }: { url: string; mine: boolean }) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const v = document.createElement("video");
    v.src = url;
    videoRef.current = v;

    const onLoaded = () => setDuration(v.duration || 0);
    const onTime = () => {
      if (v.duration) setProgress(v.currentTime / v.duration);
    };
    const onEnd = () => {
      setPlaying(false);
      setProgress(0);
    };

    v.addEventListener("loadedmetadata", onLoaded);
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("ended", onEnd);

    return () => {
      v.pause();
      v.removeEventListener("loadedmetadata", onLoaded);
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("ended", onEnd);
    };
  }, [url]);

  function toggle() {
    const v = videoRef.current;
    if (!v) return;
    if (playing) {
      v.pause();
      setPlaying(false);
    } else {
      v.play();
      setPlaying(true);
    }
  }

  function format(s: number) {
    if (!s || !isFinite(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        minWidth: 180,
        maxWidth: 240,
        marginBottom: 6,
        padding: "4px 0",
      }}
    >
      <button
        onClick={toggle}
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          border: "none",
          background: mine ? "rgba(255,255,255,0.25)" : "rgba(0,200,255,0.2)",
          color: mine ? "#fff" : "#00c8ff",
          fontSize: 14,
          cursor: "pointer",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {playing ? "⏸" : "▶"}
      </button>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            height: 4,
            borderRadius: 4,
            background: mine ? "rgba(255,255,255,0.25)" : "rgba(0,180,255,0.2)",
            overflow: "hidden",
            marginBottom: 4,
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progress * 100}%`,
              background: mine ? "#fff" : "#00c8ff",
              borderRadius: 4,
              transition: "width 0.1s linear",
            }}
          />
        </div>
        <div
          style={{
            fontSize: 10,
            opacity: 0.75,
            fontFamily: "DM Mono, monospace",
          }}
        >
          {playing ? format(videoRef.current?.currentTime || 0) : format(duration)}
        </div>
      </div>
    </div>
  );
}

const pageStyle: React.CSSProperties = { minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "100px 20px 40px", background: "#020912" };
const cardStyle: React.CSSProperties = { width: "100%", maxWidth: 420, background: "linear-gradient(160deg, #071828, #040f1e)", border: "1px solid rgba(0,180,255,0.22)", borderRadius: 20, padding: "30px 26px", boxShadow: "0 24px 60px rgba(0,0,0,0.5)" };
const brandStyle: React.CSSProperties = { fontFamily: "Rajdhani, sans-serif", fontSize: 22, fontWeight: 700, letterSpacing: 3, textAlign: "center", marginBottom: 4 };
const subStyle: React.CSSProperties = { textAlign: "center", color: "#7a9abb", fontSize: 12, fontFamily: "DM Mono, monospace", letterSpacing: 2, marginBottom: 24 };
const inputStyle: React.CSSProperties = { width: "100%", background: "rgba(0,20,40,0.6)", border: "1.5px solid rgba(0,180,255,0.22)", borderRadius: 12, padding: 14, color: "#fff", fontSize: 15, fontFamily: "Outfit, sans-serif", outline: "none", boxSizing: "border-box" };
const btnStyle: React.CSSProperties = { width: "100%", background: "linear-gradient(135deg, #0055ff, #00c8ff)", border: "none", borderRadius: 12, padding: 15, color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer", marginTop: 4 };
const errStyle: React.CSSProperties = { color: "#ff5a6e", fontSize: 13, marginTop: 12, textAlign: "center" };
const linkBtn: React.CSSProperties = { background: "none", border: "none", color: "#00c8ff", fontSize: 13, cursor: "pointer", padding: 0 };
const logoutBtn: React.CSSProperties = { background: "transparent", border: "1px solid rgba(0,180,255,0.22)", color: "#7a9abb", borderRadius: 10, padding: "9px 14px", fontSize: 12, cursor: "pointer" };
const addBtnStyle: React.CSSProperties = { background: "linear-gradient(135deg, #0055ff, #00c8ff)", border: "none", color: "#fff", borderRadius: 12, padding: "13px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer", marginBottom: 16 };
const rowStyle: React.CSSProperties = { background: "linear-gradient(160deg, #071828, #040f1e)", border: "1px solid rgba(0,180,255,0.22)", borderRadius: 14, padding: "15px 16px", marginBottom: 10, display: "flex", alignItems: "center", gap: 14 };
const btnSoft: React.CSSProperties = {
  padding: "10px 8px",
  borderRadius: 9,
  border: "1px solid rgba(0,180,255,0.25)",
  background: "rgba(0,200,255,0.08)",
  color: "#00c8ff",
  fontSize: 12,
  cursor: "pointer",
};
const btnOk: React.CSSProperties = { ...btnSoft, color: "#34d399", borderColor: "rgba(52,211,153,0.35)" };
const btnWarn: React.CSSProperties = { ...btnSoft, color: "#ffb347", borderColor: "rgba(255,180,0,0.35)" };
const btnDanger: React.CSSProperties = { ...btnSoft, color: "#ff6b6b", borderColor: "rgba(255,80,80,0.3)" };
const modalOverlay: React.CSSProperties = { position: "fixed", inset: 0, background: "rgba(0,5,15,0.8)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 };
const modalCard: React.CSSProperties = { width: "100%", maxWidth: 480, maxHeight: "90vh", overflowY: "auto", background: "linear-gradient(160deg, #071828, #040f1e)", border: "1px solid #00c8ff", borderRadius: 18, padding: 24 };