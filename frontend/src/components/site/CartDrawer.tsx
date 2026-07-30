import { Link } from "@tanstack/react-router";
import { Minus, Plus, ShoppingBag, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { ASSEMBLY_FEE, formatUZS } from "@/data/products";
import { useCart } from "@/lib/cart";

export function CartDrawer() {
  const { open, setOpen, items, setQty, remove, subtotal } = useCart();

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60]">
          <motion.button
            type="button"
            aria-label="Close cart"
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
              <h2 className="font-display text-xl">Your cart</h2>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close cart">
                <X size={18} />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto px-6">
              {items.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                  <ShoppingBag size={26} className="text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Your cart is quietly empty.</p>
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
                    <li key={item.key} className="flex gap-4 py-5">
                      <img
                        src={item.image}
                        alt={item.name}
                        loading="lazy"
                        width={96}
                        height={96}
                        className="size-24 shrink-0 bg-cream object-cover"
                      />
                      <div className="flex flex-1 flex-col gap-1">
                        <div className="flex justify-between gap-3">
                          <p className="font-display text-base leading-tight">{item.name}</p>
                          <button
                            type="button"
                            onClick={() => remove(item.key)}
                            aria-label={`Remove ${item.name}`}
                          >
                            <X size={14} className="text-muted-foreground" />
                          </button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {item.finish} · {item.color}
                        </p>
                        {item.assembly && (
                          <p className="text-xs text-accent">
                            + Home assembly ({formatUZS(ASSEMBLY_FEE)})
                          </p>
                        )}
                        <div className="mt-auto flex items-center justify-between pt-2">
                          <div className="flex items-center border">
                            <button
                              type="button"
                              className="px-2.5 py-1.5"
                              onClick={() => setQty(item.key, item.qty - 1)}
                              aria-label="Decrease quantity"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="w-7 text-center text-xs">{item.qty}</span>
                            <button
                              type="button"
                              className="px-2.5 py-1.5"
                              onClick={() => setQty(item.key, item.qty + 1)}
                              aria-label="Increase quantity"
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                          <span className="text-sm">{formatUZS(item.unitPrice * item.qty)}</span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <footer className="border-t px-6 py-5">
              <div className="flex items-center justify-between pb-4 text-sm">
                <span className="eyebrow">Subtotal</span>
                <span className="font-display text-xl">{formatUZS(subtotal)}</span>
              </div>
              <Link
                to="/checkout"
                onClick={() => setOpen(false)}
                className="block bg-primary py-3.5 text-center text-[11px] uppercase tracking-[0.22em] text-primary-foreground transition-opacity hover:opacity-90"
              >
                Proceed to checkout
              </Link>
              <p className="pt-3 text-center text-[11px] text-muted-foreground">
                Delivery and assembly calculated at checkout.
              </p>
            </footer>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
