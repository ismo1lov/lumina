import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { Box, Heart, Minus, Plus, Truck, Loader } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ASSEMBLY_FEE, formatUZS, getProduct, products, type Product } from "@/data/products";
import { useCart } from "@/lib/cart";
import { useWishlist } from "@/lib/wishlist";
import { useAuth } from "@/lib/auth-context";
import { ProductCard } from "@/components/site/ProductCard";
import { Reveal } from "@/components/site/Reveal";
import { Stars } from "@/components/site/Stars";
import { AuthRequiredDialog } from "@/components/site/AuthRequiredDialog";

export const Route = createFileRoute("/product/$id")({
  loader: ({ params }) => {
    const product = getProduct(params.id);
    if (!product) throw notFound();
    return { product };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Piece unavailable — Lumina Home" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const p = loaderData.product;
    return {
      meta: [
        { title: `${p.name} — Lumina Home` },
        { name: "description", content: p.description.slice(0, 155) },
        { property: "og:title", content: `${p.name} — Lumina Home` },
        { property: "og:description", content: p.description.slice(0, 155) },
      ],
    };
  },
  component: ProductPage,
});

const reviews = [
  {
    name: "Dilnoza R.",
    rating: 5,
    text: "The walnut grain is even richer in person. Assembly team was in and out in 20 minutes.",
  },
  {
    name: "Timur A.",
    rating: 5,
    text: "Second piece from Lumina. The finish still looks new after a year of daily use.",
  },
  {
    name: "Malika S.",
    rating: 4,
    text: "Beautiful and very solid. Delivery took a week longer than promised, but worth the wait.",
  },
];

