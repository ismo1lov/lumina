import { Link, useRouter } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { motion } from "motion/react";
import { LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { API_BASE } from "@/lib/api";

export function avatarUrl(avatar?: string): string | null {
  if (!avatar) return null;
  if (avatar.startsWith("/uploads")) return API_BASE + avatar;
  return avatar;
}

export function AdminShell({
  active,
  children,
}: {
  active: "dashboard" | "settings";
  children: ReactNode;
}) {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.navigate({ to: "/admin/login" });
  };

  const nav = [
    { id: "dashboard", label: "Dashboard", to: "/admin" },
    { id: "settings", label: "Settings", to: "/admin/settings" },
  ] as const;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-10">
          <div className="flex items-center gap-7">
            <Link to="/admin" className="font-display text-2xl">
              Lumina<span className="text-accent">.</span>
            </Link>
            <nav className="hidden items-center gap-1 sm:flex">
              {nav.map((n) => (
                <Link
                  key={n.id}
                  to={n.to}
                  className={`rounded-full px-4 py-2 text-[11px] uppercase tracking-[0.15em] transition-colors ${
                    active === n.id
                      ? "bg-walnut text-cream shadow-[0_10px_24px_-10px_rgba(38,27,20,0.5)]"
                      : "text-muted-foreground hover:text-walnut"
                  }`}
                >
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-5">
            <div className="hidden items-center gap-3 sm:flex">
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
              <div className="leading-tight">
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-[11px] text-muted-foreground">{user?.email}</p>
              </div>
            </div>
            <motion.button
              onClick={handleLogout}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.96 }}
              className="flex items-center gap-2 rounded-full border border-border bg-white/70 px-4 py-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:border-walnut/30 hover:text-walnut"
            >
              <LogOut size={13} />
              Sign out
            </motion.button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-10 lg:px-10">{children}</main>
    </div>
  );
}
