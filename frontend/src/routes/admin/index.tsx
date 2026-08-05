import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, animate, motion, useInView } from "motion/react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { AdminShell, avatarUrl } from "@/components/admin/AdminShell";
import {
  Users,
  ShoppingBag,
  Wallet,
  LayoutDashboard,
  Package,
  Mail,
  Trash2,
  Clock,
  MapPin,
  X,
  ChevronRight,
  RefreshCw,
} from "lucide-react";

interface Stats {
  users: number;
  orders: number;
  revenue: number;
  contacts: number;
  pendingOrders: number;
  recentOrders: RecentOrder[];
}

interface RecentOrder {
  id: string;
  status: string;
  total: number;
  createdAt: string;
  userName: string | null;
  userEmail: string | null;
}

interface AdminOrder {
  id: string;
  status: string;
  subtotal: number;
  total: number;
  shippingAddress: {
    name: string;
    phone: string;
    address: string;
    city: string;
    lat?: string;
    lng?: string;
  } | null;
  payment: string;
  delivery: string;
  createdAt: string;
  userId: string;
  userName: string | null;
  userEmail: string | null;
  items: OrderItem[];
}

interface OrderItem {
  id: string;
  name: string;
  finish: string;
  color: string;
  assembly: boolean;
  qty: number;
  unitPrice: number;
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string;
  createdAt: string;
  orderCount: number;
}

interface Contact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  createdAt: string;
  userId?: string;
  userName?: string | null;
  userEmail?: string | null;
  reply?: string | null;
  repliedAt?: string | null;
}

interface UserDetail {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    avatar: string;
    createdAt: string;
  };
  addresses: {
    id: string;
    label: string;
    fullName: string;
    phone: string;
    address: string;
    city: string;
    zip: string | null;
    isDefault: boolean | null;
  }[];
  orders: AdminOrder[];
}

const ORDER_STATUSES = ["pending", "confirmed", "shipped", "delivered", "cancelled"] as const;

const statusBadge: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 ring-amber-600/20",
  confirmed: "bg-sky-50 text-sky-700 ring-sky-600/20",
  shipped: "bg-violet-50 text-violet-700 ring-violet-600/20",
  delivered: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  cancelled: "bg-red-50 text-red-600 ring-red-500/20",
};

