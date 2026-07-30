import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export interface WishlistItem {
  id: string;
  name: string;
  image: string;
  price: number;
}

interface WishlistState {
  items: WishlistItem[];
  open: boolean;
  setOpen: (v: boolean) => void;
  toggle: (item: WishlistItem) => void;
  has: (id: string) => boolean;
  count: number;
}

const WishlistContext = createContext<WishlistState | null>(null);
const STORAGE_KEY = "lumina-wishlist";

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch { /* ignore */ }
  }, [items]);

  const value = useMemo<WishlistState>(() => ({
    items,
    open,
    setOpen,
    toggle: (item) => {
      setItems((prev) => {
        const exists = prev.find((i) => i.id === item.id);
        if (exists) return prev.filter((i) => i.id !== item.id);
        return [...prev, item];
      });
    },
    has: (id) => items.some((i) => i.id === id),
    count: items.length,
  }), [items, open]);

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used inside WishlistProvider");
  return ctx;
}
