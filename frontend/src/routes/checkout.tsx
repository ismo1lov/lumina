import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Check, Loader } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { formatUZS } from "@/data/products";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { formatUzPhone, isValidUzPhone } from "@/lib/phone";
import { geocodeAddress, reverseGeocode } from "@/lib/geocode";
import { AuthRequiredDialog } from "@/components/site/AuthRequiredDialog";
import { resolveAsset } from "@/lib/assets";
import { useI18n } from "@/lib/i18n";
import { PaymentBrandLogo } from "@/components/site/PaymentLogos";
import { YandexMap } from "@/components/site/YandexMap";

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

const payments = [
  { id: "click", label: "Click" },
  { id: "payme", label: "Payme" },
  { id: "cod", label: "Cash on delivery" },
];

interface PaymentConfig {
  payme: boolean;
  click: boolean;
  visa: boolean;
  mock: boolean;
}

interface SavedAddress {
  id: string;
  address: string;
  city: string;
  lat: string | null;
  lng: string | null;
  isDefault: boolean;
}

function randomTashkentCoord() {
  return {
    lat: 41.2995 + (Math.random() - 0.5) * 0.06,
    lng: 69.2401 + (Math.random() - 0.5) * 0.08,
  };
}

function Checkout() {
  const { t } = useI18n();
  const { items, subtotal, clear } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isCustomer = !!user && user.role !== "admin";

  const [payment, setPayment] = useState("cod");
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig | null>(null);
  const [placed, setPlaced] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [phoneInvalid, setPhoneInvalid] = useState(false);
  const [form, setForm] = useState({
    first: "",
    last: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    ...randomTashkentCoord(),
  });

  const total = subtotal;
  const skipGeocodeRef = useRef(false);
  const reverseRequestRef = useRef(0);
  const manualEditRef = useRef(false);

  useEffect(() => {
    if (!isCustomer) return;
    setForm((prev) => ({
      ...prev,
      first: prev.first || user!.name.split(" ")[0] || "",
      last: prev.last || user!.name.split(" ").slice(1).join(" "),
      email: user!.email,
    }));
  }, [isCustomer]);

  // Restore the user's saved address so the map opens on the right place.
  useEffect(() => {
    if (!isCustomer) return;
    let active = true;
    api
      .get<SavedAddress[]>("/addresses")
      .then((rows) => {
        if (!active) return;
        const saved = rows.find((a) => a.isDefault) ?? rows[0];
        if (saved && saved.lat && saved.lng && !form.address && !form.city) {
          setForm((prev) => ({
            ...prev,
            address: saved.address || "",
            city: saved.city || "",
            lat: Number(saved.lat),
            lng: Number(saved.lng),
          }));
        }
      })
      .catch(() => {
        /* ignore */
      });
    return () => {
      active = false;
    };
  }, [isCustomer]);

  useEffect(() => {
    let active = true;
    api
      .get<PaymentConfig>("/payments/config")
      .then((config) => {
        if (!active) return;
        setPaymentConfig(config);
        if (config.click) setPayment("click");
        else if (config.payme) setPayment("payme");
      })
      .catch(() => {
        if (active) setPaymentConfig({ payme: false, click: false, visa: false, mock: false });
      });
    return () => {
      active = false;
    };
  }, []);

  const handleMapChange = (lat: number, lng: number) => {
    manualEditRef.current = false;
    setForm((prev) => ({ ...prev, lat, lng }));
    const requestId = ++reverseRequestRef.current;

    void reverseGeocode(lat, lng).then((place) => {
      if (!place || requestId !== reverseRequestRef.current) return;
      if (manualEditRef.current) return;
      setForm((prev) => {
        const address = place.address || prev.address;
        const city = place.city || prev.city;
        if (!address && !city) return prev;
        if (address === prev.address && city === prev.city) return prev;

        skipGeocodeRef.current = true;
        return { ...prev, address, city };
      });
    });
  };

  useEffect(() => {
    if (placed) return;
    if (skipGeocodeRef.current) {
      skipGeocodeRef.current = false;
      return;
    }
    const query = `${form.address} ${form.city}`.trim();
    if (!query) return;
    const timer = setTimeout(async () => {
      const results = await geocodeAddress(query);
      if (results.length === 0) return;
      const place = results[0];
      setForm((prev) =>
        prev.lat !== place.lat || prev.lng !== place.lng
          ? { ...prev, lat: place.lat, lng: place.lng }
          : prev,
      );
    }, 900);
    return () => clearTimeout(timer);
  }, [form.address, form.city, placed]);

  if (placed) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-6 text-center">
        <span className="grid size-14 place-items-center rounded-full bg-accent text-accent-foreground">
          <Check size={22} />
        </span>
        <h1 className="mt-8 font-display text-4xl">{t("Order placed")}</h1>
        {placedOrderId && (
          <p className="mt-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">
            {t("Order number")}: {placedOrderId}
          </p>
        )}
        <p className="mt-4 text-sm text-muted-foreground">
          {t(
            "Thank you. Our workshop will call you within a few hours to confirm delivery and assembly.",
          )}
        </p>
        <Link
          to="/catalog"
          className="mt-9 bg-primary px-8 py-4 text-[11px] uppercase tracking-[0.22em] text-primary-foreground"
        >
          {t("Continue shopping")}
        </Link>
      </div>
    );
  }

  if (!isCustomer) {
    return (
      <div className="min-h-screen">
        <AuthRequiredDialog open dismissable={false} onOpenChange={() => {}} />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setPhoneInvalid(false);
    if (!isValidUzPhone(form.phone)) {
      setPhoneInvalid(true);
      setError(t("Please enter a complete and valid phone number (+998 ** *** ** **)"));
      return;
    }
    const onlineAvailable =
      payment === "cod" ||
      (payment === "click" && !!paymentConfig?.click) ||
      (payment === "payme" && !!paymentConfig?.payme);
    if (!onlineAvailable) {
      setError(t("This payment method is not configured yet"));
      return;
    }
    setBusy(true);
    try {
      const name = `${form.first} ${form.last}`.trim();
      const result = await api.post<{ orderId: string; redirectUrl?: string }>("/orders", {
        shippingAddress: {
          name,
          phone: form.phone,
          address: form.address,
          city: form.city,
          lat: String(form.lat),
          lng: String(form.lng),
        },
        payment,
        delivery: "standard",
        items: items.map((i) => ({
          productId: i.id,
          finish: i.finish,
          color: i.color,
          assembly: i.assembly,
          qty: i.qty,
        })),
      });

      if (payment !== "cod") {
        clear();
        try {
          localStorage.setItem("lumina-last-order", result.orderId);
        } catch {
          /* ignore */
        }
        window.location.assign(
          result.redirectUrl || `/payment/result?orderId=${encodeURIComponent(result.orderId)}`,
        );
        return;
      }

      clear();
      setPlacedOrderId(result.orderId);
      setPlaced(true);
    } catch (err) {
      setError(err instanceof Error ? t(err.message) : t("Failed to place order"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1400px] px-6 pb-24 pt-32 lg:px-12 lg:pt-40">
      <p className="eyebrow">{t("Checkout")}</p>
      <h1 className="mt-4 font-display text-5xl">{t("Almost home")}</h1>

      <div className="mt-14 grid gap-16 lg:grid-cols-[1.3fr_1fr]">
        {/* Left */}
        <form className="space-y-12" onSubmit={handleSubmit}>
          <section>
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <Field
                label="First name"
                value={form.first}
                onChange={(v) => setForm({ ...form, first: v })}
              />
              <Field
                label="Last name"
                value={form.last}
                onChange={(v) => setForm({ ...form, last: v })}
              />
              <Field
                label="Phone"
                type="tel"
                value={form.phone}
                onChange={(v) => setForm({ ...form, phone: formatUzPhone(v) })}
              />
              <div>
                <label className="block">
                  <span className="eyebrow">{t("Email")}</span>
                  <input
                    type="email"
                    readOnly
                    value={form.email}
                    className="mt-2 w-full cursor-not-allowed border-b bg-cream/50 py-2 text-sm outline-none"
                  />
                </label>
                <span className="mt-1 block text-[11px] text-muted-foreground">
                  {t("Your account email")}
                </span>
              </div>
              <div className="sm:col-span-2">
                <Field
                  label="Address"
                  value={form.address}
                  onChange={(v) => {
                    manualEditRef.current = true;
                    setForm({ ...form, address: v });
                  }}
                />
              </div>
              <Field
                label="City"
                value={form.city}
                onChange={(v) => {
                  manualEditRef.current = true;
                  setForm({ ...form, city: v });
                }}
              />
              <div className="sm:col-span-2">
                <label className="block">
                  <span className="eyebrow">{t("Location on map")}</span>
                  <YandexMap
                    lat={form.lat}
                    lng={form.lng}
                    zoom={13}
                    interactive
                    onChange={handleMapChange}
                    title={t("Location on map")}
                    className="mt-2 h-56 w-full border"
                  />
                  <span className="mt-1 block text-[11px] text-muted-foreground">
                    {t("Click on the map or drag the marker to set your exact location.")}
                  </span>
                </label>
              </div>
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
                {t("Placing order…")}
              </span>
            ) : (
              t("Place order · {total}", { total: formatUZS(total) })
            )}
          </button>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </form>

        {/* Right */}
        <aside className="h-fit">
          <div className="rounded-xl border border-border p-6">
            <h2 className="font-display text-xl mb-4">{t("Order summary")}</h2>

            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t("Your cart is empty.")}{" "}
                <Link to="/catalog" className="link-underline underline-offset-4">
                  {t("Browse the collection")}
                </Link>
                .
              </p>
            ) : (
              <>
                <ul className="mt-0 divide-y divide-border/50">
                  {items.map((i) => (
                    <li key={i.key} className="flex gap-3 py-4">
                      <img
                        src={resolveAsset(i.image)}
                        alt={i.name}
                        loading="lazy"
                        width={56}
                        height={56}
                        className="size-14 rounded-md bg-background object-cover"
                      />
                      <div className="flex-1 text-sm">
                        <p className="font-medium text-foreground leading-tight">{i.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {t(i.finish)} · {t(i.color)} · ×{i.qty}
                        </p>
                        {i.assembly && (
                          <p className="text-xs text-accent">{t("Home assembly included")}</p>
                        )}
                      </div>
                      <span className="text-sm font-medium text-foreground">
                        {formatUZS(i.unitPrice * i.qty)}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="mt-6 space-y-2 border-t border-border pt-4">
                  <div className="flex justify-between">
                    <span className="eyebrow text-xs uppercase tracking-wider">
                      {t("Total")}
                    </span>
                    <span className="font-semibold tabular-nums text-lg text-foreground">
                      {formatUZS(total)}
                    </span>
                  </div>
                </div>

                <div className="mt-8">
                  <p className="eyebrow">{t("Payment")}</p>
                  <div className="mt-3 grid grid-cols-1 gap-2">
                    {payments
                      .filter((p) => {
                        if (p.id === "cod") return true;
                        if (p.id === "click") return !!paymentConfig?.click;
                        if (p.id === "payme") return !!paymentConfig?.payme;
                        return false;
                      })
                      .map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setPayment(p.id)}
                          className={`flex cursor-pointer items-center justify-between gap-3 border px-3 py-2.5 text-left text-[11px] uppercase tracking-[0.14em] transition-colors ${
                            payment === p.id ? "border-foreground bg-background" : "border-border"
                          }`}
                        >
                          <span>{t(p.label)}</span>
                          {p.id === "click" && <PaymentBrandLogo brand="click" className="h-6 w-16" />}
                          {p.id === "payme" && <PaymentBrandLogo brand="payme" className="h-6 w-16" />}
                        </button>
                      ))}
                  </div>

                  {paymentConfig && !paymentConfig.click && !paymentConfig.payme && (
                    <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
                      {t("Online payment is temporarily unavailable")}.{" "}
                      {t("Please choose cash on delivery or contact us.")}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </aside>
      </div>
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
  const { t } = useI18n();
  return (
    <label className="block">
      <span className="eyebrow">{t(label)}</span>
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
