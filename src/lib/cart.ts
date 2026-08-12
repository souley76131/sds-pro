export const CART_KEY = "sds_cart";
export const CART_UPDATED_EVENT = "sds-cart-updated";

export type CartItem = {
  productId: string;
  name: string;
  model?: string;
  brand?: string;
  emoji?: string;
  unitPrice: number;
  price?: number;
  qty: number;
  boutiqueId?: string | null;
  boutiqueNom?: string | null;
  storage?: string;
  color?: string;
  charger?: boolean;
  icloud?: boolean;
};

export function readCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x) => x && typeof x.productId === "string" && Number(x.qty) > 0);
  } catch {
    return [];
  }
}

export function writeCart(items: CartItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CART_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(CART_UPDATED_EVENT));
}

export function getCart() {
  return readCart();
}

export function saveCart(items: CartItem[]) {
  writeCart(items);
}

export function clearCart() {
  writeCart([]);
}

export function addToCart(item: CartItem) {
  const items = readCart();
  const idx = items.findIndex(
    (x) =>
      x.productId === item.productId &&
      (x.storage || "") === (item.storage || "") &&
      (x.color || "") === (item.color || "") &&
      (x.boutiqueId || "") === (item.boutiqueId || "")
  );

  if (idx >= 0) {
    items[idx] = {
      ...items[idx],
      qty: Math.max(1, Number(items[idx].qty || 0) + Math.max(1, Number(item.qty || 1))),
    };
  } else {
    items.push({ ...item, qty: Math.max(1, Number(item.qty || 1)), price: item.price ?? item.unitPrice });
  }

  writeCart(items);
}

export function getCartQty(items: CartItem[] = readCart()) {
  return items.reduce((sum, i) => sum + Math.max(1, Number(i.qty || 0)), 0);
}