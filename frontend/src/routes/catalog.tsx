import { createFileRoute, useSearch, useNavigate } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { X } from "lucide-react";
import { categoryImages, formatUZS, products, type Category } from "@/data/products";
import { ProductCard } from "@/components/site/ProductCard";
import { Reveal } from "@/components/site/Reveal";
import { Stars } from "@/components/site/Stars";
import { resolveAsset } from "@/lib/assets";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/catalog")({
  validateSearch: (search: Record<string, unknown>): { category?: string } => ({
    category: typeof search.category === "string" ? search.category : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Shop All Furniture — Lumina Home Catalog" },
      {
        name: "description",
        content:
          "Filter Lumina Home's hardwood collection by room, price, material. Walnut, oak, velvet and leather pieces in stock or made to order.",
      },
      { property: "og:title", content: "Shop All Furniture — Lumina Home" },
      {
        property: "og:description",
        content: "Browse hand-crafted sofas, beds, tables and desks by Lumina Home.",
      },
    ],
  }),
  component: Catalog,
});

const allCategories = Object.keys(categoryImages) as Category[];
const allMaterials = ["Walnut", "Oak", "Velvet", "Leather"];

type Sort = "newest" | "price-asc" | "popularity";

function Catalog() {
  const { t } = useI18n();
  const { category } = useSearch({ from: "/catalog" });
  const navigate = useNavigate();
  const [cats, setCats] = useState<string[]>(() =>
    category ? [category] : []
  );
  const [mats, setMats] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState(10000000);
  const [inStock, setInStock] = useState(false);
  const [preOrder, setPreOrder] = useState(false);
  const [sort, setSort] = useState<Sort>("popularity");
  const [quickView, setQuickView] = useState<string | null>(null);
  // Real ratings of products that already have customer reviews.
  const [ratingMap, setRatingMap] = useState<Record<string, { average: number; count: number }>>(
    {},
  );

  useEffect(() => {
    let active = true;
    api
      .get<{ productId: string; average: number; count: number }[]>("/reviews/summary/all")
      .then((rows) => {
        if (!active) return;
        setRatingMap(
          Object.fromEntries(
            rows.map((r) => [r.productId, { average: r.average, count: r.count }]),
          ),
        );
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (category && !cats.includes(category)) {
      setCats([category]);
    }
  }, [category]);

  const toggle = (list: string[], set: (v: string[]) => void, value: string) =>
    set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

  const toggleCat = (value: string) => {
    const next = cats.includes(value)
      ? cats.filter((v) => v !== value)
      : [...cats, value];
    setCats(next);
    navigate({ to: "/catalog", search: { category: next.length ? next[0] : undefined }, replace: true });
  };

  const filtered = useMemo(() => {
    const out = products.filter((p) => {
      if (cats.length && !cats.includes(p.category)) return false;
      if (mats.length && !p.materials.some((m) => mats.includes(m))) return false;
      if (p.price > maxPrice) return false;
      if (inStock && !p.inStock) return false;
      if (preOrder && p.inStock) return false;
      return true;
    });
    return out.sort((a, b) => {
      if (sort === "price-asc") return a.price - b.price;
      if (sort === "newest") return b.createdAt.localeCompare(a.createdAt);
      return b.popularity - a.popularity;
    });
  }, [cats, mats, maxPrice, inStock, preOrder, sort]);

  const quick = products.find((p) => p.id === quickView);

  return (
    <div className="mx-auto max-w-[1400px] px-6 pb-24 pt-32 md:px-8 md:pt-36 lg:px-12 lg:pt-40">
      <Reveal>
        <p className="eyebrow">{t("The collection")}</p>
        <h1 className="mt-4 font-display text-5xl md:text-[3.4rem] lg:text-6xl">
          {t("Every piece, one place")}
        </h1>
        <p className="mt-4 max-w-lg text-sm text-muted-foreground">
          {t("{count} pieces, hand-finished in our Tashkent workshop.", {
            count: filtered.length,
          })}
        </p>
      </Reveal>

      <div className="mt-12 grid gap-10 md:mt-14 lg:grid-cols-[260px_1fr] lg:gap-12">
        {/* Sidebar */}
        <aside className="space-y-8 md:grid md:grid-cols-2 md:gap-x-12 md:gap-y-2 md:space-y-0 lg:sticky lg:top-28 lg:block lg:space-y-9 lg:self-start">
          <Filter title="Category" className="md:order-1">
            {allCategories.map((c) => (
              <Check
                key={c}
                label={c}
                checked={cats.includes(c)}
                onChange={() => toggleCat(c)}
              />
            ))}
          </Filter>

          <Filter title="Price" className="md:order-3">
            <input
              type="range"
              min={2000000}
              max={10000000}
              step={100000}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-[var(--terracotta)]"
              aria-label={t("Maximum price")}
            />
            <p className="text-xs text-muted-foreground">
              {t("Up to {price}", { price: formatUZS(maxPrice) })}
            </p>
          </Filter>

          <Filter title="Material" className="md:order-2">
            {allMaterials.map((m) => (
              <Check
                key={m}
                label={m}
                checked={mats.includes(m)}
                onChange={() => toggle(mats, setMats, m)}
              />
            ))}
          </Filter>

          <Filter title="Availability" className="md:order-4">
            <Check label="In stock" checked={inStock} onChange={() => setInStock(!inStock)} />
            <Check label="Pre-order" checked={preOrder} onChange={() => setPreOrder(!preOrder)} />
          </Filter>
        </aside>

        {/* Grid */}
        <div>
          <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
            <span className="text-xs text-muted-foreground">
              {t("{count} results", { count: filtered.length })}
            </span>
          </div>

          <div className="mt-8 grid gap-x-7 gap-y-12 sm:grid-cols-2 md:mt-10 md:gap-x-6 md:gap-y-12 lg:gap-x-8 lg:gap-y-14 xl:grid-cols-3">
            {filtered.map((p, i) => (
              <Reveal key={p.id} delay={(i % 3) * 0.06}>
                <div className="relative">
                  <ProductCard
                    product={p}
                    rating={ratingMap[p.id]?.average}
                    reviewCount={ratingMap[p.id]?.count}
                  />
                  <button
                    type="button"
                    onClick={() => setQuickView(p.id)}
                    className="absolute left-1/2 top-[42%] hidden -translate-x-1/2 bg-background/90 px-5 py-2.5 text-[10px] uppercase tracking-[0.2em] opacity-0 backdrop-blur transition-opacity duration-300 hover:bg-background focus:opacity-100 group-hover:opacity-100 lg:block"
                  >
                    {t("Quick view")}
                  </button>
                </div>
              </Reveal>
            ))}
          </div>

          {filtered.length === 0 && (
            <p className="py-20 text-center text-sm text-muted-foreground">
              {t("No pieces match these filters yet.")}
            </p>
          )}
        </div>
      </div>

      {/* Quick view */}
      {quick && (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-foreground/35 px-4 backdrop-blur-sm">
          <div className="relative grid w-full max-w-3xl gap-8 bg-background p-6 sm:grid-cols-2 sm:p-8">
            <button
              type="button"
              aria-label={t("Close quick view")}
              onClick={() => setQuickView(null)}
              className="absolute right-4 top-4"
            >
              <X size={18} />
            </button>
            <img
              src={resolveAsset(quick.image)}
              alt={quick.name}
              loading="lazy"
              width={1000}
              height={1000}
              className="aspect-square w-full bg-cream object-cover"
            />
            <div className="flex flex-col">
              <p className="eyebrow">{t(quick.category)}</p>
              <h2 className="mt-3 font-display text-3xl">{t(quick.name)}</h2>
              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <Stars rating={quick.rating} />
                {quick.rating} · {t("{count} reviews", { count: quick.reviews })}
              </div>
              <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
                {t(quick.description)}
              </p>
              <p className="mt-6 font-semibold tabular-nums text-2xl">{formatUZS(quick.price)}</p>
              <a
                href={`/product/${quick.id}`}
                className="mt-auto bg-primary py-3.5 text-center text-[11px] uppercase tracking-[0.22em] text-primary-foreground"
              >
                {t("View full details")}
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Filter({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  const { t } = useI18n();
  return (
    <div className={`space-y-3 border-b pb-7 ${className}`}>
      <p className="eyebrow">{t(title)}</p>
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}

function Check({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  const { t } = useI18n();
  return (
    <label className="flex cursor-pointer items-center gap-3 py-0.5 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="size-4 accent-[var(--terracotta)] md:size-[18px]"
      />
      {t(label)}
    </label>
  );
}
