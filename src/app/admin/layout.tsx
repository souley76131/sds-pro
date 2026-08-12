"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const TABS = [
  { href: "/admin", label: "📊 Tableau de bord" },
  { href: "/admin/commandes", label: "📦 Commandes" },
  { href: "/admin/produits", label: "🛍️ Produits" },
  { href: "/admin/clients", label: "👥 Clients" },
  { href: "/admin/accessoires", label: "🎧 Accessoires" },
  { href: "/admin/ordinateurs", label: "💻 Ordinateurs" },
  { href: "/admin/credit", label: "🤝 Crédit Halal" },
  { href: "/admin/partenaires", label: "🏪 Partenaires" },
  { href: "/admin/messagerie", label: "💬 Messagerie" },
  { href: "/admin/urgence", label: "🔴 Urgence" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [ready, setReady] = useState(false);
  const [name, setName] = useState("Admin");

  const isLogin = pathname === "/admin/login";

  useEffect(() => {
    if (isLogin) {
      setReady(true);
      return;
    }

    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.replace("/admin/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role,full_name")
        .eq("id", session.user.id)
        .single();

      if (!profile || profile.role !== "admin") {
        await supabase.auth.signOut();
        router.replace("/admin/login");
        return;
      }

      setName(profile.full_name || session.user.email?.split("@")[0] || "Admin");
      setReady(true);
    })();
  }, [pathname, isLogin, router, supabase]);

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/admin/login");
  }

  if (!ready) {
    return (
      <div style={{ minHeight: "100vh", background: "#020912", color: "#4a7a9b", display: "grid", placeItems: "center" }}>
        Chargement…
      </div>
    );
  }

  if (isLogin) return <>{children}</>;

  return (
    <div style={{ minHeight: "100vh", background: "#020912", color: "#f0f8ff" }}>
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          height: 56,
          background: "rgba(2,9,18,0.95)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(0,180,255,0.18)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 20px",
        }}
      >
        <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 22, fontWeight: 700, color: "#00e5ff", letterSpacing: 3 }}>
          SDS
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              fontFamily: "DM Mono, monospace",
              fontSize: 10,
              color: "#4a7a9b",
              background: "rgba(0,200,255,0.08)",
              border: "1px solid rgba(0,180,255,0.18)",
              padding: "3px 10px",
              borderRadius: 100,
            }}
          >
            {name}
          </span>
          <button
            type="button"
            onClick={logout}
            style={{
              background: "rgba(255,68,68,0.1)",
              border: "1px solid rgba(255,68,68,0.3)",
              color: "#ff6b6b",
              padding: "6px 14px",
              borderRadius: 8,
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            Déconnexion
          </button>
        </div>
      </nav>

      <div
        style={{
          position: "fixed",
          top: 56,
          left: 0,
          right: 0,
          zIndex: 99,
          background: "#071525",
          borderBottom: "1px solid rgba(0,180,255,0.18)",
          display: "flex",
          overflowX: "auto",
        }}
      >
        {TABS.map((t) => {
          const on = pathname === t.href;
          return (
            <Link
              key={t.href}
              href={t.href}
              style={{
                padding: "14px 20px",
                fontSize: 13,
                fontWeight: 600,
                color: on ? "#00e5ff" : "#4a7a9b",
                borderBottom: on ? "2px solid #00e5ff" : "2px solid transparent",
                whiteSpace: "nowrap",
                textDecoration: "none",
              }}
            >
              {t.label}
            </Link>
          );
        })}
      </div>

      <div style={{ paddingTop: 120, paddingBottom: 40, maxWidth: 900, margin: "0 auto", paddingLeft: 16, paddingRight: 16 }}>
        {children}
      </div>
    </div>
  );
}
