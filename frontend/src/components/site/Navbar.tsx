import { Link, useNavigate } from "@tanstack/react-router";
import { Heart, LogOut, Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { products } from "@/data/products";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart";
import { useWishlist } from "@/lib/wishlist";
import { resolveAsset } from "@/lib/assets";

const links = [
  { to: "/", label: "Home" },
  { to: "/catalog", label: "Catalog" },
  { to: "/categories", label: "Categories" },
  { to: "/about", label: "About Us" },
  { to: "/contact", label: "Contact" },
] as const;

export function Navbar() {
  const { count, setOpen } = useCart();
  const { count: wishCount, setOpen: setWishOpen } = useWishlist();
  const { user, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [search, setSearch] = useState(false);
  const [query, setQuery] = useState("");
  const [menu, setMenu] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const results = query
    ? products.filter((p) => p.name.toLowerCase().includes(query.toLowerCase())).slice(0, 5)
    : [];

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
          scrolled ? "border-b bg-background/85 backdrop-blur-md" : "bg-transparent"
        }`}
      >
        <div className="mx-auto flex h-20 max-w-[1400px] items-center justify-between gap-6 px-6 lg:px-12">
          <Link to="/" className="font-display text-2xl tracking-tight">
            Lumina<span className="text-accent">.</span>
          </Link>

          <nav className="hidden items-center gap-9 lg:flex">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                activeOptions={{ exact: l.to === "/" }}
                activeProps={{
                  className: "text-foreground font-semibold border-b border-foreground",
                }}
                inactiveProps={{ className: "text-muted-foreground" }}
                className="text-[11px] uppercase tracking-[0.2em] transition-colors hover:text-foreground pb-0.5"
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-5">
            <button
              type="button"
              aria-label="Search"
              className="cursor-pointer"
              onClick={() => setSearch(true)}
            >
              <Search size={17} />
            </button>
            <button
              type="button"
              aria-label="Wishlist"
              className="relative hidden cursor-pointer sm:block"
              onClick={() => setWishOpen(true)}
            >
              <Heart size={17} />
              {wishCount > 0 && (
                <span className="absolute -right-2 -top-2 grid size-4 place-items-center rounded-full bg-accent text-[9px] text-accent-foreground">
                  {wishCount}
                </span>
              )}
            </button>
            <button
              type="button"
              aria-label="Open cart"
              className="relative cursor-pointer"
              onClick={() => setOpen(true)}
            >
              <ShoppingBag size={17} />
              {count > 0 && (
                <span className="absolute -right-2 -top-2 grid size-4 place-items-center rounded-full bg-accent text-[9px] text-accent-foreground">
                  {count}
                </span>
              )}
            </button>
            <span className="hidden h-5 w-px bg-border sm:block" aria-hidden />
            {user ? (
              <Link
                to={user.role === "admin" ? "/admin" : "/dashboard"}
                aria-label={user.role === "admin" ? "Admin Panel" : "My Account"}
                className="hidden cursor-pointer sm:block"
              >
                <User size={17} />
              </Link>
            ) : (
              <div className="relative hidden sm:block">
                <button
                  type="button"
                  aria-label="Account"
                  className="cursor-pointer"
                  onClick={() => setProfileOpen((v) => !v)}
                >
                  <User size={17} />
                </button>
                <AnimatePresence>
                  {profileOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.18, ease: "easeOut" }}
                        className="absolute right-0 top-full z-50 mt-3 min-w-[190px] border border-border bg-background shadow-xl"
                      >
                        <Link
                          to="/login"
                          onClick={() => setProfileOpen(false)}
                          className="block px-5 py-3 text-[11px] uppercase tracking-[0.2em] transition-colors hover:bg-cream hover:text-foreground"
                        >
                          Sign In
                        </Link>
                        <Link
                          to="/register"
                          onClick={() => setProfileOpen(false)}
                          className="block border-t border-border px-5 py-3 text-[11px] uppercase tracking-[0.2em] transition-colors hover:bg-cream hover:text-foreground"
                        >
                          Create Account
                        </Link>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            )}
            <button
              type="button"
              aria-label="Open menu"
              className="cursor-pointer lg:hidden"
              onClick={() => setMenu(true)}
            >
              <Menu size={18} />
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {menu && (
          <motion.div
            className="fixed inset-0 z-[70] bg-background px-6 py-6 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex justify-end">
              <button type="button" aria-label="Close menu" onClick={() => setMenu(false)}>
                <X size={20} />
              </button>
            </div>
            <nav className="mt-12 flex flex-col gap-7">
              {links.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  onClick={() => setMenu(false)}
                  className="font-display text-3xl"
                >
                  {l.label}
                </Link>
              ))}
              <div className="mt-4 border-t pt-6">
                {user ? (
                  <>
                    <Link
                      to={user.role === "admin" ? "/admin" : "/dashboard"}
                      onClick={() => setMenu(false)}
                      className="block font-display text-xl"
                    >
                      {user.role === "admin" ? "Admin Panel" : "My Account"}
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        navigate({ to: "/" });
                        setMenu(false);
                      }}
                      className="mt-4 flex items-center gap-3 font-display text-xl text-muted-foreground"
                    >
                      <LogOut size={18} /> Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setMenu(false)}
                      className="block font-display text-xl"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setMenu(false)}
                      className="mt-4 block font-display text-xl"
                    >
                      Create Account
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {search && (
          <motion.div
            className="fixed inset-0 z-[70] bg-background/95 backdrop-blur"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="mx-auto max-w-2xl px-6 pt-32">
              <div className="flex items-center gap-4 border-b pb-4">
                <Search size={18} className="text-muted-foreground" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search chairs, tables, beds…"
                  className="w-full bg-transparent font-display text-2xl outline-none placeholder:text-muted-foreground/60"
                />
                <button type="button" aria-label="Close search" onClick={() => setSearch(false)}>
                  <X size={18} />
                </button>
              </div>
              <ul className="pt-6">
                {results.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      className="flex w-full items-center gap-4 py-3 text-left"
                      onClick={() => {
                        setSearch(false);
                        setQuery("");
                        navigate({ to: "/product/$id", params: { id: p.id } });
                      }}
                    >
                      <img
                        src={resolveAsset(p.image)}
                        alt={p.name}
                        loading="lazy"
                        width={56}
                        height={56}
                        className="size-14 bg-cream object-cover"
                      />
                      <span>
                        <span className="block font-display text-base">{p.name}</span>
                        <span className="block text-xs text-muted-foreground">{p.category}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
