import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ComponentType } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Bell,
  ChevronRight,
  Heart,
  LayoutDashboard,
  LogIn,
  LogOut,
  Package,
  Settings,
  UserPlus,
  X,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import { useWishlist } from "@/lib/wishlist";
import { UserAvatar } from "@/components/account/UserAvatar";

interface AccountDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type AccountTab = "orders" | "notifications" | "settings";

interface MenuItemProps {
  icon: ComponentType<{ size?: number | string; strokeWidth?: number; className?: string }>;
  title: string;
  badge?: number;
  onClick: () => void;
}

function MenuItem({ icon: Icon, title, badge, onClick }: MenuItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center gap-3 border border-transparent px-3 py-3 text-left transition-colors hover:border-border/60 hover:bg-cream/60"
    >
      <span className="grid size-10 shrink-0 place-items-center bg-cream text-accent transition-colors group-hover:bg-accent/5">
        <Icon size={17} strokeWidth={1.6} />
      </span>
      <span className="min-w-0 flex-1 text-sm font-medium text-foreground">{title}</span>
      {badge && badge > 0 ? (
        <span className="grid min-w-5 place-items-center rounded-full bg-accent px-1.5 py-0.5 text-[9px] font-semibold text-accent-foreground">
          {badge}
        </span>
      ) : null}
      <ChevronRight
        size={15}
        className="shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5"
      />
    </button>
  );
}

export function AccountDrawer({ open, onOpenChange }: AccountDrawerProps) {
  const { t } = useI18n();
  const { user, logout } = useAuth();
  const { count: wishCount, setOpen: setWishOpen } = useWishlist();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!open || !user || user.role === "admin") return;
    let active = true;

    api
      .get<{ id: string; isRead: boolean }[]>("/notifications")
      .then((rows) => {
        if (active) setUnreadCount(rows.filter((n) => !n.isRead).length);
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [open, user]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  const close = () => onOpenChange(false);

  const goTab = (tab: AccountTab) => {
    close();
    if (tab === "orders") {
      navigate({ to: "/account/orders" });
      return;
    }
    if (tab === "notifications") {
      navigate({ to: "/account/notifications" });
      return;
    }
    navigate({ to: "/account/settings" });
  };

  const goAuth = (mode: "login" | "register") => {
    close();
    navigate({ to: "/login", search: { mode } });
  };

  const handleLogout = () => {
    close();
    logout();
    navigate({ to: "/" });
  };

  const openWishlist = () => {
    close();
    setWishOpen(true);
  };

  const isAdmin = user?.role === "admin";

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60]">
          <motion.button
            type="button"
            aria-label={t("Close account menu")}
            className="absolute inset-0 bg-foreground/30 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
          />
          <motion.aside
            className="absolute right-0 top-0 flex h-full w-full max-w-[420px] flex-col bg-background shadow-2xl"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <header className="flex items-center justify-between gap-4 border-b border-border/70 px-6 py-4">
              <div className="min-w-0 flex-1">
                {user && (
                  <div className="flex min-w-0 items-center gap-3">
                    <UserAvatar user={user} />
                    <p className="truncate font-display text-lg leading-tight">{user.name}</p>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={close}
                aria-label={t("Close account menu")}
                className="grid size-9 shrink-0 place-items-center text-muted-foreground transition-colors hover:text-foreground"
              >
                <X size={17} />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto" data-lenis-prevent>
              {user ? (
                <div className="flex min-h-full flex-col">
                  <nav className="flex-1 px-3 py-5">
                    <div className="space-y-1">
                      {isAdmin ? (
                        <>
                          <MenuItem
                            icon={LayoutDashboard}
                            title={t("Admin Panel")}
                            onClick={() => {
                              close();
                              navigate({ to: "/admin" });
                            }}
                          />
                        </>
                      ) : (
                        <>
                          <MenuItem
                            icon={Package}
                            title={t("My Orders")}
                            onClick={() => goTab("orders")}
                          />
                          <MenuItem
                            icon={Heart}
                            title={t("Wishlist / Wishes")}
                            badge={wishCount}
                            onClick={openWishlist}
                          />
                          <MenuItem
                            icon={Bell}
                            title={t("Notifications")}
                            badge={unreadCount}
                            onClick={() => goTab("notifications")}
                          />
                          <MenuItem
                            icon={Settings}
                            title={t("Settings & Profile")}
                            onClick={() => goTab("settings")}
                          />
                        </>
                      )}
                    </div>
                  </nav>

                  <div className="border-t border-border/70 p-4">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center justify-center gap-2 border border-border/70 px-4 py-3 text-[11px] uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:border-red-200 hover:bg-red-50/60 hover:text-red-600"
                    >
                      <LogOut size={14} />
                      {t("Sign Out")}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex min-h-full flex-col items-center justify-center px-8 py-14 text-center">
                  <div className="grid size-16 place-items-center rounded-full bg-cream text-accent">
                    <LogIn size={26} strokeWidth={1.5} />
                  </div>
                  <h3 className="mt-6 max-w-[260px] font-display text-3xl leading-tight">
                    {t("Your account, all in one place")}
                  </h3>
                  <p className="mt-3 max-w-[280px] text-sm leading-relaxed text-muted-foreground">
                    {t("Sign in to view your orders, wishlist and notifications.")}
                  </p>
                  <div className="mt-8 w-full max-w-[280px] space-y-3">
                    <button
                      type="button"
                      onClick={() => goAuth("login")}
                      className="flex w-full items-center justify-center gap-2 bg-primary px-5 py-3.5 text-[11px] uppercase tracking-[0.22em] text-primary-foreground transition-opacity hover:opacity-90"
                    >
                      <LogIn size={14} />
                      {t("Sign In")}
                    </button>
                    <button
                      type="button"
                      onClick={() => goAuth("register")}
                      className="flex w-full items-center justify-center gap-2 border border-border px-5 py-3.5 text-[11px] uppercase tracking-[0.22em] transition-colors hover:border-accent hover:text-accent"
                    >
                      <UserPlus size={14} />
                      {t("Create Account")}
                    </button>
                  </div>
                  <p className="mt-8 max-w-[260px] text-[11px] leading-relaxed text-muted-foreground">
                    {t("Save your wishlist, follow orders and manage your details.")}
                  </p>
                </div>
              )}
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
