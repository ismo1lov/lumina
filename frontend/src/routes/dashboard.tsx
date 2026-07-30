import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { LogOut, Package, MapPin, ShoppingBag } from "lucide-react";

interface Order {
  id: string;
  status: string;
  total: number;
  created_at: string;
}

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

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markerRef = useRef<any>(null);

  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
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

  const showForm = addresses.length === 0 || editingId !== null;

  useEffect(() => {
    if (!user) return;
    api.get<Order[]>("/orders").then(setOrders).catch(() => {});
    api.get<Address[]>("/addresses").then(setAddresses).catch(() => {});
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

      marker.on("dragend", () => {
        const pos = marker.getLatLng();
        setForm((prev) => ({ ...prev, lat: pos.lat, lng: pos.lng }));
      });

      map.on("click", (e: any) => {
        marker.setLatLng(e.latlng);
        setForm((prev) => ({ ...prev, lat: e.latlng.lat, lng: e.latlng.lng }));
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

  const updateMarker = (lat: number, lng: number) => {
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    }
    if (mapInstance.current) {
      mapInstance.current.setView([lat, lng], 13);
    }
  };

  const handleSave = async () => {
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
      setForm({ label: "Home", fullName: user?.name || "", phone: "", address: "", city: "", lat: 41.2995, lng: 69.2401, isDefault: false });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const editAddress = (a: Address) => {
    setForm({ label: a.label, fullName: a.fullName, phone: a.phone, address: a.address, city: a.city, lat: Number(a.lat) || 41.2995, lng: Number(a.lng) || 69.2401, isDefault: a.isDefault });
    setEditingId(a.id);
    if (a.lat && a.lng) updateMarker(Number(a.lat), Number(a.lng));
    setTab("addresses");
  };

  const deleteAddress = async (id: string) => {
    await api.delete(`/addresses/${id}`);
    setAddresses((prev) => prev.filter((a) => a.id !== id));
  };

  if (!user) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="text-center">
          <h1 className="font-display text-xl mb-4">Please sign in</h1>
          <Link to="/login" className="bg-primary px-6 py-3 text-[11px] uppercase tracking-[0.2em] text-primary-foreground">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    router.navigate({ to: "/login" });
  };

  const tabs = [
    { id: "orders", label: "My Orders", icon: Package },
    { id: "addresses", label: "Addresses", icon: MapPin },
  ];

  return (
    <div className="mx-auto max-w-4xl px-6 pt-36 pb-24">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-2xl">My Account</h1>
        <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
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
        <div>
          {orders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ShoppingBag size={40} className="mx-auto mb-4 opacity-30" />
              <p>No orders yet</p>
              <Link to="/catalog" className="mt-3 inline-block text-sm underline underline-offset-4">Start shopping</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((o) => (
                <div key={o.id} className="border p-4 flex justify-between items-center">
                  <div>
                    <p className="text-xs text-muted-foreground">#{o.id.slice(0, 8)}</p>
                    <p className="font-display text-sm mt-1 capitalize">{o.status}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-display">{new Intl.NumberFormat("en-US").format(o.total)} UZS</p>
                    <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
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
                      <span className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground">{a.label}</span>
                      {a.isDefault && <span className="text-[9px] bg-primary px-1.5 py-0.5 text-primary-foreground">DEFAULT</span>}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => editAddress(a)} className="text-[11px] underline underline-offset-2">Edit</button>
                      <button onClick={() => deleteAddress(a.id)} className="text-[11px] text-red-400 underline underline-offset-2">Delete</button>
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
                <h2 className="font-display text-base mb-4">{editingId ? "Edit Address" : "Add Address"}</h2>
                <div className="border p-4 space-y-3">
                  <div>
                    <label className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Label</label>
                    <select value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} className="w-full border border-input bg-transparent px-3 py-2 text-sm outline-none mt-1">
                      <option>Home</option>
                      <option>Work</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Full Name</label>
                    <input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="w-full border border-input bg-transparent px-3 py-2 text-sm outline-none mt-1" />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Phone</label>
                    <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full border border-input bg-transparent px-3 py-2 text-sm outline-none mt-1" />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Address</label>
                    <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} rows={2} className="w-full border border-input bg-transparent px-3 py-2 text-sm outline-none mt-1 resize-none" />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">City</label>
                    <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="w-full border border-input bg-transparent px-3 py-2 text-sm outline-none mt-1" />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-1 block">Pin your location on map</label>
                    <div ref={mapRef} className="h-48 w-full border" style={{ zIndex: 1 }} />
                    <p className="text-[10px] text-muted-foreground mt-1">Click or drag the marker</p>
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} className="accent-primary" />
                      Set as default
                    </label>
                    {editingId && (
                      <button onClick={() => { setEditingId(null); setForm({ label: "Home", fullName: user?.name || "", phone: "", address: "", city: "", lat: 41.2995, lng: 69.2401, isDefault: false }); }} className="text-[11px] underline underline-offset-2 ml-auto">
                        Cancel
                      </button>
                    )}
                  </div>

                  <button onClick={handleSave} disabled={saving} className="w-full bg-primary py-2.5 text-[11px] uppercase tracking-[0.2em] text-primary-foreground disabled:opacity-50">
                    {saving ? "Saving..." : editingId ? "Update Address" : "Save Address"}
                  </button>
                </div>
              </div>
            ) : (
              <button disabled className="w-full border-2 border-dashed border-border/30 py-3 text-center cursor-not-allowed opacity-50">
                <span className="text-sm">+</span>
                <p className="font-display text-xs mt-0.5">Add Address</p>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
