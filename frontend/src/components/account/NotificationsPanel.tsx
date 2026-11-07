import { Bell, Check, CheckCheck, Trash2 } from "lucide-react";
import { useI18n, type Lang } from "@/lib/i18n";
import { SectionHeading } from "@/components/account/SectionHeading";

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationsPanelProps {
  notifications: NotificationItem[];
  loading: boolean;
  lang: Lang;
  onMarkRead: (notification: NotificationItem) => void;
  onDelete: (id: string) => void;
  onMarkAllRead: () => void;
}

export function NotificationsPanel({
  notifications,
  loading,
  lang,
  onMarkRead,
  onDelete,
  onMarkAllRead,
}: NotificationsPanelProps) {
  const { t } = useI18n();
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div>
      <SectionHeading
        title={t("Notifications")}
        description={t("Order updates and replies from Lumina will appear here.")}
        action={
          !loading && unreadCount > 0 ? (
            <button
              type="button"
              onClick={onMarkAllRead}
              className="flex cursor-pointer items-center gap-2 border border-border px-3.5 py-2 text-[10px] uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:border-accent/40 hover:text-accent"
            >
              <CheckCheck size={14} />
              {t("Mark all as read")}
            </button>
          ) : null
        }
      />

      <div className="mt-7">
        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="animate-pulse border border-border/70 bg-card p-5">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-full bg-cream" />
                  <div className="flex-1 space-y-2">
                    <div className="h-2.5 w-40 bg-cream" />
                    <div className="h-2.5 w-3/4 bg-cream/70" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="border border-dashed border-border bg-card/50 px-6 py-16 text-center">
            <div className="mx-auto grid size-16 place-items-center rounded-full border border-border/70 bg-cream text-accent">
              <Bell size={26} strokeWidth={1.4} />
            </div>
            <h3 className="mt-5 font-display text-2xl">{t("No notifications yet")}</h3>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
              {t("Replies from Lumina will appear here")}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <article
                key={notification.id}
                className={`group relative overflow-hidden border p-5 transition-colors ${
                  notification.isRead
                    ? "border-border/80 bg-card"
                    : "border-accent/35 bg-accent/[0.035]"
                }`}
              >
                {!notification.isRead && (
                  <span className="absolute inset-y-0 left-0 w-[3px] bg-accent" aria-hidden />
                )}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-start gap-3">
                    <span
                      className={`mt-0.5 grid size-9 shrink-0 place-items-center rounded-full border ${
                        notification.isRead
                          ? "border-border/70 bg-cream text-muted-foreground"
                          : "border-accent/30 bg-accent/10 text-accent"
                      }`}
                    >
                      <Bell size={15} strokeWidth={1.6} />
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-display text-base">{notification.title}</p>
                        {!notification.isRead && (
                          <span className="size-1.5 rounded-full bg-accent" aria-hidden />
                        )}
                      </div>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        {notification.body}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDelete(notification.id)}
                    aria-label={t("Delete notification")}
                    className="shrink-0 cursor-pointer text-muted-foreground/50 transition-colors hover:text-red-500"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-3">
                  <p className="text-[11px] text-muted-foreground/70">
                    {new Date(notification.createdAt).toLocaleString(
                      lang === "ru" ? "ru-RU" : "uz-UZ",
                    )}
                  </p>
                  {notification.isRead ? (
                    <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] text-muted-foreground/60">
                      <Check size={12} />
                      {t("Read")}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onMarkRead(notification)}
                      className="cursor-pointer text-[10px] uppercase tracking-[0.14em] text-accent transition-opacity hover:opacity-70"
                    >
                      {t("Mark as read")}
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
