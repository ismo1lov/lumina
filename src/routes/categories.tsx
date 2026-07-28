import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { categoryImages, products, type Category } from "@/data/products";
import { Reveal } from "@/components/site/Reveal";

export const Route = createFileRoute("/categories")({
  head: () => ({
    meta: [
      { title: "Furniture Categories — Living, Bedroom, Dining, Office" },
      {
        name: "description",
        content:
          "Explore Lumina Home by room: living room seating, bedroom beds and armchairs, dining tables and sideboards, and home office desks.",
      },
      { property: "og:title", content: "Shop Furniture by Room — Lumina Home" },
      {
        property: "og:description",
        content: "Living room, bedroom, dining room and home office collections.",
      },
    ],
  }),
  component: Categories,
});

const blurbs: Record<Category, string> = {
  "Living Room": "Low seating, soft bouclé and warm walnut for slow evenings.",
  Bedroom: "Quiet platform beds and linen armchairs built for deep rest.",
  "Dining Room": "Oval oak tables and slatted storage made for long dinners.",
  "Home Office": "Focused desks and saddle-leather seating for daylight hours.",
};

function Categories() {
  const cats = Object.keys(categoryImages) as Category[];

  return (
    <div className="mx-auto max-w-[1400px] px-6 pb-24 pt-32 lg:px-12 lg:pt-40">
      <Reveal>
        <p className="eyebrow">Categories</p>
        <h1 className="mt-4 max-w-2xl font-display text-5xl lg:text-6xl">
          Four rooms, one quiet language
        </h1>
      </Reveal>

      <div className="mt-16 space-y-6">
        {cats.map((cat, i) => (
          <Reveal key={cat} delay={i * 0.06}>
            <Link
              to="/catalog"
              className="group grid items-center gap-8 overflow-hidden bg-cream md:grid-cols-[1fr_1.1fr]"
            >
              <div className="overflow-hidden">
                <img
                  src={categoryImages[cat]}
                  alt={`${cat} furniture by Lumina Home`}
                  loading="lazy"
                  width={900}
                  height={1100}
                  className="h-full max-h-[380px] w-full object-cover transition-transform duration-[1100ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
                />
              </div>
              <div className="px-6 py-8 md:px-10">
                <p className="eyebrow">
                  {products.filter((p) => p.category === cat).length} pieces
                </p>
                <h2 className="mt-3 font-display text-4xl">{cat}</h2>
                <p className="mt-4 max-w-md text-sm text-muted-foreground">{blurbs[cat]}</p>
                <span className="mt-7 inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.2em]">
                  Shop {cat}
                  <ArrowRight
                    size={14}
                    className="transition-transform duration-300 group-hover:translate-x-1"
                  />
                </span>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
