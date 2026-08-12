"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getCart, saveCart, type CartItem } from "@/lib/cart";

const LIVRAISON = 10000;
const CHARGEUR = 15000;
const ICLOUD = 5000;

function formatPrice(n: number) {
  return n.toLocaleString("fr-FR");
}

function lineTotal(item: CartItem) {
  const price = item.price ?? item.unitPrice;
  const base = price * item.qty;
  const extras = (item.charger ? CHARGEUR * item.qty : 0) + (item.icloud ? ICLOUD * item.qty : 0);
  return base + extras;
}

const qtyBtn: React.CSSProperties = {
  width: 34,
  height: 34,
  borderRadius: 10,
  border: "1px solid rgba(0,200,255,0.3)",
  background: "rgba(0,200,255,0.08)",
  color: "#00c8ff",
  fontSize: 18,
  cursor: "pointer",
  fontWeight: 700,
};

export default function PanierPage() {
  const [items, setItems] = useState<CartItem[]>([]);

  function refresh() {
    setItems(getCart());
  }

  useEffect(() => {
    refresh();
    const onUp = () => refresh();
    window.addEventListener("sds-cart-updated", onUp);
    return () => window.removeEventListener("sds-cart-updated", onUp);
  }, []);

  function setQty(index: number, qty: number) {
    const next = [...items];
    if (qty < 1) {
      next.splice(index, 1);
    } else {
      next[index] = { ...next[index], qty };
    }
    saveCart(next);
    setItems(next);
  }

  function remove(index: number) {
    const next = items.filter((_, i) => i !== index);
    saveCart(next);
    setItems(next);
  }

  const subtotal = items.reduce((s, i) => s + lineTotal(i), 0);
  const total = items.length ? subtotal + LIVRAISON : 0;

  return (
    <main style={{ paddingTop: 90, paddingBottom: 100, minHeight: "100vh", maxWidth: 720, margin: "0 auto", paddingLeft: 16, paddingRight: 16 }}>
      <div style={{ fontFamily: "DM Mono, monospace", fontSize: 10, letterSpacing: 2, color: "#00c8ff", marginBottom: 8 }}>
        // PANIER
      </div>
      <h1 style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 28, fontWeight: 700, marginBottom: 24 }}>
        Mon panier
      </h1>

      {!items.length && (
        <div style={{ textAlign: "center", padding: "48px 16px", color: "#7a9abb" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🛒</div>
          <div style={{ marginBottom: 16 }}>Votre panier est vide</div>
          <Link
            href="/catalogue"
            style={{
              display: "inline-block",
              padding: "12px 20px",
              borderRadius: 10,
              background: "linear-gradient(135deg,#0033cc,#00aaff)",
              color: "#fff",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            Voir le catalogue →
          </Link>
        </div>
      )}

      {items.map((item, index) => (
        <div
          key={`${item.productId}-${item.storage || ""}-${item.color || ""}-${index}`}
          style={{
            background: "rgba(7,24,40,0.7)",
            border: "1px solid rgba(0,180,255,0.22)",
            borderRadius: 16,
            padding: 14,
            marginBottom: 12,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 8 }}>
            <div>
              <div style={{ fontWeight: 700 }}>{item.name}</div>
              <div style={{ fontSize: 12, color: "#7a9abb", marginTop: 4 }}>
                {[item.storage, item.color, item.charger && "Chargeur", item.icloud && "iCloud"].filter(Boolean).join(" · ") || "Standard"}
              </div>
            </div>
            <button
              type="button"
              onClick={() => remove(index)}
              style={{
                border: "1px solid rgba(255,80,80,0.3)",
                background: "rgba(255,80,80,0.08)",
                color: "#ff6b6b",
                borderRadius: 8,
                padding: "6px 10px",
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              Suppr.
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button type="button" onClick={() => setQty(index, item.qty - 1)} style={qtyBtn}>−</button>
              <span style={{ minWidth: 24, textAlign: "center", fontWeight: 700 }}>{item.qty}</span>
              <button type="button" onClick={() => setQty(index, item.qty + 1)} style={qtyBtn}>+</button>
            </div>
            <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 20, fontWeight: 700, color: "#00c8ff" }}>
              {formatPrice(lineTotal(item))} <small style={{ fontSize: 11, color: "#7a9abb" }}>FCFA</small>
            </div>
          </div>
        </div>
      ))}

      {!!items.length && (
        <div
          style={{
            marginTop: 20,
            padding: 16,
            borderRadius: 16,
            border: "1px solid rgba(0,200,255,0.2)",
            background: "rgba(0,200,255,0.04)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, color: "#7a9abb", fontSize: 13 }}>
            <span>Sous-total</span>
            <span>{formatPrice(subtotal)} FCFA</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, color: "#7a9abb", fontSize: 13 }}>
            <span>Livraison Dakar</span>
            <span>{formatPrice(LIVRAISON)} FCFA</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
            <strong>Total</strong>
            <strong style={{ color: "#00c8ff", fontSize: 22, fontFamily: "Rajdhani, sans-serif" }}>
              {formatPrice(total)} FCFA
            </strong>
          </div>

          <Link
            href="/checkout"
            style={{
              display: "block",
              textAlign: "center",
              padding: 14,
              borderRadius: 12,
              background: "linear-gradient(135deg,#0033cc,#00aaff)",
              color: "#fff",
              fontWeight: 700,
              textDecoration: "none",
              fontFamily: "Rajdhani, sans-serif",
              letterSpacing: 1,
            }}
          >
            COMMANDER →
          </Link>
        </div>
      )}
    </main>
  );
}
