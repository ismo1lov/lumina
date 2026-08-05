import { Link } from "@tanstack/react-router";
import { Heart, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { formatUZS } from "@/data/products";
import { useWishlist } from "@/lib/wishlist";
import { resolveAsset } from "@/lib/assets";

export function WishlistDrawer() {
  const { open, setOpen, items, toggle } = useWishlist();

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60]">
          <motion.button
            type="button"
            aria-label="Close wishlist"
            className="absolute inset-0 bg-foreground/30 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          />
          <motion.aside
            className="absolute right-0 top-0 flex h-full w-full max-w-[440px] flex-col bg-background"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <header className="flex items-center justify-between border-b px-6 py-5">
              <h2 className="font-display text-xl">Wishlist</h2>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close wishlist">
                <X size={18} />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto px-6">
              {items.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                  <Heart size={26} className="text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Your wishlist is empty.</p>
                  <Link
                    to="/catalog"
                    onClick={() => setOpen(false)}
                    className="text-[11px] uppercase tracking-[0.2em] link-underline"
                  >
                    Browse the collection
                  </Link>
                </div>
              ) : (
                <ul className="divide-y">
                  {items.map((item) => (
                    <li key={item.id} className="flex gap-4 py-5">
                      <img
                        src={resolveAsset(item.image)}
                        alt={item.name}
                        loading="lazy"
                        width={96}
                        height={96}
                        className="size-24 shrink-0 bg-cream object-cover"
                      />
                      <div className="flex flex-1 flex-col gap-1">
                        <div className="flex justify-between gap-3">
                          <Link
                            to="/product/$id"
                            params={{ id: item.id }}
                            onClick={() => setOpen(false)}
                            className="font-display text-base leading-tight link-underline"
                          >
                            {item.name}
                          </Link>
                          <button
                            type="button"
                            onClick={() => toggle(item)}
                            aria-label={`Remove ${item.name}`}
                          >
                            <X size={14} className="text-muted-foreground" />
                          </button>
                        </div>
                        <p className="text-sm text-muted-foreground">{formatUZS(item.price)}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
