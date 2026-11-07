import { Link } from "@tanstack/react-router";
import { ShoppingBag, XCircle } from "lucide-react";
import { formatUZS } from "@/data/products";
import { resolveAsset } from "@/lib/assets";
import { useI18n, type Lang } from "@/lib/i18n";
import { SectionHeading } from "@/components/account/SectionHeading";

export interface OrderItem {
  id: string;
  name: string;
  finish: string;
  color: string;
  assembly: boolean;
  unitPrice: number;
  qty: number;
  image: string | null;
}

export interface Order {
  id: string;
  status: string;
  payment: string;
  paymentStatus: string;
  total: number;
  createdAt: string;
  items: OrderItem[];
}

const paymentStatusColors: Record<string, string> = {
  paid: "bg-emerald-50 text-emerald-700",
  pending: "bg-amber-50 text-amber-700",
  unpaid: "bg-cream text-muted-foreground",
  failed: "bg-red-50 text-red-600",
  refunded: "bg-sky-50 text-sky-700",
  cancelled: "bg-red-50 text-red-600",
};

const statusColors: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700",
  confirmed: "bg-sky-50 text-sky-700",
  shipped: "bg-violet-50 text-violet-700",
  delivered: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-red-50 text-red-600",
};

interface OrdersPanelProps {
  orders: Order[];
  loading: boolean;
  lang: Lang;
  onPay: (order: Order) => void;
  onCancel: (id: string) => void;
}

export function OrdersPanel({ orders, loading, lang, onPay, onCancel }: OrdersPanelProps) {
  const { t } = useI18n();
  const activeOrders = orders.filter((o) =>
    ["pending", "confirmed", "shipped"].includes(o.status),
  ).length;

  return (
    <div>
      <SectionHeading
        title={t("My Orders")}
        description={t("Order history and delivery status")}
        action={
          !loading && orders.length > 0 ? (
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              <span className="border border-border/70 bg-card px-3 py-1.5">
                {t("{count} orders", { count: orders.length })}
              </span>
              {activeOrders > 0 && (
                <span className="border border-accent/30 bg-accent/5 px-3 py-1.5 text-accent">
                  {t("{count} active", { count: activeOrders })}
                </span>
              )}
            </div>
          ) : null
        }
      />

      <div className="mt-7">
        {loading ? (
          <div className="space-y-4">
            {[0, 1].map((i) => (
              <div key={i} className="animate-pulse border border-border/70 bg-card p-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="h-2.5 w-32 bg-cream" />
                    <div className="h-2.5 w-20 bg-cream" />
                  </div>
                  <div className="h-6 w-24 bg-cream" />
                </div>
                <div className="mt-5 h-16 bg-cream/70" />
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="border border-dashed border-border bg-card/50 px-6 py-16 text-center">
            <div className="mx-auto grid size-16 place-items-center rounded-full border border-border/70 bg-cream text-accent">
              <ShoppingBag size={26} strokeWidth={1.4} />
            </div>
            <h3 className="mt-5 font-display text-2xl">{t("No orders yet")}</h3>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
              {t("Your order history will appear here.")}
            </p>
            <Link
              to="/catalog"
              className="mt-6 inline-flex items-center justify-center bg-primary px-7 py-3 text-[11px] uppercase tracking-[0.22em] text-primary-foreground transition-opacity hover:opacity-90"
            >
              {t("Start shopping")}
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const itemCount = order.items.reduce((sum, item) => sum + item.qty, 0);
              return (
                <article
                  key={order.id}
                  className="overflow-hidden border border-border/80 bg-card transition-shadow duration-300 hover:shadow-soft"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 px-5 py-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                        {t("Order #{id}", { id: order.id.slice(0, 8) })}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString(
                          lang === "ru" ? "ru-RU" : "uz-UZ",
                        )}
                        <span className="mx-1.5 text-border">·</span>
                        {t("{count} items", { count: itemCount })}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-[10px] uppercase tracking-wider ${
                          statusColors[order.status] ?? "bg-cream text-muted-foreground"
                        }`}
                      >
                        {t(order.status)}
                      </span>
                      <span
                        className={`rounded-full px-3 py-1 text-[10px] uppercase tracking-wider ${
                          paymentStatusColors[order.paymentStatus] ??
                          "bg-cream text-muted-foreground"
                        }`}
                      >
                        {t(order.paymentStatus)}
                      </span>
                    </div>
                  </div>

                  <div className="divide-y divide-border/60 px-5">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-4 py-3.5">
                        <img
                          src={resolveAsset(item.image) || "/placeholder.svg"}
                          alt={item.name}
                          loading="lazy"
                          width={64}
                          height={64}
                          className="size-16 shrink-0 bg-cream object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-display text-base">{item.name}</p>
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">
                            ×{item.qty}
                            {item.finish ? ` · ${t(item.finish)}` : ""}
                            {item.color ? ` · ${t(item.color)}` : ""}
                            {item.assembly ? ` · ${t("assembly")}` : ""}
                          </p>
                        </div>
                        <p className="shrink-0 text-sm tabular-nums">
                          {formatUZS(item.unitPrice * item.qty)}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/70 bg-cream/40 px-5 py-4">
                    <p className="text-sm">
                      {t("Total")}:{" "}
                      <span className="font-semibold tabular-nums">{formatUZS(order.total)}</span>
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      {["click", "payme"].includes(order.payment) &&
                        order.status !== "cancelled" &&
                        !["paid", "refunded"].includes(order.paymentStatus) && (
                          <button
                            type="button"
                            onClick={() => onPay(order)}
                            className="cursor-pointer bg-primary px-4 py-2 text-[10px] uppercase tracking-[0.18em] text-primary-foreground transition-opacity hover:opacity-90"
                          >
                            {t("Pay now")}
                          </button>
                        )}
                      {["pending", "confirmed"].includes(order.status) &&
                        !["paid", "refunded"].includes(order.paymentStatus) && (
                          <button
                            type="button"
                            onClick={() => onCancel(order.id)}
                            className="flex cursor-pointer items-center gap-1.5 border border-red-200 px-4 py-2 text-[10px] uppercase tracking-[0.18em] text-red-500 transition-colors hover:bg-red-50"
                          >
                            <XCircle size={13} />
                            {t("Cancel order")}
                          </button>
                        )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
