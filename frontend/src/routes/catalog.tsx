import { createFileRoute, useSearch, useNavigate } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { X } from "lucide-react";
import { categoryImages, formatUZS, products, type Category } from "@/data/products";
import { ProductCard } from "@/components/site/ProductCard";
import { Reveal } from "@/components/site/Reveal";
import { Stars } from "@/components/site/Stars";

export const Route = createFileRoute("/catalog")({
  validateSearch: (search: Record<string, unknown>) => ({
    category: search.category as string | undefined,
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
  const { category } = useSearch({ from: "/catalog" });
  const navigate = useNavigate();
  const [cats, setCats] = useState<string[]>(() =>
    category ? [category] : []
  );
  const [mats, setMats] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState(20000000);
  const [inStock, setInStock] = useState(false);
  const [preOrder, setPreOrder] = useState(false);
  const [sort, setSort] = useState<Sort>("popularity");
  const [quickView, setQuickView] = useState<string | null>(null);

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
    <div className="mx-auto max-w-[1400px] px-6 pb-24 pt-32 lg:px-12 lg:pt-40">
      <Reveal>
        <p className="eyebrow">The collection</p>
        <h1 className="mt-4 font-display text-5xl lg:text-6xl">Every piece, one place</h1>
        <p className="mt-4 max-w-lg text-sm text-muted-foreground">
          {filtered.length} pieces, hand-finished in our Tashkent workshop.
        </p>
      </Reveal>

      <div className="mt-14 grid gap-12 lg:grid-cols-[260px_1fr]">
        {/* Sidebar */}
        <aside className="space-y-9 lg:sticky lg:top-28 lg:self-start">
          <Filter title="Category">
            {allCategories.map((c) => (
              <Check
                key={c}
                label={c}
                checked={cats.includes(c)}
                onChange={() => toggleCat(c)}
              />
            ))}
          </Filter>

          <Filter title="Price">
            <input
              type="range"
              min={3000000}
              max={20000000}
              step={100000}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-[var(--terracotta)]"
              aria-label="Maximum price"
            />
            <p className="text-xs text-muted-foreground">Up to {formatUZS(maxPrice)}</p>
          </Filter>

          <Filter title="Material">
            {allMaterials.map((m) => (
              <Check
                key={m}
                label={m}
                checked={mats.includes(m)}
                onChange={() => toggle(mats, setMats, m)}
              />
            ))}
          </Filter>

          <Filter title="Availability">
            <Check label="In stock" checked={inStock} onChange={() => setInStock(!inStock)} />
            <Check label="Pre-order" checked={preOrder} onChange={() => setPreOrder(!preOrder)} />
          </Filter>
        </aside>

        {/* Grid */}
        <div>
          <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
            <span className="text-xs text-muted-foreground">{filtered.length} results</span>
          </div>

          <div className="mt-10 grid gap-x-8 gap-y-14 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((p, i) => (
              <Reveal key={p.id} delay={(i % 3) * 0.06}>
                <div className="relative">
                  <ProductCard product={p} />
                  <button
                    type="button"
                    onClick={() => setQuickView(p.id)}
                    className="absolute left-1/2 top-[42%] -translate-x-1/2 bg-background/90 px-5 py-2.5 text-[10px] uppercase tracking-[0.2em] opacity-0 backdrop-blur transition-opacity duration-300 hover:bg-background focus:opacity-100 group-hover:opacity-100"
                  >
                    Quick view
                  </button>
                </div>
              </Reveal>
            ))}
          </div>

          {filtered.length === 0 && (
            <p className="py-20 text-center text-sm text-muted-foreground">
              No pieces match these filters yet.
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
              aria-label="Close quick view"
              onClick={() => setQuickView(null)}
              className="absolute right-4 top-4"
            >
              <X size={18} />
            </button>
            <img
              src={quick.image}
              alt={quick.name}
              loading="lazy"
              width={1000}
              height={1000}
              className="aspect-square w-full bg-cream object-cover"
            />
            <div className="flex flex-col">
              <p className="eyebrow">{quick.category}</p>
              <h2 className="mt-3 font-display text-3xl">{quick.name}</h2>
              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <Stars rating={quick.rating} />
                {quick.rating} · {quick.reviews} reviews
              </div>
              <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
                {quick.description}
              </p>
              <p className="mt-6 font-semibold tabular-nums text-2xl">{formatUZS(quick.price)}</p>
              <a
                href={`/product/${quick.id}`}
                className="mt-auto bg-primary py-3.5 text-center text-[11px] uppercase tracking-[0.22em] text-primary-foreground"
              >
                View full details
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Filter({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3 border-b pb-7">
      <p className="eyebrow">{title}</p>
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
  return (
    <label className="flex cursor-pointer items-center gap-3 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="size-3.5 accent-[var(--terracotta)]"
      />
      {label}
    </label>
  );
}
