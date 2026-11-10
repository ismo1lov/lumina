import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { Box, Heart, Minus, Plus, Truck, Loader, PenLine } from "lucide-react";
import { useState, useEffect, useRef } from "react";
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
import { ReviewPrompt, type ReviewSummary } from "@/components/site/ReviewPrompt";
import { resolveAsset } from "@/lib/assets";
import { AuthRequiredDialog } from "@/components/site/AuthRequiredDialog";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

const REVIEW_PROMPT_DELAY = 5000;
const REVIEW_LATER_COOLDOWN = 7 * 24 * 60 * 60 * 1000;

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

function ProductPage() {
  const { product } = Route.useLoaderData() as { product: Product };
  const { t } = useI18n();
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

  // Real, customer written reviews.
  const [reviewItems, setReviewItems] = useState<
    { id: string; rating: number; comment: string; userName: string; createdAt: string }[]
  >([]);
  const [reviewSummary, setReviewSummary] = useState<ReviewSummary | null>(null);
  const [myReview, setMyReview] = useState<{ rating: number; comment: string } | null>(null);
  const [promptOpen, setPromptOpen] = useState(false);
  const myReviewRef = useRef(myReview);
  myReviewRef.current = myReview;

  const finishImages = finish.colorImages || product.colors.map((c) => c.image || product.image);
  const gallery = finishImages.map((g) => resolveAsset(g) || g);
  const colorImg =
    gallery[product.colors.indexOf(color)] || gallery[0] || resolveAsset(product.image) || product.image;
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
    const timer = setTimeout(() => setChanging(false), 400);
    return () => clearTimeout(timer);
  }, [gallery[active], finish]);

  // Load the real reviews of this piece.
  useEffect(() => {
    let active = true;
    api
      .get<{ items: typeof reviewItems; average: number; count: number }>(`/reviews/${product.id}`)
      .then((res) => {
        if (!active) return;
        setReviewItems(res.items ?? []);
        setReviewSummary({ average: Number(res.average ?? 0), count: Number(res.count ?? 0) });
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [product.id]);

  // Load the review of the signed-in user (if any) so we can offer editing.
  useEffect(() => {
    if (!user) {
      setMyReview(null);
      return;
    }
    let active = true;
    api
      .get<{ rating: number; comment: string } | null>(`/reviews/${product.id}/mine`)
      .then((res) => {
        if (!active || !res) return;
        setMyReview({ rating: res.rating, comment: res.comment ?? "" });
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [user, product.id]);

  // Ask for a review once the visitor has had a moment with the piece.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (myReviewRef.current) return;
      const key = `lumina-review-prompt:${product.id}`;
      const stored = localStorage.getItem(key);
      if (stored === "rated") return;
      if (stored) {
        const laterAt = Number(stored);
        // "Later" only postpones the question for a week.
        if (!Number.isNaN(laterAt) && Date.now() - laterAt < REVIEW_LATER_COOLDOWN) return;
      }
      setPromptOpen(true);
    }, REVIEW_PROMPT_DELAY);
    return () => window.clearTimeout(timer);
  }, [product.id]);

  const markReviewed = () => {
    try {
      localStorage.setItem(`lumina-review-prompt:${product.id}`, "rated");
    } catch {
      /* ignore */
    }
  };

  const markLater = () => {
    try {
      localStorage.setItem(`lumina-review-prompt:${product.id}`, String(Date.now()));
    } catch {
      /* ignore */
    }
  };

  const handleSubmitted = (summary: ReviewSummary) => {
    markReviewed();
    setReviewSummary(summary);
    api
      .get<{ items: typeof reviewItems }>(`/reviews/${product.id}`)
      .then((res) => setReviewItems(res.items ?? []))
      .catch(() => {});
  };

  const related = products.filter((p) => p.id !== product.id && p.category === product.category);

  const displayRating = reviewSummary?.count ? reviewSummary.average : product.rating;
  const displayReviews = reviewSummary?.count ? reviewSummary.count : product.reviews;

  return (
    <div className="mx-auto max-w-[1400px] px-6 pb-24 pt-32 md:px-8 md:pt-32 lg:px-12 lg:pt-36">
      <nav className="mb-8 text-[11px] uppercase tracking-[0.18em] text-muted-foreground md:mb-10">
        <Link to="/" className="link-underline">
          {t("Home")}
        </Link>
        <span className="px-2">/</span>
        <Link to="/catalog" className="link-underline">
          {t("Catalog")}
        </Link>
        <span className="px-2">/</span>
        <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="grid gap-14 md:grid-cols-[0.92fr_1.08fr] md:items-start md:gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14">
        {/* Gallery */}
        <div className="md:sticky md:top-24 lg:static">
          <div className="relative bg-cream">
            {is3D ? (
              <div className="flex aspect-square w-full flex-col items-center justify-center gap-3 text-muted-foreground">
                <Box size={38} strokeWidth={1} className="animate-[spin_9s_linear_infinite]" />
                <p className="text-[11px] uppercase tracking-[0.2em]">{t("360° view loading")}</p>
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
              <Box size={13} /> {is3D ? t("Photos") : t("3D view")}
            </button>
          </div>
          <div className="mt-4 flex gap-3 lg:gap-4">
            {gallery.map((g, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setActive(i);
                  setColor(product.colors[i]);
                  setIs3D(false);
                }}
                className={`w-16 border transition-colors sm:w-20 lg:w-24 ${
                  active === i && !is3D ? "border-foreground" : "border-transparent"
                }`}
                aria-label={t("View image {index}", { index: i + 1 })}
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
                {t("Dimensions & specifications")}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                <ul className="space-y-1.5">
                  <li>
                    {t("Width × Height × Depth: {width} × {height} × {depth} cm", {
                      width: product.dimensions.width,
                      height: product.dimensions.height,
                      depth: product.dimensions.depth,
                    })}
                  </li>
                  <li>{t("Primary material: {material}", { material: t(finish.material) })}</li>
                  <li>{t("Frame: kiln-dried hardwood, mortise-and-tenon joinery")}</li>
                  <li>{t("Finish: plant-based hardwax oil")}</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="care">
              <AccordionTrigger className="text-sm">{t("Care instructions")}</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                {t(
                  "Dust with a dry cloth. Wipe spills immediately and re-oil the wood once a year. Keep out of direct sunlight and away from radiators to protect the grain.",
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* Details */}
        <div>
          <p className="eyebrow">
            {t(product.category)} · SKU {product.sku}
          </p>
          <h1 className="mt-4 font-display text-4xl leading-tight md:text-[2rem] lg:text-5xl">
            {t(product.name)}
          </h1>
          <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
            {displayReviews > 0 ? (
              <>
                <Stars rating={displayRating} size={14} />
                <span>
                  {displayRating} · {t("{count} reviews", { count: displayReviews })}
                </span>
              </>
            ) : (
              <span>{t("No reviews yet")}</span>
            )}
            <button
              type="button"
              onClick={() => setPromptOpen(true)}
              className="cursor-pointer border-b border-transparent text-[11px] uppercase tracking-[0.18em] transition-colors hover:border-foreground"
            >
              {t("Write a review")}
            </button>
          </div>

          <p className="mt-6 font-semibold tabular-nums text-3xl md:mt-6 md:text-2xl lg:mt-7 lg:text-3xl">
            {formatUZS(unitPrice)}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            {product.inStock
              ? t("In stock · ships in 3–5 days")
              : t("Pre-order · ships in 4 weeks")}
          </p>

          <p className="mt-7 max-w-lg text-sm leading-relaxed text-muted-foreground">
            {t(product.description)}
          </p>

          <div className="mt-9 space-y-7">
            <div>
              <p className="eyebrow">{t("Wood finish")}</p>
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
                    className={`border px-4 py-2.5 text-xs transition-colors lg:px-5 ${
                      finish.name === f.name
                        ? "border-foreground bg-primary text-primary-foreground"
                        : "border-border hover:border-foreground"
                    }`}
                  >
                    {t(f.name)}
                    {f.delta > 0 && <span className="ml-2 opacity-70">+{f.delta / 1000}k</span>}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="eyebrow">{t("Fabric / colour — {name}", { name: t(color.name) })}</p>
              <div className="mt-3 flex gap-3">
                {product.colors.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    aria-label={t(c.name)}
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
              {t("Add Home Assembly (+{price})", { price: formatUZS(ASSEMBLY_FEE) })}
            </label>

            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center border">
                <button
                  type="button"
                  className="px-4 py-3.5"
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  aria-label={t("Decrease quantity")}
                >
                  <Minus size={13} />
                </button>
                <span className="w-9 text-center text-sm">{qty}</span>
                <button
                  type="button"
                  className="px-4 py-3.5"
                  onClick={() => setQty(qty + 1)}
                  aria-label={t("Increase quantity")}
                >
                  <Plus size={13} />
                </button>
              </div>
              <button
                type="button"
                onClick={addToCart}
                className="flex-1 bg-primary px-8 py-4 text-[11px] uppercase tracking-[0.22em] text-primary-foreground transition-opacity hover:opacity-90"
              >
                {t("Add to cart")}
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
                {t("Buy now")}
              </button>
              <button
                type="button"
                onClick={() =>
                  toggle({ id: product.id, name: product.name, image: colorImg, price: unitPrice })
                }
                aria-label={has(product.id) ? t("Remove from wishlist") : t("Add to wishlist")}
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
              <Truck size={14} /> {t("Free delivery across Uzbekistan · 2-year warranty")}
            </p>

            <Accordion type="single" collapsible className="mt-10 border-t">
              <AccordionItem value="delivery">
                <AccordionTrigger className="text-sm">{t("Delivery information")}</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  {t(
                    "Free standard delivery in 3–5 working days within Tashkent, 5–9 days elsewhere in Uzbekistan. Express with in-home assembly available at checkout.",
                  )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <section className="mt-20 border-t pt-12 md:mt-24 md:pt-14 lg:mt-28">
        <Reveal className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="eyebrow">{t("Reviews")}</p>
            <h2 className="mt-3 font-display text-4xl">
              {displayReviews > 0
                ? t("{rating} out of 5", { rating: displayRating })
                : t("No reviews yet")}
              {displayReviews > 0 && (
                <span className="ml-3 align-middle text-sm text-muted-foreground">
                  {t("{count} verified buyers", { count: displayReviews })}
                </span>
              )}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setPromptOpen(true)}
            className="inline-flex cursor-pointer items-center gap-3 border border-foreground/25 px-6 py-3 text-[11px] uppercase tracking-[0.2em] transition-colors hover:border-foreground"
          >
            <PenLine size={14} />
            {myReview ? t("Edit your review") : t("Write a review")}
          </button>
        </Reveal>

        {reviewItems.length > 0 ? (
          <div className="mt-10 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {reviewItems.map((r, i) => (
              <Reveal key={r.id} delay={i * 0.07} className="border-t pt-6">
                <Stars rating={r.rating} />
                {r.comment && (
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{r.comment}</p>
                )}
                <p className="mt-4 text-[11px] uppercase tracking-[0.2em]">
                  {r.userName || t("Lumina customer")}
                </p>
              </Reveal>
            ))}
          </div>
        ) : (
          <div className="mt-10 border-t pt-8">
            <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
              {t(
                "No written reviews for this piece yet. If it is part of your home, tell other people how it feels.",
              )}
            </p>
            <button
              type="button"
              onClick={() => setPromptOpen(true)}
              className="mt-6 inline-flex cursor-pointer items-center gap-3 border border-foreground/25 px-6 py-3 text-[11px] uppercase tracking-[0.2em] transition-colors hover:border-foreground"
            >
              <PenLine size={14} />
              {t("Write the first review")}
            </button>
          </div>
        )}
      </section>

      <AuthRequiredDialog open={showAuthDialog} onOpenChange={setShowAuthDialog} />

      <ReviewPrompt
        open={promptOpen}
        onOpenChange={setPromptOpen}
        product={{ id: product.id, name: product.name, image: product.image }}
        initialRating={myReview?.rating ?? null}
        initialComment={myReview?.comment ?? ""}
        onSubmitted={handleSubmitted}
        onDismiss={markLater}
      />
    </div>
  );
}
