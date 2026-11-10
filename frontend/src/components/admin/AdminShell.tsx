import { Link, useRouter } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  BadgePercent,
  BarChart3,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  Package,
  Settings,
  Sofa,
  Users,
  X,
} from "lucide-react";

import { useAuth } from "@/lib/auth-context";
import { API_BASE } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/site/LanguageSwitcher";

export function avatarUrl(avatar?: string): string | null {
  if (!avatar) return null;
  if (avatar.startsWith("/uploads")) return API_BASE + avatar;
  return avatar;
}

export const adminNav = [
  { id: "overview", label: "Overview", tab: "overview", Icon: LayoutDashboard },
  { id: "orders", label: "Orders", tab: "orders", Icon: Package },
  { id: "products", label: "Products", tab: "products", Icon: Sofa },
  { id: "users", label: "Customers", tab: "users", Icon: Users },
  { id: "messages", label: "Messages", tab: "messages", Icon: Mail },
  { id: "analytics", label: "Analytics", tab: "analytics", Icon: BarChart3 },
  { id: "discount", label: "Discount", tab: "discount", Icon: BadgePercent },
  { id: "settings", label: "Settings", tab: null, Icon: Settings },
] as const;

export function AdminShell({
  active,
  counts = {},
  children,
}: {
  active: string;
  /** Optional counter next to a nav item, e.g. orders: 12. */
  counts?: Record<string, number>;
  children: ReactNode;
}) {
  const { t } = useI18n();
  const { user, logout } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.navigate({ to: "/admin/login" });
  };

  const navItems = (
    <nav className="space-y-1">
      {adminNav.map((n) => {
        const isActive = active === n.id;
        const count = counts[n.id];
        return (
          <Link
            key={n.id}
            to={n.tab ? "/admin" : "/admin/settings"}
            search={n.tab ? { tab: n.tab } : undefined}
            onClick={() => setMenuOpen(false)}
            className={`flex items-center gap-3 rounded-xl px-4 py-3 text-[12px] uppercase tracking-[0.14em] transition-colors ${
              isActive
                ? "bg-walnut text-cream shadow-[0_12px_28px_-14px_rgba(38,27,20,0.6)]"
                : "text-muted-foreground hover:bg-cream hover:text-walnut"
            }`}
          >
            <n.Icon size={16} strokeWidth={1.6} />
            <span className="flex-1">{t(n.label)}</span>
            {typeof count === "number" && count > 0 && (
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] tabular-nums ${
                  isActive ? "bg-cream/20 text-cream" : "bg-cream text-walnut"
                }`}
              >
                {count}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );

  const userBlock = (
    <div className="space-y-4">
      <LanguageSwitcher />
      <div className="flex items-center gap-3">
        {avatarUrl(user?.avatar) ? (
          <img
            src={avatarUrl(user?.avatar)!}
            alt={user?.name}
            className="size-9 rounded-full object-cover ring-2 ring-cream"
          />
        ) : (
          <span className="grid size-9 place-items-center rounded-full bg-walnut font-display text-xs text-cream">
            {user?.name.slice(0, 1).toUpperCase()}
          </span>
        )}
        <div className="min-w-0 leading-tight">
          <p className="truncate text-sm font-medium">{user?.name}</p>
          <p className="truncate text-[11px] text-muted-foreground">
            {user?.username || user?.email}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={handleLogout}
        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-border bg-white/70 px-4 py-2.5 text-[10px] uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:border-walnut/30 hover:text-walnut"
      >
        <LogOut size={13} />
        {t("Sign Out")}
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Desktop side panel */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[264px] flex-col border-r border-border bg-white/80 backdrop-blur-xl lg:flex">
        <div className="flex h-20 items-center px-6">
          <Link to="/admin" className="font-display text-2xl tracking-tight">
            Lumina<span className="text-accent">.</span>
          </Link>
          <span className="ml-3 rounded-full bg-cream px-2.5 py-1 text-[9px] uppercase tracking-[0.2em] text-walnut">
            {t("Admin")}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-4">{navItems}</div>

        <div className="border-t border-border p-4">{userBlock}</div>
      </aside>

      {/* Mobile bar */}
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur lg:hidden">
        <Link to="/admin" className="font-display text-xl">
          Lumina<span className="text-accent">.</span>
        </Link>
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label={t("Open menu")}
          className="grid size-9 place-items-center"
        >
          <Menu size={19} />
        </button>
      </header>

      {/* Mobile side panel */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="fixed inset-0 z-50 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              type="button"
              aria-label={t("Close menu")}
              onClick={() => setMenuOpen(false)}
              className="absolute inset-0 bg-foreground/30"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-y-0 left-0 flex w-[280px] flex-col border-r border-border bg-background"
            >
              <div className="flex h-16 items-center justify-between px-5">
                <Link to="/admin" className="font-display text-xl">
                  Lumina<span className="text-accent">.</span>
                </Link>
                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  aria-label={t("Close menu")}
                >
                  <X size={18} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-3 pb-4">{navItems}</div>
              <div className="border-t border-border p-4">{userBlock}</div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="lg:pl-[264px]">
        <div className="mx-auto max-w-6xl px-5 py-8 md:px-8 lg:px-10 lg:py-10">{children}</div>
      </main>
    </div>
  );
}
