// Rayons du catalogue : téléphones (/catalogue), ordinateurs et accessoires.
// Le rayon d'un produit est écrit en tête de sa catégorie (« ordinateur hp neuf »,
// « accessoire apple neuf ») ; les téléphones gardent l'ancien format (« iphone neuf »).

export type Rayon = "telephones" | "ordinateurs" | "accessoires";

export type Marque = { id: string; name: string };

export const RAYONS: Record<
  Rayon,
  { titre: string; emoji: string; href: string; prefixe: string; marques: Marque[] }
> = {
  telephones: {
    titre: "Téléphones",
    emoji: "📱",
    href: "/catalogue",
    prefixe: "",
    marques: [
      { id: "apple", name: "Apple" },
      { id: "samsung", name: "Samsung" },
      { id: "infinix", name: "Infinix" },
      { id: "tecno", name: "Tecno" },
      { id: "huawei", name: "Huawei" },
    ],
  },
  ordinateurs: {
    titre: "Ordinateurs",
    emoji: "💻",
    href: "/ordinateurs",
    prefixe: "ordinateur",
    marques: [
      { id: "apple", name: "Apple" },
      { id: "hp", name: "HP" },
      { id: "dell", name: "Dell" },
      { id: "lenovo", name: "Lenovo" },
      { id: "asus", name: "Asus" },
      { id: "acer", name: "Acer" },
    ],
  },
  accessoires: {
    titre: "Accessoires",
    emoji: "🎧",
    href: "/accessoires",
    prefixe: "accessoire",
    marques: [
      { id: "apple", name: "Apple" },
      { id: "samsung", name: "Samsung" },
      { id: "oraimo", name: "Oraimo" },
      { id: "jbl", name: "JBL" },
      { id: "anker", name: "Anker" },
    ],
  },
};

const sansAccents = (s: unknown) =>
  String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

// Produits enregistrés avant le choix du rayon : on se fie au nom.
const RE_ORDI = /(macbook|laptop|notebook|ordinateur|imac|chromebook|thinkpad|ideapad|elitebook|probook|vivobook|zenbook|pc portable)/;
const RE_ACC = /^(chargeur|cable|ecouteur|airpods|buds|galaxy buds|coque|etui|protection|verre|powerbank|batterie|montre|apple watch|galaxy watch|smartwatch|enceinte|casque|adaptateur|support|cle usb|carte memoire|souris|clavier)/;

export function rayonDuProduit(p: { categorie?: string | null; name?: string | null; model?: string | null }): Rayon {
  const cat = sansAccents(p.categorie);
  if (cat.startsWith("ordinateur")) return "ordinateurs";
  if (cat.startsWith("accessoire")) return "accessoires";
  const nom = sansAccents(p.name);
  if (RE_ORDI.test(nom + " " + sansAccents(p.model))) return "ordinateurs";
  if (RE_ACC.test(nom)) return "accessoires";
  return "telephones";
}
