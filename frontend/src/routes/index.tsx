import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import {
  ArrowDown,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Truck,
  ShieldCheck,
  TreePine,
  Ruler,
} from "lucide-react";

import heroChair from "@/assets/hero-chair.jpg";
import { categoryImages, products, type Category } from "@/data/products";
import { ProductCard } from "@/components/site/ProductCard";
import { Reveal } from "@/components/site/Reveal";
import { AmbientGlitter } from "@/components/site/AmbientGlitter";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lumina Home" },
      {
        name: "description",
        content:
          "Hand-crafted walnut and oak furniture from Lumina Home. Sofas, beds, dining tables and desks made in small batches, delivered and assembled.",
      },
      { property: "og:title", content: "Lumina Home" },
      {
        property: "og:description",
        content: "Warm, minimalist hardwood furniture for modern sanctuaries.",
      },
    ],
  }),
  component: Home,
});

const categories: Category[] = ["Living Room", "Bedroom", "Dining Room", "Home Office"];

const values = [
  { icon: Truck, title: "Free Delivery", copy: "On every order across Uzbekistan." },
  { icon: ShieldCheck, title: "2-Year Warranty", copy: "Joinery and finish fully covered." },
  { icon: TreePine, title: "Sustainable Wood", copy: "FSC-certified walnut and oak." },
  { icon: Ruler, title: "Custom Dimensions", copy: "Made to your room, assembled at home." },
];

