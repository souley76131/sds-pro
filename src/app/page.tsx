import { Suspense } from "react";
import Portail from "@/components/home/Portail";

export default function Home() {
  return (
    <main>
      <Suspense fallback={<div style={{ paddingTop: 100, color: "#7a9abb" }}>Chargement…</div>}>
        <Portail />
      </Suspense>
    </main>
  );
}