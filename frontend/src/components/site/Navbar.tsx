import { Link, useNavigate } from "@tanstack/react-router";
import { Bell, Heart, LogOut, Menu, Search, ShoppingBag, Trash2, User, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { products } from "@/data/products";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart";
import { useWishlist } from "@/lib/wishlist";

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
  const [notifs, setNotifs] = useState<{
    id: string;
    title: string;
    body: string;
    isRead: boolean;
    createdAt: string;
  }[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!user) return;
    const load = () =>
      api
        .get<{ id: string; title: string; body: string; isRead: boolean; createdAt: string }[]>("/notifications")
        .then(setNotifs)
        .catch(() => {});
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, [user]);

  const unread = notifs.filter((n) => !n.isRead).length;

  const toggleNotifs = () => {
    const next = !notifOpen;
    setNotifOpen(next);
    if (next && unread > 0) {
      setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })));
      notifs
        .filter((n) => !n.isRead)
        .forEach((n) => api.patch(`/notifications/${n.id}/read`, { isRead: true }).catch(() => {}));
    }
  };

  const deleteNotif = (id: string) => {
    setNotifs((prev) => prev.filter((n) => n.id !== id));
    api.delete(`/notifications/${id}`).catch(() => {});
  };

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
                activeProps={{ className: "text-foreground font-semibold border-b border-foreground" }}
                inactiveProps={{ className: "text-muted-foreground" }}
                className="text-[11px] uppercase tracking-[0.2em] transition-colors hover:text-foreground pb-0.5"
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-5">
            <button type="button" aria-label="Search" className="cursor-pointer" onClick={() => setSearch(true)}>
              <Search size={17} />
            </button>
            <button type="button" aria-label="Wishlist" className="relative hidden cursor-pointer sm:block" onClick={() => setWishOpen(true)}>
              <Heart size={17} />
              {wishCount > 0 && (
                <span className="absolute -right-2 -top-2 grid size-4 place-items-center rounded-full bg-accent text-[9px] text-accent-foreground">
                  {wishCount}
                </span>
              )}
            </button>
            {user && (
              <div className="relative hidden sm:block">
                <button
                  type="button"
                  aria-label="Notifications"
                  className="relative cursor-pointer"
                  onClick={toggleNotifs}
                >
                  <Bell size={17} />
                  {unread > 0 && (
                    <span className="absolute -right-2 -top-2 grid size-4 place-items-center rounded-full bg-accent text-[9px] text-accent-foreground">
                      {unread}
                    </span>
                  )}
                </button>
                <AnimatePresence>
                  {notifOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.98 }}
                        transition={{ duration: 0.18, ease: "easeOut" }}
                        className="absolute right-0 top-9 z-50 w-[340px] overflow-hidden border bg-background shadow-2xl"
                      >
                        <div className="border-b px-5 py-3.5">
                          <p className="font-display text-sm">Notifications</p>
                        </div>
                        <div className="max-h-[320px] overflow-y-auto">
                          {notifs.length === 0 ? (
                            <p className="px-5 py-10 text-center text-xs text-muted-foreground">
                              No notifications yet
                            </p>
                          ) : (
                            notifs.map((n) => (
                              <div key={n.id} className="group border-b px-5 py-3.5 last:border-0">
                                <div className="flex items-start justify-between gap-3">
                                  <p className="text-xs font-semibold">{n.title}</p>
                                  <button
                                    type="button"
                                    aria-label="Delete notification"
                                    onClick={() => deleteNotif(n.id)}
                                    className="cursor-pointer text-muted-foreground/40 opacity-60 transition-colors hover:text-red-500 sm:opacity-0 sm:group-hover:opacity-100"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{n.body}</p>
                                <p className="mt-1.5 text-[10px] text-muted-foreground/60">
                                  {new Date(n.createdAt).toLocaleString()}
                                </p>
                              </div>
                            ))
                          )}
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            )}
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
              <Link to="/dashboard" aria-label="My Account" className="hidden cursor-pointer sm:block">
                <User size={17} />
              </Link>
            ) : (
              <Link to="/login" aria-label="Sign in" className="hidden cursor-pointer sm:block">
                <User size={17} />
              </Link>
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
                    <Link to="/dashboard" onClick={() => setMenu(false)} className="block font-display text-xl">
                      My Account
                    </Link>
                    <button
                      onClick={() => { logout(); navigate({ to: "/login" }); setMenu(false); }}
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
                        src={p.image}
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