function Home() {
  const bestSellers = [...products].sort((a, b) => b.popularity - a.popularity).slice(0, 6);

  return (
    <div>
      {/* Hero */}
      <section className="relative flex h-screen max-h-screen items-center overflow-hidden bg-cream pt-20">
        <AmbientGlitter />
        <div className="mx-auto grid w-full max-w-[1400px] items-center gap-12 px-6 lg:grid-cols-[1fr_1.05fr] lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.h1
              className="mt-6 font-display text-[2.75rem] leading-[1.05] sm:text-6xl lg:text-[4.2rem]"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            >
              Crafting Comfort for Your Modern Sanctuary
            </motion.h1>
            <motion.p
              className="mt-7 max-w-md text-[15px] leading-relaxed text-muted-foreground"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.2 }}
            >
              Cozy, hand-finished furniture shaped from solid walnut and oak. Each piece is oiled by
              hand, built to soften with time, and delivered ready to live in.
            </motion.p>
            <motion.div
              className="mt-10 flex flex-wrap items-center gap-4"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.3 }}
            >
              <Link
                to="/catalog"
                className="group inline-flex items-center gap-3 bg-primary px-8 py-4 text-[11px] uppercase tracking-[0.22em] text-primary-foreground transition-opacity hover:opacity-90"
              >
                Explore Collection
                <ArrowRight
                  size={14}
                  className="transition-transform duration-300 group-hover:translate-x-1"
                />
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center gap-3 border border-foreground/25 px-8 py-4 text-[11px] uppercase tracking-[0.22em] transition-colors hover:border-foreground"
              >
                Contact Us
              </Link>
            </motion.div>
          </motion.div>

          <motion.div
            className="relative mx-auto max-w-[420px] float-slow"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="absolute inset-x-6 bottom-4 top-12 rounded-full bg-sand/60 blur-3xl" />
            <img
              src={heroChair}
              alt="Nordic walnut lounge chair with cream bouclé cushions"
              width={600}
              height={700}
              className="relative w-full rounded-2xl object-contain"
            />
            <div className="absolute bottom-4 left-4 hidden rounded-2xl bg-background/90 px-5 py-4 backdrop-blur sm:block">
              <p className="eyebrow">Featured</p>
              <p className="mt-1 font-display text-base">Nordic Walnut Chair</p>
              <Link
                to="/product/$id"
                params={{ id: "nordic-walnut-lounge-chair" }}
                className="mt-1 inline-block text-[11px] uppercase tracking-[0.2em] text-accent link-underline"
              >
                View piece
              </Link>
            </div>
          </motion.div>
        </div>

        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        >
          <span className="flex flex-col items-center gap-2 text-muted-foreground">
            <span className="text-[10px] uppercase tracking-[0.22em]">Scroll</span>
            <ArrowDown size={14} />
          </span>
        </motion.div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-[1400px] px-6 py-24 lg:px-12 lg:py-32">
        <Reveal className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="eyebrow">Browse by room</p>
            <h2 className="mt-4 max-w-lg font-display text-4xl lg:text-5xl">
              Rooms that breathe, pieces that stay
            </h2>
          </div>
          <Link
            to="/categories"
            className="text-[11px] uppercase tracking-[0.2em] link-underline"
          >
            All categories
          </Link>
        </Reveal>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((cat, i) => (
            <Reveal key={cat} delay={i * 0.08}>
              <Link
                to="/catalog"
                className="group block overflow-hidden bg-cream"
                aria-label={`Shop ${cat}`}
              >
                <div className="overflow-hidden">
                  <img
                    src={categoryImages[cat]}
                    alt={`${cat} furniture`}
                    loading="lazy"
                    width={900}
                    height={1100}
                    className="aspect-[3/4] w-full object-cover transition-transform duration-[1100ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-110"
                  />
                </div>
                <div className="flex items-center justify-between px-5 py-5">
                  <span className="font-display text-xl">{cat}</span>
                  <ArrowRight
                    size={15}
                    className="text-muted-foreground transition-transform duration-300 group-hover:translate-x-1"
                  />
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Best sellers */}
      <section className="bg-cream py-24 lg:py-32">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
          <Reveal className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="eyebrow">Best sellers</p>
              <h2 className="mt-4 font-display text-4xl lg:text-5xl">Loved in many homes</h2>
            </div>
            <Link to="/catalog" className="text-[11px] uppercase tracking-[0.2em] link-underline">
              Shop all
            </Link>
          </Reveal>

          <div className="relative mt-14">
            <button
              type="button"
              aria-label="Scroll left"
              onClick={() => {
                const el = document.getElementById("bestsellers-scroll")!;
                const start = el.scrollLeft;
                const target = start - 360;
                const duration = 500;
                const startTime = performance.now();
                const ease = (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t));
                function raf(now: number) {
                  const p = Math.min((now - startTime) / duration, 1);
                  el.scrollLeft = start + (target - start) * ease(p);
                  if (p < 1) requestAnimationFrame(raf);
                }
                requestAnimationFrame(raf);
              }}
              className="absolute -left-4 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border bg-background/90 p-2.5 shadow-sm backdrop-blur transition-colors hover:bg-background lg:block"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              aria-label="Scroll right"
              onClick={() => {
                const el = document.getElementById("bestsellers-scroll")!;
                const start = el.scrollLeft;
                const target = start + 360;
                const duration = 500;
                const startTime = performance.now();
                const ease = (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t));
                function raf(now: number) {
                  const p = Math.min((now - startTime) / duration, 1);
                  el.scrollLeft = start + (target - start) * ease(p);
                  if (p < 1) requestAnimationFrame(raf);
                }
                requestAnimationFrame(raf);
              }}
              className="absolute -right-4 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border bg-background/90 p-2.5 shadow-sm backdrop-blur transition-colors hover:bg-background lg:block"
            >
              <ChevronRight size={18} />
            </button>
            <div
              id="bestsellers-scroll"
              className="flex gap-8 overflow-x-auto pb-6 scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {bestSellers.map((p, i) => (
                <Reveal
                  key={p.id}
                  delay={i * 0.05}
                  className="w-[78vw] shrink-0 sm:w-[340px]"
                >
                  <ProductCard product={p} />
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Value props */}
      <section className="bg-cream py-24 lg:py-32">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
          <Reveal className="text-center">
            <p className="eyebrow">Why Lumina Home</p>
            <h2 className="mt-4 font-display text-4xl lg:text-5xl">Crafted with care, delivered with heart</h2>
            <p className="mx-auto mt-4 max-w-lg text-sm text-muted-foreground">
              Every piece we make is built to last — from materials that matter, by hands that care,
              for homes that deserve the best.
            </p>
          </Reveal>
          <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v, i) => (
              <Reveal key={v.title} delay={i * 0.07}>
                <div className="group flex h-full flex-col gap-5 rounded-[1.75rem] border border-border/80 bg-[#F7F4EF] p-7 transition-all duration-300 hover:border-accent/30 hover:bg-white">
                  <span className="grid size-12 place-items-center rounded-xl border border-border/60 bg-white">
                    <v.icon size={20} strokeWidth={1.3} className="text-accent" />
                  </span>
                  <div>
                    <p className="font-display text-lg text-foreground">{v.title}</p>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{v.copy}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