function ProductPage() {
  const { product } = Route.useLoaderData() as { product: Product };
  const { add } = useCart();
  const { toggle, has } = useWishlist();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [finish, setFinish] = useState(product.finishes[0]);
  const [color, setColor] = useState(product.colors[0]);
  const [assembly, setAssembly] = useState(false);
  const [qty, setQty] = useState(1);
  const [active, setActive] = useState(0);
  const [is3D, setIs3D] = useState(false);
  const [changing, setChanging] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  const finishImages = finish.colorImages || product.colors.map((c) => c.image || product.image);
  const gallery = finishImages;
  const colorImg = gallery[product.colors.indexOf(color)] || gallery[0] || product.image;
  const unitPrice = product.price + finish.delta + (assembly ? ASSEMBLY_FEE : 0);

  const addToCart = () =>
    add({
      id: product.id,
      name: product.name,
      image: colorImg,
      finish: finish.name,
      color: color.name,
      assembly,
      unitPrice,
      qty,
    });

  useEffect(() => {
    setChanging(true);
    const t = setTimeout(() => setChanging(false), 400);
    return () => clearTimeout(t);
  }, [gallery[active], finish]);

  const related = products.filter((p) => p.id !== product.id && p.category === product.category);

  return (
    <div className="mx-auto max-w-[1400px] px-6 pb-24 pt-32 lg:px-12 lg:pt-36">
      <nav className="mb-10 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        <Link to="/" className="link-underline">
          Home
        </Link>
        <span className="px-2">/</span>
        <Link to="/catalog" className="link-underline">
          Catalog
        </Link>
        <span className="px-2">/</span>
        <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="grid gap-14 lg:grid-cols-[0.85fr_1.15fr]">
        {/* Gallery */}
        <div>
          <div className="relative bg-cream">
            {is3D ? (
              <div className="flex aspect-square w-full flex-col items-center justify-center gap-3 text-muted-foreground">
                <Box size={38} strokeWidth={1} className="animate-[spin_9s_linear_infinite]" />
                <p className="text-[11px] uppercase tracking-[0.2em]">360° view loading</p>
              </div>
            ) : (
              <div className="relative aspect-square w-full">
                <AnimatePresence mode="popLayout">
                  {changing ? (
                    <motion.div
                      key="loader"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="absolute inset-0 flex items-center justify-center bg-cream"
                    >
                      <Loader
                        size={28}
                        strokeWidth={1.2}
                        className="animate-[spin_0.8s_linear_infinite] text-muted-foreground"
                      />
                    </motion.div>
                  ) : (
                    <motion.img
                      key={gallery[active]}
                      src={gallery[active]}
                      alt={product.name}
                      width={1000}
                      height={1000}
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                      className="absolute inset-0 aspect-square w-full object-cover"
                    />
                  )}
                </AnimatePresence>
              </div>
            )}
            <button
              type="button"
              onClick={() => setIs3D(!is3D)}
              className="absolute right-4 top-4 flex items-center gap-2 bg-background/90 px-4 py-2 text-[10px] uppercase tracking-[0.2em] backdrop-blur"
            >
              <Box size={13} /> {is3D ? "Photos" : "3D view"}
            </button>
          </div>
          <div className="mt-4 flex gap-4">
            {gallery.map((g, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setActive(i);
                  setColor(product.colors[i]);
                  setIs3D(false);
                }}
                className={`w-24 border transition-colors ${
                  active === i && !is3D ? "border-foreground" : "border-transparent"
                }`}
                aria-label={`View image ${i + 1}`}
              >
                <img
                  src={g}
                  alt=""
                  loading="lazy"
                  width={200}
                  height={200}
                  className="aspect-square w-full bg-cream object-cover"
                />
              </button>
            ))}
          </div>

          <Accordion type="single" collapsible className="mt-10 border-t">
            <AccordionItem value="dimensions">
              <AccordionTrigger className="text-sm">
                Dimensions &amp; specifications
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                <ul className="space-y-1.5">
                  <li>
                    Width × Height × Depth: {product.dimensions.width} × {product.dimensions.height}{" "}
                    × {product.dimensions.depth} cm
                  </li>
                  <li>Primary material: {finish.material}</li>
                  <li>Frame: kiln-dried hardwood, mortise-and-tenon joinery</li>
                  <li>Finish: plant-based hardwax oil</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="care">
              <AccordionTrigger className="text-sm">Care instructions</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                Dust with a dry cloth. Wipe spills immediately and re-oil the wood once a year. Keep
                out of direct sunlight and away from radiators to protect the grain.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* Details */}
        <div>
          <p className="eyebrow">
            {product.category} · SKU {product.sku}
          </p>
          <h1 className="mt-4 font-display text-4xl lg:text-5xl">{product.name}</h1>
          <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
            <Stars rating={product.rating} size={14} />
            <span>
              {product.rating} · {product.reviews} reviews
            </span>
          </div>

          <p className="mt-7 font-semibold tabular-nums text-3xl">{formatUZS(unitPrice)}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            {product.inStock ? "In stock · ships in 3–5 days" : "Pre-order · ships in 4 weeks"}
          </p>

          <p className="mt-7 max-w-lg text-sm leading-relaxed text-muted-foreground">
            {product.description}
          </p>

          <div className="mt-9 space-y-7">
            <div>
              <p className="eyebrow">Wood finish</p>
              <div className="mt-3 flex gap-3">
                {product.finishes.map((f) => (
                  <button
                    key={f.name}
                    type="button"
                    onClick={() => {
                      setFinish(f);
                      setColor(product.colors[f.colorIndex]);
                      setActive(f.colorIndex);
                    }}
                    className={`border px-5 py-2.5 text-xs transition-colors ${
                      finish.name === f.name
                        ? "border-foreground bg-primary text-primary-foreground"
                        : "border-border hover:border-foreground"
                    }`}
                  >
                    {f.name}
                    {f.delta > 0 && <span className="ml-2 opacity-70">+{f.delta / 1000}k</span>}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="eyebrow">Fabric / colour — {color.name}</p>
              <div className="mt-3 flex gap-3">
                {product.colors.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    aria-label={c.name}
                    onClick={() => {
                      const ci = product.colors.indexOf(c);
                      setColor(c);
                      setActive(ci);
                      const match = product.finishes.find((f) => f.colorIndex === ci);
                      if (match) setFinish(match);
                    }}
                    style={{ backgroundColor: c.hex }}
                    className={`size-9 rounded-full border transition-transform ${
                      color.name === c.name
                        ? "scale-110 border-foreground"
                        : "border-border hover:scale-105"
                    }`}
                  />
                ))}
              </div>
            </div>

            <label className="flex cursor-pointer items-center gap-3 border bg-cream px-5 py-4 text-sm">
              <input
                type="checkbox"
                checked={assembly}
                onChange={() => setAssembly(!assembly)}
                className="size-4 accent-[var(--terracotta)]"
              />
              Add Home Assembly (+{formatUZS(ASSEMBLY_FEE)})
            </label>

            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center border">
                <button
                  type="button"
                  className="px-4 py-3.5"
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  aria-label="Decrease quantity"
                >
                  <Minus size={13} />
                </button>
                <span className="w-9 text-center text-sm">{qty}</span>
                <button
                  type="button"
                  className="px-4 py-3.5"
                  onClick={() => setQty(qty + 1)}
                  aria-label="Increase quantity"
                >
                  <Plus size={13} />
                </button>
              </div>
              <button
                type="button"
                onClick={addToCart}
                className="flex-1 bg-primary px-8 py-4 text-[11px] uppercase tracking-[0.22em] text-primary-foreground transition-opacity hover:opacity-90"
              >
                Add to cart
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!user) {
                    setShowAuthDialog(true);
                    return;
                  }
                  addToCart();
                  navigate({ to: "/checkout" });
                }}
                className="border border-foreground/25 px-8 py-4 text-[11px] uppercase tracking-[0.22em] transition-colors hover:border-foreground"
              >
                Buy now
              </button>
              <button
                type="button"
                onClick={() =>
                  toggle({ id: product.id, name: product.name, image: colorImg, price: unitPrice })
                }
                aria-label={has(product.id) ? "Remove from wishlist" : "Add to wishlist"}
                className={`grid size-12 place-items-center border transition-colors ${
                  has(product.id)
                    ? "border-accent text-accent"
                    : "border-foreground/20 hover:text-accent"
                }`}
              >
                <Heart size={16} fill={has(product.id) ? "currentColor" : "none"} />
              </button>
            </div>

            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <Truck size={14} /> Free delivery across Uzbekistan · 2-year warranty
            </p>

            <Accordion type="single" collapsible className="mt-10 border-t">
              <AccordionItem value="delivery">
                <AccordionTrigger className="text-sm">Delivery information</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  Free standard delivery in 3–5 working days within Tashkent, 5–9 days elsewhere in
                  Uzbekistan. Express with in-home assembly available at checkout.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <section className="mt-28 border-t pt-14">
        <Reveal className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="eyebrow">Reviews</p>
            <h2 className="mt-3 font-display text-4xl">
              {product.rating} out of 5
              <span className="ml-3 align-middle text-sm text-muted-foreground">
                {product.reviews} verified buyers
              </span>
            </h2>
          </div>
        </Reveal>
        <div className="mt-10 grid gap-8 md:grid-cols-3">
          {reviews.map((r, i) => (
            <Reveal key={r.name} delay={i * 0.07} className="border-t pt-6">
              <Stars rating={r.rating} />
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{r.text}</p>
              <p className="mt-4 text-[11px] uppercase tracking-[0.2em]">{r.name}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <AuthRequiredDialog open={showAuthDialog} onOpenChange={setShowAuthDialog} />
    </div>
  );
}
