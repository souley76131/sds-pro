import type { Metadata } from "next";
import Catalogue from "@/components/catalogue/Catalogue";

export const metadata: Metadata = {
  title: "Accessoires | SDS PRO",
  description: "Chargeurs, écouteurs, coques, montres et enceintes vendus par nos boutiques partenaires à Dakar.",
  alternates: { canonical: "/accessoires" },
};

export default function AccessoiresPage() {
  return <Catalogue rayon="accessoires" />;
}
