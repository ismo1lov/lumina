import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Check, Loader } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { formatUZS } from "@/data/products";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — Lumina Home" },
      {
        name: "description",
        content:
          "Complete your Lumina Home order: shipping details, standard or express delivery with assembly, and payment via Click, Payme or cash on delivery.",
      },
      { property: "og:title", content: "Checkout — Lumina Home" },
      { property: "og:description", content: "Secure checkout for your Lumina Home order." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Checkout,
});

const deliveryOptions = [
  { id: "standard", label: "Standard delivery", copy: "3–5 working days", price: 0 },
  { id: "express", label: "Express + assembly", copy: "Next day, assembled in home", price: 250000 },
];

const payments = [
  { id: "click", label: "Click" },
  { id: "payme", label: "Payme" },
  { id: "cod", label: "Cash on delivery" },
];

function Checkout() {
  const { items, subtotal, clear } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markerRef = useRef<any>(null);

  const [delivery, setDelivery] = useState(deliveryOptions[0]);
  const [payment, setPayment] = useState(payments[0].id);
  const [placed, setPlaced] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    first: "",
    last: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    lat: 41.2995,
    lng: 69.2401,
  });

  const total = subtotal + delivery.price;

  useEffect(() => {
    if (!user) return;
    setForm((prev) => ({
      ...prev,
      first: prev.first || (user.name.split(" ")[0] ?? ""),
      last: prev.last || user.name.split(" ").slice(1).join(" "),
      email: user.email,
    }));
  }, [user]);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;
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
  }, []);

  if (placed) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-6 text-center">
        <span className="grid size-14 place-items-center rounded-full bg-accent text-accent-foreground">
          <Check size={22} />
        </span>
        <h1 className="mt-8 font-display text-4xl">Order placed</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          Thank you. Our workshop will call you within a few hours to confirm delivery and assembly.
        </p>
        <Link
          to="/catalog"
          className="mt-9 bg-primary px-8 py-4 text-[11px] uppercase tracking-[0.22em] text-primary-foreground"
        >
          Continue shopping
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!user) {
      navigate({ to: "/login" });
      return;
    }
    setBusy(true);
    try {
      const name = `${form.first} ${form.last}`.trim();
      await api.post("/orders", {
        shippingAddress: {
          name,
          phone: form.phone,
          address: form.address,
          city: form.city,
          lat: String(form.lat),
          lng: String(form.lng),
        },
        payment,
        delivery: delivery.id,
        items: items.map((i) => ({
          productId: i.id,
          finish: i.finish,
          color: i.color,
          assembly: i.assembly,
          qty: i.qty,
        })),
      });
      clear();
      setPlaced(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to place order");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1400px] px-6 pb-24 pt-32 lg:px-12 lg:pt-40">
      <p className="eyebrow">Checkout</p>
      <h1 className="mt-4 font-display text-5xl">Almost home</h1>

      <div className="mt-14 grid gap-16 lg:grid-cols-[1.3fr_1fr]">
        {/* Left */}
        <form className="space-y-12" onSubmit={handleSubmit}>
          <section>
            <h2 className="font-display text-2xl">Shipping details</h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <Field label="First name" value={form.first} onChange={(v) => setForm({ ...form, first: v })} />
              <Field label="Last name" value={form.last} onChange={(v) => setForm({ ...form, last: v })} />
              <Field label="Phone" type="tel" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
              <div>
                <label className="block">
                  <span className="eyebrow">Email</span>
                  <input
                    type="email"
                    readOnly
                    value={form.email}
                    className="mt-2 w-full cursor-not-allowed border-b bg-cream/50 py-2 text-sm outline-none"
                  />
                </label>
                <span className="mt-1 block text-[11px] text-muted-foreground">Your account email</span>
              </div>
              <div className="sm:col-span-2">
                <Field label="Address" value={form.address} onChange={(v) => setForm({ ...form, address: v })} />
              </div>
              <Field label="City" value={form.city} onChange={(v) => setForm({ ...form, city: v })} />
              <div className="sm:col-span-2">
                <label className="block">
                  <span className="eyebrow">Pin your location on map</span>
                  <div ref={mapRef} className="mt-2 h-56 w-full border" style={{ zIndex: 1 }} />
                  <span className="mt-1 block text-[11px] text-muted-foreground">Click or drag the marker</span>
                </label>
              </div>
            </div>
          </section>

          <section>
            <h2 className="font-display text-2xl">Delivery method</h2>
            <div className="mt-6 space-y-3">
              {deliveryOptions.map((d) => (
                <label
                  key={d.id}
                  className={`flex cursor-pointer items-center justify-between border px-5 py-4 transition-colors ${
                    delivery.id === d.id ? "border-foreground bg-cream" : "border-border"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="delivery"
                      checked={delivery.id === d.id}
                      onChange={() => setDelivery(d)}
                      className="accent-[var(--terracotta)]"
                    />
                    <span>
                      <span className="block text-sm">{d.label}</span>
                      <span className="block text-xs text-muted-foreground">{d.copy}</span>
                    </span>
                  </span>
                  <span className="text-sm">{d.price ? formatUZS(d.price) : "Free"}</span>
                </label>
              ))}
            </div>
          </section>

          <button
            type="submit"
            disabled={busy || items.length === 0}
            className="w-full cursor-pointer bg-primary py-4 text-[11px] uppercase tracking-[0.22em] text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {busy ? (
              <span className="inline-flex items-center gap-2">
                <Loader size={14} className="animate-spin" />
                Placing order…
              </span>
            ) : (
              `Place order · ${formatUZS(total)}`
            )}
          </button>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </form>

        {/* Right */}
        <aside className="h-fit bg-cream p-7 lg:sticky lg:top-28">
          <h2 className="font-display text-2xl">Order summary</h2>

          {items.length === 0 ? (
            <p className="mt-6 text-sm text-muted-foreground">
              Your cart is empty.{" "}
              <Link to="/catalog" className="link-underline">
                Browse the collection
              </Link>
              .
            </p>
          ) : (
            <ul className="mt-6 divide-y">
              {items.map((i) => (
                <li key={i.key} className="flex gap-4 py-4">
                  <img
                    src={i.image}
                    alt={i.name}
                    loading="lazy"
                    width={64}
                    height={64}
                    className="size-16 bg-background object-cover"
                  />
                  <div className="flex-1 text-sm">
                    <p className="font-display text-base">{i.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {i.finish} · {i.color} · ×{i.qty}
                    </p>
                    {i.assembly && <p className="text-xs text-accent">Home assembly included</p>}
                  </div>
                  <span className="text-sm">{formatUZS(i.unitPrice * i.qty)}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-6 space-y-2 border-t pt-6 text-sm">
            <Row label="Subtotal" value={formatUZS(subtotal)} />
            <Row label="Delivery" value={delivery.price ? formatUZS(delivery.price) : "Free"} />
            <div className="flex justify-between border-t pt-3">
              <span className="eyebrow">Total</span>
              <span className="font-semibold tabular-nums text-2xl">{formatUZS(total)}</span>
            </div>
          </div>

          <div className="mt-7">
            <p className="eyebrow">Payment</p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {payments.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPayment(p.id)}
                  className={`cursor-pointer border px-2 py-3 text-[10px] uppercase tracking-[0.14em] transition-colors ${
                    payment === p.id ? "border-foreground bg-background" : "border-border"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-muted-foreground">
      <span>{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}

function Field({
  label,
  type = "text",
  value,
  onChange,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="eyebrow">{label}</span>
      <input
        type={type}
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full border-b bg-transparent py-2 text-sm outline-none focus:border-accent"
      />
    </label>
  );
}