const fmt = (n: number | string) => new Intl.NumberFormat("en-US").format(Number(n));

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [{ title: "Admin Dashboard — Lumina" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { user, loading } = useAuth();
  const [tab, setTab] = useState("overview");
  const [stats, setStats] = useState<Stats | null>(null);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [mapOrder, setMapOrder] = useState<AdminOrder | null>(null);
  const [detail, setDetail] = useState<UserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [sendingReply, setSendingReply] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadOverview = useCallback(() => {
    api
      .get<Stats>("/admin/stats")
      .then(setStats)
      .catch(() => {});
  }, []);

  const loadOrders = useCallback(() => {
    api
      .get<AdminOrder[]>("/admin/orders")
      .then(setOrders)
      .catch(() => {});
  }, []);

  const loadUsers = useCallback(() => {
    api
      .get<AdminUser[]>("/admin/users")
      .then(setUsers)
      .catch(() => {});
  }, []);

  const loadContacts = useCallback(() => {
    api
      .get<Contact[]>("/admin/contacts")
      .then(setContacts)
      .catch(() => {});
  }, []);

  const refreshAll = useCallback(() => {
    setRefreshing(true);
    Promise.all([loadOverview(), loadOrders(), loadUsers(), loadContacts()])
      .catch(() => {})
      .finally(() => setRefreshing(false));
  }, [loadOverview, loadOrders, loadUsers, loadContacts]);

  useEffect(() => {
    refreshAll();
    const t = setInterval(refreshAll, 10000);
    return () => clearInterval(t);
  }, [refreshAll]);

  if (loading) return null;
  if (!user) return <Navigate to="/admin/login" />;
  if (user.role !== "admin") return <Navigate to="/admin/login" />;

  const deleteOrder = async (orderId: string) => {
    if (!confirm("Delete this cancelled order? This cannot be undone.")) return;
    try {
      await api.delete(`/admin/orders/${orderId}`);
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      setStats((prev) => (prev ? { ...prev, orders: Math.max(0, prev.orders - 1) } : prev));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete order");
    }
  };

  const openUser = async (id: string) => {
    setDetail(null);
    setDetailLoading(true);
    try {
      const data = await api.get<UserDetail>(`/admin/users/${id}`);
      setDetail(data);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to load user");
    } finally {
      setDetailLoading(false);
    }
  };

  const sendReply = async (c: Contact) => {
    const text = (replyDrafts[c.id] ?? "").trim();
    if (!text) return;
    setSendingReply(c.id);
    try {
      await api.post(`/admin/contacts/${c.id}/reply`, { reply: text });
      setContacts((prev) =>
        prev.map((x) =>
          x.id === c.id ? { ...x, reply: text, repliedAt: new Date().toISOString() } : x,
        ),
      );
      setReplyDrafts((prev) => ({ ...prev, [c.id]: "" }));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to send reply");
    } finally {
      setSendingReply(null);
    }
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "orders", label: `Orders (${orders.length})`, icon: Package },
    { id: "users", label: `Users (${users.length})`, icon: Users },
    { id: "messages", label: `Messages (${contacts.length})`, icon: Mail },
  ];

  const changeStatus = async (orderId: string, status: string) => {
    try {
      await api.patch(`/admin/orders/${orderId}`, { status });
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
      setStats((prev) =>
        prev
          ? {
              ...prev,
              pendingOrders:
                status === "pending" ? prev.pendingOrders + 1 : Math.max(0, prev.pendingOrders - 1),
            }
          : prev,
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update status");
    }
  };

  return (
    <AdminShell active="dashboard">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl">Admin Dashboard</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Your store at a glance — orders, customers and messages.
            </p>
          </div>
          <button
            type="button"
            onClick={refreshAll}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-full border border-border bg-white/70 px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:border-walnut/30 hover:text-walnut disabled:opacity-60"
          >
            <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="mt-8 flex w-fit max-w-full gap-1 overflow-x-auto rounded-full border border-border bg-white/70 p-1.5"
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`relative whitespace-nowrap rounded-full px-5 py-2.5 text-[11px] uppercase tracking-[0.15em] transition-colors duration-300 ${
              tab === t.id ? "text-cream" : "text-muted-foreground hover:text-walnut"
            }`}
          >
            {tab === t.id && (
              <motion.span
                layoutId="adminTabPill"
                className="absolute inset-0 rounded-full bg-walnut shadow-[0_10px_24px_-10px_rgba(38,27,20,0.5)]"
                transition={{ type: "spring", bounce: 0.22, duration: 0.55 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              <t.icon size={14} />
              {t.label}
            </span>
          </button>
        ))}
      </motion.div>

      <div className="mt-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
          >
            {tab === "overview" && (
              <div>
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
                  <StatCard
                    delay={0.05}
                    icon={Users}
                    label="Total users"
                    value={Number(stats?.users ?? 0)}
                  />
                  <StatCard
                    delay={0.12}
                    icon={ShoppingBag}
                    label="Orders"
                    value={Number(stats?.orders ?? 0)}
                  />
                  <StatCard
                    delay={0.19}
                    icon={Wallet}
                    label="Revenue"
                    value={Number(stats?.revenue ?? 0)}
                    suffix=" UZS"
                  />
                  <StatCard
                    delay={0.26}
                    icon={Clock}
                    label="Pending"
                    value={Number(stats?.pendingOrders ?? 0)}
                  />
                  <StatCard
                    delay={0.33}
                    icon={Mail}
                    label="Messages"
                    value={Number(stats?.contacts ?? 0)}
                  />
                </div>

                <div className="mt-10 flex items-center justify-between">
                  <h2 className="font-display text-xl">Recent orders</h2>
                  <button
                    onClick={loadOrders}
                    className="rounded-full border border-border bg-white/70 px-4 py-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:border-walnut/30 hover:text-walnut"
                  >
                    Refresh
                  </button>
                </div>

                {!stats ? (
                  <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
                ) : stats.recentOrders.length === 0 ? (
                  <p className="mt-4 text-sm text-muted-foreground">No orders yet</p>
                ) : (
                  <div className="mt-4 space-y-2.5">
                    {stats.recentOrders.map((o, i) => (
                      <motion.div
                        key={o.id}
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.06 * i, duration: 0.4, ease: "easeOut" }}
                        whileHover={{ x: 4 }}
                        className="flex items-center justify-between rounded-2xl border border-border bg-white/80 px-5 py-4 text-sm shadow-[0_10px_28px_-24px_rgba(38,27,20,0.3)]"
                      >
                        <div>
                          <p className="font-display">#{o.id.slice(0, 8)}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {o.userName ?? o.userEmail ?? "—"}
                          </p>
                        </div>
                        <div className="flex items-center gap-5">
                          <StatusBadge status={o.status} />
                          <span className="font-semibold tabular-nums">{fmt(o.total)} UZS</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === "orders" && (
              <div className="space-y-3">
                {orders.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No orders yet</p>
                ) : (
                  orders.map((o, i) => (
                    <motion.div
                      key={o.id}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        delay: Math.min(0.05 * i, 0.3),
                        duration: 0.4,
                        ease: "easeOut",
                      }}
                      className="overflow-hidden rounded-2xl border border-border bg-white/80 shadow-[0_10px_28px_-24px_rgba(38,27,20,0.3)]"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border bg-cream/60 px-5 py-4">
                        <div>
                          <p className="font-display text-base">Order #{o.id.slice(0, 8)}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {new Date(o.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <p className="font-semibold tabular-nums text-xl">{fmt(o.total)} UZS</p>
                          <select
                            value={o.status}
                            onChange={(e) => changeStatus(o.id, e.target.value)}
                            className={`cursor-pointer rounded-lg border-0 px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider outline-none ring-1 ring-inset ${statusBadge[o.status] ?? "bg-cream text-muted-foreground ring-border"}`}
                          >
                            {ORDER_STATUSES.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                          {o.status === "cancelled" && (
                            <button
                              type="button"
                              onClick={() => deleteOrder(o.id)}
                              aria-label="Delete order"
                              title="Delete order"
                              className="grid size-9 cursor-pointer place-items-center rounded-lg text-muted-foreground/50 transition-all hover:bg-red-50 hover:text-red-500"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="grid gap-x-8 gap-y-4 px-5 py-4 sm:grid-cols-2">
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                            Customer
                          </p>
                          <p className="mt-1 text-sm font-medium">{o.userName ?? "Guest"}</p>
                          <p className="text-xs text-muted-foreground">{o.userEmail}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                            Phone
                          </p>
                          <p className="mt-1 text-sm">{o.shippingAddress?.phone ?? "—"}</p>
                        </div>
                        <div className="sm:col-span-2">
                          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                            Delivery address
                          </p>
                          <p className="mt-1 text-sm">
                            {o.shippingAddress
                              ? `${o.shippingAddress.name}, ${o.shippingAddress.city}, ${o.shippingAddress.address}`
                              : "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                            Payment
                          </p>
                          <p className="mt-1 text-sm capitalize">
                            {o.payment
                              ? o.payment === "cod"
                                ? "Cash on delivery"
                                : o.payment
                              : "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                            Delivery method
                          </p>
                          <p className="mt-1 text-sm">
                            {o.delivery
                              ? o.delivery === "express"
                                ? "Express + assembly"
                                : "Standard"
                              : "—"}
                          </p>
                        </div>
                      </div>

                      {o.shippingAddress?.lat && o.shippingAddress?.lng && (
                        <div className="border-t border-border px-5 py-3">
                          <button
                            type="button"
                            onClick={() => setMapOrder(o)}
                            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-accent/10 px-3 py-1.5 text-[10px] uppercase tracking-wider text-accent transition-colors hover:bg-accent hover:text-white"
                          >
                            <MapPin size={12} />
                            View on map
                          </button>
                        </div>
                      )}

                      {o.items.length > 0 && (
                        <div className="border-t border-border px-5 py-4">
                          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                            Items
                          </p>
                          <div className="mt-2 divide-y divide-border/60">
                            {o.items.map((it) => (
                              <div
                                key={it.id}
                                className="flex items-center justify-between gap-3 py-2 text-sm"
                              >
                                <span>
                                  {it.name}
                                  <span className="text-xs text-muted-foreground">
                                    {" "}
                                    × {it.qty}
                                    {it.finish ? ` · ${it.finish}` : ""}
                                    {it.assembly ? " · assembly" : ""}
                                  </span>
                                </span>
                                <span className="whitespace-nowrap">
                                  {fmt(it.unitPrice * it.qty)} UZS
                                </span>
                              </div>
                            ))}
                          </div>
                          <div className="mt-3 space-y-1 border-t border-border pt-3 text-sm">
                            <div className="flex justify-between text-muted-foreground">
                              <span>Subtotal</span>
                              <span>{fmt(o.subtotal)} UZS</span>
                            </div>
                            <div className="flex justify-between text-muted-foreground">
                              <span>Delivery</span>
                              <span>{o.delivery === "express" ? "250 000 UZS" : "Free"}</span>
                            </div>
                            <div className="flex justify-between font-semibold tabular-nums text-base">
                              <span>Total</span>
                              <span>{fmt(o.total)} UZS</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))
                )}
              </div>
            )}

            {tab === "users" && (
              <div className="overflow-hidden rounded-2xl border border-border bg-white/80 shadow-[0_10px_28px_-24px_rgba(38,27,20,0.3)]">
                {users.length === 0 ? (
                  <p className="p-6 text-sm text-muted-foreground">No users yet</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-border text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                          <th className="px-5 py-4">User</th>
                          <th className="px-5 py-4">Email</th>
                          <th className="px-5 py-4">Orders</th>
                          <th className="px-5 py-4">Joined</th>
                          <th className="px-5 py-4" />
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((u, i) => (
                          <motion.tr
                            key={u.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: Math.min(0.04 * i, 0.3), duration: 0.35 }}
                            onClick={() => openUser(u.id)}
                            className="cursor-pointer border-b border-border/60 transition-colors last:border-0 hover:bg-cream/60"
                          >
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                {avatarUrl(u.avatar) ? (
                                  <img
                                    src={avatarUrl(u.avatar)!}
                                    alt=""
                                    className="size-8 rounded-full object-cover"
                                  />
                                ) : (
                                  <span className="grid size-8 place-items-center rounded-full bg-walnut/10 font-display text-[11px] text-walnut">
                                    {u.name.slice(0, 1).toUpperCase()}
                                  </span>
                                )}
                                <span className="font-display">{u.name}</span>
                                {u.role === "admin" && (
                                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-600 ring-1 ring-inset ring-emerald-600/20">
                                    Admin
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-5 py-4 text-muted-foreground">{u.email}</td>
                            <td className="px-5 py-4">
                              <span className="rounded-full bg-cream px-2.5 py-1 text-[11px] font-medium">
                                {u.orderCount}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-muted-foreground">
                              {new Date(u.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-5 py-4 text-right">
                              <ChevronRight
                                size={15}
                                className="ml-auto text-muted-foreground/40"
                              />
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {tab === "messages" && (
              <div className="space-y-3">
                {contacts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No messages yet</p>
                ) : (
                  contacts.map((c, i) => (
                    <motion.div
                      key={c.id}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        delay: Math.min(0.05 * i, 0.3),
                        duration: 0.4,
                        ease: "easeOut",
                      }}
                      className="group rounded-2xl border border-border bg-white/80 p-5 shadow-[0_10px_28px_-24px_rgba(38,27,20,0.3)]"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-display text-sm">{c.subject}</p>
                            {c.userId && c.userName && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-walnut/5 px-2 py-0.5 text-[10px] text-walnut">
                                <Users size={11} />
                                {c.userName}
                              </span>
                            )}
                            {!c.userId && (
                              <span className="inline-flex items-center rounded-full bg-cream px-2 py-0.5 text-[10px] text-muted-foreground">
                                Guest
                              </span>
                            )}
                          </div>
                          <div className="mt-2.5 space-y-1 text-xs text-muted-foreground">
                            <p>
                              <span className="text-muted-foreground/50">Name:</span> {c.name}
                            </p>
                            {c.phone && (
                              <p>
                                <span className="text-muted-foreground/50">Phone:</span> {c.phone}
                              </p>
                            )}
                            <p>
                              <span className="text-muted-foreground/50">Email:</span> {c.email}
                            </p>
                            <p>
                              <span className="text-muted-foreground/50">Sent:</span>{" "}
                              {new Date(c.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <motion.button
                          onClick={() => {
                            if (!confirm("Delete this message?")) return;
                            api
                              .delete(`/admin/contacts/${c.id}`)
                              .then(() => {
                                setContacts((prev) => prev.filter((x) => x.id !== c.id));
                              })
                              .catch(() => alert("Failed to delete"));
                          }}
                          whileTap={{ scale: 0.9 }}
                          aria-label="Delete message"
                          title="Delete message"
                          className="cursor-pointer rounded-full p-2 text-muted-foreground/50 transition-all hover:bg-red-50 hover:text-red-500 sm:opacity-0 sm:group-hover:opacity-100"
                        >
                          <Trash2 size={15} />
                        </motion.button>
                      </div>
                      <p className="mt-3.5 border-t border-border pt-3 text-sm leading-relaxed text-muted-foreground">
                        {c.message}
                      </p>

                      {c.reply && (
                        <div className="mt-4 rounded-xl bg-walnut/5 p-4">
                          <p className="text-[10px] uppercase tracking-[0.15em] text-walnut">
                            Your reply
                            {c.repliedAt ? ` · ${new Date(c.repliedAt).toLocaleString()}` : ""}
                          </p>
                          <p className="mt-2 text-sm leading-relaxed">{c.reply}</p>
                        </div>
                      )}

                      {c.userId ? (
                        <div className="mt-4">
                          <textarea
                            value={replyDrafts[c.id] ?? ""}
                            onChange={(e) =>
                              setReplyDrafts((prev) => ({ ...prev, [c.id]: e.target.value }))
                            }
                            rows={3}
                            placeholder="Javob yozing — foydalanuvchi Messages bo'limida ko'radi..."
                            className="w-full resize-none rounded-xl border border-border bg-transparent px-3 py-2 text-sm outline-none focus:border-walnut"
                          />
                          <div className="mt-2 flex justify-end">
                            <button
                              onClick={() => sendReply(c)}
                              disabled={sendingReply === c.id || !(replyDrafts[c.id] ?? "").trim()}
                              className="cursor-pointer rounded-xl bg-walnut px-4 py-2 text-[11px] uppercase tracking-[0.15em] text-cream transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              {sendingReply === c.id ? "Yuborilmoqda..." : "Javob yuborish"}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="mt-4 rounded-xl bg-cream px-4 py-2.5 text-[11px] text-muted-foreground">
                          Mehmon xabari — javob faqat ro'yxatdan o'tgan foydalanuvchilarga
                          yuboriladi.
                        </p>
                      )}
                    </motion.div>
                  ))
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {(detail || detailLoading) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setDetail(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-walnut/40 p-4 backdrop-blur-sm"
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, y: 32, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-[0_40px_90px_-30px_rgba(38,27,20,0.5)] sm:p-8"
            >
              {detailLoading && !detail ? (
                <div className="flex items-center justify-center py-16">
                  <span className="size-6 animate-spin rounded-full border-2 border-walnut/20 border-t-walnut" />
                </div>
              ) : detail ? (
                <>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      {avatarUrl(detail.user.avatar) ? (
                        <img
                          src={avatarUrl(detail.user.avatar)!}
                          alt=""
                          className="size-14 rounded-2xl object-cover"
                        />
                      ) : (
                        <span className="grid size-14 place-items-center rounded-2xl bg-walnut font-display text-lg text-cream">
                          {detail.user.name.slice(0, 1).toUpperCase()}
                        </span>
                      )}
                      <div>
                        <p className="font-display text-xl">{detail.user.name}</p>
                        <p className="text-xs text-muted-foreground">{detail.user.email}</p>
                        <p className="mt-1 text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                          Joined {new Date(detail.user.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setDetail(null)}
                      className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-cream hover:text-walnut"
                      aria-label="Close"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div className="mt-7">
                    <h3 className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                      <MapPin size={13} />
                      Addresses ({detail.addresses.length})
                    </h3>
                    {detail.addresses.length === 0 ? (
                      <p className="mt-3 text-sm text-muted-foreground">No addresses saved</p>
                    ) : (
                      <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                        {detail.addresses.map((a) => (
                          <div
                            key={a.id}
                            className="rounded-2xl border border-border bg-background/60 p-4"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                                {a.label}
                              </span>
                              {a.isDefault && (
                                <span className="rounded-full bg-walnut/10 px-2 py-0.5 text-[9px] uppercase tracking-wider text-walnut">
                                  Default
                                </span>
                              )}
                            </div>
                            <p className="mt-2 text-sm font-medium">{a.fullName}</p>
                            <p className="text-xs text-muted-foreground">{a.phone}</p>
                            <p className="mt-1.5 text-xs text-muted-foreground">
                              {a.address}, {a.city}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-8">
                    <h3 className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                      <ShoppingBag size={13} />
                      Orders ({detail.orders.length})
                    </h3>
                    {detail.orders.length === 0 ? (
                      <p className="mt-3 text-sm text-muted-foreground">No orders yet</p>
                    ) : (
                      <div className="mt-3 space-y-2.5">
                        {detail.orders.map((o) => (
                          <div
                            key={o.id}
                            className="rounded-2xl border border-border bg-background/60 p-4"
                          >
                            <div className="flex items-center justify-between">
                              <p className="text-xs text-muted-foreground">
                                #{o.id.slice(0, 8)} · {new Date(o.createdAt).toLocaleDateString()}
                              </p>
                              <div className="flex items-center gap-3">
                                <StatusBadge status={o.status} />
                                <span className="font-semibold tabular-nums text-sm">
                                  {fmt(o.total)} UZS
                                </span>
                              </div>
                            </div>
                            {o.items.length > 0 && (
                              <div className="mt-2.5 border-t border-border pt-2.5">
                                {o.items.map((it) => (
                                  <p key={it.id} className="py-0.5 text-xs text-muted-foreground">
                                    {it.name} × {it.qty} — {fmt(it.unitPrice * it.qty)} UZS
                                    {it.finish ? ` (${it.finish})` : ""}
                                  </p>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : null}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {mapOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMapOrder(null)}
            className="fixed inset-0 z-50 grid place-items-center bg-walnut/40 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg overflow-hidden rounded-3xl bg-white p-6 shadow-[0_40px_90px_-30px_rgba(38,27,20,0.5)] sm:p-8"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-display text-xl">Order #{mapOrder.id.slice(0, 8)}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {mapOrder.shippingAddress?.name} · {mapOrder.shippingAddress?.phone}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {mapOrder.shippingAddress?.city}, {mapOrder.shippingAddress?.address}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setMapOrder(null)}
                  className="cursor-pointer rounded-full p-2 text-muted-foreground/60 transition-colors hover:bg-cream hover:text-walnut"
                  aria-label="Close map"
                >
                  <X size={16} />
                </button>
              </div>
              <OrderMap
                lat={Number(mapOrder.shippingAddress?.lat)}
                lng={Number(mapOrder.shippingAddress?.lng)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AdminShell>
  );
}

function OrderMap({ lat, lng }: { lat: number; lng: number }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    let active = true;

    const init = async () => {
      const L = await import("leaflet");
      await import("leaflet/dist/leaflet.css");

      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      if (!active) return;

      const map = L.map(ref.current!, { center: [lat, lng], zoom: 15 });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
        maxZoom: 19,
      }).addTo(map);
      L.marker([lat, lng]).addTo(map);

      return () => {
        active = false;
        map.remove();
      };
    };

    init();
    return () => {
      active = false;
    };
  }, [lat, lng]);

  return <div ref={ref} className="mt-5 h-64 w-full rounded-2xl border border-border" />;
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] uppercase tracking-wider ring-1 ring-inset ${
        statusBadge[status] ?? "bg-cream text-muted-foreground ring-border"
      }`}
    >
      {status === "pending" && (
        <span className="size-1.5 animate-pulse rounded-full bg-amber-500" />
      )}
      {status}
    </span>
  );
}

function CountUp({
  value,
  suffix = "",
  className,
}: {
  value: number;
  suffix?: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20px" });

  useEffect(() => {
    if (!inView || !ref.current) return;
    const controls = animate(0, value, {
      duration: 1.1,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => {
        if (ref.current) ref.current.textContent = `${fmt(Math.round(v))}${suffix}`;
      },
    });
    return () => controls.stop();
  }, [inView, value, suffix]);

  return (
    <span ref={ref} className={className}>
      0{suffix}
    </span>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  delay,
  suffix,
}: {
  icon: typeof Users;
  label: string;
  value: number;
  delay: number;
  suffix?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -5 }}
      className="group rounded-2xl border border-border bg-white/80 p-5 shadow-[0_10px_28px_-24px_rgba(38,27,20,0.3)]"
    >
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
        <span className="grid size-9 place-items-center rounded-xl bg-cream text-walnut transition-all duration-300 group-hover:bg-walnut group-hover:text-cream group-hover:shadow-[0_10px_20px_-8px_rgba(38,27,20,0.5)]">
          <Icon size={15} />
        </span>
      </div>
      <CountUp
        value={value}
        suffix={suffix}
        className="mt-4 block font-semibold tabular-nums text-xl leading-none"
      />
    </motion.div>
  );
}
