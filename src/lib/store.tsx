import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type CartLine = {
  productId: string;
  slug: string;
  name: string;
  image: string;
  price: number;
  color: string;
  size: string;
  qty: number;
};

type StoreValue = {
  cart: CartLine[];
  wishlist: string[];
  orders: string[];
  hydrated: boolean;
  cartCount: number;
  cartTotal: number;
  addToCart: (line: CartLine) => void;
  setQty: (key: string, qty: number) => void;
  removeLine: (key: string) => void;
  clearCart: () => void;
  toggleWish: (slug: string) => void;
  isWished: (slug: string) => boolean;
  rememberOrder: (code: string) => void;
};

const StoreContext = createContext<StoreValue | null>(null);

export const lineKey = (l: Pick<CartLine, "productId" | "color" | "size">) => `${l.productId}|${l.color}|${l.size}`;

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [orders, setOrders] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setCart(read<CartLine[]>("siren.cart", []));
    setWishlist(read<string[]>("siren.wishlist", []));
    setOrders(read<string[]>("siren.orders", []));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem("siren.cart", JSON.stringify(cart));
  }, [cart, hydrated]);
  useEffect(() => {
    if (hydrated) window.localStorage.setItem("siren.wishlist", JSON.stringify(wishlist));
  }, [wishlist, hydrated]);
  useEffect(() => {
    if (hydrated) window.localStorage.setItem("siren.orders", JSON.stringify(orders));
  }, [orders, hydrated]);

  const addToCart = useCallback((line: CartLine) => {
    setCart((prev) => {
      const key = lineKey(line);
      const found = prev.find((l) => lineKey(l) === key);
      if (found) return prev.map((l) => (lineKey(l) === key ? { ...l, qty: Math.min(20, l.qty + line.qty) } : l));
      return [...prev, line];
    });
  }, []);

  const setQty = useCallback((key: string, qty: number) => {
    setCart((prev) =>
      prev
        .map((l) => (lineKey(l) === key ? { ...l, qty: Math.max(0, Math.min(20, qty)) } : l))
        .filter((l) => l.qty > 0),
    );
  }, []);

  const removeLine = useCallback((key: string) => setCart((prev) => prev.filter((l) => lineKey(l) !== key)), []);
  const clearCart = useCallback(() => setCart([]), []);
  const toggleWish = useCallback(
    (slug: string) => setWishlist((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug])),
    [],
  );
  const rememberOrder = useCallback(
    (code: string) => setOrders((prev) => (prev.includes(code) ? prev : [code, ...prev].slice(0, 30))),
    [],
  );

  const value = useMemo<StoreValue>(
    () => ({
      cart,
      wishlist,
      orders,
      hydrated,
      cartCount: cart.reduce((n, l) => n + l.qty, 0),
      cartTotal: cart.reduce((n, l) => n + l.qty * l.price, 0),
      addToCart,
      setQty,
      removeLine,
      clearCart,
      toggleWish,
      isWished: (slug: string) => wishlist.includes(slug),
      rememberOrder,
    }),
    [cart, wishlist, orders, hydrated, addToCart, setQty, removeLine, clearCart, toggleWish, rememberOrder],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
