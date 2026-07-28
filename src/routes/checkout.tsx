import { createFileRoute, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { useState } from "react";
import { formatUZS } from "@/data/products";
import { useCart } from "@/lib/cart";

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
  const [delivery, setDelivery] = useState(deliveryOptions[0]);
  const [payment, setPayment] = useState(payments[0].id);
  const [promo, setPromo] = useState("");
  const [applied, setApplied] = useState(false);
  const [placed, setPlaced] = useState(false);

  const discount = applied ? Math.round(subtotal * 0.1) : 0;
  const total = subtotal + delivery.price - discount;

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

  return (
    <div className="mx-auto max-w-[1400px] px-6 pb-24 pt-32 lg:px-12 lg:pt-40">
      <p className="eyebrow">Checkout</p>
      <h1 className="mt-4 font-display text-5xl">Almost home</h1>

      <div className="mt-14 grid gap-16 lg:grid-cols-[1.3fr_1fr]">
        {/* Left */}
        <form
          className="space-y-12"
          onSubmit={(e) => {
            e.preventDefault();
            clear();
            setPlaced(true);
          }}
        >
          <section>
            <h2 className="font-display text-2xl">Shipping details</h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <Field label="First name" />
              <Field label="Last name" />
              <Field label="Phone" type="tel" />
              <Field label="Email" type="email" />
              <div className="sm:col-span-2">
                <Field label="Address" />
              </div>
              <Field label="City" />
              <Field label="Postal code" required={false} />
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
            disabled={items.length === 0}
            className="w-full bg-primary py-4 text-[11px] uppercase tracking-[0.22em] text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            Place order · {formatUZS(total)}
          </button>
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

          <div className="mt-6 flex gap-2 border-t pt-6">
            <input
              value={promo}
              onChange={(e) => setPromo(e.target.value)}
              placeholder="Promo code"
              className="w-full border-b bg-transparent py-2 text-sm outline-none"
            />
            <button
              type="button"
              onClick={() => setApplied(promo.trim().length > 0)}
              className="border px-4 py-2 text-[10px] uppercase tracking-[0.2em]"
            >
              Apply
            </button>
          </div>
          {applied && <p className="mt-2 text-xs text-accent">Promo applied — 10% off.</p>}

          <div className="mt-6 space-y-2 border-t pt-6 text-sm">
            <Row label="Subtotal" value={formatUZS(subtotal)} />
            <Row label="Delivery" value={delivery.price ? formatUZS(delivery.price) : "Free"} />
            {discount > 0 && <Row label="Discount" value={`− ${formatUZS(discount)}`} />}
            <div className="flex justify-between border-t pt-3">
              <span className="eyebrow">Total</span>
              <span className="font-display text-2xl">{formatUZS(total)}</span>
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
                  className={`border px-2 py-3 text-[10px] uppercase tracking-[0.14em] transition-colors ${
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
  required = true,
}: {
  label: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="eyebrow">{label}</span>
      <input
        type={type}
        required={required}
        className="mt-2 w-full border-b bg-transparent py-2 text-sm outline-none focus:border-accent"
      />
    </label>
  );
}
