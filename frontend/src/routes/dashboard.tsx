import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { PhoneInput } from "@/components/site/PhoneInput";
import { isValidUzPhone } from "@/lib/phone";
import { reverseGeocode, geocodeAddress } from "@/lib/geocode";
import { resolveAsset } from "@/lib/assets";
import {
  Bell,
  LogOut,
  MapPin,
  Package,
  Settings,
  ShoppingBag,
  Trash2,
  XCircle,
} from "lucide-react";

interface OrderItem {
  id: string;
  name: string;
  finish: string;
  color: string;
  assembly: boolean;
  unitPrice: number;
  qty: number;
  image: string | null;
}

interface Order {
  id: string;
  status: string;
  total: number;
  createdAt: string;
  items: OrderItem[];
}

const statusColors: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700",
  confirmed: "bg-sky-50 text-sky-700",
  shipped: "bg-violet-50 text-violet-700",
  delivered: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-red-50 text-red-600",
};

interface Address {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  address: string;
  city: string;
  lat: string | null;
  lng: string | null;
  isDefault: boolean;
}

interface Notification {
  id: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const { user, logout, token, setAuth } = useAuth();
  const router = useRouter();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markerRef = useRef<any>(null);

  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [tab, setTab] = useState("orders");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    label: "Home",
    fullName: "",
    phone: "",
    address: "",
    city: "",
    lat: 41.2995,
    lng: 69.2401,
    isDefault: false,
  });
  const [name, setName] = useState("");
  const [nameSaving, setNameSaving] = useState(false);
  const [nameMsg, setNameMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [phoneInvalid, setPhoneInvalid] = useState(false);
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "" });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [delForm, setDelForm] = useState({ password: "" });
  const [delSaving, setDelSaving] = useState(false);
  const [delMsg, setDelMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const showForm = addresses.length === 0 || editingId !== null;

  useEffect(() => {
    if (!user) return;
    api
      .get<Order[]>("/orders")
      .then(setOrders)
      .catch(() => {});
    api
      .get<Address[]>("/addresses")
      .then(setAddresses)
      .catch(() => {});
    api
      .get<Notification[]>("/notifications")
      .then(setNotifications)
      .catch(() => {});
    setName(user.name);
  }, [user]);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current || tab !== "addresses") return;
    let active = true;

    const initMap = async () => {
      const L = await import("leaflet");
      await import("leaflet/dist/leaflet.css");

      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      if (!active) return;

      const map = L.map(mapRef.current!, {
        center: [form.lat, form.lng],
        zoom: 13,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
        maxZoom: 19,
      }).addTo(map);

      const marker = L.marker([form.lat, form.lng], { draggable: true }).addTo(map);

      const applyCoords = async (lat: number, lng: number) => {
        setForm((prev) => ({ ...prev, lat, lng }));
        const place = await reverseGeocode(lat, lng);
        if (place) {
          setForm((prev) => ({
            ...prev,
            address: place.address || prev.address,
            city: place.city || prev.city,
          }));
        }
      };

      marker.on("dragend", () => {
        const pos = marker.getLatLng();
        applyCoords(pos.lat, pos.lng);
      });

      map.on("click", (e: any) => {
        marker.setLatLng(e.latlng);
        applyCoords(e.latlng.lat, e.latlng.lng);
      });

      mapInstance.current = map;
      markerRef.current = marker;
    };

    initMap();

    return () => {
      active = false;
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [tab, editingId]);

  useEffect(() => {
    if (tab !== "addresses" || !showForm) return;
    const query = `${form.address} ${form.city}`.trim();
    if (!query) return;
    const timer = setTimeout(async () => {
      if (!mapInstance.current || markerRef.current === null) return;
      const results = await geocodeAddress(query);
      if (results.length === 0) return;
      const place = results[0];
      markerRef.current.setLatLng([place.lat, place.lng]);
      mapInstance.current.setView([place.lat, place.lng], 13);
      setForm((prev) =>
        prev.lat !== place.lat || prev.lng !== place.lng
          ? { ...prev, lat: place.lat, lng: place.lng }
          : prev,
      );
    }, 900);
    return () => clearTimeout(timer);
  }, [form.address, form.city, tab, showForm]);

  const updateMarker = (lat: number, lng: number) => {
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    }
    if (mapInstance.current) {
      mapInstance.current.setView([lat, lng], 13);
    }
  };

  const handleSave = async () => {
    setPhoneInvalid(false);
    if (!isValidUzPhone(form.phone)) {
      setPhoneInvalid(true);
      alert("Iltimos, to'liq va to'g'ri telefon raqamini kiriting (+998 ** *** ** **)");
      return;
    }
    setSaving(true);
    try {
      if (editingId && editingId !== "new") {
        await api.put(`/addresses/${editingId}`, form);
      } else {
        await api.post("/addresses", form);
      }
      const updated = await api.get<Address[]>("/addresses");
      setAddresses(updated);
      setEditingId(null);
      setForm({
        label: "Home",
        fullName: user?.name || "",
        phone: "",
        address: "",
        city: "",
        lat: 41.2995,
        lng: 69.2401,
        isDefault: false,
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const editAddress = (a: Address) => {
    setForm({
      label: a.label,
      fullName: a.fullName,
      phone: a.phone,
      address: a.address,
      city: a.city,
      lat: Number(a.lat) || 41.2995,
      lng: Number(a.lng) || 69.2401,
      isDefault: a.isDefault,
    });
    setEditingId(a.id);
    if (a.lat && a.lng) updateMarker(Number(a.lat), Number(a.lng));
    setTab("addresses");
  };

  const deleteAddress = async (id: string) => {
    await api.delete(`/addresses/${id}`);
    setAddresses((prev) => prev.filter((a) => a.id !== id));
  };

  const cancelOrder = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this order?")) return;
    try {
      await api.patch(`/orders/${id}/cancel`);
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: "cancelled" } : o)));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to cancel order");
    }
  };

  const saveName = async () => {
    setNameSaving(true);
    setNameMsg(null);
    try {
      const res = await api.patch<{
        user: {
          id: string;
          name: string;
          email: string;
          username: string;
          role: string;
          avatar: string;
        };
      }>("/auth/me", { name });
      setAuth(res.user as never, token!);
      setNameMsg({ ok: true, text: "Name updated" });
    } catch (err) {
      setNameMsg({ ok: false, text: err instanceof Error ? err.message : "Failed to update name" });
    } finally {
      setNameSaving(false);
    }
  };

  const savePassword = async () => {
    setPwSaving(true);
    setPwMsg(null);
    try {
      await api.patch("/auth/password", pwForm);
      setPwForm({ currentPassword: "", newPassword: "" });
      setPwMsg({ ok: true, text: "Password updated" });
    } catch (err) {
      setPwMsg({
        ok: false,
        text: err instanceof Error ? err.message : "Failed to update password",
      });
    } finally {
      setPwSaving(false);
    }
  };

  const deleteAccount = async () => {
    if (
      !confirm("Are you sure you want to permanently delete your account? This cannot be undone.")
    )
      return;
    setDelSaving(true);
    setDelMsg(null);
    try {
      await api.delete("/auth/account", { password: delForm.password });
      setDelMsg({ ok: true, text: "Account deleted" });
      setTimeout(() => {
        logout();
        router.navigate({ to: "/" });
      }, 800);
    } catch (err) {
      setDelMsg({
        ok: false,
        text: err instanceof Error ? err.message : "Failed to delete account",
      });
    } finally {
      setDelSaving(false);
    }
  };

  const markRead = (n: Notification) => {
    if (n.isRead) return;
    setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)));
    api.patch(`/notifications/${n.id}/read`, { isRead: true }).catch(() => {});
  };

  const deleteNotification = async (id: string) => {
    setNotifications((prev) => prev.filter((x) => x.id !== id));
    api.delete(`/notifications/${id}`).catch(() => {});
  };

  if (!user) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="text-center">
          <h1 className="font-display text-xl mb-4">Please sign in</h1>
          <Link
            to="/login"
            className="bg-primary px-6 py-3 text-[11px] uppercase tracking-[0.2em] text-primary-foreground"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    router.navigate({ to: "/" });
  };

  const tabs = [
    { id: "orders", label: "My Orders", icon: Package },
    { id: "addresses", label: "Addresses", icon: MapPin },
    { id: "messages", label: "Messages", icon: Bell },
    { id: "profile", label: "Profile", icon: Settings },
  ];

  return (
    <div className="mx-auto max-w-4xl px-6 pt-36 pb-24">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-2xl">My Account</h1>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <LogOut size={15} /> Sign Out
        </button>
      </div>

      <div className="border p-6 mb-8">
        <p className="font-display text-lg">{user.name}</p>
        <p className="text-sm text-muted-foreground">{user.email}</p>
      </div>

      <div className="flex gap-1 border-b mb-8">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-5 py-3 text-[11px] uppercase tracking-[0.15em] transition-colors ${
              tab === t.id ? "border-b-2 border-primary text-foreground" : "text-muted-foreground"
            }`}
          >
            <t.icon size={14} />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "orders" && (
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ShoppingBag size={40} className="mx-auto mb-4 opacity-30" />
              <p>No orders yet</p>
              <Link
                to="/catalog"
                className="mt-3 inline-block text-sm underline underline-offset-4"
              >
                Start shopping
              </Link>
            </div>
          ) : (
            orders.map((o) => (
              <div key={o.id} className="border p-5">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Order #{o.id.slice(0, 8)}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(o.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-[10px] uppercase tracking-wider ${statusColors[o.status] ?? "bg-cream text-muted-foreground"}`}
                  >
                    {o.status}
                  </span>
                </div>

                <div className="divide-y">
                  {o.items.map((it) => (
                    <div key={it.id} className="flex items-center gap-4 py-3">
                      <img
                        src={resolveAsset(it.image) || "/placeholder.svg"}
                        alt={it.name}
                        loading="lazy"
                        width={64}
                        height={64}
                        className="size-16 bg-background object-cover"
                      />
                      <div className="flex-1 text-sm">
                        <p className="font-display">{it.name}</p>
                        <p className="text-xs text-muted-foreground">
                          ×{it.qty}
                          {it.finish ? ` · ${it.finish}` : ""}
                          {it.assembly ? " · assembly" : ""}
                        </p>
                        <p className="mt-0.5 text-sm">
                          {new Intl.NumberFormat("en-US").format(it.unitPrice * it.qty)} UZS
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between gap-3 border-t pt-3">
                  <p className="text-sm">
                    Paid:{" "}
                    <span className="font-semibold tabular-nums">
                      {new Intl.NumberFormat("en-US").format(o.total)} UZS
                    </span>
                  </p>
                  {["pending", "confirmed"].includes(o.status) && (
                    <button
                      onClick={() => cancelOrder(o.id)}
                      className="flex cursor-pointer items-center gap-1.5 border border-red-200 px-3 py-1.5 text-[11px] uppercase tracking-wider text-red-500 transition-colors hover:bg-red-50"
                    >
                      <XCircle size={13} />
                      Cancel order
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "addresses" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            {addresses.length === 0 ? (
              <p className="text-sm text-muted-foreground">No address saved yet</p>
            ) : (
              addresses.map((a) => (
                <div key={a.id} className="border p-6 min-h-[300px] flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex gap-2 items-center">
                      <span className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                        {a.label}
                      </span>
                      {a.isDefault && (
                        <span className="text-[9px] bg-primary px-1.5 py-0.5 text-primary-foreground">
                          DEFAULT
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => editAddress(a)}
                        className="text-[11px] underline underline-offset-2"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteAddress(a.id)}
                        className="text-[11px] text-red-400 underline underline-offset-2"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    <p className="font-display text-lg">{a.fullName}</p>
                    <p className="text-sm text-muted-foreground mt-1">{a.phone}</p>
                    <p className="text-sm text-muted-foreground mt-3">{a.address}</p>
                    <p className="text-sm text-muted-foreground">{a.city}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div>
            {showForm ? (
              <div key={editingId || "add"}>
                <h2 className="font-display text-base mb-4">
                  {editingId ? "Edit Address" : "Add Address"}
                </h2>
                <div className="border p-4 space-y-3">
                  <div>
                    <label className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                      Label
                    </label>
                    <select
                      value={form.label}
                      onChange={(e) => setForm({ ...form, label: e.target.value })}
                      className="w-full border border-input bg-transparent px-3 py-2 text-sm outline-none mt-1"
                    >
                      <option>Home</option>
                      <option>Work</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                      Full Name
                    </label>
                    <input
                      value={form.fullName}
                      onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                      className="w-full border border-input bg-transparent px-3 py-2 text-sm outline-none mt-1"
                    />
                  </div>
                  <div>
                    <PhoneInput
                      value={form.phone}
                      onChange={(v) => setForm({ ...form, phone: v })}
                      invalid={phoneInvalid}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                      Address
                    </label>
                    <textarea
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      rows={2}
                      className="w-full border border-input bg-transparent px-3 py-2 text-sm outline-none mt-1 resize-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                      City
                    </label>
                    <input
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                      className="w-full border border-input bg-transparent px-3 py-2 text-sm outline-none mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-1 block">
                      Pin your location on map
                    </label>
                    <div ref={mapRef} className="h-48 w-full border" style={{ zIndex: 1 }} />
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Click or drag the marker
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={form.isDefault}
                        onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
                        className="accent-primary"
                      />
                      Set as default
                    </label>
                    {editingId && (
                      <button
                        onClick={() => {
                          setEditingId(null);
                          setForm({
                            label: "Home",
                            fullName: user?.name || "",
                            phone: "",
                            address: "",
                            city: "",
                            lat: 41.2995,
                            lng: 69.2401,
                            isDefault: false,
                          });
                        }}
                        className="text-[11px] underline underline-offset-2 ml-auto"
                      >
                        Cancel
                      </button>
                    )}
                  </div>

                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full bg-primary py-2.5 text-[11px] uppercase tracking-[0.2em] text-primary-foreground disabled:opacity-50"
                  >
                    {saving ? "Saving..." : editingId ? "Update Address" : "Save Address"}
                  </button>
                </div>
              </div>
            ) : (
              <button
                disabled
                className="w-full border-2 border-dashed border-border/30 py-3 text-center cursor-not-allowed opacity-50"
              >
                <span className="text-sm">+</span>
                <p className="font-display text-xs mt-0.5">Add Address</p>
              </button>
            )}
          </div>
        </div>
      )}
      {tab === "profile" && (
        <>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div className="border p-6">
              <h2 className="font-display text-base mb-5">Profile</h2>
              <div>
                <label className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                  Full name
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full border border-input bg-transparent px-3 py-2 text-sm outline-none"
                />
              </div>
              <div className="mt-4">
                <label className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                  Email
                </label>
                <input
                  value={user.email}
                  readOnly
                  className="mt-1 w-full cursor-not-allowed border border-input bg-cream/50 px-3 py-2 text-sm text-muted-foreground outline-none"
                />
              </div>
              {nameMsg && (
                <p className={`mt-3 text-xs ${nameMsg.ok ? "text-emerald-600" : "text-red-500"}`}>
                  {nameMsg.text}
                </p>
              )}
              <button
                onClick={saveName}
                disabled={nameSaving || name.trim().length < 2}
                className="mt-5 w-full bg-primary py-2.5 text-[11px] uppercase tracking-[0.2em] text-primary-foreground disabled:opacity-50"
              >
                {nameSaving ? "Saving..." : "Save Name"}
              </button>
            </div>

            <div className="border p-6">
              <h2 className="font-display text-base mb-5">Change password</h2>
              <div>
                <label className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                  Current password
                </label>
                <input
                  type="password"
                  value={pwForm.currentPassword}
                  onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                  autoComplete="new-password"
                  className="mt-1 w-full border border-input bg-transparent px-3 py-2 text-sm outline-none"
                />
              </div>
              <div className="mt-4">
                <label className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                  New password
                </label>
                <input
                  type="password"
                  value={pwForm.newPassword}
                  onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                  autoComplete="new-password"
                  className="mt-1 w-full border border-input bg-transparent px-3 py-2 text-sm outline-none"
                />
              </div>
              {pwMsg && (
                <p className={`mt-3 text-xs ${pwMsg.ok ? "text-emerald-600" : "text-red-500"}`}>
                  {pwMsg.text}
                </p>
              )}
              <button
                onClick={savePassword}
                disabled={pwSaving || !pwForm.currentPassword || pwForm.newPassword.length < 6}
                className="mt-5 w-full bg-primary py-2.5 text-[11px] uppercase tracking-[0.2em] text-primary-foreground disabled:opacity-50"
              >
                {pwSaving ? "Updating..." : "Update Password"}
              </button>
            </div>
          </div>

          <div className="mt-8 border border-red-200 p-6">
            <h2 className="font-display text-base mb-1 text-red-600">Delete account</h2>
            <p className="text-xs text-muted-foreground">
              This permanently removes your account, orders, addresses and chat history. This action
              cannot be undone.
            </p>
            <div className="mt-4">
              <label className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                Enter your password to confirm
              </label>
              <input
                type="password"
                value={delForm.password}
                onChange={(e) => setDelForm({ password: e.target.value })}
                autoComplete="current-password"
                className="mt-1 w-full border border-input bg-transparent px-3 py-2 text-sm outline-none"
              />
            </div>
            {delMsg && (
              <p className={`mt-3 text-xs ${delMsg.ok ? "text-emerald-600" : "text-red-500"}`}>
                {delMsg.text}
              </p>
            )}
            <button
              onClick={deleteAccount}
              disabled={delSaving || delForm.password.length === 0}
              className="mt-5 bg-red-600 py-2.5 px-6 text-[11px] uppercase tracking-[0.2em] text-white disabled:opacity-50"
            >
              {delSaving ? "Deleting..." : "Delete my account"}
            </button>
          </div>
        </>
      )}

      {tab === "messages" && (
        <div className="space-y-3">
          {notifications.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Bell size={40} className="mx-auto mb-4 opacity-30" />
              <p>No notifications yet</p>
              <p className="mt-1 text-xs">Replies from Lumina will appear here</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`group border p-5 text-left transition-colors ${n.isRead ? "border-border bg-transparent" : "border-accent/40 bg-accent/5"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <p className="font-display text-sm">{n.title}</p>
                    {!n.isRead && <span className="size-2 shrink-0 rounded-full bg-accent" />}
                  </div>
                  <button
                    onClick={() => deleteNotification(n.id)}
                    aria-label="Delete notification"
                    className="cursor-pointer text-muted-foreground/50 opacity-60 transition-all hover:text-red-500 sm:opacity-0 sm:group-hover:opacity-100"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <button
                  onClick={() => markRead(n)}
                  className="mt-1.5 block w-full cursor-pointer text-left"
                >
                  <p className="text-sm leading-relaxed text-muted-foreground">{n.body}</p>
                </button>
                <p className="mt-2 text-[11px] text-muted-foreground/70">
                  {new Date(n.createdAt).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
