"use client";

import * as React from "react";
import type { CartItem } from "@/lib/types";

const STORAGE_KEY = "snow-cart-v1";

interface CartCtx {
  items: CartItem[];
  add: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  setPrice: (id: string, price: number, gstRate: number) => void;
  clear: () => void;
  count: number;
}

const Ctx = React.createContext<CartCtx | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<CartItem[]>([]);
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      // ignore corrupt storage
    }
    setLoaded(true);
  }, []);

  React.useEffect(() => {
    if (loaded) localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, loaded]);

  const add: CartCtx["add"] = (item, qty = 1) =>
    setItems((prev) => {
      const found = prev.find((i) => i.id === item.id);
      if (found)
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + qty } : i
        );
      return [...prev, { ...item, quantity: qty }];
    });

  const remove: CartCtx["remove"] = (id) =>
    setItems((prev) => prev.filter((i) => i.id !== id));

  const setQty: CartCtx["setQty"] = (id, qty) =>
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, quantity: Math.max(1, qty) } : i))
    );

  const setPrice: CartCtx["setPrice"] = (id, price, gstRate) =>
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, price, gstRate } : i))
    );

  const clear = () => setItems([]);

  const count = items.reduce((n, i) => n + i.quantity, 0);

  return (
    <Ctx.Provider value={{ items, add, remove, setQty, setPrice, clear, count }}>
      {children}
    </Ctx.Provider>
  );
}

export function useCart() {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
