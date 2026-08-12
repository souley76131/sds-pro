"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CART_KEY, CART_UPDATED_EVENT, getCartQty, readCart } from "@/lib/cart";

export default function Navbar() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [cartQty, setCartQty] = useState(0);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    const getNameFromUser = (user: any) => {
      if (!user) return null;
      const meta = user.user_metadata || {};
      return (
        meta.full_name ||
        meta.name ||
        meta.nom ||
        (typeof user.email === "string" ? user.email.split("@")[0] : null)
      );
    };

    supabase.auth.getUser().then(({ data }) => {
      setDisplayName(getNameFromUser(data.user));
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setDisplayName(getNameFromUser(session?.user));
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const syncCart = () => setCartQty(getCartQty(readCart()));
    syncCart();
    if (typeof window === "undefined") return;

    const onStorage = (e: StorageEvent) => {
      if (e.key === CART_KEY) syncCart();
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener(CART_UPDATED_EVENT, syncCart);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(CART_UPDATED_EVENT, syncCart);
    };
  }, []);

  function closeMenus() {
    setDrawerOpen(false);
    setUserMenuOpen(false);
  }

  async function deconnexion() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setDisplayName(null);
    closeMenus();
    router.push("/");
  }

  useEffect(() => {
    closeMenus();
  }, [pathname]);

  return (
    <>
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 500,
          background: "rgba(2,9,18,0.85)",
          backdropFilter: "blur(24px)",
          borderBottom: "1px solid rgba(0,180,255,0.22)",
        }}
      >
        {/* Bande cyan */}
        <div
          style={{
            height: 2,
            background: "linear-gradient(90deg, #0055ff, #00c8ff)",
          }}
        />

        <div
          style={{
            maxWidth: 1440,
            margin: "0 auto",
            padding: "10px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Hamburger */}
          <button
            onClick={() => setDrawerOpen((open) => !open)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 8,
              display: "flex",
              flexDirection: "column",
              gap: 5,
            }}
          >
            <span style={{ display: "block", width: 22, height: 2, background: "#00c8ff", borderRadius: 2 }} />
            <span style={{ display: "block", width: 22, height: 2, background: "#00c8ff", borderRadius: 2 }} />
            <span style={{ display: "block", width: 22, height: 2, background: "#00c8ff", borderRadius: 2 }} />
          </button>

          {/* Logo */}
          <Link href="/" style={{ textDecoration: "none" }}>
            <span
              style={{
                fontFamily: "Rajdhani, sans-serif",
                fontSize: 18,
                fontWeight: 700,
                letterSpacing: 2,
              }}
            >
              <span style={{ color: "#00e5ff" }}>SDS</span>
              <span style={{ color: "#fff", marginLeft: 6 }}>PRO</span>
            </span>
          </Link>

          <Link
            href="/mes-commandes"
            style={{
              color: "#00c8ff",
              textDecoration: "none",
              fontSize: 13,
              fontWeight: 600,
              padding: "8px 12px",
              border: "1px solid rgba(0,200,255,0.35)",
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
            title="Mes commandes"
          >
            📦 Mes commandes
          </Link>
          <Link
            href="/panier"
            style={{
              color: "#00c8ff",
              textDecoration: "none",
              fontSize: 13,
              fontWeight: 600,
              padding: "8px 12px",
              border: "1px solid rgba(0,200,255,0.35)",
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
            title="Panier"
          >
            🛒 Panier
            <span
              style={{
                minWidth: 18,
                height: 18,
                borderRadius: 100,
                padding: "0 5px",
                background: cartQty > 0 ? "#00c8ff" : "rgba(122,154,187,0.35)",
                color: cartQty > 0 ? "#03203a" : "#d0e3f5",
                fontSize: 11,
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {cartQty}
            </span>
          </Link>

          {/* Connexion */}
          {displayName ? (
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setUserMenuOpen((v) => !v)}
                style={{
                  color: "#00c8ff",
                  background: "none",
                  fontSize: 13,
                  fontWeight: 600,
                  padding: "8px 14px",
                  border: "1px solid rgba(0,200,255,0.35)",
                  borderRadius: 8,
                  cursor: "pointer",
                }}
                title="Compte"
              >
                👤 {displayName}
              </button>

              {userMenuOpen && (
                <div
                  style={{
                    position: "absolute",
                    right: 0,
                    top: "calc(100% + 8px)",
                    minWidth: 190,
                    background: "rgba(4,15,30,0.98)",
                    border: "1px solid rgba(0,180,255,0.22)",
                    borderRadius: 10,
                    padding: 8,
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                  }}
                >
                  <Link href="/mon-credit" onClick={() => setUserMenuOpen(false)} style={menuLink}>
                    Mon crédit
                  </Link>
                  <button onClick={deconnexion} style={menuLogoutBtn}>
                    Déconnexion
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/connexion"
              style={{
                color: "#00c8ff",
                textDecoration: "none",
                fontSize: 13,
                fontWeight: 600,
                padding: "8px 14px",
                border: "1px solid rgba(0,200,255,0.35)",
                borderRadius: 8,
              }}
            >
              👤 Connexion
            </Link>
          )}
        </div>
      </nav>

      {/* Overlay for drawer and user menu */}
      {(drawerOpen || userMenuOpen) && (
        <div
          onClick={closeMenus}
          style={{
            position: "fixed",
            inset: 0,
            top: 54,
            background: "rgba(0,0,0,0.5)",
            zIndex: 490,
          }}
        />
      )}

      {/* Drawer */}
      <div
        style={{
          position: "fixed",
          top: 54,
          left: drawerOpen ? 0 : -320,
          width: 300,
          height: "calc(100dvh - 54px)",
          background: "rgba(4,15,30,0.98)",
          borderRight: "1px solid rgba(0,180,255,0.22)",
          zIndex: 499,
          transition: "left 0.35s cubic-bezier(0.4,0,0.2,1)",
          padding: 20,
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        <div
          style={{
            fontFamily: "DM Mono, monospace",
            fontSize: 9,
            letterSpacing: 3,
            color: "#7a9abb",
            textTransform: "uppercase",
            marginBottom: 8,
          }}
        >
          Boutique
        </div>

        <Link href="/catalogue" onClick={() => setDrawerOpen(false)} style={drawerLink}>
          📱 Catalogue
        </Link>
        <Link href="/mes-commandes" onClick={() => setDrawerOpen(false)} style={drawerLink}>
          📦 Mes commandes
        </Link>
        <Link href="/panier" onClick={() => setDrawerOpen(false)} style={drawerLink}>
          🛒 Panier ({cartQty})
        </Link>
        <Link href="/accessoires" onClick={() => setDrawerOpen(false)} style={drawerLink}>
          🎧 Accessoires
        </Link>
        <Link href="/ordinateurs" onClick={() => setDrawerOpen(false)} style={drawerLink}>
          💻 Ordinateurs
        </Link>
        <Link href="/credit-halal" onClick={() => setDrawerOpen(false)} style={{ ...drawerLink, color: "#00e564" }}>
          🤝 Achat Échelonné Halal
        </Link>
        {displayName ? (
          <>
            <button
              onClick={() => {
                setUserMenuOpen((v) => !v);
                setDrawerOpen(true);
              }}
              style={drawerBtnNeutral}
            >
              👤 {displayName}
            </button>
            {userMenuOpen && (
              <>
                <Link href="/mon-credit" onClick={closeMenus} style={drawerSubLink}>
                  Mon crédit
                </Link>
                <button onClick={deconnexion} style={drawerSubBtn}>
                  Déconnexion
                </button>
              </>
            )}
          </>
        ) : (
          <Link href="/connexion" onClick={() => setDrawerOpen(false)} style={drawerLink}>
            👤 Connexion
          </Link>
        )}
      </div>
    </>
  );
}

const drawerLink: React.CSSProperties = {
  color: "#bdd4ea",
  textDecoration: "none",
  fontSize: 15,
  fontWeight: 500,
  padding: "13px 16px",
  borderRadius: 10,
  display: "flex",
  alignItems: "center",
  gap: 10,
};

const drawerBtn: React.CSSProperties = {
  color: "#ff9faf",
  background: "none",
  border: "1px solid rgba(255,120,140,0.28)",
  fontSize: 15,
  fontWeight: 500,
  padding: "13px 16px",
  borderRadius: 10,
  display: "flex",
  alignItems: "center",
  gap: 10,
  cursor: "pointer",
  textAlign: "left",
};

const drawerBtnNeutral: React.CSSProperties = {
  color: "#00c8ff",
  background: "none",
  border: "1px solid rgba(0,180,255,0.22)",
  fontSize: 15,
  fontWeight: 500,
  padding: "13px 16px",
  borderRadius: 10,
  display: "flex",
  alignItems: "center",
  gap: 10,
  cursor: "pointer",
  textAlign: "left",
};

const drawerSubLink: React.CSSProperties = {
  color: "#9cc9ff",
  textDecoration: "none",
  fontSize: 14,
  padding: "8px 14px 8px 34px",
};

const drawerSubBtn: React.CSSProperties = {
  color: "#ff9faf",
  background: "none",
  border: "none",
  fontSize: 14,
  padding: "8px 14px 8px 34px",
  cursor: "pointer",
  textAlign: "left",
};

const menuLink: React.CSSProperties = {
  color: "#9cc9ff",
  textDecoration: "none",
  fontSize: 13,
  padding: "8px 10px",
  borderRadius: 8,
  border: "1px solid rgba(0,180,255,0.16)",
};

const menuLogoutBtn: React.CSSProperties = {
  color: "#ff9faf",
  background: "none",
  border: "1px solid rgba(255,120,140,0.28)",
  fontSize: 13,
  padding: "8px 10px",
  borderRadius: 8,
  cursor: "pointer",
  textAlign: "left",
};