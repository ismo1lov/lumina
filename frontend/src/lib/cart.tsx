import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export interface CartItem {
  key: string;
  id: string;
  name: string;
  image: string;
  finish: string;
  color: string;
  assembly: boolean;
  unitPrice: number;
  qty: number;
}

interface CartState {
  items: CartItem[];
  open: boolean;
  setOpen: (v: boolean) => void;
  add: (item: Omit<CartItem, "key">) => void;
  remove: (key: string) => void;
  setQty: (key: string, qty: number) => void;
  clear: () => void;
  count: number;
  subtotal: number;
}

const CartContext = createContext<CartState | null>(null);
const STORAGE_KEY = "lumina-cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* ignore */
    }
  }, [items]);

  const value = useMemo<CartState>(() => {
    const add = (item: Omit<CartItem, "key">) => {
      const key = `${item.id}|${item.finish}|${item.color}|${item.assembly}`;
      setItems((prev) => {
        const existing = prev.find((i) => i.key === key);
        if (existing) {
          return prev.map((i) => (i.key === key ? { ...i, qty: i.qty + item.qty } : i));
        }
        return [...prev, { ...item, key }];
      });
      setOpen(true);
    };

    return {
      items,
      open,
      setOpen,
      add,
      remove: (key) => setItems((prev) => prev.filter((i) => i.key !== key)),
      setQty: (key, qty) =>
        setItems((prev) =>
          qty <= 0
            ? prev.filter((i) => i.key !== key)
            : prev.map((i) => (i.key === key ? { ...i, qty } : i)),
        ),
      clear: () => setItems([]),
      count: items.reduce((n, i) => n + i.qty, 0),
      subtotal: items.reduce((n, i) => n + i.qty * i.unitPrice, 0),
    };
  }, [items, open]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
