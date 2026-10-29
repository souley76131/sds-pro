import type { Metadata } from "next";
import Catalogue from "@/components/catalogue/Catalogue";

export const metadata: Metadata = {
  title: "Ordinateurs | SDS PRO",
  description: "Ordinateurs portables neufs ou reconditionnés vendus par nos boutiques partenaires à Dakar.",
  alternates: { canonical: "/ordinateurs" },
};

export default function OrdinateursPage() {
  return <Catalogue rayon="ordinateurs" />;
}
