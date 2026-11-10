import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LayoutDashboard } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import { useConfirm } from "@/lib/use-confirm";
import { AuthRequiredDialog } from "@/components/site/AuthRequiredDialog";
import { OrdersPanel, type Order } from "@/components/account/OrdersPanel";
import { NotificationsPanel, type NotificationItem } from "@/components/account/NotificationsPanel";
import { SettingsPanel } from "@/components/account/SettingsPanel";

export type AccountTab = "orders" | "notifications" | "settings";

export function AccountPage({ tab }: { tab: AccountTab }) {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const { confirm, dialog } = useConfirm();

  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(tab === "orders");
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(tab === "notifications");

  useEffect(() => {
    if (tab !== "orders" || !user || user.role === "admin") return;
    let active = true;
    setOrdersLoading(true);

    api
      .get<Order[]>("/orders")
      .then((rows) => {
        if (active) setOrders(rows);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setOrdersLoading(false);
      });

    return () => {
      active = false;
    };
  }, [tab, user]);

  useEffect(() => {
    if (tab !== "notifications" || !user || user.role === "admin") return;
    let active = true;

    const loadNotifications = () => {
      api
        .get<NotificationItem[]>("/notifications")
        .then((rows) => {
          if (active) setNotifications(rows);
        })
        .catch(() => {})
        .finally(() => {
          if (active) setNotificationsLoading(false);
        });
    };

    loadNotifications();
    const timer = setInterval(loadNotifications, 15000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [tab, user]);

  if (!user) {
    return (
      <div className="min-h-screen">
        <AuthRequiredDialog open dismissable={false} onOpenChange={() => {}} />
      </div>
    );
  }

  if (user.role === "admin") {
    return (
      <div className="flex min-h-[calc(75vh/var(--ui-scale))] items-center justify-center px-6 pt-28">
        <div className="w-full max-w-lg border border-border/80 bg-card p-8 text-center shadow-soft sm:p-10">
          <div className="mx-auto grid size-14 place-items-center rounded-full border border-border/70 bg-cream text-accent">
            <LayoutDashboard size={24} strokeWidth={1.5} />
          </div>
          <h1 className="mt-5 font-display text-2xl">{t("Admin accounts use the admin panel")}</h1>
          <Link
            to="/admin"
            className="mt-6 inline-flex bg-primary px-6 py-3 text-[11px] uppercase tracking-[0.2em] text-primary-foreground transition-opacity hover:opacity-90"
          >
            {t("Go to Admin Panel")}
          </Link>
        </div>
      </div>
    );
  }

  const cancelOrder = async (id: string) => {
    const ok = await confirm({
      title: t("Cancel order?"),
      description: t("Are you sure you want to cancel this order? This cannot be undone."),
      confirmLabel: t("Cancel order"),
      destructive: true,
    });
    if (!ok) return;

    try {
      await api.patch(`/orders/${id}/cancel`);
      setOrders((prev) =>
        prev.map((order) =>
          order.id === id
            ? {
                ...order,
                status: "cancelled",
                paymentStatus: order.payment === "cod" ? "unpaid" : "cancelled",
              }
            : order,
        ),
      );
      toast.success(t("Order cancelled"));
    } catch (err) {
      toast.error(err instanceof Error ? t(err.message) : t("Failed to cancel order"));
    }
  };

  const payNow = async (order: Order) => {
    try {
      const result = await api.post<{ redirectUrl: string }>(`/payments/retry/${order.id}`);
      window.location.assign(result.redirectUrl);
    } catch (err) {
      toast.error(err instanceof Error ? t(err.message) : t("Could not start payment"));
    }
  };

  const markRead = (notification: NotificationItem) => {
    if (notification.isRead) return;
    setNotifications((prev) =>
      prev.map((item) => (item.id === notification.id ? { ...item, isRead: true } : item)),
    );
    api.patch(`/notifications/${notification.id}/read`, { isRead: true }).catch(() => {});
  };

  const markAllRead = () => {
    const unread = notifications.filter((notification) => !notification.isRead);
    if (unread.length === 0) return;
    setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
    void Promise.allSettled(
      unread.map((notification) =>
        api.patch(`/notifications/${notification.id}/read`, { isRead: true }),
      ),
    );
  };

  const deleteNotification = async (id: string) => {
    setNotifications((prev) => prev.filter((item) => item.id !== id));
    api.delete(`/notifications/${id}`).catch(() => {});
  };

  return (
    <div className="relative min-h-screen">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[460px] bg-gradient-to-b from-cream/80 via-cream/30 to-transparent"
      />

      <div className="relative mx-auto max-w-5xl px-5 pb-24 pt-32 sm:px-6 md:px-8 md:pt-36 lg:px-10 lg:pt-40">
        {tab === "orders" && (
          <OrdersPanel
            orders={orders}
            loading={ordersLoading}
            lang={lang}
            onPay={payNow}
            onCancel={cancelOrder}
          />
        )}
        {tab === "notifications" && (
          <NotificationsPanel
            notifications={notifications}
            loading={notificationsLoading}
            lang={lang}
            onMarkRead={markRead}
            onDelete={deleteNotification}
            onMarkAllRead={markAllRead}
          />
        )}
        {tab === "settings" && <SettingsPanel />}
      </div>

      {dialog}
    </div>
  );
}
