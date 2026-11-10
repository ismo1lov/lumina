import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  Heart,
  House,
  Info,
  LayoutGrid,
  Menu,
  Phone,
  Search,
  ShoppingBag,
  User,
  UserPlus,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { products } from "@/data/products";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart";
import { useWishlist } from "@/lib/wishlist";
import { resolveAsset } from "@/lib/assets";
import { AccountDrawer } from "@/components/site/AccountDrawer";
import { useI18n } from "@/lib/i18n";

const links = [
  { to: "/", label: "Home", Icon: House },
  { to: "/catalog", label: "Catalog", Icon: LayoutGrid },
  { to: "/about", label: "About Us", Icon: Info },
  { to: "/contact", label: "Contact", Icon: Phone },
] as const;

export function Navbar() {
  const { t } = useI18n();
  const { count, setOpen } = useCart();
  const { count: wishCount, setOpen: setWishOpen } = useWishlist();
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [search, setSearch] = useState(false);
  const [query, setQuery] = useState("");
  const [menu, setMenu] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isAboutPage = pathname === "/about";
  const isContactPage = pathname === "/contact";

  const goAuth = (mode: "login" | "register") => {
    setProfileOpen(false);
    setAccountOpen(false);
    setMenu(false);
    navigate({ to: "/login", search: { mode } });
  };

  const openAccount = () => {
    setMenu(false);
    setAccountOpen(true);
  };

  const handleProfileClick = () => {
    if (user) {
      openAccount();
    } else {
      setProfileOpen((value) => !value);
    }
  };

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
          isAboutPage || isContactPage
            ? "border-b bg-background"
            : scrolled
              ? "border-b bg-background/85 backdrop-blur-md"
              : "bg-transparent"
        }`}
      >
        <div className="mx-auto flex h-20 max-w-[1400px] items-center justify-between gap-4 px-6 md:gap-5 md:px-8 lg:gap-6 lg:px-12">
          <Link to="/" className="shrink-0 font-display text-2xl tracking-tight">
            Lumina<span className="text-accent">.</span>
          </Link>

          <nav className="hidden items-center gap-5 md:flex lg:gap-9">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                activeOptions={{ exact: l.to === "/" }}
                activeProps={{
                  className: "text-foreground font-semibold border-b border-foreground",
                }}
                inactiveProps={{ className: "text-muted-foreground" }}
                className="whitespace-nowrap pb-0.5 text-[10px] uppercase tracking-[0.14em] transition-colors hover:text-foreground lg:text-[11px] lg:tracking-[0.2em]"
              >
                {t(l.label)}
              </Link>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-4 md:gap-4 lg:gap-5">
            <button
              type="button"
              aria-label={t("Search")}
              className="cursor-pointer md:grid md:size-9 md:place-items-center lg:block"
              onClick={() => setSearch(true)}
            >
              <Search size={17} />
            </button>
            {/* Wishlist, cart and account live in the navbar from 450px up. On
                narrow screens they move into the menu to keep the bar clean. */}
            <button
              type="button"
              aria-label={t("Wishlist")}
              className="relative hidden cursor-pointer min-[451px]:grid min-[451px]:size-9 min-[451px]:place-items-center md:size-9 md:place-items-center lg:block"
              onClick={() => setWishOpen(true)}
            >
              <Heart size={17} />
              {wishCount > 0 && (
                <span className="absolute right-0 top-0 grid size-4 place-items-center rounded-full bg-accent text-[9px] text-accent-foreground md:-right-1 md:-top-1 lg:-right-2 lg:-top-2">
                  {wishCount}
                </span>
              )}
            </button>
            <button
              type="button"
              aria-label={t("Open cart")}
              className="relative hidden cursor-pointer min-[451px]:grid min-[451px]:size-9 min-[451px]:place-items-center md:size-9 md:place-items-center lg:block"
              onClick={() => setOpen(true)}
            >
              <ShoppingBag size={17} />
              {count > 0 && (
                <span className="absolute right-0 top-0 grid size-4 place-items-center rounded-full bg-accent text-[9px] text-accent-foreground md:-right-1 md:-top-1 lg:-right-2 lg:-top-2">
                  {count}
                </span>
              )}
            </button>
            <span className="hidden h-5 w-px bg-border min-[451px]:block" aria-hidden />
            <div className="relative hidden min-[451px]:block">
              <button
                type="button"
                aria-label={user ? t("Open account menu") : t("Account")}
                className="relative grid size-9 cursor-pointer place-items-center rounded-full border border-transparent transition-colors hover:border-border hover:bg-cream"
                onClick={handleProfileClick}
              >
                <User size={17} />
              </button>
              <AnimatePresence>
                {!user && profileOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                      className="absolute right-0 top-full z-50 mt-3 min-w-[190px] border border-border bg-background shadow-xl"
                    >
                      <button
                        type="button"
                        onClick={() => goAuth("login")}
                        className="block w-full cursor-pointer px-5 py-3 text-left text-[11px] uppercase tracking-[0.2em] transition-colors hover:bg-cream hover:text-foreground"
                      >
                        {t("Sign In")}
                      </button>
                      <button
                        type="button"
                        onClick={() => goAuth("register")}
                        className="block w-full cursor-pointer border-t border-border px-5 py-3 text-left text-[11px] uppercase tracking-[0.2em] transition-colors hover:bg-cream hover:text-foreground"
                      >
                        {t("Create Account")}
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
            <button
              type="button"
              aria-label={t("Open menu")}
              className="cursor-pointer md:hidden"
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
            className="fixed inset-0 z-[70] overflow-y-auto bg-background px-6 py-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex justify-end">
              <button type="button" aria-label={t("Close menu")} onClick={() => setMenu(false)}>
                <X size={20} />
              </button>
            </div>
            <nav className="mt-10 flex flex-col gap-4 md:mt-12">
              {/* Page links live in the navbar from 768px up, so the menu only
                  repeats them on small screens. */}
              <div className="flex flex-col gap-1 md:hidden">
                {links.map((l) => (
                  <Link
                    key={l.to}
                    to={l.to}
                    onClick={() => setMenu(false)}
                    className="flex items-center gap-4 py-2.5 font-sans text-xl transition-colors hover:text-accent"
                  >
                    <l.Icon size={19} strokeWidth={1.5} />
                    {t(l.label)}
                  </Link>
                ))}
              </div>

              <div className="max-[450px]:block">
                {/* Wishlist and cart — only on narrow screens, where they are
                    not in the navbar. */}
                <div className="hidden gap-1 border-t pt-6 max-[450px]:grid sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMenu(false);
                      setWishOpen(true);
                    }}
                    className="flex cursor-pointer items-center gap-4 py-2.5 text-left font-sans text-xl transition-colors hover:text-accent"
                  >
                    <Heart size={19} strokeWidth={1.5} />
                    {t("Wishlist")}
                    {wishCount > 0 && (
                      <span className="grid size-6 place-items-center rounded-full bg-accent text-[10px] text-accent-foreground">
                        {wishCount}
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMenu(false);
                      setOpen(true);
                    }}
                    className="flex cursor-pointer items-center gap-4 py-2.5 text-left font-sans text-xl transition-colors hover:text-accent"
                  >
                    <ShoppingBag size={19} strokeWidth={1.5} />
                    {t("Cart")}
                    {count > 0 && (
                      <span className="grid size-6 place-items-center rounded-full bg-accent text-[10px] text-accent-foreground">
                        {count}
                      </span>
                    )}
                  </button>
                </div>

                <div className="mt-4 hidden border-t pt-6 max-[450px]:block">
                  {user ? (
                    <button
                      type="button"
                      onClick={openAccount}
                      className="flex cursor-pointer items-center gap-4 text-left font-sans text-xl transition-colors hover:text-accent"
                    >
                      <User size={19} strokeWidth={1.5} />
                      {user.role === "admin" ? t("Admin Panel") : t("My Account")}
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => goAuth("login")}
                        className="flex cursor-pointer items-center gap-4 text-left font-sans text-xl transition-colors hover:text-accent"
                      >
                        <User size={19} strokeWidth={1.5} />
                        {t("Sign In")}
                      </button>
                      <button
                        type="button"
                        onClick={() => goAuth("register")}
                        className="mt-2 flex cursor-pointer items-center gap-4 text-left font-sans text-xl transition-colors hover:text-accent"
                      >
                        <UserPlus size={19} strokeWidth={1.5} />
                        {t("Create Account")}
                      </button>
                    </>
                  )}
                </div>
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
                  placeholder={t("Search chairs, tables, beds…")}
                  className="w-full bg-transparent font-display text-2xl outline-none placeholder:text-muted-foreground/60"
                />
                <button
                  type="button"
                  aria-label={t("Close search")}
                  onClick={() => setSearch(false)}
                >
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
                        <span className="block text-xs text-muted-foreground">{t(p.category)}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AccountDrawer open={accountOpen} onOpenChange={setAccountOpen} />
    </>
  );
}
